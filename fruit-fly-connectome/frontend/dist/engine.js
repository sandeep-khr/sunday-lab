// External learning only. Neural responses are measured in Python, then cached.
export const defaults = {immediate:10, delayed:100, delay:5, gamma:.95, follower_reward:0, reputation_reward:0, difficulty:'easy', reversal:false, trace:true};
export const names = {connectome:'Connectome + readout', random_network:'Random network + readout', mlp:'MLP · raw cue', fixed:'Connectome · frozen', random:'Random choice', disconnected:'Disconnected graph'};
export class RNG {
  constructor(seed){ this.state=seed>>>0; }
  random(){this.state=(this.state+0x6D2B79F5)>>>0;let t=this.state;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;}
}
const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
export class Readout {
  constructor(kind='connectome',seed=0){
    if(!names[kind]) throw Error('Unknown controller');
    this.kind=kind;this.w=Array(32).fill(0);const r=new RNG(seed+101);
    this.a=Array.from({length:8},()=>Array.from({length:2},()=>(r.random()-.5)*.6));
    this.b=Array(8).fill(0);this.v=Array(8).fill(0);this.c=0;
  }
  value(x,cue){
    if(this.kind==='mlp')return dot(this.v,this.a.map((row,j)=>Math.tanh(row[cue]+this.b[j])))+this.c;
    if(['random','disconnected'].includes(this.kind))return 0;
    return dot(this.w,x);
  }
  learn(x,cue,target){
    if(['random','fixed','disconnected'].includes(this.kind))return;
    const error=target-this.value(x,cue);
    if(this.kind==='mlp'){
      const h=this.a.map((row,j)=>Math.tanh(row[cue]+this.b[j]));
      for(let j=0;j<8;j++){const g=this.v[j]*(1-h[j]**2);this.a[j][cue]+=.08*error*g;this.b[j]+=.08*error*g;this.v[j]+=.08*error*h[j];}
      this.c+=.08*error;
    } else {const rate=.2/Math.max(dot(x,x),1e-9);this.w=this.w.map((w,i)=>w+rate*error*x[i]);}
  }
}
export function expected(c,peh){const delayedBranch=peh!==c.reversal;return (peh?c.follower_reward+c.reputation_reward:0)+({easy:1,medium:.8,hard:.55}[c.difficulty])*(delayedBranch?c.delayed*c.gamma**c.delay:c.immediate);}
export function outcome(c,peh,draw){
  const branch=peh!==c.reversal,due=branch?c.delay:0;
  const money=draw<({easy:1,medium:.8,hard:.55}[c.difficulty])?(branch?c.delayed:c.immediate):0;
  const bonus=peh?c.follower_reward+c.reputation_reward:0;
  return {money,due,followers:+peh,reputation:+peh,return:bonus+c.gamma**due*money,
    learnable_return:bonus+(c.trace||due===0?c.gamma**due*money:0),update:c.trace||due===0||bonus>0,
    events:[{tick:0,reward:bonus,money:0,followers:+peh,reputation:+peh},{tick:due,reward:money,money,followers:0,reputation:0}]};
}
export function episode(bank,model,c,rng,mapping=0,split='train',learn=true){
  const key=model.kind==='random_network'?'random_network':'connectome',pool=bank.models[key].splits[split];
  const obs=[0,1].map(i=>pool[i][Math.floor(rng.random()*pool[i].length)]);
  const pehLeft=rng.random()<.5,cashDraw=[rng.random(),rng.random()];
  const vals=obs.map((o,i)=>model.value(o.feature,i)),eps=learn?.2:0,tie=Math.abs(vals[0]-vals[1])<1e-12;
  const p0=tie||model.kind==='random'?.5:vals[0]>vals[1]?1-eps/2:eps/2;
  const cue=rng.random()<p0?0:1,peh=cue===mapping,o=outcome(c,peh,cashDraw[cue]);
  if(learn&&o.update)model.learn(obs[cue].feature,cue,o.learnable_return/100);
  const a=expected(c,true),b=expected(c,false),neural=!['random','mlp','disconnected'].includes(model.kind);
  return {choice:peh?'PEHCHAAN':'PAISA',cue,side:peh===pehLeft?'LEFT':'RIGHT',peh_left:pehLeft,
    probability_pehchaan:mapping===0?p0:1-p0,optimal:a>b?peh:b>a?!peh:true,
    expected_regret:Math.max(a,b)-expected(c,peh),money:o.money,return:o.return,due:o.due,
    followers:o.followers,reputation:o.reputation,events:o.events,neural_seed:obs[cue].seed,
    active_neurons:neural?obs[cue].active_neurons:null,observation:neural?obs[cue]:null};
}
export function summarize(rows){const n=rows.length;return {episodes:n,success_rate:rows.filter(r=>r.optimal).length/n,pehchaan_rate:rows.filter(r=>r.choice==='PEHCHAAN').length/n,money_total:rows.reduce((s,r)=>s+r.money,0),mean_return:rows.reduce((s,r)=>s+r.return,0)/n,mean_regret:rows.reduce((s,r)=>s+r.expected_regret,0)/n};}
export function evaluate(bank,model,c,seed,count=200,mapping=0,split='test'){
  const snapshot=JSON.stringify(model),rng=new RNG(seed),rows=Array.from({length:count},()=>episode(bank,model,c,rng,mapping,split,false));
  if(JSON.stringify(model)!==snapshot)throw Error('Evaluation changed weights');
  return summarize(rows);
}
