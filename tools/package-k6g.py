#!/usr/bin/env python3
"""Create one clean, commit-labelled development source ZIP; never build/publish Android."""
from pathlib import Path
import hashlib,json,subprocess,sys,zipfile
root=Path(__file__).resolve().parents[1]
assert not subprocess.check_output(['git','status','--porcelain'],cwd=root,text=True).strip(),'Commit the candidate before packaging'
commit=subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip()
branch=subprocess.check_output(['git','branch','--show-current'],cwd=root,text=True).strip()
assert branch=='stage6-k6g-player-name-persistence'
files=subprocess.check_output(['git','ls-files','-z'],cwd=root).decode().split('\0')
payload={}
for name in files:
 if not name or name.startswith('downloads/') or name.endswith(('.zip','.bundle')):continue
 assert not any(name.lower().endswith(x) for x in ['.jks','.keystore','.pem','.key','.p12','.pfx']),name
 payload[name]=(root/name).read_bytes()
assert b"APP_VERSION='1.0.0'" in payload['www/game.js']
assert b'APP_BUILD_NUMBER=1595;' in payload['www/game.js']
assert b"BUILD_MODE='development'" in payload['www/game.js']
payload['www/game.js']=payload['www/game.js'].replace(b"const BUILD_MODE='development'",b"const BUILD_MODE='release'")
assert b"BUILD_MODE='release'" in payload['www/game.js']
assert b'PRODUCTION_PURCHASES_ENABLED=false;' in payload['native-patches/K6E/ProductionPurchasePolicy.java']
assert b'TEST_PURCHASES_ENABLED=false;' in payload['native-patches/K6E/PurchaseTestPolicy.java']
expected=json.loads(payload['native-patches/K6E/approved-native-hashes.json'])
for name,digest in expected.items():
 assert hashlib.sha256(payload['native-patches/K6E/'+name].decode('utf-8-sig').replace('\r\n','\n').encode()).hexdigest()==digest,name
assert json.loads(payload['qa/K6G/results.json'])['counts']=={'PASS':10,'FAIL':0,'NOT TESTED':0}
assert b"const CAREER_KEY='seamenCareer',CAREER_SCHEMA=7;" in payload['www/game.js']
assert not any('seamen-billing-k6e-backups/' in name or name.startswith('node_modules/') for name in payload)

assert b'TEST_PURCHASES_ENABLED=false' in payload['native-patches/K6A/PurchaseTestPolicy.java']
assert b'ApplicationInfo.FLAG_DEBUGGABLE' in payload['native-patches/K6A/SeamenBillingPlugin.java']
payload['CANDIDATE.json']=(json.dumps({'baseline':'ff5c1b9','milestone':'K6G','version':'1.0.0','build':1595,'branch':branch,'commit':commit,'sourceBranchMode':'development','packagedWebMode':'release','androidBuildPerformed':False,'deployed':False,'productionActivationPerformed':False,'versionCodeAvailability':'unverified: confirm 1595 is unused before upload','nativeUpdateRequired':False,'instructions':'docs/K6G/REPORT.md','warning':'Apply www only; preserve existing local native billing policy. Do not run historical K6F promotion.'},indent=2)+'\n').encode()
payload['SHA256SUMS.txt']=''.join(hashlib.sha256(data).hexdigest()+'  '+name+'\n' for name,data in sorted(payload.items())).encode()
out=Path(sys.argv[1]) if len(sys.argv)>1 else Path('/workspace/artifacts/K6G/SeamenPool-K6G-v1.0.0-build1595-player-name-correction.zip')
out.parent.mkdir(parents=True,exist_ok=True)
with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for name,data in sorted(payload.items()):z.writestr(name,data)
with zipfile.ZipFile(out) as z:
 assert z.testzip() is None
 for name,data in payload.items():assert hashlib.sha256(z.read(name)).digest()==hashlib.sha256(data).digest(),name
checksum=hashlib.sha256(out.read_bytes()).hexdigest()
out.with_suffix('.zip.sha256').write_text(checksum+'  '+out.name+'\n')
print(json.dumps({'path':str(out),'bytes':out.stat().st_size,'commit':commit,'sha256':checksum,'files':len(payload),'integrity':'PASS'},indent=2))
