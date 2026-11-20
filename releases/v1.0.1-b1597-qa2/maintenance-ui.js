/* v1.0.1: presentation, scoped roster restoration and deliberate shot activation. */
(function(){
 'use strict';
 const app=document.getElementById('gameApp'),panel=document.getElementById('opponentPanel');
 let rosterPosition=null;
 document.getElementById('pirateList').addEventListener('click',e=>{
  const item=e.target.closest('[data-pirate-id]');if(!item)return;
  const card=document.getElementById('piratePlaceholder');
  rosterPosition={id:item.dataset.pirateId,top:card.scrollTop};
 },true);
 document.addEventListener('story-roster-return',()=>{
  if(!rosterPosition)return;
  const saved=rosterPosition,card=document.getElementById('piratePlaceholder');
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
   if(card.hidden)return;card.scrollTop=saved.top;
   const item=card.querySelector('[data-pirate-id="'+CSS.escape(saved.id)+'"]');
   if(!item)return;
   for(let parent=item.parentElement;parent&&parent!==card;parent=parent.parentElement)if(parent.tagName==='DETAILS')parent.open=true;
   const a=item.getBoundingClientRect(),b=card.getBoundingClientRect();
   if(a.top<b.top+8||a.bottom>b.bottom-8)card.scrollTop+=a.top-b.top-(b.height-a.height)/2;
  }));
 });
 document.getElementById('titlePlay').addEventListener('click',()=>{rosterPosition=null;},true);
 function syncOpponent(){
  const p=gameMode==='pirate'?activePirate():null;panel.hidden=!p;
  if(!p)return;
  document.getElementById('opponentPanelName').textContent=p.name;
  document.getElementById('opponentPanelInfo').textContent=p.role+' • '+p.style;
  const img=document.getElementById('opponentPanelPortrait');if(img.getAttribute('src')!==p.image)img.src=p.image;
 }
 new MutationObserver(syncOpponent).observe(app,{attributes:true,attributeFilter:['hidden']});
 new MutationObserver(syncOpponent).observe(document.getElementById('pirateDialogue'),{attributes:true,childList:true,subtree:true,characterData:true});
 function panelState(event){
  const details=event.currentTarget;
  details.querySelector('summary').setAttribute('aria-expanded',String(details.open));
  details.querySelector('.panel-toggle-label').textContent=details.open?'Hide':'Read';
  // Expansion is presentation only; abort any live drag rather than applying it.
  app.dispatchEvent(new Event('gameplay-suspend'));
  fitPortrait();
 }
 for(const details of [panel]){details.addEventListener('toggle',panelState);details.querySelector('summary').setAttribute('aria-expanded','false');details.querySelector('.panel-toggle-label').textContent='Read';}
 // Touch/pen clicks must begin and end on PLAY SHOT without becoming a scroll.
 // Keyboard and accessibility activation (detail=0) retain the existing path.
 let press=null,validRelease=false;
 shootBtn.addEventListener('pointerdown',e=>{validRelease=false;press=e.isPrimary&&e.button===0?{id:e.pointerId,x:e.clientX,y:e.clientY}:null;},true);
 document.addEventListener('pointermove',e=>{if(press?.id===e.pointerId&&Math.hypot(e.clientX-press.x,e.clientY-press.y)>10)press=null;},true);
 document.addEventListener('pointerup',e=>{if(press?.id!==e.pointerId)return;const b=shootBtn.getBoundingClientRect();validRelease=Math.hypot(e.clientX-press.x,e.clientY-press.y)<=10&&e.clientX>=b.left&&e.clientX<=b.right&&e.clientY>=b.top&&e.clientY<=b.bottom;press=null;},true);
 function cancelPress(){press=null;validRelease=false;}
 document.addEventListener('pointercancel',cancelPress,true);
 shootBtn.addEventListener('click',e=>{if(e.detail>0&&!validRelease){e.preventDefault();e.stopImmediatePropagation();}validRelease=false;},true);
 app.addEventListener('gameplay-suspend',cancelPress);
 let frame=null;
 function fitPortrait(){
  cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{
   const mobile=document.documentElement.dataset.layoutDevice==='mobile',portrait=document.documentElement.dataset.gameplayLayout==='portrait';
   app.style.setProperty('--maintenance-vh',(window.visualViewport?.height||innerHeight)+'px');
   if(!mobile||!portrait||app.hidden){tableWrap.style.removeProperty('--portrait-table-w');return;}
   const children=[app.querySelector(':scope > header'),document.querySelector('.j3-compact-status'),document.querySelector('.cue-helm-wrap'),document.querySelector('.controls'),cuePlacementControls];
   children.push(panel);
   const style=getComputedStyle(app),visible=children.filter(node=>node&&getComputedStyle(node).display!=='none');
   const padding=parseFloat(style.paddingTop)+parseFloat(style.paddingBottom);
   const occupied=visible.reduce((sum,node)=>sum+node.getBoundingClientRect().height,0)+padding+parseFloat(style.rowGap)*visible.length;
   const available=Math.max(90,app.clientHeight-occupied);
   tableWrap.style.setProperty('--portrait-table-w',Math.min(app.clientWidth-parseFloat(style.paddingLeft)-parseFloat(style.paddingRight),available*W/H)+'px');
   const table=tableWrap.getBoundingClientRect();app.style.setProperty('--portrait-panel-top',(table.top+4)+'px');app.style.setProperty('--portrait-panel-max',Math.max(80,table.height-8)+'px');
  });
 }
 const observer=new ResizeObserver(fitPortrait);for(const node of [app,document.querySelector('.controls'),document.querySelector('.cue-helm-wrap'),cuePlacementControls,document.querySelector('.j3-compact-status'),panel])observer.observe(node);
 new MutationObserver(fitPortrait).observe(app,{attributes:true,attributeFilter:['hidden']});
 new MutationObserver(fitPortrait).observe(cuePlacementControls,{attributes:true,attributeFilter:['hidden']});
 window.addEventListener('resize',()=>{cancelPress();fitPortrait();},{passive:true});
 window.visualViewport?.addEventListener('resize',()=>{cancelPress();fitPortrait();},{passive:true});
 syncOpponent();renderPlayLog();fitPortrait();
})();
