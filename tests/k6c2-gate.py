"""Disposable wrapper fixtures only. Never builds an APK or contacts Play."""
from pathlib import Path
import os,subprocess,tempfile,json,hashlib,shutil
r=Path(__file__).resolve().parents[1];tool=r/'native-patches/K6C2/Set-SEAMEN-BillingTestGate.ps1';pwsh=os.environ.get('PWSH','/tmp/k3f-pwsh/pwsh');native='android/app/src/main/java/com/seamenpool/billing/';checks=0

def put(path,data):
 path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes(data.encode() if isinstance(data,str) else data)
def fixture(p,bom=False):
 for n in ['core','android']:put(p/f'node_modules/@capacitor/{n}/package.json','{"version":"8.5.2"}')
 put(p/'android/app/build.gradle',"apply from: 'seamen-billing-foundation.gradle'\nandroid {\n defaultConfig { applicationId 'com.seamenpool.game'\n versionCode 1591\n versionName '0.17.61' }\n buildTypes {\n debug { debuggable true }\n release { debuggable false\n minifyEnabled false }\n }\n}\n")
 put(p/'android/app/seamen-billing-foundation.gradle',"dependencies { implementation('com.android.billingclient:billing:9.1.0') }")
 put(p/'android/variables.gradle','ext { minSdkVersion = 24 }')
 put(p/'android/app/src/main/java/example/MainActivity.java','class MainActivity { void load(){registerPlugin(com.seamenpool.billing.SeamenBillingPlugin.class);super.load();}}')
 put(p/'android/app/src/main/AndroidManifest.xml','<manifest xmlns:android="http://schemas.android.com/apk/res/android"><uses-permission android:name="com.android.vending.BILLING"/><uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED"/><application><service android:name="com.seamenpool.billing.BillingRetryJob" android:permission="android.permission.BIND_JOB_SERVICE" android:exported="true"/></application></manifest>')
 for source in (r/'native-patches/K6A').glob('*.java'):
  data=source.read_bytes();put(p/native/source.name,b'\xef\xbb\xbf'+data.replace(b'\n',b'\r\n') if bom else data)
 put(p/'www/game.js',(r/'www/game.js').read_bytes());put(p/'capacitor.config.json','{"appId":"com.seamenpool.game"}');put(p/'signing-placeholder.txt','existing unrelated configuration')
def snapshot(p):return {str(f.relative_to(p)):hashlib.sha256(f.read_bytes()).hexdigest() for f in p.rglob('*') if f.is_file()}
def run(p,mode='EnableDebug',variant='Debug',ok=True,extra=()):
 global checks
 v=subprocess.run([pwsh,'-NoProfile','-File',str(tool),'-ProjectPath',str(p),'-Mode',mode,'-BuildVariant',variant,*extra],capture_output=True,text=True,timeout=30)
 assert (v.returncode==0)==ok,v.stdout+v.stderr;checks+=1;return v.stdout+v.stderr
def policy(p):return p/native/'PurchaseTestPolicy.java'
def jvm(p,enabled,tmp):
 package=tmp/'jvm/com/seamenpool/billing';put(package/'PurchaseTestPolicy.java',policy(p).read_text(encoding='utf-8-sig'));put(package/'GateProbe.java','package com.seamenpool.billing; public class GateProbe { public static void main(String[] args) { if(PurchaseTestPolicy.enabled(false)) throw new AssertionError("release permitted"); if(PurchaseTestPolicy.enabled(true)!='+str(enabled).lower()+') throw new AssertionError("debug state"); }}');dest=tmp/'classes';subprocess.run(['java','-jar',os.environ.get('ECJ_JAR','/tmp/k3g-java/ecj.jar'),'-17','-warn:none','-d',str(dest),str(package/'PurchaseTestPolicy.java'),str(package/'GateProbe.java')],check=True,capture_output=True);subprocess.run(['java','-cp',str(dest),'com.seamenpool.billing.GateProbe'],check=True)
