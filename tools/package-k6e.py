#!/usr/bin/env python3
"""Create one clean, commit-labelled development source ZIP; never build/publish Android."""
from pathlib import Path
import hashlib,json,subprocess,sys,zipfile
root=Path(__file__).resolve().parents[1]
assert not subprocess.check_output(['git','status','--porcelain'],cwd=root,text=True).strip(),'Commit the candidate before packaging'
commit=subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip()
branch=subprocess.check_output(['git','branch','--show-current'],cwd=root,text=True).strip()
assert branch=='stage6-k6e-production-billing-rc'
files=subprocess.check_output(['git','ls-files','-z'],cwd=root).decode().split('\0')
payload={}
for name in files:
 if not name or name.startswith('downloads/') or name.endswith(('.zip','.bundle')):continue
 assert not any(name.lower().endswith(x) for x in ['.jks','.keystore','.pem','.key']),name
 payload[name]=(root/name).read_bytes()
assert b"APP_VERSION='0.17.62'" in payload['www/game.js']
assert b'APP_BUILD_NUMBER=1592;' in payload['www/game.js']
assert b"BUILD_MODE='development'" in payload['www/game.js']
payload['www/game.js']=payload['www/game.js'].replace(b"const BUILD_MODE='development'",b"const BUILD_MODE='release'")
assert b"BUILD_MODE='release'" in payload['www/game.js']
assert b'PRODUCTION_PURCHASES_ENABLED=false;' in payload['native-patches/K6E/ProductionPurchasePolicy.java']
assert b'TEST_PURCHASES_ENABLED=false;' in payload['native-patches/K6E/PurchaseTestPolicy.java']
expected=json.loads(payload['native-patches/K6E/approved-native-hashes.json'])
for name,digest in expected.items():
 assert hashlib.sha256(payload['native-patches/K6E/'+name].decode('utf-8-sig').replace('\r\n','\n').encode()).hexdigest()==digest,name
assert json.loads(payload['qa/K6E/results.json'])['counts']=={'PASS':57,'FAIL':0,'NOT TESTED':1}
assert b"const CAREER_KEY='seamenCareer',CAREER_SCHEMA=7;" in payload['www/game.js']
assert not any('seamen-billing-k6e-backups/' in name or name.startswith('node_modules/') for name in payload)

assert b'TEST_PURCHASES_ENABLED=false' in payload['native-patches/K6A/PurchaseTestPolicy.java']
assert b'ApplicationInfo.FLAG_DEBUGGABLE' in payload['native-patches/K6A/SeamenBillingPlugin.java']
payload['CANDIDATE.json']=(json.dumps({'baseline':'108ede8','milestone':'K6E','version':'0.17.62','build':1592,'branch':branch,'commit':commit,'mode':'release-mode web source candidate; native purchase defaults OFF','purchasesEnabled':False,'androidBuildPerformed':False,'deployed':False,'sourceBranchMode':'development','packagedWebMode':'release','versionCodeAvailability':'unverified','retainedToolCommit':'fc2c12d','productionActivationPerformed':False,'instructions':'docs/K6E/WINDOWS-INSTALL.md','qaReport':'docs/K6E/REPORT.md'},indent=2)+'\n').encode()
payload['SHA256SUMS.txt']=''.join(hashlib.sha256(data).hexdigest()+'  '+name+'\n' for name,data in sorted(payload.items())).encode()
out=Path(sys.argv[1]) if len(sys.argv)>1 else Path('/workspace/artifacts/K6E/SeamenPool-K6E-v0.17.62-build1592-release-candidate.zip')
out.parent.mkdir(parents=True,exist_ok=True)
with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for name,data in sorted(payload.items()):z.writestr(name,data)
with zipfile.ZipFile(out) as z:
 assert z.testzip() is None
 for name,data in payload.items():assert hashlib.sha256(z.read(name)).digest()==hashlib.sha256(data).digest(),name
checksum=hashlib.sha256(out.read_bytes()).hexdigest()
out.with_suffix('.zip.sha256').write_text(checksum+'  '+out.name+'\n')
print(json.dumps({'path':str(out),'bytes':out.stat().st_size,'commit':commit,'sha256':checksum,'files':len(payload),'integrity':'PASS'},indent=2))
