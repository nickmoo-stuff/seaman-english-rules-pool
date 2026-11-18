"""Signature compilation only: actual Billing AAR + Android API jar + Capacitor stubs.
Not a Gradle/Capacitor app build or evidence of a packaged working Android bridge.
ECJ_JAR, ANDROID_API_JAR and BILLING_AAR must point to downloaded artefacts.
"""
import os
from pathlib import Path
import subprocess
import tempfile
import zipfile

root = Path(__file__).resolve().parents[1]
with tempfile.TemporaryDirectory(prefix='seamen-java-api-') as tmp:
    tmp = Path(tmp)
    with zipfile.ZipFile(os.environ['BILLING_AAR']) as aar:
        (tmp / 'billing.jar').write_bytes(aar.read('classes.jar'))
    # API 36 includes java.* stubs; use the host JDK for those to avoid JPMS duplicates.
    with zipfile.ZipFile(os.environ['ANDROID_API_JAR']) as original, zipfile.ZipFile(tmp / 'android-api.jar', 'w') as api:
        for name in original.namelist():
            if name.startswith(('android/', 'com/android/', 'dalvik/')) and name.endswith('.class'):
                api.writestr(name, original.read(name))
    classes = {
        'JSObject': 'public class JSObject { public JSObject put(String k,String v){return this;} public JSObject put(String k,boolean v){return this;} public JSObject put(String k,int v){return this;} public JSObject put(String k,long v){return this;} }',
        'PluginCall': 'public class PluginCall { public void resolve(JSObject o){} public void reject(String s,String c){} }',
        'Plugin': 'public class Plugin { public android.content.Context getContext(){return null;} public android.app.Activity getActivity(){return null;} public void load(){} public void notifyListeners(String e, JSObject d){} protected void handleOnResume(){} protected void handleOnDestroy(){} }',
        'PluginMethod': 'public @interface PluginMethod {}',
    }
    sources = []
    for name, text in classes.items():
        p = tmp / ('com/getcapacitor/' + name + '.java')
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text('package com.getcapacitor; ' + text)
        sources.append(str(p))
    annotation = tmp / 'com/getcapacitor/annotation/CapacitorPlugin.java'
    annotation.parent.mkdir(parents=True, exist_ok=True)
    annotation.write_text('package com.getcapacitor.annotation; public @interface CapacitorPlugin { String name(); }')
    sources.append(str(annotation))
    sources.extend(str(p) for p in (root / 'native-patches/K6E').glob('*.java'))
    sources.append(str(root / 'tests/SupporterBillingCoreTest.java'))
    sources.append(str(root / 'tests/K6ABillingPolicyTest.java'))
    sources.append(str(root / 'tests/K6EProductionPolicyTest.java'))
    subprocess.run(['java', '-jar', os.environ['ECJ_JAR'], '-17', '-warn:none', '-cp',
                    str(tmp / 'android-api.jar') + os.pathsep + str(tmp / 'billing.jar'), '-d', str(tmp / 'classes'), *sources], check=True)
    subprocess.run(['java', '-cp', str(tmp / 'classes'), 'com.seamenpool.billing.SupporterBillingCoreTest'], check=True)
    plugin = (root / 'native-patches/K6E/SeamenBillingPlugin.java').read_text()
    assert plugin.index('if(!purchasesEnabled())') < plugin.index('client.purchase(getActivity()')
    assert 'ApplicationInfo.FLAG_DEBUGGABLE' in plugin
    policy=(root/'native-patches/K6E/PurchaseTestPolicy.java').read_text()
    assert 'TEST_PURCHASES_ENABLED=false' in policy
    subprocess.run(['java','-cp',str(tmp/'classes'),'com.seamenpool.billing.K6ABillingPolicyTest'],check=True)
    subprocess.run(['java','-cp',str(tmp/'classes'),'com.seamenpool.billing.K6EProductionPolicyTest'],check=True)
    for source in (root / 'native-patches/K6E').glob('*.java'):
        assert 'consumeAsync' not in source.read_text() and 'SharedPreferences' not in source.read_text()
    print('PASS six K6E native sources compile against real Billing 9.1.0 / API 36 and Capacitor stubs; launch gate OFF. Not an APK/Gradle build.')
