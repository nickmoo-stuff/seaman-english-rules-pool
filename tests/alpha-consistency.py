"""Exercise release consistency refusals without creating another large archive."""
from pathlib import Path
import runpy

root=Path(__file__).resolve().parents[1]
module=runpy.run_path(str(root/'tools/package-alpha.py'))
files=module['payload']();validate=module['validate']
validate(files)
cases={
 'missing asset':('www/assets/portraits/deckhand-dave.webp',None),
 'stale metadata':('www/index.html',files['www/index.html'].replace(b'1582',b'1580')),
 'mismatched metadata':('www/index.html',files['www/index.html'].replace(b'1582',b'1583')),
 'development package':('www/game.js',files['www/game.js'].replace(b"BUILD_MODE='release'",b"BUILD_MODE='development'")),
 'payment gate enabled':('native/SeamenBillingPlugin.java',files['native/SeamenBillingPlugin.java'].replace(b'PURCHASES_ENABLED=false',b'PURCHASES_ENABLED=true')),
 'incorrect release manifest':('release.json',files['release.json'].replace(b'1582',b'1583')),
}
for label,(name,data) in cases.items():
 candidate=dict(files)
 if data is None:del candidate[name]
 else:candidate[name]=data
 try:validate(candidate)
 except (AssertionError,KeyError):print('PASS consistency refuses '+label)
 else:raise AssertionError(label+' incorrectly accepted')
print('PASS full tracked-asset/native baseline audit plus six negative release-consistency fixtures')
