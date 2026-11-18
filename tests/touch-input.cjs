// Dispatch a real touch double-tap without two locator actionability waits.
// Those waits can consume the gesture interval under concurrent Chromium load.
async function doubleTap(page,locator){
 await locator.scrollIntoViewIfNeeded();const r=await locator.boundingBox();if(!r)throw Error('Double-tap target is not visible');
 const c=await page.context().newCDPSession(page),point={x:r.x+r.width/2,y:r.y+r.height/2};
 try{for(let i=0;i<2;i++){await c.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point]});await c.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});if(i===0)await page.waitForTimeout(60);}}finally{await c.detach();}
}
module.exports={doubleTap};
