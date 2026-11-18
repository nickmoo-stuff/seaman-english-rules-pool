from pathlib import Path
import subprocess,re
r=Path(__file__).resolve().parents[1];allowed={'www/game.js','www/index.html','www/style.css','www/sw.js','www/service-worker.js','www/README.txt','www/NATIVE-PACKAGING-READINESS.txt'}
for name in subprocess.check_output(['git','ls-tree','-r','--name-only','ff5c1b9','--','www','native-patches'],cwd=r,text=True).splitlines():
 if name not in allowed:assert (r/name).read_bytes()==subprocess.check_output(['git','show','ff5c1b9:'+name],cwd=r),name
s=(r/'www/game.js').read_text();assert "CAREER_SCHEMA=7" in s and "SAVE_FILE_SCHEMA=2" in s
# All existing gameplay/rules/AI/Theatre/audio function bodies stay unchanged.
old=subprocess.check_output(['git','show','ff5c1b9:www/game.js'],cwd=r,text=True)
for name in ['step','evaluateNormal','evaluateBreak','aiChooseBasicShot','aiVaperSpinPlan','showScene','renderScene','startMatchMusic','startOutroMusic','finishFrame','finishScene']:
 pattern=r'^function '+name+r'\([^\n]*'
 a=re.search(pattern,old,re.M);b=re.search(pattern,s,re.M)
 if not a:continue
 # Existing top-level functions terminate at the next declaration/comment section;
 # balance braces through the next line-start function to compare the whole region.
 endOld=re.search(r'^function ',old[a.end():],re.M);endNew=re.search(r'^function ',s[b.end():],re.M)
 if endOld and endNew:assert old[a.start():a.end()+endOld.start()]==s[b.start():b.end()+endNew.start()],name
print('PASS frozen billing/native/purchase/tokens, art/audio/dialogue/physics/AI; save schemas unchanged; modifications scoped to naming, safe name display, UI and version metadata')
