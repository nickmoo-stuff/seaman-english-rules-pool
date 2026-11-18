"""K6B native-only install/duplicate guards and unchanged disabled Java payload."""
import hashlib,os,runpy,shutil,subprocess,tempfile,zipfile
from pathlib import Path
root=Path(__file__).resolve().parents[1]
helpers=runpy.run_path(str(root/'tests/k6a-installer.py'))
fixture,put,snapshot=helpers['fixture'],helpers['put'],helpers['snapshot']
script=root/'native-patches/K6A/Install-SEAMEN-BILLING-K6A.ps1'
def install(project,installer=script,ok=True):
 r=subprocess.run([os.environ.get('PWSH','pwsh'),'-NoProfile','-File',str(installer),'-ProjectPath',str(project)],capture_output=True,text=True,timeout=25)
 assert (r.returncode==0)==ok,r.stdout+r.stderr
 return r.stdout+r.stderr
with tempfile.TemporaryDirectory(prefix='seamen-k6b-') as tmp:
 tmp=Path(tmp)
 project=tmp/'no web tree';fixture(project);shutil.rmtree(project/'www')
 gradle=project/'android/app/build.gradle';put(gradle,gradle.read_text()+"applicationId 'keep.existing.package'\n// Existing signing block and version values stay yours.\n")
 before=gradle.read_bytes();install(project);assert gradle.read_bytes()==before
 after=snapshot(project);assert 'already installed' in install(project);assert snapshot(project)==after
 print('PASS apply once before ordinary web-copy/sync/build: no www/source overlay needed, version/app/signing config unchanged, repeat run does nothing')
 for case in ['duplicate-java','duplicate-kotlin','duplicate-helper','duplicate-registration','commented-registration']:
  project=tmp/case;fixture(project)
  activity=project/'android/app/src/main/java/example/MainActivity.java'
  if case=='duplicate-registration':put(activity,activity.read_text().replace('super.load();','registerPlugin(com.seamenpool.billing.SeamenBillingPlugin.class);super.load();'))
  elif case=='commented-registration':put(activity,activity.read_text().replace('registerPlugin(com.seamenpool.billing.SeamenBillingPlugin.class);','/* registerPlugin(com.seamenpool.billing.SeamenBillingPlugin.class); */'))
  else:
   cls='SupporterBillingCore' if case=='duplicate-helper' else 'SeamenBillingPlugin'
   path=project/('android/app/src/debug/kotlin/extra/Copy.kt' if case=='duplicate-kotlin' else 'android/app/src/main/java/extra/Copy.java')
   put(path,'package com.seamenpool.billing'+('\nclass '+cls+' {}' if case=='duplicate-kotlin' else '; public class '+cls+' {}'))
  before=snapshot(project);output=install(project,ok=False);assert snapshot(project)==before
  assert 'Duplicate' in output or 'registration' in output,output
 print('PASS five duplicate/comment-only registration conflicts stop before writes')
 bundle=tmp/'standalone patch';bundle.mkdir()
 for p in script.parent.iterdir():
  if p.suffix in ['.java','.ps1','.json']:shutil.copy2(p,bundle/p.name)
 project=tmp/'standalone target';fixture(project);shutil.rmtree(project/'www');install(project,bundle/script.name)
 project=tmp/'unsafe bundled gate';fixture(project);policy=bundle/'PurchaseTestPolicy.java';put(policy,policy.read_text().replace('TEST_PURCHASES_ENABLED=false','TEST_PURCHASES_ENABLED=true'));before=snapshot(project);assert 'not OFF' in install(project,bundle/script.name,ok=False);assert snapshot(project)==before
 print('PASS standalone native folder without web files; altered enabled test-gate source refused without writes')
for p in script.parent.glob('*.java'):
 assert p.read_bytes()==subprocess.check_output(['git','show','822cd0d:native-patches/K6A/'+p.name],cwd=root),p.name
assert not subprocess.check_output(['git','diff','822cd0d','--','www','native-patches/K3H.1'],cwd=root)
print('PASS all five K6A Java sources and complete web/game/historical-native payload unchanged; debug gate OFF and release guard retained')
