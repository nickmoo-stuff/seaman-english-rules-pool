from pathlib import Path
import subprocess
r=Path(__file__).resolve().parents[1]
allowed={'www/game.js','www/chapter4-runtime.js','www/index.html','www/sw.js','www/service-worker.js','www/README.txt','www/NATIVE-PACKAGING-READINESS.txt'}
names=subprocess.check_output(['git','ls-tree','-r','--name-only','928a82f','--','www','native-patches'],cwd=r,text=True).splitlines()
for name in names:
 old=subprocess.check_output(['git','show','928a82f:'+name],cwd=r);new=(r/name).read_bytes()
 if name not in allowed:assert old==new,name
 elif name in ['www/README.txt','www/NATIVE-PACKAGING-READINESS.txt']:
  assert b'0.17.61' in new and b'K6D' in new and b'native' in new,name
 elif name not in ['www/game.js','www/chapter4-runtime.js']:assert old.replace(b'0.17.60',b'0.17.61').replace(b'01760',b'01761').replace(b'1590',b'1591')==new,name
print('PASS protected artwork/audio/dialogue/physics/supporter service/native billing payload and version-only shell changes')

# The original selection/personality algorithm remains intact beneath the Vaper-only wrapper.
old=subprocess.check_output(['git','show','928a82f:www/game.js'],cwd=r,text=True)
new=(r/'www/game.js').read_text()
a=old.index('function aiChooseBasicShot(){');b=old.index('\nfunction ',a+1)
c=new.index('function aiChooseBasicShotBase(){');d=new.index('\nfunction ',c+1)
assert old[a:b].replace('function aiChooseBasicShot(){','function aiChooseBasicShotBase(){')==new[c:d]
print('PASS original AI shot-selection algorithm unchanged for every opponent')
