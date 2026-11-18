#!/usr/bin/env python3
"""Create one clean, commit-labelled development source ZIP; never build/publish Android."""
from pathlib import Path
import hashlib,json,subprocess,sys,zipfile
root=Path(__file__).resolve().parents[1]
assert not subprocess.check_output(['git','status','--porcelain'],cwd=root,text=True).strip(),'Commit the candidate before packaging'
commit=subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip()
branch=subprocess.check_output(['git','branch','--show-current'],cwd=root,text=True).strip()
assert branch=='stage6-k6f-final-release-preparation'
files=subprocess.check_output(['git','ls-files','-z'],cwd=root).decode().split('\0')
payload={}
for name in files:
 if not name or name.startswith('downloads/') or name.endswith(('.zip','.bundle')):continue
 assert not any(name.lower().endswith(x) for x in ['.jks','.keystore','.pem','.key','.p12','.pfx']),name
 payload[name]=(root/name).read_bytes()
assert b"APP_VERSION='0.17.63'" in payload['www/game.js']
assert b'APP_BUILD_NUMBER=1593;' in payload['www/game.js']
assert b"BUILD_MODE='development'" in payload['www/game.js']
payload['www/game.js']=payload['www/game.js'].replace(b"const BUILD_MODE='development'",b"const BUILD_MODE='release'")
assert b"BUILD_MODE='release'" in payload['www/game.js']
assert b'PRODUCTION_PURCHASES_ENABLED=false;' in payload['native-patches/K6E/ProductionPurchasePolicy.java']
assert b'TEST_PURCHASES_ENABLED=false;' in payload['native-patches/K6E/PurchaseTestPolicy.java']
expected=json.loads(payload['native-patches/K6E/approved-native-hashes.json'])
for name,digest in expected.items():
 assert hashlib.sha256(payload['native-patches/K6E/'+name].decode('utf-8-sig').replace('\r\n','\n').encode()).hexdigest()==digest,name
assert json.loads(payload['qa/K6F/results.json'])['counts']=={'PASS':59,'FAIL':0,'NOT TESTED':1}
assert b"const CAREER_KEY='seamenCareer',CAREER_SCHEMA=7;" in payload['www/game.js']
assert not any('seamen-billing-k6e-backups/' in name or name.startswith('node_modules/') for name in payload)

assert b'TEST_PURCHASES_ENABLED=false' in payload['native-patches/K6A/PurchaseTestPolicy.java']
assert b'ApplicationInfo.FLAG_DEBUGGABLE' in payload['native-patches/K6A/SeamenBillingPlugin.java']
from k6f_promotion_manifest import manifest
expectedPromotion=manifest({name.removeprefix('www/'):data for name,data in payload.items() if name.startswith('www/')})
assert json.loads(payload['release/K6F/promotion-baseline.json'])==expectedPromotion,'promotion fingerprints drifted'
assert b"APP_VERSION='1.0.0'" not in payload['www/game.js'],'candidate accidentally promoted'
payload['CANDIDATE.json']=(json.dumps({'baseline':'c2f1eaa','milestone':'K6F','version':'0.17.63','build':1593,'branch':branch,'commit':commit,'mode':'unpromoted final candidate; release-mode web and both native purchase defaults OFF','purchasesEnabled':False,'androidBuildPerformed':False,'deployed':False,'sourceBranchMode':'development','packagedWebMode':'release','versionCodeAvailability':'unverified','retainedToolCommit':'fc2c12d','productionActivationPerformed':False,'actualProjectPromoted':False,'publicTargetVersion':'1.0.0','proposedPublicBuild':1594,'publicCodeAvailability':'user must confirm in Play Console','promotionTool':'release/K6F/Promote-SEAMEN-Release.ps1','instructions':'docs/K6F/RELEASE-STEPS.md','qaReport':'docs/K6F/REPORT.md'},indent=2)+'\n').encode()
payload['SHA256SUMS.txt']=''.join(hashlib.sha256(data).hexdigest()+'  '+name+'\n' for name,data in sorted(payload.items())).encode()
out=Path(sys.argv[1]) if len(sys.argv)>1 else Path('/workspace/artifacts/K6F/SeamenPool-K6F-v0.17.63-build1593-to-v1.0.0-build1594.zip')
out.parent.mkdir(parents=True,exist_ok=True)
with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for name,data in sorted(payload.items()):z.writestr(name,data)
with zipfile.ZipFile(out) as z:
 assert z.testzip() is None
 for name,data in payload.items():assert hashlib.sha256(z.read(name)).digest()==hashlib.sha256(data).digest(),name
checksum=hashlib.sha256(out.read_bytes()).hexdigest()
out.with_suffix('.zip.sha256').write_text(checksum+'  '+out.name+'\n')
print(json.dumps({'path':str(out),'bytes':out.stat().st_size,'commit':commit,'sha256':checksum,'files':len(payload),'integrity':'PASS'},indent=2))
