import {RNG,Readout,defaults,names,expected,episode,evaluate,summarize} from './engine.js';
import {BrainView} from './brain-view.js';
import {FlyArena} from './arena.js';
const $=id=>document.getElementById(id),fmt=new Intl.NumberFormat('en-IN',{maximumFractionDigits:1});
const cash=x=>'₹'+fmt.format(x),pct=x=>(x*100).toFixed(1)+'%';
let bank,bankHash,suite,model,rng,config={...defaults},seed=0,mapping=0,rows=[],testRows=[],busy=false,mode='train',generation=0,before,after,phase=0,phaseConfigs=[],pending=null;
const viewer=new BrainView($('brain-canvas'));
const arena=new FlyArena($('arena-canvas'),$('anatomy-status'));
for(const view of ['arena','close'])$('view-'+view).addEventListener('click',()=>{arena.setView(view);for(const v of ['arena','close'])$('view-'+v).classList.toggle('selected',v===view);});
const notes={connectome:'Real FlyWire wiring stays fixed. Only 32 external value weights learn.',random_network:'Same simulator, shuffled connection targets. A separate 32-weight readout learns.',mlp:'33 trainable parameters. Sees raw cue identity; no connectome in this controller.',fixed:'Same neural responses, zero readout weights held fixed. No learning.',random:'Chooses each option with probability ½. No neural controller or learning.',disconnected:'All downstream signal removed. Zero features; no way to distinguish the cues.'};
const neural=()=>!['random','mlp','disconnected'].includes(model.kind);
function setStatus(t){$('load-status').textContent=t;}
function dataForModel(){return bank.models[model.kind==='random_network'?'random_network':'connectome'];}
function setControls(){
  for(const id of ['brain','immediate','delayed','difficulty','gamma','followers','reputation','trace','seed','reverse','test','reset','watch'])$(id).disabled=busy||!bank;
  document.querySelectorAll('[data-delay]').forEach(b=>b.disabled=busy||!bank);
  $('train').textContent=busy?(mode==='train'?'Ⅱ Pause training':'Ⅱ Pause test'):'▶ Train the readout';
  $('test').textContent='Test × 100';
}
function refreshRules(){
  $('immediate-value').value=cash(config.immediate);$('delayed-value').value=cash(config.delayed);
  document.querySelectorAll('[data-delay]').forEach(b=>{const selected=+b.dataset.delay===config.delay;b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',selected);});
  const delayedText=cash(config.delayed)+` <small>${config.delay?'after '+config.delay+' ticks':'immediately'}</small>`,immediateText=cash(config.immediate)+' <small>immediately</small>';
  $('peh-pay').innerHTML=config.reversal?immediateText:delayedText;$('cash-pay').innerHTML=config.reversal?delayedText:immediateText;
  const a=expected(config,true),b=expected(config,false);$('optimal-choice').innerHTML=(Math.abs(a-b)<1e-8?'Either choice':a>b?'Pehchaan':'Paisa')+' <span>↗</span>';
  $('optimal-math').textContent=`Expected return: ${cash(a)} vs ${cash(b)}`;
  $('reverse').textContent=config.reversal?'⇄ Restore the money mapping':'⇄ Reverse the money mapping';
  $('tick-track').replaceChildren(...Array.from({length:config.delay+1},()=>document.createElement('span')));
  $('tick-label').textContent=`0 / ${config.delay} ticks`;
}
function reset(){
  generation++;busy=false;seed=+ $('seed').value||0;mapping=seed%2;model=new Readout($('brain').value,seed);rng=new RNG(seed);rows=[];testRows=[];phase=0;phaseConfigs=[{...config}];pending=null;after=null;mode='train';
  before=evaluate(bank,model,config,seed+10000,200,mapping);
  $('before').textContent=pct(before.success_rate);$('after').textContent='—';$('choice-status').textContent='Your brother is currently untrained.';
  $('episode-count').textContent='EPISODE 000 / 300';$('model-note').textContent=notes[model.kind];
  $('brain-title').textContent=neural()?'Real wiring. Small learner.':'A baseline worth checking.';
  $('source-tag').textContent=neural()?'CACHED LIF RESPONSES':'NO CONNECTOME ACTIVITY';
  $('brain-count').textContent=neural()?fmt.format(bank.neuron_count):'—';
  $('plastic-count').innerHTML=(model.kind==='mlp'?'33':(['random','fixed','disconnected'].includes(model.kind)?'0':'32'))+' <small>/ '+(model.kind==='mlp'?'MLP parameters':'readout only')+'</small>';
  $('active-count').textContent='—';$('spike-count').textContent='—';arena.reset();
  $('peh-card').classList.remove('chosen');$('cash-card').classList.remove('chosen');
  $('peh-card').style.order='0';$('cash-card').style.order='2';document.querySelector('.versus').style.order='1';
  $('payout-label').textContent='REWARD ARRIVES AFTER THE CHOICE';
  $('ledger-footer').textContent=`Seed ${seed} · cue mapping ${mapping?'B':'A'} → Pehchaan`;
  viewer.set(neural()?dataForModel():null,null);refreshRules();updateScores([]);drawChart();drawLedger();setControls();
}
function updateScores(list){
  $('money-scope').textContent=mode==='test'?'TEST MONEY':'TRAINING MONEY';
  $('money').textContent=cash(list.reduce((s,r)=>s+r.money,0));$('follower-count').textContent=fmt.format(list.reduce((s,r)=>s+r.followers,0));$('reputation-count').textContent=fmt.format(list.reduce((s,r)=>s+r.reputation,0));
  $('success').textContent=list.length?pct(summarize(list).success_rate):'—';$('success-note').textContent=list.length?`${list.filter(r=>r.optimal).length} / ${list.length} ${mode==='test'?'held-out tests':'training choices'}`:'Run training to measure';
}
function drawChart(){
  const svg=$('learning-chart'),w=640,h=180,l=35,r=620,top=20,bottom=151;
  let s='';for(const value of [0,.5,1]){const y=bottom-value*(bottom-top);s+=`<line x1="${l}" y1="${y}" x2="${r}" y2="${y}" stroke="#2a3945" ${value===.5?'stroke-dasharray="4 5"':''}/><text x="0" y="${y+4}" fill="#8799a6" font-size="10" font-family="monospace">${value*100}%</text>`;}
  $('chart-empty').hidden=rows.length>0;
  if(rows.length){const total=Math.max(300,Math.ceil(rows.length/300)*300);const pts=rows.map((row,i)=>{const sub=rows.slice(Math.max(0,i-24),i+1),score=sub.filter(r=>r.optimal).length/sub.length;return `${l+(r-l)*(i+1)/total},${bottom-score*(bottom-top)}`;});s+=`<polygon points="${l},${bottom} ${pts.join(' ')} ${l+(r-l)*rows.length/total},${bottom}" fill="#defb6209"/><polyline points="${pts.join(' ')}" fill="none" stroke="#defb62" stroke-width="2"/>`;rows.forEach((row,i)=>{if(i>0&&row.phase!==rows[i-1].phase){const x=l+(r-l)*(i+1)/total;s+=`<line x1="${x}" y1="15" x2="${x}" y2="${bottom}" stroke="#66d7e8" stroke-dasharray="3 4"/><text x="${Math.min(x+5,540)}" y="12" fill="#66d7e8" font-size="9">REVERSAL</text>`;}});for(const t of [0,total/2,total])s+=`<text x="${l+(r-l)*t/total}" y="174" fill="#8799a6" font-size="10" text-anchor="middle" font-family="monospace">${t}</text>`;}
  svg.innerHTML=s;
}
function drawLedger(){const list=mode==='test'?testRows:rows;$('ledger').innerHTML=list.length?list.slice(-5).reverse().map((r,i)=>`<div class="ledger-row"><span class="${r.choice==='PEHCHAAN'?'peh':'cash-text'}">${String(list.length-i).padStart(3,'0')} / ${r.choice}</span><span>${cash(r.money)}</span><span>${r.due} ticks</span></div>`).join(''):'<p class="empty-ledger">No episodes. No invented numbers.</p>';}
function display(row){
  const peh=$('peh-card'),paisa=$('cash-card');peh.style.order=row.peh_left?'0':'2';paisa.style.order=row.peh_left?'2':'0';document.querySelector('.versus').style.order='1';
  peh.classList.toggle('chosen',row.choice==='PEHCHAAN');paisa.classList.toggle('chosen',row.choice==='PAISA');
  $('choice-status').textContent=row.choice==='PEHCHAAN'?'Pehchaan chosen. Reputation +1.':'Paisa chosen. Seedha cash.';
  $('payout-label').textContent=`${cash(row.money)} RECEIVED · RETURN ${cash(row.return)}`;
  $('tick-label').textContent=`${row.due} / ${config.delay} ticks`;
  [...$('tick-track').children].forEach((t,i)=>t.classList.toggle('filled',i<=row.due));
  $('active-count').textContent=row.active_neurons===null?'—':fmt.format(row.active_neurons);
  $('spike-count').textContent=row.observation?fmt.format(row.observation.spikes):'—';
  viewer.set(neural()?dataForModel():null,row.observation);
}
function finish(){busy=false;after=evaluate(bank,model,config,seed+10000,200,mapping);$('after').textContent=pct(after.success_rate);setControls();}
function start(which,one=false){
  if(busy){generation++;if(pending){pending.rng.state=pending.rngState;pending=null;}arena.reset();finish();$('choice-status').textContent='Paused. The unfinished choice was discarded.';return;}
  mode=which;if(which==='test')testRows=[];
  busy=true;setControls();const token=++generation,target=which==='train'?rows.length+(one?1:300):(one?1:100);
  const testRng=new RNG(seed+10000);
  function tick(){
    if(token!==generation||!busy)return;
    const list=which==='train'?rows:testRows,activeRng=which==='train'?rng:testRng;
    const rngState=activeRng.state,candidate=Object.assign(new Readout(model.kind,seed),structuredClone(model));
    const row=episode(bank,candidate,config,activeRng,mapping,which==='train'?'train':'test',which==='train');
    row.phase=phase;pending={rng:activeRng,rngState};
    const duration=one?3600:+$('speed').value;
    arena.play(row,duration);display(row);
    $('choice-status').textContent=`Walking toward ${row.choice==='PEHCHAAN'?'Pehchaan':'Paisa'}…`;
    $('payout-label').textContent='CHOICE MADE · PAYOUT PENDING';$('tick-label').textContent=`0 / ${config.delay} ticks`;
    [...$('tick-track').children].forEach(t=>t.classList.remove('filled'));
    const started=performance.now();
    function animate(){
      if(token!==generation||!busy)return;
      const progress=(performance.now()-started)/duration;
      const taskTick=Math.min(row.due,Math.max(0,Math.floor((progress-.42)/.48*(row.due+1))));
      $('tick-label').textContent=`${taskTick} / ${config.delay} ticks`;
      [...$('tick-track').children].forEach((t,i)=>t.classList.toggle('filled',progress>.42&&i<=taskTick));
      if(progress>.42)$('choice-status').textContent=row.due?`${row.choice} chosen. Waiting for tick ${row.due}…`:`${row.choice} chosen. Immediate payout.`;
      if(progress<1){requestAnimationFrame(animate);return;}
      // Commit weights and totals only after the displayed reward sequence completes.
      model=candidate;pending=null;list.push(row);display(row);updateScores(list);drawLedger();if(which==='train')drawChart();
      $('episode-count').textContent=which==='train'?`EPISODE ${String(rows.length).padStart(3,'0')} / ${target}`:`FROZEN TEST ${testRows.length} / ${target}`;
      if(list.length>=target){finish();return;}
      setTimeout(tick,duration>500?350:0);
    }
    requestAnimationFrame(animate);
  }
  tick();
}
for(const [id,field] of [['immediate','immediate'],['delayed','delayed'],['difficulty','difficulty'],['gamma','gamma'],['followers','follower_reward'],['reputation','reputation_reward'],['trace','trace']]){
  $(id).addEventListener('change',()=>{if(!bank)return;let value=id==='trace'?$(id).checked:id==='difficulty'?$(id).value:Number($(id).value);if(typeof value==='number'&&(!Number.isFinite(value)||value<0||value>1000)){$(id).value=config[field];return;}config[field]=value;reset();});
}
document.querySelectorAll('[data-delay]').forEach(b=>b.addEventListener('click',()=>{if(!bank)return;config.delay=+b.dataset.delay;reset();}));
$('brain').addEventListener('change',()=>bank&&reset());$('seed').addEventListener('change',()=>{if(!Number.isInteger(+$('seed').value)||+$('seed').value<0||+$('seed').value>999999)$('seed').value=0;if(bank)reset();});
$('watch').addEventListener('click',()=>start('test',true));
$('train').addEventListener('click',()=>start('train'));$('test').addEventListener('click',()=>start('test'));
$('reset').addEventListener('click',()=>{config.reversal=false;reset();});
$('reverse').addEventListener('click',()=>{generation++;busy=false;config.reversal=!config.reversal;phase++;phaseConfigs.push({...config});after=null;mode='train';before=evaluate(bank,model,config,seed+10000,200,mapping);$('before').textContent=pct(before.success_rate);$('after').textContent='—';$('choice-status').textContent='Money mapping reversed. Same readout. New lesson.';refreshRules();setControls();});
for(const id of ['methods-open','methods-footer'])$(id).addEventListener('click',()=>$('methods').showModal());
$('methods-close').addEventListener('click',()=>$('methods').close());$('methods').addEventListener('click',e=>{if(e.target===$('methods')){const r=$('methods').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)$('methods').close();}});
$('export').addEventListener('click',()=>{const compact=r=>{const {observation,...rest}=r;return rest;};const blob=new Blob([JSON.stringify({schema:1,source:bank.source,bank_sha256:bankHash,dataset:bank.dataset,config,seed,mapping,model,phase_configs:phaseConfigs,training:rows.map(compact),tests:testRows.map(compact),before,after},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`money-follows-fly-seed-${seed}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
async function init(){
  try{const res=await fetch('responses.json');if(!res.ok)throw Error('Response bank unavailable');const bytes=await res.arrayBuffer();bank=JSON.parse(new TextDecoder().decode(bytes));if(bank.source!=='measured_flypoke_response_bank'||!bank.validation?.passed)throw Error('Measured response validation missing');bankHash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');reset();for(const id of ['train','test','reset','reverse','export','watch'])$(id).disabled=false;setStatus('');}
  catch(e){setStatus('Real neural data is unavailable. Training is disabled. '+e.message);return;}
  try{const r=await fetch('suite.json');if(!r.ok)throw Error('Baseline results unavailable');suite=await r.json();$('suite-label').textContent=`${suite.seeds.length} seeds · ${suite.episodes} training + ${suite.test_episodes} tests / seed`;
    const learns={connectome:'32 external weights',random_network:'32 external weights',mlp:'33 MLP parameters',fixed:'Nothing',random:'Nothing',disconnected:'Nothing'};
    $('baseline-table').innerHTML=Object.entries(suite.baselines).map(([k,v])=>`<tr class="${k==='connectome'?'highlight':''}"><td>${names[k]}</td><td>${learns[k]}</td><td>${pct(v.after.mean_success)} <span class="muted">± ${(v.after.sd_success*100).toFixed(1)} pp</span></td><td>${cash(v.after.mean_money_per_test)}</td><td>${pct(v.transfer.mean_success)}</td></tr>`).join('');
    const reversal=suite.reversal.reduce((v,r)=>v+r.test.success_rate,0)/suite.reversal.length;
    $('robustness').innerHTML=`<div><span>120 HZ CUE TRANSFER</span><strong>${pct(suite.baselines.connectome.transfer.mean_success)}</strong><p>Success falls when input intensity changes.</p></div><div><span>AFTER REWARD REVERSAL</span><strong>${pct(reversal)}</strong><p>Mean test success after 300 more training episodes.</p></div><div><span>DELAY CROSSOVER</span><strong>5 → 10 ticks</strong><p>With ₹25 later, ₹10 now and γ=.85, the better choice switches to Paisa.</p></div>`;
    $('suite-caveat').textContent='± is standard deviation across learner seeds. One anatomy, one randomized graph and a finite neural response bank. These runs do not establish a connectome advantage.';
  }catch(e){$('baseline-table').innerHTML='<tr><td colspan="5">No saved baseline results available. No comparison is claimed.</td></tr>';}
}
setControls();
init();
