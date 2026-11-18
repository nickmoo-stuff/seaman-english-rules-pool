"""Approved-source parity, actual failure cause, assets and offline inventory."""
from pathlib import Path
import hashlib,json,re,subprocess,sys
from urllib.parse import unquote,urlsplit
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'tools'))
from browser_projection import project
BUNDLE=ROOT/'releases/v1.0.0-b1595';SOURCE='f7a53ba'
def old(path):return subprocess.check_output(['git','show',SOURCE+':'+path],cwd=ROOT)
def digest(data):return hashlib.sha256(data).hexdigest()
oldManifest=json.loads(old('releases/v0.17.52-b1582/pwa-manifest.js').decode()[18:].rstrip(';\n'))
bad=[name for name,h in oldManifest['files'] if digest(old('index.html' if name=='./' else name))!=h]
assert bad==['index.html','./'],bad
assert b"build='v0.17.52-b1582'" in old('index.html')
assert b"releases/v0.17.52-b1582/pwa-manifest.js" in old('service-worker.js')
assert b"APP_VERSION='1.0.0'" in old('www/game.js')
print('PASS independently reproduced committed failure: stale old release target and both root launcher hashes differ')
names=subprocess.check_output(['git','ls-tree','-r','--name-only',SOURCE,'www'],cwd=ROOT,text=True).splitlines()
for name in names:
 relative=Path(name).relative_to('www');data=old(name)
 assert (ROOT/name).read_bytes()==data,'Published Android www changed: '+name
 expected=b"/* Browser release uses the verified root worker only. */\nimportScripts('../../service-worker.js');\n" if relative.name in {'service-worker.js','sw.js'} else project(str(relative),data)
 if relative.name=='manifest.webmanifest':expected=(ROOT/'manifest.webmanifest').read_bytes()
 assert (BUNDLE/relative).read_bytes()==expected,relative
 if relative.suffix in {'.js','.html','.css'}:
  s=expected.decode();refs=re.findall(r'''["'`]((?:\./)?assets/[^"'`]+)["'`]''',s)
  refs+=re.findall(r'''url\(["']?([^)'"\n]+)''',s) if relative.suffix=='.css' else []
  if relative.suffix=='.html':refs+=re.findall(r'''(?:src|href)=["']([^"']+)["']''',s)
  for ref in refs:
   if '$' in ref or urlsplit(ref).scheme or ref.startswith(('#','//')):continue
   assert (BUNDLE/unquote(urlsplit(ref).path)).exists(),(relative,ref)
assert {str(p.relative_to(BUNDLE)) for p in BUNDLE.rglob('*') if p.is_file()}=={str(Path(p).relative_to('www')) for p in names}|{'pwa-manifest.js','SHA256SUMS.txt'}
for line in (BUNDLE/'SHA256SUMS.txt').read_text().splitlines():
 h,name=line.split('  ',1);assert digest((BUNDLE/name).read_bytes())==h,name
p=json.loads((BUNDLE/'pwa-manifest.js').read_text()[18:].rstrip(';\n'))
assert b"build='v1.0.0-b1595'" in (ROOT/'index.html').read_bytes()
assert b"releases/v1.0.0-b1595/pwa-manifest.js" in (ROOT/'service-worker.js').read_bytes()
assert p['id']=='v1.0.0-b1595' and p['cache'].startswith('seamen-browser-v1.0.0-b1595-')
for name,h in p['files']:assert digest((ROOT/('index.html' if name=='./' else name)).read_bytes())==h,name
assert not any('/assets/music/' in n for n,_ in p['files'])
assert len(p['files'])==len(set(n for n,_ in p['files']))
for name in ['id','scope','start_url']:assert json.loads((ROOT/'manifest.webmanifest').read_text())[name]==json.loads(old('manifest.webmanifest'))[name]
for name in subprocess.check_output(['git','ls-tree','-r','--name-only',SOURCE,'releases/v0.17.52-b1582','native-patches'],cwd=ROOT,text=True).splitlines():assert (ROOT/name).read_bytes()==old(name),name
print('PASS',len(names),'approved files match explicit browser projection; all static asset paths resolve; all',len(p['files']),'offline hashes and checksums match; old release, Android www/native, PWA identity and entitlement source unchanged')
