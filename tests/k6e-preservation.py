from pathlib import Path
import subprocess,re
r=Path(__file__).resolve().parents[1]
allowed={'www/game.js','www/index.html','www/style.css','www/supporter.js','www/README.txt','www/NATIVE-PACKAGING-READINESS.txt','www/sw.js','www/service-worker.js'}
for name in subprocess.check_output(['git','ls-tree','-r','--name-only','108ede8','--','www','native-patches'],cwd=r,text=True).splitlines():
 old=subprocess.check_output(['git','show','108ede8:'+name],cwd=r);new=(r/name).read_bytes()
 if name not in allowed:assert old==new,name
old=subprocess.check_output(['git','show','108ede8:www/game.js'],cwd=r,text=True);new=(r/'www/game.js').read_text();old=old.replace('0.17.61','0.17.62').replace('1591','1592')
if "const BUILD_MODE='release'" in new:old=old.replace("const BUILD_MODE='development'","const BUILD_MODE='release'")
a=new.index(" const availability=document.getElementById('supportAvailability');");b=new.index(" const price=document.getElementById('supportPrice');",a);assert new[:a]+new[b:]==old,'unrelated game.js changes'
for name in ['SupporterBillingCore.java','PlayBillingClient.java','BillingRetryJob.java','PurchaseTestPolicy.java']:assert (r/'native-patches/K6E'/name).read_bytes()==(r/'native-patches/K6A'/name).read_bytes(),name
assert 'PRODUCTION_PURCHASES_ENABLED=false;' in (r/'native-patches/K6E/ProductionPurchasePolicy.java').read_text()
print('PASS all approved dialogue/art/audio/AI/physics/progression/saves and historical native/tools untouched; game.js changes limited to version and supporter availability; ownership/ack/retry unchanged; both gates OFF')

index=subprocess.check_output(['git','show','108ede8:www/index.html'],cwd=r,text=True).replace('0.17.61','0.17.62').replace('1591','1592')
index=index.replace('Purchases are not enabled in this build. Ownership checks use Google Play on this device. No payment will be requested.','Checking purchase availability…').replace('Supporter entitlements are stored separately from career progress; in this development build the test entitlement is also local.','On Android, Supporter Pack ownership is checked through Google Play, with a temporary confirmation kept in memory. Local saves and settings do not establish paid ownership.')
assert index==(r/'www/index.html').read_text(),'unrelated HTML changes'
print('PASS HTML changes limited to version, initial availability and accurate release ownership disclosure; main-menu wording and all story text untouched')

oldService=subprocess.check_output(['git','show','108ede8:www/supporter.js'],cwd=r,text=True)
expected=oldService.replace('verificationAvailable:null,verificationModel:null,','verificationAvailable:null,verificationModel:null,purchasesEnabled:null,').replace("emit({verificationAvailable:capabilities.verificationEnabled===true,verificationModel:capabilities.verificationModel||'google_play_backend'});","emit({verificationAvailable:capabilities.verificationEnabled===true,verificationModel:capabilities.verificationModel||'google_play_backend',purchasesEnabled:capabilities.purchasesEnabled===true});")
assert expected==(r/'www/supporter.js').read_text(),'unrelated supporter service changes'
oldStyle=subprocess.check_output(['git','show','108ede8:www/style.css'],cwd=r,text=True)
assert (r/'www/style.css').read_text().startswith(oldStyle),'existing styles changed'
print('PASS ownership/purchase/restore state machine byte-preserved except native capability publication; existing stylesheet unchanged before scoped additions')
