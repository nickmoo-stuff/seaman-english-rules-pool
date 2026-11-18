#!/usr/bin/env python3
"""Create one clean, commit-labelled development source ZIP; never build/publish Android."""
from pathlib import Path
import hashlib,json,subprocess,sys,zipfile
root=Path(__file__).resolve().parents[1]
assert not subprocess.check_output(['git','status','--porcelain'],cwd=root,text=True).strip(),'Commit the candidate before packaging'
commit=subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip()
branch=subprocess.check_output(['git','branch','--show-current'],cwd=root,text=True).strip()
assert branch=='stage6-k6a-google-play-billing'
files=subprocess.check_output(['git','ls-files','-z'],cwd=root).decode().split('\0')
payload={}
for name in files:
 if not name or name.startswith('downloads/') or name.endswith(('.zip','.bundle')):continue
 assert not any(name.lower().endswith(x) for x in ['.jks','.keystore','.pem','.key']),name
 payload[name]=(root/name).read_bytes()
assert b"APP_VERSION='0.17.60'" in payload['www/game.js']
assert b'APP_BUILD_NUMBER=1590;' in payload['www/game.js']
assert b"BUILD_MODE='development'" in payload['www/game.js']
assert b'TEST_PURCHASES_ENABLED=false' in payload['native-patches/K6A/PurchaseTestPolicy.java']
assert b'ApplicationInfo.FLAG_DEBUGGABLE' in payload['native-patches/K6A/SeamenBillingPlugin.java']
payload['CANDIDATE.json']=(json.dumps({'baseline':'8228903dbb50f5f3fd6418e872cb5bcf2e55fccd','milestone':'K6A','version':'0.17.60','build':1590,'branch':branch,'commit':commit,'mode':'development source','purchasesEnabled':False,'androidBuildPerformed':False,'deployed':False,'instructions':'docs/K6A/REPORT.md','qaReport':'docs/K6A/REPORT.md'},indent=2)+'\n').encode()
payload['SHA256SUMS.txt']=''.join(hashlib.sha256(data).hexdigest()+'  '+name+'\n' for name,data in sorted(payload.items())).encode()
out=Path(sys.argv[1]) if len(sys.argv)>1 else Path('/workspace/artifacts/K6A/SeamenPool-K6A-v0.17.60-build1590-source-candidate.zip')
out.parent.mkdir(parents=True,exist_ok=True)
with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for name,data in sorted(payload.items()):z.writestr(name,data)
with zipfile.ZipFile(out) as z:
 assert z.testzip() is None
 for name,data in payload.items():assert hashlib.sha256(z.read(name)).digest()==hashlib.sha256(data).digest(),name
checksum=hashlib.sha256(out.read_bytes()).hexdigest()
out.with_suffix('.zip.sha256').write_text(checksum+'  '+out.name+'\n')
print(json.dumps({'path':str(out),'bytes':out.stat().st_size,'commit':commit,'sha256':checksum,'files':len(payload),'integrity':'PASS'},indent=2))
