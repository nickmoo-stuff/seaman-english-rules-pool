"""Check candidate metadata, approved source bytes, caches and untouched native billing."""
from pathlib import Path
import hashlib,json,re,subprocess
root=Path(__file__).resolve().parents[1]
game=(root/'www/game.js').read_text()
assert "APP_VERSION='1.0.0'" in game and 'APP_BUILD_NUMBER=1595;' in game
assert "BUILD_MODE='development'" in game or "BUILD_MODE='release'" in game
for name in ['index.html','README.txt','NATIVE-PACKAGING-READINESS.txt','sw.js','service-worker.js']:
 text=(root/'www'/name).read_text()
 assert '0.17.52' not in text and '01752' not in text and '1582' not in text,name
 assert '1.0.0' in text or '100' in text,name
index=(root/'www/index.html').read_text()
for ref in re.findall(r'''(?:src|href)=["']([^"']+)["']''',index):
 if ref.startswith(('#','http','mailto:','data:')):continue
 assert (root/'www'/ref.removeprefix('./')).exists(),ref
manifest=json.loads((root/'docs/K4/asset-manifest.json').read_text())
for entry in manifest['assets']+[manifest['soundtrack']]:
 raw=(root/'www/assets/k4'/entry['file']).read_bytes()
 assert hashlib.sha256(raw).hexdigest()==entry['sha256'],entry['file']
 for worker in ['sw.js','service-worker.js']:assert entry['file'] in (root/'www'/worker).read_text()
for file in ['SeamenBillingPlugin.java','SupporterBillingCore.java','PlayBillingClient.java','BillingRetryJob.java']:
 rel='native-patches/K3H.1/'+file
 assert (root/rel).read_bytes()==subprocess.check_output(['git','show','aa7023364d48bf5d2c673b9aa9426f0089821ea0:'+rel],cwd=root)
assert 'PURCHASES_ENABLED=false' in (root/'native-patches/K3H.1/SeamenBillingPlugin.java').read_text()
assert 'const CAREER_KEY=\'seamenCareer\',CAREER_SCHEMA=7;' in game
before=(root/'www/chapter4.js').read_bytes()
subprocess.run(['python',str(root/'tools/build-k4-dialogue.py')],cwd=root,check=True)
assert (root/'www/chapter4.js').read_bytes()==before,'catalogue regeneration differs'
for file in (root/'www').glob('*.js'):subprocess.run(['node','--check',str(file)],check=True)
subprocess.run(['git','diff','--check'],cwd=root,check=True)
print('PASS version/build, local HTML dependencies, approved asset hashes/cache inventory, deterministic dialogue rebuild, save schema, unchanged purchases-disabled native sources, all JavaScript syntax and diff whitespace')
