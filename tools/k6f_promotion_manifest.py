"""Fingerprint a single release web tree; store hashes, never a second codebase."""
from pathlib import Path
import hashlib,re,json
METADATA={'game.js','index.html','sw.js','service-worker.js','README.txt','NATIVE-PACKAGING-READINESS.txt'}
TEXT={'.js','.css','.html','.txt','.json','.webmanifest','.svg'}
def neutral(name,text,release_build=1594):
 if name=='game.js':return re.sub(r'const APP_BUILD_NUMBER=(?:1593|'+str(release_build)+r');','const APP_BUILD_NUMBER=@BUILD@;',re.sub(r"const APP_VERSION='(?:0\.17\.63|1\.0\.0)';","const APP_VERSION='@VERSION@';",text))
 text=text.replace('0.17.63','@VERSION@').replace('1.0.0','@VERSION@')
 if name=='service-worker.js':text=text.replace('01763','@COMPACT@').replace('v100-','v@COMPACT@-')
 return re.sub(r'(?<!\d)(?:1593|'+str(release_build)+r')(?!\d)','@BUILD@',text)
def manifest(files):
 result={'schema':1,'candidateVersion':'0.17.63','candidateBuild':1593,'publicVersion':'1.0.0','defaultReleaseBuild':1594,'locallyObservedMaxBuild':1592,'playCodeAvailability':'unverified; user must confirm','files':{}}
 for name,raw in sorted(files.items()):
  is_text=Path(name).suffix in TEXT
  if is_text:
   value=raw.decode('utf-8-sig').replace('\r\n','\n')
   if name=='game.js':value=value.replace("const BUILD_MODE='development'","const BUILD_MODE='release'")
   digest=hashlib.sha256((neutral(name,value) if name in METADATA else value).encode()).hexdigest()
  else:digest=hashlib.sha256(raw).hexdigest()
  item={'text':is_text,'sha256':digest}
  if name in METADATA:item['candidateSha256']=hashlib.sha256(value.encode()).hexdigest()
  result['files'][name]=item
 assert METADATA<=set(result['files'])
 return result
if __name__=='__main__':
 root=Path(__file__).resolve().parents[1];data=manifest({str(p.relative_to(root/'www')):p.read_bytes() for p in (root/'www').rglob('*') if p.is_file()});(root/'release/K6F/promotion-baseline.json').write_text(json.dumps(data,indent=2)+'\n');print('Fingerprint inventory:',len(data['files']))
