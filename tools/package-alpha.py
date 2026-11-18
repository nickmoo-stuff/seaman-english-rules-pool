"""Stage and optionally archive one consolidated Alpha; no APK/AAB or wrapper generation."""
import argparse, hashlib, json, re, subprocess, zipfile
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT=Path(__file__).resolve().parents[1]
BASE='2318accbc7db8af25cb6b5c1985f5a6be1382f5e'
VERSION='0.17.52'; BUILD=1582
NATIVE=['SeamenBillingPlugin.java','SupporterBillingCore.java','PlayBillingClient.java','BillingRetryJob.java']

def digest(data):return hashlib.sha256(data).hexdigest()
def payload():
    names=subprocess.check_output(['git','ls-files','-z','www'],cwd=ROOT).decode().split('\0')
    files={name:(ROOT/name).read_bytes() for name in names if name}
    game=files['www/game.js'].decode();assert game.count("const BUILD_MODE='development'")==1
    files['www/game.js']=game.replace("const BUILD_MODE='development'","const BUILD_MODE='release'").encode()
    assert "APP_VERSION='0.17.52'" in game and 'APP_BUILD_NUMBER=1582;' in game
    # Only approved metadata/docs/cache identifiers differ from the approved game.
    metadata={'www/game.js','www/layout.js','www/index.html','www/service-worker.js','www/sw.js','www/README.txt','www/NATIVE-PACKAGING-READINESS.txt'}
    base_names=set(subprocess.check_output(['git','ls-tree','-r','--name-only',BASE,'www'],cwd=ROOT,text=True).splitlines())
    assert set(files)==base_names,'Unexpected added/removed web asset'
    assert files['www/layout.js']==subprocess.check_output(['git','show',BASE+':www/layout.js'],cwd=ROOT)
    original_game=subprocess.check_output(['git','show',BASE+':www/game.js'],cwd=ROOT,text=True)
    original_game=original_game.replace("APP_VERSION='0.17.51'", "APP_VERSION='0.17.52'").replace('APP_BUILD_NUMBER=1581','APP_BUILD_NUMBER=1582').replace("const BUILD_MODE='development'","const BUILD_MODE='release'")
    def non_lesson3(text):
        start=text.index('function schoolPracticeRack(');end=text.index('const POOL_SCHOOL_LESSONS=',start)
        text=text[:start]+'// school implementation audited by focused regression'+text[end:]
        text=text.replace("||(schoolSession?.id===3&&!schoolSession.repeatShots)",'')
        text=text.replace("if(schoolSession?.id===3&&schoolSession.phase==='correction')shot.schoolPlacement={x:c.x,y:c.y};",'')
        return re.sub(r"confirmCue\.addEventListener\('click',\(\)=>\{if\(schoolSession.*?\n",'// school confirmation audited by focused regression\n',text)
    assert non_lesson3(files['www/game.js'].decode())==non_lesson3(original_game),'Unrelated game/rules/save changes'
    for name,data in files.items():
        if name not in metadata:
            assert data==subprocess.check_output(['git','show',BASE+':'+name],cwd=ROOT),name+' changed unexpectedly'
    files['native/Install-SEAMEN-ALPHA.ps1']=(ROOT/'native-patches/K3I.1/Install-SEAMEN-ALPHA.ps1').read_bytes()
    for name in NATIVE:
        data=(ROOT/'native-patches/K3H.1'/name).read_bytes()
        assert data==subprocess.check_output(['git','show',BASE+':native-patches/K3H.1/'+name],cwd=ROOT),name+' changed unexpectedly'
        files['native/'+name]=data
    files['SECURITY.md']=(ROOT/'native-patches/K3H.1/SECURITY.md').read_bytes()
    for name in ['WINDOWS-INSTALL.md','K3I.1-RELEASE-READINESS.md']:
        files[name]=(ROOT/'release/K3I.1'/name).read_bytes()
    files['release.json']=(json.dumps(dict(milestone='K3I.1',version=VERSION,build=BUILD,mode='release',baseline=BASE,
        purchasesEnabled=False,playVersionCodeAvailability='unconfirmed',capacitor='8.5.2',billing='9.1.0'),indent=2)+'\n').encode()
    validate(files)
    files['SHA256SUMS.txt']=''.join(digest(data)+'  '+name+'\n' for name,data in sorted(files.items())).encode()
    return files

