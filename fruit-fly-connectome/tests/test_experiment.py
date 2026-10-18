import json
import subprocess
from dataclasses import replace
from pathlib import Path
import pytest
from environment.task import Config
from training.core import RNG, Readout, episode, evaluate, experiment, load_bank

ROOT = Path(__file__).resolve().parents[1]

@pytest.fixture(scope='module')
def bank():
    return load_bank()

def test_reward_clock_and_reversal():
    c = Config()
    o = c.outcome(True, .1)
    assert o['events'][1]['tick'] == 5
    assert o['events'][0]['money'] == 0
    assert o['return'] == pytest.approx(100*.95**5)
    assert c.outcome(False, .1)['due'] == 0
    assert replace(c,reversal=True).outcome(False,.1)['due'] == 5
    assert c.expected(True) > c.expected(False)
    d = Config(delayed=25,delay=10,gamma=.85)
    assert d.expected(False) > d.expected(True)

def test_cue_buffer_ablation():
    c = Config(trace=False)
    assert not c.outcome(True,.1)['update']
    assert c.outcome(True,.1)['learnable_return'] == 0
    assert c.outcome(True,.1)['money'] == 100
    assert c.outcome(False,.1)['update']
    assert replace(c,delay=0).outcome(True,.1)['update']
    assert replace(c,follower_reward=2).outcome(True,.1)['learnable_return'] == 2

def test_held_out_bank_and_no_direct_cue_bypass(bank):
    inputs = set(sum(bank['cue_root_ids'],[]))
    assert len(inputs) == 256
    for data in bank['models'].values():
        assert not inputs.intersection(n['root_id'] for n in data['feature_neurons'])
        sets = [{o['seed'] for cue in data['splits'][split] for o in cue} for split in ['train','test','transfer']]
        assert not sets[0]&sets[1] and not sets[0]&sets[2] and not sets[1]&sets[2]
        assert data['display_edges']

def test_tests_do_not_train(bank):
    m=Readout();r=RNG(4)
    for _ in range(20):episode(bank,m,Config(),r)
    state=m.fingerprint()
    evaluate(bank,m,Config(),123)
    assert m.fingerprint()==state

def test_disconnected_signal_cannot_learn(bank):
    m=Readout('disconnected');state=m.fingerprint();r=RNG(2)
    rows=[episode(bank,m,Config(),r) for _ in range(100)]
    assert all(row['probability_pehchaan']==.5 for row in rows)
    assert state==m.fingerprint()

@pytest.mark.parametrize('kind',['connectome','random_network','mlp','random','fixed','disconnected'])
def test_javascript_matches_python(bank,kind):
    code = """
import fs from 'node:fs';
import {Readout,RNG,defaults,episode,evaluate} from './frontend/dist/engine.js';
const bank=JSON.parse(fs.readFileSync('./frontend/dist/responses.json'));
const kind=process.argv[1],m=new Readout(kind,7),r=new RNG(7);
const rows=Array.from({length:300},()=>episode(bank,m,defaults,r,1));
console.log(JSON.stringify({choices:rows.map(r=>r.choice),after:evaluate(bank,m,defaults,10007,200,1),w:m.w}));
"""
    js=json.loads(subprocess.check_output(['node','--input-type=module','-e',code,kind],cwd=ROOT,text=True))
    py=experiment(bank,kind,7)
    assert js['choices']==[r['choice'] for r in py['rows']]
    assert js['after']==pytest.approx(py['after'])
    assert js['w']==pytest.approx(py['model']['w'])

def test_mesh_buffers_are_valid():
    path=ROOT/'frontend/dist/assets';asset=json.loads((path/'fly.json').read_text());size=(path/'fly.bin').stat().st_size
    assert len([n for n in asset['nodes'] if n['name'].startswith('coxa_')])==6
    for i,node in enumerate(asset['nodes']):
        assert node['parent']<i
        for m in node['meshes']:
            for field in ['position','index']:
                start,count=m[field]
                assert start%4==0 and count%3==0 and start+count*4<=size
