"""Small, explicit browser-only adaptations; approved rules, lessons and saves stay unchanged."""
OLD_BOOT="""    // Defer audio startup until after top-level declarations have initialized.
    setTimeout(()=>{try{audioReady();startBootAnthem();}catch(err){console.warn('Boot audio unavailable:',err);}},0);"""
NEW_BOOT="""    // Keep media startup in the trusted click stack for Safari's gesture policy.
    try{audioReady();startBootAnthem();}catch(err){console.warn('Boot audio unavailable:',err);}"""
GESTURE_RETRY="""// Retry rejected media only on a later real interaction; gameplay never waits for it.
function retryMusicFromGesture(){
  if(!pendingMusicRequest||musicTargetVolume()<=0)return;
  try{audioReady();retryPendingMusic();}catch(_){/* Audio can remain unavailable without blocking play. */}
}
document.addEventListener('pointerdown',retryMusicFromGesture,{passive:true});
document.addEventListener('keydown',retryMusicFromGesture,{passive:true});
"""
OLD_WARNING='Older/unsupported browser detected. If you\'re using something like the browser within Messenger, click your settings in the top right and choose ‘Open in browser’ (or similar) for a better experience.'
NEW_WARNING='Some in-app or older browsers may limit performance. For a better experience, use your browser menu to open this game in Safari, Chrome, Firefox or Edge. You can keep playing here. Export your save in Settings before switching browsers.'
ADVISORY_CSS="""
/* Browser advisory stays non-modal and readable in the compact landscape header. */
#gameApp>header #browserWarning:not([hidden]){display:block;grid-column:1/-1;grid-row:2;max-width:none;max-height:42px;overflow:auto;margin:2px 0;line-height:1.3}
html[data-layout-device='mobile'][data-gameplay-layout='landscape'] #gameApp>header #browserWarning:not([hidden]){max-height:32px;font-size:10px;padding:3px 6px}
"""
def project(relative,data):
 if relative=='layout.js':
  old="header=app.querySelector(':scope > header'),brand=header.firstElementChild;"
  assert old in data.decode()
  return data.decode().replace(old,old+"\n const browserWarning=document.getElementById('browserWarning');if(browserWarning)header.append(browserWarning);").encode()
 if relative=='layout.css':return data+ADVISORY_CSS.encode()

 if relative=='game.js':
  text=data.decode().replace("const BUILD_MODE='development'","const BUILD_MODE='release'")
  assert OLD_BOOT in text
  text=text.replace(OLD_BOOT,NEW_BOOT)
  text=text.replace('Messenger|Line\\/|','Messenger|Line\\/|TikTok|BytedanceWebview|Snapchat|')
  text=text.replace('function startBootAnthem(){',GESTURE_RETRY+'function startBootAnthem(){')
  text=text.replace('    await next.play();\n', '    await next.play();\n    if(token!==musicFadeToken)return; // A newer gesture/track supersedes this request.\n')
  text=text.replace('    next.pause();\n  }\n}\nfunction retryPendingMusic', '    if(token===musicFadeToken)next.pause();\n  }\n}\nfunction retryPendingMusic')
  return text.encode()
 if relative=='index.html':
  text=data.decode().replace('<html>',"<html lang='en-GB'>")
  text=text.replace('width=device-width,initial-scale=1', 'width=device-width,initial-scale=1,viewport-fit=cover')
  text=text.replace("<link rel='apple-touch-icon'", "<meta name='apple-mobile-web-app-capable' content='yes'><meta name='apple-mobile-web-app-title' content='Seamen Pool'><link rel='apple-touch-icon'")
  text=text.replace("href='manifest.webmanifest'","href='../../manifest.webmanifest'").replace("register('./service-worker.js'","register('../../service-worker.js'")
  assert OLD_WARNING in text
  return text.replace(OLD_WARNING,NEW_WARNING).encode()
 return data
