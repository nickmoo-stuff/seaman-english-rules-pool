// Executes the actual shipped guard with a small task-registration DSL fixture.
// This is NOT an AGP/Gradle Android build.
class GradleException extends RuntimeException { GradleException(String message){super(message)} }
class FixtureTask {
 String name; List actions=[]; List dependencies=[]
 def doLast(Closure action){actions<<action}
 def dependsOn(Object dependency){dependencies<<dependency}
}
class FixtureTasks {
 Map entries=[:]; List hooks=[]
 def register(String name, Closure configure){
  def task=new FixtureTask(name:name);configure.delegate=task;configure.resolveStrategy=Closure.DELEGATE_FIRST;configure.call();entries[name]=task;hooks.each{it.call(task)};task
 }
 def configureEach(Closure hook){entries.values().each{hook.call(it)};hooks<<hook}
}
def repo=new File(args[0]), app=new File(args[1]);def nativeRoot=new File(app,'src/main/java/com/seamenpool/billing');nativeRoot.mkdirs()
new File(repo,'native-patches/K6E').eachFileMatch(~/.*\.java/){source->new File(nativeRoot,source.name).bytes=source.bytes}
def publicRoot=new File(app,'src/main/assets/public');publicRoot.mkdirs();def game=new File(publicRoot,'game.js');game.text="const BUILD_MODE='release';const APP_VERSION='0.17.62';const APP_BUILD_NUMBER=1592;"
def tasks=new FixtureTasks();new GroovyShell(this.class.classLoader,new Binding([tasks:tasks,android:[defaultConfig:[versionName:'0.17.62',versionCode:1592]],file:{String path->new File(app,path)}])).evaluate(new File(repo,'native-patches/K6E/seamen-billing-release-guard.gradle'))
def check=tasks.entries.verifySeamenReleaseBilling
['preReleaseBuild','assembleRelease','bundleRelease','compileReleaseJavaWithJavac','assembleDebug'].each{name->tasks.register(name,{})}
assert ['preReleaseBuild','assembleRelease','bundleRelease','compileReleaseJavaWithJavac'].every{tasks.entries[it].dependencies.contains(check)}
assert !tasks.entries.assembleDebug.dependencies && !check.dependencies
int assertions=0
def verify={boolean pass->boolean success=true;try{check.actions.each{it.call()}}catch(GradleException e){success=false};assert success==pass;assertions++}
verify(true)
def test=new File(nativeRoot,'PurchaseTestPolicy.java'),original=test.text;test.text=original.replace('TEST_PURCHASES_ENABLED=false;','TEST_PURCHASES_ENABLED=true;');verify(false);test.text=original
def production=new File(nativeRoot,'ProductionPurchasePolicy.java'),oldProduction=production.text;production.text=oldProduction.replace('PRODUCTION_PURCHASES_ENABLED=false;','PRODUCTION_PURCHASES_ENABLED=true;');verify(true);production.text=oldProduction
production.text=oldProduction+'// unexpected source';verify(false);production.text=oldProduction
game.text="const BUILD_MODE='development';";verify(false);game.text="const BUILD_MODE='release';const APP_VERSION='0.17.62';const APP_BUILD_NUMBER=1592;"
game.text=game.text.replace('1592','1593');verify(false);game.text=game.text.replace('1593','1592')
def key=new File(publicRoot,'fixture.pem');key.text='not a key; test filename only';verify(false);key.delete()
production.delete();verify(false);production.text=oldProduction
println "PASS actual Groovy release-guard execution: ${assertions} source/web/key/default/approved-production scenarios; release tasks depend on guard; debug tasks unaffected. Task DSL is a fixture, not an Android build."
