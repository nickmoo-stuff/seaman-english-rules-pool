#!/usr/bin/env python3
"""Run K4 and approved-game regressions against source and a temporary release projection.
Start HTTP servers for www on port 8000 and /tmp/k4-release/www on 8013 first.
No native builds, purchases, publishing or deployments.
"""
from pathlib import Path
import concurrent.futures,json,os,shutil,subprocess,time,sys
root=Path(__file__).resolve().parents[1];out=root/'qa/K4/automated';out.mkdir(parents=True,exist_ok=True)
projection=Path('/tmp/k4-release/www');shutil.copytree(root/'www',projection,dirs_exist_ok=True)
p=projection/'game.js';p.write_text(p.read_text().replace("const BUILD_MODE='development'","const BUILD_MODE='release'"))
suites=['k4-consistency.py','k4.cjs','k4-ai.cjs','k4-audio.cjs','k4-entitlement.cjs','k4-mobile.cjs','k4-offline.cjs','supporter-service.cjs','supporter-ui.cjs','spin-physics.cjs','campaign-regression.cjs','theatre-readiness.cjs','story-reminder.cjs','mobile-table-first.cjs','lesson-three-hotfix.cjs','theatre-responsive.cjs','k4a1-dev-supporter.cjs','k4a2.cjs','k4a4.cjs','k4a4-artwork.py','k4a4-cutouts.cjs','unlock-all-pirates.cjs','k4b.cjs','k4b-assets.py']
requested=sys.argv[1:]
if requested:
 assert set(requested)<=set(suites),requested
 suites=requested
def run(suite):
 env={**os.environ,'TEST_URL':'http://127.0.0.1:'+('8013' if suite in ['k4-entitlement.cjs','lesson-three-hotfix.cjs'] else '8000')+'/'}
 env['RELEASE_TEST_URL']='http://127.0.0.1:8013/'
 if suite=='theatre-responsive.cjs':env['SCENE_PREFIX']='chapter_4_'
 cmd=['python' if suite.endswith('.py') else 'node','tests/'+suite];start=time.monotonic()
 try:
  result=subprocess.run(cmd,cwd=root,env=env,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True,timeout=240);code=result.returncode;output=result.stdout
 except subprocess.TimeoutExpired as e:code=124;output=str(e)
 (out/(suite+'.log')).write_text('Command: '+' '.join(cmd)+'\nTEST_URL='+env['TEST_URL']+'\nSCENE_PREFIX='+env.get('SCENE_PREFIX','')+'\n'+output)
 item={'suite':suite,'exitCode':code,'status':'PASS' if code==0 else 'FAIL','seconds':round(time.monotonic()-start,2)}
 print(item['status']+' '+suite,flush=True);return item
results=[run(suites[0])]
if results[0]['exitCode']==0:
 with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:results.extend(executor.map(run,suites[1:]))
if requested and (out/'results.json').exists():
 previous=json.loads((out/'results.json').read_text())['tests'];updates={x['suite']:x for x in results};results=[updates.pop(x['suite'],x) for x in previous]+list(updates.values())
(out/'results.json').write_text(json.dumps({'date':'2026-11-15','version':'0.17.59','build':1589,'tests':results,'limitations':['Chromium/Android emulation, not physical Android or iOS Safari','Native billing responses and media lifecycle use explicit mocks; no real Play transactions','Gameplay wins/planning tests use deterministic table fixtures resolved by the real engine','No external Android wrapper, SDK build or signing performed']},indent=2)+'\n')
raise SystemExit(1 if any(x['exitCode'] for x in results) else 0)
