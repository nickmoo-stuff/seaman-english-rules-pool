from pathlib import Path
import tempfile,subprocess,os
r=Path(__file__).resolve().parents[1];jar=Path(os.environ.get('GROOVY_JAR','/tmp/k6e-groovy.jar'))
if not jar.exists():
 print('NOT TESTED actual Groovy guard: compiler unavailable');raise SystemExit(77)
with tempfile.TemporaryDirectory(prefix='seamen-groovy-') as tmp:
 subprocess.run(['java','-cp',str(jar),'groovy.ui.GroovyMain',str(r/'tests/k6e-release-guard.groovy'),str(r),tmp],check=True)