with tempfile.TemporaryDirectory(prefix='seamen-k6c2-') as directory:
 t=Path(directory)
 for bom in [False,True]:
  p=t/('wrapper with spaces '+str(bom));fixture(p,bom);initial=snapshot(p);original=policy(p).read_bytes();run(p,extra=('-WhatIf',));assert snapshot(p)==initial
  run(p);on=snapshot(p);assert policy(p).read_bytes()==original.replace(b'TEST_PURCHASES_ENABLED=false;',b'TEST_PURCHASES_ENABLED=true;');assert {n for n in on if not n.startswith('.seamen-billing-test-backups/') and initial.get(n)!=on[n]}=={native+'PurchaseTestPolicy.java'}
  backups=sorted((p/'.seamen-billing-test-backups').iterdir());assert len(backups)==1;assert (backups[0]/'PurchaseTestPolicy.java').read_bytes()==original;assert json.loads((backups[0]/'operation.json').read_text())['configuration']=='authorised-debug-licence-test'
  run(p);assert snapshot(p)==on;jvm(p,True,t/('probe-on-'+str(bom)))
  run(p,'Off','Release',extra=('-WhatIf',));assert snapshot(p)==on
  run(p,'Off','Release');assert policy(p).read_bytes()==original;off=snapshot(p);assert len(list((p/'.seamen-billing-test-backups').iterdir()))==2
  for name,digest in initial.items():assert off[name]==digest,name
  run(p,'Off','Release');assert snapshot(p)==off;jvm(p,False,t/('probe-off-'+str(bom)))
 print('PASS OFF -> debug-test ON -> OFF, idempotent both modes, exact backups, LF/BOM-CRLF preserved; JVM ON admits debug only and OFF blocks both',flush=True)
 cases=['sdk','backup-link','release','wrong-version','wrong-package','suffix','flavours','foundation','release-gradle','dynamic-gradle','release-manifest','main-manifest','missing-permission','service','registration','duplicate-java','duplicate-kotlin','utf16','utf32','linked-source','lock']+[p.name for p in (r/'native-patches/K6A').glob('*.java')]
 for case in cases:
  p=t/case;fixture(p);gradle=p/'android/app/build.gradle';manifest=p/'android/app/src/main/AndroidManifest.xml'
  if case=='sdk':put(p/'android/variables.gradle','minSdkVersion = 23')
  elif case=='backup-link':(t/'backup-external').mkdir(exist_ok=True);(p/'.seamen-billing-test-backups').symlink_to(t/'backup-external',target_is_directory=True)
  elif case=='wrong-version':put(p/'node_modules/@capacitor/core/package.json','{"version":"9.0.0"}')
  elif case=='wrong-package':put(gradle,gradle.read_text().replace('com.seamenpool.game','wrong.package'))
  elif case=='suffix':put(gradle,gradle.read_text()+"\napplicationIdSuffix '.debug'\n")
  elif case=='flavours':put(gradle,gradle.read_text()+'\nproductFlavors {}\n')
  elif case=='foundation':put(p/'android/app/seamen-billing-foundation.gradle','wrong')
  elif case=='release-gradle':put(gradle,gradle.read_text().replace('release { debuggable false','release { debuggable true'))
  elif case=='dynamic-gradle':put(gradle,gradle.read_text().replace('release { debuggable false','release { debuggable project.hasProperty("something")'))
  elif case=='release-manifest':put(p/'android/app/src/release/AndroidManifest.xml','<manifest xmlns:android="http://schemas.android.com/apk/res/android"><application android:debuggable="true"/></manifest>')
  elif case=='main-manifest':put(manifest,manifest.read_text().replace('<application>','<application android:debuggable="true">'))
  elif case=='missing-permission':put(manifest,manifest.read_text().replace('com.android.vending.BILLING','wrong.permission'))
  elif case=='service':put(manifest,manifest.read_text().replace('android.permission.BIND_JOB_SERVICE','wrong.permission'))
  elif case=='registration':put(p/'android/app/src/main/java/example/MainActivity.java','// registerPlugin(com.seamenpool.billing.SeamenBillingPlugin.class);')
  elif case.startswith('duplicate-'):put(p/('android/app/src/debug/java/Copy.java' if case=='duplicate-java' else 'android/app/src/debug/kotlin/Copy.kt'),'package com.seamenpool.billing; class PurchaseTestPolicy {}')
  elif case=='utf16':put(policy(p),policy(p).read_text().encode('utf-16'))
  elif case=='utf32':put(policy(p),b'\x00\x00\xfe\xff'+policy(p).read_text().encode('utf-32-be'))
  elif case=='linked-source':(p/'android/app/src/main/java/link').symlink_to(t/'external',target_is_directory=True);(t/'external').mkdir(exist_ok=True)
  elif case=='lock':put(p/'.seamen-billing-test.lock','another operation')
  elif case.endswith('.java'):put(p/native/case,(p/native/case).read_text()+'// unexpected change\n')
  before=snapshot(p);run(p,variant='Release' if case=='release' else 'Debug',ok=False);assert snapshot(p)==before,case
 print('PASS '+str(len(cases))+' release/unexpected source/configuration/link/lock cases rejected without writes',flush=True)
 # OFF also refuses to overwrite an unexpected edited ON policy.
 p=t/'unknown ON policy';fixture(p);run(p);put(policy(p),policy(p).read_text()+'// unexpected edit\n');before=snapshot(p);run(p,'Off','Release',ok=False);assert snapshot(p)==before
 print('PASS OFF rejects an unrecognised edited ON source without overwriting it',flush=True)
 # Missing explicit debug intent must fail too.
 p=t/'no explicit debug';fixture(p);v=subprocess.run([pwsh,'-NoProfile','-File',str(tool),'-Mode','EnableDebug','-ProjectPath',str(p)],capture_output=True,text=True);assert v.returncode!=0;assert not (p/'.seamen-billing-test-backups').exists()
 # A failed write after preflight keeps the original and its backup.
 p=t/'write failure';fixture(p);original=policy(p).read_bytes();parent=policy(p).parent;parent.chmod(0o555)
 try:run(p,ok=False);assert policy(p).read_bytes()==original;assert not (p/'.seamen-billing-test.lock').exists();assert len(list((p/'.seamen-billing-test-backups').iterdir()))==1
 finally:parent.chmod(0o755)
 print('PASS omitted debug intent refused; forced write failure preserves source/backup and releases operation lock',flush=True)
 for directory in ['native-patches/K6A','native-patches/K3H.1']:
  assert not subprocess.check_output(['git','diff','108ede8','--',directory],cwd=r),directory
 print('PASS historical native baseline untouched (K6E web changes audited separately); no Android build, install, upload, payment or Play query; '+str(checks)+' PowerShell operation assertions',flush=True)
