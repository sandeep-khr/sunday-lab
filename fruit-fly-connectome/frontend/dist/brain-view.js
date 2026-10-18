// Schematic positions, actual sampled neuron identities, edges and recorded rates.
// Geometry is a diagram: it is not a reconstruction of soma coordinates.
import {RNG} from './engine.js';
export class BrainView {
  constructor(canvas){
    this.canvas=canvas;this.gl=canvas.getContext('webgl',{alpha:true,antialias:true});this.obs=null;this.data=null;this.rotation=0;this.drag=0;this.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    const r=new RNG(42);this.points=Array.from({length:256},(_,i)=>{const u=r.random()*Math.PI*2,v=Math.acos(2*r.random()-1),radius=.4+.6*Math.cbrt(r.random()),side=i%2?1:-1;return [side*(.35+radius*.5*Math.sin(v)*Math.cos(u)),radius*.6*Math.sin(v)*Math.sin(u),radius*.45*Math.cos(v)];});
    if(this.gl)this.init();else this.ctx=canvas.getContext('2d');
    canvas.addEventListener('pointerdown',e=>{this.drag=e.clientX;canvas.setPointerCapture(e.pointerId);});
    canvas.addEventListener('pointermove',e=>{if(e.buttons){this.rotation+=(e.clientX-this.drag)*.01;this.drag=e.clientX;}});
    this.frame=requestAnimationFrame(t=>this.draw(t));
  }
  init(){
    const gl=this.gl;const shader=(type,source)=>{const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;};
    this.program=gl.createProgram();gl.attachShader(this.program,shader(gl.VERTEX_SHADER,'attribute vec2 p; attribute vec4 c; attribute float sz; varying vec4 color; void main(){gl_Position=vec4(p,0.,1.);gl_PointSize=sz;color=c;}'));
    gl.attachShader(this.program,shader(gl.FRAGMENT_SHADER,'precision mediump float; varying vec4 color; uniform float point; void main(){float a=1.; if(point>0.5){float d=length(gl_PointCoord-.5)*2.;a=exp(-d*d*4.);if(d>1.)discard;}gl_FragColor=vec4(color.rgb,color.a*a);}'));
    gl.linkProgram(this.program);if(!gl.getProgramParameter(this.program,gl.LINK_STATUS))throw Error('WebGL link failed');
    gl.useProgram(this.program);this.buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,this.buffer);
    for(const [name,n,offset] of [['p',2,0],['c',4,8],['sz',1,24]]){const a=gl.getAttribLocation(this.program,name);gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,n,gl.FLOAT,false,28,offset);}
    this.pointUniform=gl.getUniformLocation(this.program,'point');gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE);
  }
  set(data,obs){if(data!==this.data)this.edges=[...(data?.display_edges||[])].sort((a,b)=>Math.abs(b[2])-Math.abs(a[2])).slice(0,500);this.data=data;this.obs=obs;}
  draw(time){
    if(document.hidden){this.frame=requestAnimationFrame(t=>this.draw(t));return;}
    const c=this.canvas,dpr=Math.min(devicePixelRatio,2),w=c.clientWidth,h=c.clientHeight;
    if(c.width!==Math.round(w*dpr)||c.height!==Math.round(h*dpr)){c.width=Math.round(w*dpr);c.height=Math.round(h*dpr);}
    const angle=this.rotation+(this.reduced?0:Math.sin(time*.00012)*.28),ca=Math.cos(angle),sa=Math.sin(angle),aspect=w/h;
    const coords=this.points.map(([x,y,z])=>{const xx=x*ca-z*sa,zz=x*sa+z*ca;return [xx*(aspect<2?1.5/aspect:.67)-.12,y*1.25,zz];});
    const rates=this.obs?.display_rates_hz||[],bright=coords.map((_,i)=>Math.min((rates[i]||0)/100,1));
    const lines=[];for(const [i,j,weight] of this.edges||[]){if(i===j)continue;const b=Math.min(bright[i],bright[j]);const a=.014+b*.03;const color=weight<0?[.42,.62,.82]:[.28,.8,.86];for(const k of [i,j])lines.push(...coords[k].slice(0,2),...color,a,1);}
    const points=[];coords.forEach((p,i)=>{const b=bright[i],pulse=1;points.push(p[0],p[1],.29+b*.3,.67+b*.22,.77+b*.18,(.35+b*.65)*pulse,(4+b*9+(p[2]+.5)*2)*dpr);});
    if(this.gl){const gl=this.gl;gl.viewport(0,0,c.width,c.height);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.bindBuffer(gl.ARRAY_BUFFER,this.buffer);gl.uniform1f(this.pointUniform,0);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(lines),gl.DYNAMIC_DRAW);gl.drawArrays(gl.LINES,0,lines.length/7);gl.uniform1f(this.pointUniform,1);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(points),gl.DYNAMIC_DRAW);gl.drawArrays(gl.POINTS,0,256);}
    else if(this.ctx){const ctx=this.ctx;ctx.clearRect(0,0,c.width,c.height);for(let i=0;i<points.length;i+=7){ctx.fillStyle=`rgba(100,215,233,${points[i+5]})`;ctx.beginPath();ctx.arc((points[i]+1)*c.width/2,(1-points[i+1])*c.height/2,points[i+6]/4,0,7);ctx.fill();}}
    this.frame=requestAnimationFrame(t=>this.draw(t));
  }
}
