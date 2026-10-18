import * as T from './vendor/three.module.js';

// Anatomical geometry from Flybody. Movement is authored kinematics, not physics.
export class FlyArena {
  constructor(canvas, status) {
    this.canvas=canvas;this.status=status;this.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.scene=new T.Scene();this.scene.background=new T.Color('#101b22');
    this.scene.fog=new T.Fog('#101b22',21,42);
    this.camera=new T.PerspectiveCamera(39,1,.1,100);this.view='arena';
    try {this.renderer=new T.WebGLRenderer({canvas,antialias:true});}
    catch {status.textContent='3D needs WebGL. The experiment controls still work.';return;}
    this.renderer.setPixelRatio(Math.min(devicePixelRatio,2));this.renderer.shadowMap.enabled=true;
    this.renderer.shadowMap.type=T.PCFSoftShadowMap;this.renderer.toneMapping=T.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure=1.15;
    this.scene.add(new T.HemisphereLight(0xc9e8ef,0x282420,1.5));
    const light=new T.DirectionalLight(0xffedd1,2.5);light.position.set(-4,12,7);light.castShadow=true;
    light.shadow.mapSize.set(2048,2048);Object.assign(light.shadow.camera,{left:-12,right:12,top:12,bottom:-12});
    light.shadow.bias=-.00015;light.shadow.normalBias=.025;this.scene.add(light);
    const rim=new T.DirectionalLight(0x73cfed,1.2);rim.position.set(5,4,-6);this.scene.add(rim);
    const floor=new T.Mesh(new T.PlaneGeometry(100,100),new T.MeshStandardMaterial({color:0x18242b,roughness:.94}));
    floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;this.scene.add(floor);
    const grid=new T.GridHelper(80,80,0x50616a,0x33464e);grid.position.y=.006;grid.material.transparent=true;grid.material.opacity=.27;this.scene.add(grid);
    this.pads=[];
    for(const side of [-1,1]){
      const group=new T.Group();group.position.set(side*4,.035,-2.2);
      const pad=new T.Mesh(new T.CylinderGeometry(1.5,1.5,.045,64),new T.MeshStandardMaterial({color:0x193d42,roughness:.75}));
      pad.receiveShadow=true;group.add(pad);
      const ring=new T.Mesh(new T.TorusGeometry(1.5,.022,8,80),new T.MeshBasicMaterial({color:0x66d7e8}));ring.rotation.x=Math.PI/2;group.add(ring);
      const beacon=new T.Mesh(new T.IcosahedronGeometry(.22,0),new T.MeshStandardMaterial({color:0x66d7e8,emissive:0x66d7e8,emissiveIntensity:.5,metalness:.35,roughness:.3}));beacon.position.y=.35;group.add(beacon);
      this.scene.add(group);this.pads.push({group,ring,pad,beacon});
    }
    this.fly=new T.Group();this.scene.add(this.fly);this.anatomy=new T.Group();
    this.anatomy.rotation.x=-Math.PI/2;this.anatomy.scale.setScalar(12);this.fly.add(this.anatomy);
    this.reset();this.ready=this.load().catch(e=>{status.textContent='Fly anatomy could not load. '+e.message;});
    this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(canvas);this.resize();
    this.frame=requestAnimationFrame(t=>this.draw(t));
  }
  async load(){
    const [info,blob]=await Promise.all([fetch('assets/fly.json').then(r=>{if(!r.ok)throw Error('mesh metadata missing');return r.json();}),fetch('assets/fly.bin').then(r=>{if(!r.ok)throw Error('mesh missing');return r.arrayBuffer();})]);
    this.bones=info.nodes.map(n=>{const g=new T.Group();g.name=n.name;g.position.fromArray(n.position);g.quaternion.fromArray(n.quaternion);g.userData.rest=g.quaternion.clone();return g;});
    info.nodes.forEach((n,i)=>{
      const g=this.bones[i];(n.parent>=0?this.bones[n.parent]:this.anatomy).add(g);
      n.meshes.forEach(m=>{
        const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(new Float32Array(blob,m.position[0],m.position[1]),3));
        geo.setIndex(new T.BufferAttribute(new Uint32Array(blob,m.index[0],m.index[1]),1));geo.computeVertexNormals();
        const [r,gg,b,a]=m.rgba;const material=new T.MeshStandardMaterial({color:new T.Color().setRGB(r,gg,b,T.SRGBColorSpace),roughness:a<1?.2:.55,metalness:.05,transparent:a<1,opacity:a<1?.45:1,side:T.DoubleSide,depthWrite:a===1});
        const mesh=new T.Mesh(geo,material);mesh.castShadow=a===1;mesh.receiveShadow=true;g.add(mesh);
      });
    });
    this.fly.position.y=0;this.fly.updateMatrixWorld(true);const box=new T.Box3().setFromObject(this.anatomy);
    this.ground=-box.min.y+.015;this.fly.position.y=this.ground;
    this.legs=this.bones.filter(g=>g.name.startsWith('coxa_')||g.name.startsWith('femur_'));
    this.head=this.bones.find(g=>g.name==='head');this.status.textContent='Flybody anatomy · authored walking · drag to orbit';
    let last=null;
    this.canvas.addEventListener('pointerdown',e=>{last={x:e.clientX,y:e.clientY};this.canvas.setPointerCapture(e.pointerId);});
    this.canvas.addEventListener('pointermove',e=>{if(!last||!e.buttons)return;this.orbit=Math.max(-.9,Math.min(.9,(this.orbit||0)+(e.clientX-last.x)*.005));this.elevation=Math.max(4,Math.min(15,(this.elevation||10)+(e.clientY-last.y)*.04));last={x:e.clientX,y:e.clientY};});
    this.canvas.addEventListener('pointerup',()=>last=null);
  }
  resize(){const w=this.canvas.clientWidth,h=this.canvas.clientHeight;this.renderer.setSize(w,h,false);this.camera.aspect=w/h;this.camera.updateProjectionMatrix();}
  reset(){this.motion=null;if(this.fly){this.fly.position.set(0,this.ground||1.2,2);this.fly.rotation.y=Math.PI/2;}this.setMapping(true);}
  setMapping(pehLeft){this.pads?.forEach((p,i)=>{const color=(i===0)===pehLeft?0x66d7e8:0xdefb62;p.ring.material.color.setHex(color);p.beacon.material.color.setHex(color);p.beacon.material.emissive.setHex(color);p.pad.material.color.setHex((i===0)===pehLeft?0x24474e:0x414632);});}
  play(row,duration){this.setMapping(row.peh_left);this.fly.position.set(0,this.ground||1.2,2);this.motion={row,start:performance.now(),duration};}
  setView(view){this.view=view;this.orbit=0;this.elevation=10;}
  draw(t){
    if(!document.hidden){
      let walking=false;
      if(this.motion){const {row,start,duration}=this.motion,p=Math.min(1,(t-start)/(duration*.42)),ease=p*p*(3-2*p),x=row.side==='LEFT'?-4:4;
        this.fly.position.x=x*ease;this.fly.position.z=2-4.2*ease;
        this.fly.rotation.y=-Math.atan2(-4.2,x);walking=p<1;
        this.fly.position.y=(this.ground||1.2)+(walking&&!this.reduced?Math.sin(t*.03)*.016:0);
      }
      for(const bone of this.legs||[]){bone.quaternion.copy(bone.userData.rest);if(walking&&!this.reduced){const phase=(bone.name.includes('T2')?Math.PI:0)+(bone.name.includes('right')?Math.PI:0);bone.rotateY(Math.sin(t*.025+phase)*(bone.name.startsWith('coxa')?.19:.12));}}
      if(this.head&&!this.reduced){this.head.quaternion.copy(this.head.userData.rest);this.head.rotateZ(Math.sin(t*.002)*.025);}
      if(this.view==='close'){const p=this.fly.position;const a=this.fly.rotation.y;this.camera.position.set(p.x+Math.cos(a)*5+Math.sin(a)*2.5,p.y+3.1,p.z-Math.sin(a)*5+Math.cos(a)*2.5);this.camera.lookAt(p.x,p.y-.1,p.z);}
      else{const orbit=this.orbit||0,dist=this.camera.aspect<1?20:15;this.camera.position.set(Math.sin(orbit)*dist,this.elevation||10,Math.cos(orbit)*dist);this.camera.lookAt(0,0,-.1);}
      this.renderer.render(this.scene,this.camera);
    }
    this.frame=requestAnimationFrame(time=>this.draw(time));
  }
}
