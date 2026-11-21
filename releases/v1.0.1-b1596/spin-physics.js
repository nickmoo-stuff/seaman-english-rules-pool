/* K3B.1: reduced planar spin model, expressed in surface-speed units.
   Centre contact is an exact no-op. No swerve, jump, masse or object-ball throw.
   Follow/draw couples through cloth AFTER the first object-ball collision;
   sidespin exchanges a bounded tangential impulse at cushions. */
(function(root){
 'use strict';
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 function contact(x,y){x=Number.isFinite(x)?x:0;y=Number.isFinite(y)?y:0;const m=Math.hypot(x,y),scale=m>.85?.85/m:1;return{x:x*scale,y:y*scale};}
 function strike(b,point,angle,speed){
  const p=contact(point.x,point.y);
  if(!p.x&&!p.y){b.cueSpin=null;return;}
  const follow=-p.y*speed*.30;
  b.cueSpin={x:Math.cos(angle)*follow,y:Math.sin(angle)*follow,side:p.x*speed*.24,engaged:false};
 }
 function advance(b,dt){
  const s=b.cueSpin;if(!s||b.potted)return;
  // Spin decays in time: slow/long approaches lose more draw than firm shots.
  const decay=Math.exp(-1.1*dt);s.x*=decay;s.y*=decay;s.side*=Math.exp(-.8*dt);
  if(s.engaged){const transfer=1-Math.exp(-dt/.16);b.vx+=s.x*transfer;b.vy+=s.y*transfer;s.x*=1-transfer;s.y*=1-transfer;}
  if(Math.hypot(s.x,s.y)+Math.abs(s.side)<.25)b.cueSpin=null;
 }
 function collide(b){const s=b.cueSpin;if(!s)return;if(s.engaged){s.x*=.65;s.y*=.65;}s.engaged=true;s.side*=.9;}
 function cushion(b,nx,ny){
  const s=b.cueSpin;if(!s)return;
  const speed=Math.hypot(b.vx,b.vy),impulse=clamp(s.side*.36,-speed*.16,speed*.16);
  b.vx+=-ny*impulse;b.vy+=nx*impulse;
  // Rotational energy cannot turn repeated cushion hits into acceleration.
  const after=Math.hypot(b.vx,b.vy),limit=speed*1.015;
  if(after>limit&&after){b.vx*=limit/after;b.vy*=limit/after;}
  s.side*=.5;
  const dot=s.x*nx+s.y*ny;if(dot<0){s.x-=1.7*dot*nx;s.y-=1.7*dot*ny;}
  s.x*=.8;s.y*=.8;
 }
 const api={contact,strike,advance,collide,cushion};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 else root.SeamenSpinPhysics=api;
})(typeof globalThis!=='undefined'?globalThis:this);
