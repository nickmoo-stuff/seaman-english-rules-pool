// Rule-event cases exercise the actual adjudicator; engine cases generate their own contacts/pots.
'use strict';
const assert=require('node:assert/strict'),{chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{const p=await b.newPage({serviceWorkers:'block'}),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(process.env.TEST_URL||'http://127.0.0.1:8030/',{waitUntil:'networkidle'});await p.locator('#enterTavern').click();await p.waitForTimeout(2700);
 const results=await p.evaluate(()=>{
  const rows=[];gameMode='local';aiPlayer=null;playerNames={1:'Ada',2:'Bea'};
  function reset(groups={1:'red',2:'yellow'}){clearTimeout(aiTimer);clearTimeout(aiWatchdogTimer);winModal.hidden=true;gameApp.hidden=false;titleScreen.hidden=true;schoolSession=null;newFrame(1);placementMode='none';state.breakShot=false;state.groups=groups;pendingChoice=null;shot=null;moving=false;}
  function event(name,overrides,groups){reset(groups);shot={number:++shotNumber,player:1,isBreak:false,startOn:onType(1),firstContact:'red',firstContactId:null,pots:[],cuePotted:false,cushionAfterContact:true,objectCushions:new Set(),breakCrossers:new Set(),...overrides};for(const type of shot.pots){const ball=balls.find(b=>b.type===type&&!b.potted);if(ball)ball.potted=true;}if(shot.cuePotted)cue().potted=true;if(shot.isBreak)evaluateBreak();else evaluateNormal();const previousAI=aiPlayer;aiPlayer=state.player;const targets=aiLegalTargets().map(b=>b.type);aiPlayer=previousAI;rows.push({name,player:state.player,groups:{...state.groups},over:state.frameOver,winner:state.winner,placement:placementMode,choice:pendingChoice,blackPotted:balls.find(b=>b.type==='black').potted,last:lastShotEl.textContent,targets,on:onType(state.player)});}
  event('open legal red claims red',{pots:['red']},{1:null,2:null});
  event('open legal yellow claims yellow',{firstContact:'yellow',pots:['yellow']},{1:null,2:null});
  event('open mixed pots claim first contact',{firstContact:'yellow',pots:['red','yellow']},{1:null,2:null});
  event('wrong first contact',{firstContact:'yellow'});
  event('no first contact',{firstContact:null});
  event('no subsequent cushion or pot',{cushionAfterContact:false});
  event('in-off',{pots:['white'],cuePotted:true});
  event('opponent-only pot loses turn without ball in hand',{pots:['yellow']});
  event('own plus opponent pots continue',{pots:['red','yellow']});
  event('legal miss switches turn',{});
  event('black early loses frame',{firstContact:'black',pots:['black']});
  event('illegal break offers re-rack',{isBreak:true,breakCrossers:new Set()},{1:null,2:null});
  event('legal break keeps open and continues',{isBreak:true,pots:['red'],breakCrossers:new Set([2,3,4])},{1:null,2:null});
  event('legal break black is respotted',{isBreak:true,pots:['black'],firstContact:'red',breakCrossers:new Set([2,3,4])},{1:null,2:null});
  event('legal break in-off gives baulk',{isBreak:true,pots:['white'],cuePotted:true,breakCrossers:new Set([2,3,4])},{1:null,2:null});
  return rows;
 });
 const by=Object.fromEntries(results.map(x=>[x.name,x]));
 for(const [name,group] of [['open legal red claims red','red'],['open legal yellow claims yellow','yellow'],['open mixed pots claim first contact','yellow']]){assert.equal(by[name].groups[1],group);assert.equal(by[name].player,1);}
 for(const name of ['wrong first contact','no first contact','no subsequent cushion or pot','in-off']){assert.equal(by[name].player,2);assert.equal(by[name].placement,'anywhere');assert.equal(by[name].on,'yellow');assert(by[name].targets.every(t=>t==='yellow'));assert.match(by[name].last,/cue ball in hand anywhere/i);assert(!by[name].over);}
 assert.equal(by['opponent-only pot loses turn without ball in hand'].player,2);assert.equal(by['opponent-only pot loses turn without ball in hand'].placement,'none');assert.equal(by['own plus opponent pots continue'].player,1);assert.equal(by['legal miss switches turn'].player,2);assert.equal(by['black early loses frame'].winner,2);
 assert.equal(by['illegal break offers re-rack'].choice,'break');assert.equal(by['legal break keeps open and continues'].player,1);assert.equal(by['legal break keeps open and continues'].groups[1],null);assert(!by['legal break black is respotted'].blackPotted);assert(!by['legal break black is respotted'].over);assert.equal(by['legal break in-off gives baulk'].placement,'baulk');assert.equal(by['legal break in-off gives baulk'].player,2);
 console.log('PASS 15 EPA adjudicator cases: breaks/re-rack/black respot, open groups, first contact/action, in-off, ball in hand, continuation/turn loss, early black; no two-visit or free-target exemption');
 const actual=await p.evaluate(()=>{
  const rows=[];gameMode='local';aiPlayer=null;
  function fixture(){clearTimeout(aiTimer);clearTimeout(aiWatchdogTimer);winModal.hidden=true;newFrame(1);state.breakShot=false;state.groups={1:'red',2:'yellow'};placementMode='none';selectedSpin={x:0,y:0};for(const b of balls){b.potted=true;b.vx=b.vy=0;b.cueSpin=null;}Object.assign(cue(),{potted:false,x:CENTRE_X,y:T+200});}
  function shoot(name,deg,power){setAngleDeg(deg);powerEl.value=power;beginShot();let n=0;while(!allStopped()&&n++<8000)step(1/120);if(!allStopped())throw Error('Physics did not settle');const detail={name,first:shot.firstContact,pots:[...shot.pots],white:shot.cuePotted,cushion:shot.cushionAfterContact};endShot();clearTimeout(aiTimer);clearTimeout(aiWatchdogTimer);rows.push({...detail,player:state.player,winner:state.winner,placement:placementMode,group:state.groups[1],over:state.frameOver,choice:pendingChoice,breakShot:state.breakShot});}
  fixture();state.groups={1:null,2:null};Object.assign(balls.find(b=>b.type==='red'),{potted:false,x:CENTRE_X,y:T+80});shoot('actual open red pot',270,20);
  fixture();Object.assign(balls.find(b=>b.type==='red'),{potted:false,x:L+200,y:B-100});Object.assign(balls.find(b=>b.type==='yellow'),{potted:false,x:CENTRE_X,y:T+80});shoot('actual wrong colour pot',270,20);
  fixture();shoot('actual in-off',270,20);
  fixture();Object.assign(balls.find(b=>b.type==='red'),{potted:false,x:L+100,y:B-80});shoot('actual no-contact foul',0,20);
  fixture();Object.assign(cue(),{x:CENTRE_X,y:H/2+30});Object.assign(balls.find(b=>b.type==='red'),{potted:false,x:CENTRE_X,y:H/2});shoot('actual soft contact without cushion',270,5);
  fixture();Object.assign(balls.find(b=>b.type==='black'),{potted:false,x:CENTRE_X,y:T+80});shoot('actual legal black win',270,20);
  fixture();Object.assign(balls.find(b=>b.type==='black'),{potted:false,x:CENTRE_X,y:T+80});Object.assign(balls.find(b=>b.type==='red'),{potted:false,x:L+100,y:B-80});shoot('actual early black loss',270,20);
  fixture();rackBalls();state.breakShot=true;state.groups={1:null,2:null};Object.assign(cue(),{x:L+PLAY_W*.8,y:H/2,potted:false});shoot('actual full-rack legal break',180,95);
  return rows;
 });
 const a=Object.fromEntries(actual.map(x=>[x.name,x]));assert.equal(a['actual open red pot'].group,'red');assert(a['actual open red pot'].pots.includes('red'));assert.equal(a['actual wrong colour pot'].first,'yellow');assert.equal(a['actual wrong colour pot'].placement,'anywhere');assert(a['actual in-off'].white);assert.equal(a['actual in-off'].player,2);assert.equal(a['actual no-contact foul'].first,null);assert.equal(a['actual no-contact foul'].placement,'anywhere');assert.equal(a['actual soft contact without cushion'].first,'red');assert(!a['actual soft contact without cushion'].cushion);assert.equal(a['actual soft contact without cushion'].placement,'anywhere');assert.equal(a['actual legal black win'].winner,1);assert.equal(a['actual early black loss'].winner,2);assert(!a['actual full-rack legal break'].over);assert.equal(a['actual full-rack legal break'].choice,null);assert(!a['actual full-rack legal break'].breakShot);
 assert.deepEqual(errors,[]);console.log('PASS 8 real-engine scenarios: group pot, wrong colour, in-off, no contact, no-action foul, legal/early black and full-rack break');
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
