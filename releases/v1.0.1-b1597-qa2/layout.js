/* K3C.3: presentation only. Reuse live controls; never restart/resize physics. */
(function(){
 'use strict';
 const root=document.documentElement,app=document.getElementById('gameApp');
 const version=document.querySelector('.game-menu-version');if(version)version.textContent=`Version ${APP_VERSION} · Build ${APP_BUILD_NUMBER}`;
 function isMobilePlatform(){
  const ua=navigator.userAgent||'',touch=navigator.maxTouchPoints>0;
  if(navigator.userAgentData?.mobile||/Android|iOS/i.test(navigator.userAgentData?.platform||'')||/Android|iPhone|iPad|iPod/i.test(ua))return true;
  if(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1)return true; // iPad desktop UA.
  if(window.SeamenRuntime?.isNativeContainer())return true;
  // Device Toolbar can emulate touch without changing the desktop UA. A real
  // desktop mouse/trackpad still reports a fine pointer and hover.
  return touch&&matchMedia('(pointer: coarse)').matches&&matchMedia('(hover: none)').matches;
 }
 let mobile=isMobilePlatform();root.dataset.layoutDevice=mobile?'mobile':'desktop';
 function orientationLayout(){
  const type=screen.orientation?.type;
  if(type?.startsWith('landscape'))return 'landscape';if(type?.startsWith('portrait'))return 'portrait';
  if(typeof window.orientation==='number')return Math.abs(window.orientation)%180===90?'landscape':'portrait';
  return matchMedia('(orientation: landscape)').matches?'landscape':'portrait';
 }
 const left=document.createElement('aside');left.id='landscapePlayer';left.className='landscape-region';left.setAttribute('aria-label','Player and match information');left.tabIndex=0;
 const right=document.createElement('aside');right.id='landscapeRight';right.className='landscape-region';right.setAttribute('aria-label','Shot power and play shot');
 const last=document.createElement('section');last.id='landscapeLast';last.setAttribute('aria-label','Last turn');last.setAttribute('aria-live','polite');last.tabIndex=0;last.innerHTML='<h2>LAST TURN</h2>';
 const power=document.createElement('section');power.id='landscapePower';power.setAttribute('aria-label','Shot power');
 right.append(last,power);
 const secondary=document.createElement('details');secondary.id='landscapeDetails';
 secondary.innerHTML='<summary>Match details</summary>';left.append(secondary);
 const table=document.createElement('div');table.id='landscapeTable';
 const helm=document.createElement('div');helm.id='landscapeHelm';
 const fine=document.createElement('section');fine.id='landscapeFine';fine.setAttribute('aria-label','Fine aiming');
 const bottom=document.createElement('section');bottom.id='landscapeBottom';bottom.setAttribute('aria-label','Aiming controls');bottom.append(helm,fine);
 const regions=[left,right,table,bottom];regions.forEach(el=>{el.hidden=true;app.append(el);});
 const moves=[];
 function register(node,destination){if(!node)return;const anchor=document.createComment('portrait control position');node.before(anchor);moves.push({node,anchor,destination});}
 register(document.querySelector('.j3-compact-status'),left);
 register(document.getElementById('j3Last'),last);
 register(document.getElementById('cuePlacementControls'),left);
 register(document.querySelector('.rules-hud'),left);
 register(document.getElementById('message'),secondary);
 register(document.getElementById('choice'),left);
 register(document.getElementById('opponentPanel'),secondary);
 register(document.getElementById('breakHelp'),secondary);
 register(document.querySelector('.controls .hint'),secondary);
 register(app.querySelector('.dev')?.closest('details'),secondary); // Absent in release; never select landscapeDetails itself.
 register(app.querySelector('footer'),secondary);
 register(tableWrap,table);
 register(document.querySelector('.cue-helm-wrap'),helm);
 const fineLabel=angleText.closest('label'),helmHeading=document.querySelector('.cue-helm-heading');
 register(fineLabel,fine);
 register(document.querySelector('.angle-buttons'),fine);
 const powerLabel=powerText.closest('label');powerLabel.htmlFor='power';powerEl.setAttribute('aria-label','Shot power');
 register(powerLabel,power);register(powerEl,power);register(document.querySelector('.power-buttons'),power);register(shootBtn,right);
 const placementDock=document.createElement('section');placementDock.id='mobileCuePlacement';placementDock.setAttribute('aria-label','Cue ball placement arrows');placementDock.hidden=true;table.append(placementDock);
 const placementArrows=document.querySelector('#cuePlacementControls .cue-nudge-grid');
 const compactExtras=[...document.querySelectorAll('#cuePlacementControls p,#cuePlacementControls .cue-nudge-grid,#spinGuideNote')].map(node=>{const anchor=document.createComment('expanded help position');node.before(anchor);return {node,anchor};});
 const status=document.querySelector('.j3-compact-status'),rules=document.querySelector('.rules-hud'),header=app.querySelector(':scope > header'),brand=header.firstElementChild;
 const browserWarning=document.getElementById('browserWarning');if(browserWarning)header.append(browserWarning);
 const presets=document.getElementById('spinPresets'),presetsAnchor=document.createComment('original spin presets');presets.before(presetsAnchor);
 const presetSlot=document.createElement('div');presetSlot.id='mobileSpinPresets';header.append(presetSlot);
 const shotDock=document.createElement('section');shotDock.id='mobileShotDock';shotDock.setAttribute('aria-label','Play shot');shotDock.hidden=true;app.append(shotDock);
 const rail=document.createElement('div');rail.id='mobilePanelRail';rail.hidden=true;left.append(rail);
 const panels={};
 for(const [key,label,description] of [['players','Players','player details'],['lastTurn','Last turn','last turn information'],['details','Details','match instructions and dialogue']]){
  const button=document.createElement('button'),body=document.createElement('section');
  button.type='button';button.className='mobile-panel-toggle';button.dataset.panel=key;body.id='mobilePanel'+key;body.className='mobile-panel-body';body.setAttribute('aria-label',description);
  button.setAttribute('aria-controls',body.id);rail.append(button,body);panels[key]={button,body,label,description};
  button.addEventListener('click',()=>{cancelPointers();mobileLandscapePanels[key]=!mobileLandscapePanels[key];saveAudioSettings();reflectPanels();fitTable();});
 }
 function reflectPanels(){
  let expanded=false;
  for(const [key,{button,body,label,description}] of Object.entries(panels)){
   const open=mobileLandscapePanels[key];expanded ||= open;body.hidden=!open;
   button.textContent=label+(open?' ▾':' ▸');button.setAttribute('aria-expanded',String(open));button.setAttribute('aria-label',(open?'Hide ':'Read ')+description);
  }
  app.style.setProperty('--mobile-info-w',expanded?'172px':'52px');
 }
 function move(node,destination){if(node.parentElement!==destination)destination.append(node);}
 function syncMobileLandscape(active){
  rail.hidden=!active;shotDock.hidden=!active;placementDock.hidden=!active||cuePlacementControls.hidden;
  if(active){
   move(status,brand);move(fineLabel,helmHeading);move(document.getElementById('opponentPanel'),header);move(rules,panels.players.body);move(last,panels.lastTurn.body);move(secondary,panels.details.body);
   move(cuePlacementControls,right);move(shootBtn,shotDock);move(presets,presetSlot);secondary.open=true;
   compactExtras.forEach(({node})=>move(node,node===placementArrows?placementDock:secondary));reflectPanels();
  }else{
   if(presetsAnchor.nextSibling!==presets)presetsAnchor.after(presets);
   compactExtras.forEach(({node,anchor})=>{if(anchor.nextSibling!==node)anchor.after(node);});
   if(current==='landscape'){
    if(fineLabel.parentElement!==fine)fine.prepend(fineLabel);
    move(document.getElementById('opponentPanel'),secondary);
    if(status.parentElement!==left)left.prepend(status);
    if(rules.parentElement!==left)left.append(rules);
    if(cuePlacementControls.parentElement!==left)rules.before(cuePlacementControls);
    if(last.parentElement!==right)right.prepend(last);
    move(shootBtn,right);if(secondary.parentElement!==left||left.lastElementChild!==secondary)left.append(secondary);secondary.open=true;
   }
  }
 }
 function reflectSpin(){root.dataset.mobileHelmSpin=String(helmSpinMode);fitTable();}
 new MutationObserver(reflectSpin).observe(document.querySelector('.cue-helm-wrap'),{attributes:true,attributeFilter:['class']});
 const originalTableStyle={width:tableWrap.style.width,height:tableWrap.style.height};
 const captures=new Map(),cancelledButtons=new Map();
 document.addEventListener('pointerdown',e=>{
  cancelledButtons.delete(e.pointerId);for(const [id,value] of cancelledButtons)if(value.released||value.until<performance.now())cancelledButtons.delete(id);
  captures.set(e.pointerId,e.target);
 },true);
 // A release after a cancelled press must not become an accidental shot/click.
 // A fresh pointer-down always starts a new, deliberate interaction.
 document.addEventListener('click',e=>{
  for(const [id,value] of cancelledButtons){if((e.pointerId===id||e.pointerId===undefined)&&value.button.contains(e.target)&&value.until>=performance.now()){cancelledButtons.delete(id);e.preventDefault();e.stopImmediatePropagation();return;}}
 },true);
 document.addEventListener('pointerup',e=>{captures.delete(e.pointerId);const cancelled=cancelledButtons.get(e.pointerId);if(cancelled){cancelled.released=true;cancelled.until=performance.now()+1500;}},true);
 document.addEventListener('pointercancel',e=>captures.delete(e.pointerId),true);
 document.addEventListener('gotpointercapture',e=>captures.set(e.pointerId,e.target),true);
 document.addEventListener('lostpointercapture',e=>captures.delete(e.pointerId),true);
 function cancelPointers(){
  if(helmGesture)finishHelmGesture({pointerId:helmGesture.id,type:'pointercancel'});
  spinPointer=null;lastSpinTap=null;aimDrag=null;draggingCue=false;
  for(const [id,el] of [...captures]){try{const button=el.closest?.('button');if(button)cancelledButtons.set(id,{button,until:Infinity,released:false});if(el.hasPointerCapture(id))el.releasePointerCapture(id);el.dispatchEvent(new PointerEvent('pointercancel',{pointerId:id,bubbles:true}));}catch(_){}}
  captures.clear();
 }
 let current=null,fitFrame=null;
 const floating=new Map();
 function syncFloating(){
  for(const [id,destination] of [['pwaNotice',last],['schoolCoach',left]]){
   const node=document.getElementById(id);if(!node)continue;
   let anchor=floating.get(id);if(!anchor){anchor=document.createComment('portrait notice position');node.before(anchor);floating.set(id,anchor);}
   if(current==='landscape'&&!app.hidden){if(node.parentElement!==destination)destination.append(node);}
   else if(anchor.nextSibling!==node)anchor.after(node);
  }
 }
 function fitTable(){
  cancelAnimationFrame(fitFrame);fitFrame=requestAnimationFrame(()=>{
   const header=app.querySelector(':scope > header');
   if(header.getBoundingClientRect().height)app.style.setProperty('--layout-header-h',header.getBoundingClientRect().height+'px');
   if(current!=='landscape'||app.hidden)return;
   const rect=table.getBoundingClientRect();
   const availableHeight=Math.max(0,rect.height-(placementDock.hidden?0:placementDock.getBoundingClientRect().height+4));
   const width=Math.max(0,Math.min(rect.width,availableHeight*W/H)),height=width*H/W;
   tableWrap.style.width=width+'px';tableWrap.style.height=height+'px';tableWrap.style.setProperty('--landscape-turn-size',Math.max(16,Math.min(38,width*.05))+'px');
   const overlay=placementDock.hidden?rect:tableWrap.getBoundingClientRect();
   for(const [key,value] of Object.entries({x:overlay.x,y:overlay.y,w:overlay.width,h:overlay.height}))app.style.setProperty('--mobile-table-'+key,value+'px');
  });
 }
 function reflectControls(){
  document.querySelectorAll('[data-gameplay-layout]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.gameplayLayout===gameplayLayoutPreference)));
 }
 function applyLayout(){
  mobile=isMobilePlatform();root.dataset.layoutDevice=mobile?'mobile':'desktop';
  const next=mobile?orientationLayout():gameplayLayoutPreference;
  if(next!==current){
   cancelPointers();current=next;root.dataset.gameplayLayout=next;
   if(next==='landscape'){
    regions.forEach(el=>el.hidden=false);moves.forEach(({node,destination})=>destination.append(node));powerEl.setAttribute('aria-orientation','vertical');
   }else{
    compactExtras.forEach(({node,anchor})=>anchor.after(node));
    [...moves].reverse().forEach(({node,anchor})=>anchor.after(node));regions.forEach(el=>el.hidden=true);
    tableWrap.style.width=originalTableStyle.width;tableWrap.style.height=originalTableStyle.height;powerEl.removeAttribute('aria-orientation');
   }
   syncTouchSliderLocks();
  }
  syncMobileLandscape(next==='landscape'&&mobile);reflectSpin();
  reflectControls();syncFloating();fitTable();
 }
 function selectLayout(value){if(mobile||!['portrait','landscape'].includes(value))return;gameplayLayoutPreference=value;saveAudioSettings();applyLayout();}
 document.querySelectorAll('[data-gameplay-layout]').forEach(button=>button.addEventListener('click',()=>selectLayout(button.dataset.gameplayLayout)));
 document.querySelectorAll('.layout-selector').forEach(group=>group.addEventListener('keydown',e=>{
  if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key)||mobile)return;
  e.preventDefault();const value=e.key==='ArrowLeft'||e.key==='Home'?'portrait':'landscape';selectLayout(value);group.querySelector(`[data-gameplay-layout='${value}']`).focus();
 }));
 powerEl.addEventListener('keydown',e=>{if(current==='landscape'&&['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();nudgePower(e.key==='ArrowUp'||e.key==='ArrowRight'?1:-1);}});
 app.addEventListener('gameplay-suspend',cancelPointers);
 let viewport=innerWidth+'x'+innerHeight;
 window.addEventListener('resize',()=>{const next=innerWidth+'x'+innerHeight;if(next!==viewport){cancelPointers();viewport=next;}applyLayout();},{passive:true});
 new MutationObserver(applyLayout).observe(cuePlacementControls,{attributes:true,attributeFilter:['hidden']});
 for(const query of ['(pointer: coarse)','(hover: none)'])matchMedia(query).addEventListener('change',applyLayout);
 screen.orientation?.addEventListener?.('change',applyLayout);
 window.addEventListener('orientationchange',applyLayout,{passive:true});
 window.visualViewport?.addEventListener('resize',()=>{cancelPointers();applyLayout();},{passive:true});
 const observer=new ResizeObserver(fitTable);observer.observe(table);observer.observe(app.querySelector(':scope > header'));
 new MutationObserver(applyLayout).observe(app,{attributes:true,attributeFilter:['hidden']});
 new MutationObserver(syncFloating).observe(document.body,{childList:true});
 applyLayout();
})();