def validate(files):
    for name,data in files.items():
        if not name.startswith('www/') or Path(name).suffix not in {'.js','.html','.css','.webmanifest','.txt'}:continue
        text=data.decode()
        assert not any(old in text for old in ['0.17.50','v01750','1580','0.17.51','v01751','1581']),name+' stale metadata'
        if Path(name).suffix in {'.js','.html','.css'}:
            refs=re.findall(r'''["'`]((?:\./)?assets/[^"'`]+)["'`]''',text)
            if name.endswith('.html'):refs+=re.findall(r'''(?:src|href)=["']([^"']+)["']''',text)
            if name.endswith('.css'):refs+=re.findall(r'''url\(["']?([^)'"\s]+)''',text)
            for ref in refs:
                if '$' in ref or urlsplit(ref).scheme or ref.startswith(('#','//')):continue
                target='www/'+unquote(urlsplit(ref).path).removeprefix('./')
                if ref.endswith('/'):
                    assert any(p.startswith(target) for p in files),target
                else:assert target in files,(name,target)
    game=files['www/game.js'].decode();html=files['www/index.html'].decode()
    assert "APP_VERSION='0.17.52'" in game and 'APP_BUILD_NUMBER=1582;' in game
    assert "name='seamen:app-version' content='0.17.52'" in html
    assert "name='seamen:build-number' content='1582'" in html
    assert 'Version 0.17.52 · Build 1582' in html
    assert 'seamen-pwa-v01752-b1582-alpha1' in files['www/service-worker.js'].decode()
    assert 'seamen-pool-v0.17.52-shell-v1' in files['www/sw.js'].decode()
    info=json.loads(files['release.json'])
    assert info['version']==VERSION and info['build']==BUILD and info['mode']=='release' and info['purchasesEnabled'] is False
    assert info['playVersionCodeAvailability']=='unconfirmed'
    manifest=json.loads(files['www/manifest.webmanifest'])
    for icon in manifest['icons']:assert 'www/'+icon['src'] in files
    assert "const BUILD_MODE='release'" in files['www/game.js'].decode()
    assert 'PURCHASES_ENABLED=false' in files['native/SeamenBillingPlugin.java'].decode()
    assert not re.search(r'Chapters?\s*4\s*[–—-]\s*6',files['www/index.html'].decode(),re.I)
    assert 'starting with Chapter 4 and continuing beyond' in files['www/index.html'].decode()

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--stage',type=Path,required=True);parser.add_argument('--zip',type=Path)
    args=parser.parse_args();files=payload()
    args.stage.mkdir(parents=True,exist_ok=True)
    existing={str(p.relative_to(args.stage)) for p in args.stage.rglob('*') if p.is_file()}
    assert not existing-set(files),'Unexpected staging files; use a clean release stage'
    for name,data in files.items():
        path=args.stage/name;path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes(data)
    print('PASS release metadata, complete tracked asset inventory, literal references, preserved approved gameplay/assets, Lesson 3-only correction and native purchase gate:',len(files),'files')
    if args.zip:
        args.zip.parent.mkdir(parents=True,exist_ok=True)
        prefix='SeamenPool-v0.17.52-build1582-Alpha/'
        with zipfile.ZipFile(args.zip,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=6) as z:
            for name,data in sorted(files.items()):
                info=zipfile.ZipInfo(prefix+name,(2026,11,14,0,0,0));info.compress_type=zipfile.ZIP_DEFLATED;info.external_attr=0o100644<<16;z.writestr(info,data)
        with zipfile.ZipFile(args.zip) as z:
            assert z.testzip() is None
            assert set(z.namelist())=={prefix+n for n in files}
            for name,data in files.items():assert digest(z.read(prefix+name))==digest(data),name
        print('PASS final archive entries, CRC and SHA256 against staged inputs:',args.zip,args.zip.stat().st_size,'bytes',digest(args.zip.read_bytes()))
if __name__=='__main__':main()
