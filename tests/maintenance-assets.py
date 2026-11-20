from pathlib import Path
import hashlib,json,re,subprocess,sys
r=Path(__file__).resolve().parents[1];sys.path.insert(0,str(r/'tools'));from browser_projection import project
cfg=json.loads((r/'release-config/v1.0.1.json').read_text());source=r.parent/'seamen-pool-development';bundle=r/'releases'/cfg['release'];commit=cfg['sourceCommit']
def digest(b):return hashlib.sha256(b).hexdigest()
files=subprocess.check_output(['git','ls-tree','-r','--name-only',commit,'www'],cwd=source,text=True).splitlines()
for name in files:
 rel=Path(name).relative_to('www');expected=subprocess.check_output(['git','show',commit+':'+name],cwd=source)
 expected=b"/* Browser release uses the verified root worker only. */\nimportScripts('../../service-worker.js');\n" if rel.name in ['sw.js','service-worker.js'] else project(str(rel),expected)
 if rel.name=='manifest.webmanifest':expected=(r/'manifest.webmanifest').read_bytes()
 assert (bundle/rel).read_bytes()==expected,rel
assert "APP_VERSION='1.0.1'" in (bundle/'game.js').read_text() and 'APP_BUILD_NUMBER=1596;' in (bundle/'game.js').read_text()
assert "BUILD_MODE='release'" in (bundle/'game.js').read_text()
for name in subprocess.check_output(['git','ls-tree','-r','--name-only','a3ce560','releases/v1.0.0-b1595','releases/v0.17.52-b1582','www','native-patches'],cwd=r,text=True).splitlines():assert (r/name).read_bytes()==subprocess.check_output(['git','show','a3ce560:'+name],cwd=r),name
print('PASS exact maintenance source projection;',len(files),'source files; all public v1.0.0/previous release and Android/native trees unchanged')
payload=json.loads((bundle/'pwa-manifest.js').read_text()[18:].rstrip(';\n'));assert payload['id']=='v1.0.1-b1596-qa2'
assert payload['cache'].startswith('seamen-browser-v1.0.1-b1596-qa2-')
for name,h in payload['files']:assert digest((r/('index.html' if name=='./' else name)).read_bytes())==h,name
for line in (bundle/'SHA256SUMS.txt').read_text().splitlines():
 h,name=line.split('  ',1);assert digest((bundle/name).read_bytes())==h,name
assert (r/'manifest.webmanifest').read_bytes()==subprocess.check_output(['git','show','a3ce560:manifest.webmanifest'],cwd=r)
for path in bundle.glob('*.js'):subprocess.run(['node','--check',str(path)],check=True)
for name in ['service-worker.js','sw.js']:subprocess.run(['node','--check',str(r/name)],check=True)
print('PASS',len(payload['files']),'offline hashes, release checksums, preserved PWA identity and all release/root JavaScript syntax')

for name in subprocess.check_output(['git','ls-tree','-r','--name-only','9d1ebd5','releases/v1.0.1-b1596'],cwd=r,text=True).splitlines():assert (r/name).read_bytes()==subprocess.check_output(['git','show','9d1ebd5:'+name],cwd=r),name
print('PASS previous QA1 same-version release remains byte-identical')
