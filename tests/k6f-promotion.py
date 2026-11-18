"""Version promotion on disposable wrapper fixtures, no real Android/Play actions."""
from pathlib import Path
import ast,os,subprocess,tempfile,json,hashlib,shutil,sys
r=Path(__file__).resolve().parents[1];sys.path.insert(0,str(r/'tools'));from k6f_promotion_manifest import manifest,METADATA
nodes=ast.parse((r/'tests/k6c2-gate.py').read_text());scope={'__file__':str(r/'tests/k6c2-gate.py')};exec(compile(ast.Module(body=[n for n in nodes.body if isinstance(n,(ast.Import,ast.ImportFrom,ast.Assign,ast.FunctionDef))],type_ignores=[]),'<fixtures>','exec'),scope)
fixture,put,snapshot,native=scope['fixture'],scope['put'],scope['snapshot'],scope['native'];pwsh=os.environ.get('PWSH','/tmp/k3f-pwsh/pwsh');checks=0
with tempfile.TemporaryDirectory(prefix='seamen-k6f-') as tmp:
 t=Path(tmp);bundle=t/'bundle';tool=bundle/'release/K6F/Promote-SEAMEN-Release.ps1';put(tool,(r/'release/K6F/Promote-SEAMEN-Release.ps1').read_bytes());shutil.copytree(r/'native-patches/K6E',bundle/'native-patches/K6E')
 files={name:(r/'www'/name).read_bytes() for name in METADATA};files['game.js']=files['game.js'].replace(b"const BUILD_MODE='development'",b"const BUILD_MODE='release'");files['unchanged.js']=b'const unchanged=true;\n'
 (tool.parent/'promotion-baseline.json').write_text(json.dumps(manifest(files)))
 def setup(p,bom=False):
  fixture(p,bom)
  for source in (r/'native-patches/K6E').glob('*.java'):put(p/native/source.name,source.read_bytes())
  put(p/'android/app/seamen-billing-release-guard.gradle',(r/'native-patches/K6E/seamen-billing-release-guard.gradle').read_bytes())
  f=p/'android/app/seamen-billing-foundation.gradle';put(f,f.read_text()+'\napply from: "$projectDir/seamen-billing-release-guard.gradle"\n')
  g=p/'android/app/build.gradle';put(g,g.read_text().replace("versionName '0.17.61'","versionName '0.17.63'").replace('versionCode 1591','versionCode 1593'))
  for prefix in ['www','android/app/src/main/assets/public']:
   for name,data in files.items():put(p/prefix/name,b'\xef\xbb\xbf'+data.replace(b'\n',b'\r\n') if bom else data)
  if bom:put(g,b'\xef\xbb\xbf'+g.read_bytes().replace(b'\n',b'\r\n'))
 def run(p,mode='Verify',ok=True,extra=(),code=1594):
  global checks
  args=[pwsh,'-NoProfile','-File',str(tool),'-Mode',mode,'-ProjectPath',str(p),'-ReleaseBuild',str(code),*extra];v=subprocess.run(args,capture_output=True,text=True,timeout=40);checks+=1;assert (v.returncode==0)==ok,v.stdout+v.stderr;return v.stdout
 approval=('-ApproveReleasePromotion','-VersionCodeConfirmedAvailable')
 for bom in [False,True]:
  p=t/('project with spaces '+str(bom));setup(p,bom);before=snapshot(p);run(p);assert snapshot(p)==before
  run(p,'Promote',False);assert snapshot(p)==before
  run(p,'Promote',extra=(*approval,'-WhatIf'));assert snapshot(p)==before
  run(p,'Promote',extra=approval);after=snapshot(p)
  changed={n for n in after if not n.startswith('.seamen-release-backups/') and before.get(n)!=after[n]};expected={'www/'+n for n in METADATA}|{'android/app/src/main/assets/public/'+n for n in METADATA}|{'android/app/build.gradle'};assert changed==expected,changed
  for prefix in ['www','android/app/src/main/assets/public']:
   game=(p/prefix/'game.js').read_text(encoding='utf-8-sig');assert "APP_VERSION='1.0.0'" in game and 'APP_BUILD_NUMBER=1594;' in game;assert '0.17.63' not in (p/prefix/'index.html').read_text(encoding='utf-8-sig')
  assert "versionName '1.0.0'" in (p/'android/app/build.gradle').read_text(encoding='utf-8-sig');run(p,'Promote',extra=approval);assert snapshot(p)==after;run(p);assert snapshot(p)==after
  run(p,'VerifyPublic',False);assert snapshot(p)==after
  prod=p/native/'ProductionPurchasePolicy.java';original=prod.read_bytes();put(prod,original.replace(b'PRODUCTION_PURCHASES_ENABLED=false;',b'PRODUCTION_PURCHASES_ENABLED=true;'));stable=snapshot(p);run(p,'VerifyPublic');assert snapshot(p)==stable;backup=next((p/'.seamen-release-backups').iterdir());run(p,'Rollback',False,('-BackupPath',str(backup)));assert snapshot(p)==stable;put(prod,original)
  backup=next((p/'.seamen-release-backups').iterdir());run(p,'Rollback',extra=('-BackupPath',str(backup)));rolled=snapshot(p)
  for name,h in before.items():assert rolled[name]==h,name
  run(p,'Rollback',extra=('-BackupPath',str(backup)));assert snapshot(p)==rolled
 print('PASS LF/BOM-CRLF promotion 13 metadata files, explicit approval, dry run, idempotence, public-source policy check, exact rollback and unchanged gameplay/native files',flush=True)
 for case in ['code','asset','mixed','dev','native-on','gradle','linked','lock','partial-failure','backup']:
  p=t/case;setup(p)
  if case=='code':pass
  elif case=='asset':put(p/'www/unchanged.js','altered')
  elif case=='mixed':put(p/'www/index.html',(p/'www/index.html').read_text().replace('0.17.63','1.0.0'))
  elif case=='dev':g=p/'www/game.js';put(g,g.read_text().replace("BUILD_MODE='release'","BUILD_MODE='development'"))
  elif case=='native-on':g=p/native/'PurchaseTestPolicy.java';put(g,g.read_text().replace('TEST_PURCHASES_ENABLED=false','TEST_PURCHASES_ENABLED=true'))
  elif case=='gradle':g=p/'android/app/build.gradle';put(g,g.read_text().replace('versionCode 1593','versionCode localCode'))
  elif case=='linked':g=p/'www/unchanged.js';g.unlink();target=t/'external.js';put(target,'const unchanged=true;\n');g.symlink_to(target)
  elif case=='lock':put(p/'.seamen-release.lock','another operation')
  elif case=='partial-failure':(p/'android/app').chmod(0o555)
  elif case=='backup':
   run(p,'Promote',extra=approval);backup=next((p/'.seamen-release-backups').iterdir());put(backup/'www/game.js','tampered')
  before=snapshot(p)
  try:
   run(p,'Rollback' if case=='backup' else 'Promote',False,('-BackupPath',str(backup)) if case=='backup' else approval,1593 if case=='code' else 1594)
   if case!='partial-failure':assert snapshot(p)==before,case
   else:
    for name,h in before.items():assert snapshot(p)[name]==h,name
    assert not (p/'.seamen-release.lock').exists()
  finally:
   if case=='partial-failure':(p/'android/app').chmod(0o755)
 print('PASS invalid code, altered assets/mixed versions/dev/native-ON/custom Gradle/linked files/lock/tampered backup refused; partial write failure restores all prior bytes',flush=True)
 p=t/'commented historical versions';setup(p);g=p/'android/app/build.gradle';comments="/*\nversionName 'old.example'\nversionCode 12\n*/\n";put(g,comments+g.read_text());run(p);run(p,'Promote',extra=approval);assert g.read_text().startswith(comments);assert "versionName '1.0.0'" in g.read_text()
 p=t/'higher available code';setup(p);run(p,'Promote',extra=approval,code=1595);assert 'APP_BUILD_NUMBER=1595;' in (p/'www/game.js').read_text();assert 'versionCode 1595' in (p/'android/app/build.gradle').read_text()
 # Exercise the shipped fingerprint manifest against the complete real web tree.
 p=t/'complete public tree';setup(p)
 full={str(path.relative_to(r/'www')):path.read_bytes() for path in (r/'www').rglob('*') if path.is_file()}
 full['game.js']=full['game.js'].replace(b"const BUILD_MODE='development'",b"const BUILD_MODE='release'")
 for prefix in ['www','android/app/src/main/assets/public']:
  for name,data in full.items():put(p/prefix/name,data)
 (tool.parent/'promotion-baseline.json').write_text(json.dumps(manifest(full)));run(p,'Promote',extra=approval);run(p)
 import http.server,threading,functools
 class Quiet(http.server.SimpleHTTPRequestHandler):
  def log_message(self,*args):pass
  def copyfile(self,source,output):
   try:super().copyfile(source,output)
   except (BrokenPipeError,ConnectionResetError):pass
 server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(p/'www')));threading.Thread(target=server.serve_forever,daemon=True).start()
 browserCode=r"""
const assert=require('node:assert/strict'),{chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{const c=await b.newContext(),p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.addInitScript(()=>localStorage.setItem('seamenCareer',JSON.stringify({schema:7,framesPlayed:11,shotsTaken:44})));await p.goto(process.env.PUBLIC_TEST_URL,{waitUntil:'networkidle'});await p.evaluate(()=>navigator.serviceWorker.ready);await p.waitForFunction(()=>navigator.serviceWorker.controller);assert.equal(await p.evaluate(()=>APP_VERSION),'1.0.0');assert.equal(await p.evaluate(()=>APP_BUILD_NUMBER),1594);assert.equal(await p.evaluate(()=>IS_DEVELOPMENT_BUILD),false);assert(await p.evaluate(async()=>(await caches.keys()).includes('seamen-pwa-v100-b1594')));await p.locator('#enterTavern').click();await p.waitForTimeout(2700);assert.match(await p.locator('#titleScreen').textContent(),/1\.0\.0/);assert.match(await p.locator('.game-menu-version').textContent(),/1\.0\.0.*1594/);assert.equal(await p.evaluate(()=>collectPortableSave().gameVersion),'1.0.0');assert.equal(await p.evaluate(()=>career.framesPlayed),11);await c.setOffline(true);await p.reload({waitUntil:'load'});assert.equal(await p.evaluate(()=>APP_VERSION),'1.0.0');assert.equal(await p.evaluate(()=>career.framesPlayed),11);assert.deepEqual(errors,[]);console.log('PASS complete promoted v1.0.0 web: browser boot, displayed version/build, release safeguards, save-version compatibility and offline cache/reload; no native transactions');}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
"""
 try:subprocess.run(['node','-e',browserCode],cwd=r,env={**os.environ,'PUBLIC_TEST_URL':'http://127.0.0.1:'+str(server.server_port)+'/'},check=True)
 finally:server.shutdown();server.server_close()
 print('PASS alternate confirmed release code 1595 supported without changing v1.0.0; '+str(checks)+' PowerShell assertions; no actual project, promotion, build or Play action',flush=True)
