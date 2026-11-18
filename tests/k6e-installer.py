"""K6E fixture-only installer/policy/rollback tests; never uses an actual wrapper."""
from pathlib import Path
import ast,os,subprocess,tempfile,json,hashlib
r=Path(__file__).resolve().parents[1]
# Reuse fixture definitions without executing the historical K6C2 test body.
nodes=ast.parse((r/'tests/k6c2-gate.py').read_text());defs=[n for n in nodes.body if isinstance(n,(ast.Import,ast.ImportFrom,ast.Assign,ast.FunctionDef))];scope={'__file__':str(r/'tests/k6c2-gate.py')};exec(compile(ast.Module(body=defs,type_ignores=[]),'<fixture definitions>','exec'),scope)
fixture,put,snapshot=scope['fixture'],scope['put'],scope['snapshot'];native=scope['native'];script=r/'native-patches/K6E/Manage-SEAMEN-Billing.ps1';pwsh=os.environ.get('PWSH','/tmp/k3f-pwsh/pwsh');checks=0

def run(p,mode='Install',ok=True,extra=()):
 global checks
 v=subprocess.run([pwsh,'-NoProfile','-File',str(script),'-Mode',mode,'-ProjectPath',str(p),*extra],capture_output=True,text=True,timeout=40);checks+=1;assert (v.returncode==0)==ok,v.stdout+v.stderr;return v.stdout
with tempfile.TemporaryDirectory(prefix='seamen-k6e-') as directory:
 t=Path(directory)
 for bom in [False,True]:
  p=t/('wrapper '+str(bom));fixture(p,bom);foundation=p/'android/app/seamen-billing-foundation.gradle'
  if bom:put(foundation,b'\xef\xbb\xbf'+foundation.read_bytes().replace(b'\n',b'\r\n'))
  before=snapshot(p);run(p,extra=('-WhatIf',));assert snapshot(p)==before
  run(p);after=snapshot(p);changed={n for n in after if not n.startswith('.seamen-billing-k6e-backups/') and before.get(n)!=after[n]};assert changed=={native+'SeamenBillingPlugin.java',native+'ProductionPurchasePolicy.java','android/app/seamen-billing-release-guard.gradle','android/app/seamen-billing-foundation.gradle'}
  installBackup=next((p/'.seamen-billing-k6e-backups').iterdir());run(p);assert snapshot(p)==after
  run(p,'EnableProduction',False);assert snapshot(p)==after
  run(p,'EnableDebug',False,('-BuildVariant','Release'));assert snapshot(p)==after
  run(p,'EnableDebug',extra=('-BuildVariant','Debug'));assert 'TEST_PURCHASES_ENABLED=true;' in (p/native/'PurchaseTestPolicy.java').read_text();assert 'PRODUCTION_PURCHASES_ENABLED=false;' in (p/native/'ProductionPurchasePolicy.java').read_text()
  stable=snapshot(p);run(p,'EnableDebug',extra=('-BuildVariant','Debug'));assert snapshot(p)==stable
  run(p,'EnableProduction',False,('-ApproveProductionActivation',));assert snapshot(p)==stable
  run(p,'Install',False);assert snapshot(p)==stable
  run(p,'Off');off=snapshot(p);run(p,'Off');assert snapshot(p)==off
  run(p,'EnableProduction',False,('-ApproveProductionActivation',));assert snapshot(p)==off # dev/unsynced web is rejected
  web=(r/'www/game.js').read_text().replace("const BUILD_MODE='development'","const BUILD_MODE='release'");put(p/'www/game.js',web);put(p/'android/app/src/main/assets/public/game.js',web)
  run(p,'EnableProduction',False,('-ApproveProductionActivation','-BuildVariant','Debug'))
  run(p,'EnableProduction',extra=('-ApproveProductionActivation','-BuildVariant','Release'));assert 'PRODUCTION_PURCHASES_ENABLED=true;' in (p/native/'ProductionPurchasePolicy.java').read_text();assert 'TEST_PURCHASES_ENABLED=false;' in (p/native/'PurchaseTestPolicy.java').read_text()
  stable=snapshot(p);run(p,'EnableProduction',extra=('-ApproveProductionActivation','-BuildVariant','Release'));assert snapshot(p)==stable
  run(p,'EnableDebug',False,('-BuildVariant','Debug'));assert snapshot(p)==stable
  run(p,'Off');run(p,'Rollback',extra=('-BackupPath',str(installBackup)));assert not (p/native/'ProductionPurchasePolicy.java').exists()
  rolled=snapshot(p);run(p,'Rollback',extra=('-BackupPath',str(installBackup)));assert snapshot(p)==rolled
  for name,digest in before.items():
   if name!='www/game.js':assert snapshot(p)[name]==digest,name
 print('PASS LF/BOM-CRLF: install/idempotence; debug/production separate opt-ins; default/unsynced/release conflicts refused; OFF; exact rollback/idempotence',flush=True)
 for case in ['source','duplicate','release-debug','bundle-on','backup-tamper','failure','partial-failure']:
  p=t/case;fixture(p);run(p);old=snapshot(p)
  if case=='source':put(p/native/'SupporterBillingCore.java','unexpected')
  elif case=='duplicate':put(p/'android/app/src/debug/Copy.java','package com.seamenpool.billing; class ProductionPurchasePolicy {}')
  elif case=='release-debug':g=p/'android/app/build.gradle';put(g,g.read_text().replace('release { debuggable false','release { debuggable true'))
  elif case=='backup-tamper':backup=next((p/'.seamen-billing-k6e-backups').iterdir());put(backup/'SeamenBillingPlugin.java','tampered')
  elif case=='bundle-on':
   import shutil
   bundle=t/'altered-bundle';shutil.copytree(script.parent,bundle);policy=bundle/'ProductionPurchasePolicy.java';put(policy,policy.read_text().replace('PRODUCTION_PURCHASES_ENABLED=false','PRODUCTION_PURCHASES_ENABLED=true'));saved=script;script=bundle/script.name
  elif case in ['failure','partial-failure']:
   run(p,'Rollback',extra=('-BackupPath',str(next((p/'.seamen-billing-k6e-backups').iterdir()))));old=snapshot(p);parent=(p/'android/app') if case=='partial-failure' else (p/native);parent.chmod(0o555)
  expected=snapshot(p)
  try:
   run(p,'Rollback' if case=='backup-tamper' else 'Install' if case in ['failure','partial-failure'] else 'EnableDebug',False,('-BackupPath',str(backup)) if case=='backup-tamper' else ('-BuildVariant','Debug'))
   if case not in ['failure','partial-failure']:assert snapshot(p)==expected,case
   else:
    for n,h in old.items():assert snapshot(p)[n]==h,n
    assert not (p/native/'ProductionPurchasePolicy.java').exists();assert not (p/'android/app/seamen-billing-release-guard.gradle').exists()
  finally:
   if case=='bundle-on':script=saved
   if case in ['failure','partial-failure']:parent.chmod(0o755)
 print('PASS modified/duplicate/release/bundled-ON/backup-tamper refusals; forced failure preserves sources',flush=True)
 print('PASS '+str(checks)+' K6E PowerShell operation assertions; all positive payment permissions were disposable source fixtures, not transactions',flush=True)
