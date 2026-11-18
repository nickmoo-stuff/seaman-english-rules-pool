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
    classes = {
        'JSObject': 'public class JSObject { public JSObject put(String k,String v){return this;} public JSObject put(String k,boolean v){return this;} public JSObject put(String k,int v){return this;} }',
        'PluginCall': 'public class PluginCall { public void resolve(JSObject o){} public void reject(String s,String c){} }',
        'Plugin': 'public class Plugin { public android.content.Context getContext(){return null;} public void load(){} public void notifyListeners(String e, JSObject d){} protected void handleOnResume(){} protected void handleOnDestroy(){} }',
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
    plugin = root / 'native-patches/K3G.1/SeamenBillingPlugin.java'
    sources.append(str(plugin))
    subprocess.run(['java', '-jar', os.environ['ECJ_JAR'], '-17', '-warn:none', '-cp',
                    os.environ['ANDROID_API_JAR'] + os.pathsep + str(tmp / 'billing.jar'), '-d', str(tmp / 'classes'), *sources], check=True)
    text = plugin.read_text()
    for forbidden in ['launchBillingFlow(', 'consumeAsync(', 'acknowledgePurchase(', 'getPurchaseToken(', 'verified_owner']:
        assert forbidden not in text, 'Unexpected active purchase/grant/token path: ' + forbidden
    assert '.put("purchasesEnabled", false)' in text and '.put("verificationEnabled", false)' in text
    print('PASS Java signature check against real Billing 9.1.0 plus Capacitor API stubs; native payment/grant/token paths disabled. Not an Android app build.')
