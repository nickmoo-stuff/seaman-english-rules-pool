'use strict';
// V0.15.8b: native Android save export via Capacitor Filesystem; release foundation retained.
// APP_ID is the package/application identifier for future native wrappers and store builds.
// APP_VERSION is the human-readable release version. APP_BUILD_NUMBER must only increase for packaged releases.
const APP_ID='com.seamenpool.game';
const APP_NAME='Seamen English Rules Pool';
const APP_SHORT_NAME='Seamen Pool';
const APP_VERSION='1.0.1';
const APP_BUILD_NUMBER=1597;
const BUILD_MODE='release'; // 'development' | 'release'
/* K2E.2: register the boot gate before the remainder of game initialization.
   The previous listener lived after renderCareer()/showTitleScreen(); any earlier
   runtime exception left the visible ENTER THE TAVERN button inert. */
(function initEarlyBootGate(){
  const splash=document.getElementById('bootSplash');
  const button=document.getElementById('enterTavern');
  const title=document.getElementById('titleScreen');
  if(!splash||!button)return;
  let entering=false;
  if(title)title.hidden=true;
  splash.hidden=false;
  button.addEventListener('click',()=>{
    if(entering)return;
    entering=true;
    button.disabled=true;
    // Keep media startup in the trusted click stack for Safari's gesture policy.
    try{audioReady();startBootAnthem();}catch(err){console.warn('Boot audio unavailable:',err);}
    splash.classList.add('is-entering');
    setTimeout(()=>{
      splash.hidden=true;
      splash.classList.remove('is-entering');
      if(title)title.hidden=false;
    },2500);
  });
})();

const IS_DEVELOPMENT_BUILD=BUILD_MODE==='development';
document.documentElement.dataset.buildMode=BUILD_MODE;
const canvas=document.getElementById('game'),ctx=canvas.getContext('2d');
const piratePlayerName=document.getElementById('piratePlayerName');
const aiVsAiMode=document.getElementById('aiVsAiMode'),aiVsAiMenu=document.getElementById('aiVsAiMenu'),aiVsAiP1=document.getElementById('aiVsAiP1'),aiVsAiP2=document.getElementById('aiVsAiP2'),startAiVsAi=document.getElementById('startAiVsAi'),aiVsAiBack=document.getElementById('aiVsAiBack');
const playersModal=document.getElementById('playersModal'),modeMenu=document.getElementById('modeMenu'),localMode=document.getElementById('localMode'),pirateMode=document.getElementById('pirateMode'),testMode=document.getElementById('testMode'),testScenarioMenu=document.getElementById('testScenarioMenu'),testBack=document.getElementById('testBack'),testPlayerName=document.getElementById('testPlayerName'),nightmareScenario=document.getElementById('nightmareScenario'),cannonScenario=document.getElementById('cannonScenario'),fiveFrameScenario=document.getElementById('fiveFrameScenario'),backToMode=document.getElementById('backToMode'),piratePlaceholder=document.getElementById('piratePlaceholder'),pirateBack=document.getElementById('pirateBack'),playersForm=document.getElementById('playersForm'),player1Name=document.getElementById('player1Name'),player2Name=document.getElementById('player2Name'),showGameLog=document.getElementById('showGameLog'),gameLogModal=document.getElementById('gameLogModal'),gameLogModalText=document.getElementById('gameLogModalText'),closeGameLog=document.getElementById('closeGameLog'),copyGameLog=document.getElementById('copyGameLog'),copyGameLogStatus=document.getElementById('copyGameLogStatus');
let playerNames={1:'Player 1',2:'Player 2'};
let selectedSpin={x:0,y:0},helmSpinMode=false,spinPointer=null,lastSpinTap=null;
function resetCueSpin(){
 selectedSpin={x:0,y:0};helmSpinMode=false;spinPointer=null;lastSpinTap=null;
 // All runtime frame/shot resets occur after the existing rail has initialised.
 if(typeof helmGesture!=='undefined'&&helmGesture){clearTimeout(helmGesture.pendingTimer);helmGesture=null;document.getElementById('cueHelm')?.classList.remove('is-steering');}
 if(typeof syncSpinUI==='function'&&document.getElementById('helmCueBall'))syncSpinUI();
}
let gameMode='local',aiPlayer=null,aiTimer=null,aiWatchdogTimer=null,aiThinking=false,currentPirateLevel=1,currentPirateId='dave',currentPirateName='Deckhand Dave',aiVsAiLevels={1:5,2:5};
/* V0.17.0: content catalogue foundation. Legacy numeric levels remain available so
   existing dialogue, AI tuning and 0.16.x saves keep working while content gains
   stable IDs, chapter membership and a main/bonus role independent of difficulty. */
const CHAPTERS={
  chapter_1:{id:'chapter_1',number:1,name:"Captain Blackball's Domain",mainPirates:['dave','simon','holly','mick','blackball'],bonusPirates:['cyclops','vaper'],boss:'blackball',unlockRule:{type:'default'},scenes:{intro:'chapter_1_intro',bossIntro:'blackball_intro',ending:'blackball_ending'},bonusUnlock:{type:'complete_chapter',chapter:'chapter_1'}},
  chapter_2:{id:'chapter_2',number:2,name:'Uncharted Waters',mainPirates:['sandy','shelle','graham','papa_surf','chapter2_boss'],bonusPirates:['pokey_man','izzy'],boss:'chapter2_boss',unlockRule:{type:'complete_chapter',chapter:'chapter_1'},scenes:{intro:'chapter_2_intro',bossIntro:'chapter_2_boss_reveal',ending:'chapter_2_ending'},bonusUnlock:{type:'complete_chapter',chapter:'chapter_2'}},
  chapter_3:{id:'chapter_3',number:3,name:'The Blockbeard Chronicles',mainPirates:['barley','legolass','aragoon','souronion','blockbeard'],bonusPirates:['gimlet','bam_bam'],boss:'blockbeard',unlockRule:{type:'complete_chapter',chapter:'chapter_2'},postRelease:false,foundationOnly:false,scenes:{intro:'chapter_3_arrival'},bonusUnlock:{type:'complete_chapter',chapter:'chapter_3'}}
};
CHAPTERS.chapter_4=window.SeamenChapter4.chapter;
const PIRATES=[null,
{id:'dave',legacyLevel:1,chapter:'chapter_1',chapterPosition:1,campaignRole:'main',difficulty:1,name:'Deckhand Dave',fullName:'David Deckhand',role:'Deckhand',style:'Enthusiastic chaos',bio:'A hopeless beginner with almost no discernible talent, but plenty to say while he is missing.',reputation:'Knows the rules and can usually hit a ball. Proud of his big boat. Does not like small ones.',portrait:'DD',image:'assets/portraits/deckhand-dave.webp',achievementId:'pirate_dave',rewards:[{type:'cue',id:'dave'}]},
{id:'simon',legacyLevel:2,chapter:'chapter_1',chapterPosition:2,campaignRole:'main',difficulty:2,name:'Sweaty Simon',fullName:'Simon White',role:'Crew hand',style:'Overeducated geometry',bio:'Upper-middle-class confidence, Latin education and anecdotes about his uncle’s marmalade. Common sense sold separately.',reputation:'Mediocre, but dangerous at an office Christmas night out where nobody else has played for a decade.',portrait:'SS',image:'assets/portraits/sweaty-simon.webp',achievementId:'pirate_simon',rewards:[{type:'cue',id:'simon'}]},
{id:'holly',legacyLevel:3,chapter:'chapter_1',chapterPosition:3,campaignRole:'main',difficulty:3,name:'Holly',fullName:'Holly Beans-Ramekin',role:'Free spirit',style:'Focused amateur',bio:'A free spirit who is passionately absorbed in whatever she is doing right now. Pool included.',reputation:'A competent amateur who is cleverer than she lets on and happy to play a stranger for a quid.',portrait:'HB',image:'assets/portraits/holly.webp',achievementId:'pirate_holly',rewards:[{type:'cue',id:'holly'}]},
{id:'mick',legacyLevel:4,chapter:'chapter_1',chapterPosition:4,campaignRole:'main',difficulty:4,name:'First Mate Mick',fullName:'First Mate Mick',nickname:'“The Tornado”',role:'First mate',style:'Confident all-rounder',bio:'Sunday pub-tournament regular. Own cue. Chalk holder clipped to his belt. Talks an excellent game.',reputation:'Above average, locally notorious and convinced The Tornado means more to the pool world than it probably does.',portrait:'TM',image:'assets/portraits/tornado-mick.webp',achievementId:'pirate_mick',rewards:[{type:'cue',id:'mick'}]},
{id:'blackball',legacyLevel:5,chapter:'chapter_1',chapterPosition:5,campaignRole:'main',difficulty:5,name:'Captain Blackball',fullName:'Captain Blackball',role:'Captain',style:'Veteran strategist',bio:'Calm, reserved and genuinely formidable. The quiet pirate in the corner who never needs to advertise what he can do.',reputation:'Sees several shots ahead. Knows that true skill begins when the current pot is also used to create the next one.',portrait:'CB',image:'assets/portraits/captain-blackball.webp',achievementId:'pirate_blackball',rewards:[{type:'cue',id:'blackball'},{type:'table',id:'privates'}]},
{id:'cyclops',legacyLevel:6,chapter:'chapter_1',chapterPosition:1,campaignRole:'bonus',difficulty:6,name:"Ol' Cyclops",fullName:"Ol' Cyclops",role:'Special opponent',style:'ABSOLUTE VIOLENCE',bio:'Quiet when left alone. Aggressive when annoyed. Usually annoyed.',reputation:'Technically capable, fundamentally insane: EVERYTHING MUST BE HIT AT 100% POWER. Sees himself with difficulty.',portrait:'OC',image:'assets/portraits/ol-cyclops.webp',rewards:[]},
{id:'vaper',legacyLevel:7,chapter:'chapter_1',chapterPosition:2,campaignRole:'bonus',difficulty:7,name:'Darth Vaper',fullName:'DARTH VAPER',role:'Near-perfect superboss',style:'Relentless perfectionist',bio:'Fearful, angry, hateful, suffering, revengeful — and enormously intelligent. He wants ultimate power, then more.',reputation:'A terrifying positional player capable of absurd escapes and streaks. Still human, still beatable, and principled enough not to cheat.',portrait:'DV',image:'assets/portraits/darth-vaper.webp',rewards:[{type:'cue',id:'vaper'},{type:'table',id:'vaper'}]},
{id:'sandy',legacyLevel:null,aiLevel:2,chapter:'chapter_2',chapterPosition:1,campaignRole:'main',difficulty:2,name:'Sandy Mandy',fullName:'Sandy Mandy',role:'Island player',style:'Elegant positional play',bio:'A sincerely profound-sounding thinker whose conclusions do not always survive inspection.',challengeQuote:'People say life is for living. Like, I basically do that when I wake up? Is that it?',reputation:'A showy positional player with moderate-to-low power and accuracy around Sweaty Simon territory.',portrait:'SM',image:'assets/portraits/sandy-mandy-main.png',unlockRule:{type:'default'},playable:true,rewards:[{type:'cue',id:'izzy'}]},
{id:'shelle',legacyLevel:null,aiLevel:3,chapter:'chapter_2',chapterPosition:2,campaignRole:'main',difficulty:3,name:'Shelle',fullName:'Shelle',role:'Island player',style:'Natural potter',bio:'Cheerfully self-obsessed, shallow and very pleased to be here.',challengeQuote:'If polishing a turd is impossible how can you polish a pool ball? Not during a game though?',reputation:'A better raw potter than Sandy, but much less convincing when position matters.',portrait:'SH',image:'assets/portraits/shelle-main.png',unlockRule:{type:'defeat_pirate',pirate:'sandy'},playable:true,rewards:[]},
{id:'graham',legacyLevel:null,aiLevel:4,chapter:'chapter_2',chapterPosition:3,campaignRole:'main',difficulty:4,name:'Graham',fullName:'Graham',role:'Fossil obsessive',style:'Methodical planner',bio:'Scientifically intelligent, fossil obsessed and burdened with remarkably poor practical common sense.',challengeQuote:'The orbital trajectory of a meteorite that is yet to turn into a valuable material is surprisingly close to the calculations around pinpoint angular accuracy on a pool table.',reputation:'Strong at planning, cushions and positional play; his greatest opponent is his own tendency to overthink.',portrait:'GR',image:'assets/portraits/graham-main.png',unlockRule:{type:'defeat_pirate',pirate:'shelle'},playable:true,rewards:[]},
{id:'papa_surf',legacyLevel:null,aiLevel:4,chapter:'chapter_2',chapterPosition:4,campaignRole:'main',difficulty:5,name:'Papa Surf',fullName:'Papa Surf',role:'Beachcomber',style:'Safety specialist',bio:'An elderly pirate beachcomber: friendly, welcoming and somehow deeply unnerving.',challengeQuote:'If my broth does not warm your heart as much as your belly, the summer waves here sure will. I beg that you let me watch as they gently flow across you.',reputation:'The strongest safety player of the ordinary Uncharted Waters four.',portrait:'PS',image:'assets/portraits/papa-surf-main.png',unlockRule:{type:'defeat_pirate',pirate:'graham'},playable:true,rewards:[]},
{id:'chapter2_boss',legacyLevel:null,aiLevel:7,chapter:'chapter_2',chapterPosition:5,campaignRole:'main',difficulty:'?',name:'???',fullName:'???',role:'Unknown challenger',style:'Unknown',bio:'The final challenger has not yet revealed themselves.',reputation:'Defeat the island opponents to discover who issued the challenge.',portrait:'?',image:'',unlockRule:{type:'defeat_pirate',pirate:'papa_surf'},playable:true,rewards:[{type:'cue',id:'wiggles'}]}];
// K1: Chapter 3 foundation metadata only. These opponents are deliberately not playable yet.
const CHAPTER3_FOUNDATION_OPPONENTS=[
 ['barley','Barley Bramblebottom',1,2,'Hobbit farmer','Careful positional play'],
 ['legolass','Legolass',2,4,'Elven archer','Long-range precision'],
 ['aragoon','Aragoon',3,5,'Ranger','Tactical cue-ball control'],
 ['souronion','Lord Souronion',4,6,'Dark lord','Aggressive power play'],
 ['blockbeard','Captain Blockbeard',5,7,'Cubic pirate boss','Golden Cue guardian'],
 ['gimlet','Gimlet',1,6,'Supporter bonus','Direct powerful shots'],
 ['bam_bam','Bam Bam',2,5,'Supporter bonus','Alternating safe/wild visits']
];
for(const [id,name,position,aiLevel,role,style] of CHAPTER3_FOUNDATION_OPPONENTS){
 PIRATES.push({id,legacyLevel:null,aiLevel,chapter:'chapter_3',chapterPosition:position,campaignRole:['gimlet','bam_bam'].includes(id)?'bonus':'main',difficulty:aiLevel,name,fullName:name,role,style,bio:id==='bam_bam'?'Purrrrrr. Purrp?':'Chapter 3 integration pending.',reputation:id==='bam_bam'?'A cosy black cat who alternates careful visits with wildly enthusiastic shots.':'Chapter 3 integration pending.',portrait:id==='bam_bam'?'BM':'?',image:id==='bam_bam'?'assets/portraits/bam-bam.png':'',playable:true,devOnly:false,unlockRule:id==='barley'?{type:'default'}:{type:'defeat_pirate',pirate:({legolass:'barley',aragoon:'legolass',souronion:'aragoon',blockbeard:'souronion'})[id]||'souronion'},rewards:[]});
}
PIRATES.push(...window.SeamenChapter4.opponents);
PIRATES.push(...window.SeamenChapter4.bonusOpponents);
function applyChapter2BossIdentity(forceReveal=false){const p=PIRATES.find(x=>x?.id==='chapter2_boss');if(!p)return;const revealed=forceReveal||!!career?.chapters?.chapter_2?.bossIntroSeen||!!career?.piratesDefeated?.chapter2_boss;if(revealed){Object.assign(p,{difficulty:'BOSS',name:'Mr Wiggles',fullName:'Mr Wiggles',role:'Island boss',style:'Mysterious worm',bio:"The loud-mouthed creature that summoned Blackball across the ocean. He's a worm. He's playing pool.",challengeQuote:'Slurrrrrp!',reputation:'The final challenger of Strangevoice Island.',portrait:'MW',image:'assets/scenes/mr-wiggles-main.png'});}}
Object.assign(PIRATES.find(p=>p?.id==='barley'),{image:'assets/portraits/ch3-barley.png',portrait:'BB',bio:'A welcoming farmer who measures time in meals and prizes his turnips.',reputation:'Careful short pots, safety and position.',challengeQuote:'Before we start, have you eaten? It’s terribly hard to aim on an empty stomach.'});
// K2E: approved Chapter 3 challengers, using their supplied portrait assets.
for(const [id,portrait,initials,description] of [
 ['legolass','legolass','LE','An elven archer with unnerving long-distance precision.'],
 ['aragoon','aragoon','AR','A ranger who can recite more ancestors than he can pot balls.'],
 ['souronion','lord_souronion','LS','A melodramatic dark lord with a very unfortunate username.'],
 ['blockbeard','blockbeard','CB','A square-loving pirate with a magnificent golden cue.']
]){Object.assign(PIRATES.find(p=>p?.id===id),{image:`assets/portraits/ch3-${portrait}.png`,portrait:initials,bio:description,challengeQuote:description,reputation:description});}
// K2F.3: Chapter 2 bonus roster placeholders. These remain deliberately
// non-playable until their approved cue/AI/match content is integrated.
PIRATES.push(
 {id:'pokey_man',legacyLevel:null,aiLevel:5,chapter:'chapter_2',chapterPosition:6,campaignRole:'bonus',difficulty:5,name:'Pokey Man',fullName:'Pokey Man',role:'Supporter challenge',style:'Collector of perfect shots',bio:'A cheeky challenger guarding his colourful arena.',reputation:'A confident tactical opponent.',portrait:'PM',image:'assets/portraits/pokey-man.png',playable:true,rewards:[{type:'cue',id:'pokey'},{type:'table',id:'pokey'}]},
 {id:'izzy',legacyLevel:null,aiLevel:5,chapter:'chapter_2',chapterPosition:7,campaignRole:'bonus',difficulty:5,name:'Izzy',fullName:'Izzy',role:'Supporter creature',style:'Unpredictable trick shots',bio:'A special island creature with a taste for pool.',reputation:'A playful opponent who uses the player-selected table.',portrait:'IZ',image:'assets/portraits/izzy.webp',playable:true,rewards:[]}
);
const PIRATES_BY_ID=Object.fromEntries(PIRATES.filter(Boolean).map(p=>[p.id,p]));
function pirateById(id){return PIRATES_BY_ID[id]||null;}
function pirateByLegacyLevel(level){return PIRATES[Number(level)]||null;}
function activePirate(){return pirateById(currentPirateId)||pirateByLegacyLevel(currentPirateLevel);}
function chapterById(id){return CHAPTERS[id]||null;}
function chapterPirates(chapterId='chapter_1',role='main'){const chapter=chapterById(chapterId);if(!chapter)return[];const ids=role==='bonus'?chapter.bonusPirates:chapter.mainPirates;return ids.map(pirateById).filter(Boolean);}
function isMainCampaignPirate(p){return !!p&&p.campaignRole==='main';}
function isChapterBoss(p){return !!p&&chapterById(p.chapter)?.boss===p.id;}
function pirateCareerKey(p){return String(p?.legacyLevel??p?.id??'');}
function chapterState(chapterId){
  career.chapters=career.chapters||{};
  const existing=career.chapters[chapterId]||{};
  return career.chapters[chapterId]={unlocked:false,introSeen:false,bossIntroSeen:false,endingSeen:false,endingPending:false,completed:false,...existing};
}
function chapterIsUnlocked(chapterId){const ch=chapterById(chapterId);if(!ch)return false;if(devPirateAccessActive())return PIRATES.some(p=>p?.chapter===chapterId&&devPirateAvailable(p));const state=chapterState(chapterId);if(chapterId==='chapter_4')return !!career.chapters?.chapter_3?.completed&&hasEntitlement('supporter_founder_test');return !!state.unlocked||unlockRuleMet(ch.unlockRule||{type:'default'});}
// K2F.5: reconcile chapter milestones against durable victory evidence. A boss
// introduction alone must NEVER count as a win. Old saves may have recorded the
// boss result without committing the corresponding chapter-complete flag.
function reconcileChapterVictoryEvidence(c){
  c.chapters=c.chapters||{};c.piratesDefeated=c.piratesDefeated||{};
  for(const ch of Object.values(CHAPTERS)){
    const state=c.chapters[ch.id]||(c.chapters[ch.id]={});
    const boss=pirateById(ch.boss),key=pirateCareerKey(boss);
    const record=c.pirateRecords?.[key];
    const won=!!c.piratesDefeated[key]||Number(record?.wins||0)>0||!!state.completed||!!state.endingSeen;
    if(won){c.piratesDefeated[key]=true;state.completed=true;}
  }
  for(const ch of Object.values(CHAPTERS)){
    if(ch.id==='chapter_1')continue;
    const prerequisite=ch.unlockRule?.chapter;
    if(prerequisite&&c.chapters[prerequisite]?.completed)(c.chapters[ch.id]||(c.chapters[ch.id]={})).unlocked=true;
  }
  return c;
}
function syncChapterUnlocks(){for(const ch of Object.values(CHAPTERS)){const state=chapterState(ch.id);if(!state.unlocked&&unlockRuleMet(ch.unlockRule||{type:'default'}))state.unlocked=true;}}
function chapterMainComplete(chapterId){const ch=chapterById(chapterId);return !!ch&&chapterPirates(chapterId,'main').length>0&&chapterPirates(chapterId,'main').every(p=>pirateDefeated(p.id));}
function chapterBonusAvailable(chapterId){const ch=chapterById(chapterId);return !!ch&&unlockRuleMet(ch.bonusUnlock||{type:'complete_chapter',chapter:chapterId});}
// K3E.1: presentation only. Read durable story evidence without normalising or writing saves.
const STORY_REMINDERS=Object.freeze({
 chapter1:'Get your bearings: beat each tavern opponent to reach the famous pool champion Captain Blackball, then watch the rest of the story unfold...',
 chapter2Next:'Time to begin chapter 2! Scroll down in the story mode menu to get started.',
 chapter2:'Find out who beckoned you to this strange land.',
 goldenCue:'Investigate the new lead for the seemingly prestigious golden cue.',
 chapter4Next:'Progress to chapter 4 to continue your adventure!',
 chapter4:'Explore the new fiery realm to continue your quest for the seemingly prestigious golden cue.',
 chapter5Next:"Begin chapter 5 once it's available to continue your adventure!"
});
function resolveStoryReminder(c=career,chapters=CHAPTERS,pirates=PIRATES){
 const main=id=>(chapters[id]?.mainPirates||[]).map(pid=>pirates.find(p=>p?.id===pid)).filter(p=>p&&p.campaignRole==='main');
 const won=p=>!!p&&(!!c.piratesDefeated?.[pirateCareerKey(p)]||Number(c.pirateRecords?.[pirateCareerKey(p)]?.wins||0)>0);
 const complete=id=>!!(c.chapters?.[id]?.completed||c.chapters?.[id]?.endingSeen||won(main(id).find(p=>p.id===chapters[id]?.boss)));
 const started=id=>!!(c.chapters?.[id]?.introSeen||c.chapters?.[id]?.bossIntroSeen||main(id).some(p=>won(p)||Number(c.pirateRecords?.[pirateCareerKey(p)]?.losses||0)>0));
 // Future chapters must supply playable content and an explicit access requirement.
 const four=chapters.chapter_4;
 const fourAvailable=four&&!four.foundationOnly&&!four.postRelease&&main('chapter_4').some(p=>p.playable!==false&&!p.devOnly)&&unlockRuleMet(four.unlockRule,c)&&(!four.requiresEntitlement||hasEntitlement(four.requiresEntitlement));
 if(fourAvailable&&complete('chapter_4'))return STORY_REMINDERS.chapter5Next;
 if(fourAvailable&&started('chapter_4'))return STORY_REMINDERS.chapter4;
 if(complete('chapter_3'))return STORY_REMINDERS.chapter4Next;
 if(started('chapter_3')||complete('chapter_2'))return STORY_REMINDERS.goldenCue;
 if(started('chapter_2'))return STORY_REMINDERS.chapter2;
 if(complete('chapter_1'))return STORY_REMINDERS.chapter2Next;
 return STORY_REMINDERS.chapter1;
}
function renderStoryReminder(){const reminder=document.getElementById('storyProgressReminder');if(reminder){const text=resolveStoryReminder();if(reminder.textContent!==text)reminder.textContent=text;}}
function markChapterSceneSeen(chapterId,kind){const state=chapterState(chapterId),key=kind==='intro'?'introSeen':kind==='bossIntro'?'bossIntroSeen':'endingSeen';state[key]=true;saveCareer();}
function chapterHasStoryProgress(chapterId){return chapterPirates(chapterId,'main').some(p=>pirateDefeated(p.id)||Number(career.pirateRecords?.[pirateCareerKey(p)]?.wins||0)+Number(career.pirateRecords?.[pirateCareerKey(p)]?.losses||0)>0)||!!chapterState(chapterId).completed;}
function opponentSceneSeen(p,key){const record=career.pirateRecords?.[pirateCareerKey(p)];return !!chapterState(p.chapter)[key]||pirateDefeated(p.id)||Number(record?.wins||0)+Number(record?.losses||0)>0;}
function chapterSceneSeen(chapterId,kind){const ch=chapterState(chapterId);if(kind==='intro')return ch.introSeen||chapterHasStoryProgress(chapterId);if(chapterId==='chapter_1')return kind==='bossIntro'?(ch.bossIntroSeen||career.blackballIntroSeen||opponentSceneSeen(pirateById('blackball'),'bossIntroSeen')):(ch.endingSeen||career.blackballEndingSeen);if(kind==='bossIntro'&&chapterId==='chapter_2'&&pirateDefeated('chapter2_boss'))return true;return !!ch[kind==='bossIntro'?'bossIntroSeen':'endingSeen'];}
function runChapterScene(chapterId,kind,onDone){
 const sceneId=chapterById(chapterId)?.scenes?.[kind];
 if(!chapterIsUnlocked(chapterId)){theatreTrace('blocked-progression',sceneId);return false;}
 if(chapterSceneSeen(chapterId,kind)){theatreTrace('already-completed',sceneId);if(onDone)onDone();return false;}
 theatreTrace('eligible',sceneId);
 return launchChapterScene(chapterId,kind,onDone);
}
function launchChapterScene(chapterId,kind,onDone){const ch=chapterById(chapterId),sceneId=ch?.scenes?.[kind];if(!sceneId||sceneId.endsWith('_legacy')){if(onDone)onDone();return false;}return showScene(sceneId,()=>{markChapterSceneSeen(chapterId,kind);if(onDone)onDone();});}
function completeChapter(chapterId){const state=chapterState(chapterId);state.completed=true;syncChapterUnlocks();saveCareer();renderPirateRoster();refreshPirateButtons();}

let devPiratesUnlocked=false,devScenariosUnlocked=false,currentScenario=null;
function devPirateAccessActive(){return IS_DEVELOPMENT_BUILD&&!nativeSupporterRuntime()&&devPiratesUnlocked;}
function devPirateAvailable(p){
 if(!p||p.playable===false||p.devOnly||p.testOnly||p.hidden||p.postRelease||p.foundationOnly)return false;
 const ch=chapterById(p.chapter),level=p.legacyLevel??p.aiLevel;
 return !!ch&&!ch.hidden&&!ch.postRelease&&!ch.foundationOnly&&!ch.testOnly&&Number.isFinite(level)&&level>0;
}
function devUnlockAllPirates(){
 const feedback=document.getElementById('devPirateUnlockFeedback');
 const report=(text,accepted)=>{if(feedback){feedback.textContent=text;feedback.dataset.result=accepted?'accepted':'rejected';if(!feedback.closest('[hidden]'))feedback.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});}if(msg)msg.textContent=text;return accepted;};
 if(!IS_DEVELOPMENT_BUILD||nativeSupporterRuntime())return report('Unlock all pirates rejected: available only in the web development build.',false);
 devPiratesUnlocked=true;
 renderPirateRoster();refreshDevEntitlementUI();
 const available=PIRATES.filter(devPirateAvailable),chapters=new Set(available.map(p=>p.chapter));
 return report(`Unlocked ${available.length} available opponents across ${chapters.size} chapters for this tab. Unseen introductions will still run; existing history is unchanged. No defeats, rewards or supporter ownership have been granted. Reload to end this test access.`,true);
}

let fiveFrameTestActive=false,fiveFrameTestCompleted=0,pendingFiveFrameCelebration=null;
// V0.7.16: iOS/WebKit rapid multi-tap + hold selection hardening without cancelling ordinary button taps.
document.body.classList.add('game-interaction-hardened');
const interactionControlSelector='button, canvas, .fine-aim, .power-buttons, .cue-nudge-grid, .controls, .cue-placement-controls';
function isProtectedInteractionTarget(target){
  if(!(target instanceof Element))return false;
  if(target.closest('#gameLogModalText,input,textarea,select'))return false;
  return !!target.closest(interactionControlSelector);
}
document.addEventListener('selectstart',e=>{if(isProtectedInteractionTarget(e.target))e.preventDefault();});
document.addEventListener('dragstart',e=>{if(isProtectedInteractionTarget(e.target))e.preventDefault();});
document.addEventListener('contextmenu',e=>{if(isProtectedInteractionTarget(e.target))e.preventDefault();});
const holdControlSelector='.fine-aim button,.power-buttons button,.cue-nudge-grid button,#shoot';
// iOS can synthesize a selection just after a rapid double-tap followed by a hold.
// Keep a short selection-suppression window around protected controls, rather than
// cancelling touchstart globally (which previously broke taps in iOS Chrome).
let protectedSelectionUntil=0;
function armProtectedSelectionGuard(ms=900){protectedSelectionUntil=Math.max(protectedSelectionUntil,performance.now()+ms);const sel=window.getSelection?.();if(sel&&!sel.isCollapsed)sel.removeAllRanges();}
document.addEventListener('selectionchange',()=>{
  const sel=window.getSelection?.();if(!sel||sel.isCollapsed)return;
  const anchor=sel.anchorNode?.nodeType===1?sel.anchorNode:sel.anchorNode?.parentElement;
  const focus=sel.focusNode?.nodeType===1?sel.focusNode:sel.focusNode?.parentElement;
  if(performance.now()<protectedSelectionUntil||(anchor instanceof Element&&anchor.closest(holdControlSelector))||(focus instanceof Element&&focus.closest(holdControlSelector)))sel.removeAllRanges();
});
document.addEventListener('dblclick',e=>{if(e.target instanceof Element&&e.target.closest(holdControlSelector)){e.preventDefault();armProtectedSelectionGuard(1000);}});

function getUnlockedPirateLevel(){try{return clamp(Number(localStorage.getItem('seamenPirateUnlocked')||1),1,5)}catch(e){return 1}}
function setUnlockedPirateLevel(level){try{localStorage.setItem('seamenPirateUnlocked',String(clamp(level,1,5)))}catch(e){}}

/* V0.12.0: versioned, extensible local career record. This is deliberately separate
   from settings and premium entitlement so future save migrations can preserve both. */
const CAREER_KEY='seamenCareer',CAREER_SCHEMA=7;
// K6G: Story identity belongs to the existing career record, never local match names.
function normaliseStoryName(value){return typeof value==='string'?Array.from(value.replace(/[\u0000-\u001f\u007f]/g,' ').trim()).slice(0,20).join(''):'';}
function recoverStoryName(raw){
 const canonical=normaliseStoryName(raw?.storyPlayerName);if(canonical)return canonical;
 const candidates=[raw?.playerName,raw?.storyName];
 for(const key of ['seamenStoryPlayerName','seamenPiratePlayerName','seamenPlayerName']){try{let value=localStorage.getItem(key);try{const parsed=JSON.parse(value);if(typeof parsed==='string')value=parsed;}catch(e){}candidates.push(value);}catch(e){}}
 const names=candidates.map(normaliseStoryName).filter(Boolean);
 return names.find(name=>!/^player\s*1$/i.test(name))||names[0]||'Player 1';
}
function defaultCareer(){return{schema:CAREER_SCHEMA,storyPlayerName:'Player 1',framesPlayed:0,framesWon:0,framesLost:0,shotsTaken:0,legalBallsPotted:0,foulsCommitted:0,bestPotStreak:0,sevenBallWins:0,blackOnBlackWins:0,foulFreeWins:0,oneVisitClearances:0,creditsRead:false,poolSchoolCompleted:[],lifetimePremium:false,blackballIntroSeen:false,blackballEndingSeen:false,piratesDefeated:{},chapters:{chapter_1:{unlocked:true,introSeen:false,bossIntroSeen:false,endingSeen:false,completed:false},chapter_2:{unlocked:false,introSeen:false,bossIntroSeen:false,endingSeen:false,endingPending:false,completed:false}},earnedAchievements:[],pirateRecords:{},unlockedCosmetics:[],history:{careerStarted:new Date().toISOString(),firstWin:null,firstPirateDefeated:null,chapterOneCompleted:null},seenCosmetics:[],cosmeticSeenInitialized:false};}
function loadCareer(){let c=defaultCareer();c.storyPlayerName=recoverStoryName(null);try{const raw=JSON.parse(localStorage.getItem(CAREER_KEY)||'null');if(raw&&typeof raw==='object')c={...c,...raw,piratesDefeated:{...c.piratesDefeated,...(raw.piratesDefeated||{})},poolSchoolCompleted:Array.isArray(raw.poolSchoolCompleted)?[...new Set(raw.poolSchoolCompleted.filter(x=>Number.isInteger(x)&&x>=1&&x<=99))]:[],chapters:{...c.chapters,...(raw.chapters||{})},earnedAchievements:Array.isArray(raw.earnedAchievements)?[...new Set(raw.earnedAchievements.filter(x=>typeof x==='string'))]:[],pirateRecords:{...(raw.pirateRecords||{})},unlockedCosmetics:Array.isArray(raw.unlockedCosmetics)?[...new Set(raw.unlockedCosmetics.filter(x=>typeof x==='string'))]:[],history:{...c.history,...(raw.history||{})},seenCosmetics:Array.isArray(raw.seenCosmetics)?[...new Set(raw.seenCosmetics.filter(x=>typeof x==='string'))]:[],cosmeticSeenInitialized:!!raw.cosmeticSeenInitialized,schema:CAREER_SCHEMA};c.storyPlayerName=recoverStoryName(raw);}catch(e){}return c;}
function migrateChapterProgress(c){
  c.chapters={...(c.chapters||{})};
  for(const chapter of Object.values(CHAPTERS)){
    const existing=c.chapters[chapter.id]||{};
    const completed=chapter.mainPirates.length>0&&chapter.mainPirates.every(id=>{const p=pirateById(id);return !!c.piratesDefeated[pirateCareerKey(p)];});
    c.chapters[chapter.id]={unlocked:chapter.id==='chapter_1'||chapter.testOnly,introSeen:false,bossIntroSeen:false,endingSeen:false,endingPending:false,completed:false,...existing,completed:!!(existing.completed||completed)};
  }
  return c;
}
let career=reconcileChapterVictoryEvidence(migrateChapterProgress(loadCareer()));
let storyRenameFromSettings=false;
function storyPlayerName(){return normaliseStoryName(career.storyPlayerName)||'Player 1';}
function syncStoryNameSettings(){
 const label=document.getElementById('storyNameSettingsCurrent');if(label)label.textContent='Story Mode name: '+storyPlayerName();
 const action=document.getElementById('renameStoryPlayer');if(action){const hidden=!!document.getElementById('titleScreen')?.hidden;action.hidden=hidden;action.closest('.story-name-setting').hidden=hidden;}
}
function saveStoryPlayerName({onlyIfChanged=false}={}){
 const name=normaliseStoryName(piratePlayerName.value),feedback=document.getElementById('storyNameFeedback');
 if(!name){feedback.textContent='Enter a name before saving.';return false;}
 if(onlyIfChanged&&name===storyPlayerName()){piratePlayerName.value=name;return true;}
 // Same persistent career key/schema; name-only save must not award progress or trophies.
 try{
  const next={...career,storyPlayerName:name};localStorage.setItem(CAREER_KEY,JSON.stringify(next));
  if(JSON.parse(localStorage.getItem(CAREER_KEY)||'null')?.storyPlayerName!==name)throw Error('Name not confirmed');
 }catch(e){feedback.textContent='Your name could not be saved. Please check storage and try again.';return false;}
 career.storyPlayerName=name;piratePlayerName.value=name;piratePlayerName.defaultValue=name;
 if(pendingPirateStart)pendingPirateStart.playerName=name;
 if(gameMode==='pirate'&&!currentScenario&&!(typeof schoolSession!=='undefined'&&schoolSession)){playerNames[1]=name;if(state)updateHUD();}
 syncStoryNameSettings();feedback.textContent='Name saved and applied: '+name;return true;
}
piratePlayerName.value=storyPlayerName();piratePlayerName.defaultValue=storyPlayerName();
piratePlaceholder.addEventListener('submit',event=>{event.preventDefault();saveStoryPlayerName();});

syncChapterUnlocks();
applyChapter2BossIdentity();
let frameObjectPots={1:0,2:0},frameFouls={1:0,2:0},frameStatsEligible=false,frameRecorded=false,pendingBlackOnBlackWin=false,pendingOneVisitClearance=false;

/* Supporter entitlement foundation. Entitlements deliberately live outside
   career/progression data: resetting a career must never revoke something a store
   says the player owns. The local record is a cache/test provider only; future
   Google/Apple/web providers can replace the answer without touching gameplay. */
const ENTITLEMENT_KEY='seamenEntitlements',ENTITLEMENT_SCHEMA=1;
const ENTITLEMENTS={supporter_founder_test:{name:'Supporter Founder Test',kind:'supporter'}};
function defaultEntitlements(){return{schema:ENTITLEMENT_SCHEMA,owned:{}};}
function loadEntitlements(){let e=defaultEntitlements();try{const raw=JSON.parse(localStorage.getItem(ENTITLEMENT_KEY)||'null');if(raw&&typeof raw==='object'&&!Array.isArray(raw)){const owned={};for(const [id,value] of Object.entries(raw.owned||{}))if(Object.prototype.hasOwnProperty.call(ENTITLEMENTS,id)&&value===true)owned[id]=true;e={schema:ENTITLEMENT_SCHEMA,owned};}}catch(err){}return e;}
let entitlements=loadEntitlements();
// Developer-panel access is a tab-only override, independent of file-origin storage.
let devSupporterSessionOverride=null;
function nativeSupporterRuntime(){return !!window.SeamenRuntime?.isNativeContainer();}
function hasEntitlement(id){return id==='supporter_founder_test'&&(SeamenSupporter.hasVerifiedOwnership()||!!(IS_DEVELOPMENT_BUILD&&!nativeSupporterRuntime()&&(devSupporterSessionOverride??(entitlements.owned?.[id]===true))));}
function saveEntitlements(){entitlements.schema=ENTITLEMENT_SCHEMA;try{localStorage.setItem(ENTITLEMENT_KEY,JSON.stringify(entitlements));return true;}catch(e){return false;}}
function setDevEntitlement(id,owned){if(!IS_DEVELOPMENT_BUILD||nativeSupporterRuntime()||!Object.prototype.hasOwnProperty.call(ENTITLEMENTS,id))return false;devSupporterSessionOverride=null;entitlements.owned={...(entitlements.owned||{})};if(owned)entitlements.owned[id]=true;else delete entitlements.owned[id];saveEntitlements();validateEquippedCue(!owned);refreshCosmeticsUI?.();refreshDevEntitlementUI();refreshSupportArea?.();renderCareer();renderPirateRoster();return hasEntitlement(id);}
function refreshDevEntitlementUI(){
 const out=document.getElementById('devEntitlementStatus');if(!out)return;
 const allowed=IS_DEVELOPMENT_BUILD&&!nativeSupporterRuntime(),test=allowed&&(devSupporterSessionOverride??(entitlements.owned?.supporter_founder_test===true));
 out.textContent=`Developer supporter test access: ${test?'ON':'OFF'} (web development only).\nChapter 4: ${chapterIsUnlocked('chapter_4')?'AVAILABLE':career.chapters?.chapter_3?.completed?'LOCKED — supporter access required':'LOCKED — complete Chapter 3 first'}.\nGoogle Play ownership: ${SeamenSupporter.hasVerifiedOwnership()?'verified':'not verified by this test pass'}.\nPanel grants last for this tab only; story progress is unchanged.`;
}
function changeDevSupporterAccess(owned){
 const feedback=document.getElementById('devSupporterFeedback');
 const report=(text,accepted)=>{if(feedback){feedback.textContent=text;feedback.dataset.result=accepted?'accepted':'rejected';if(!feedback.closest('[hidden]'))feedback.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});}if(msg)msg.textContent=text;return accepted;};
 if(!IS_DEVELOPMENT_BUILD)return report('Developer supporter access rejected: this is a release build.',false);
 if(nativeSupporterRuntime())return report('Developer supporter access rejected: native ownership must be checked through Google Play.',false);
 if(typeof owned!=='boolean')return report('Developer supporter access rejected: invalid request.',false);
 devSupporterSessionOverride=owned;
 // Revoke an older saved development grant too; storage failures cannot prevent
 // the current-tab override. No career, chapter, trophy or selection is rewritten.
 if(!owned){delete entitlements.owned.supporter_founder_test;saveEntitlements();}
 refreshCosmeticsUI();refreshDevEntitlementUI();refreshSupportArea();renderCareer();renderPirateRoster();
 const progress=career.chapters?.chapter_3?.completed;
 const text=owned
  ?`Developer supporter access granted for this tab. ${progress?'Chapter 4 is available now.':'Chapter 4 remains locked until Chapter 3 is complete.'} No purchase has been made.`
  :`Developer supporter access revoked. ${SeamenSupporter.hasVerifiedOwnership()?'Verified Google Play ownership still grants supporter access.':'Chapter 4 supporter access is locked.'} Story progress is unchanged.`;
 return report(text,true);
}
/* V0.17.0 build 1524: cosmetics declare their own unlock rule. The resolver below
   is shared by every cosmetic type, so future chapters/content do not need bespoke
   cue/table condition code. `unlock` remains player-facing copy; `unlockRule` is logic. */
const COSMETICS={
  tables:{
    classic:{name:'Classic Tavern',description:'The house table. Familiar green cloth and timber.',previewClass:'table-mini-classic',source:'default',sourceId:null,unlock:'Available from the beginning.',unlockRule:{type:'default'}},
    captain:{name:"Captain's Table",description:'Polished timber, brass warmth and richer cloth.',previewClass:'table-mini-captain',source:'default',sourceId:null,unlock:'Available from the beginning.',unlockRule:{type:'default'}},
    spectral:{name:'Spectral Table',description:'Cold glow, spectral mist and ghostly trim.',previewClass:'table-mini-spectral',source:'default',sourceId:null,unlock:'Available from the beginning.',unlockRule:{type:'default'}},
    privates:{name:"Captain Blackball's Privates",description:'Black cloth, glistening gold-painted timber and a suspiciously level surface at sea.',previewClass:'table-mini-privates',source:'campaign',sourceId:'pirate_blackball',unlock:'Defeat Captain Blackball to unlock.',unlockRule:{type:'defeat_pirate',pirate:'blackball'}},
    strangevoice:{name:'Strangevoice Island Table',description:'Worn island timber with muted olive-brown cloth.',previewClass:'table-mini-strangevoice',source:'campaign',sourceId:'chapter_2',unlock:'Begin your first Chapter 2 match to unlock.',unlockRule:{type:'explicit_cosmetic',cosmetic:'tables:strangevoice'}},
    wiggles:{name:"Mr Wiggles' Table",description:'Very pale pastel-pink cloth, worn violet timber and brass details.',previewClass:'table-mini-wiggles',source:'campaign',sourceId:'chapter_2',unlock:'Challenge Mr Wiggles to unlock.',unlockRule:{type:'explicit_cosmetic',cosmetic:'tables:wiggles'}},
    larper:{name:'Mysterious Cave Table',description:'Polished medieval stone-and-iron rails with grey cloth.',previewClass:'table-mini-larper',source:'campaign',sourceId:'chapter_3',unlock:'Defeat Barley Bramblebottom to unlock.',unlockRule:{type:'defeat_pirate',pirate:'barley'}},
    vaper:{name:"Darth Vaper's Control Table",description:'Black cloth, electric-blue rails and translucent rolling vape clouds.',previewClass:'table-mini-vaper',source:'supporter',unlock:'Defeat Darth Vaper with supporter access.',unlockRule:{type:'supporter_victory',pirate:'vaper'}},
    pokey:{name:"Pokey Man's Challenge Table",description:'Cream and sage arena with a red-and-white centre insignia.',previewClass:'table-mini-pokey',source:'supporter',unlock:'Defeat Pokey Man with supporter access.',unlockRule:{type:'supporter_victory',pirate:'pokey_man'}},
    blockbeard:{name:"Blockbeard's Table",description:'A distinctive block-built table with squared pocket surrounds.',previewClass:'table-mini-blockbeard',source:'campaign',sourceId:'chapter_3',unlock:'Defeat Captain Blockbeard to unlock.',unlockRule:{type:'defeat_pirate',pirate:'blockbeard'}}
  },
  cues:{
    classic:{name:'Tavern Cue',description:'Standard house timber. Available to everyone.',previewClass:'cue-preview-classic',source:'default',sourceId:null,unlock:'Available from the beginning.',unlockRule:{type:'default'}},
    dave:{name:"Deckhand Dave's Cue",description:'Darker stained tavern timber.',previewClass:'cue-preview-dave',owner:'Deckhand Dave',source:'campaign',sourceId:'pirate_dave',unlock:'Defeat Deckhand Dave to unlock.',unlockRule:{type:'defeat_pirate',pirate:'dave'}},
    simon:{name:"Sweaty Simon's Cue",description:'House timber with blue stripes.',previewClass:'cue-preview-simon',owner:'Sweaty Simon',source:'campaign',sourceId:'pirate_simon',unlock:'Defeat Sweaty Simon to unlock.',unlockRule:{type:'defeat_pirate',pirate:'simon'}},
    holly:{name:"Holly's Cue",description:'Dark purple with green dreamcatcher-like markings.',previewClass:'cue-preview-holly',owner:'Holly',source:'campaign',sourceId:'pirate_holly',unlock:'Defeat Holly to unlock.',unlockRule:{type:'defeat_pirate',pirate:'holly'}},
    mick:{name:"First Mate Mick's Cue",description:'Navy with gold rings.',previewClass:'cue-preview-mick',owner:'First Mate Mick',source:'campaign',sourceId:'pirate_mick',unlock:'Defeat First Mate Mick to unlock.',unlockRule:{type:'defeat_pirate',pirate:'mick'}},
    blackball:{name:"Captain Blackball's Cue",description:'Polished black and appropriately ominous.',previewClass:'cue-preview-blackball',owner:'Captain Blackball',source:'campaign',sourceId:'pirate_blackball',unlock:'Defeat Captain Blackball to unlock.',unlockRule:{type:'defeat_pirate',pirate:'blackball'}},
    vaper:{name:"Darth Vaper's Cue",description:'A suspiciously hot stick of light.',previewClass:'cue-preview-vaper',owner:'Darth Vaper',source:'campaign',sourceId:'pirate_vaper',unlock:'Defeat Darth Vaper to unlock.',unlockRule:{type:'defeat_pirate',pirate:'vaper'}},
    sandy:{name:"Sandy Mandy's Cue",description:'A playful toy pinwheel-inspired island cue.',previewClass:'cue-preview-sandy',owner:'Sandy Mandy',source:'campaign',sourceId:'chapter_2',unlock:'Defeat Sandy Mandy to unlock.',unlockRule:{type:'defeat_pirate',pirate:'sandy'}},
    shelle:{name:"Shelle's Cue",description:'A smooth pearly-white island cue.',previewClass:'cue-preview-shelle',owner:'Shelle',source:'campaign',sourceId:'chapter_2',unlock:'Defeat Shelle to unlock.',unlockRule:{type:'defeat_pirate',pirate:'shelle'}},
    graham:{name:"Graham's Cue",description:'Deliberately, scientifically boring grey.',previewClass:'cue-preview-graham',owner:'Graham',source:'campaign',sourceId:'chapter_2',unlock:'Defeat Graham to unlock.',unlockRule:{type:'defeat_pirate',pirate:'graham'}},
    papa_surf:{name:"Papa Surf's Cue",description:'A bright blue beachcomber cue.',previewClass:'cue-preview-papa',owner:'Papa Surf',source:'campaign',sourceId:'chapter_2',unlock:'Defeat Papa Surf to unlock.',unlockRule:{type:'defeat_pirate',pirate:'papa_surf'}},
    wiggles:{name:"Mr Wiggles' Cue",description:'A mostly pastel-pink wiggly cue with a straight gameplay axis.',previewClass:'cue-preview-wiggles',owner:'Mr Wiggles',source:'campaign',sourceId:'chapter_2',unlock:'Defeat Mr Wiggles to unlock.',unlockRule:{type:'defeat_pirate',pirate:'chapter2_boss'}},
    carrot:{name:"Barley's Carrot",description:'A leafy orange carrot with the leaves at the tail.',owner:'Barley',source:'campaign',unlockRule:{type:'defeat_pirate',pirate:'barley'}},
    bow:{name:"Legolass's Bow",description:'Ivory bow and white bowstring.',owner:'Legolass',source:'campaign',unlockRule:{type:'defeat_pirate',pirate:'legolass'}},
    claymore:{name:"Aragoon's Claymore",description:'Long steel blade with violet aura.',owner:'Aragoon',source:'campaign',unlockRule:{type:'defeat_pirate',pirate:'aragoon'}},
    souronion:{name:"Souronion's Sword",description:'Dark blade with crimson aura.',owner:'Lord Souronion',source:'campaign',unlockRule:{type:'defeat_pirate',pirate:'souronion'}},
    golden:{name:'The Golden Cue',description:'A magnificent golden cue.',owner:'Captain Blockbeard',source:'campaign',unlockRule:{type:'defeat_pirate',pirate:'blockbeard'}},
    gimlet:{name:"Gimlet's Double Axe",description:'An axe with the striking tip at the haft.',owner:'Gimlet',source:'supporter',unlockRule:{type:'supporter_victory',pirate:'gimlet'},devOnly:true},
    pokey:{name:"Pokey Man's Cue",description:'Half red, half pearly white, with a thick black centre belt.',owner:'Pokey Man',source:'supporter',unlockRule:{type:'supporter_victory',pirate:'pokey_man'}},
    izzy:{name:"Izzy's Furball Cue",description:'Pearly-white cue that sheds persistent cat hairs on every shot.',owner:'Izzy',source:'supporter',unlockRule:{type:'supporter_victory',pirate:'izzy'}},
    bambam:{name:"Bam Bam's Cosy Stick",description:'A fluffy towel-wrapped stick that sheds persistent black cat hairs on every shot.',owner:'Bam Bam',source:'supporter',unlockRule:{type:'supporter_victory',pirate:'bam_bam'},devOnly:true},
    debugger:{name:'The Debugger',description:'Closed-tester exclusive: animated lime-green binary on a black cue.',source:'special',unlock:'Redeem your closed-tester code by 31 December 2026.',unlockRule:{type:'explicit_cosmetic',cosmetic:'cues:debugger'}},
    supporter_test:{name:"Supporter's Test Cue",description:'Entitlement test only — no payment system and not final paid content.',previewClass:'cue-preview-supporter',source:'supporter',sourceId:'supporter_founder_test',unlock:'Supporter entitlement required. (Development test cosmetic.)',unlockRule:{type:'entitlement',entitlement:'supporter_founder_test'},devOnly:true}
  }
};
for(const p of window.SeamenChapter4.opponents)COSMETICS.cues[p.id]={name:p.name+"'s Cue",description:p.id==='vile_hedgehog'?'Bright blue finish, two white stripes near the tip and three floating golden rings around the handle.':({filthy_youth:'Bright pink cue with gold and white stripes.',socks_sandals:'Dark brown cue with a green leaf at the tail and a decorative zigzag.',most_evil:'Rainbow cue with a prominent animated rainbow glow.',lucy_fir:'Fiery black wizard’s staff with an orange glow.'})[p.id],owner:p.name,source:'supporter',sourceId:p.id,unlock:'Defeat '+p.name+' with supporter access.',unlockRule:{type:'k4_victory',pirate:p.id}};
COSMETICS.cues.spinball_wizard={name:"Spinball Wizard's Staff",description:'An elaborate magical staff with a strong pulsating purple glow, cyan spiral highlights, intricate decorations and translucent orbs revolving around the handle.',owner:'Spinball Wizard',source:'supporter',sourceId:'spinball_wizard',unlock:'Defeat Spinball Wizard with supporter access.',unlockRule:{type:'k4_victory',pirate:'spinball_wizard'}};
COSMETICS.tables.lucy_fir={name:"Lucy Fir's Dungeon Table",description:'Charred timber, dark cloth and glowing orange-red pocket rims.',previewClass:'table-mini-lucy',source:'supporter',sourceId:'lucy_fir',unlock:'Defeat Lucy Fir with supporter access.',unlockRule:{type:'k4_victory',pirate:'lucy_fir'}};
const COSMETIC_SOURCE_LABELS={default:'DEFAULT',campaign:'CAMPAIGN',achievement:'ACHIEVEMENT',supporter:'SUPPORTER',special:'SPECIAL'};
function cosmeticKey(type,id){return `${type}:${id}`;}
function pirateDefeated(id,c=career){const pirate=pirateById(id);return !!(pirate&&c.piratesDefeated?.[pirateCareerKey(pirate)]);}
function unlockRuleMet(rule,c=career){
  if(!rule||rule.type==='default')return true;
  if(rule.type==='k4_victory')return hasEntitlement('supporter_founder_test')&&pirateDefeated(rule.pirate,c);
  if(rule.type==='defeat_pirate')return pirateDefeated(rule.pirate,c);
  if(rule.type==='complete_chapter')return !!c.chapters?.[rule.chapter]?.completed;
  if(rule.type==='achievement')return !!c.earnedAchievements?.includes(rule.achievement);
  if(rule.type==='entitlement')return hasEntitlement(rule.entitlement);
  if(rule.type==='supporter_victory')return hasEntitlement('supporter_founder_test')&&pirateDefeated(rule.pirate,c);
  if(rule.type==='explicit_cosmetic')return !!c.unlockedCosmetics?.includes(rule.cosmetic);
  return false;
}
function cosmeticIsUnlocked(type,id){const def=COSMETICS[type]?.[id];return !!(def&&unlockRuleMet(def.unlockRule));}
function unlockedCosmeticKeys(){const out=[];for(const [type,items] of Object.entries(COSMETICS))for(const id of Object.keys(items))if(cosmeticIsUnlocked(type,id))out.push(cosmeticKey(type,id));return out;}
function initialiseCosmeticSeenState(){if(career.cosmeticSeenInitialized)return;career.seenCosmetics=[...new Set([...(career.seenCosmetics||[]),...unlockedCosmeticKeys()])];career.cosmeticSeenInitialized=true;career.schema=CAREER_SCHEMA;try{localStorage.setItem(CAREER_KEY,JSON.stringify(career));}catch(e){}}
function markVisibleCosmeticsSeen(panelKey){const type=panelKey==='tables'?'tables':'cues',seen=new Set(career.seenCosmetics||[]);let changed=false;document.querySelectorAll(`[data-cosmetic-panel="${panelKey}"] [data-theme], [data-cosmetic-panel="${panelKey}"] [data-cue]`).forEach(el=>{const id=el.dataset.theme||el.dataset.cue;if(id&&cosmeticIsUnlocked(type,id)){const key=cosmeticKey(type,id);if(!seen.has(key)){seen.add(key);changed=true;}}});if(changed){career.seenCosmetics=[...seen];try{localStorage.setItem(CAREER_KEY,JSON.stringify(career));}catch(e){}}}
const PIRATE_TROPHY_IDS={1:'pirate_dave',2:'pirate_simon',3:'pirate_holly',4:'pirate_mick',5:'pirate_blackball'};
const ACHIEVEMENT_CATEGORIES={career:'CAREER',skill:'SKILL',special:'SPECIAL WINS',pirates:'PIRATES',exploration:'EXPLORATION'};
const ACHIEVEMENTS=[
 {id:'k4_spinball_wizard',category:'pirates',tier:'GOLD',name:'The Dizzy Wizzy',desc:'Defeat Spinball Wizard.',test:c=>pirateDefeated('spinball_wizard',c),reward:null},
 ...window.SeamenChapter4.opponents.map((p,i)=>({id:"k4_"+p.id,category:"pirates",tier:"GOLD",name:window.SeamenChapter4.trophies[i],desc:"Defeat "+p.name+".",test:c=>pirateDefeated(p.id,c),reward:null})),
 {id:'career_win_001',category:'career',tier:'BRONZE',name:'First blood',desc:'Win your first frame.',test:c=>c.framesWon>=1,reward:null},
 {id:'career_win_010',category:'career',tier:'SILVER',name:'Ten of the best',desc:'Win 10 career frames.',test:c=>c.framesWon>=10,reward:null},
 {id:'career_win_025',category:'career',tier:'GOLD',name:'Tavern regular',desc:'Win 25 career frames.',test:c=>c.framesWon>=25,reward:null},
 {id:'career_win_050',category:'career',tier:'GOLD II',name:'Fifty not out',desc:'Win 50 career frames.',test:c=>c.framesWon>=50,reward:null},
 {id:'career_win_100',category:'career',tier:'PLATINUM',name:'Century of seamen',desc:'Win 100 career frames.',test:c=>c.framesWon>=100,reward:null},
 {id:'career_win_250',category:'career',tier:'PLATINUM II',name:'Quarter-thousand club',desc:'Win 250 career frames.',test:c=>c.framesWon>=250,reward:null},
 {id:'career_win_500',category:'career',tier:'PLATINUM III',name:'Table lifer',desc:'Win 500 career frames.',test:c=>c.framesWon>=500,reward:null},
 {id:'career_win_1000',category:'career',tier:'PRESTIGE I',name:'A thousand victories',desc:'Win 1,000 career frames.',test:c=>c.framesWon>=1000,reward:null},
 {id:'streak_02',category:'skill',tier:'BRONZE',name:'Two on the trot',desc:'Pot 2 legal balls in one uninterrupted visit.',test:c=>c.bestPotStreak>=2,reward:null},
 {id:'streak_03',category:'skill',tier:'SILVER',name:'Three sheets to the wind',desc:'Pot 3 legal balls in one uninterrupted visit.',test:c=>c.bestPotStreak>=3,reward:null},
 {id:'streak_05',category:'skill',tier:'GOLD',name:'Five alive',desc:'Pot 5 legal balls in one uninterrupted visit.',test:c=>c.bestPotStreak>=5,reward:null},
 {id:'streak_07',category:'skill',tier:'PLATINUM',name:'Seven in succession',desc:'Pot 7 legal balls in one uninterrupted visit.',test:c=>c.bestPotStreak>=7,reward:null},
 {id:'clearance_08',category:'skill',tier:'PRESTIGE I',name:'Perfect clearance',desc:'Legally pot all 7 of your group and the black in one uninterrupted visit.',test:c=>c.oneVisitClearances>=1,reward:null},
 {id:'seven_ball',category:'special',tier:'PLATINUM',name:'Seven-ball salute',desc:'Win while your opponent still has all 7 of their colours.',test:c=>c.sevenBallWins>=1,reward:null},
 {id:'black_on_black',category:'special',tier:'GOLD',name:'Last ball standing',desc:'Win a genuine black-on-black frame.',test:c=>c.blackOnBlackWins>=1,reward:null},
 {id:'foul_free_win',category:'special',tier:'GOLD',name:'Clean hands',desc:'Win a full career frame without committing a foul.',test:c=>c.foulFreeWins>=1,reward:null},
 {id:'pirate_dave',category:'pirates',tier:'BRONZE',name:'Deckhand down',desc:'Defeat Deckhand Dave.',test:c=>!!c.piratesDefeated['1'],reward:{type:'cue',id:'dave'}},
 {id:'pirate_simon',category:'pirates',tier:'SILVER',name:'No sweat',desc:'Defeat Sweaty Simon.',test:c=>!!c.piratesDefeated['2'],reward:{type:'cue',id:'simon'}},
 {id:'pirate_holly',category:'pirates',tier:'GOLD',name:'Bean there, done that',desc:'Defeat Holly.',test:c=>!!c.piratesDefeated['3'],reward:{type:'cue',id:'holly'}},
 {id:'pirate_mick',category:'pirates',tier:'PLATINUM',name:'Eye of the Tornado',desc:'Defeat First Mate Mick.',test:c=>!!c.piratesDefeated['4'],reward:{type:'cue',id:'mick'}},
 {id:'pirate_blackball',category:'pirates',tier:'PLATINUM II',name:'Beat the Captain',desc:'Defeat Captain Blackball.',test:c=>!!c.piratesDefeated['5'],reward:{type:'campaign',id:'blackball'}},
 {id:'campaign_pirates_1',category:'pirates',tier:'PLATINUM II',name:"Definitive Pool Shark of Captain Blackball's Domain",desc:"Complete Pirates o' the Tavern by defeating Captain Blackball.",test:c=>!!c.piratesDefeated['5'],reward:null},
 {id:'daves_star_pupil',category:'exploration',tier:'GOLD',name:"Dave's Star Pupil",desc:"Complete the first five lessons at Dave's Pool School. Somehow.",test:c=>[1,2,3,4,5].every(n=>(c.poolSchoolCompleted||[]).includes(n)),reward:null},
 {id:'credits',category:'exploration',tier:'BRONZE',name:'Stayed for the credits',desc:'Read the About / credits section.',test:c=>c.creditsRead,reward:null}
];
// K2F.3: register the chapter 2/3 trophies in the same catalogue as chapter 1.
const CHAPTER_TROPHIES=[
 ['sandy','A Sandy Situation'],['shelle','Shell Shocked!'],['graham','Graham Slam!'],['papa_surf','Stew Lord outstewed'],['chapter2_boss','A Tentacular Triumph!'],
 ['barley','Filthy hobbitses'],['legolass','An Elf of a Shot!'],['aragoon','Return of the Kingpin'],['souronion','One Ring to Pot Them All'],['blockbeard',"It's mine!"]
];
for(const [id,name] of CHAPTER_TROPHIES){
 ACHIEVEMENTS.push({id:'pirate_'+id,category:'pirates',tier:'GOLD',name,desc:'Defeat this chapter opponent.',test:c=>pirateDefeated(id,c),reward:null});
}
for(const [chapter,name] of [['chapter_2','Master of Uncharted Waters'],['chapter_3','From Dave to Cave'],['chapter_4','Five Circles of Hell']]){
 ACHIEVEMENTS.push({id:'campaign_'+chapter,category:'pirates',tier:'PLATINUM',name,desc:'Defeat all five main opponents in this chapter.',test:c=>chapterPirates(chapter,'main').every(p=>pirateDefeated(p.id,c)),reward:null});
}
function trophyIsStorySpoiler(id){
 return (id==='k4_spinball_wizard'&&!pirateDefeated('spinball_wizard'))
     ||(id==='k4_lucy_fir'&&!pirateDefeated('lucy_fir'))
     ||(id==='pirate_chapter2_boss'&&!chapterState('chapter_2').bossIntroSeen)
     ||(id==='pirate_blockbeard'&&!chapterState('chapter_3').blockbeardChallengeSeen);
}
const TROPHIES=ACHIEVEMENTS; // Compatibility alias for older progression/reward helpers.
function achievementById(id){return ACHIEVEMENTS.find(a=>a.id===id)||null;}
function qualifyingAchievementSet(c=career){return new Set(ACHIEVEMENTS.filter(a=>!!a.test(c)).map(a=>a.id));}
function migrateHistoricalAchievements(){const earned=new Set(career.earnedAchievements||[]);for(const id of qualifyingAchievementSet(career))earned.add(id);career.earnedAchievements=[...earned];career.schema=CAREER_SCHEMA;try{localStorage.setItem(CAREER_KEY,JSON.stringify(career));}catch(e){}}
migrateHistoricalAchievements();
initialiseCosmeticSeenState();
let pendingPirateReward=null;
function pirateRewardInfo(levelOrPirate){
  const pirate=typeof levelOrPirate==='object'?levelOrPirate:pirateByLegacyLevel(levelOrPirate);
  if(!pirate)return null;
  const trophy=achievementById(pirate.achievementId);
  const rewards=Array.isArray(pirate.rewards)?pirate.rewards:[];
  const cueReward=rewards.find(r=>r.type==='cue'),tableReward=rewards.find(r=>r.type==='table');
  const main=chapterPirates(pirate.chapter,'main'),index=main.findIndex(p=>p.id===pirate.id),next=pirate.campaignRole==='main'?main[index+1]?.name||null:null;
  return {level:pirate.legacyLevel,pirate:pirate.name,trophy:trophy?.name||'',cue:cueReward?COSMETICS.cues?.[cueReward.id]?.name||'':null,table:tableReward?COSMETICS.tables?.[tableReward.id]?.name||'':null,next,campaign:isChapterBoss(pirate),chapter:pirate.chapter};
}
function rewardSummaryHTML(info){if(!info)return '';const rows=[];if(info.trophy)rows.push(`<div><span aria-hidden="true">🏆</span><p><small>TROPHY UNLOCKED</small><b>${info.trophy}</b></p></div>`);if(info.cue)rows.push(`<div><span aria-hidden="true">🎱</span><p><small>COSMETIC UNLOCKED</small><b>${info.cue}</b></p></div>`);if(info.table)rows.push(`<div><span aria-hidden="true">✨</span><p><small>TABLE UNLOCKED</small><b>${info.table}</b></p></div>`);if(info.next)rows.push(`<div><span aria-hidden="true">🔓</span><p><small>NEW OPPONENT</small><b>${info.next}</b></p></div>`);if(info.campaign)rows.push(`<div><span aria-hidden="true">🏴‍☠️</span><p><small>CAMPAIGN MILESTONE</small><b>Definitive Pool Shark of Captain Blackball's Domain</b></p></div>`);return `<h3>PIRATE DEFEATED — ${info.pirate}</h3>${rows.join('')}`;}
function cueUnlocked(cueId){return cosmeticIsUnlocked('cues',cueId);}
function validateEquippedCue(force=false){if(!force&&COSMETICS.cues[equippedCue]?.source==='supporter')return;if(!cueUnlocked(equippedCue)){equippedCue='classic';try{localStorage.setItem('seamenCue',equippedCue)}catch(e){}}}
let trophyKnownUnlocked=new Set(career.earnedAchievements||[]),trophyToastQueue=[],trophyToastBusy=false;
function trophyUnlockSet(c=career){return new Set(c.earnedAchievements||[]);}
function soundTrophyUnlocked(){tone(740,.12,.09,'square');tone(988,.20,.08,'triangle',.07);tone(1319,.38,.07,'sine',.18);tone(1760,.62,.055,'sine',.42);tone(2217,.82,.045,'sine',.78);tone(2637,1.02,.038,'sine',1.16);tone(3296,.72,.026,'sine',1.48);}
function enqueueTrophyToast(id){const trophy=achievementById(id);if(!trophy)return;trophyToastQueue.push(trophy);runTrophyToastQueue();}
function runTrophyToastQueue(){if(trophyToastBusy||!trophyToastQueue.length)return;const trophy=trophyToastQueue.shift(),toast=document.getElementById('trophyToast');if(!toast){trophyToastBusy=false;return;}trophyToastBusy=true;document.getElementById('trophyToastName').textContent=`${trophy.tier} — ${trophy.name}`;document.getElementById('trophyToastDesc').textContent=trophy.desc;toast.hidden=false;toast.style.display='flex';toast.style.visibility='visible';toast.style.opacity='0';void toast.offsetWidth;requestAnimationFrame(()=>{toast.classList.add('show');toast.style.opacity='1';});soundTrophyUnlocked();setTimeout(()=>{toast.classList.remove('show');toast.style.opacity='0';},2500);setTimeout(()=>{toast.hidden=true;toast.style.display='none';toast.style.visibility='hidden';trophyToastBusy=false;runTrophyToastQueue();},2850);}
function syncAchievements(previous=trophyKnownUnlocked){const earned=new Set(career.earnedAchievements||[]),qualified=qualifyingAchievementSet(career),newIds=[];for(const id of qualified){if(!earned.has(id)){earned.add(id);if(!previous.has(id))newIds.push(id);}}career.earnedAchievements=[...earned];trophyKnownUnlocked=new Set(earned);for(const id of newIds)enqueueTrophyToast(id);}
function checkNewTrophies(previous=trophyKnownUnlocked){syncAchievements(previous);}
let devForcedWin=false;
function saveCareer(previousUnlocked=null){reconcileChapterVictoryEvidence(career);syncChapterUnlocks();career.schema=CAREER_SCHEMA;const previous=previousUnlocked||new Set(trophyKnownUnlocked);syncAchievements(previous);try{localStorage.setItem(CAREER_KEY,JSON.stringify(career));}catch(e){}renderCareer();}
function careerPlayerEligible(player){return player===1&&gameMode!=='school'&&gameMode!=='aivai'&&!currentScenario;}
function resetFrameCareerTracking(){frameObjectPots={1:0,2:0};frameFouls={1:0,2:0};frameRecorded=false;pendingBlackOnBlackWin=false;pendingOneVisitClearance=false;frameStatsEligible=(gameMode==='pirate'||gameMode==='local')&&!currentScenario;}
function noteCareerShot(player){if(frameStatsEligible&&careerPlayerEligible(player)){career.shotsTaken++;saveCareer();}}
function noteCareerObjectPots(player,pots){if(!frameStatsEligible)return;const n=pots.filter(t=>t==='red'||t==='yellow').length;frameObjectPots[player]=(frameObjectPots[player]||0)+n;}
function noteCareerLegalPots(player,count){if(!frameStatsEligible||!careerPlayerEligible(player)||count<=0)return;career.legalBallsPotted+=count;const streak=(potStreakPlayer===player?potStreakCount:0);career.bestPotStreak=Math.max(career.bestPotStreak,streak);saveCareer();}
function noteCareerFoul(player){if(frameStatsEligible&&careerPlayerEligible(player)){frameFouls[player]=(frameFouls[player]||0)+1;career.foulsCommitted++;saveCareer();}}
function noteOneVisitClearance(player){if(!frameStatsEligible||!careerPlayerEligible(player)||pendingOneVisitClearance)return;pendingOneVisitClearance=true;career.oneVisitClearances++;saveCareer();}
function recordCareerFrame(winner){if(gameMode==='school'||!frameStatsEligible||frameRecorded)return;const trophiesBefore=new Set(career.earnedAchievements||[]),now=new Date().toISOString(),pirate=gameMode==='pirate'?activePirate():null;frameRecorded=true;career.framesPlayed++;if(winner===1){career.framesWon++;if(!career.history.firstWin)career.history.firstWin=now;if(!devForcedWin&&state?.groups?.[2]&&remaining(state.groups[2])===7)career.sevenBallWins++;if(!devForcedWin&&pendingBlackOnBlackWin)career.blackOnBlackWins++;if(!devForcedWin&&(frameFouls[1]||0)===0)career.foulFreeWins++;if(pirate){const key=pirateCareerKey(pirate),wasDefeated=!!career.piratesDefeated[key];career.piratesDefeated[key]=true;if(!wasDefeated&&!career.history.firstPirateDefeated&&pirate.legacyLevel!=null)career.history.firstPirateDefeated={level:pirate.legacyLevel,at:now};if(isChapterBoss(pirate)){completeChapter(pirate.chapter);if(pirate.chapter==='chapter_1'&&!career.history.chapterOneCompleted)career.history.chapterOneCompleted=now;}}}else career.framesLost++;if(pirate){const key=pirateCareerKey(pirate),rec=career.pirateRecords[key]||{wins:0,losses:0};if(winner===1)rec.wins++;else rec.losses++;career.pirateRecords[key]=rec;}saveCareer(trophiesBefore);}
function renderCareer(){
 renderStoryReminder();
 const grid=document.getElementById('careerStatsGrid');if(grid){const pct=career.framesPlayed?Math.round(career.framesWon/career.framesPlayed*100):0,potsPer100=career.shotsTaken?Math.round(career.legalBallsPotted/career.shotsTaken*100):0,foulsPerFrame=career.framesPlayed?(career.foulsCommitted/career.framesPlayed).toFixed(2):'0.00';const sections=[['CAREER RECORD',[['Frames played',career.framesPlayed],['Wins',career.framesWon],['Losses',career.framesLost],['Win rate',pct+'%']]],['POTTING AND PERFORMANCE',[['Shots taken',career.shotsTaken],['Legal balls potted',career.legalBallsPotted],['Pots per 100 shots',potsPer100],['Best pot streak',career.bestPotStreak],['One-visit clearances',career.oneVisitClearances]]],['DISCIPLINE',[['Fouls committed',career.foulsCommitted],['Fouls per frame',foulsPerFrame],['Foul-free wins',career.foulFreeWins]]],['SPECIAL VICTORIES',[['7-ball wins',career.sevenBallWins],['Black-on-black wins',career.blackOnBlackWins]]]];grid.innerHTML=sections.map(([title,items])=>`<section class="career-stat-section"><h3>${title}</h3><div class="career-stat-section-grid">${items.map(([label,value])=>`<div class="career-stat"><b>${value}</b><small>${label}</small></div>`).join('')}</div></section>`).join('');}
 const pp=document.getElementById('pirateProgress');if(pp){const mainPirates=chapterPirates('chapter_1','main');pp.innerHTML=mainPirates.map((pir,i)=>{const done=pirateDefeated(pir.id),rewardNames=(pir.rewards||[]).map(r=>COSMETICS[r.type==='table'?'tables':`${r.type}s`]?.[r.id]?.name).filter(Boolean),next=mainPirates[i+1]?.name||null,rec=career.pirateRecords[pirateCareerKey(pir)]||{wins:0,losses:0};return `<div class="pirate-progress-item ${done?'defeated':''}"><b>${pir.name}</b><small>${done?'DEFEATED ✓':'Not defeated'}</small><strong class="pirate-record">W ${rec.wins||0} / L ${rec.losses||0}</strong><span>Reward: ${rewardNames.join(' + ')||'None'}</span>${next?`<span>Next opponent: ${next}</span>`:`<span>Main campaign finale</span>`}</div>`}).join('');}
 const history=document.getElementById('careerHistory');if(history){const fmt=v=>{if(!v)return '—';try{return new Intl.DateTimeFormat(undefined,{year:'numeric',month:'short',day:'numeric'}).format(new Date(v));}catch(e){return '—';}},fp=career.history?.firstPirateDefeated,firstPirate=fp&&PIRATES[fp.level]?`${PIRATES[fp.level].name} • ${fmt(fp.at)}`:'—';history.innerHTML=`<h3>PLAYER HISTORY</h3><div class="career-history-grid"><div><small>Career started</small><b>${fmt(career.history?.careerStarted)}</b></div><div><small>First frame won</small><b>${fmt(career.history?.firstWin)}</b></div><div><small>First pirate defeated</small><b>${firstPirate}</b></div><div><small>Chapter I completed</small><b>${fmt(career.history?.chapterOneCompleted)}</b></div></div>`;}
 const completion=document.getElementById('campaignCompletion');if(completion){const conquered=!!career.chapters?.chapter_1?.completed;completion.hidden=!conquered;if(conquered)completion.innerHTML=`<div class="campaign-completion-crown" aria-hidden="true">🏆</div><div><small>MAIN PIRATE CAMPAIGN COMPLETE</small><h3>DEFINITIVE POOL SHARK OF CAPTAIN BLACKBALL'S DOMAIN</h3><p>Defeated Captain Blackball aboard his ship and conquered Pirates o' the Tavern.</p><div class="uncharted-waters-tease"><b>Uncharted Waters</b><span>Strange challengers are rumoured beyond the known seas...</span></div></div>`;}
 const tg=document.getElementById('trophyGrid');if(tg){const earned=new Set(career.earnedAchievements||[]);tg.innerHTML=Object.keys(ACHIEVEMENT_CATEGORIES).map(category=>{const items=ACHIEVEMENTS.filter(a=>a.category===category&&!trophyIsStorySpoiler(a.id)).map(a=>{const won=earned.has(a.id);return `<div class="trophy-item ${won?'unlocked':''}" data-trophy="${a.id}"><span class="trophy-tier tier-${a.tier.toLowerCase().replace(/\s+/g,'-')}">${a.tier}</span><b>${a.name}</b><small>${a.desc}</small><em>${won?'UNLOCKED ✓':'LOCKED'}</em></div>`}).join('');return `<section class="achievement-category" data-achievement-category="${category}"><h3>${ACHIEVEMENT_CATEGORIES[category]}</h3><div class="achievement-category-grid">${items}</div></section>`}).join('');}
 const dev=document.getElementById('devProgressStats');if(dev)dev.textContent=`Schema: ${career.schema}\nFrames: ${career.framesPlayed} | W ${career.framesWon} | L ${career.framesLost}\nShots: ${career.shotsTaken} | Legal pots: ${career.legalBallsPotted} | Fouls: ${career.foulsCommitted}\nBest pot streak: ${career.bestPotStreak} | 7-ball wins: ${career.sevenBallWins} | Black-on-black wins: ${career.blackOnBlackWins}\nFoul-free wins: ${career.foulFreeWins} | One-visit clearances: ${career.oneVisitClearances}\nAchievements earned: ${(career.earnedAchievements||[]).length}/${ACHIEVEMENTS.length}\nPirate records: ${JSON.stringify(career.pirateRecords||{})}\nCredits read: ${career.creditsRead} | Legacy lifetime premium: ${career.lifetimePremium}\nSupporter test entitlement: ${hasEntitlement('supporter_founder_test')?'YES':'NO'}\nBlackball intro: ${career.blackballIntroSeen} | ending: ${career.blackballEndingSeen}\nPirates defeated: ${Object.keys(career.piratesDefeated).filter(k=>career.piratesDefeated[k]).join(', ')||'none'}`;
}
function pirateIsOpen(pirateOrId){
  const p=typeof pirateOrId==='object'?pirateOrId:(typeof pirateOrId==='string'?pirateById(pirateOrId):pirateByLegacyLevel(pirateOrId));
  if(!p)return false;
  if(devPirateAccessActive())return devPirateAvailable(p);
  if(!chapterIsUnlocked(p.chapter))return false;
  if(p.playable===false)return false;
  if(p.campaignRole==='bonus'){return hasEntitlement('supporter_founder_test')||!!(IS_DEVELOPMENT_BUILD&&!nativeSupporterRuntime()&&devPiratesUnlocked);}
  if(IS_DEVELOPMENT_BUILD&&devChapterTestAccess&&['chapter_2','chapter_3'].includes(p.chapter))return true;
  if(p.unlockRule)return unlockRuleMet(p.unlockRule);
  if(p.chapter==='chapter_1'&&p.legacyLevel!=null)return p.legacyLevel<=getUnlockedPirateLevel();
  return true;
}
const DAVE_FIRST_SELECTION_KEY='seamenDaveFirstSelectionSeen';
const FIRST_RUN_PATH_KEY='seamenFirstRunPathComplete';
function daveFirstSelectionSeen(){try{return localStorage.getItem(DAVE_FIRST_SELECTION_KEY)==='1'}catch(e){return false}}
function firstRunPathComplete(){try{return localStorage.getItem(FIRST_RUN_PATH_KEY)==='1'}catch(e){return false}}
function firstRunGuideActive(){return !firstRunPathComplete()&&!daveFirstSelectionSeen()&&career.framesPlayed===0&&!career.piratesDefeated?.['1'];}
function completeFirstRunPath(){try{localStorage.setItem(FIRST_RUN_PATH_KEY,'1');localStorage.setItem(DAVE_FIRST_SELECTION_KEY,'1')}catch(e){}refreshFirstRunGuidance();}
function refreshFirstRunGuidance(){const active=firstRunGuideActive();document.getElementById('titlePlay')?.classList.toggle('first-run-attention',active&&!document.getElementById('titleScreen')?.hidden);document.getElementById('pirateMode')?.classList.toggle('first-run-attention',active&&!document.getElementById('modeMenu')?.hidden);document.querySelector('.pirate-choice[data-pirate-id="dave"]')?.classList.toggle('first-pirate-attention',active&&!document.getElementById('piratePlaceholder')?.hidden&&document.getElementById('pirateProfileModal')?.hidden);document.getElementById('challengePirate')?.classList.toggle('first-run-attention',active&&!document.getElementById('pirateProfileModal')?.hidden&&profiledPirateId==='dave');document.getElementById('startPirateMatch')?.classList.toggle('first-run-attention',active&&!document.getElementById('pirateIntroModal')?.hidden&&pendingPirateStart?.pirateId==='dave');}
function shouldHighlightDave(){return firstRunGuideActive();}
// Optional Chapter 0 training uses the ordinary physics and EPA rule evaluator.
let schoolCosmeticLesson=false,schoolSession=null;
function awardSchoolLesson(id){
 const before=new Set(trophyKnownUnlocked);
 if(!(career.poolSchoolCompleted||[]).includes(id))career.poolSchoolCompleted=[...(career.poolSchoolCompleted||[]),id];
 saveCareer(before);
}
function completeSchoolLesson(id){
 awardSchoolLesson(id);
 schoolCosmeticLesson=false;
 document.getElementById('schoolCosmeticGuide')?.remove();
 leaveSchoolTable();
 if(cosmeticsScreen)cosmeticsScreen.hidden=true;
 if(titleScreen)titleScreen.hidden=true;
 showPoolSchool();
}
function startSchoolCosmeticLesson(){resetCueSpin();
 if(schoolSession)leaveSchoolTable();
 schoolCosmeticLesson=true;
 let guide=document.getElementById('schoolCosmeticGuide');if(!guide){guide=document.createElement('p');guide.id='schoolCosmeticGuide';guide.className='pool-school-coach';cosmeticsScreen.querySelector('.cosmetics-heading').append(guide);}
 document.querySelector('[data-cosmetic-filter="all"]')?.click();
 guide.textContent='Dave: Equip any owned table or cue by selecting its card. The house equipment counts too. Locked rewards need their usual unlocks; this lesson grants none. Clicking back to title without selecting a new table design to try won’t earn you a tick here!';
 document.getElementById('poolSchoolScreen').hidden=true;
 titleScreen.hidden=true;
 cosmeticsScreen.hidden=false;
 refreshCosmeticsUI();
}

// Guidance lives outside the split-pane match layout so it cannot consume
// the controls' scroll area. New teaching text always reopens for the pupil.
function setSchoolTip(open,dismissed=false){
 if(!schoolSession)return;
 schoolSession.tipOpen=open;schoolSession.tipDismissed=dismissed;
 const panel=document.getElementById('schoolCoach');
 if(!panel)return;
 panel.hidden=dismissed;
 panel.classList.toggle('is-minimised',!open);
 document.getElementById('schoolTipBody').hidden=!open;
 const toggle=document.getElementById('schoolTipToggle');
 toggle.setAttribute('aria-expanded',String(open));
 toggle.title=open?'Minimise Dave’s guidance':'Expand Dave’s guidance';
 document.getElementById('schoolTipIndicator').textContent=open?'Hide':'Read';
}
function schoolPanel(text){
 let panel=document.getElementById('schoolCoach');
 if(!panel){
  panel=document.createElement('aside');panel.id='schoolCoach';panel.className='school-tip';panel.setAttribute('aria-label','Dave’s lesson guidance');
  panel.innerHTML='<div class="school-tip-heading"><button type="button" id="schoolTipToggle" aria-controls="schoolTipBody" aria-expanded="false"><span id="schoolTipTitle"></span><span id="schoolTipIndicator" aria-hidden="true">Read</span></button><button type="button" id="schoolTipClose" aria-label="Close Dave’s guidance" title="Close guidance">×</button></div><div id="schoolTipBody" hidden><p role="status"></p><div class="school-tip-actions"><button type="button" id="schoolRetry">Restart lesson</button><button type="button" id="schoolExit">Back to lessons</button></div></div>';
  document.body.append(panel);
  document.getElementById('schoolTipToggle').onclick=()=>setSchoolTip(!schoolSession.tipOpen);
  document.getElementById('schoolTipClose').onclick=()=>setSchoolTip(false,true);
  document.getElementById('schoolRetry').onclick=()=>startSchoolLesson(schoolSession.id);
  document.getElementById('schoolExit').onclick=()=>{leaveSchoolTable();showPoolSchool();};
  const menuActions=document.createElement('div');menuActions.id='schoolMenuActions';menuActions.className='school-menu-actions';menuActions.hidden=true;
  menuActions.innerHTML='<button type="button" class="modal-secondary" id="schoolShowTip">Dave’s lesson guidance</button><button type="button" class="modal-secondary" id="schoolMenuRetry">Restart lesson</button><button type="button" class="modal-secondary" id="schoolMenuExit">Back to lessons</button>';
  gameMenuModal.querySelector('.rules-modal-card').append(menuActions);
  document.getElementById('schoolShowTip').onclick=()=>{resumePausedGame();setSchoolTip(true);};
  document.getElementById('schoolMenuRetry').onclick=()=>startSchoolLesson(schoolSession.id);
  document.getElementById('schoolMenuExit').onclick=()=>{leaveSchoolTable();showPoolSchool();};
  // Reading guidance never blocks gameplay; using the table/controls minimises it.
  gameApp.addEventListener('pointerdown',e=>{
   if(schoolSession&&e.target.closest('.table-wrap,.controls,.cue-helm-wrap,.cue-placement-controls'))setSchoolTip(false,schoolSession.tipDismissed);
  },true);
 }
 document.getElementById('schoolTipTitle').textContent='Dave: '+POOL_SCHOOL_LESSONS.find(l=>l.id===schoolSession.id).title;
 panel.querySelector('p').textContent=text;
 document.getElementById('schoolMenuActions').hidden=false;
 // Every teaching trigger must be readable, even when it repeats a message.
 setSchoolTip(true);
 document.getElementById('schoolTipBody').scrollTop=0;
}
function leaveSchoolTable(){
 if(!schoolSession)return;
 resetCueSpin();
 const previous=schoolSession.preferences;schoolSession=null;
 gameApp.classList.remove('pool-school-active');gamePaused=false;gameMenuModal.hidden=true;rulesHelpModal.hidden=true;playerNames=previous.names;
 if(gameMenuConcede)gameMenuConcede.hidden=false;
 aimMethod=previous.method;aimArrows=previous.arrows;devAngleGuide=previous.guide;
 moving=false;shot=null;clearTimeout(aiTimer);clearTimeout(aiWatchdogTimer);
 document.getElementById('schoolCoach').hidden=true;document.getElementById('schoolMenuActions').hidden=true;gameApp.hidden=true;
}
function schoolPracticeRack(id,corrective=false){resetCueSpin();
 // A straight pot into the top middle pocket, with room to practice aiming.
 const x=CENTRE_X;
 balls=[ball(x,T+240,'white','cue'),ball(x,T+100,'red',1),ball(L+200,H/2,'yellow',2),ball(R-240,H/2,'black',3)];
 if(id===1)balls.find(b=>b.type==='yellow').type='red';
 if(id===3&&!corrective){balls[0].y=T+160;balls[1].x=L+230;}
 if(id===3&&corrective){balls[0].y=T+340;balls[2].x=x;balls[2].y=T+260;}
 if(id===4){balls[3].x=x+250;balls[3].y=T+100;}
 state=newState(1);state.breakShot=false;
 if(id===4||corrective)state.groups={1:'red',2:'yellow'};
 moving=false;shot=null;placementMode=corrective?'anywhere':'none';pendingChoice=null;choice.hidden=true;shootBtn.disabled=corrective;
 setAngleDeg(270);powerEl.value=35;powerText.textContent='35%';updateHUD();
}
function startSchoolLesson(id){
 if(schoolSession)leaveSchoolTable();
 schoolCosmeticLesson=false;schoolSession={id,phase:'practice',tipOpen:true,repeatShots:true,used:new Set(),preferences:{method:aimMethod,arrows:aimArrows,guide:devAngleGuide,names:{...playerNames}}};
 gamePaused=false;gameMenuModal.hidden=true;rulesHelpModal.hidden=true;gameApp.classList.add('pool-school-active');
 playerNames={1:'Pupil',2:'Dave'};
 if(gameMenuConcede)gameMenuConcede.hidden=true;
 clearTimeout(aiTimer);clearTimeout(aiWatchdogTimer);aiThinking=false;aiPlayer=null;gameMode='school';currentScenario=null;forcedTableTheme=null;
 resetFrameCareerTracking();resetPotStreak();
 titleScreen.hidden=true;playersModal.hidden=true;winModal.hidden=true;document.getElementById('poolSchoolScreen').hidden=true;gameApp.hidden=false;
 aimMethod='simulation';aimArrows=true;devAngleGuide=true;schoolPracticeRack(id);
 const instructions={1:'Simulation aiming predicts the path; animated arrows show travel direction. Try the Cue Helm, a fine ±0.1° adjustment and SHOT POWER, then clear both reds and legally pot the black to finish. The first red is lined up with the middle pocket: aim up (270°), around 35% power.',2:'To pass this lesson, claim the YELLOW group with a legal pot, then legally pot the black to win. Reds and yellows are groups: hit a colour first and legally pot it to claim that group. A miss does not claim colours; black first is a foul. Tip: an aim angle of 168.8° with shot power around 50% will pot the yellow and knock the red out of the way, clearing a path for the black.',3:'First, demonstrate an in-off: shoot the white straight into the middle pocket (270°). Under EPA International rules, the other player receives something called \'cue ball in hand\', not two visits (or two turns). Then you will practice the incoming player’s corrective action.',4:'You are RED with one colour left. Clear it legally before potting the black on a separate shot. Black early, wrong first contact or an in-off cannot pass. Start with the red above the white (270°, around 35%).'};
 schoolPanel(instructions[id]);msg.textContent='Training table — career statistics and campaign rewards are disabled.';
}
// Shared training policy: evaluate every shot with normal EPA rules, then hand
// the practice table back to the pupil instead of scheduling an opponent.
// A frame-ending black stops on its actual result; only Restart lesson re-racks.
function continueSchoolPractice(completed,text){
 state.player=completed.player;
 shootBtn.disabled=placementMode!=='none';
 updateHUD();
 schoolPanel(text);
}
function stopSchoolPractice(completed){
 const session=schoolSession;
 session.phase=completed?'complete':'finished';session.repeatShots=false;
 moving=false;shootBtn.disabled=true;placementMode='none';
 clearTimeout(aiTimer);clearTimeout(aiWatchdogTimer);
 updateHUD();
 if(completed){
  awardSchoolLesson(session.id);
  schoolPanel('Lesson complete! Well done — you finished legally and your completion tick is saved. Return to lessons when you are ready, or choose Restart lesson to play again.');
 }else{
  schoolPanel(session.id===2&&state.groups[1]==='red'&&state.winner===1?'You won on RED, but this lesson requires claiming YELLOW before legally potting the black. Choose Restart lesson to try for yellow; no new tick is awarded for a red-group win.':`${lastShotEl.textContent} — This practice frame has ended. Your table will stay as it is. Choose Restart lesson to try again, or return to lessons.`);
 }
 setSchoolTip(true);
}
function startSchoolCorrection(feedback=''){
 const session=schoolSession;
 session.phase='correction';schoolPracticeRack(3,true);
 session.placement={x:cue().x,y:cue().y};session.confirmedPlacement=null;
 schoolPanel(feedback+"You've potted the white! That's an in-off, and your opponent gets cue-ball-in-hand. I've put the white in a rotten spot behind the yellow. Move it somewhere you can easily pot the RED, press CONFIRM, then sink that red to finish the lesson!");
}
function schoolShotResolved(completed){
 const session=schoolSession;if(!session?.repeatShots)return;
 const legal=!completed.cuePotted&&legalSchoolContact(completed)&&(completed.pots.length>0||completed.cushionAfterContact);
 if(session.id===3&&session.phase==='practice'&&completed.cuePotted){
  session.inOffDemonstrated=true;startSchoolCorrection();return;
 }
 if(session.id===1&&legal&&completed.pots.includes('red'))session.redPotted=true;
 let success=false;
 // Legal clearance is the completion criterion. Input-method bookkeeping must
 // never reject a fair finish (mouse, touch, keyboard and sliders all count).
 if(session.id===1)success=legal&&completed.startOn==='black'&&state.winner===completed.player;
 if(session.id===2){
  if(legal&&completed.startOn==='open'&&state.groups[completed.player]==='yellow')session.yellowClaimed=true;
  success=session.yellowClaimed&&state.groups[completed.player]==='yellow'&&legal&&completed.startOn==='black'&&state.winner===completed.player;
 }
 if(session.id===3&&session.phase==='correction'){
  const placed=session.confirmedPlacement,start=completed.schoolPlacement;
  const confirmed=placed&&start&&Math.hypot(placed.x-session.placement.x,placed.y-session.placement.y)>1&&Math.hypot(start.x-placed.x,start.y-placed.y)<.01;
  success=session.inOffDemonstrated&&confirmed&&legal&&completed.startOn==='red'&&completed.pots.includes('red')&&placementMode==='none'&&!state.frameOver;
  if(success){stopSchoolPractice(true);return;}
  const reason=!confirmed?'Move the white to a different legal position and CONFIRM it.':!legal||placementMode!=='none'||state.frameOver?'That shot was a foul; the red must be potted legally.':'You need to pot the RED, not just make a legal shot.';
  startSchoolCorrection('No tick yet — '+reason+' Try the corrective placement again. ');return;
 }
 if(session.id===4){
  if(legal&&completed.startOn==='red'&&completed.pots.includes('red'))session.cleared=true;
  success=session.cleared&&state.winner===completed.player&&completed.startOn==='black'&&legal;
 }
 if(success){session.objectiveComplete=true;awardSchoolLesson(session.id);}
 if(state.frameOver){
  stopSchoolPractice(legal&&state.winner===completed.player&&!!session.objectiveComplete);return;
 }
 if(session.id===1&&legal&&completed.pots.includes('red')){
  continueSchoolPractice(completed,remaining('red')===0?'Good pot! Both reds are cleared. Now legally pot the black to finish this lesson.':"Good pot! Now it's time to finish up this lesson. First, practice all three controls: Cue Helm, fine aim and shot power. Clear the remaining red, then legally pot the black to finish. You can keep taking shots.");return;
 }
 if(session.id===2&&state.groups[completed.player]){
  continueSchoolPractice(completed,state.groups[completed.player]==='yellow'?'YELLOW claimed! Now legally pot the black without the white going in as well to win and earn your completion tick.':'You claimed RED. To pass this lesson you must claim YELLOW and then legally pot the black. Choose Restart lesson to try for yellow.');return;
 }
 if(session.objectiveComplete){
  continueSchoolPractice(completed,'Lesson objective complete — your tick is saved. Keep taking practice shots, clear your colour, then legally pot the black to finish. You can also return to lessons from Dave’s guidance or the Game menu.');return;
 }
 if(session.id===4&&session.cleared&&legal){
  continueSchoolPractice(completed,'Final red cleared. Now you are on BLACK. Aim at the black and pot it legally without the white going in as well. Use the simulation guide to line up the pocket.');return;
 }
 if(session.id===1&&!remaining('red')&&!state.groups[completed.player]){
  state.frameOver=true;stopSchoolPractice(false);return;
 }
 continueSchoolPractice(completed,`${lastShotEl.textContent} — Keep trying. ${placementMode!=='none'?'Place and confirm the white before your next shot. ':''}Dave hands the practice table back to you; normal matches still follow the usual turn rules.`);
}
function legalSchoolContact(s){return s.startOn==='open'?['red','yellow'].includes(s.firstContact):s.firstContact===s.startOn;}

const POOL_SCHOOL_LESSONS=[
 {id:1,title:'Meet Your Cue',detail:'Aiming, fine adjustments and shot power'},
 {id:2,title:'Pick Your Colours',detail:'Reds, yellows and legal first contact'},
 {id:3,title:"Don't Pot the White!",detail:'Fouls, cue-ball placement and visits'},
 {id:4,title:'The Black Ball',detail:'Finishing a frame legally'},
 {id:5,title:'Look the Part',detail:'Rewards and equipping Cosmetics'}
];
function schoolCompleted(){return new Set(career.poolSchoolCompleted||[])}
function renderPoolSchool(){
 const list=document.getElementById('poolSchoolLessons'),progress=document.getElementById('poolSchoolProgress');if(!list)return;
 const completed=schoolCompleted();list.replaceChildren();
 for(const lesson of POOL_SCHOOL_LESSONS){const item=document.createElement('div');item.className='pool-school-lesson';
 const label=document.createElement('div');const title=document.createElement('b');title.textContent=`${completed.has(lesson.id)?'✓ ':''}${lesson.id}. ${lesson.title}`;
 const description=document.createElement('small');description.textContent=lesson.detail;label.append(title,description);
 const button=document.createElement('button');button.type='button';button.className='modal-secondary';button.textContent=completed.has(lesson.id)?'Replay':'Start lesson';button.addEventListener('click',()=>lesson.id===5?startSchoolCosmeticLesson():startSchoolLesson(lesson.id));
 item.append(label,button);list.append(item);}
 const count=[1,2,3,4,5].filter(n=>completed.has(n)).length;
 if(progress)progress.textContent=`${count}/5 original lessons complete • ${count===5?'Dave’s Star Pupil earned!':'Graduation trophy after all five'} • Additional lessons may be added later.`;
}
function showPoolSchool(){const screen=document.getElementById('poolSchoolScreen');if(!screen)return;renderPoolSchool();if(playersModal)playersModal.hidden=true;if(titleScreen)titleScreen.hidden=true;screen.hidden=false;}
function updateRosterHeading(){const heading=document.getElementById('pirateRosterHeading');if(!heading)return;heading.textContent=chapterIsUnlocked('chapter_4')?"Pirates o’ the worlds":chapterIsUnlocked('chapter_2')?"Pirates o’ the islands":"Pirates o’ the tavern";}
function renderPirateRoster(){
  if(storyRenameFromSettings){document.getElementById('pirateRosterHeading').textContent='Your Story Mode name';return;}
  const list=document.getElementById('pirateList');if(!list)return;const retainedRosterScroll=piratePlaceholder.scrollTop;updateRosterHeading();
  const chapters=Object.values(CHAPTERS).filter(ch=>!ch.hidden&&(ch.id==='chapter_2'||ch.id==='chapter_3'||ch.id==='chapter_4'||chapterIsUnlocked(ch.id)));
  const unseen=unlockedCosmeticKeys().some(key=>!(career.seenCosmetics||[]).includes(key));
  const newCosmeticsNotice=unseen?'<div class="roster-new-cosmetics" role="status">✦ NEW COSMETICS UNLOCKED</div>':'';
  list.innerHTML=newCosmeticsNotice+`<div class="pirate-chapter-heading"><b>CHAPTER 0 • OPTIONAL</b><small>Dave’s Pool School</small></div><button class="pirate-choice unlocked" id="openPoolSchool" type="button"><b>Dave’s Pool School</b><small>${[1,2,3,4,5].filter(n=>schoolCompleted().has(n)).length}/5 lessons completed • Optional training</small></button>`+chapters.map(ch=>{
    const main=chapterPirates(ch.id,'main').filter(p=>!p.devOnly),bonus=chapterPirates(ch.id,'bonus').filter(p=>!p.devOnly);
    const roster=[...main,...bonus];
    const chState=chapterState(ch.id),chapterOpen=chapterIsUnlocked(ch.id),status=ch.id==='chapter_4'&&!chapterOpen&&career.chapters?.chapter_3?.completed&&nativeSupporterRuntime()&&['checking','verification_unavailable'].includes(SeamenSupporter.getState().status)?'CHECK OWNERSHIP':ch.postRelease?'COMING SOON':!chapterOpen?'LOCKED':chState.completed?'COMPLETE ✓':'AVAILABLE';const heading=`<div class="pirate-chapter-heading"><b>CHAPTER ${ch.number} • ${status}</b><small>${ch.name}${ch.testOnly?' • TEMPORARY ARCHITECTURE PROOF':''}</small></div>`;
    if(ch.id==='chapter_4')return heading+(chapterOpen?roster.map(p=>`<button class="pirate-choice" data-pirate-id="${p.id}" type="button"><b>${p.name}</b><small></small></button>`).join(''):`<p class="k4-lock-note">Complete Chapter 3 and restore an active Supporter Pack to enter Chapter 4.</p>`);
    if(ch.id==='chapter_3')return heading+(chapterOpen?[...chapterPirates('chapter_3','main'),...chapterPirates('chapter_3','bonus')].filter(p=>p.playable!==false).map(p=>`<button class="pirate-choice" data-pirate-id="${p.id}" type="button"><b>${p.id==='blockbeard'&&!pirateDefeated('souronion')?'???':p.name}</b><small></small></button>`).join(''):`<button class="pirate-choice locked" id="beginChapter3" type="button" disabled aria-disabled="true"><b>Begin Chapter 3 🔒</b><small>Defeat ${chapterState('chapter_2').bossIntroSeen||pirateDefeated('chapter2_boss')?'Mr Wiggles':'???'} to unlock 🔒</small></button>`);
    if(!roster.length)return'';
    if(ch.id==='chapter_2'&&!chapterSceneSeen(ch.id,'intro')&&!devPirateAccessActive())return heading+`<button class="pirate-choice ${chapterOpen?'unlocked':'locked'}" id="beginChapter2" type="button" ${chapterOpen?'':'disabled aria-disabled="true"'}><b>Begin Chapter 2: Uncharted Waters</b><small>${chapterOpen?'The voyage continues...':'Defeat Captain Blackball to unlock 🔒'}</small></button>`;
    return heading+roster.map(p=>{const nick=p.nickname?` <em>${p.nickname}</em>`:'';return `<button class="pirate-choice" data-pirate-id="${p.id}" type="button"><b>${p.name}${nick}</b><small></small></button>`}).join('');
  }).join('')+`<div id="chapter5Placeholder" class="pirate-chapter-heading" aria-disabled="true"><b>CHAPTER 5 • LOCKED</b><small>In development!</small></div>`;document.getElementById('openPoolSchool')?.addEventListener('click',showPoolSchool);refreshPirateButtons();piratePlaceholder.scrollTop=retainedRosterScroll;
}
function refreshPirateButtons(){document.querySelectorAll('.pirate-choice[data-pirate-id]').forEach(btn=>{const p=pirateById(btn.dataset.pirateId),open=pirateIsOpen(p),special=p?.campaignRole==='bonus';btn.disabled=false;btn.classList.toggle('unlocked',open);btn.classList.toggle('locked',!open);btn.classList.toggle('first-pirate-attention',p?.id==='dave'&&open&&shouldHighlightDave());btn.setAttribute('aria-disabled',String(!open));const small=btn.querySelector('small');const title=btn.querySelector('b');if(title){const base=title.dataset.originalName||title.textContent.replace(/\s*✓$/,'');title.dataset.originalName=base;const concealed=base.trim()==='???';title.textContent=base+(!concealed&&p&&pirateDefeated(p.id)?' ✓':'');}const waiting=p?.campaignRole==='bonus'&&nativeSupporterRuntime()&&!open&&['checking','verification_unavailable'].includes(SeamenSupporter.getState().status);btn.classList.toggle('ownership-waiting',waiting);if(waiting)btn.classList.remove('locked');if(small)small.textContent=waiting?'Supporter ownership check needed':p?.testOnly?`${p.role} • ${open?'Catalogue loaded':'Locked 🔒'}`:special?`${p.role} • ${open?'Available':'Locked 🔒'}`:`Difficulty ${p?.difficulty??'—'} • ${open?p.role:'Locked 🔒'}`;});const begin=document.getElementById('beginChapter2');if(begin){const open=chapterIsUnlocked('chapter_2')&&!chapterState('chapter_2').introSeen;begin.disabled=!open;begin.classList.toggle('unlocked',open);begin.classList.toggle('locked',!open);begin.setAttribute('aria-disabled',String(!open));const small=begin.querySelector('small');if(small)small.textContent=open?'The voyage continues...':'Defeat Captain Blackball to unlock 🔒';}}
const shootBtn=document.getElementById('shoot'),confirmCue=document.getElementById('confirmCue'),cuePlacementControls=document.getElementById('cuePlacementControls'),tableWrap=document.querySelector('.table-wrap'),powerEl=document.getElementById('power'),powerText=document.getElementById('powerText'),angleEl=document.getElementById('angle'),angleText=document.getElementById('angleText'),msg=document.getElementById('message'),turnEl=document.getElementById('turn');
const phaseEl=document.getElementById('phase'),lastShotEl=document.getElementById('lastShot'),choice=document.getElementById('choice'),choiceText=document.getElementById('choiceText'),choiceA=document.getElementById('choiceA'),choiceB=document.getElementById('choiceB'),turnOverlay=document.getElementById('turnOverlay'),breakHelp=document.getElementById('breakHelp'),breakRules=document.getElementById('breakRules'),closeBreakRules=document.getElementById('closeBreakRules'),winModal=document.getElementById('winModal'),winTitle=document.getElementById('winTitle'),winText=document.getElementById('winText'),playAgain=document.getElementById('playAgain'),returnMenu=document.getElementById('returnMenu');
// V0.14.2: result/log overlays live at document root so the split-pane scroll layer cannot trap them beneath the frozen header/table.
if(winModal)document.body.appendChild(winModal);
if(gameLogModal)document.body.appendChild(gameLogModal);
const PLAY_W=1600,PLAY_H=800,rail=90,W=PLAY_W+rail*2,H=PLAY_H+rail*2,L=rail,R=L+PLAY_W,T=rail,B=T+PLAY_H;
const ballR=25.4,pocketR=41,BAULK_X=L+PLAY_W*.8,CENTRE_X=(L+R)/2;
const pockets=[[L,T],[CENTRE_X,T],[R,T],[L,B],[CENTRE_X,B],[R,B]];
const colors={red:'#b72d2d',yellow:'#e3b834',black:'#151515',white:'#f5f1e7'};
let balls=[],angle=Math.PI,moving=false,last=performance.now(),draggingCue=false;
let cueStrikeVisual=null;
let equippedTableTheme='classic',equippedCue='classic',forcedTableTheme=null;
try{equippedTableTheme=localStorage.getItem('seamenTableTheme')||'classic';equippedCue=localStorage.getItem('seamenCue')||'classic';}catch(e){}
let state,shot=null,placementMode='none',pendingChoice=null,pendingAIPlan=null;
// Candidate J1: one-time opt-in migration for all existing and new saves.
// After migration, explicit player choices persist normally.
let devAngleGuide=true,aimMethod='simulation',aimArrows=true,playHistory=[],shotNumber=0;
try{
  if(localStorage.getItem('seamenAimUXMigration171')!=='1'){
    localStorage.setItem('seamenAimGuide','1');
    localStorage.setItem('seamenAimMethod','simulation');
    localStorage.setItem('seamenAimArrows','1');
    localStorage.setItem('seamenAimUXMigration171','1');
  }
  devAngleGuide=localStorage.getItem('seamenAimGuide')!=='0';
  aimMethod=localStorage.getItem('seamenAimMethod')==='reversed'?'reversed':'simulation';
  aimArrows=localStorage.getItem('seamenAimArrows')!=='0';
}catch(e){}
function saveAimUXPreferences(){try{localStorage.setItem('seamenAimMethod',aimMethod);localStorage.setItem('seamenAimArrows',aimArrows?'1':'0');}catch(e){}}
function saveAimGuidePreference(){try{localStorage.setItem('seamenAimGuide',devAngleGuide?'1':'0')}catch(e){}}
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const pirateDialogue=document.getElementById('pirateDialogue'),pirateDialoguePortrait=document.getElementById('pirateDialoguePortrait'),pirateDialogueName=document.getElementById('pirateDialogueName'),pirateDialogueText=document.getElementById('pirateDialogueText');
let dialogueLastShot=-99,dialogueReachedBlack={1:false,2:false};
const dialogueChance={1:.55,2:.48,3:.42,4:.46,5:.30,6:.22,7:.28};
function hidePirateDialogue(){if(pirateDialogue)pirateDialogue.hidden=true;}
function showPirateDialogue(category,{major=false}={}){
  if(gameMode!=='pirate'||!currentPirateLevel||!window.SeamenDialogue||activePirate()?.legacyLevel==null)return false;
  if(!major&&shotNumber-dialogueLastShot<2)return false;
  if(!major&&Math.random()>(dialogueChance[currentPirateLevel]??.35))return false;
  const line=window.SeamenDialogue.getLine(currentPirateLevel,category);if(!line)return false;
  const p=activePirate();pirateDialoguePortrait.src=p.image;pirateDialogueName.textContent=p.nickname?`${p.name} ${p.nickname}`:p.name;pirateDialogueText.textContent=line;pirateDialogue.classList.toggle('dialogue-major',major);pirateDialogue.classList.remove('dialogue-speaking');pirateDialogue.hidden=false;void pirateDialogue.offsetWidth;if(!document.body.classList.contains('reduced-character-portrait-motion'))pirateDialogue.classList.add('dialogue-speaking');dialogueLastShot=shotNumber;
  return true;
}
function contextualDialogue(completed){
  if(gameMode!=='pirate'||!completed||completed.isBreak)return;
  const actor=completed.player,isAI=actor===aiPlayer,result=lastShotEl.textContent||'';
  if(state.frameOver){showPirateDialogue(state.winner===aiPlayer?'victory':'defeat',{major:true});return;}
  const foul=result.startsWith('FOUL:')||result.includes('potted illegally');
  const pot=result.includes('LEGAL POT:')||result.includes('LEGAL COMBINATION:')||result.startsWith('LEGAL: both colours');
  const miss=result.includes('LOSS OF TURN')||result.startsWith('LEGAL: correct first contact');
  const group=state.groups[actor];
  if(group&&remaining(group)===0&&!dialogueReachedBlack[actor]){dialogueReachedBlack[actor]=true;showPirateDialogue(isAI?'aiOnBlack':'humanOnBlack',{major:true});return;}
  if(foul){
    // A foul awards the incoming player ball in hand. Prefer that objective event over
    // the generic foul line when copy exists; fall back to the established foul reaction.
    const bihCategory=isAI?'humanBallInHand':'aiBallInHand';
    if(showPirateDialogue(bihCategory,{major:true}))return;
    showPirateDialogue(isAI?'aiFoul':'humanFoul',{major:true});return;
  }
  if(pot){
    const objectPots=completed.pots.filter(t=>t!=='white');
    const multiBall=objectPots.length>=2||result.includes('LEGAL COMBINATION:')||result.startsWith('LEGAL: both colours');
    const cushionAction=!!completed.cushionAfterContact;
    if(multiBall&&showPirateDialogue(isAI?'aiCannonPot':'humanCannonPot',{major:true}))return;
    if(cushionAction&&showPirateDialogue(isAI?'aiCushionPot':'humanCushionPot',{major:true}))return;
    const streak=(potStreakPlayer===actor?potStreakCount:0);if(!isAI&&streak>=4){showPirateDialogue('humanBigStreak',{major:true});return;}if(streak>=2){showPirateDialogue(isAI?'aiStreak':'humanStreak',{major:streak>=4});return;}showPirateDialogue(isAI?'aiPot':'humanPot');return;
  }
  if(miss)showPirateDialogue(isAI?'aiMiss':'humanMiss');
}

let turnOverlayTimer=null;
function announceTurn(){
  if(!turnOverlay||!state||state.frameOver||pendingChoice)return;
  clearTimeout(turnOverlayTimer);
  const open=!state.groups[1];
  turnOverlay.textContent=`${pname(state.player)}, your turn!${open&&!state.breakShot?' Open table.':''}`;
  turnOverlay.classList.remove('show');
  void turnOverlay.offsetWidth;
  turnOverlay.classList.add('show');
  turnOverlayTimer=setTimeout(()=>turnOverlay.classList.remove('show'),3000);
}

let audioCtx=null,lastBallSound=0,lastCushionSound=0;
const SFX_GAIN=2.0; // V0.9.1: +6 dB-ish gameplay SFX lift so effects sit above the soundtrack.
function audioReady(){if(!audioCtx){const AC=window.AudioContext||window.webkitAudioContext;if(AC)audioCtx=new AC();}if(audioCtx&&audioCtx.state==='suspended')audioCtx.resume();if(k4Runtime.bossId||k4Runtime.lucy)k4RetryAudio();return audioCtx;}
function tone(freq,dur=.05,gain=.06,type='sine',when=0){if(masterMuted||masterLevel<=0)return;const ac=audioReady();if(!ac)return;const t=ac.currentTime+when,o=ac.createOscillator(),g=ac.createGain(),effectiveGain=Math.max(.0001,Math.min(.22,gain*SFX_GAIN)*masterLevel);o.type=type;o.frequency.setValueAtTime(freq,t);g.gain.setValueAtTime(effectiveGain,t);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g);g.connect(ac.destination);o.start(t);o.stop(t+dur);}
function soundVaperCue(){
  if(masterMuted||masterLevel<=0)return;
  const ac=audioReady();if(!ac)return;
  const t=ac.currentTime;
  // V0.9.1: dark, bass-heavy original energy-blade cue. Keep the fundamental low and
  // use close detuned harmonics for a heavy electrical throb rather than a cartoon zap.
  const bus=ac.createGain(),filter=ac.createBiquadFilter();
  filter.type='lowpass';filter.frequency.setValueAtTime(720,t);filter.Q.value=1.8;
  const peak=Math.max(.0001,Math.min(.22,.09*SFX_GAIN)*masterLevel);
  bus.gain.setValueAtTime(.0001,t);
  bus.gain.exponentialRampToValueAtTime(peak,t+.018);
  bus.gain.setValueAtTime(peak*.92,t+.11);
  bus.gain.exponentialRampToValueAtTime(.0001,t+.46);
  filter.connect(bus);bus.connect(ac.destination);
  const voices=[
    {type:'sawtooth',freq:46,detune:-5,gain:.78},
    {type:'sawtooth',freq:47,detune:7,gain:.58},
    {type:'triangle',freq:92,detune:-3,gain:.34}
  ];
  voices.forEach(v=>{
    const o=ac.createOscillator(),vg=ac.createGain();
    o.type=v.type;o.frequency.setValueAtTime(v.freq,t);o.detune.setValueAtTime(v.detune,t);
    // Tiny downward bend gives the strike weight without the old rising sci-fi chirp.
    o.frequency.exponentialRampToValueAtTime(v.freq*.91,t+.42);
    vg.gain.value=v.gain;o.connect(vg);vg.connect(filter);o.start(t);o.stop(t+.48);
  });
  // Brief low mechanical/electrical strike at contact.
  const hit=ac.createOscillator(),hg=ac.createGain();
  hit.type='triangle';hit.frequency.setValueAtTime(74,t);hit.frequency.exponentialRampToValueAtTime(48,t+.085);
  hg.gain.setValueAtTime(Math.max(.0001,Math.min(.13,.055*SFX_GAIN)*masterLevel),t);
  hg.gain.exponentialRampToValueAtTime(.0001,t+.095);hit.connect(hg);hg.connect(ac.destination);hit.start(t);hit.stop(t+.10);
}
function soundShot(power){
  const vaperShot=cueStyleForShooter(shot?.player)==='vaper';
  if(vaperShot){soundVaperCue();tone(58+power*12,.055,.026,'triangle',.018);return;}
  // V0.9.1 mix pass: normal cue gets a firmer transient and body. Vaper is deliberately untouched.
  tone(112+power*58,.065,.145,'triangle');tone(68,.085,.065,'sine',.008);tone(420+power*80,.025,.055,'square');
}
function soundBall(speed=300){const now=performance.now();if(now-lastBallSound<24)return;lastBallSound=now;const force=Math.min(1,Math.max(.35,speed/520));tone(350+Math.min(speed,900)*.13,.035,.085*force,'square');tone(185+Math.min(speed,700)*.05,.028,.04*force,'triangle',.004);}
function soundCushion(speed=250){const now=performance.now();if(now-lastCushionSound<30)return;lastCushionSound=now;const force=Math.min(1,Math.max(.38,speed/480));tone(150+Math.min(speed,800)*.065,.05,.09*force,'triangle');tone(92,.04,.035*force,'sine',.006);}
let potStreakPlayer=null,potStreakCount=0;
let legalPotSparkles=[];
let potFadeVisuals=[];
function resetPotStreak(){potStreakPlayer=null;potStreakCount=0;}
function soundPocketDrop(){tone(78,.14,.14,'sine');tone(118,.11,.085,'triangle',.012);tone(235,.045,.06,'square',.02);}
function soundLegalPot(player,count=1){
  if(potStreakPlayer!==player){potStreakPlayer=player;potStreakCount=0;}
  for(let n=0;n<count;n++){
    const step=potStreakCount+n,scale=Math.pow(2,Math.min(step,8)/24),when=n*.12;
    tone(740*scale,.09,.085,'square',when);tone(1110*scale,.12,.072,'triangle',when+.05);tone(1480*scale,.17,.052,'sine',when+.095);
  }
  potStreakCount+=count;
}
function soundFoulPot(){tone(1040,.10,.095,'triangle');tone(780,.13,.085,'triangle',.075);tone(520,.20,.095,'sine',.16);tone(105,.17,.12,'sine',.03);resetPotStreak();}

function soundVictory(){[523,659,784,1047].forEach((f,i)=>tone(f,.20,.12,'triangle',i*.11));tone(1319,.38,.14,'sine',.45);}
function soundFiveFrameComplete(){[0,1,2,3,4].forEach(i=>{tone(1175,.16,.09,'triangle',i*.24);tone(1760,.10,.045,'sine',i*.24+.035);});}
function ball(x,y,type,id){return{x,y,vx:0,vy:0,type,id,potted:false,crossedCentre:false};}
function newState(breaker=1){return{player:breaker,breaker,groups:{1:null,2:null},breakShot:true,frameOver:false,winner:null};}
function rackBalls(){balls=[];balls.push(ball(L+PLAY_W*.8,H/2,'white','cue'));const eightX=L+PLAY_W*.25,sy=H/2,gap=ballR*2.06,rowDx=gap*.89,apexX=eightX+2*rowDx;const rows=[['red'],['yellow','red'],['red','black','yellow'],['yellow','red','yellow','red'],['red','yellow','yellow','red','yellow']];let id=0;rows.forEach((row,ri)=>{const x=apexX-ri*rowDx;row.forEach((type,i)=>balls.push(ball(x,sy+(i-ri/2)*gap,type,id++)));});}
function rack28Balls(){balls=[];balls.push(ball(L+PLAY_W*.8,H/2,'white','cue'));const sy=H/2,gap=ballR*2.06,rowDx=gap*.89,apexX=L+PLAY_W*.31;let types=[];for(let i=0;i<13;i++)types.push('red');for(let i=0;i<14;i++)types.push('yellow');types.push('black');let id=0,idx=0;for(let ri=0;ri<7;ri++){const x=apexX-ri*rowDx;for(let i=0;i<=ri;i++){let type;if(ri===3&&i===1){type='black';const bi=types.indexOf('black');types.splice(bi,1);}else{const pick=Math.floor(Math.random()*types.length);type=types.splice(pick,1)[0];}balls.push(ball(x,sy+(i-ri/2)*gap,type,id++));}}}
function randomFreeSpot(existing,minX,maxX,minY,maxY){for(let tries=0;tries<300;tries++){const x=minX+Math.random()*(maxX-minX),y=minY+Math.random()*(maxY-minY);if(existing.every(b=>Math.hypot(b.x-x,b.y-y)>ballR*2.35))return{x,y};}return{x:minX+60,y:minY+60};}
function rackNightmare(){balls=[];/* Keep the six-yellow blockade horizontally central. The deliberate escape gap is on the LEFT, so all three reds are generated on the RIGHT-hand side away from that exit. */const cx=L+PLAY_W*.50,cy=H/2;balls.push(ball(cx,cy,'white','cue'));let id=0;const ringAngles=[-120,-72,-24,24,72,120];for(const deg of ringAngles){const a=deg*Math.PI/180,r=ballR*3.15;balls.push(ball(cx+Math.cos(a)*r,cy+Math.sin(a)*r,'yellow',id++));}for(let i=0;i<3;i++){const q=randomFreeSpot(balls,L+PLAY_W*.62,R-ballR*3,T+ballR*3,B-ballR*3);balls.push(ball(q.x,q.y,'red',id++));}const q=randomFreeSpot(balls,L+PLAY_W*.18,L+PLAY_W*.82,T+ballR*3,B-ballR*3);balls.push(ball(q.x,q.y,'black',id++));}
function startScenario(kind){resetCueSpin();if(gameApp)gameApp.hidden=false;clearTimeout(aiTimer);currentScenario=kind;gameMode='pirate';resetFrameCareerTracking();aiPlayer=2;currentPirateLevel=5;currentPirateName='Captain Blackball';playerNames={1:(testPlayerName?.value.trim()||'Player 1'),2:'Captain Blackball'};resetPotStreak();if(kind==='nightmare')rackNightmare();else rack28Balls();state=newState(kind==='nightmare'?2:1);if(kind==='nightmare'){state.breakShot=false;state.groups={1:'yellow',2:'red'};placementMode='none';msg.textContent="Blackball’s nightmare — Captain Blackball is on RED and must play from the fixed cue-ball position.";}else{placementMode='baulk';msg.textContent='Cannon fodder — 28 object balls racked in seven rows. Place the white in baulk for the opening break.';}moving=false;shot=null;draggingCue=false;pendingChoice=null;choice.hidden=true;shootBtn.disabled=placementMode!=='none';playersModal.hidden=true;updateHUD();setTimeout(announceTurn,40);setTimeout(maybeScheduleAI,500);}
function startFiveFrameTest(){
  if(gameApp)gameApp.hidden=false;
  clearTimeout(aiTimer);clearTimeout(aiWatchdogTimer);aiTimer=aiWatchdogTimer=null;
  currentScenario='fiveframe';fiveFrameTestActive=true;fiveFrameTestCompleted=0;pendingFiveFrameCelebration=null;
  gameMode='aivai';aiVsAiLevels={1:5,2:7};aiPlayer=1;currentPirateLevel=5;currentPirateName='Captain Blackball';
  playerNames={1:'Captain Blackball',2:'Darth Vaper'};playHistory=[];shotNumber=0;renderPlayLog();
  playersModal.hidden=true;testScenarioMenu.hidden=true;audioReady();
  playHistory.push('=== 5-FRAME AI TESTING RUN • Captain Blackball vs Darth Vaper ===\nFrame 1 of 5');renderPlayLog();
  newFrame(1);msg.textContent='5-frame AI testing run — Frame 1 of 5. Captain Blackball vs Darth Vaper.';
}
function restartCurrentGame(breaker=1){if(schoolSession)return startSchoolLesson(schoolSession.id);if(currentScenario==='fiveframe')return startFiveFrameTest();if(currentScenario)return startScenario(currentScenario);newFrame(breaker);}
function newFrame(breaker=1){if(gameMode==='pirate'&&activePirate()?.chapter==='chapter_4'&&!pirateIsOpen(activePirate())){showTitleScreen();return;}k4NewFrame();resetCueSpin();vapeMatchStarted=performance.now();izzyShedHairs=[];souronionShotEmbers=[];bamBamVisits=0;lastBamBamTurn=false;clearTimeout(aiTimer);resetFrameCareerTracking();rackBalls();potFadeVisuals=[];legalPotSparkles=[];resetPotStreak();dialogueReachedBlack={1:false,2:false};dialogueLastShot=-99;hidePirateDialogue();state=newState(breaker);moving=false;shot=null;placementMode='baulk';draggingCue=false;pendingChoice=null;choice.hidden=true;shootBtn.disabled=true;msg.textContent='Opening break — tap or drag anywhere in baulk to place the white, then confirm its position.';updateHUD();setTimeout(announceTurn,40);setTimeout(maybeScheduleAI,450);}
function cue(){return balls[0];}
function opponent(p){return p===1?2:1;}
function pname(p){return playerNames[p]||`Player ${p}`;}
function pshort(p){return pname(p);}
function remaining(type){return balls.filter(b=>b.type===type&&!b.potted).length;}
function onType(player){const g=state.groups[player];if(!g)return 'open';return remaining(g)===0?'black':g;}
function updatePlacementUI(){const placing=placementMode!=='none'&&!moving&&!state?.frameOver&&!pendingChoice;confirmCue.hidden=!placing;if(cuePlacementControls)cuePlacementControls.hidden=!placing;tableWrap?.classList.toggle('placing-cue',placing);if(placing)shootBtn.disabled=true;}
function updateHUD(){const compactTurn=document.getElementById('j3Turn'),compactLast=document.getElementById('j3Last');if(compactTurn){const group=state.groups[state.player];compactTurn.textContent=state.frameOver?`${pname(state.winner)} wins`: `${pname(state.player)} · ${group?group.toUpperCase():'OPEN TABLE'}`;}if(compactLast){compactLast.textContent='Last turn: '+(lastShotEl.textContent||'Opening break');}turnEl.replaceChildren(document.createTextNode(state.frameOver?pname(state.winner):'Playing now:'),document.createElement('br'),document.createTextNode(state.frameOver?'WINS':pname(state.player)));phaseEl.textContent=state.frameOver?'FRAME OVER':state.breakShot?'BREAK':state.groups[1]?'GROUPS SET':'OPEN TABLE';breakHelp.hidden=state.frameOver||!state.breakShot||moving||!!pendingChoice;if(breakHelp.hidden)breakRules.hidden=true;for(const p of [1,2]){const g=state.groups[p];document.getElementById('p'+p+'group').textContent=pshort(p);document.getElementById('p'+p+'left').dataset.compact=g?`${g.toUpperCase()} · ${remaining(g)} left`:'Open table';document.getElementById('p'+p+'left').textContent=g?`${g.toUpperCase()} group\n${remaining(g)} ${remaining(g)===1?'ball':'balls'} left`:'OPEN TABLE\nNo group yet';}if(compactTurn){compactTurn.title=compactTurn.textContent;compactTurn.dataset.turnLabel=state.frameOver?'':'Turn: ';compactTurn.dataset.compactName=state.frameOver?`${pname(state.winner)} wins`:`Turn: ${pname(state.player)}`;compactTurn.dataset.compactGroup=state.frameOver?'WON':onType(state.player)==='black'?'BLACK':state.groups[state.player]?.toUpperCase()||'OPEN';}for(const p of [1,2]){const name=document.getElementById('p'+p+'group');name.title=name.textContent;}updatePlacementUI();if(((gameMode==='pirate'&&aiPlayer===state.player)||gameMode==='aivai')&&!state.frameOver){shootBtn.disabled=true;confirmCue.hidden=true;if(cuePlacementControls)cuePlacementControls.hidden=true;}}
function canvasPoint(e){const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)*W/r.width,y:(e.clientY-r.top)*H/r.height};}
function normaliseDeg(d){return ((d%360)+360)%360;}function syncAngleUI(){const deg=normaliseDeg(angle*180/Math.PI);angleEl.value=Math.round(deg*10);angleText.textContent=deg.toFixed(1)+'°';}function setAngleDeg(deg){angle=normaliseDeg(deg)*Math.PI/180;syncAngleUI();}
// J2: relative aiming. The cue follows drag displacement, not the absolute
// finger position, so release cannot snap the cue and cushions never block aiming.
let aimDrag=null;
function beginAimDrag(e){aimDrag={id:e.pointerId,x:e.clientX,y:e.clientY};}
function moveAimDrag(e){
  if(!aimDrag||e.pointerId!==aimDrag.id||moving||state.frameOver||pendingChoice)return;
  const dx=e.clientX-aimDrag.x,dy=e.clientY-aimDrag.y;
  aimDrag.x=e.clientX;aimDrag.y=e.clientY;
  // Horizontal movement steers the cue; vertical movement is reserved for
  // page gestures outside the table. No repositioning on touch-down or release.
  if(Math.abs(dx)<0.01)return;
  angle=normaliseDeg(angle*180/Math.PI+dx*.32)*Math.PI/180;
  syncAngleUI();
}
function endAimDrag(e){if(aimDrag&&e.pointerId===aimDrag.id)aimDrag=null;}

function validCuePosition(x,y){if(x<L+ballR||x>R-ballR||y<T+ballR||y>B-ballR)return false;if(placementMode==='baulk'&&x<BAULK_X-ballR*.5)return false;return balls.slice(1).filter(b=>!b.potted).every(b=>Math.hypot(b.x-x,b.y-y)>=ballR*2.02);}
function placeCueAt(e){if(placementMode==='none'||moving)return;const p=canvasPoint(e),c=cue();let x=clamp(p.x,L+ballR,R-ballR),y=clamp(p.y,T+ballR,B-ballR);if(placementMode==='baulk')x=clamp(x,BAULK_X-ballR*.5,R-ballR);if(validCuePosition(x,y)){c.x=x;c.y=y;updatePlacementUI();}}
function nudgeCue(dx,dy){if(placementMode==='none'||moving||state.frameOver||pendingChoice)return;const c=cue(),step=ballR*.55;let x=clamp(c.x+dx*step,L+ballR,R-ballR),y=clamp(c.y+dy*step,T+ballR,B-ballR);if(placementMode==='baulk')x=clamp(x,BAULK_X-ballR*.5,R-ballR);if(validCuePosition(x,y)){c.x=x;c.y=y;updatePlacementUI();}}
function addPressHold(el,action,repeatMs){let delay=null,repeat=null,active=false;const clear=()=>{clearTimeout(delay);clearInterval(repeat);delay=repeat=null;active=false;armProtectedSelectionGuard(450);};const start=e=>{if(active)return;active=true;armProtectedSelectionGuard(1100);if(e.cancelable)e.preventDefault();action();delay=setTimeout(()=>{armProtectedSelectionGuard(1100);repeat=setInterval(()=>{armProtectedSelectionGuard(500);action();},repeatMs)},350);};if(window.PointerEvent){el.addEventListener('pointerdown',e=>{try{el.setPointerCapture?.(e.pointerId)}catch(_){}start(e)});['pointerup','pointercancel','lostpointercapture'].forEach(ev=>el.addEventListener(ev,clear));}else{el.addEventListener('touchstart',start,{passive:false});['touchend','touchcancel'].forEach(ev=>el.addEventListener(ev,clear,{passive:true}));el.addEventListener('mousedown',start);['mouseup','mouseleave'].forEach(ev=>el.addEventListener(ev,clear));}el.addEventListener('contextmenu',e=>e.preventDefault());}
function addCueNudge(id,dx,dy){const el=document.getElementById(id);addPressHold(el,()=>nudgeCue(dx,dy),70);}
addCueNudge('cueUp',0,-1);addCueNudge('cueLeft',-1,0);addCueNudge('cueDown',0,1);addCueNudge('cueRight',1,0);
// J6: passive mistaken-table-tap feedback. Never touches aim or shot state.
const tableTapFlash=document.createElement('div');tableTapFlash.className='j6-tap-flash';tableTapFlash.setAttribute('aria-hidden','true');tableWrap.appendChild(tableTapFlash);
const daveTapTip=document.createElement('div');daveTapTip.className='j6-dave-tip';daveTapTip.hidden=true;daveTapTip.setAttribute('role','status');daveTapTip.textContent='Dave: “Oi! Get your fingers off the balls! Touch your buttons below the table to aim your shaft!”';tableWrap.appendChild(daveTapTip);
let j6TapStart=null,j6FlashTimer=null,j6TipTimer=null;
function dismissJ6Tip(){daveTapTip.hidden=true;clearTimeout(j6TipTimer);}
function j6MistakenTap(){
 tableTapFlash.classList.remove('j6-flashing');void tableTapFlash.offsetWidth;tableTapFlash.classList.add('j6-flashing');
 clearTimeout(j6FlashTimer);j6FlashTimer=setTimeout(()=>tableTapFlash.classList.remove('j6-flashing'),360);
 if(gameMode==='pirate'&&currentPirateId==='dave'&&!currentScenario){
  let seen=false;try{seen=localStorage.getItem('seamen_j6_dave_table_tip_seen')==='1'}catch(_){}
  if(!seen){try{localStorage.setItem('seamen_j6_dave_table_tip_seen','1')}catch(_){}daveTapTip.hidden=false;clearTimeout(j6TipTimer);j6TipTimer=setTimeout(dismissJ6Tip,5500);}
 }
}
daveTapTip.addEventListener('pointerdown',e=>{e.stopPropagation();dismissJ6Tip();});
canvas.addEventListener('pointerdown',e=>{
 j6TapStart=null;
 if(e.pointerType==='mouse'&&e.button!==0)return;
 if(!state||moving||state.frameOver||pendingChoice||placementMode!=='none'||gameApp?.hidden||
    state.player!==1||gameMode==='aivai'||(gameMode==='pirate'&&aiPlayer===state.player))return;
 j6TapStart={id:e.pointerId,x:e.clientX,y:e.clientY,time:performance.now()};
});
canvas.addEventListener('pointermove',e=>{if(j6TapStart?.id===e.pointerId&&Math.hypot(e.clientX-j6TapStart.x,e.clientY-j6TapStart.y)>12)j6TapStart=null;});
canvas.addEventListener('pointerup',e=>{const t=j6TapStart;j6TapStart=null;if(t&&t.id===e.pointerId&&performance.now()-t.time<450&&Math.hypot(e.clientX-t.x,e.clientY-t.y)<12)j6MistakenTap();});
canvas.addEventListener('pointercancel',()=>{j6TapStart=null;});
// J3: table gestures ONLY place the cue ball. Aiming lives on the Cue Helm.
canvas.addEventListener('pointerdown',e=>{if(moving||state.frameOver||pendingChoice||cue().potted||placementMode==='none')return;canvas.setPointerCapture(e.pointerId);e.preventDefault();draggingCue=true;placeCueAt(e);});
canvas.addEventListener('pointermove',e=>{if(draggingCue&&canvas.hasPointerCapture(e.pointerId))placeCueAt(e)});
for(const eventName of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(eventName,()=>{draggingCue=false;});
// Horizontal gesture surface; touch-action:pan-y lets the browser own vertical scrolling.
// The angle is changed only after an intentional horizontal gesture is recognised.
const cueHelm=document.getElementById('cueHelm');
let helmGesture=null;
const HELM_DEGREES_PER_PIXEL=0.85;
// A short stabilization window prevents the final accidental thumb-lift motion
// from being applied. Only settled pointer movement is committed to the angle.
const HELM_RELEASE_GUARD_MS=55;
function finishHelmGesture(e){
 // Touch implicitly captures the new child ball first. Handing capture to
 // the existing rail must not cancel its newly recognised aiming drag.
 if(e.type==='lostpointercapture'&&e.target!==cueHelm)return;
 const g=helmGesture;
 if(!g||g.id!==e.pointerId)return;
 if(g.pendingTimer!==null)clearTimeout(g.pendingTimer);
 if(e.type==='pointercancel'||e.rollback)setAngleDeg(g.startAngle);
 // Deliberately discard the uncommitted tail of the gesture on release.
 helmGesture=null;
 cueHelm.classList.remove('is-steering');
}
cueHelm.addEventListener('pointerdown',e=>{
 if(!e.isPrimary||(e.pointerType==='mouse'&&e.button!==0)||!spinControlReady())return;
 if(helmSpinMode&&e.target.closest('#helmCueBall'))return;
 helmGesture={startAngle:angle*180/Math.PI,id:e.pointerId,x:e.clientX,y:e.clientY,active:false,lastX:e.clientX,
   committedX:e.clientX,pendingX:e.clientX,pendingTimer:null};
 // Capture rail presses immediately; the centre ball owns its own capture so
 // its pointer-up still reaches the double-tap recogniser.
 if(!e.target.closest('#helmCueBall'))try{cueHelm.setPointerCapture(e.pointerId)}catch(_){}
});
cueHelm.addEventListener('pointermove',e=>{
 const g=helmGesture;
 if(!g||g.id!==e.pointerId||moving||state.frameOver||pendingChoice)return;
 const totalX=e.clientX-g.x,totalY=e.clientY-g.y;
 if(!g.active){
   if(Math.abs(totalY)>Math.abs(totalX)&&Math.abs(totalY)>8){finishHelmGesture({pointerId:e.pointerId,type:'pointercancel'});return;}
   if(Math.abs(totalX)<9||Math.abs(totalX)<Math.abs(totalY)*1.35)return;
   g.active=true;g.lastX=e.clientX;g.committedX=e.clientX;g.pendingX=e.clientX;
   // The threshold establishes intent. Apply that initial movement now, even
   // if the browser coalesces a short swipe into a single move event.
   setAngleDeg(angle*180/Math.PI+totalX*HELM_DEGREES_PER_PIXEL*(aimMethod==='reversed'?-1:1));
   cueHelm.classList.add('is-steering');
   try{cueHelm.setPointerCapture(e.pointerId)}catch(_){}
   return;
 }
 // Ignore movements that suddenly veer into a vertical page scroll.
 if(Math.abs(e.clientY-g.y)>24&&Math.abs(e.clientY-g.y)>Math.abs(totalX)*1.5){finishHelmGesture({pointerId:e.pointerId,type:'pointercancel'});return;}
 g.pendingX=e.clientX;
 if(g.pendingTimer!==null)return;
 g.pendingTimer=setTimeout(()=>{
   g.pendingTimer=null;
   if(helmGesture!==g||!g.active)return;
   const dx=g.pendingX-g.committedX;
   g.committedX=g.pendingX;
   if(dx)setAngleDeg(angle*180/Math.PI+dx*HELM_DEGREES_PER_PIXEL*(aimMethod==='reversed'?-1:1));
 },HELM_RELEASE_GUARD_MS);
});
for(const name of ['pointerup','pointercancel','lostpointercapture'])cueHelm.addEventListener(name,finishHelmGesture);
cueHelm.addEventListener('keydown',e=>{if(e.key!=='ArrowLeft'&&e.key!=='ArrowRight')return;e.preventDefault();nudgeAngle(e.key==='ArrowLeft'?-1:1);});
// J4: dedicated helm arrow controls. Stop bubbling so a press never begins a swipe.
for(const [id,direction] of [['helmPort',-1],['helmStarboard',1]]){
 const button=document.getElementById(id);
 button.addEventListener('pointerdown',e=>e.stopPropagation());
 button.addEventListener('pointermove',e=>e.stopPropagation());
 button.addEventListener('pointerup',e=>e.stopPropagation());
 button.addEventListener('pointercancel',e=>e.stopPropagation());
 addPressHold(button,()=>nudgeAngle(direction*1),70);
}
// Shot-power slider is an optional advanced control; the percentage/buttons always remain.
const POWER_SLIDER_VISIBLE_KEY='seamen_power_slider_visible';
let showPowerSlider=false;
try{showPowerSlider=localStorage.getItem(POWER_SLIDER_VISIBLE_KEY)==='1';}catch(_){}
const powerSliderToggle=document.getElementById('powerSliderToggle');
function syncPowerSliderVisibility(){
 document.body.classList.toggle('show-power-slider',showPowerSlider);
 if(powerSliderToggle){powerSliderToggle.classList.toggle('is-on',showPowerSlider);powerSliderToggle.setAttribute('aria-checked',String(showPowerSlider));powerSliderToggle.title=`Portrait shot power slider: ${showPowerSlider?'On':'Off'}`;}
}
if(powerSliderToggle)powerSliderToggle.addEventListener('click',()=>{
 showPowerSlider=!showPowerSlider;
 try{localStorage.setItem(POWER_SLIDER_VISIBLE_KEY,showPowerSlider?'1':'0');}catch(_){}
 if(!showPowerSlider)powerSliderUnlocked=false;
 syncPowerSliderVisibility();syncTouchSliderLocks();
});
syncPowerSliderVisibility();
// V0.15.7d — coarse-pointer/mobile slider safety. Sliders start locked so a
// vertical page scroll cannot jump aim or power. Fine-adjust buttons remain live.
const angleTouchLock=document.getElementById('angleTouchLock'),powerTouchLock=document.getElementById('powerTouchLock');
const touchSliderMode=()=>window.matchMedia?.('(pointer: coarse)').matches===true;
let angleSliderUnlocked=false,powerSliderUnlocked=false;
function syncTouchSliderLocks(){
  const touch=touchSliderMode(),landscape=document.documentElement.dataset.gameplayLayout==='landscape';
  if(angleTouchLock)angleTouchLock.hidden=true;
  if(powerTouchLock){powerTouchLock.hidden=landscape||!touch||!showPowerSlider;powerTouchLock.textContent=powerSliderUnlocked?'Lock in power slider':'Unlock shot power slider';powerTouchLock.setAttribute('aria-pressed',String(powerSliderUnlocked));}
  angleEl.hidden=true;angleEl.disabled=true;
  powerEl.hidden=!(showPowerSlider||landscape);powerEl.disabled=touch&&!powerSliderUnlocked&&!landscape;

  powerEl.classList.toggle('touch-slider-locked',touch&&!powerSliderUnlocked&&!landscape);
}
function lockTouchShotSliders(){if(!touchSliderMode())return;angleSliderUnlocked=false;powerSliderUnlocked=false;syncTouchSliderLocks();}

if(powerTouchLock)powerTouchLock.addEventListener('click',()=>{if(moving||state?.frameOver||pendingChoice)return;powerSliderUnlocked=!powerSliderUnlocked;syncTouchSliderLocks();});
window.matchMedia?.('(pointer: coarse)').addEventListener?.('change',syncTouchSliderLocks);
syncTouchSliderLocks();
powerEl.addEventListener('input',()=>powerText.textContent=powerEl.value+'%');angleEl.addEventListener('input',()=>setAngleDeg(Number(angleEl.value)/10));function nudgeAngle(delta){if(!moving&&!state.frameOver&&!pendingChoice)setAngleDeg(angle*180/Math.PI+delta)}
function addHoldNudge(id,delta){const el=document.getElementById(id);addPressHold(el,()=>nudgeAngle(delta),45);}addHoldNudge('angleMinus5',-5);addHoldNudge('angleMinus',-.1);addHoldNudge('anglePlus',.1);addHoldNudge('anglePlus5',5);
function nudgePower(delta){if(moving||state.frameOver||pendingChoice)return;powerEl.value=clamp(Number(powerEl.value)+delta,Number(powerEl.min),Number(powerEl.max));powerText.textContent=powerEl.value+'%';}
function addHoldPower(id,delta){const el=document.getElementById(id);addPressHold(el,()=>nudgePower(delta),90);}
addHoldPower('powerMinus45',-45);addHoldPower('powerMinus5',-5);addHoldPower('powerPlus5',5);addHoldPower('powerPlus45',45);
// Cosmetic-only sword-tip sparks. Never affect physics, collision, or AI decisions.
let souronionShotEmbers=[];
function emitSouronionShotEmbers(x,y,a){
  const now=performance.now();
  for(let i=0;i<32;i++){
    const spread=(Math.random()-.5)*2.25,dir=a+spread;
    const speed=105+Math.random()*340;
    souronionShotEmbers.push({x,y,vx:Math.cos(dir)*speed,vy:Math.sin(dir)*speed,
      born:now,life:300+Math.random()*490,r:1.6+Math.random()*3.6});
  }
}
function drawSouronionShotEmbers(now){
  if(!souronionShotEmbers.length)return;
  souronionShotEmbers=souronionShotEmbers.filter(p=>now-p.born<p.life);
  ctx.save();ctx.globalCompositeOperation='lighter';
  for(const p of souronionShotEmbers){
    const age=(now-p.born)/1000,t=Math.min(1,(now-p.born)/p.life);
    const x=p.x+p.vx*age,y=p.y+p.vy*age+130*age*age;
    ctx.globalAlpha=(1-t)*.94;ctx.shadowColor='#ff3500';ctx.shadowBlur=13;
    ctx.fillStyle=t<.3?'#fff3b0':t<.7?'#ff721f':'#a61208';
    ctx.beginPath();ctx.arc(x,y,p.r*(1-.75*t),0,Math.PI*2);ctx.fill();
  }
  ctx.restore();
}
function executionPowerPercent(){
 const aiTurn=gameMode==='aivai'||(gameMode==='pirate'&&aiPlayer===state?.player);
 if(!aiTurn||pendingAIPlan?.power==null)return Number(powerEl.value);
 // Preserve the old range input's clamping/step sanitisation without touching
 // the human preference or UI (including fractional AI calculations).
 const range=powerEl.cloneNode(false);range.value=pendingAIPlan.power;return Number(range.value);
}
function beginShot(){clearTimeout(aiWatchdogTimer);aiWatchdogTimer=null;if(moving||state.frameOver||(schoolSession?.id===3&&!schoolSession.repeatShots)||pendingChoice||cue().potted||placementMode!=='none')return;if(!k4CanShoot())return;k4PrepareShot();const aiStrikeContact=k4AIContact();lockTouchShotSliders();noteCareerShot(state.player);const p=executionPowerPercent()/100,speed=150+5800*Math.pow(p,1.35),c=cue();shot={number:++shotNumber,player:state.player,isBreak:state.breakShot,startOn:onType(state.player),firstContact:null,firstContactId:null,pots:[],cuePotted:false,cushionAfterContact:false,objectCushions:new Set(),breakCrossers:new Set(),aiPlan:pendingAIPlan};pendingAIPlan=null;shot.power=p*100;if(schoolSession?.id===3&&schoolSession.phase==='correction')shot.schoolPlacement={x:c.x,y:c.y};placementMode='none';draggingCue=false;cueStrikeVisual={started:performance.now(),angle,x:c.x,y:c.y,player:state.player,style:cueStyleForShooter(state.player)};if(cueStrikeVisual.style==='izzy'||cueStrikeVisual.style==='bambam')emitIzzyHairs(c.x-Math.cos(angle)*(ballR+10),c.y-Math.sin(angle)*(ballR+10),angle,cueStrikeVisual.style==='bambam'?'black':'white');if(cueStrikeVisual.style==='souronion')emitSouronionShotEmbers(c.x-Math.cos(angle)*(ballR+10),c.y-Math.sin(angle)*(ballR+10),angle);c.vx=Math.cos(angle)*speed;c.vy=Math.sin(angle)*speed;const aiShot=gameMode==='aivai'||(gameMode==='pirate'&&aiPlayer===state.player);const contact=aiShot?aiStrikeContact:{...selectedSpin};shot.spin=contact;SeamenSpinPhysics.strike(c,contact,angle,speed);if(aiShot&&k4IsMatch()&&currentPirateId==='spinball_wizard')k4Runtime.wizardShots++;if(!aiShot||!k4IsMatch()||currentPirateId!=='spinball_wizard')resetCueSpin();soundShot(p);k4ShotEffect();moving=true;shootBtn.disabled=true;breakHelp.hidden=true;breakRules.hidden=true;msg.textContent='Balls in motion…';}
shootBtn.addEventListener('click',()=>{hidePirateDialogue();beginShot();});
function collide(a,b){let dx=b.x-a.x,dy=b.y-a.y,d2=dx*dx+dy*dy,min=ballR*2;if(d2>=min*min||d2===0)return;let d=Math.sqrt(d2),nx=dx/d,ny=dy/d,over=min-d;a.x-=nx*over/2;a.y-=ny*over/2;b.x+=nx*over/2;b.y+=ny*over/2;if(shot&&!shot.firstContact){if(a.type==='white'&&b.type!=='white'&&!b.potted){shot.firstContact=b.type;shot.firstContactId=b.id;}else if(b.type==='white'&&a.type!=='white'&&!a.potted){shot.firstContact=a.type;shot.firstContactId=a.id;}}let rvx=b.vx-a.vx,rvy=b.vy-a.vy,sep=rvx*nx+rvy*ny;if(sep>=0)return;soundBall(Math.abs(sep));const j=-(1+.965)*sep/2,ix=j*nx,iy=j*ny;a.vx-=ix;a.vy-=iy;b.vx+=ix;b.vy+=iy;SeamenSpinPhysics.collide(a);SeamenSpinPhysics.collide(b);}
function pocketBall(b,pocketIndex=null){soundPocketDrop();const potNow=performance.now();b.potted=true;b.cueSpin=null;b.potFadeStarted=potNow;b.vx=b.vy=0;potFadeVisuals.push({x:b.x,y:b.y,type:b.type,started:potNow});if(b.type!=='white'&&pocketIndex!=null){legalPotSparkles.push({pocketIndex,started:potNow,seed:Math.random()*Math.PI*2});}if(shot){shot.pots.push(b.type);shot.potEvents??=[];shot.potEvents.push({type:b.type,pocketIndex});if(b.type==='white')shot.cuePotted=true;}return true;}
function pocketCheck(b){
  // Normal pocket capture around each pocket centre.
  for(let pi=0;pi<pockets.length;pi++){const p=pockets[pi],dx=b.x-p[0],dy=b.y-p[1];if(dx*dx+dy*dy<pocketR*pocketR)return pocketBall(b,pi);}
  // Pocket-throat capture: once a ball has genuinely entered through an open
  // pocket mouth it must fall, rather than slipping beyond the cushion and
  // becoming stranded outside the playable bed.
  const mouth=pocketR+ballR*.55;
  if((b.y<T-ballR*.12||b.y>B+ballR*.12)&&
     (Math.abs(b.x-L)<mouth||Math.abs(b.x-CENTRE_X)<mouth||Math.abs(b.x-R)<mouth)){const pi=pockets.reduce((best,p,i)=>Math.hypot(b.x-p[0],b.y-p[1])<Math.hypot(b.x-pockets[best][0],b.y-pockets[best][1])?i:best,0);return pocketBall(b,pi);}
  if((b.x<L-ballR*.12||b.x>R+ballR*.12)&&
     (Math.abs(b.y-T)<mouth||Math.abs(b.y-B)<mouth)){const pi=pockets.reduce((best,p,i)=>Math.hypot(b.x-p[0],b.y-p[1])<Math.hypot(b.x-pockets[best][0],b.y-pockets[best][1])?i:best,0);return pocketBall(b,pi);}
  return false;
}
function noteCushion(b){soundCushion(Math.hypot(b.vx,b.vy));if(!shot||!shot.firstContact)return;shot.cushionAfterContact=true;if(b.type!=='white')shot.objectCushions.add(b.id);}
function walls(b){
  const nearLeft=Math.abs(b.x-L)<pocketR*1.3,nearRight=Math.abs(b.x-R)<pocketR*1.3,nearMiddle=Math.abs(b.x-CENTRE_X)<pocketR*1.35;
  if(b.x-ballR<L&&Math.abs(b.y-T)>pocketR*1.2&&Math.abs(b.y-B)>pocketR*1.2){b.x=L+ballR;b.vx=Math.abs(b.vx)*.91;SeamenSpinPhysics.cushion(b,1,0);noteCushion(b)}
  if(b.x+ballR>R&&Math.abs(b.y-T)>pocketR*1.2&&Math.abs(b.y-B)>pocketR*1.2){b.x=R-ballR;b.vx=-Math.abs(b.vx)*.91;SeamenSpinPhysics.cushion(b,-1,0);noteCushion(b)}
  if(b.y-ballR<T&&!nearLeft&&!nearRight&&!nearMiddle){b.y=T+ballR;b.vy=Math.abs(b.vy)*.91;SeamenSpinPhysics.cushion(b,0,1);noteCushion(b)}
  if(b.y+ballR>B&&!nearLeft&&!nearRight&&!nearMiddle){b.y=B-ballR;b.vy=-Math.abs(b.vy)*.91;SeamenSpinPhysics.cushion(b,0,-1);noteCushion(b)}
  // Last-resort containment. A ball may enter a pocket throat, but it may
  // never finish outside the table because of a gap in cushion geometry.
  const escaped=b.x<L-ballR*1.25||b.x>R+ballR*1.25||b.y<T-ballR*1.25||b.y>B+ballR*1.25;
  if(escaped){
    if(pocketCheck(b))return;
    b.x=clamp(b.x,L+ballR,R-ballR);b.y=clamp(b.y,T+ballR,B-ballR);
    if(b.x<=L+ballR+.01)b.vx=Math.abs(b.vx)*.91;
    if(b.x>=R-ballR-.01)b.vx=-Math.abs(b.vx)*.91;
    if(b.y<=T+ballR+.01)b.vy=Math.abs(b.vy)*.91;
    if(b.y>=B-ballR-.01)b.vy=-Math.abs(b.vy)*.91;
    noteCushion(b);
  }
}
function trackBreakCrossing(b){if(!shot||!shot.isBreak||b.type==='white'||b.potted||b.crossedCentre)return;/* Rack is on the left/top side. A break point is earned as soon as the WHOLE object ball has passed the centre-pocket line. */if(b.x-ballR>=CENTRE_X){b.crossedCentre=true;shot.breakCrossers.add(b.id);}}
function step(dt){const maxSpeed=Math.max(...balls.filter(b=>!b.potted).map(b=>Math.hypot(b.vx,b.vy)),0),sub=Math.max(4,Math.min(12,Math.ceil(maxSpeed*dt/(ballR*.55)))),sdt=dt/sub;for(let k=0;k<sub;k++){for(const b of balls){if(b.potted)continue;b.x+=b.vx*sdt;b.y+=b.vy*sdt;trackBreakCrossing(b);if(pocketCheck(b))continue;walls(b);SeamenSpinPhysics.advance(b,sdt);const drag=Math.pow(.985,sdt*60);b.vx*=drag;b.vy*=drag;if(Math.hypot(b.vx,b.vy)<5&&!(b.cueSpin?.engaged&&Math.hypot(b.cueSpin.x,b.cueSpin.y)>5))b.vx=b.vy=0;}for(let i=0;i<balls.length;i++)if(!balls[i].potted)for(let j=i+1;j<balls.length;j++)if(!balls[j].potted)collide(balls[i],balls[j]);}}
function allStopped(){return balls.every(b=>b.potted||(Math.hypot(b.vx,b.vy)<.01&&!(b.cueSpin?.engaged&&Math.hypot(b.cueSpin.x,b.cueSpin.y)>5)))}
function respotBlack(){const b=balls.find(x=>x.type==='black');if(!b||!b.potted)return;b.potted=false;b.potFadeStarted=null;b.vx=b.vy=0;const spotX=L+PLAY_W*.25,spotY=H/2;for(let dir of [-1,1])for(let dist=0;dist<PLAY_W*.6;dist+=ballR*2.05){const x=spotX+dir*dist,y=spotY;if(x>L+ballR&&x<R-ballR&&balls.filter(o=>o!==b&&!o.potted).every(o=>Math.hypot(o.x-x,o.y-y)>=ballR*2.01)){b.x=x;b.y=y;return;}}}
function restoreCue(mode){resetCueSpin();cue().cueSpin=null;const c=cue();c.potted=false;c.potFadeStarted=null;c.vx=c.vy=0;placementMode=mode;let x=mode==='baulk'?L+PLAY_W*.8:L+PLAY_W*.72,y=H/2;for(let tries=0;tries<40&&!validCuePosition(x,y);tries++)y=T+ballR+((tries+1)*(PLAY_H-2*ballR)/41);c.x=x;c.y=y;}
function finishFrame(winner,text,resultText='Frame complete'){if(schoolSession){state.frameOver=true;state.winner=winner;moving=false;shootBtn.disabled=true;placementMode='none';msg.textContent=text;lastShotEl.textContent=resultText;updateHUD();return;}const currentPirate=activePirate(),firstPirateDefeat=gameMode==='pirate'&&winner===1&&isMainCampaignPirate(currentPirate)&&!career.piratesDefeated[pirateCareerKey(currentPirate)];recordCareerFrame(winner);if(firstPirateDefeat&&currentPirate?.id==='papa_surf')pendingChapter2BossReveal=true;pendingPirateReward=firstPirateDefeat&&currentPirate.legacyLevel!=null?pirateRewardInfo(currentPirateLevel):null;state.frameOver=true;state.winner=winner;moving=false;shootBtn.disabled=true;placementMode='none';let finalText=text;if(gameMode==='pirate'&&winner===1&&isMainCampaignPirate(currentPirate)&&!isChapterBoss(currentPirate)){const chapter=chapterById(currentPirate.chapter),main=chapterPirates(currentPirate.chapter,'main'),index=main.findIndex(p=>p.id===currentPirate.id),nextPirate=main[index+1];if(currentPirate.chapter==='chapter_1'&&nextPirate?.legacyLevel){const before=getUnlockedPirateLevel();if(nextPirate.legacyLevel>before)setUnlockedPirateLevel(nextPirate.legacyLevel);}refreshPirateButtons();if(nextPirate&&nextPirate.playable!==false&&pirateIsOpen(nextPirate))finalText+=` ${nextPirate.name} (Difficulty ${nextPirate.difficulty}) unlocked!`;}msg.textContent=finalText;lastShotEl.textContent=resultText;updateHUD();if(fiveFrameTestActive)pendingFiveFrameCelebration={winner,text:finalText};else showWinCelebration(winner,finalText);}
function standardFoul(reason,ballInHand='anywhere'){noteCareerFoul(state.player);if(shot&&shot.pots.length)soundFoulPot();else resetPotStreak();const incoming=opponent(state.player);state.player=incoming;state.breakShot=false;if(cue().potted)restoreCue(ballInHand==='baulk'?'baulk':'anywhere');else placementMode='anywhere';msg.textContent=`FOUL — ${reason}. ${pname(incoming)}: cue ball in hand ${ballInHand==='baulk'?'in baulk':'anywhere'}.`;lastShotEl.textContent=`FOUL: ${reason} • Opponent gets cue ball in hand ${ballInHand==='baulk'?'in baulk':'anywhere'}.`;}
function showBreakChoice(){pendingChoice='break';choice.hidden=false;const chooser=opponent(state.breaker);choiceText.textContent=`Illegal break — 3 points are required. ${pname(chooser)} chooses who takes the re-rack break.`;choiceA.textContent='I will break';choiceB.textContent='Opponent breaks';shootBtn.disabled=true;choiceA.onclick=()=>resolveBreakChoice(chooser);choiceB.onclick=()=>resolveBreakChoice(state.breaker);if(aiPlayer===chooser||gameMode==='aivai'){choice.hidden=true;msg.textContent=`Illegal break — ${pname(chooser)} is choosing who breaks the re-rack…`;clearTimeout(aiTimer);aiTimer=setTimeout(()=>resolveBreakChoice(chooser),1100);}}
function resolveBreakChoice(breaker){pendingChoice=null;choice.hidden=true;newFrame(breaker);msg.textContent=`Re-rack — ${pname(breaker)} to break.`;}
function describeColourPots(pots){const reds=pots.filter(t=>t==='red').length,yellows=pots.filter(t=>t==='yellow').length,parts=[];if(reds)parts.push(`${reds} RED${reds===1?'':'S'}`);if(yellows)parts.push(`${yellows} YELLOW${yellows===1?'':'S'}`);return parts.length?parts.join(' + '):'no red/yellow balls';}
function evaluateBreak(){const pottedObjects=balls.filter(b=>b.type!=='white'&&b.potted).map(b=>b.id),pointIds=new Set([...shot.breakCrossers,...pottedObjects]),points=pointIds.size,groupPots=shot.pots.filter(t=>t==='red'||t==='yellow'),potSummary=describeColourPots(groupPots);lastShotEl.textContent=`Break: ${points} point${points===1?'':'s'} • ${potSummary} potted${points<3?' • 3 points required for a legal break':''}`;if(points<3){noteCareerFoul(state.player);if(shot.pots.length)soundFoulPot();else resetPotStreak();moving=false;showBreakChoice();return;}state.breakShot=false;if(shot.pots.includes('black'))respotBlack();if(shot.cuePotted){noteCareerFoul(state.player);if(shot.pots.length)soundFoulPot();else resetPotStreak();state.player=opponent(state.player);restoreCue('baulk');msg.textContent=`Legal break (${points} points) — ${potSummary} potted; IN-OFF. ${pname(state.player)} has cue ball in hand in baulk. Table remains OPEN.`;}else if(groupPots.length>0){soundLegalPot(state.player,groupPots.length);noteCareerLegalPots(state.player,groupPots.length);msg.textContent=`Legal break (${points} points) — ${potSummary} potted. Table remains OPEN; ${pname(state.player)} continues.`;}else{resetPotStreak();state.player=opponent(state.player);msg.textContent=`Legal break (${points} points) — no red/yellow balls potted. ${pname(state.player)}'s turn. Table remains OPEN.`;}updateHUD();}
function legalFirstContact(player,onAtStart=shot.startOn){const on=onAtStart;if(on==='open')return shot.firstContact==='red'||shot.firstContact==='yellow';return shot.firstContact===on;}
function evaluateNormal(){const p=state.player,opp=opponent(p),on=shot.startOn,pots=shot.pots.filter(t=>t!=='white'),blackPotted=pots.includes('black');const ownBefore=state.groups[p]?remaining(state.groups[p])+shot.pots.filter(t=>t===state.groups[p]).length:null;
  if(blackPotted){const cleared=state.groups[p]&&ownBefore===0;if(!cleared||shot.cuePotted||!legalFirstContact(p,on)){noteCareerFoul(p);const left=state.groups[p]?ownBefore:0,reason=shot.cuePotted?'cue ball also potted':!legalFirstContact(p,on)?'illegal first contact':`${left} ${String(state.groups[p]||'colour').toUpperCase()}${left===1?'':'S'} remaining`;soundFoulPot();finishFrame(opp,`LOSS OF FRAME — ${pname(p)} potted the eight-ball illegally. ${pname(opp)} beat off ${pname(p)}!`,`LOSS — BLACK potted illegally • ${reason} • ${pname(opp)} wins`);return;}pendingBlackOnBlackWin=(remaining('red')===0&&remaining('yellow')===0);soundLegalPot(p,1);noteCareerLegalPots(p,1);if(state.groups[p]&&frameObjectPots[p]>=7&&potStreakPlayer===p&&potStreakCount>=8)noteOneVisitClearance(p);finishFrame(p,`${pname(p)} legally pots the eight-ball. ${pname(p)} beat off ${pname(opp)}!`,`WIN — BLACK potted legally • ${pname(p)} wins`);return;}
  const firstOK=legalFirstContact(p,on),actionAfter=shot.pots.length>0||shot.cushionAfterContact;
  if(shot.cuePotted){standardFoul('cue ball potted (in-off)');updateHUD();return;}
  if(!firstOK){standardFoul(on==='open'?'failed to contact a red or yellow first':`first contact was ${shot.firstContact||'no ball'}, not ${on}`);updateHUD();return;}
  if(!actionAfter){standardFoul('no ball was potted and no ball contacted a cushion after first contact');updateHUD();return;}
  if(!state.groups[p]){const reds=pots.filter(t=>t==='red').length,yellows=pots.filter(t=>t==='yellow').length;if(reds||yellows){let g;if(reds&&yellows)g=shot.firstContact;else g=reds?'red':'yellow';state.groups[p]=g;state.groups[opp]=g==='red'?'yellow':'red';soundLegalPot(p,pots.filter(t=>t==='red'||t==='yellow').length);noteCareerLegalPots(p,pots.filter(t=>t==='red'||t==='yellow').length);const combo=reds&&yellows;msg.textContent=combo?`Legal combination — RED and YELLOW potted. ${pname(p)} struck ${g.toUpperCase()} first, so ${pname(p)} is ${g.toUpperCase()} and continues.`:`Groups decided — ${pname(p)} is ${g.toUpperCase()}. Legal pot: continue.`;lastShotEl.textContent=combo?`LEGAL: both colours potted • ${g.toUpperCase()} struck first, so that group is assigned • continue`:`LEGAL POT: ${g.toUpperCase()} potted • group assigned to ${pname(p)} • continue`;updateHUD();return;}resetPotStreak();state.player=opp;msg.textContent=`Legal shot, no pot — ${pname(opp)}. Table remains OPEN.`;lastShotEl.textContent='LEGAL: correct first contact + cushion, but no pot • loss of turn • table stays open';updateHUD();return;}
  const g=state.groups[p],onLabel=on==='black'?'black':g,ownPots=pots.filter(t=>t===g).length,oppPots=pots.filter(t=>t===state.groups[opp]).length;if(ownPots>0){soundLegalPot(p,ownPots);noteCareerLegalPots(p,ownPots);msg.textContent=`Legal pot — ${pname(p)} continues${oppPots?` (${oppPots} opponent ball also potted)`:''}.`;lastShotEl.textContent=oppPots?`LEGAL COMBINATION: ${ownPots} ${g.toUpperCase()} + ${oppPots} opponent ball${oppPots===1?'':'s'} potted • own/on ball was struck first • continue`:`LEGAL POT: ${ownPots} ${g.toUpperCase()} potted • continue`;}else{if(oppPots)soundFoulPot();else resetPotStreak();state.player=opp;msg.textContent=oppPots?`Opponent ball potted without an on-ball — loss of turn. ${pname(opp)}'s turn, ${state.groups[opp]} group.`:`No ${onLabel} potted — ${pname(opp)}'s turn, ${state.groups[opp]} group.`;lastShotEl.textContent=oppPots?`LOSS OF TURN: opponent ball potted but no ${onLabel.toUpperCase()} potted • ${pname(opp)}'s turn, ${state.groups[opp].toUpperCase()} group • cue ball stays where it lies`:`LOSS OF TURN: no ${onLabel.toUpperCase()} potted • ${pname(opp)}'s turn, ${state.groups[opp].toUpperCase()} group`;}updateHUD();}
function renderPlayLog(){for(const id of ['playLog']){const el=document.getElementById(id);if(el)el.textContent=playHistory.length?playHistory.join('\n\n'):'No shots recorded yet.';}}
function recordShotTrace(s){const first=s.firstContact?`${s.firstContact.toUpperCase()}${s.firstContactId!==null?` #${s.firstContactId}`:''}`:'NONE';const pots=s.pots.length?s.pots.map(x=>x.toUpperCase()).join(', '):'none';const result=lastShotEl.textContent||msg.textContent;let qa='';if(s.aiPlan){const matched=s.firstContactId===s.aiPlan.targetId;qa=`\nAI QA: planned ${String(s.aiPlan.targetType).toUpperCase()} #${s.aiPlan.targetId} • actual first contact ${first} • ${matched?'PLAN CONTACT MATCH':'⚠ PLAN CONTACT MISMATCH'}`;}playHistory.push(`#${s.number} | ${pname(s.player)} | ${s.isBreak?'BREAK':`on ${String(s.startOn).toUpperCase()}`}\nFirst contact: ${first} | Pots: ${pots} | Cushion after contact: ${s.cushionAfterContact?'yes':'no'}${qa}\nResult: ${result}\nTable after: red ${remaining('red')}, yellow ${remaining('yellow')}, black ${remaining('black')}`);renderPlayLog();}
function endShot(){moving=false;shootBtn.disabled=false;const completed=shot;noteCareerObjectPots(completed.player,completed.pots);if(completed.isBreak)evaluateBreak();else evaluateNormal();contextualDialogue(completed);recordShotTrace(completed);shot=null;if(schoolSession){schoolShotResolved(completed);return;}if(pendingFiveFrameCelebration){const done=pendingFiveFrameCelebration;pendingFiveFrameCelebration=null;showWinCelebration(done.winner,done.text);return;}if(!pendingChoice&&!state.frameOver){shootBtn.disabled=placementMode!=='none';updatePlacementUI();announceTurn();maybeScheduleAI();}}
function rayBallHit(x,y,dx,dy,ignore){let best=Infinity,hitBall=null;for(const b of balls){if(b===ignore||b.potted||b.type==='white')continue;const ox=b.x-x,oy=b.y-y,t=ox*dx+oy*dy;if(t<=.01)continue;const perp2=ox*ox+oy*oy-t*t,rr=(ballR*2)**2;if(perp2<=rr){const hit=t-Math.sqrt(Math.max(0,rr-perp2));if(hit<best){best=hit;hitBall=b;}}}return{distance:best,ball:hitBall};}
function rayCushionDistance(x,y,dx,dy){let vals=[];if(dx>1e-6)vals.push((R-ballR-x)/dx);if(dx<-1e-6)vals.push((L+ballR-x)/dx);if(dy>1e-6)vals.push((B-ballR-y)/dy);if(dy<-1e-6)vals.push((T+ballR-y)/dy);vals=vals.filter(v=>v>.01);return vals.length?Math.min(...vals):Infinity;}
// Lightweight moving chevrons are rendered on the same canvas as the guide.
// Their orientation is derived from the same physics direction, not a CSS overlay.
function aimDirectionArrows(x,y,dx,dy,length,now=performance.now(),colour='#fff',spacing=52){
  if(!aimArrows||length<28)return;
  const offset=(now*.055)%spacing,sideX=-dy,sideY=dx;
  ctx.save();ctx.strokeStyle=colour;ctx.globalAlpha=.72;ctx.lineWidth=2.7;ctx.lineCap='round';ctx.lineJoin='round';
  for(let d=offset+18;d<length-12;d+=spacing){
    const px=x+dx*d,py=y+dy*d,back=10,wing=6;
    ctx.beginPath();ctx.moveTo(px-dx*back+sideX*wing,py-dy*back+sideY*wing);
    ctx.lineTo(px,py);ctx.lineTo(px-dx*back-sideX*wing,py-dy*back-sideY*wing);ctx.stroke();
  }
  ctx.restore();
}
function guide(){if(moving||state.frameOver||pendingChoice||cue().potted)return;const c=cue(),dx=Math.cos(angle),dy=Math.sin(angle);let best=2000,target=null;for(const b of balls.slice(1)){if(b.potted)continue;const ox=b.x-c.x,oy=b.y-c.y,t=ox*dx+oy*dy;if(t<=0)continue;const perp2=ox*ox+oy*oy-t*t,rr=(ballR*2)**2;if(perp2<=rr){const hit=t-Math.sqrt(rr-perp2);if(hit<best){best=hit;target=b;}}}const tx=c.x+dx*best,ty=c.y+dy*best;ctx.save();ctx.setLineDash([13,12]);ctx.strokeStyle='#fff9';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(c.x,c.y);ctx.lineTo(tx,ty);ctx.stroke();ctx.setLineDash([]);aimDirectionArrows(c.x,c.y,dx,dy,best,performance.now(),'#ffffff');ctx.fillStyle='#fff8';ctx.beginPath();ctx.arc(tx,ty,6,0,Math.PI*2);ctx.fill();
  if(devAngleGuide&&target){const nx=target.x-tx,ny=target.y-ty,nlen=Math.hypot(nx,ny);if(nlen>.001){const odx=nx/nlen,ody=ny/nlen;const ballHit=rayBallHit(target.x,target.y,odx,ody,target),cush=rayCushionDistance(target.x,target.y,odx,ody),dist=Math.min(ballHit.distance,cush);if(Number.isFinite(dist)&&dist>0){ctx.strokeStyle='#ffe28a';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(target.x,target.y);ctx.lineTo(target.x+odx*dist,target.y+ody*dist);ctx.stroke();aimDirectionArrows(target.x,target.y,odx,ody,dist,performance.now(),'#ffe28a',44);}}}
  ctx.restore();}
function activeTableTheme(){if(forcedTableTheme)return forcedTableTheme;return COSMETICS.tables[equippedTableTheme]?.source==='supporter'&&!cosmeticIsUnlocked('tables',equippedTableTheme)?'classic':equippedTableTheme;}
function tableThemePalette(){
  const theme=activeTableTheme();
  if(theme==='lucy_fir')return{rail:'#261913',cloth:'#302c2a',edge:'#d96624',ambience:'rgba(255,65,0,.04)'};
  if(theme==='vaper')return{rail:'#050b17',cloth:'#080e1b',edge:'#19a7ff',ambience:'rgba(10,80,155,.055)'};
  if(theme==='pokey')return{rail:'#79583b',cloth:'#c8b998',edge:'#c9c7a7',ambience:'rgba(200,215,145,.05)'};
  if(theme==='captain')return{rail:'#4a2916',cloth:'#18583f',edge:'#c99a4c',ambience:'rgba(238,177,86,.045)'};
  if(theme==='spectral')return{rail:'#263b3e',cloth:'#285f59',edge:'#8ed4c4',ambience:'rgba(124,235,217,.07)'};
  if(theme==='privates')return{rail:'#8b6928',cloth:'#202020',edge:'#e0b858',ambience:'rgba(205,205,205,.025)'};
  if(theme==='strangevoice')return{rail:'#59452f',cloth:'#6d5d46',edge:'#7b6749',ambience:'rgba(75,58,38,.035)'};
  if(theme==='blockbeard')return{rail:'#735237',cloth:'#54804b',edge:'#c3aa68',ambience:'rgba(90,110,50,.035)'};
  if(theme==='larper')return{rail:'#45494b',cloth:'#50565a',edge:'#a7a8a2',ambience:'rgba(130,140,150,.035)'};
  if(theme==='wiggles')return{rail:'#73517f',cloth:'#dfbad0',edge:'#b99555',ambience:'rgba(255,220,240,.045)'};
  return{rail:'#56371f',cloth:'#2a7b57',edge:'#163f30',ambience:null};
}
// K2F.2: approved Chapter 3 table concepts translated to the real match canvas.
// Render only decoration: pocket coordinates and collision geometry remain unchanged.
function drawChapter3RailFinish(now){
  const theme=activeTableTheme();if(theme!=='larper'&&theme!=='blockbeard')return;
  ctx.save();
  const rail=ctx.createLinearGradient(0,0,W,H);
  if(theme==='larper'){
    rail.addColorStop(0,'#a6a7a0');rail.addColorStop(.13,'#5b6062');rail.addColorStop(.32,'#262b31');rail.addColorStop(.58,'#767b7a');rail.addColorStop(.79,'#353b40');rail.addColorStop(1,'#b4afa0');
  }else{
    rail.addColorStop(0,'#b8945d');rail.addColorStop(.2,'#725138');rail.addColorStop(.45,'#382c28');rail.addColorStop(.7,'#7c6140');rail.addColorStop(1,'#d0ac6a');
  }
  ctx.fillStyle=rail;
  ctx.fillRect(0,0,W,T);ctx.fillRect(0,B,W,H-B);
  ctx.fillRect(0,T,L,B-T);ctx.fillRect(R,T,W-R,B-T);
  ctx.lineWidth=5;ctx.strokeStyle=theme==='larper'?'#c8c8bb':'#e7b96b';
  ctx.shadowColor=theme==='larper'?'#e0e6e8':'#e8b35c';ctx.shadowBlur=theme==='larper'?10:8;
  ctx.strokeRect(L-9,T-9,R-L+18,B-T+18);ctx.shadowBlur=0;
  ctx.lineWidth=2;ctx.strokeStyle=theme==='larper'?'#23262c':'#3b281c';
  ctx.strokeRect(8,8,W-16,H-16);
  if(theme==='larper'){
    // Riveted engraved panels on the polished stone-and-iron frame.
    ctx.fillStyle='#c7c6b7';ctx.shadowColor='#e5d6ad';ctx.shadowBlur=3;
    for(let x=L+30;x<R-10;x+=72)for(const y of [T-20,B+20]){
      ctx.beginPath();ctx.arc(x,y,3,0,Math.PI*2);ctx.fill();
    }
  }else{
    // Pixelated wood/stone rail tiles, blocky gold joints and stepped inlay.
    const tile=36;ctx.lineWidth=2;
    for(let x=8;x<W-8;x+=tile){
      const shade=Math.floor(x/tile)%3;
      ctx.fillStyle=['#d6ad67','#795337','#a37b49'][shade];
      ctx.fillRect(x,11,Math.min(tile-3,W-x-11),7);
      ctx.fillRect(x,H-18,Math.min(tile-3,W-x-11),7);
      ctx.strokeStyle='#33291d';ctx.strokeRect(x,11,Math.min(tile-3,W-x-11),7);
    }
    for(let y=T+10;y<B-8;y+=tile){
      ctx.fillStyle=(Math.floor(y/tile)%2)?'#c69c59':'#806041';
      ctx.fillRect(10,y,8,Math.min(tile-3,B-y-7));
      ctx.fillRect(W-18,y,8,Math.min(tile-3,B-y-7));
    }
    // High-contrast square mosaics and stepped bevels; no changes to playable cloth or pockets.
    for(let x=14;x<W-14;x+=24){
      const k=Math.floor(x/24)%4;
      ctx.fillStyle=['#f2d48a','#543922','#c99a4f','#8b683e'][k];
      ctx.fillRect(x,23,20,11);ctx.fillRect(x,H-34,20,11);
      ctx.fillStyle='rgba(30,22,17,.65)';ctx.fillRect(x+2,34,16,3);ctx.fillRect(x+2,H-37,16,3);
    }
    for(let y=T+12;y<B-12;y+=24){
      ctx.fillStyle=(Math.floor(y/24)%2)?'#e2b86d':'#6c482c';
      ctx.fillRect(23,y,11,20);ctx.fillRect(W-34,y,11,20);
    }
    for(const x of [L-18,R+18])for(const y of [T-18,B+18]){
      ctx.fillStyle='#f4d07e';ctx.fillRect(x-8,y-8,16,16);
      ctx.fillStyle='#604329';ctx.fillRect(x-4,y-4,8,8);
    }
  }
  ctx.restore();
}
let vapeMatchStarted=performance.now();
// K2F.16: each Vaper puff is born at the current cue ball position and
// independently drifts in any direction, including down across the controls.
// The fixed overlay never receives pointer events and never alters physics.
const vaperRoomFog=document.createElement('div');
vaperRoomFog.id='vaperRoomFog';vaperRoomFog.setAttribute('aria-hidden','true');
const vaperPuffs=[];
const VAPER_PUFF_COUNT=48;
for(let i=0;i<VAPER_PUFF_COUNT;i++){
 const puff=document.createElement('div');puff.className='vaper-room-puff';
 vaperRoomFog.appendChild(puff);
 vaperPuffs.push({element:puff,startedAt:0,duration:0,active:false});
}
document.body.appendChild(vaperRoomFog);
let vaperFogLastUpdate=0;
let vaperFogWasActive=false;
let vaperNextPuffAt=0;
let vaperPuffCursor=0;
function emitVaperPuff(now,elapsed){
 const slot=vaperPuffs[vaperPuffCursor++%vaperPuffs.length];
 const puff=slot.element;
 const rect=canvas.getBoundingClientRect();
 const white=cue();
 const bx=white&&Number.isFinite(white.x)?white.x:W/2;
 const by=white&&Number.isFinite(white.y)?white.y:H/2;
 // Canvas coordinates, not a fixed table centre. Spawn near Vaper's implied stance.
 const x=rect.left+bx/W*rect.width+(Math.random()-.5)*32;
 const y=rect.top+by/H*rect.height+(Math.random()-.5)*30;
 const angle=Math.random()*Math.PI*2;
 // A mixture of short swirls and long journeys to the helm and shot buttons.
 const reach=(110+Math.random()*220)*(1+Math.min(elapsed/420,.9));
 let dx=Math.cos(angle)*reach;
 let dy=Math.sin(angle)*reach;
 // Regular downward puffs make the lower controls visibly smoky too.
 if(vaperPuffCursor%4===0){dy=110+Math.random()*Math.max(170,window.innerHeight-y+90);dx=(Math.random()-.5)*270;}
 const duration=14000+Math.random()*16000;
 const size=80+Math.random()*95;
 puff.classList.remove('emitting');
 puff.style.left=x+'px';puff.style.top=y+'px';
 puff.style.width=size+'px';puff.style.height=(size*.7)+'px';
 puff.style.setProperty('--drift-x',dx+'px');
 puff.style.setProperty('--drift-y',dy+'px');
 puff.style.setProperty('--duration',duration+'ms');
 // Force restart so each cloud is an independent, one-shot emission.
 void puff.offsetWidth;
 puff.classList.add('emitting');
 slot.startedAt=now;slot.duration=duration;slot.active=true;
}
function updateVaperRoomFog(now){
 if(now-vaperFogLastUpdate<100)return;
 vaperFogLastUpdate=now;
 const active=gameMode==='pirate'&&activePirate()?.id==='vaper'&&document.getElementById('gameApp')?.hidden===false&&canvas.getClientRects().length>0&&!document.hidden;
 vaperRoomFog.classList.toggle('active',!!active);
 if(!active){
  if(vaperFogWasActive)vaperPuffs.forEach(p=>{p.element.classList.remove('emitting');p.active=false;});
  vaperFogWasActive=false;return;
 }
 if(!vaperFogWasActive){vapeMatchStarted=now;vaperNextPuffAt=now;vaperFogWasActive=true;vaperPuffCursor=0;}
 const elapsed=Math.max(0,(now-vapeMatchStarted)/1000);
 // Begin gently, accelerating as Vaper fills the room. Never spawn a huge fog bank.
 const interval=Math.max(1100,4300-elapsed*6);
 if(now>=vaperNextPuffAt){emitVaperPuff(now,elapsed);vaperNextPuffAt=now+interval;}
 vaperPuffs.forEach(p=>{if(p.active&&now-p.startedAt>p.duration){p.element.classList.remove('emitting');p.active=false;}});
}

let izzyShedHairs=[];
function emitIzzyHairs(x,y,a,colour='white'){
  for(let i=0;i<19;i++){
    const scatter=(Math.random()-.5)*1.8,dist=15+Math.random()*88;
    const px=Math.max(L+4,Math.min(R-4,x+Math.cos(a+scatter)*dist));
    const py=Math.max(T+4,Math.min(B-4,y+Math.sin(a+scatter)*dist));
    izzyShedHairs.push({x:px,y:py,a:a+scatter+Math.PI/2,len:6+Math.random()*13,colour});
  }
  if(izzyShedHairs.length>2200)izzyShedHairs.splice(0,izzyShedHairs.length-2200);
}
function drawIzzyHairs(){
  if(!izzyShedHairs.length)return;
  ctx.save();ctx.beginPath();ctx.rect(L,T,R-L,B-T);ctx.clip();ctx.lineWidth=1.1;
  for(const h of izzyShedHairs){ctx.strokeStyle=h.colour==='black'?'rgba(12,11,13,.83)':'rgba(241,239,225,.72)';ctx.beginPath();ctx.moveTo(h.x,h.y);ctx.quadraticCurveTo(h.x+Math.cos(h.a+.6)*h.len*.55,h.y+Math.sin(h.a+.6)*h.len*.55,h.x+Math.cos(h.a)*h.len,h.y+Math.sin(h.a)*h.len);ctx.stroke();}
  ctx.restore();
}
function drawTableAtmosphere(now,pal){
  if(activeTableTheme()==='lucy_fir'){ctx.save();ctx.strokeStyle='#0d0806';ctx.lineWidth=2;for(let i=0;i<22;i++){const x=L+(i*.618%1)*(R-L);for(const y of [T-20,B+20]){ctx.beginPath();ctx.moveTo(x,y-10);ctx.lineTo(x+7,y);ctx.lineTo(x-4,y+11);ctx.stroke();}}ctx.restore();}
  const theme=activeTableTheme();
  if(theme==='vaper'){
    ctx.save();ctx.shadowColor='#119cff';ctx.shadowBlur=21;ctx.strokeStyle='rgba(22,165,255,.9)';ctx.lineWidth=5;ctx.strokeRect(L-8,T-8,R-L+16,B-T+16);ctx.restore();
    // K2F.14: vapour is now a viewport overlay, not clipped to the table canvas.
  }
  if(theme==='pokey'){
    ctx.save();const cx=(L+R)/2,cy=(T+B)/2,r=Math.min(R-L,B-T)*.23;
    ctx.strokeStyle='rgba(65,56,44,.72)';ctx.lineWidth=3;ctx.strokeRect(L+26,T+22,R-L-52,B-T-44);
    ctx.fillStyle='rgba(178,77,67,.62)';ctx.beginPath();ctx.arc(cx,cy,r,Math.PI/2,Math.PI*1.5);ctx.fill();
    ctx.fillStyle='rgba(241,238,221,.7)';ctx.beginPath();ctx.arc(cx,cy,r,-Math.PI/2,Math.PI/2);ctx.fill();
    ctx.strokeStyle='#514a3f';ctx.lineWidth=3;ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.moveTo(cx,cy-r);ctx.lineTo(cx,cy+r);ctx.stroke();
    ctx.fillStyle='#e8e4d8';ctx.beginPath();ctx.arc(cx,cy,r*.22,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.restore();
  }
  if(theme==='larper'){
    // Grey iron/stone rails, engraving and LED candles outside playing surface.
    ctx.save();ctx.strokeStyle='rgba(190,196,195,.36)';ctx.lineWidth=3;
    ctx.strokeRect(L-13,T-13,R-L+26,B-T+26);
    for(let x=L+35;x<R-20;x+=48){ctx.beginPath();ctx.moveTo(x,T-14);ctx.lineTo(x+15,T-8);ctx.moveTo(x,B+14);ctx.lineTo(x+15,B+8);ctx.stroke();}
    // K2F.3: no candles; keep the engraved frame and polished metal detailing.
    ctx.restore();
  }
  if(theme==='blockbeard'){
    ctx.save();ctx.fillStyle='rgba(73,116,48,.65)';
    for(let x=0;x<W;x+=37){ctx.fillRect(x,2,33,8);ctx.fillRect(x,H-10,33,8);}
    for(let y=T;y<B;y+=38){ctx.fillRect(2,y,8,33);ctx.fillRect(W-10,y,8,33);}
    ctx.restore();
  }
  if(theme==='blockbeard'){ctx.save();ctx.strokeStyle='rgba(38,30,18,.6)';ctx.lineWidth=5;for(let i=0;i<18;i++){let x=i*(W/18);ctx.strokeRect(x,2,W/18-2,T-4);ctx.strokeRect(x,B+2,W/18-2,H-B-4);}ctx.restore();}
  if(theme==='wiggles'){ctx.save();ctx.strokeStyle='rgba(205,170,95,.38)';ctx.lineWidth=3;ctx.strokeRect(7,7,W-14,H-14);ctx.fillStyle='rgba(80,45,88,.10)';for(let i=0;i<10;i++){const x=(i*137)%W,y=(i*83)%H;ctx.fillRect(x,y,28+(i%3)*14,2);}ctx.restore();}
  if(theme==='captain'){
    // Rich varnished timber. Highlights breathe slowly rather than travelling around the table.
    const gloss=ctx.createLinearGradient(0,0,W,H);gloss.addColorStop(0,'rgba(255,221,151,.23)');gloss.addColorStop(.20,'rgba(255,255,255,.035)');gloss.addColorStop(.55,'rgba(85,34,10,.17)');gloss.addColorStop(1,'rgba(255,190,93,.15)');
    ctx.fillStyle=gloss;ctx.fillRect(0,0,W,T);ctx.fillRect(0,B,W,H-B);ctx.fillRect(0,T,L,B-T);ctx.fillRect(R,T,W-R,B-T);
    const pulse=.34+.12*Math.sin(now/1450);ctx.save();ctx.strokeStyle=`rgba(255,215,132,${pulse})`;ctx.lineWidth=4;ctx.shadowColor='rgba(255,190,80,.34)';ctx.shadowBlur=14+4*Math.sin(now/1800);ctx.strokeRect(L-9,T-9,R-L+18,B-T+18);ctx.restore();
  }else if(theme==='spectral'){
    // Extremely transparent drifting mist, kept below balls/guides for readability.
    ctx.save();ctx.beginPath();ctx.rect(L,T,R-L,B-T);ctx.clip();
    const t=now/1000;
    for(let i=0;i<5;i++){
      const x=L+((i*337+t*24*(i%2?1:-1))%(R-L+420))-210;
      const y=T+(PLAY_H*(.16+i*.17))+Math.sin(t*.28+i*1.7)*35;
      const g=ctx.createRadialGradient(x,y,0,x,y,220);g.addColorStop(0,'rgba(202,255,246,.045)');g.addColorStop(.55,'rgba(157,239,226,.022)');g.addColorStop(1,'rgba(120,220,210,0)');ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(x,y,240,72,.12*Math.sin(t*.2+i),0,Math.PI*2);ctx.fill();
    }
    ctx.restore();
    const pulse=.24+.10*Math.sin(now/1350);ctx.save();ctx.strokeStyle=`rgba(177,255,240,${pulse})`;ctx.lineWidth=4;ctx.shadowColor='rgba(112,255,230,.42)';ctx.shadowBlur=15+4*Math.sin(now/1700);ctx.strokeRect(L-7,T-7,R-L+14,B-T+14);ctx.restore();
  }else if(theme==='strangevoice'){
    // Strangevoice Island house table: worn timber and muted olive-brown cloth.
    // Cosmetic wear stays beneath balls/guides and does not alter table geometry or physics.
    ctx.save();
    const wood=ctx.createLinearGradient(0,0,W,H);wood.addColorStop(0,'rgba(198,157,103,.10)');wood.addColorStop(.34,'rgba(56,37,22,.13)');wood.addColorStop(.7,'rgba(173,130,82,.07)');wood.addColorStop(1,'rgba(38,28,20,.14)');
    ctx.fillStyle=wood;ctx.fillRect(0,0,W,T);ctx.fillRect(0,B,W,H-B);ctx.fillRect(0,T,L,B-T);ctx.fillRect(R,T,W-R,B-T);
    ctx.beginPath();ctx.rect(L,T,R-L,B-T);ctx.clip();
    ctx.strokeStyle='rgba(48,38,27,.075)';ctx.lineWidth=3;
    const marks=[[.13,.22,.28,.18],[.61,.31,.18,.24],[.26,.73,.22,.68],[.73,.62,.86,.58],[.43,.47,.51,.43]];
    for(const [x1,y1,x2,y2] of marks){ctx.beginPath();ctx.moveTo(L+(R-L)*x1,T+(B-T)*y1);ctx.lineTo(L+(R-L)*x2,T+(B-T)*y2);ctx.stroke();}
    ctx.restore();
  }else if(theme==='privates'){
    // Blackball's absurdly level shipboard table: restrained gold glint, candles and thin grey mist.
    const sweep=(now/28)%(W+500)-250,gold=ctx.createLinearGradient(sweep,0,sweep+230,0);gold.addColorStop(0,'rgba(255,220,126,0)');gold.addColorStop(.5,'rgba(255,231,157,.18)');gold.addColorStop(1,'rgba(255,220,126,0)');ctx.fillStyle=gold;ctx.fillRect(0,0,W,T);ctx.fillRect(0,B,W,H-B);
    ctx.save();ctx.beginPath();ctx.rect(L,T,R-L,B-T);ctx.clip();const t=now/1000;for(let i=0;i<4;i++){const x=L+((i*401+t*15)%(R-L+360))-180,y=T+PLAY_H*(.22+i*.18)+Math.sin(t*.23+i)*24,g=ctx.createRadialGradient(x,y,0,x,y,190);g.addColorStop(0,'rgba(205,205,205,.035)');g.addColorStop(1,'rgba(180,180,180,0)');ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(x,y,210,52,0,0,Math.PI*2);ctx.fill();}ctx.restore();
    for(const [x,y] of [[L+72,T+52],[R-78,T+62],[L+84,B-55]]){const flick=.14+.05*Math.sin(now/170+iSafe(x));const g=ctx.createRadialGradient(x,y,0,x,y,70);g.addColorStop(0,`rgba(255,177,76,${flick})`);g.addColorStop(1,'rgba(255,150,50,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,70,0,Math.PI*2);ctx.fill();}
  }
}
function iSafe(n){return Math.round(n)%997;}
function drawCushionShadows(){
  // Soft full-length cushion shadows: strongest at the rail, fading into the cloth.
  const depth=44;
  ctx.save();
  let g=ctx.createLinearGradient(0,T,0,T+depth);g.addColorStop(0,'rgba(0,0,0,.27)');g.addColorStop(.42,'rgba(0,0,0,.12)');g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.fillRect(L,T,R-L,depth);
  g=ctx.createLinearGradient(0,B,0,B-depth);g.addColorStop(0,'rgba(0,0,0,.27)');g.addColorStop(.42,'rgba(0,0,0,.12)');g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.fillRect(L,B-depth,R-L,depth);
  g=ctx.createLinearGradient(L,0,L+depth,0);g.addColorStop(0,'rgba(0,0,0,.25)');g.addColorStop(.42,'rgba(0,0,0,.105)');g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.fillRect(L,T,depth,B-T);
  g=ctx.createLinearGradient(R,0,R-depth,0);g.addColorStop(0,'rgba(0,0,0,.25)');g.addColorStop(.42,'rgba(0,0,0,.105)');g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.fillRect(R-depth,T,depth,B-T);
  ctx.restore();
}
function pocketInwardAngle(x,y){
  const eps=2;
  const left=Math.abs(x-L)<eps,right=Math.abs(x-R)<eps,top=Math.abs(y-T)<eps,bottom=Math.abs(y-B)<eps;
  if(top&&left)return Math.PI/4;
  if(top&&right)return Math.PI*3/4;
  if(bottom&&left)return -Math.PI/4;
  if(bottom&&right)return -Math.PI*3/4;
  if(top)return Math.PI/2;
  if(bottom)return -Math.PI/2;
  return 0;
}
function drawPocket(p){

  const x=p[0],y=p[1],inward=pocketInwardAngle(x,y);ctx.save();
  if(activeTableTheme()==='blockbeard'){
    const size=pocketR+7;
    ctx.fillStyle='#251c1b';ctx.fillRect(x-size-4,y-size-4,(size+4)*2,(size+4)*2);
    ctx.fillStyle='#efc978';ctx.fillRect(x-size-1,y-size-1,(size+1)*2,(size+1)*2);
    ctx.fillStyle='#694729';ctx.fillRect(x-size+2,y-size+2,(size-2)*2,(size-2)*2);
    ctx.fillStyle='#090c0b';ctx.fillRect(x-size+5,y-size+5,(size-5)*2,(size-5)*2);
    ctx.fillStyle='#151c17';ctx.fillRect(x-size+9,y-size+9,(size-9)*2,(size-9)*2);
    ctx.restore();return;
  }
  // Recessed dark pocket first. The opening remains unobstructed on the table-facing side.
  const hole=ctx.createRadialGradient(x-pocketR*.22,y-pocketR*.25,2,x,y,pocketR*1.08);
  hole.addColorStop(0,'#252a2c');hole.addColorStop(.32,'#101214');hole.addColorStop(.70,'#030404');hole.addColorStop(1,'#000');
  ctx.fillStyle=hole;ctx.beginPath();ctx.arc(x,y,pocketR+2,0,Math.PI*2);ctx.fill();
  // Metallic collar is deliberately an OPEN arc, like a real pocket mouth rather than a ring.
  const rimR=pocketR+8,gap=Math.PI*.64,start=inward+gap/2,end=inward+Math.PI*2-gap/2;
  const metal=ctx.createLinearGradient(x-rimR,y-rimR,x+rimR,y+rimR);metal.addColorStop(0,'#f1f3f3');metal.addColorStop(.24,'#7f888b');metal.addColorStop(.48,'#3f474a');metal.addColorStop(.72,'#d7dbdc');metal.addColorStop(1,'#555d60');
  ctx.strokeStyle='rgba(7,9,10,.9)';ctx.lineWidth=15;ctx.lineCap='round';ctx.beginPath();ctx.arc(x,y,rimR,start,end);ctx.stroke();
  ctx.strokeStyle=metal;ctx.lineWidth=10;ctx.beginPath();ctx.arc(x,y,rimR,start,end);ctx.stroke();
  ctx.strokeStyle='rgba(255,255,255,.28)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,rimR-3,start+.03,end-.03);ctx.stroke();
  // Short angled jaw caps at each side of the mouth help the cushion appear to terminate at the pocket.
  for(const a of [start,end]){const ax=x+Math.cos(a)*rimR,ay=y+Math.sin(a)*rimR;const tx=Math.cos(inward),ty=Math.sin(inward);ctx.strokeStyle='rgba(18,20,21,.9)';ctx.lineWidth=9;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(ax+tx*13,ay+ty*13);ctx.stroke();ctx.strokeStyle='#9ca4a6';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(ax+tx*12,ay+ty*12);ctx.stroke();}
  if(activeTableTheme()==='lucy_fir')k4DrawPocketRim(ctx,x,y,rimR,start,end);
  ctx.restore();
}
function triggerLegalPotSparkles(){
  // Celebration is deliberately independent from the potted ball object. By the time
  // a shot is adjudicated the physics ball has already been removed, so snapshot the
  // pocket events into their own short-lived render objects.
  if(!shot||shot._legalSparklesTriggered)return;
  shot._legalSparklesTriggered=true;
  const now=performance.now(),seen=new Set();
  const events=(shot.potEvents||[]).filter(ev=>ev.type!=='white');
  for(const ev of events){
    let pi=ev.pocketIndex;
    // Defensive fallback for old/special pot paths: use the nearest pocket to the
    // corresponding recent fade visual rather than silently losing the celebration.
    if(pi==null){
      const fade=[...potFadeVisuals].reverse().find(v=>v.type===ev.type&&now-v.started<1200);
      if(fade)pi=pockets.reduce((best,p,i)=>Math.hypot(fade.x-p[0],fade.y-p[1])<Math.hypot(fade.x-pockets[best][0],fade.y-pockets[best][1])?i:best,0);
    }
    if(pi==null||seen.has(pi))continue;
    seen.add(pi);
    legalPotSparkles.push({pocketIndex:pi,started:now,seed:Math.random()*Math.PI*2});
  }
}
function drawPotFadeVisuals(now=performance.now()){
  potFadeVisuals=potFadeVisuals.filter(v=>now-v.started<500);
  for(const v of potFadeVisuals){
    const q=Math.max(0,Math.min(1,(now-v.started)/500)),alpha=1-q,scale=1-.12*q;
    ctx.save();ctx.globalAlpha=alpha;ctx.translate(v.x,v.y);ctx.scale(scale,scale);ctx.translate(-v.x,-v.y);
    ctx.fillStyle=colors[v.type];ctx.beginPath();ctx.arc(v.x,v.y,ballR,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#0007';ctx.lineWidth=2;ctx.stroke();
    drawBallPolish({x:v.x,y:v.y,type:v.type});
    if(v.type==='black'){ctx.fillStyle='#eee';ctx.font='bold 15px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('8',v.x,v.y)}
    ctx.restore();
  }
}
function drawLegalPotSparkles(now=performance.now()){
  legalPotSparkles=legalPotSparkles.filter(s=>now-s.started<560);
  for(const s of legalPotSparkles){
    const age=now-s.started,q=Math.max(0,Math.min(1,age/560)),p=pockets[s.pocketIndex];if(!p)continue;
    const x=p[0],y=p[1],pulse=Math.sin(q*Math.PI),alpha=.25+.75*pulse;
    ctx.save();
    // Soft expanding halo makes the PING readable even on small/mobile tables.
    const halo=ctx.createRadialGradient(x,y,pocketR*.55,x,y,pocketR+28+q*12);
    halo.addColorStop(0,`rgba(255,244,194,${.20*pulse})`);
    halo.addColorStop(.48,`rgba(255,211,104,${.16*pulse})`);
    halo.addColorStop(1,'rgba(255,211,104,0)');
    ctx.fillStyle=halo;ctx.beginPath();ctx.arc(x,y,pocketR+30+q*12,0,Math.PI*2);ctx.fill();
    // Bright metallic rim flash.
    ctx.strokeStyle=`rgba(255,235,165,${.88*pulse})`;ctx.lineWidth=4;ctx.shadowColor='rgba(255,214,105,.95)';ctx.shadowBlur=16*pulse+2;
    ctx.beginPath();ctx.arc(x,y,pocketR+10+q*4,0,Math.PI*2);ctx.stroke();
    // Six compact four-point stars.
    for(let i=0;i<6;i++){
      const a=s.seed+i*Math.PI/3,dist=pocketR+14+q*(20+(i%2)*5),sx=x+Math.cos(a)*dist,sy=y+Math.sin(a)*dist,size=(3.5+(i%3)*1.2)*pulse;
      ctx.fillStyle=`rgba(255,245,205,${alpha*pulse})`;ctx.shadowBlur=7*pulse;
      ctx.beginPath();ctx.moveTo(sx,sy-size);ctx.lineTo(sx+size*.28,sy-size*.28);ctx.lineTo(sx+size,sy);ctx.lineTo(sx+size*.28,sy+size*.28);ctx.lineTo(sx,sy+size);ctx.lineTo(sx-size*.28,sy+size*.28);ctx.lineTo(sx-size,sy);ctx.lineTo(sx-size*.28,sy-size*.28);ctx.closePath();ctx.fill();
    }
    ctx.restore();
  }
}
// K2F.1: explicit opponent equipment ownership. Never derive a pirate cue from AI difficulty.
const PIRATE_CUE_BY_ID=Object.freeze({
  spinball_wizard:'spinball_wizard',
  ...Object.fromEntries(window.SeamenChapter4.opponents.map(p=>[p.id,p.id])),
  dave:'dave',simon:'simon',holly:'holly',mick:'mick',blackball:'blackball',
  cyclops:'classic',vaper:'vaper',sandy:'sandy',shelle:'shelle',graham:'graham',
  papa_surf:'papa_surf',chapter2_boss:'wiggles',barley:'carrot',legolass:'bow',
  aragoon:'claymore',souronion:'souronion',blockbeard:'golden',
  gimlet:'gimlet',bam_bam:'bambam',pokey_man:'pokey',izzy:'izzy'
});
const warnedMissingPirateCues=new Set();
function cueStyleForShooter(player=state?.player){
  if(gameMode==='pirate'&&player===aiPlayer){
    const pirate=activePirate(),id=pirate?.id;
    if(Object.prototype.hasOwnProperty.call(PIRATE_CUE_BY_ID,id))return PIRATE_CUE_BY_ID[id];
    if(IS_DEVELOPMENT_BUILD&&id&&!warnedMissingPirateCues.has(id)){
      warnedMissingPirateCues.add(id);console.warn('Missing explicit pirate cue assignment:',id);
    }
    return 'classic';
  }
  if(gameMode==='aivai'){
    const id=pirateByLegacyLevel(aiVsAiLevels[player])?.id;
    return PIRATE_CUE_BY_ID[id]||'classic';
  }
  return player===1&&cueUnlocked(equippedCue)?equippedCue:'classic';
}
function strokeCueLine(x1,y1,x2,y2,style,g=ctx){
  g.lineCap='round';
  if(k4RenderCue(g,x1,y1,x2,y2,style))return;
  if(style==='blockbeard'){
    g.save();g.shadowColor='#f8d45e';g.shadowBlur=20;g.strokeStyle='rgba(255,208,54,.48)';g.lineWidth=23;g.beginPath();g.moveTo(x1,y1);g.lineTo(x2,y2);g.stroke();g.restore();
  }
  if(['carrot','bow','claymore','souronion','golden','gimlet','bambam'].includes(style)){
    // K2F.1: shared Canvas renderer for live cues AND Cosmetics catalogue.
    // Keep the physical cue axis straight; decorative geometry never affects aiming.
    const dx=x2-x1,dy=y2-y1,len=Math.hypot(dx,dy)||1;
    g.save();g.translate(x1,y1);g.rotate(Math.atan2(dy,dx));
    const line=(a,b,width,color)=>{g.beginPath();g.moveTo(a,0);g.lineTo(b,0);g.lineWidth=width;g.strokeStyle=color;g.stroke();};
    const poly=(pts,fill,stroke)=>{g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.fillStyle=fill;g.fill();if(stroke){g.lineWidth=2;g.strokeStyle=stroke;g.stroke();}};
    const blade=style==='claymore'||style==='souronion';
    if(style==='carrot'){
      const grad=g.createLinearGradient(0,-12,len,12);grad.addColorStop(0,'#ffbf62');grad.addColorStop(.4,'#f67e21');grad.addColorStop(1,'#a83e0c');
      poly([[0,0],[len*.11,-9],[len*.92,-16],[len*.92,16],[len*.11,9]],grad,'#a54b12');
      g.strokeStyle='#9d4515';g.lineWidth=2;for(let i=1;i<=8;i++){const x=len*(.16+i*.085);g.beginPath();g.moveTo(x,-8);g.lineTo(x+8,2);g.stroke();}
      for(const [a,spread] of [[-.16,-24],[0,-30],[.16,24]]){g.strokeStyle='#3c9e3e';g.lineWidth=7;g.beginPath();g.moveTo(len*.92,0);g.quadraticCurveTo(len+13,spread*.6,len+28,spread);g.stroke();}
    }else if(style==='bow'){
      line(0,len,5,'#fff4d9');g.strokeStyle='#eee2c3';g.lineWidth=12;g.beginPath();g.moveTo(0,0);g.quadraticCurveTo(len*.5,-38,len,0);g.stroke();
      g.strokeStyle='#fff';g.lineWidth=3;g.beginPath();g.moveTo(0,0);g.lineTo(len,0);g.stroke();
      for(const t of [.10,.90]){g.fillStyle='#b69a67';g.fillRect(len*t-4,-4,8,8);}
    }else if(blade){
      const crimson=style==='souronion',end=len*.78;
      // K2F.2: stronger multi-pass bloom, still using the shared match/catalogue renderer.
      const aura=crimson?'#ff174d':'#b56aff';
      g.save();g.shadowColor=aura;g.shadowBlur=42;line(len*.06,end,27,crimson?'rgba(255,18,62,.40)':'rgba(169,87,255,.40)');
      g.shadowBlur=24;line(len*.06,end,17,crimson?'rgba(255,70,98,.60)':'rgba(195,134,255,.60)');g.restore();
      g.shadowColor=aura;g.shadowBlur=crimson?34:32;
      poly([[0,0],[len*.10,-13],[end,-12],[end,12],[len*.10,13]],crimson?'#3b1a23':'#b4bac5',crimson?'#ff2952':'#b77bff');
      g.shadowBlur=0;line(len*.12,end-3,3,crimson?'#ff4e67':'#e6eaf0');
      line(end,len,12,crimson?'#3a1a19':'#55434b');
      line(end-12,end+12,17,crimson?'#912e28':'#b2a29d');
      line(len-16,len,18,crimson?'#4d2021':'#5d4a51');
      if(crimson){g.fillStyle='#ff4a1c';for(let i=0;i<5;i++){const x=8+i*12;g.fillRect(x,-5-i%3*3,3,3);}}
    }else if(style==='golden'){
      g.save();g.shadowColor='#ffe870';g.shadowBlur=48;line(0,len,29,'rgba(255,210,45,.38)');
      g.shadowBlur=28;line(0,len,21,'rgba(255,235,105,.65)');g.restore();
      g.shadowColor='#ffd956';g.shadowBlur=30;line(0,len,15,'#ffcf4a');g.shadowBlur=0;
      const gr=g.createLinearGradient(0,-8,0,8);gr.addColorStop(0,'#fff5b5');gr.addColorStop(.5,'#e4aa25');gr.addColorStop(1,'#8e590d');line(0,len,13,gr);
      for(let t=.79;t<.98;t+=.065){g.fillStyle='#29221b';g.beginPath();g.ellipse(len*t,0,4,6,.3,0,Math.PI*2);g.fill();}
    }else if(style==='gimlet'){
      // K2F.3: enormous double axe, no handle protruding past the head.
      // x=0 is the shooting tip; blades occupy the far end of the shaft.
      const hub=len*.84,reach=Math.max(62,Math.min(96,len*.36));
      line(0,hub,16,'#4b2c1a');line(0,hub,11,'#9e7044');line(0,hub,3,'#d6aa77');
      for(let i=0;i<8;i++){const x=len*(.07+i*.062);line(x,x+8,3,'#36251e');}
      // Dramatic upper and lower cutting wings, double the previous height.
      poly([[hub-28,-13],[hub-45,-reach*.58],[hub-39,-reach*.91],[hub-7,-reach],[hub+28,-reach*.84],[hub+34,-reach*.48],[hub+18,-13]],'#586773','#dbe7ec');
      poly([[hub-28,13],[hub-45,reach*.58],[hub-39,reach*.91],[hub-7,reach],[hub+28,reach*.84],[hub+34,reach*.48],[hub+18,13]],'#586773','#dbe7ec');
      // Wide steel bevels and bright cutting edges.
      poly([[hub-38,-reach*.83],[hub-9,-reach*.94],[hub+22,-reach*.79],[hub+13,-reach*.60],[hub-17,-reach*.65]],'#b9c9d1','#f1fafc');
      poly([[hub-38,reach*.83],[hub-9,reach*.94],[hub+22,reach*.79],[hub+13,reach*.60],[hub-17,reach*.65]],'#b9c9d1','#f1fafc');
      poly([[hub-23,-21],[hub+17,-21],[hub+24,0],[hub+17,21],[hub-23,21]],'#414d56','#b6c7d1');
      g.fillStyle='#e7bd77';for(const y of [-11,11]){g.beginPath();g.arc(hub-2,y,3.8,0,Math.PI*2);g.fill();}
    }else if(style==='bambam'){
      line(0,len,15,'#916c44');line(0,len,6,'#c6a178');
      for(let i=0;i<12;i++){const x=len*.70+i*len*.022;g.strokeStyle=i%2?'#e2d9c6':'#fff3de';g.lineWidth=9;g.beginPath();g.moveTo(x,-7);g.lineTo(x+4,7);g.stroke();}
    }
    g.restore();return;
  }
  if(style==='debugger'){
    const dx=x2-x1,dy=y2-y1,len=Math.hypot(dx,dy)||1,nx=-dy/len,ny=dx/len;
    g.save();g.shadowColor='#6aff1a';g.shadowBlur=9;g.strokeStyle='#080b08';g.lineWidth=19;g.beginPath();g.moveTo(x1,y1);g.lineTo(x2,y2);g.stroke();
    g.shadowBlur=0;g.strokeStyle='#242a23';g.lineWidth=2;g.beginPath();g.moveTo(x1,y1);g.lineTo(x2,y2);g.stroke();
    const shift=(performance.now()/150)%20;g.font='bold 12px monospace';g.textAlign='center';g.textBaseline='middle';
    for(let i=0;i<27;i++){const t=(i*14+shift+10)/len;if(t>=.96)break;const x=x1+dx*t,y=y1+dy*t;g.fillStyle=i%4===0?'#d1ff6b':'#80ff24';g.fillText((i*7+Math.floor(performance.now()/280))%3===0?'1':'0',x+nx*(i%2?3:-3),y+ny*(i%2?3:-3));}
    g.restore();return;
  }
  if(style==='vaper'){
    // H2d: keep Vaper unmistakably a lightsaber. The glowing blade occupies the
    // forward 75%; the tail 25% is a thicker black hilt with two silver bands.
    const hx=x1+(x2-x1)*.75,hy=y1+(y2-y1)*.75;
    g.shadowColor='#ff1818';g.shadowBlur=38;g.strokeStyle='rgba(255,30,30,.42)';g.lineWidth=24;g.beginPath();g.moveTo(x1,y1);g.lineTo(hx,hy);g.stroke();
    g.shadowColor='#ff1010';g.shadowBlur=25;g.strokeStyle='#ff2424';g.lineWidth=12;g.beginPath();g.moveTo(x1,y1);g.lineTo(hx,hy);g.stroke();
    g.shadowColor='#fff';g.shadowBlur=12;g.strokeStyle='#fff7f2';g.lineWidth=4;g.beginPath();g.moveTo(x1,y1);g.lineTo(hx,hy);g.stroke();
    g.shadowColor='rgba(0,0,0,.8)';g.shadowBlur=7;g.strokeStyle='#090a0c';g.lineWidth=20;g.beginPath();g.moveTo(hx,hy);g.lineTo(x2,y2);g.stroke();
    const dx=x2-x1,dy=y2-y1;
    for(const t of [.79,.94]){const cx=x1+dx*t,cy=y1+dy*t;const half=.017;g.shadowBlur=0;g.strokeStyle='#d8dde2';g.lineWidth=22;g.beginPath();g.moveTo(cx-dx*half,cy-dy*half);g.lineTo(cx+dx*half,cy+dy*half);g.stroke();g.strokeStyle='#777f88';g.lineWidth=3;g.stroke();}
    return;
  }
  if(style==='wiggles'){
    // H3: visual-only wiggly shaft. Gameplay/aiming remains on the straight cue axis.
    const dx=x2-x1,dy=y2-y1,len=Math.hypot(dx,dy)||1,ux=dx/len,uy=dy/len,nx=-uy,ny=ux;
    const conventional=.20,splitX=x1+dx*conventional,splitY=y1+dy*conventional;
    g.shadowColor='rgba(255,182,224,.30)';g.shadowBlur=6;g.strokeStyle='#f3a9d3';g.lineWidth=13;g.beginPath();g.moveTo(x1,y1);g.lineTo(splitX,splitY);g.stroke();
    g.shadowColor='rgba(255,182,224,.42)';g.shadowBlur=9;g.strokeStyle='#f3a9d3';g.lineWidth=13;g.beginPath();g.moveTo(splitX,splitY);
    const waves=5,amp=8;
    for(let i=1;i<=32;i++){const t=conventional+(1-conventional)*(i/32),bx=x1+dx*t,by=y1+dy*t,off=Math.sin((t-conventional)/(1-conventional)*Math.PI*2*waves)*amp;g.lineTo(bx+nx*off,by+ny*off);}
    g.stroke();g.shadowBlur=0;g.strokeStyle='#fff0f8';g.lineWidth=3;g.beginPath();g.moveTo(x1,y1);g.lineTo(x1+dx*.047,y1+dy*.047);g.stroke();return;
  }
  let stops;
  if(style==='blockbeard')stops=[['0','#fff4ae'],['.12','#f6ce48'],['.64','#e7a92e'],['.75','#f5cf56'],['.80','#201d19'],['.88','#e5b23b'],['.95','#24201a'],['1','#d7a128']];
  else if(style==='blackball')stops=[['0','#d8d2c7'],['.08','#2d2d30'],['.58','#111216'],['1','#030405']];
  else if(style==='mick')stops=[['0','#efe0bc'],['.08','#c9a34c'],['.13','#12274c'],['.55','#071a38'],['.82','#c9a34c'],['.86','#071a38'],['.96','#c9a34c'],['1','#07152e']];
  else if(style==='dave')stops=[['0','#ead9b5'],['.10','#9a693d'],['.55','#60391f'],['1','#342014']];
  else if(style==='simon')stops=[['0','#efe0bc'],['.12','#cba56a'],['.38','#805126'],['.42','#3d78c5'],['.47','#805126'],['.72','#3d78c5'],['.77','#6b3f20'],['1','#3d2515']];
  else if(style==='holly')stops=[['0','#eadfc5'],['.10','#6b397c'],['.36','#351b48'],['.42','#73a84c'],['.47','#351b48'],['.68','#73a84c'],['.73','#351b48'],['1','#1f102b']];
  else if(style==='sandy')stops=[['0','#f4e8c7'],['.12','#e8c65a'],['.24','#d95757'],['.36','#65a8d8'],['.48','#79b85a'],['.60','#e8c65a'],['.72','#d95757'],['.84','#65a8d8'],['1','#7a5534']];
  else if(style==='pokey')stops=[['0','#fffdf6'],['.10','#ffffff'],['.47','#e2e3e5'],['.485','#08090a'],['.515','#171719'],['.53','#f16c70'],['.72','#d9202c'],['.93','#b70e20'],['1','#ef4b55']];
  else if(style==='izzy')stops=[['0','#ffffff'],['.12','#e7e9e9'],['.35','#fffefa'],['.62','#d9dfe2'],['.85','#fff'],['1','#c8d1d4']];
  else if(style==='shelle')stops=[['0','#fffdf4'],['.18','#eee9e0'],['.45','#fff'],['.70','#ddd8d2'],['1','#faf8f0']];
  else if(style==='graham')stops=[['0','#ddd'],['.14','#aaa'],['.62','#777'],['1','#555']];
  else if(style==='papa_surf')stops=[['0','#e9f7ff'],['.12','#42a9ef'],['.62','#0876c9'],['1','#034d8d']];
  else stops=[['0','#efe0bc'],['.12','#cba56a'],['.7','#805126'],['1','#3d2515']];
  if(style==='papa_surf'){
    // H2e: retain the now-visible ocean-blue aura at roughly half H2d intensity.
    g.shadowColor='rgba(50,170,255,.48)';g.shadowBlur=13;g.strokeStyle='rgba(45,170,255,.26)';g.lineWidth=20;g.beginPath();g.moveTo(x1,y1);g.lineTo(x2,y2);g.stroke();
    g.shadowColor='rgba(110,215,255,.46)';g.shadowBlur=8;g.strokeStyle='rgba(75,190,255,.31)';g.lineWidth=14;g.beginPath();g.moveTo(x1,y1);g.lineTo(x2,y2);g.stroke();
  }
  const grad=g.createLinearGradient(x1,y1,x2,y2);for(const [at,c] of stops)grad.addColorStop(Number(at),c);
  g.shadowColor=style==='papa_surf'?'rgba(70,185,255,.85)':'rgba(0,0,0,.45)';g.shadowBlur=style==='papa_surf'?12:5;g.shadowBlur=5;g.strokeStyle=grad;g.lineWidth=12;g.beginPath();g.moveTo(x1,y1);g.lineTo(x2,y2);g.stroke();
  g.shadowBlur=0;g.strokeStyle=style==='blackball'?'#bdb8ad':'#f4ead0';g.lineWidth=3;g.beginPath();g.moveTo(x1,y1);g.lineTo(x1+(x2-x1)*.047, y1+(y2-y1)*.047);g.stroke();
}
function drawCueCosmeticDetails(g,style,buttX,buttY,now=performance.now()){
  if(style==='sandy'){
    // H2c: larger toy pinwheel, shared by gameplay and Cosmetics preview.
    const r=22,rot=now/520;g.save();g.translate(buttX,buttY);g.rotate(rot);g.shadowColor='rgba(0,0,0,.45)';g.shadowBlur=4;
    const pinCols=['#e8c65a','#d95757','#65a8d8','#79b85a'];
    for(let i=0;i<4;i++){g.rotate(Math.PI/2);g.fillStyle=pinCols[i];g.beginPath();g.moveTo(0,0);g.quadraticCurveTo(r*.35,-r*.9,r,0);g.quadraticCurveTo(r*.42,r*.18,0,0);g.fill();}
    g.shadowBlur=0;g.fillStyle='#f4e8c7';g.beginPath();g.arc(0,0,4,0,Math.PI*2);g.fill();g.restore();
  }else if(style==='shelle'){
    // H2c: slightly larger luminous pearl.
    const r=11;g.save();g.shadowColor='rgba(255,250,225,.98)';g.shadowBlur=20;g.fillStyle='#fffdf1';g.beginPath();g.arc(buttX,buttY,r+1,0,Math.PI*2);g.fill();
    g.shadowBlur=0;const pg=g.createRadialGradient(buttX-3.5,buttY-3.5,1,buttX,buttY,r);pg.addColorStop(0,'#ffffff');pg.addColorStop(.45,'#fff9df');pg.addColorStop(1,'#d8d3c8');g.fillStyle=pg;g.beginPath();g.arc(buttX,buttY,r,0,Math.PI*2);g.fill();g.restore();
  }
}
function drawCueStick(now=performance.now()){
  if(!state||state.frameOver||cue().potted||placementMode!=='none'||pendingChoice)return;
  let a=angle,visible=!moving,cueStyle=cueStyleForShooter(),travel=0,anchorX=cue().x,anchorY=cue().y,alpha=1;
  if(cueStrikeVisual){
    const age=now-cueStrikeVisual.started;
    if(age<420){visible=true;a=cueStrikeVisual.angle;cueStyle=cueStrikeVisual.style||'classic';anchorX=cueStrikeVisual.x;anchorY=cueStrikeVisual.y;if(age<95)travel=38*(age/95);else{const q=(age-95)/325;travel=38-150*q;alpha=1-Math.max(0,(q-.42)/.58)*.88;}}
    else cueStrikeVisual=null;
  }
  if(!visible)return;
  const dx=Math.cos(a),dy=Math.sin(a),backX=-dx,backY=-dy,tipGap=ballR+10-travel,tipX=anchorX+backX*tipGap,tipY=anchorY+backY*tipGap,length=360,buttX=tipX+backX*length,buttY=tipY+backY*length;
  ctx.save();ctx.globalAlpha=alpha;ctx.lineCap='round';
  strokeCueLine(tipX,tipY,buttX,buttY,cueStyle,ctx);drawCueCosmeticDetails(ctx,cueStyle,buttX,buttY,now);ctx.restore();
}
function renderCueCosmeticPreview(canvasEl,style,now=performance.now()){
  const g=canvasEl.getContext('2d'),w=420,h=74;canvasEl.width=w;canvasEl.height=h;g.clearRect(0,0,w,h);if(window.SeamenChapter4.chapter.mainPirates.includes(style)&&!pirateDefeated(style))return;g.save();
  // Same renderer, dimensions and cosmetic details as the in-game cue; only placement is catalogue-specific.
  const tipX=28,tipY=h/2,buttX=388,buttY=h/2;
  strokeCueLine(tipX,tipY,buttX,buttY,style,g);drawCueCosmeticDetails(g,style,buttX,buttY,now);g.restore();
}
function refreshCueCosmeticPreviews(now=performance.now()){
  document.querySelectorAll('canvas[data-cue-render]').forEach(c=>renderCueCosmeticPreview(c,c.dataset.cueRender||'classic',now));
}

function drawBallPolish(b){
  const r=ballR,shine=ctx.createRadialGradient(b.x-r*.38,b.y-r*.42,r*.05,b.x,b.y,r*1.05);
  shine.addColorStop(0,'rgba(255,255,255,.72)');shine.addColorStop(.16,'rgba(255,255,255,.22)');shine.addColorStop(.48,'rgba(255,255,255,0)');shine.addColorStop(1,'rgba(0,0,0,.20)');
  ctx.fillStyle=shine;ctx.beginPath();ctx.arc(b.x,b.y,r,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='rgba(255,255,255,.7)';ctx.beginPath();ctx.ellipse(b.x-r*.31,b.y-r*.36,r*.12,r*.065,-.6,0,Math.PI*2);ctx.fill();
  if(b.type==='white'){
    // Give the cue ball the same grounded edge/depth as the coloured balls without making it grey.
    ctx.save();ctx.strokeStyle='rgba(18,24,22,.48)';ctx.lineWidth=2.4;ctx.shadowColor='rgba(0,0,0,.34)';ctx.shadowBlur=3;ctx.beginPath();ctx.arc(b.x,b.y,r-.8,0,Math.PI*2);ctx.stroke();ctx.restore();
  }
}
function draw(now=performance.now()){const pal=tableThemePalette();ctx.clearRect(0,0,W,H);ctx.fillStyle=pal.rail;ctx.fillRect(0,0,W,H);ctx.fillStyle=pal.cloth;ctx.fillRect(L,T,R-L,B-T);if(pal.ambience){ctx.fillStyle=pal.ambience;ctx.fillRect(L,T,R-L,B-T);}drawCushionShadows();drawChapter3RailFinish(now);drawTableAtmosphere(now,pal);drawIzzyHairs();ctx.strokeStyle=pal.edge;ctx.lineWidth=8;ctx.strokeRect(L,T,R-L,B-T);ctx.strokeStyle='#d8d0b755';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(BAULK_X,T);ctx.lineTo(BAULK_X,B);ctx.stroke();for(const p of pockets)drawPocket(p);guide();for(const b of balls){if(b.potted)continue;ctx.save();if(activeTableTheme()==='vaper'){ctx.shadowColor='#17aaff';ctx.shadowBlur=18;ctx.fillStyle='rgba(30,156,255,.18)';ctx.beginPath();ctx.arc(b.x,b.y,ballR+5,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;}ctx.globalAlpha=1;ctx.fillStyle=colors[b.type];ctx.beginPath();ctx.arc(b.x,b.y,ballR,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#0007';ctx.lineWidth=2;ctx.stroke();drawBallPolish(b);if(b.type==='black'){ctx.fillStyle='#eee';ctx.font='bold 15px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('8',b.x,b.y)}ctx.restore()}drawPotFadeVisuals(now);drawLegalPotSparkles(now);drawSouronionShotEmbers(now);drawCueStick(now);}
let gamePaused=false;
function loop(now){
  // Browsers already throttle requestAnimationFrame in the background, but explicitly
  // avoid canvas work while hidden. Resetting `last` on return prevents a backgrounded
  // tab/PWA from feeding a stale elapsed time into the physics engine.
  if(document.hidden){last=now;requestAnimationFrame(loop);return;}
  let dt=Math.min((now-last)/1000,.025);last=now;
  if(!gamePaused&&moving){step(dt);if(allStopped())endShot()}
  draw();k4UpdateEffects(now);updateVaperRoomFog(now);requestAnimationFrame(loop)
}
// Lifecycle hardening: backgrounding/locking a phone must not let an AI
// decision or watchdog complete behind the player's back. This is a temporary
// lifecycle suspension only; it does not open the Game menu or alter the frame.
document.addEventListener('visibilitychange',()=>{
  if(document.hidden){
    clearTimeout(aiTimer);clearTimeout(aiWatchdogTimer);aiTimer=aiWatchdogTimer=null;
    return;
  }
  last=performance.now();
  // Android/WebView can defer an audio element's ended/play work while the app is
  // backgrounded. Reconcile the soundtrack after the page is visible again so a
  // match playlist cannot remain silent after its previous track finished off-screen.
  setTimeout(reconcileMusicAfterResume,100);
  if(gameApp&&!gameApp.hidden&&state&&!state.frameOver&&!gamePaused){setTimeout(maybeScheduleAI,80);}
});
// V0.14.6: the former New Frame control now opens the in-match Game menu.
document.getElementById('rack').onclick=()=>restartCurrentGame(state?.breaker||1);document.getElementById('clear').onclick=()=>{balls.slice(1).forEach(b=>{if(b.type!=='black')b.potted=true});updateHUD();};document.getElementById('soft').onclick=()=>{powerEl.value=25;powerText.textContent='25%'};document.getElementById('hard').onclick=()=>{powerEl.value=100;powerText.textContent='100%'};
document.getElementById('toggleAngleGuide').onclick=e=>{devAngleGuide=!devAngleGuide;saveAimGuidePreference();syncAimGuideSwitch();e.currentTarget.textContent=`Toggle guide Ian angle: ${devAngleGuide?'ON':'OFF'}`;};
// Candidate C hidden QA shortcuts: six rapid presses within ~2 seconds.
const hiddenQaSequences={t:{count:0,last:0},y:{count:0,last:0},u:{count:0,last:0}};
function hiddenQaTypingTarget(target){const el=target instanceof Element?target:null;return !!el&&(el.matches('input,textarea,[contenteditable]')||!!el.closest('input,textarea,[contenteditable]'));}
function hiddenQaHit(key){const now=performance.now(),seq=hiddenQaSequences[key];if(now-seq.last>2000)seq.count=0;seq.last=now;seq.count++;if(seq.count<6)return false;seq.count=0;return true;}
document.addEventListener('keydown',e=>{if(theatreInputBlocked()||!IS_DEVELOPMENT_BUILD||e.ctrlKey||e.metaKey||e.altKey||e.repeat||hiddenQaTypingTarget(e.target))return;const k=e.key.toLowerCase();if(k==='t'&&hiddenQaHit('t')){if(gameMode!=='pirate'||!gameApp||gameApp.hidden||!state||state.frameOver)return;e.preventDefault();devForcedWin=true;try{finishFrame(1,`QA: ${pname(1)} awarded the frame. ${pname(1)} beat off ${pname(2)}!`,`QA WIN — ${pname(1)} wins`);}finally{devForcedWin=false;}return;}if(k==='y'&&hiddenQaHit('y')){const rosterVisible=playersModal&&!playersModal.hidden&&piratePlaceholder&&!piratePlaceholder.hidden;if(!rosterVisible)return;e.preventDefault();setUnlockedPirateLevel(5);refreshPirateButtons();msg.textContent='QA: Captain Blackball unlocked for roster testing.';return;}if(k==='u'&&hiddenQaHit('u')){e.preventDefault();audioReady();pendingPirateStart={level:7,pirateId:'chapter2_boss',playerName:piratePlayerName?.value.trim()||'Player 1'};if(pirateIntroModal)pirateIntroModal.hidden=true;if(pirateProfileModal)pirateProfileModal.hidden=true;if(playersModal)playersModal.hidden=true;if(titleScreen)titleScreen.hidden=true;showScene('chapter_2_boss_reveal',()=>{applyChapter2BossIdentity(true);renderPirateRoster();beginPendingPirateMatch(true);});}});

// K1: repeatable developer-only Chapter 3 fresh-arrival simulation.
// Does not touch earlier chapter records, career statistics, or existing cosmetic unlocks.
// K2F.9: one-key development-only access to both later chapter rosters.
// Does NOT award wins, trophies, cues, or chapter completion.
function devUnlockChapterTestAccess(){
 if(!IS_DEVELOPMENT_BUILD)return;
 const two=chapterState('chapter_2'),three=chapterState('chapter_3');
 two.unlocked=true;two.introSeen=true;three.unlocked=true;
 // The Chapter 2 boss identity is a story reveal, not a reward for this shortcut.
 // Leave existing reveal and victory flags unchanged.
 // Main-campaign progression is bypassed only in the current development session.
 devChapterTestAccess=true;
 // Do not save this bypass: reload returns to the actual campaign progress.
 if(gameApp)gameApp.hidden=true;
 if(pirateIntroModal)pirateIntroModal.hidden=true;
 if(pirateProfileModal)pirateProfileModal.hidden=true;
 if(playersModal)playersModal.hidden=false;
 if(modeMenu)modeMenu.hidden=true;
 if(playersForm)playersForm.hidden=true;
 if(piratePlaceholder)piratePlaceholder.hidden=false;
 if(titleScreen)titleScreen.hidden=true;
 renderPirateRoster();refreshPirateButtons();
 if(msg)msg.textContent='DEV: Chapters 2 and 3 unlocked for QA (no victories or rewards awarded).';
}
let devChapterTestAccess=false;
document.addEventListener('keydown',e=>{if(theatreInputBlocked()||!IS_DEVELOPMENT_BUILD)return;if(e.ctrlKey||e.metaKey||e.altKey)return;const tag=(e.target?.tagName||'').toLowerCase();if(tag==='input'||tag==='textarea'||tag==='select'||tag==='button')return;const k=e.key.toLowerCase();if(schoolSession&&['h','j','i'].includes(k))return;if(k==='i'){e.preventDefault();devUnlockChapterTestAccess();return;}if(k==='a'){e.preventDefault();nudgeAngle(-.1);}else if(k==='d'){e.preventDefault();nudgeAngle(.1);}else if(k==='w'){e.preventDefault();nudgePower(5);}else if(k==='s'){e.preventDefault();nudgePower(-5);}else if(k==='g'){e.preventDefault();devAngleGuide=!devAngleGuide;saveAimGuidePreference();syncAimGuideSwitch();const btn=document.getElementById('toggleAngleGuide');if(btn)btn.textContent=`Toggle guide Ian angle: ${devAngleGuide?'ON':'OFF'}`;}else if(k==='e'){e.preventDefault();if(!shootBtn.disabled&&!moving&&!state.frameOver&&!pendingChoice&&placementMode==='none')beginShot();}else if(k==='h'){e.preventDefault();devScenariosUnlocked=true;nightmareScenario.disabled=false;cannonScenario.disabled=false;if(fiveFrameScenario)fiveFrameScenario.disabled=false;nightmareScenario.querySelector('small').textContent='Captain Blackball • 3 reds vs 6-yellow blockade';cannonScenario.querySelector('small').textContent='Captain Blackball • oversized 28-ball rack';if(fiveFrameScenario)fiveFrameScenario.querySelector('small').textContent='Captain Blackball vs Darth Vaper • 5 automatic frames';msg.textContent='DEV: Test scenarios unlocked for this session.';}else if(k==='j'){e.preventDefault();devUnlockAllPirates();}else if(k==='r'&&state?.frameOver&&!winModal.hidden){e.preventDefault();playAgain.click();}});
document.getElementById('pickupCue').onclick=()=>{if(moving||state.frameOver||pendingChoice)return;restoreCue('anywhere');msg.textContent=`DEV: ${pname(state.player)} may tap or drag anywhere on the table to reposition the cue ball, then confirm.`;updateHUD();};
document.getElementById('unlockPirates').onclick=()=>{devUnlockAllPirates();};
document.getElementById('unlockScenarios').onclick=()=>{devScenariosUnlocked=true;nightmareScenario.disabled=false;cannonScenario.disabled=false;if(fiveFrameScenario)fiveFrameScenario.disabled=false;nightmareScenario.querySelector('small').textContent='Captain Blackball • 3 reds vs 6-yellow blockade';cannonScenario.querySelector('small').textContent='Captain Blackball • oversized 28-ball rack';if(fiveFrameScenario)fiveFrameScenario.querySelector('small').textContent='Captain Blackball vs Darth Vaper • 5 automatic frames';msg.textContent='DEV: Test scenarios unlocked for this session.';};
const triggerBlackballShowdown=document.getElementById('triggerBlackballShowdown');
if(triggerBlackballShowdown)triggerBlackballShowdown.onclick=()=>{
  audioReady();
  pendingPirateStart={level:5,playerName:piratePlayerName?.value.trim()||'Player 1'};
  if(pirateProfileModal)pirateProfileModal.hidden=true;
  if(playersModal)playersModal.hidden=true;
  // DEV preview only: replay the first-showdown presentation without changing the saved intro/ending flags.
  forcedTableTheme='privates';
  showBlackballStory('intro',()=>beginPendingPirateMatch(true));
};
confirmCue.onclick=()=>{if(placementMode==='none'||moving||state.frameOver||pendingChoice)return;placementMode='none';draggingCue=false;shootBtn.disabled=false;confirmCue.hidden=true;if(cuePlacementControls)cuePlacementControls.hidden=true;tableWrap?.classList.remove('placing-cue');msg.textContent=state.breakShot?'Cue ball placed — aim your break, choose power, then play the shot.':`Cue ball placed — ${pname(state.player)}, aim and play your shot.`;};
const clearPlayLogButton=document.getElementById('clearPlayLog');if(clearPlayLogButton)clearPlayLogButton.onclick=()=>{playHistory=[];shotNumber=0;renderPlayLog();};
function aiLegalTargets(){
  const on=onType(aiPlayer);
  return balls.filter(b=>!b.potted&&b.type!=='white'&&(on==='open'?(b.type==='red'||b.type==='yellow'):b.type===on));
}
function aiPlaceCue(){
  if(placementMode==='none')return null;
  const c=cue(),profile=aiExecutionProfile(1),original={x:c.x,y:c.y};
  // Levels 4-5 actively use ball in hand: sample legal positions and keep the one
  // offering the best direct pot. Lower levels retain the simple placement behaviour.
  if(aiSkillLevel()>=4&&!state.breakShot&&placementMode==='anywhere'){
    const candidates=[[c.x,c.y]];
    for(let ix=1;ix<=7;ix++)for(let iy=1;iy<=5;iy++)candidates.push([L+ballR+(PLAY_W-2*ballR)*ix/8,T+ballR+(PLAY_H-2*ballR)*iy/6]);
    let best=null;
    for(const [x,y] of candidates){
      if(!validCuePosition(x,y))continue;c.x=x;c.y=y;
      const pots=aiFindDirectPots();
      if(pots.length&&(!best||pots[0].score<best.plan.score))best={x,y,plan:{...pots[0]}};
    }
    if(best){c.x=best.x;c.y=best.y;placementMode='none';draggingCue=false;updatePlacementUI();return{smart:true,plan:best.plan,x:best.x,y:best.y};}
  }
  c.x=original.x;c.y=original.y;
  const candidates=[[c.x,c.y],[L+PLAY_W*.68,H/2],[L+PLAY_W*.72,T+PLAY_H*.35],[L+PLAY_W*.72,T+PLAY_H*.65]];
  for(const [x,y] of candidates){if(validCuePosition(x,y)){c.x=x;c.y=y;break;}}
  placementMode='none';draggingCue=false;updatePlacementUI();return{smart:false,x:c.x,y:c.y};
}
function aiSegmentClear(x1,y1,x2,y2,ignoreA=null,ignoreB=null,clearance=ballR*2.04){
  const vx=x2-x1,vy=y2-y1,len2=vx*vx+vy*vy;
  if(len2<1)return false;
  for(const b of balls){
    if(b.potted||b===ignoreA||b===ignoreB)continue;
    let t=((b.x-x1)*vx+(b.y-y1)*vy)/len2;t=clamp(t,0,1);
    const px=x1+vx*t,py=y1+vy*t;
    if(Math.hypot(b.x-px,b.y-py)<clearance)return false;
  }
  return true;
}
function aiDirectPreflight(plan){
  // V0.6.3: reconcile the attack planner with the actual straight-line first-contact geometry.
  // This does not simulate the shot or alter physics; it only rejects a theoretical pot when
  // the intended target is not actually the first ball on the cue-ball ray, or when that ray
  // enters a pocket mouth before reaching the planned ghost-ball contact point.
  const c=cue(),first=aiRayFirstBall(plan.deg);
  if(first!==plan.target)return {ok:false,reason:'FIRST CONTACT',first};
  const rad=plan.deg*Math.PI/180,dx=Math.cos(rad),dy=Math.sin(rad);
  const contactDist=Math.hypot(plan.gx-c.x,plan.gy-c.y);
  for(let pi=0;pi<pockets.length;pi++){
    const [px,py]=pockets[pi],vx=px-c.x,vy=py-c.y,t=vx*dx+vy*dy;
    if(t<=0||t>=contactDist-ballR*.35)continue;
    const miss=Math.hypot(vx-dx*t,vy-dy*t);
    // Use a conservative mouth radius for Captain+; if the centre-line passes this close to
    // a pocket before object-ball contact, the route is too fragile to call a safe direct pot.
    if(miss<pocketR+ballR*.30)return {ok:false,reason:'CUE POCKET PATH',pocket:pi,margin:miss};
  }
  return {ok:true,first};
}

// V0.6.3: dry-run the planned shot through a silent copy of the real table physics.
// This lets Captain/Vaper validate post-contact cue-ball safety (including cushion rebounds)
// and catches geometry plans whose theoretical route disagrees with the actual engine.
function aiDryRunShot(deg,power,maxSeconds=9,frameDt=1/60,contactOverride=null){
  const k4Planning=(k4IsMatch()||contactOverride!==null)&&state.player===aiPlayer;
  if(k4Planning&&currentPirateId==='vile_hedgehog')power=66;
  const sim=balls.map(b=>({id:b.id,type:b.type,x:b.x,y:b.y,vx:0,vy:0,potted:b.potted}));
  const c=sim.find(b=>b.type==='white');if(!c||c.potted)return{first:null,firstId:null,cuePotted:true,pots:[],potIds:[]};
  const p=power/100,speed=150+5800*Math.pow(p,1.35),rad=deg*Math.PI/180;c.vx=Math.cos(rad)*speed;c.vy=Math.sin(rad)*speed;
  if(k4Planning)SeamenSpinPhysics.strike(c,contactOverride||k4AIContact(deg),rad,speed);
  let first=null,firstId=null;const pots=[],potIds=[];
  const pocketLocal=b=>{for(const q of pockets){const dx=b.x-q[0],dy=b.y-q[1];if(dx*dx+dy*dy<pocketR*pocketR){b.potted=true;b.vx=b.vy=0;pots.push(b.type);potIds.push(b.id);return true;}}const mouth=pocketR+ballR*.55;if((b.y<T-ballR*.12||b.y>B+ballR*.12)&&(Math.abs(b.x-L)<mouth||Math.abs(b.x-CENTRE_X)<mouth||Math.abs(b.x-R)<mouth)){b.potted=true;b.vx=b.vy=0;pots.push(b.type);potIds.push(b.id);return true;}if((b.x<L-ballR*.12||b.x>R+ballR*.12)&&(Math.abs(b.y-T)<mouth||Math.abs(b.y-B)<mouth)){b.potted=true;b.vx=b.vy=0;pots.push(b.type);potIds.push(b.id);return true;}return false;};
  const wallsLocal=b=>{const nearLeft=Math.abs(b.x-L)<pocketR*1.3,nearRight=Math.abs(b.x-R)<pocketR*1.3,nearMiddle=Math.abs(b.x-CENTRE_X)<pocketR*1.35;if(b.x-ballR<L&&Math.abs(b.y-T)>pocketR*1.2&&Math.abs(b.y-B)>pocketR*1.2){b.x=L+ballR;b.vx=Math.abs(b.vx)*.91;if(k4Planning)SeamenSpinPhysics.cushion(b,1,0)}if(b.x+ballR>R&&Math.abs(b.y-T)>pocketR*1.2&&Math.abs(b.y-B)>pocketR*1.2){b.x=R-ballR;b.vx=-Math.abs(b.vx)*.91;if(k4Planning)SeamenSpinPhysics.cushion(b,-1,0)}if(b.y-ballR<T&&!nearLeft&&!nearRight&&!nearMiddle){b.y=T+ballR;b.vy=Math.abs(b.vy)*.91;if(k4Planning)SeamenSpinPhysics.cushion(b,0,1)}if(b.y+ballR>B&&!nearLeft&&!nearRight&&!nearMiddle){b.y=B-ballR;b.vy=-Math.abs(b.vy)*.91;if(k4Planning)SeamenSpinPhysics.cushion(b,0,-1)}const escaped=b.x<L-ballR*1.25||b.x>R+ballR*1.25||b.y<T-ballR*1.25||b.y>B+ballR*1.25;if(escaped){if(pocketLocal(b))return;b.x=clamp(b.x,L+ballR,R-ballR);b.y=clamp(b.y,T+ballR,B-ballR);if(b.x<=L+ballR+.01)b.vx=Math.abs(b.vx)*.91;if(b.x>=R-ballR-.01)b.vx=-Math.abs(b.vx)*.91;if(b.y<=T+ballR+.01)b.vy=Math.abs(b.vy)*.91;if(b.y>=B-ballR-.01)b.vy=-Math.abs(b.vy)*.91;}};
  const collideLocal=(a,b)=>{let dx=b.x-a.x,dy=b.y-a.y,d2=dx*dx+dy*dy,min=ballR*2;if(d2>=min*min||d2===0)return;let d=Math.sqrt(d2),nx=dx/d,ny=dy/d,over=min-d;a.x-=nx*over/2;a.y-=ny*over/2;b.x+=nx*over/2;b.y+=ny*over/2;if(!first){if(a.type==='white'&&b.type!=='white'&&!b.potted){first=b.type;firstId=b.id}else if(b.type==='white'&&a.type!=='white'&&!a.potted){first=a.type;firstId=a.id}}let rvx=b.vx-a.vx,rvy=b.vy-a.vy,sep=rvx*nx+rvy*ny;if(sep>=0)return;const j=-(1+.965)*sep/2,ix=j*nx,iy=j*ny;a.vx-=ix;a.vy-=iy;b.vx+=ix;b.vy+=iy;if(k4Planning){SeamenSpinPhysics.collide(a);SeamenSpinPhysics.collide(b);}};
  const dt=frameDt,steps=Math.ceil(maxSeconds/dt);for(let z=0;z<steps;z++){const maxSpeed=Math.max(...sim.filter(b=>!b.potted).map(b=>Math.hypot(b.vx,b.vy)),0);if(maxSpeed<5&&z>20&&!(k4Planning&&sim.some(b=>!b.potted&&b.cueSpin?.engaged&&Math.hypot(b.cueSpin.x,b.cueSpin.y)>5)))break;const sub=Math.max(4,Math.min(12,Math.ceil(maxSpeed*dt/(ballR*.55)))),sdt=dt/sub;for(let k=0;k<sub;k++){for(const b of sim){if(b.potted)continue;b.x+=b.vx*sdt;b.y+=b.vy*sdt;if(pocketLocal(b))continue;wallsLocal(b);if(k4Planning)SeamenSpinPhysics.advance(b,sdt);const drag=Math.pow(.985,sdt*60);b.vx*=drag;b.vy*=drag;if(Math.hypot(b.vx,b.vy)<5&&!(k4Planning&&b.cueSpin?.engaged&&Math.hypot(b.cueSpin.x,b.cueSpin.y)>5))b.vx=b.vy=0;}for(let i=0;i<sim.length;i++)if(!sim[i].potted)for(let j=i+1;j<sim.length;j++)if(!sim[j].potted)collideLocal(sim[i],sim[j]);}}
  return{first,firstId,cuePotted:sim.find(b=>b.type==='white')?.potted||false,pots,potIds,...(k4Planning?{cuePosition:{x:c.x,y:c.y}}:{})};
}
// V0.7.5: Darth Vaper is 'Perfect', so his confidence labels must describe the actual
// physics result, not merely a legal first contact.  A direct attack counts as successful only
// when the intended object ball is actually potted; a combination must pot its intended second ball.
function aiForecastPotsIntended(test,plan){
  if(!test||!plan)return false;
  if(plan.kind==='DIRECT POT')return test.potIds?.includes(plan.target?.id);
  if(plan.kind==='COMBINATION POT')return test.potIds?.includes(plan.secondary?.id);
  return true;
}
// V0.7.10: dedicated black-ball win validator.  Once a player is actually on black,
// a direct pot is judged as a frame-winning shot rather than an ordinary attack.  The black
// must be potted, the intended black must be first contact, and the cue ball must survive at
// both physics cadences plus narrow aim/power probes.  This specifically guards against the
// late-frame black+white losses exposed by the five-frame QA run.
function aiBlackWinConfidence(candidate){
  if(!candidate||onType(state.player)!=='black'||candidate.target?.type!=='black')return 0;
  const probes=[[0,0,1/60],[0,0,1/120],[-.10,0,1/60],[.10,0,1/60],[0,-1,1/60],[0,1,1/60]];
  let passed=0;
  for(const [da,dp,dt] of probes){
    const test=aiDryRunShot(candidate.deg+da,clamp(candidate.power+dp,5,100),9,dt);
    if(test.first==='black'&&test.firstId===candidate.target.id&&!test.cuePotted&&test.potIds?.includes(candidate.target.id))passed++;
  }
  return passed/probes.length;
}

// V0.7.11: Vaper may take a high-confidence frame ball without requiring a perfect 6/6.
// FRAME KILL still requires every probe to make the correct first contact and keep the cue ball alive;
// the 5/6 threshold therefore permits a plausible miss, never a forecast foul/black+white loss.
function aiVaperFrameKillSafe(candidate){
  if(aiSkillLevel()!==7||!candidate||candidate.target?.type!=='black')return false;
  const probes=[[0,0,1/60],[0,0,1/120],[-.10,0,1/60],[.10,0,1/60],[0,-1,1/60],[0,1,1/60]];
  return probes.every(([da,dp,dt])=>{
    const test=aiDryRunShot(candidate.deg+da,clamp(candidate.power+dp,5,100),9,dt);
    return test.first==='black'&&test.firstId===candidate.target.id&&!test.cuePotted;
  });
}

function aiVaperDirectConfidence(candidate){
  if(aiSkillLevel()!==7||!candidate)return 0;
  const probes=[[0,0,1/60],[0,0,1/120],[-.10,0,1/60],[.10,0,1/60],[0,-1,1/60],[0,1,1/60]];
  let passed=0;
  const plan={...candidate,kind:'DIRECT POT'};
  for(const [da,dp,dt] of probes){
    const test=aiDryRunShot(candidate.deg+da,clamp(candidate.power+dp,5,100),9,dt);
    if(test.first===candidate.target?.type&&test.firstId===candidate.target?.id&&!test.cuePotted&&aiForecastPotsIntended(test,plan))passed++;
  }
  return passed/probes.length;
}

function aiValidateFinalPlan(plan){
  // H3b: Wiggles' finesse is judged at his real worm-strength ceiling, not at a stronger planned shot.
  // This keeps cushion forecasts honest while preserving the absolute 30% cap (including breaks).
  if(gameMode==='pirate'&&currentPirateId==='chapter2_boss'&&plan)plan.power=Math.min(30,plan.power);
  if(state.breakShot)return plan;
  // V0.7.4: high-level AI must notice a foreseeable early-black loss before committing.
  // This is not clairvoyance: it uses the same silent physics forecast already used for QA.
  if(aiSkillLevel()>=4&&onType(state.player)!=='black'){
    const blackTests=[aiDryRunShot(plan.deg,plan.power,9,1/60),aiDryRunShot(plan.deg,plan.power,9,1/120)];
    if(blackTests.some(test=>test.pots.includes('black'))){plan.blackLossRisk=true;plan.physicsSafety='REJECT: BLACK LOSS RISK — forecast pots black before colours are cleared';return null;}
  }
  if(aiSkillLevel()<5)return plan;
  // V0.6.5: validate against both a normal 60 Hz browser frame and the finer 120 Hz dry-run.
  // The live game advances using requestAnimationFrame, so a route that is safe only at one
  // integration cadence is too fragile for Captain/Vaper to trust.
  const tests=[aiDryRunShot(plan.deg,plan.power,9,1/60),aiDryRunShot(plan.deg,plan.power,9,1/120)];
  const contactOK=tests.every(test=>test.first===plan.target?.type&&test.firstId===plan.target?.id);
  const cueSafe=tests.every(test=>!test.cuePotted);
  plan.physicsForecast=tests[0];
  const isBlack=plan.target?.type==='black';
  // Small aim/power probes now apply to every Captain/Vaper attack, not only the final black.
  // This is deliberately narrow: it catches pocket-mouth edge cases without making the AI
  // abandon ordinary attacking pool simply because a wildly different shot would be unsafe.
  const vaperAttack=aiSkillLevel()===7&&(plan.kind==='DIRECT POT'||plan.kind==='COMBINATION POT');
  const intendedPotOK=!vaperAttack||tests.every(test=>aiForecastPotsIntended(test,plan));
  let robust=contactOK&&cueSafe&&intendedPotOK;
  // V0.7.7: Darth Vaper must not talk himself out of a sound final-colour pot merely
  // because one of the deliberately harsh +/-0.12deg robustness probes misses. If the
  // actual intended shot pots his final colour at BOTH physics cadences, hits the correct
  // ball first and keeps the white up, protect that attack from the later safety hard-veto.
  // Premature-black risk is still rejected above, so this is not a rules/physics cheat.
  const vaperGroup=state.groups[state.player];
  const vaperFinalColour=aiSkillLevel()===7&&plan.kind==='DIRECT POT'&&vaperGroup&&remaining(vaperGroup)===1&&plan.target?.type===vaperGroup;
  const vaperFinalBasePass=vaperFinalColour&&contactOK&&cueSafe&&intendedPotOK;
  if(robust){
    for(const [da,dp] of [[-.12,0],[.12,0],[0,-1],[0,1]]){
      const probe60=aiDryRunShot(plan.deg+da,clamp(plan.power+dp,5,100),9,1/60);
      const probe120=aiDryRunShot(plan.deg+da,clamp(plan.power+dp,5,100),9,1/120);
      const probePotOK=!vaperAttack||(aiForecastPotsIntended(probe60,plan)&&aiForecastPotsIntended(probe120,plan));
      if(probe60.first!==plan.target?.type||probe60.firstId!==plan.target?.id||probe60.cuePotted||probe120.first!==plan.target?.type||probe120.firstId!==plan.target?.id||probe120.cuePotted||!probePotOK){robust=false;break;}
    }
  }
  if(robust){plan.physicsSafety=isBlack?'PASS (black robustness checked)':'PASS (robustness checked)';return plan;}
  if(plan.vaperFrameKill&&isBlack&&aiVaperFrameKillSafe(plan)&&aiBlackWinConfidence(plan)>=5/6){
    plan.physicsSafety='PASS (FRAME KILL: safe black contact/cue survival across probes; 5/6+ pot confidence)';
    plan.personalityInfluence=`BLACK BALL INTELLIGENCE • FRAME KILL • ${Math.round(aiBlackWinConfidence(plan)*100)}% probe confidence • Vaper aggression override`;
    return plan;
  }
  if(vaperFinalBasePass){
    plan.finalColourOverride=true;
    plan.physicsSafety='PASS (final-colour direct pot protected; base physics reproduced at 60/120 Hz)';
    plan.personalityInfluence='ENDGAME OVERRIDE: FINAL COLOUR • direct pot protected from safety veto';
    return plan;
  }
  // Captain's tiny execution error must never knowingly turn a sound intended route into an illegal one.
  if(plan.intendedDeg!=null&&Math.abs(plan.deg-plan.intendedDeg)>.0001){
    const retry60=aiDryRunShot(plan.intendedDeg,plan.power,9,1/60),retry120=aiDryRunShot(plan.intendedDeg,plan.power,9,1/120);
    if(retry60.first===plan.target?.type&&retry60.firstId===plan.target?.id&&!retry60.cuePotted&&retry120.first===plan.target?.type&&retry120.firstId===plan.target?.id&&!retry120.cuePotted){plan.deg=plan.intendedDeg;plan.error=0;plan.physicsForecast=retry60;plan.physicsSafety='PASS (aim error suppressed)';return plan;}
  }
  const badContact=tests.find(test=>test.first!==plan.target?.type||test.firstId!==plan.target?.id);
  plan.physicsSafety=`REJECT: ${badContact?'predicted first contact '+String(badContact.first||'NONE').toUpperCase()+(badContact.firstId!=null?' #'+badContact.firstId:''):!cueSafe?'predicted cue-ball in-off':vaperAttack&&!intendedPotOK?'intended pot not reproduced by physics forecast':'fragile cue-ball/contact route'}`;return null;
}

function aiFindDirectPots(){
  const c=cue(),plans=[];
  for(const target of aiLegalTargets())for(let pi=0;pi<pockets.length;pi++){
    const [px,py]=pockets[pi],pvx=px-target.x,pvy=py-target.y,pdist=Math.hypot(pvx,pvy);
    if(pdist<ballR*2.2)continue;
    const ux=pvx/pdist,uy=pvy/pdist;
    // Ghost-ball centre: where the cue ball centre should be at impact to send the object ball to pocket.
    const gx=target.x-ux*ballR*2,gy=target.y-uy*ballR*2;
    if(gx<L+ballR||gx>R-ballR||gy<T+ballR||gy>B-ballR)continue;
    if(!aiSegmentClear(target.x,target.y,px,py,target,null,ballR*1.82))continue;
    if(!aiSegmentClear(c.x,c.y,gx,gy,c,target,aiSkillLevel()>=4?ballR*2.18:ballR*2.03))continue;
    const cueDist=Math.hypot(gx-c.x,gy-c.y),aimx=gx-c.x,aimy=gy-c.y,ilen=Math.max(1,Math.hypot(aimx,aimy));
    const incomingX=aimx/ilen,incomingY=aimy/ilen,cutCos=clamp(incomingX*ux+incomingY*uy,-1,1),cutDeg=Math.acos(cutCos)*180/Math.PI;
    // Crude cue-ball danger estimate: after a cut the white tends to continue along the component
    // of its incoming direction not transferred to the object ball. Penalise that line if it heads at a pocket.
    let rx=incomingX-ux*Math.max(0,cutCos),ry=incomingY-uy*Math.max(0,cutCos),rlen=Math.hypot(rx,ry),inOffRisk=false,inOffMargin=999;
    // Start the post-impact cue-ball prediction at the ghost-ball contact position, not the
    // object-ball centre. This is deliberately conservative for the stronger pirates.
    if(rlen>.08){rx/=rlen;ry/=rlen;for(const [qx,qy] of pockets){const vx=qx-gx,vy=qy-gy,t=vx*rx+vy*ry;if(t>0){const miss=Math.hypot(vx-rx*t,vy-ry*t);inOffMargin=Math.min(inOffMargin,miss);if(miss<pocketR+ballR*.72){inOffRisk=true;break;}}}}
    // Short routes and gentle cuts are easier. Very thin/back-cut-looking routes are marked
    // marginal so Levels 4+ can compare them with a safety rather than blindly attacking.
    const marginalAttack=cutDeg>72||cueDist>1050||pdist>1250;
    const score=pdist+cueDist*.72+cutDeg*10+(inOffRisk?1400:0)+(marginalAttack?450:0);
    const candidate={target,pocket:pi,gx,gy,deg:Math.atan2(aimy,aimx)*180/Math.PI,power:clamp(Math.round(30+(cueDist+pdist)*.025),32,68),score,cutDeg,inOffRisk,inOffMargin,marginalAttack};
    if(aiSkillLevel()>=5){
      const preflight=aiDirectPreflight(candidate);candidate.preflight=preflight;
      if(!preflight.ok)continue;
    }
    plans.push(candidate);
  }
  return plans.sort((a,b)=>a.score-b.score);
}

function aiFindCombinationPots(){
  // V0.6.3 strategic attack layer: deliberate two-object-ball combinations.
  // Geometry: cue -> legal ball A -> same-group/legal ball B -> pocket.
  // Start with Captain Blackball + Darth Vaper so the feature can be validated
  // without confusing geometry failures with the larger execution errors of lower AI.
  if(state.breakShot||!(aiSkillLevel()===5||aiSkillLevel()===7))return [];
  const c=cue(),legal=aiLegalTargets(),plans=[];
  const on=onType(state.player);
  const secondaries=balls.filter(b=>!b.potted&&b.type!=='white'&&b.type!=='black'&&(on==='open'?(b.type==='red'||b.type==='yellow'):b.type===on));
  for(const first of legal){
    if(first.type==='black')continue; // don't use the frame ball as a cannoning ball
    for(const second of secondaries){
      if(second===first||second.type!==first.type)continue; // simple same-group combinations only in this first pass
      for(let pi=0;pi<pockets.length;pi++){
        const [px,py]=pockets[pi];
        // Secondary ball B must have a clean line to the pocket.
        const bvx=px-second.x,bvy=py-second.y,bdist=Math.hypot(bvx,bvy);if(bdist<ballR*2.2)continue;
        const bux=bvx/bdist,buy=bvy/bdist;
        if(!aiSegmentClear(second.x,second.y,px,py,second,null,ballR*1.82))continue;
        // A must arrive one diameter behind B on B's pocket line.
        const ax=second.x-bux*ballR*2,ay=second.y-buy*ballR*2;
        if(ax<L+ballR||ax>R-ballR||ay<T+ballR||ay>B-ballR)continue;
        const avx=ax-first.x,avy=ay-first.y,adist=Math.hypot(avx,avy);if(adist<ballR*2.15)continue;
        const aux=avx/adist,auy=avy/adist;
        // Reject combinations requiring A to travel through another ball before B.
        if(!aiSegmentClear(first.x,first.y,ax,ay,first,second,ballR*1.86))continue;
        // Cue ghost position needed to send A toward the A->B collision point.
        const gx=first.x-aux*ballR*2,gy=first.y-auy*ballR*2;
        if(gx<L+ballR||gx>R-ballR||gy<T+ballR||gy>B-ballR)continue;
        if(!aiSegmentClear(c.x,c.y,gx,gy,c,first,ballR*2.18))continue;
        const cueDist=Math.hypot(gx-c.x,gy-c.y),inx=(gx-c.x)/Math.max(1,cueDist),iny=(gy-c.y)/Math.max(1,cueDist);
        const firstCut=Math.acos(clamp(inx*aux+iny*auy,-1,1))*180/Math.PI;
        // At A->B impact, A's travel direction should be reasonably aligned with B's pocket line.
        const secondCut=Math.acos(clamp(aux*bux+auy*buy,-1,1))*180/Math.PI;
        if(firstCut>78||secondCut>34)continue;
        const total=cueDist+adist+bdist;
        const score=total+firstCut*13+secondCut*18+420; // complexity premium vs a direct pot
        const power=clamp(Math.round(38+total*.022),42,76);
        plans.push({target:first,secondary:second,pocket:pi,gx,gy,deg:Math.atan2(gy-c.y,gx-c.x)*180/Math.PI,power,score,cutDeg:firstCut,secondCut,routeDistance:total,kind:'COMBINATION POT',profile:(aiExecutionProfile(5)).label});
      }
    }
  }
  return plans.sort((a,b)=>a.score-b.score);
}

const AI_PROFILES={
  1:{label:'Wobbly',aimError:4.2,potError:3.4,potChoice:1,breakPower:88,fallbackPower:55,powerError:10},
  2:{label:'Learner',aimError:2.8,potError:2.2,potChoice:2,breakPower:90,fallbackPower:52,powerError:7},
  3:{label:'Competent',aimError:1.55,potError:1.15,potChoice:3,breakPower:91,fallbackPower:50,powerError:4},
  4:{label:'Sharp',aimError:.75,potError:.55,potChoice:5,breakPower:92,fallbackPower:48,powerError:2},
  5:{label:'Captain',aimError:.28,potError:.18,potChoice:8,breakPower:93,fallbackPower:47,powerError:1},
  6:{label:'Cyclops',aimError:.75,potError:.55,potChoice:5,breakPower:100,fallbackPower:100,powerError:0},
  7:{label:'Perfect',aimError:0,potError:0,potChoice:999,breakPower:93,fallbackPower:47,powerError:0}
};
// V0.7.0 personality framework: difficulty controls execution; personality biases selection only.
const AI_PERSONALITIES={
  1:{label:'Eager Deckhand',aggression:.92,safety:.70,flair:.55,position:.55},
  2:{label:'Pub Improviser',aggression:1.02,safety:.78,flair:.72,position:.68},
  3:{label:'Straight Shooter',aggression:1.00,safety:.92,flair:.78,position:.88},
  4:{label:'Cagey First Mate',aggression:.92,safety:1.18,flair:.82,position:1.08},
  5:{label:'Tactical Captain',aggression:1.00,safety:1.18,flair:.95,position:1.22},
  6:{label:'One-Eyed Wrecking Ball',aggression:1.38,safety:.48,flair:1.12,position:.62},
  7:{label:'Dark Showman',aggression:1.18,safety:1.02,flair:1.48,position:1.12}
};
const AI_PERSONALITIES_BY_ID={
  dave:{label:'Enthusiastic Chaos',aggression:1.08,safety:.55,flair:.69,position:.42},
  simon:{label:'Geometry Enthusiast',aggression:.98,safety:.83,flair:.86,position:.76},
  holly:{label:'Focused Amateur',aggression:1.02,safety:.94,flair:.72,position:.91},
  mick:{label:'Tornado',aggression:1.09,safety:1.04,flair:1.02,position:1.04},
  blackball:{label:'Veteran Strategist',aggression:.94,safety:1.25,flair:.92,position:1.31},
  cyclops:{label:'One-Eyed Wrecking Ball',aggression:1.38,safety:.48,flair:1.12,position:.62},
  vaper:{label:'Relentless Perfectionist',aggression:1.18,safety:1.02,flair:1.48,position:1.12},
  sandy:{label:'Showy Positional Thinker',aggression:.95,safety:.84,flair:1.18,position:1.03},
  shelle:{label:'Instinctive Potter',aggression:1.16,safety:.63,flair:.89,position:.62},
  graham:{label:'Methodical Overthinker',aggression:.82,safety:1.23,flair:.73,position:1.22},
  papa_surf:{label:'Unsettling Safety Expert',aggression:.70,safety:1.45,flair:.71,position:1.17},
  chapter2_boss:{label:'Wiggly Unpredictability',aggression:1.13,safety:.83,flair:1.34,position:.93},
  barley:{label:'Patient Farmer',aggression:.75,safety:1.19,flair:.55,position:1.16},
  legolass:{label:'Long-Range Archer',aggression:1.12,safety:.86,flair:1.17,position:1.08},
  aragoon:{label:'Ranger Tactician',aggression:.90,safety:1.23,flair:.92,position:1.26},
  souronion:{label:'Dark-Lord Attacker',aggression:1.32,safety:.67,flair:1.21,position:.85},
  blockbeard:{label:'Square-Dimension Master',aggression:1.24,safety:.93,flair:.88,position:1.35},
  gimlet:{label:'Cushion-Averse Power',aggression:1.37,safety:.52,flair:.69,position:.74},
  bam_bam:{label:'Cosy Cat — alternating visits',aggression:.91,safety:1.21,flair:.77,position:1.06}
};
let bamBamVisits=0,lastBamBamTurn=false;
function bamBamWild(){return currentPirateId==='bam_bam'&&bamBamVisits%2===0;}
function aiPersonality(){if(gameMode==='pirate'&&currentPirateId==='bam_bam')return bamBamWild()
  ?{label:'Bam Bam — Wild Visit',aggression:1.39,safety:.50,flair:1.43,position:.55}
  :{label:'Bam Bam — Cosy Visit',aggression:.72,safety:1.40,flair:.65,position:1.15};
  if(gameMode==='pirate'&&currentPirateId==='spinball_wizard')return {label:'Chaotic Show-off',aggression:1.18,safety:.85,flair:1.6,position:1.1};
  if(gameMode==='pirate'&&currentPirateId==='lucy_fir')return {label:'Lucy Fir — Chaining',aggression:1.12,safety:1.1,flair:.65,position:1.55};
  return (gameMode==='pirate'&&AI_PERSONALITIES_BY_ID[currentPirateId])||AI_PERSONALITIES[aiSkillLevel()]||AI_PERSONALITIES[3];}
function aiPersonalityLine(pick){const q=aiPersonality();return `PERSONALITY: ${q.label} • aggression ${q.aggression.toFixed(2)} • safety ${q.safety.toFixed(2)} • flair ${q.flair.toFixed(2)} • position ${q.position.toFixed(2)}${pick?.personalityInfluence?' • influence: '+pick.personalityInfluence:''}`;}
function aiRandError(max){return (Math.random()*2-1)*max;}

function aiCountOpponentDirectPotsFrom(x,y){
  const c=cue(),ox=c.x,oy=c.y,op=opponent(aiPlayer),on=onType(op);let count=0;
  c.x=x;c.y=y;
  const targets=balls.filter(b=>!b.potted&&b.type!=='white'&&(on==='open'?(b.type==='red'||b.type==='yellow'):b.type===on));
  for(const target of targets){
    for(const [px,py] of pockets){
      const pvx=px-target.x,pvy=py-target.y,pdist=Math.hypot(pvx,pvy);if(pdist<ballR*2.2)continue;
      const ux=pvx/pdist,uy=pvy/pdist,gx=target.x-ux*ballR*2,gy=target.y-uy*ballR*2;
      if(gx<L+ballR||gx>R-ballR||gy<T+ballR||gy>B-ballR)continue;
      if(aiSegmentClear(target.x,target.y,px,py,target,null,ballR*1.82)&&aiSegmentClear(x,y,gx,gy,c,target,ballR*2.03)){count++;break;}
    }
  }
  c.x=ox;c.y=oy;return count;
}
function aiRayFirstBall(deg,maxDist=4000){
  // Predict the first object ball touched by a straight cue-ball ray. This is used as a
  // legality gate for tactical/fallback plans; it does not alter the shared physics engine.
  const c=cue(),rad=deg*Math.PI/180,dx=Math.cos(rad),dy=Math.sin(rad);let best=null,bestT=Infinity;
  for(const b of balls){
    if(b.potted||b===c)continue;
    const vx=b.x-c.x,vy=b.y-c.y,along=vx*dx+vy*dy;if(along<=0||along>maxDist)continue;
    const perp2=vx*vx+vy*vy-along*along,rr=(ballR*2.02)**2;if(perp2>rr)continue;
    const hit=along-Math.sqrt(Math.max(0,rr-perp2));if(hit<bestT){bestT=hit;best=b;}
  }
  return best;
}
function aiCountPotsForTypeFrom(x,y,type,exclude=null){
  const c=cue(),ox=c.x,oy=c.y;let count=0;c.x=x;c.y=y;
  const targets=balls.filter(b=>!b.potted&&b!==exclude&&b.type===type);
  for(const target of targets)for(const [px,py] of pockets){
    const pvx=px-target.x,pvy=py-target.y,pdist=Math.hypot(pvx,pvy);if(pdist<ballR*2.2)continue;
    const ux=pvx/pdist,uy=pvy/pdist,gx=target.x-ux*ballR*2,gy=target.y-uy*ballR*2;
    if(gx<L+ballR||gx>R-ballR||gy<T+ballR||gy>B-ballR)continue;
    if(aiSegmentClear(target.x,target.y,px,py,target,null,ballR*1.82)&&aiSegmentClear(x,y,gx,gy,c,target,ballR*2.18)){count++;break;}
  }
  c.x=ox;c.y=oy;return count;
}
function aiFindSafety(){
  if(state.breakShot||aiSkillLevel()<4)return null;
  const c=cue(),targets=aiLegalTargets();if(!targets.length)return null;
  const before=aiCountOpponentDirectPotsFrom(c.x,c.y),candidates=[];
  for(const target of targets){
    const dx=target.x-c.x,dy=target.y-c.y,d=Math.hypot(dx,dy);if(d<1)continue;
    if(!aiSegmentClear(c.x,c.y,target.x,target.y,c,target,ballR*2.03))continue;
    const ux=dx/d,uy=dy/d;
    // Approximate a controlled thin/medium contact. We deliberately favour leaving the white
    // near a cushion while still making a legal first contact; physics remains identical for AI/human.
    for(const offset of [-2.2,0,2.2]){
      const deg=Math.atan2(dy,dx)*180/Math.PI+offset;
      if(aiRayFirstBall(deg)!==target)continue; // V0.6.3: never knowingly foul on first contact
      const travel=Math.min(250,Math.max(110,d*.22));
      const rad=deg*Math.PI/180,ex=clamp(target.x+Math.cos(rad)*travel,L+ballR,R-ballR),ey=clamp(target.y+Math.sin(rad)*travel,T+ballR,B-ballR);
      const after=aiCountOpponentDirectPotsFrom(ex,ey);
      const rail=Math.min(ex-L,R-ex,ey-T,B-ey);
      const score=after*500+rail*.8+d*.08;
      candidates.push({target,deg,intendedDeg:deg,power:aiSkillLevel()===7?34:38,kind:'SAFETY',profile:(aiExecutionProfile(4)).label,opponentPotsBefore:before,opponentPotsAfter:after,estimatedCue:{x:ex,y:ey},safetyScore:score});
    }
  }
  if(!candidates.length)return null;
  candidates.sort((a,b)=>a.safetyScore-b.safetyScore);
  const best={...candidates[0]},profile=aiExecutionProfile(4);
  const error=aiSkillLevel()===7?0:aiRandError(profile.aimError*.55),powerError=aiSkillLevel()===7?0:Math.round(aiRandError(Math.max(1,profile.powerError)));
  best.error=error;best.deg+=error;best.power=currentPirateId==='cyclops'?100:clamp(best.power+powerError,22,100);best.powerError=currentPirateId==='cyclops'?0:powerError;
  if(aiSkillLevel()>=5){const checked=aiValidateFinalPlan(best);if(!checked)return null;return checked;}
  return best;
}


function aiFindCushionEscape(){
  // Stronger pirates can deliberately escape a snooker by going cue ball -> cushion -> legal ball.
  // This planner only chooses geometry; the actual shot still uses the normal shared physics engine.
  if(state.breakShot||aiSkillLevel()<4)return null;
  const c=cue(),targets=aiLegalTargets();if(!targets.length)return null;
  const rails=[
    {name:'left',axis:'x',v:L+ballR},
    {name:'right',axis:'x',v:R-ballR},
    {name:'top',axis:'y',v:T+ballR},
    {name:'bottom',axis:'y',v:B-ballR}
  ];
  const plans=[];
  for(const target of targets)for(const rail of rails){
    // Mirror the target centre across the cushion. A straight line to the mirror gives the
    // equal-angle cushion contact point. Then stop the second leg one ball diameter short.
    const mx=rail.axis==='x'?2*rail.v-target.x:target.x;
    const my=rail.axis==='y'?2*rail.v-target.y:target.y;
    const vx=mx-c.x,vy=my-c.y;
    let t;
    if(rail.axis==='x'){
      if(Math.abs(vx)<1e-6)continue;t=(rail.v-c.x)/vx;
    }else{
      if(Math.abs(vy)<1e-6)continue;t=(rail.v-c.y)/vy;
    }
    if(t<=.02||t>=.98)continue;
    const bx=c.x+vx*t,by=c.y+vy*t;
    if(bx<L+ballR||bx>R-ballR||by<T+ballR||by>B-ballR)continue;
    // Don't plan a bank through a pocket mouth/corner jaw.
    if(pockets.some(([px,py])=>Math.hypot(px-bx,py-by)<pocketR+ballR*1.35))continue;
    const ax=target.x-bx,ay=target.y-by,alen=Math.hypot(ax,ay);if(alen<ballR*2.4)continue;
    const ux=ax/alen,uy=ay/alen,gx=target.x-ux*ballR*2,gy=target.y-uy*ballR*2;
    // Both legs must be genuinely clear. A conservative envelope is intentional here: a
    // level-5 escape should not knowingly clip an opponent ball before reaching its target.
    const clearance=aiSkillLevel()>=5?ballR*2.16:ballR*2.08;
    if(!aiSegmentClear(c.x,c.y,bx,by,c,null,clearance))continue;
    if(!aiSegmentClear(bx,by,gx,gy,c,target,clearance))continue;
    const leg1=Math.hypot(bx-c.x,by-c.y),leg2=Math.hypot(gx-bx,gy-by),total=leg1+leg2;
    const incidence=rail.axis==='x'?Math.abs((bx-c.x)/Math.max(1,leg1)):Math.abs((by-c.y)/Math.max(1,leg1));
    if(incidence<.12)continue; // reject almost-parallel grazes that are too fragile numerically
    const score=total+(1-incidence)*180;
    plans.push({target,rail:rail.name,bounce:{x:bx,y:by},ghost:{x:gx,y:gy},deg:Math.atan2(by-c.y,bx-c.x)*180/Math.PI,power:clamp(Math.round(46+total*.018),48,72),escapeScore:score,kind:'CUSHION ESCAPE',profile:(aiExecutionProfile(4)).label});
  }
  if(!plans.length)return null;
  plans.sort((a,b)=>a.escapeScore-b.escapeScore);
  const best={...plans[0]},profile=aiExecutionProfile(4);
  const error=aiSkillLevel()===7?0:aiRandError(profile.aimError*.38),powerError=aiSkillLevel()===7?0:Math.round(aiRandError(Math.max(1,profile.powerError*.7)));
  best.intendedDeg=best.deg;best.error=error;best.deg+=error;best.power=currentPirateId==='cyclops'?100:clamp(best.power+powerError,35,100);best.powerError=currentPirateId==='cyclops'?0:powerError;
  return best;
}


function aiFindTwoCushionEscape(){
  // Captain Blackball and Darth Vaper can search a genuine two-cushion escape when neither
  // a direct legal contact nor a one-cushion route exists. This is pure table geometry: the
  // eventual shot is still executed by the same physics engine as a human shot.
  if(state.breakShot||!(aiSkillLevel()===5||aiSkillLevel()===7))return null;
  const c=cue(),targets=aiLegalTargets();if(!targets.length)return null;
  const rails=[
    {name:'left',axis:'x',v:L+ballR},
    {name:'right',axis:'x',v:R-ballR},
    {name:'top',axis:'y',v:T+ballR},
    {name:'bottom',axis:'y',v:B-ballR}
  ];
  const reflectPoint=(x,y,rail)=>rail.axis==='x'?{x:2*rail.v-x,y}:{x,y:2*rail.v-y};
  const transformedRail=(rail,mirror)=>{
    if(rail.axis===mirror.axis)return {axis:rail.axis,v:2*mirror.v-rail.v};
    return {axis:rail.axis,v:rail.v};
  };
  const lineHit=(x1,y1,x2,y2,rail)=>{
    const dx=x2-x1,dy=y2-y1;
    if(rail.axis==='x'){
      if(Math.abs(dx)<1e-7)return null;const t=(rail.v-x1)/dx;
      return {t,x:rail.v,y:y1+dy*t};
    }
    if(Math.abs(dy)<1e-7)return null;const t=(rail.v-y1)/dy;
    return {t,x:x1+dx*t,y:rail.v};
  };
  const inside=(x,y)=>x>=L+ballR&&x<=R-ballR&&y>=T+ballR&&y<=B-ballR;
  const plans=[];
  for(const target of targets)for(const r1 of rails)for(const r2 of rails){
    if(r1===r2)continue;
    // Unfold the table twice: target reflected in the second cushion, then the first.
    const im2=reflectPoint(target.x,target.y,r2),image=reflectPoint(im2.x,im2.y,r1);
    const h1=lineHit(c.x,c.y,image.x,image.y,r1);if(!h1||h1.t<=.015||h1.t>=.96)continue;
    const r2u=transformedRail(r2,r1),h2u=lineHit(c.x,c.y,image.x,image.y,r2u);
    if(!h2u||h2u.t<=h1.t+.02||h2u.t>=.985)continue;
    const b1={x:h1.x,y:h1.y},b2=reflectPoint(h2u.x,h2u.y,r1);
    if(!inside(b1.x,b1.y)||!inside(b2.x,b2.y))continue;
    if(pockets.some(([px,py])=>Math.hypot(px-b1.x,py-b1.y)<pocketR+ballR*1.45||Math.hypot(px-b2.x,py-b2.y)<pocketR+ballR*1.45))continue;
    const ax=target.x-b2.x,ay=target.y-b2.y,alen=Math.hypot(ax,ay);if(alen<ballR*2.5)continue;
    const ux=ax/alen,uy=ay/alen,gx=target.x-ux*ballR*2,gy=target.y-uy*ballR*2;
    const clearance=ballR*2.16;
    if(!aiSegmentClear(c.x,c.y,b1.x,b1.y,c,null,clearance))continue;
    if(!aiSegmentClear(b1.x,b1.y,b2.x,b2.y,c,null,clearance))continue;
    if(!aiSegmentClear(b2.x,b2.y,gx,gy,c,target,clearance))continue;
    const d1=Math.hypot(b1.x-c.x,b1.y-c.y),d2=Math.hypot(b2.x-b1.x,b2.y-b1.y),d3=Math.hypot(gx-b2.x,gy-b2.y),total=d1+d2+d3;
    // Reject very shallow rail grazes: they are fragile and rarely a sensible escape.
    const inc1=r1.axis==='x'?Math.abs((b1.x-c.x)/Math.max(1,d1)):Math.abs((b1.y-c.y)/Math.max(1,d1));
    const inc2=r2.axis==='x'?Math.abs((b2.x-b1.x)/Math.max(1,d2)):Math.abs((b2.y-b1.y)/Math.max(1,d2));
    if(inc1<.11||inc2<.11)continue;
    const score=total+(1-inc1)*170+(1-inc2)*170;
    plans.push({target,rails:[r1.name,r2.name],bounce1:b1,bounce2:b2,ghost:{x:gx,y:gy},deg:Math.atan2(b1.y-c.y,b1.x-c.x)*180/Math.PI,power:clamp(Math.round(57+total*.014),58,82),escapeScore:score,kind:'TWO CUSHION ESCAPE',profile:(aiExecutionProfile(5)).label});
  }
  if(!plans.length)return null;
  plans.sort((a,b)=>a.escapeScore-b.escapeScore);
  const best={...plans[0]},profile=aiExecutionProfile(5);
  const error=aiSkillLevel()===7?0:aiRandError(profile.aimError*.28),powerError=aiSkillLevel()===7?0:Math.round(aiRandError(Math.max(1,profile.powerError*.6)));
  best.intendedDeg=best.deg;best.error=error;best.deg+=error;best.power=clamp(best.power+powerError,45,100);best.powerError=powerError;
  return best;
}


function aiFindThreeCushionEscape(){
  // Darth Vaper only: if direct, one-cushion and two-cushion legal routes all fail,
  // search a three-cushion escape. This deliberately remains a last resort.
  if(state.breakShot||aiSkillLevel()!==7)return null;
  const c=cue(),targets=aiLegalTargets();if(!targets.length)return null;
  const minX=L+ballR,maxX=R-ballR,minY=T+ballR,maxY=B-ballR;
  const pocketDanger=(x,y)=>pockets.some(([px,py])=>Math.hypot(px-x,py-y)<pocketR+ballR*1.45);
  const rayToRail=(x,y,dx,dy)=>{
    const hits=[];
    if(dx<-.00001)hits.push({t:(minX-x)/dx,name:'left'});
    if(dx>.00001)hits.push({t:(maxX-x)/dx,name:'right'});
    if(dy<-.00001)hits.push({t:(minY-y)/dy,name:'top'});
    if(dy>.00001)hits.push({t:(maxY-y)/dy,name:'bottom'});
    const h=hits.filter(q=>q.t>.001).sort((a,b)=>a.t-b.t)[0];
    if(!h)return null;
    return{x:x+dx*h.t,y:y+dy*h.t,t:h.t,name:h.name};
  };
  const plans=[];
  // Vaper is a diagnostic opponent, so a dense deterministic angular search is appropriate.
  // 0.1 degree resolution matches the player's precision control and introduces no hidden physics.
  for(let tenth=0;tenth<3600;tenth++){
    const deg=tenth/10,rad=deg*Math.PI/180;let x=c.x,y=c.y,dx=Math.cos(rad),dy=Math.sin(rad),prev={x,y};
    const bounces=[],rails=[];let valid=true,total=0;
    for(let n=0;n<3;n++){
      const h=rayToRail(x,y,dx,dy);if(!h){valid=false;break;}
      if(pocketDanger(h.x,h.y)){valid=false;break;}
      const seg=Math.hypot(h.x-prev.x,h.y-prev.y);if(seg<ballR*2.8){valid=false;break;}
      if(!aiSegmentClear(prev.x,prev.y,h.x,h.y,c,null,ballR*2.16)){valid=false;break;}
      total+=seg;bounces.push({x:h.x,y:h.y});rails.push(h.name);
      // Avoid immediate same-rail numerical rebounds and very shallow grazes.
      const incidence=(h.name==='left'||h.name==='right')?Math.abs(dx):Math.abs(dy);
      if(incidence<.11){valid=false;break;}
      if(h.name==='left'||h.name==='right')dx=-dx;else dy=-dy;
      x=h.x+dx*.05;y=h.y+dy*.05;prev={x:h.x,y:h.y};
    }
    if(!valid||rails[0]===rails[1]||rails[1]===rails[2])continue;
    const end=rayToRail(x,y,dx,dy);if(!end)continue;
    // Find a legal object ball whose centre lies on the post-third-cushion ray before the next rail.
    for(const target of targets){
      const vx=target.x-x,vy=target.y-y,along=vx*dx+vy*dy;
      if(along<=ballR*2.2||along>=end.t)continue;
      const perp=Math.abs(vx*dy-vy*dx);
      if(perp>ballR*1.90)continue;
      // Stop at the ghost/contact point and verify that the final leg is clear of every other ball.
      const hitAlong=along-Math.sqrt(Math.max(0,(ballR*2)**2-perp**2));
      if(hitAlong<=0)continue;
      const gx=x+dx*hitAlong,gy=y+dy*hitAlong;
      if(!aiSegmentClear(x,y,gx,gy,c,target,ballR*2.16))continue;
      const route=total+hitAlong;
      const score=route+perp*20;
      plans.push({target,rails:[...rails],bounces:[...bounces],ghost:{x:gx,y:gy},deg,power:clamp(Math.round(68+route*.009),70,94),escapeScore:score,kind:'THREE CUSHION ESCAPE',profile:(AI_PROFILES[7]||{}).label||'Perfect'});
    }
  }
  if(!plans.length)return null;
  plans.sort((a,b)=>a.escapeScore-b.escapeScore);
  const best={...plans[0]};best.intendedDeg=best.deg;best.error=0;best.powerError=0;
  return best;
}



// V0.7.6: Darth Vaper's final escape layer is physics-led rather than geometry-led.
// It is only reached after the normal safety + 1/2/3-cushion solvers fail.  Unlike the
// generic emergency fallback, every returned route has actually reproduced a legal first
// contact in the silent copy of the real table physics.  This deliberately costs more CPU:
// Difficulty 7 is the hidden "Perfect" opponent and should search harder before accepting a foul.
function aiFindVaperPerfectEscape(){
  if(state.breakShot||aiSkillLevel()!==7)return null;
  const c=cue(),targets=aiLegalTargets();if(!targets.length)return null;
  const targetKeys=new Set(targets.map(b=>`${b.type}:${b.id}`));
  const stillOnColours=onType(state.player)!=='black';
  const valid=(test)=>{
    if(!test||test.cuePotted||test.firstId==null)return false;
    if(!targetKeys.has(`${test.first}:${test.firstId}`))return false;
    if(stillOnColours&&test.pots.includes('black'))return false;
    return true;
  };
  const make=(target,deg,power,test,mode)=>({target,deg,intendedDeg:deg,error:0,power,powerError:0,
    kind:'PERFECT ESCAPE',profile:'Perfect',clearRoute:false,legalityValidated:true,
    predictedFirstType:test.first,predictedFirstId:test.firstId,physicsForecast:test,
    physicsSafety:'PASS (Perfect escape physics-validated)',perfectEscapeMode:mode,
    personalityInfluence:'PERFECT ESCAPE SEARCH — all simpler legal routes exhausted'});

  // Stage A: search very densely around each legal object's bearing.  This catches narrow
  // straight/glancing windows that the centre-line geometry can miss without invoking banks.
  const powers=[40,52,64,76,88];
  const offsets=[0];for(let d=.25;d<=12;d+=.25){offsets.push(-d,d);}
  for(const target of targets){
    const base=Math.atan2(target.y-c.y,target.x-c.x)*180/Math.PI;
    for(const off of offsets)for(const power of powers){
      const deg=base+off,test=aiDryRunShot(deg,power,6,1/90);
      if(valid(test)&&test.first===target.type&&test.firstId===target.id)return make(target,deg,power,test,'dense legal-contact search');
    }
  }

  // Stage B: unrestricted table search.  Because this is judged by the real dry-run rather
  // than ray geometry, successful candidates may naturally reach the legal ball via cushions
  // or caroms.  We only need one legal survival route; elegance is irrelevant at this depth.
  for(let deg=0;deg<360;deg+=2){
    for(const power of [52,68,84,94]){
      const test=aiDryRunShot(deg,power,7,1/90);if(!valid(test))continue;
      const target=targets.find(b=>b.type===test.first&&b.id===test.firstId);if(target)return make(target,deg,power,test,'full-table physics search');
    }
  }
  return null;
}

function aiEmergencyFallback(reason='normal planner exhausted'){
  // V0.7.6: Vaper gets one final physics-validated escape search before the deliberately
  // foul-tolerant generic deadlock guard is allowed to fire.
  if(aiSkillLevel()===7&&currentPirateId!=='chapter2_boss'&&!state.breakShot){const perfect=aiFindVaperPerfectEscape();if(perfect){perfect.emergencyReason=reason;return perfect;}}
  // V0.7.1 deadlock guard: an AI turn must always resolve to a physical shot.
  // First look cheaply for ANY straight legal first contact. If none exists after the normal
  // safety/cushion solvers have already failed, play a least-bad contact attempt rather than
  // leaving the turn waiting forever. A foul is a valid game outcome; a frozen turn is not.
  const c=cue(),profile=aiExecutionProfile(1);
  let targets=aiLegalTargets();
  if(!targets.length)targets=balls.filter(b=>!b.potted&&b.type!=='white');
  if(!targets.length)return null;
  let chosen=null;
  for(let tenth=0;tenth<3600;tenth+=5){
    const deg=tenth/10,hit=aiRayFirstBall(deg);
    if(hit&&targets.includes(hit)){
      const d=Math.hypot(hit.x-c.x,hit.y-c.y);
      if(!chosen||d<chosen.d)chosen={target:hit,deg,d};
    }
  }
  if(!chosen){
    const target=[...targets].sort((a,b)=>Math.hypot(a.x-c.x,a.y-c.y)-Math.hypot(b.x-c.x,b.y-c.y))[0];
    chosen={target,deg:Math.atan2(target.y-c.y,target.x-c.x)*180/Math.PI,d:Math.hypot(target.x-c.x,target.y-c.y)};
  }
  const legalFirst=aiRayFirstBall(chosen.deg)===chosen.target;
  const power=currentPirateId==='cyclops'?100:clamp(Math.max(42,profile.fallbackPower||62),20,100);
  return {target:chosen.target,deg:chosen.deg,intendedDeg:chosen.deg,error:0,power,powerError:0,kind:'EMERGENCY FALLBACK',profile:profile.label,clearRoute:legalFirst,legalityValidated:legalFirst,predictedFirstType:aiRayFirstBall(chosen.deg)?.type||null,predictedFirstId:aiRayFirstBall(chosen.deg)?.id??null,emergencyReason:reason,personalityInfluence:'DEADLOCK GUARD — normal personality selection exhausted'};
}

// Vaper alone compares contact points at his already selected angle and power.
// Keep the existing accuracy/personality: no outcome edits or extra aiming precision.
function aiChooseBasicShot(){
 const plan=aiChooseBasicShotBase();
 if(gameMode!=='pirate'||currentPirateId!=='vaper'||state.breakShot||!plan?.target)return plan;
 return aiVaperSpinPlan(plan);
}
function aiVaperSpinPlan(plan){
 const centre={x:0,y:0},contacts=[centre,{x:0,y:-.65},{x:0,y:.65},{x:-.6,y:0},{x:.6,y:0},{x:-.45,y:-.45},{x:.45,y:-.45},{x:-.45,y:.45},{x:.45,y:.45}];
 const intended=plan.secondary?.id??plan.target.id,on=onType(state.player);
 const assess=(contact,dt)=>{
  const f=aiDryRunShot(plan.deg,plan.power,9,dt,contact);
  if(f.cuePotted||f.firstId!==plan.target.id||(on!=='black'&&f.pots.includes('black')))return null;
  // Spin must retain the intended pot; do not turn a pot into a safety for position.
  if(!f.potIds.includes(intended))return null;
  const nextGroup=on==='open'?(plan.secondary?.type??plan.target.type):on;
  const remaining=balls.filter(b=>!b.potted&&b.type!=='white'&&!f.potIds.includes(b.id)&&b.type===nextGroup);
  const targets=remaining.length?remaining:balls.filter(b=>!b.potted&&b.type==='black'&&!f.potIds.includes(b.id));
  if(!targets.length)return {score:0,forecast:f}; // winning black: centre wins ties
  const c=f.cuePosition,clear=t=>!balls.some(b=>{
   if(b.potted||b.type==='white'||b.id===t.id||f.potIds.includes(b.id))return false;
   const dx=t.x-c.x,dy=t.y-c.y;
   const along=clamp(((b.x-c.x)*dx+(b.y-c.y)*dy)/Math.max(1,dx*dx+dy*dy),0,1);
   return Math.hypot(b.x-c.x-dx*along,b.y-c.y-dy*along)<ballR*2.1;
  });
  const score=Math.min(...targets.map(t=>Math.hypot(c.x-t.x,c.y-t.y)+(clear(t)?0:600)))+Math.max(0,ballR*4-Math.min(c.x-L,R-c.x,c.y-T,B-c.y))*4;
  return {score,forecast:f};
 };
 const base=assess(centre,1/60);let best=base?.score??Infinity,chosen=centre;
 for(const contact of contacts.slice(1)){
  const a=assess(contact,1/60);if(!a||a.score>=best-45)continue;
  const b=assess(contact,1/120);if(!b||b.score>=best-45)continue;
  // Adjacent execution probes protect the existing high-quality shot from fragile spin.
  let safe=true;for(const delta of [-.08,.08]){const f=aiDryRunShot(plan.deg+delta,plan.power,9,1/60,contact);if(f.cuePotted||f.firstId!==plan.target.id||!f.potIds.includes(intended)||(on!=='black'&&f.pots.includes('black')))safe=false;}
  if(safe){best=Math.max(a.score,b.score);chosen=contact;}
 }
 return {...plan,spinContact:{...chosen}};
}
function aiChooseBasicShotBase(){
  const c=cue(),targets=aiLegalTargets(),profile=aiExecutionProfile(1),personality=aiPersonality();
  if(!targets.length)return aiEmergencyFallback('no legal target returned by rules-state lookup');
  if(!state.breakShot){
    if(gameMode==='pirate'&&currentPirateId==='spinball_wizard'&&k4Runtime.wizardShots%3===1){const flourish=k4CushionPreference();if(flourish){const checked=aiValidateFinalPlan(flourish);if(checked)return {...checked,personalityInfluence:'Spinball Wizard favours a spin-validated cushion flourish over a plain route'};}}
    if(gameMode==='pirate'&&currentPirateId==='socks_sandals'){const bank=k4CushionPreference();if(bank)return bank;}
    const pots=aiFindDirectPots();
    if(gameMode==='pirate'&&currentPirateId==='lucy_fir'){const chain=k4LucyAttack(pots);if(chain)return chain;}
    const combinations=aiFindCombinationPots();
    // V0.7.5 Vaper discipline: before flair is allowed to promote a cannon/combination,
    // inspect the best few direct routes with the real physics engine. A genuinely high-
    // confidence simple pot is locked in: showmanship may break ties, not throw away free money.
    let vaperSimpleLock=null;
    if(currentPirateId==='vaper'&&pots.length){
      const candidates=pots.slice(0,Math.min(3,pots.length)).map(p=>({...p,vaperConfidence:aiVaperDirectConfidence(p)}));
      const reliable=candidates.filter(p=>p.vaperConfidence>=.999&&p.cutDeg<=38&&!p.inOffRisk&&!p.marginalAttack);
      if(reliable.length){
        reliable.sort((a,b)=>(a.score-b.score));
        vaperSimpleLock=reliable[0];
      }
    }
    // Blackball/Vaper now compare deliberate simple combinations with direct attacks.
    // A combination carries a complexity premium, so it wins only when it is genuinely
    // preferable to the available direct route rather than merely because it exists.
    const comboThreshold=.90*personality.flair;
    if(!vaperSimpleLock&&combinations.length&&(!pots.length||combinations[0].score<(pots[0].score*comboThreshold))){
      const comboProfile=aiExecutionProfile(5);
      for(const combo of combinations){
        let plan={...combo};
        const error=aiSkillLevel()===7?0:aiRandError(comboProfile.potError*.72),powerError=aiSkillLevel()===7?0:Math.round(aiRandError(Math.max(1,comboProfile.powerError)));
        plan.intendedDeg=plan.deg;plan.error=error;plan.deg+=error;plan.power=clamp(plan.power+powerError,35,88);plan.powerError=powerError;
        plan.directAlternative=pots.length?pots[0].score:null;
        plan.personalityInfluence=`FLAIR favoured combination (threshold ${comboThreshold.toFixed(2)})`;
        const checked=aiValidateFinalPlan(plan);if(checked)return checked;
      }
      // V0.6.4 hard veto: every rejected cannon is discarded; execution falls through to a safer plan.
    }
    if(pots.length){
      // Higher levels reject obvious in-off routes. If every theoretical pot is dangerous,
      // they are allowed to abandon the attack and look for a safety instead.
      let eligible=aiSkillLevel()>=4?pots.filter(p=>!p.inOffRisk):pots;
      const blackDecision=onType(state.player)==='black'&&aiSkillLevel()>=5;
      if(blackDecision&&eligible.length){
        eligible=eligible.map(p=>({...p,blackWinConfidence:aiBlackWinConfidence(p)}));
        const robustWins=eligible.filter(p=>p.blackWinConfidence>=1);
        if(robustWins.length){
          robustWins.sort((a,b)=>a.score-b.score);
          eligible=robustWins.map(p=>({...p,blackWinLock:true,personalityInfluence:`BLACK BALL INTELLIGENCE • WIN NOW • ${(p.blackWinConfidence*100).toFixed(0)}% robust physics confidence`}));
        }else if(currentPirateId==='vaper'){
          const frameKills=eligible.filter(p=>p.blackWinConfidence>=5/6&&aiVaperFrameKillSafe(p));
          if(frameKills.length){
            frameKills.sort((a,b)=>(b.blackWinConfidence-a.blackWinConfidence)||(a.score-b.score));
            eligible=frameKills.map(p=>({...p,vaperFrameKill:true,personalityInfluence:`BLACK BALL INTELLIGENCE • FRAME KILL • ${Math.round(p.blackWinConfidence*100)}% probe confidence • Vaper aggression override`}));
          }else{
            eligible.sort((a,b)=>(b.blackWinConfidence-a.blackWinConfidence)||(a.score-b.score));
          }
        }else{
          // No direct black is robust enough to call a winning shot. Keep the candidates for
          // diagnostics, but let the normal safety/escape decision layer compare them.
          eligible.sort((a,b)=>(b.blackWinConfidence-a.blackWinConfidence)||(a.score-b.score));
        }
      }
      if(vaperSimpleLock&&!blackDecision){
        eligible=[{...vaperSimpleLock,personalityInfluence:`SIMPLE POT LOCK • ${(vaperSimpleLock.vaperConfidence*100).toFixed(0)}% physics confidence • flair override prohibited`}];
      }
      if(!eligible.length&&aiSkillLevel()>=4){const safety=aiFindSafety();if(safety){safety.rejectedAttack={reason:'all direct pots carried an in-off risk',bestScore:pots[0].score};return safety;}}
      if(!eligible.length)eligible=pots;
      // Captain Blackball starts thinking one ball ahead. Estimate where the white will finish
      // after each pot and prefer a route that leaves it nearer another legal object ball.
      if(aiSkillLevel()>=5&&eligible.length>=1){
        const liveTargets=aiLegalTargets();
        eligible=eligible.map(p=>{
          const c=cue(),vx=p.gx-c.x,vy=p.gy-c.y,vlen=Math.max(1,Math.hypot(vx,vy)),ix=vx/vlen,iy=vy/vlen;
          const [px,py]=pockets[p.pocket],ovx=px-p.target.x,ovy=py-p.target.y,olen=Math.max(1,Math.hypot(ovx,ovy)),ux=ovx/olen,uy=ovy/olen;
          const transfer=Math.max(0,ix*ux+iy*uy),rx=ix-ux*transfer,ry=iy-uy*transfer,rlen=Math.hypot(rx,ry);
          const ex=clamp(p.target.x+(rlen>.05?rx/rlen:ix)*170,L+ballR,R-ballR),ey=clamp(p.target.y+(rlen>.05?ry/rlen:iy)*170,T+ballR,B-ballR);
          const next=liveTargets.filter(b=>b!==p.target);const nextDist=next.length?Math.min(...next.map(b=>Math.hypot(b.x-ex,b.y-ey))):0;
          const group=state.groups[state.player],groupLeft=group?remaining(group):99;
          // V0.6.3 endgame: with 1-3 colours left, value actual next-shot availability rather
          // than distance alone. On the final colour, explicitly prepare a route to the black.
          let endgameBonus=0,nextRoutes=0,blackRoutes=0,endgameLabel='';
          if(group&&groupLeft<=3){
            if(groupLeft===1&&p.target.type===group){
              blackRoutes=aiCountPotsForTypeFrom(ex,ey,'black');
              endgameBonus=blackRoutes?-520:420;
              endgameLabel=blackRoutes?`FINAL COLOUR → black has ${blackRoutes} direct route${blackRoutes===1?'':'s'}`:'FINAL COLOUR → no direct black route predicted';
            }else if(p.target.type===group){
              nextRoutes=aiCountPotsForTypeFrom(ex,ey,group,p.target);
              endgameBonus=nextRoutes?-Math.min(360,nextRoutes*150):260;
              endgameLabel=`CLEARANCE: ${groupLeft} ${group.toUpperCase()} left • predicted next-pot routes ${nextRoutes}`;
            }
          }
          return {...p,positionScore:nextDist,estimatedCue:{x:ex,y:ey},nextRoutes,blackRoutes,endgameLabel,captainScore:p.score+nextDist*(.25*personality.position)+endgameBonus*personality.position,personalityInfluence:personality.position>1.1?'POSITION weighted strongly':personality.position<.75?'POSITION de-emphasised':'BALANCED position weighting'};
        });
        // V0.7.4: on the final colour, compare every viable pot route as a route TO the black,
        // not merely as a colour pot. If at least one forecast leaves a direct black, Captain+
        // strongly reject routes that leave none. Blackball weights this most heavily; Vaper still
        // values the black route but keeps a little more freedom for his flair personality.
        const group=state.groups[state.player],groupLeft=group?remaining(group):99;
        if(group&&groupLeft===1){
          const finalRoutes=eligible.filter(p=>p.target?.type===group);
          const withBlack=finalRoutes.filter(p=>(p.blackRoutes||0)>0);
          const candidateCount=finalRoutes.length,blackCandidateCount=withBlack.length;
          for(const p of finalRoutes){
            p.finalColourCandidates=candidateCount;p.blackCandidateCount=blackCandidateCount;
            if(blackCandidateCount){
              const routeWeight=aiSkillLevel()===5?1.35:aiSkillLevel()===7?1.12:1.20;
              if(p.blackRoutes>0){
                p.captainScore-=routeWeight*(900+Math.min(3,p.blackRoutes)*180)*personality.position;
                p.personalityInfluence=`BLACK POSITION prioritised • ${p.blackRoutes} direct black route${p.blackRoutes===1?'':'s'} forecast`;
                p.endgameLabel=`FINAL COLOUR • ${candidateCount} candidate pot route${candidateCount===1?'':'s'} • ${blackCandidateCount} produce direct black • selected route forecasts ${p.blackRoutes}`;
              }else{
                p.captainScore+=routeWeight*1250*personality.position;
                p.personalityInfluence=`BLACK POSITION penalised route with no direct black`;
                p.endgameLabel=`FINAL COLOUR • ${candidateCount} candidate pot route${candidateCount===1?'':'s'} • ${blackCandidateCount} produce direct black • this route produces none`;
              }
            }else{
              p.endgameLabel=`FINAL COLOUR • ${candidateCount} candidate pot route${candidateCount===1?'':'s'} • no candidate produces direct black • selecting best available colour shot`;
            }
          }
        }
        eligible.sort((a,b)=>a.captainScore-b.captainScore);
      }
      // Mick/Blackball/Vaper compare ugly attacks with a genuine safety. A direct pot is not
      // automatically the right choice merely because the geometry can describe one.
      if(aiSkillLevel()>=4&&eligible.length){
        const bestAttack=eligible[0],safety=aiFindSafety();
        const attackUgly=bestAttack.marginalAttack||bestAttack.cutDeg>72||bestAttack.score>1550;
        const safetyThreshold=.72*(personality.safety/personality.aggression);
        const safetyClearlyBetter=safety&&((safety.opponentPotsAfter<Math.max(1,safety.opponentPotsBefore)&&personality.safety>=.85)||safety.safetyScore<bestAttack.score*safetyThreshold);
        const blackWinLocked=bestAttack.blackWinLock===true;
        const vaperFrameKill=bestAttack.vaperFrameKill===true;
        const blackAttackProtected=blackWinLocked||vaperFrameKill;
        const blackAttackUnproven=onType(state.player)==='black'&&aiSkillLevel()>=5&&!blackAttackProtected&&!(currentPirateId==='blockbeard'&&(bestAttack.blackWinConfidence||0)>=.5);
        if(safety&&!blackAttackProtected&&((attackUgly&&safetyClearlyBetter)||blackAttackUnproven)){
          const why=blackAttackUnproven?`black attack not robust enough to call WIN NOW (${Math.round((bestAttack.blackWinConfidence||0)*100)}% probe confidence)`:`marginal attack (cut ${bestAttack.cutDeg.toFixed(1)}°, route ${bestAttack.score.toFixed(0)})`;
          safety.rejectedAttack={reason:why,bestScore:bestAttack.score,target:bestAttack.target};
          safety.personalityInfluence=blackAttackUnproven?'BLACK BALL INTELLIGENCE • SAFETY preferred over unproven frame-ball attack':`SAFETY preferred (threshold ${safetyThreshold.toFixed(2)})`;
          return safety;
        }
      }
      const pool=eligible.slice(0,Math.min(profile.potChoice,eligible.length));
      const ordered=aiSkillLevel()<=2?[pool[Math.floor(Math.random()*pool.length)]]:pool;
      let rejectedPlan=null;
      for(const candidate of ordered){
        let plan={...candidate};
        const longDistance=Math.hypot(candidate.gx-cue().x,candidate.gy-cue().y);
        // K2F.3: Blockbeard should be threatening on long straight pots, not a guaranteed miss.
        // Preserve Vaper's existing level-7 accuracy and all other personalities.
        const shotError=(currentPirateId==='blockbeard'&&longDistance>350)?Math.min(profile.potError,.12):profile.potError;
        const error=aiRandError(shotError),powerError=Math.round(aiRandError(profile.powerError));
        plan.intendedDeg=plan.deg;plan.error=error;plan.deg+=error;plan.power=currentPirateId==='cyclops'?100:clamp(plan.power+powerError,20,85);plan.powerError=currentPirateId==='cyclops'?0:powerError;plan.kind='DIRECT POT';plan.profile=profile.label;plan.personalityInfluence=plan.personalityInfluence||((personality.aggression>1.15)?'AGGRESSION backed attack':(personality.position>1.1?'POSITION influenced route choice':'BALANCED attack'));
        const checked=aiValidateFinalPlan(plan);if(checked)return checked;rejectedPlan=plan;
      }
      if(aiSkillLevel()>=5){const safety=aiFindSafety();if(safety){const blackRisk=rejectedPlan?.blackLossRisk;safety.rejectedAttack={reason:blackRisk?'BLACK LOSS RISK preflight rejected the remaining direct attack':'hard veto rejected all candidate direct attacks',bestScore:rejectedPlan?.score??eligible[0].score};return safety;}}
      if(aiSkillLevel()<5&&rejectedPlan)return rejectedPlan;
      // Captain/Vaper never execute a direct attack their own forecast rejected.

    }
  }
  // No direct pot: first try a normal direct-contact safety. If every legal target is hidden,
  // Levels 4+ search for a one-cushion escape instead of knowingly shooting through blockers.
  const safety=aiFindSafety();
  if(safety){safety.personalityInfluence=safety.personalityInfluence||`${personality.safety>=1.1?'SAFETY identity':'TACTICAL fallback'} when no pot available`;return safety;}
  const escape=aiFindCushionEscape();
  if(escape){const checked=aiValidateFinalPlan(escape);if(checked)return checked;}
  // If one cushion cannot produce a legal route, Captain Blackball and Darth Vaper unfold
  // the table a second time and search a two-cushion escape before accepting a likely foul.
  const twoEscape=aiFindTwoCushionEscape();
  if(twoEscape){const checked=aiValidateFinalPlan(twoEscape);if(checked)return checked;}
  // Darth Vaper alone gets a third geometric escape layer. It is deliberately searched only
  // after every simpler route has failed, so three-cushion heroics never replace an easier shot.
  const threeEscape=aiFindThreeCushionEscape();
  if(threeEscape){const checked=aiValidateFinalPlan(threeEscape);if(checked)return checked;}
  // V0.7.6: if Vaper's geometric solvers all fail, search the actual physics engine for any
  // survivable legal contact (including routes that naturally bank/carom) before emergency play.
  const perfectEscape=currentPirateId==='chapter2_boss'?null:aiFindVaperPerfectEscape();
  if(perfectEscape)return perfectEscape;
  // Otherwise prefer a target with a clearer cue-ball route instead of blindly taking nearest.
  const ranked=targets.map(target=>{const d=Math.hypot(target.x-c.x,target.y-c.y);const clearance=aiSkillLevel()>=4?ballR*2.18:ballR*2.03;const clear=aiSegmentClear(c.x,c.y,target.x,target.y,c,target,clearance);return{target,d,clear,score:d+(clear?0:900)}}).sort((a,b)=>a.score-b.score);
  const clearRanked=ranked.filter(r=>r.clear);
  const choice=aiSkillLevel()>=4&&clearRanked.length?clearRanked[0]:(aiSkillLevel()>=3?ranked[0]:ranked[Math.min(ranked.length-1,Math.floor(Math.random()*Math.min(2,ranked.length)))]);
  const target=choice.target,base=Math.atan2(target.y-c.y,target.x-c.x)*180/Math.PI;
  let predictedFirst=aiRayFirstBall(base),legalityValidated=predictedFirst===target,finalBase=base;
  if(aiSkillLevel()>=5&&!legalityValidated&&!state.breakShot){
    let rescue=null;for(let d=.1;d<=18&&!rescue;d+=.1)for(const sign of [-1,1]){const testDeg=base+sign*d,hit=aiRayFirstBall(testDeg);if(hit&&hit===target){rescue=testDeg;predictedFirst=hit;legalityValidated=true;break;}}
    if(rescue!=null)finalBase=rescue;
  }
  const error=state.breakShot?aiRandError(profile.aimError*.25):aiRandError(profile.aimError);
  const basePower=state.breakShot?profile.breakPower:profile.fallbackPower,powerError=Math.round(aiRandError(profile.powerError));
  const fallback={target,deg:finalBase+error,intendedDeg:finalBase,error,power:currentPirateId==='cyclops'?100:clamp(basePower+powerError,20,100),powerError:currentPirateId==='cyclops'?0:powerError,kind:'LEGAL HIT',profile:profile.label,clearRoute:choice.clear,legalityValidated,predictedFirstType:predictedFirst?.type||null,predictedFirstId:predictedFirst?.id??null};
  if(aiSkillLevel()>=5&&!state.breakShot){
    if(!legalityValidated)return aiEmergencyFallback('fallback target had no validated straight first contact');
    return aiValidateFinalPlan(fallback)||aiEmergencyFallback('final fallback rejected by physics robustness check');
  }
  return fallback;
}
function maybeScheduleAI(){
  if(typeof activeSceneId!=='undefined'&&activeSceneId)return;
  clearTimeout(aiTimer);clearTimeout(aiWatchdogTimer);aiWatchdogTimer=null;
  const activeAI=(gameMode==='pirate'&&aiPlayer===state?.player)||(gameMode==='aivai'&&(state?.player===1||state?.player===2));
  if(!activeAI||moving||state.frameOver||pendingChoice||shot){if(state?.player!==aiPlayer)lastBamBamTurn=false;return;}
  if(gameMode==='pirate'&&currentPirateId==='bam_bam'&&!lastBamBamTurn){bamBamVisits++;lastBamBamTurn=true;}

  if(gameMode==='aivai'){currentPirateLevel=aiVsAiLevels[state.player];currentPirateName=PIRATES[currentPirateLevel].name;aiPlayer=state.player;}
  const scheduledPlayer=state.player;
  aiThinking=true;shootBtn.disabled=true;msg.textContent=`${pname(state.player)} is sizing up the table…`;

  // V0.7.2 watchdog: once an AI turn has been scheduled it may never remain stuck in
  // "thinking". This is deliberately outside the normal planner and only fires if no
  // physical shot has begun after the normal think window.
  aiWatchdogTimer=setTimeout(()=>{
    const stillSameTurn=state&&!state.frameOver&&!moving&&!shot&&!pendingChoice&&state.player===scheduledPlayer&&aiThinking;
    if(!stillSameTurn)return;
    let pick=null;
    try{pick=aiEmergencyFallback('watchdog timeout — AI turn exceeded maximum thinking time');}catch(err){}
    if(!pick){
      const c=cue(),target=balls.find(b=>!b.potted&&b.type!=='white');
      if(target){
        const deg=Math.atan2(target.y-c.y,target.x-c.x)*180/Math.PI;
        pick={target,deg,intendedDeg:deg,error:0,power:55,powerError:0,kind:'EMERGENCY FALLBACK',profile:(aiExecutionProfile(1)).label,clearRoute:false,legalityValidated:false,predictedFirstType:null,predictedFirstId:null,emergencyReason:'watchdog absolute fallback',personalityInfluence:'DEADLOCK GUARD — watchdog forced physical shot'};
      }
    }
    if(!pick){
      aiThinking=false;playHistory.push(`AI FAILSAFE ERROR | ${pname(scheduledPlayer)} | watchdog found no object ball; forcing turn resolution`);renderPlayLog();
      // With no object ball there is no meaningful shot to play. Resolve the stale turn rather
      // than leave the UI frozen; normal rules/frame state will take over on the next update.
      state.player=opponent(state.player);updateHUD();setTimeout(maybeScheduleAI,250);return;
    }
    if(gameMode==='pirate'&&currentPirateId==='chapter2_boss')pick.power=Math.min(30,pick.power);if(gameMode==='pirate'&&bamBamWild())pick.power=Math.min(100,Math.round(pick.power*1.20));if(gameMode==='pirate'&&currentPirateId==='gimlet')pick.power=Math.min(95,Math.max(68,pick.power));setAngleDeg(pick.deg);
    pendingAIPlan={kind:pick.kind,spinContact:pick.spinContact,targetId:pick.target?.id??null,targetType:pick.target?.type??null,intendedDeg:pick.intendedDeg??pick.deg,playedDeg:pick.deg,power:pick.power};
    playHistory.push(`AI WATCHDOG | ${pname(scheduledPlayer)} | normal turn did not launch a shot in time\nAI FALLBACK: FORCED PHYSICAL SHOT • target ${pick.target.type.toUpperCase()} #${pick.target.id} • reason: ${pick.emergencyReason||'watchdog timeout'}\nCalculated aim: ${normaliseDeg(pick.deg).toFixed(1)}° | Power: ${pick.power}%`);renderPlayLog();
    msg.textContent=`${pname(scheduledPlayer)} takes an emergency shot…`;aiThinking=false;beginShot();
  },4000);

  aiTimer=setTimeout(()=>{
    if(!((gameMode==='pirate'&&aiPlayer===state?.player)||(gameMode==='aivai'&&(state?.player===1||state?.player===2)))||moving||state.frameOver||pendingChoice)return;
    let placement=null,pick=null,plannerError=null;
    try{
      placement=aiPlaceCue();
      pick=aiChooseBasicShot();
    }catch(err){
      plannerError=err;
    }
    if(!pick){
      try{pick=aiEmergencyFallback(plannerError?`planner exception: ${plannerError?.message||String(plannerError)}`:'planner unexpectedly returned no shot');}
      catch(err){plannerError=plannerError||err;}
    }
    if(!pick){
      // Do not cancel the watchdog. It is the final independent layer and will force the turn
      // to resolve even if both the normal planner and emergency planner fail.
      playHistory.push(`AI FAILSAFE WARNING | ${pname(aiPlayer)} | planner produced no shot${plannerError?` • ${plannerError?.message||String(plannerError)}`:''} • watchdog armed`);renderPlayLog();
      msg.textContent=`${pname(aiPlayer)} is forcing an emergency route…`;return;
    }
    clearTimeout(aiWatchdogTimer);aiWatchdogTimer=null;
    if(gameMode==='pirate'&&currentPirateId==='chapter2_boss')pick.power=Math.min(30,pick.power);if(gameMode==='pirate'&&bamBamWild())pick.power=Math.min(100,Math.round(pick.power*1.20));if(gameMode==='pirate'&&currentPirateId==='gimlet')pick.power=Math.min(95,Math.max(68,pick.power));setAngleDeg(pick.deg);
    const pocketNames=['top-left','top-centre','top-right','bottom-left','bottom-centre','bottom-right'];
    const planDetail=pick.kind==='DIRECT POT'?`Direct pot found: ${pick.target.type.toUpperCase()} #${pick.target.id} → ${pocketNames[pick.pocket]} pocket`:pick.kind==='COMBINATION POT'?`AI TACTIC: COMBINATION POT • ${pick.target.type.toUpperCase()} #${pick.target.id} → ${pick.secondary.type.toUpperCase()} #${pick.secondary.id} → ${pocketNames[pick.pocket]} pocket`:pick.kind==='SAFETY'?`AI TACTIC: SAFETY • target ${pick.target.type.toUpperCase()} #${pick.target.id} • no worthwhile direct pot selected`:pick.kind==='CUSHION ESCAPE'?`AI TACTIC: CUSHION ESCAPE • ${pick.rail.toUpperCase()} cushion → ${pick.target.type.toUpperCase()} #${pick.target.id}`:pick.kind==='TWO CUSHION ESCAPE'?`AI TACTIC: TWO-CUSHION ESCAPE • ${pick.rails[0].toUpperCase()} → ${pick.rails[1].toUpperCase()} cushions → ${pick.target.type.toUpperCase()} #${pick.target.id}`:pick.kind==='THREE CUSHION ESCAPE'?`AI TACTIC: THREE-CUSHION ESCAPE • ${pick.rails[0].toUpperCase()} → ${pick.rails[1].toUpperCase()} → ${pick.rails[2].toUpperCase()} cushions → ${pick.target.type.toUpperCase()} #${pick.target.id}`:pick.kind==='PERFECT ESCAPE'?`AI TACTIC: PERFECT ESCAPE SEARCH • ${pick.target.type.toUpperCase()} #${pick.target.id} • ${pick.perfectEscapeMode} • physics-validated legal first contact`:pick.kind==='EMERGENCY FALLBACK'?`AI FALLBACK: EMERGENCY SHOT • target ${pick.target.type.toUpperCase()} #${pick.target.id} • ${pick.legalityValidated?'legal straight first contact found':'no legal route found; least-bad contact attempt'} • reason: ${pick.emergencyReason}`:`No clear direct pot found • legal target: ${pick.target.type.toUpperCase()} #${pick.target.id}${pick.clearRoute===false?' • route obstructed/awkward':''}${pick.legalityValidated===false?` • LEGALITY WARNING: predicted first contact ${String(pick.predictedFirstType||'none').toUpperCase()}${pick.predictedFirstId!=null?' #'+pick.predictedFirstId:''}`:' • LEGALITY CHECK: intended ball first'}`;
    const positionDetail=pick.positionScore!=null?` • next-ball position ${pick.positionScore.toFixed(0)}${pick.estimatedCue?` • estimated white (${Math.round(pick.estimatedCue.x)}, ${Math.round(pick.estimatedCue.y)})`:''}${pick.endgameLabel?`\nENDGAME PLAN: ${pick.endgameLabel}${pick.blackRoutes!=null?` • black routes ${pick.blackRoutes}`:''}`:''}${pick.finalColourOverride?'\nENDGAME OVERRIDE: FINAL COLOUR • direct pot protected from safety veto':''}`:'';
    const rejectedDetail=pick.rejectedAttack?`\nATTACK REJECTED: ${pick.rejectedAttack.reason} • Decision: SAFETY`:'';
    const quality=pick.kind==='DIRECT POT'?`Shot quality: cut ${pick.cutDeg.toFixed(1)}° • route score ${pick.score.toFixed(0)} • in-off risk ${pick.inOffRisk?'YES':'no'}${pick.blackWinConfidence!=null?` • black win confidence ${Math.round(pick.blackWinConfidence*100)}%${pick.blackWinLock?' • WIN NOW LOCK':pick.vaperFrameKill?' • FRAME KILL':''}`:''}${pick.marginalAttack?' • marginal attack':''}${currentPirateLevel>=4?' • selected from scored legal pot routes':''}${currentPirateLevel>=5?'\nPREFLIGHT: PASS • intended target is first contact • cue path clear of pocket before contact':''}${pick.physicsSafety?`\nCUE-BALL FORECAST: ${pick.physicsSafety}`:''}${positionDetail}`:pick.kind==='COMBINATION POT'?`Combination geometry: first contact ${pick.target.type.toUpperCase()} #${pick.target.id} • cannon into ${pick.secondary.type.toUpperCase()} #${pick.secondary.id} • first cut ${pick.cutDeg.toFixed(1)}° • second cut ${pick.secondCut.toFixed(1)}° • route score ${pick.score.toFixed(0)}${pick.directAlternative!=null?` • best direct score ${pick.directAlternative.toFixed(0)} • Decision: COMBINATION preferred over direct attack`:' • no direct pot available'}`:pick.kind==='SAFETY'?`Safety estimate: opponent direct-pot opportunities ${pick.opponentPotsBefore} → ${pick.opponentPotsAfter} • estimated white (${Math.round(pick.estimatedCue.x)}, ${Math.round(pick.estimatedCue.y)}) • safety score ${pick.safetyScore.toFixed(0)}${rejectedDetail}`:pick.kind==='CUSHION ESCAPE'?`Escape geometry: bounce (${Math.round(pick.bounce.x)}, ${Math.round(pick.bounce.y)}) • route score ${pick.escapeScore.toFixed(0)} • objective: legal first contact, not a pot`:pick.kind==='TWO CUSHION ESCAPE'?`Escape geometry: bounces (${Math.round(pick.bounce1.x)}, ${Math.round(pick.bounce1.y)}) → (${Math.round(pick.bounce2.x)}, ${Math.round(pick.bounce2.y)}) • route score ${pick.escapeScore.toFixed(0)} • objective: legal first contact via two cushions`:pick.kind==='THREE CUSHION ESCAPE'?`Escape geometry: bounces (${Math.round(pick.bounces[0].x)}, ${Math.round(pick.bounces[0].y)}) → (${Math.round(pick.bounces[1].x)}, ${Math.round(pick.bounces[1].y)}) → (${Math.round(pick.bounces[2].x)}, ${Math.round(pick.bounces[2].y)}) • route score ${pick.escapeScore.toFixed(0)} • simpler legal escape routes: none • objective: legal first contact via three cushions`:pick.kind==='PERFECT ESCAPE'?`PERFECT ESCAPE: normal safety + one/two/three-cushion solvers exhausted • silent physics reproduced legal first contact on ${pick.target.type.toUpperCase()} #${pick.target.id} • cue ball survives • emergency foul fallback avoided`:pick.kind==='EMERGENCY FALLBACK'?`DEADLOCK GUARD: normal planner exhausted • this shot is intentionally allowed to foul if no legal trajectory survived the normal solvers`:'';
    const placementDetail=placement?.smart?`Ball in hand: tactical placement chosen at (${Math.round(placement.x)}, ${Math.round(placement.y)}) to create a direct pot.`:(placementMode==='none'&&placement?`Ball in hand: standard placement.`:'');
    playHistory.push(`AI PLAN | ${pname(aiPlayer)} | DIFFICULTY ${currentPirateLevel} (${pick.profile||'Basic'})\n${aiPersonalityLine(pick)}\n${placementDetail?placementDetail+'\n':''}${planDetail}${quality?'\n'+quality:''}${pick.physicsSafety&&pick.kind!=='DIRECT POT'?`\nCUE-BALL FORECAST: ${pick.physicsSafety}`:''}\nCalculated aim: ${normaliseDeg(pick.intendedDeg??pick.deg).toFixed(1)}° | Aim error: ${(pick.error||0)>=0?'+':''}${(pick.error||0).toFixed(1)}° | Played: ${normaliseDeg(pick.deg).toFixed(1)}° | Power: ${pick.power}%${pick.powerError?` (power error ${(pick.powerError>0?'+':'')+pick.powerError}%)`:''}`);renderPlayLog();
    pendingAIPlan={kind:pick.kind,spinContact:pick.spinContact,targetId:pick.target?.id??null,targetType:pick.target?.type??null,secondaryId:pick.secondary?.id??null,secondaryType:pick.secondary?.type??null,pocket:pick.pocket??null,intendedDeg:pick.intendedDeg??pick.deg,playedDeg:pick.deg,power:pick.power};
    msg.textContent=`${pname(aiPlayer)} takes the shot…`;aiThinking=false;beginShot();
  },1250);
}
const resultPirateIdentity=document.getElementById('resultPirateIdentity'),resultPiratePortrait=document.getElementById('resultPiratePortrait'),resultPirateRole=document.getElementById('resultPirateRole'),resultPirateName=document.getElementById('resultPirateName');
function refreshResultPirateIdentity(){if(!resultPirateIdentity)return;if(gameMode!=='pirate'||!currentPirateLevel){resultPirateIdentity.hidden=true;return;}const p=activePirate();resultPiratePortrait.src=p.image;resultPirateName.textContent=p.nickname?`${p.name} ${p.nickname}`:p.name;resultPirateRole.textContent=p.campaignRole==='bonus'?'SPECIAL OPPONENT':`DIFFICULTY ${p.difficulty} • ${p.role.toUpperCase()}`;resultPirateIdentity.hidden=false;}
function showWinCelebration(winner,text){
  if(gameMode==='pirate'&&activePirate()?.chapter==='chapter_4'&&winner===1){k4Victory(currentPirateId);return;}
  clearTimeout(turnOverlayTimer);turnOverlay.classList.remove('show');
  if(fiveFrameTestActive){
    fiveFrameTestCompleted++;
    playHistory.push(`=== FRAME ${fiveFrameTestCompleted} OF 5 COMPLETE • ${pname(winner)} WINS ===`);renderPlayLog();
    if(fiveFrameTestCompleted<5){
      const next=fiveFrameTestCompleted+1;
      playHistory.push(`=== FRAME ${next} OF 5 ===`);renderPlayLog();
      msg.textContent=`5-frame AI testing run — Frame ${fiveFrameTestCompleted} complete. Starting frame ${next}…`;
      setTimeout(()=>{newFrame(1);msg.textContent=`5-frame AI testing run — Frame ${next} of 5. Captain Blackball vs Darth Vaper.`;},900);
      return;
    }
    fiveFrameTestActive=false;currentScenario=null;
    if(resultPirateIdentity)resultPirateIdentity.hidden=true;
    soundFiveFrameComplete();
    winTitle.textContent='5-frame AI testing run complete!';
    winText.textContent='DING DING DING DING DING! All 5 Captain Blackball vs Darth Vaper frames are complete.';
    winModal.hidden=false;return;
  }
  if(gameMode==='pirate'&&winner===1&&['legolass','aragoon','souronion','blockbeard'].includes(currentPirateId)){
    const flag=currentPirateId+'VictorySeen',ch3=chapterState('chapter_3');
    if(!ch3[flag]){ch3.pendingVictoryScene=currentPirateId;saveCareer();soundVictory();if(gameApp)gameApp.hidden=true;
      showScene('chapter_3_'+currentPirateId+'_victory',()=>{const completed=chapterState('chapter_3');completed[flag]=true;delete completed.pendingVictoryScene;saveCareer();if(currentPirateId==='blockbeard'){completeChapter('chapter_3');chapterState('chapter_3').endingSeen=true;saveCareer();}forcedTableTheme=null;startMenuMusic();showPirateRosterAfterStory();});return;}
  }
  if(gameMode==='pirate'&&currentPirateId==='barley'&&winner===1&&!chapterState('chapter_3').barleyVictorySeen){const ch3=chapterState('chapter_3');ch3.pendingVictoryScene='barley';saveCareer();soundVictory();if(gameApp)gameApp.hidden=true;showScene('chapter_3_barley_victory',()=>{const completed=chapterState('chapter_3');completed.barleyVictorySeen=true;delete completed.pendingVictoryScene;saveCareer();forcedTableTheme=null;startMenuMusic();showPirateRosterAfterStory();});return;}
  if(gameMode==='pirate'&&currentPirateId==='blackball'&&winner===1&&!chapterSceneSeen('chapter_1','ending')){showBlackballFirstVictory();return;}
  if(winner===1&&pendingChapter2BossReveal&&!chapterState('chapter_2').bossIntroSeen){pendingChapter2BossReveal=false;soundVictory();runChapterScene('chapter_2','bossIntro',()=>{applyChapter2BossIdentity();renderPirateRoster();startMenuMusic();showPirateRosterAfterStory();});return;}
  if(winner===1&&gameMode==='pirate'&&currentPirateId==='chapter2_boss'&&!chapterState('chapter_2').endingSeen){const ch2=chapterState('chapter_2');ch2.endingPending=true;saveCareer();soundVictory();startOutroMusic();runChapterScene('chapter_2','ending',()=>{chapterState('chapter_2').endingPending=false;completeChapter('chapter_2');forcedTableTheme=null;refreshPirateButtons();refreshCosmeticsUI?.();startMenuMusic();showTitleScreen();});return;}
  soundVictory();refreshResultPirateIdentity();winTitle.textContent=`${pname(winner)} wins!`;winText.textContent=text;const winRewards=document.getElementById('winRewards');if(winRewards){const showReward=winner===1&&gameMode==='pirate'&&currentPirateLevel<5&&pendingPirateReward;winRewards.hidden=!showReward;winRewards.innerHTML=showReward?rewardSummaryHTML(pendingPirateReward):'';}winModal.hidden=false;
}
playAgain.onclick=()=>{winModal.hidden=true;pendingPirateReward=null;forcedTableTheme=gameMode==='pirate'?campaignMatchTableTheme(activePirate()):null;restartCurrentGame(1);};
returnMenu.onclick=()=>{winModal.hidden=true;pendingPirateReward=null;forcedTableTheme=null;startMenuMusic();if(gameMode==='pirate')showPirateRosterAfterStory();else showTitleScreen();};

let gameLogReturn='result';
function openGameLog(from='result'){gameLogReturn=from;gameLogModalText.textContent=playHistory.length?playHistory.join('\n\n'):'No shots recorded yet.';if(copyGameLogStatus)copyGameLogStatus.textContent='';if(copyGameLog){copyGameLog.textContent='Select all and copy';copyGameLog.classList.remove('copied');}winModal.hidden=true;gameLogModal.hidden=false;closeGameLog.textContent=from==='menu'?'Back to Game menu':'Back to result';}
showGameLog.onclick=()=>openGameLog();
copyGameLog.onclick=async()=>{const text=gameLogModalText.textContent||'';try{if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(text);}else{const range=document.createRange();range.selectNodeContents(gameLogModalText);const sel=window.getSelection();sel.removeAllRanges();sel.addRange(range);const ok=document.execCommand('copy');if(!ok)throw new Error('copy failed');}copyGameLog.textContent='Copied! ✓';copyGameLog.classList.add('copied');copyGameLogStatus.textContent='Entire game log selected and copied to clipboard.';}catch(err){const range=document.createRange();range.selectNodeContents(gameLogModalText);const sel=window.getSelection();sel.removeAllRanges();sel.addRange(range);copyGameLog.textContent='Selected — press Ctrl+C';copyGameLogStatus.textContent='Automatic copy was blocked by this browser, so the full log has been selected for you.';}};
closeGameLog.onclick=()=>{gameLogModal.hidden=true;if(gameLogReturn==='menu')gameMenuModal.hidden=false;else winModal.hidden=false;};
function showModeMenu(){resetCueSpin();fiveFrameTestActive=false;fiveFrameTestCompleted=0;currentScenario=null;playersModal.hidden=false;modeMenu.hidden=false;playersForm.hidden=true;piratePlaceholder.hidden=true;if(testScenarioMenu)testScenarioMenu.hidden=true;if(aiVsAiMenu)aiVsAiMenu.hidden=true;refreshPirateButtons();}
function populateAiVsAi(){for(const sel of [aiVsAiP1,aiVsAiP2]){sel.innerHTML='';for(let i=1;i<=7;i++){const o=document.createElement('option');o.value=i;o.textContent=`${PIRATES[i].name} — ${i<=5?'Difficulty '+i:PIRATES[i].role}`;sel.appendChild(o);}}aiVsAiP1.value='5';aiVsAiP2.value='5';}
aiVsAiMode.onclick=()=>{audioReady();currentScenario=null;populateAiVsAi();modeMenu.hidden=true;playersForm.hidden=true;piratePlaceholder.hidden=true;if(testScenarioMenu)testScenarioMenu.hidden=true;aiVsAiMenu.hidden=false;};
aiVsAiBack.onclick=()=>showModeMenu();
startAiVsAi.onclick=()=>{startMatchMusic();if(gameApp)gameApp.hidden=false;const l1=Number(aiVsAiP1.value),l2=Number(aiVsAiP2.value);aiVsAiLevels={1:l1,2:l2};gameMode='aivai';aiPlayer=1;currentScenario=null;playerNames={1:PIRATES[l1].name,2:PIRATES[l2].name};playersModal.hidden=true;aiVsAiMenu.hidden=true;audioReady();newFrame(1);};
localMode.onclick=()=>{audioReady();currentScenario=null;gameMode='local';aiPlayer=null;modeMenu.hidden=true;playersForm.hidden=false;piratePlaceholder.hidden=true;player1Name.focus();};
pirateMode.onclick=()=>{audioReady();currentScenario=null;refreshPirateButtons();modeMenu.hidden=true;playersForm.hidden=true;if(testScenarioMenu)testScenarioMenu.hidden=true;const chapterOne=chapterState('chapter_1');if(theatreBusy())return;if(chapterSceneSeen('chapter_1','intro'))theatreTrace('already-completed','chapter_1_intro',{progressEvidence:!chapterOne.introSeen});if(!chapterSceneSeen('chapter_1','intro')){piratePlaceholder.hidden=true;playersModal.hidden=true;runChapterScene('chapter_1','intro',()=>{showPirateRosterAfterStory();});return;}const chapterTwo=chapterState('chapter_2');
if(chapterIsUnlocked('chapter_4')&&k4PendingVictory()){playersModal.hidden=true;k4Victory(k4PendingVictory());return;}
const pendingVictory=chapterState('chapter_3').pendingVictoryScene;
if(chapterIsUnlocked('chapter_3')&&['barley','legolass','aragoon','souronion','blockbeard'].includes(pendingVictory)&&pirateDefeated(pendingVictory)){
 playersModal.hidden=true;showScene('chapter_3_'+pendingVictory+'_victory',()=>{const ch=chapterState('chapter_3');ch[pendingVictory+'VictorySeen']=true;delete ch.pendingVictoryScene;if(pendingVictory==='blockbeard'){completeChapter('chapter_3');chapterState('chapter_3').endingSeen=true;}saveCareer();showPirateRosterAfterStory();});return;
}
if(pirateDefeated('blackball')&&!chapterSceneSeen('chapter_1','ending')){playersModal.hidden=true;showBlackballFirstVictory();return;}
if(chapterIsUnlocked('chapter_2')&&pirateDefeated('chapter2_boss')&&!chapterTwo.endingSeen)chapterTwo.endingPending=true;
if(chapterTwo.endingPending&&!chapterTwo.endingSeen){piratePlaceholder.hidden=true;playersModal.hidden=true;runChapterScene('chapter_2','ending',()=>{chapterState('chapter_2').endingPending=false;completeChapter('chapter_2');startMenuMusic();showTitleScreen();});return;}if(chapterSceneSeen('chapter_2','intro')&&pirateDefeated('papa_surf')&&!chapterSceneSeen('chapter_2','bossIntro')){piratePlaceholder.hidden=true;playersModal.hidden=true;runChapterScene('chapter_2','bossIntro',()=>{applyChapter2BossIdentity();startMenuMusic();playersModal.hidden=false;modeMenu.hidden=true;playersForm.hidden=true;piratePlaceholder.hidden=false;renderPirateRoster();piratePlayerName?.focus();});return;}piratePlaceholder.hidden=false;piratePlayerName?.focus();refreshFirstRunGuidance();};
testMode.onclick=()=>{audioReady();modeMenu.hidden=true;playersForm.hidden=true;piratePlaceholder.hidden=true;testScenarioMenu.hidden=false;nightmareScenario.disabled=!devScenariosUnlocked;cannonScenario.disabled=!devScenariosUnlocked;if(fiveFrameScenario)fiveFrameScenario.disabled=!devScenariosUnlocked;testPlayerName?.focus();};
testBack.onclick=showModeMenu;nightmareScenario.onclick=()=>{if(devScenariosUnlocked){startMatchMusic();startScenario('nightmare');}};cannonScenario.onclick=()=>{if(devScenariosUnlocked){startMatchMusic();startScenario('cannon');}};if(fiveFrameScenario)fiveFrameScenario.onclick=()=>{if(devScenariosUnlocked){startMatchMusic();startFiveFrameTest();}};
backToMode.onclick=showTitleScreen;pirateBack.onclick=()=>{
 piratePlayerName.value=storyPlayerName();piratePlayerName.defaultValue=storyPlayerName();
 if(storyRenameFromSettings){storyRenameFromSettings=false;piratePlaceholder.classList.remove('story-name-only');pirateBack.textContent='Back';playersModal.hidden=true;settingsModal.hidden=false;renderPirateRoster();syncStoryNameSettings();}
 else showTitleScreen();
};
playersForm.addEventListener('submit',e=>{e.preventDefault();startMatchMusic();if(gameApp)gameApp.hidden=false;playerNames={1:player1Name.value.trim()||'Player 1',2:player2Name.value.trim()||'Player 2'};audioReady();playersModal.hidden=true;newFrame(1);});
const pirateProfileModal=document.getElementById('pirateProfileModal'),pirateProfileName=document.getElementById('pirateProfileName'),pirateProfileFullName=document.getElementById('pirateProfileFullName'),pirateProfileDifficulty=document.getElementById('pirateProfileDifficulty'),pirateProfileStyle=document.getElementById('pirateProfileStyle'),pirateProfileBio=document.getElementById('pirateProfileBio'),pirateProfileReputation=document.getElementById('pirateProfileReputation'),piratePortrait=document.getElementById('piratePortrait'),challengePirate=document.getElementById('challengePirate'),closePirateProfile=document.getElementById('closePirateProfile');
const pirateIntroModal=document.getElementById('pirateIntroModal'),matchIntroPortrait=document.getElementById('matchIntroPortrait'),matchIntroKicker=document.getElementById('matchIntroKicker'),matchIntroName=document.getElementById('matchIntroName'),matchIntroLine=document.getElementById('matchIntroLine'),startPirateMatch=document.getElementById('startPirateMatch');
// V0.8.7: keep the pre-match introduction outside the hidden gameplay tree.
// This lets Challenge show the intro while the table remains completely hidden until Rack 'em up! is pressed.
if(pirateIntroModal && pirateIntroModal.parentElement!==document.body) document.body.appendChild(pirateIntroModal);
let pendingPirateStart=null,pendingChapter2BossReveal=false;
let profiledPirateId='dave';
function showPirateProfile(pirateId){if(theatreBusy())return;const p=pirateById(pirateId);if(!p)return;profiledPirateId=p.id;const open=pirateIsOpen(p);pirateProfileFullName.textContent=p.fullName;pirateProfileName.textContent=p.nickname?`${p.name} ${p.nickname}`:p.name;pirateProfileDifficulty.textContent=`${p.campaignRole==='bonus'?'SPECIAL':'DIFFICULTY '+p.difficulty} • ${p.role}`;pirateProfileStyle.textContent=p.style;pirateProfileBio.textContent=p.bio;const rewardNames=(p.rewards||[]).map(r=>COSMETICS[r.type==='table'?'tables':`${r.type}s`]?.[r.id]?.name).filter(Boolean);pirateProfileReputation.textContent=`${p.reputation}${rewardNames.length?` Reward: ${rewardNames.join(' + ')}.`:''}`;piratePortrait.style.backgroundImage=p.id==='spinball_wizard'?"url('assets/k4/08_Spinball_Wizard_Lair_Theatre.png')":'';piratePortrait.style.backgroundSize='cover';piratePortrait.innerHTML=`${p.image?`<img src="${p.image}" alt="" draggable="false">`:''}<span class="portrait-fallback">${p.portrait}</span>`;const sceneId=p.scene||chapterById(p.chapter)?.scenes?.intro;challengePirate.disabled=!open||(p.playable===false&&!sceneId);challengePirate.textContent=!open?'Locked 🔒':(p.playable===false&&sceneId?'View scene':(p.playable===false?'Coming soon':'Challenge'));pirateProfileModal.hidden=false;refreshFirstRunGuidance();}
const blackballStory=document.getElementById('blackballStory'),blackballStoryTitle=document.getElementById('blackballStoryTitle'),blackballStoryText=document.getElementById('blackballStoryText'),blackballStoryNext=document.getElementById('blackballStoryNext');
/* V0.17.0 Phase 5B: layered catalogue-driven story scenes.
   Each scene owns a small asset library (backgrounds / characters / props). Dialogue beats choose
   which assets are visible and may request deliberately simple South-Park-style motion. */
const SCENES={
  ...window.SeamenChapter4.scenes,
  supporter_vaper_intro:{id:'supporter_vaper_intro',chapter:'chapter_1',kicker:'SUPPORTER CHALLENGE',title:'Darth Vaper',finishLabel:'Rack ’em up!',typewriterMs:22,finishFadeMs:1625,theatreEffects:true,
    assets:{backgrounds:{control:{src:'assets/scenes/supporter-vaper-control-room.webp'}},characters:{},props:{}},
    lines:[
      {speaker:'Narrator',text:'Beyond the tavern, an improbable control room hums with blue lights. A thick fog rolls across the floor.',stage:{background:'control',characters:[]}},
      {speaker:'Captain Blackball',text:'Good heavens! Is your ship on fire?!',stage:{background:'control',characters:[]}},
      {speaker:'Darth Vaper',text:'No. Blueberry ice.',stage:{background:'control',characters:[]}},
      {speaker:'Captain Blackball',text:'I CAN’T EVEN SEE THE BLOODY TABLE!',stage:{background:'control',characters:[]}},
      {speaker:'Darth Vaper',text:'Then you have already lost.',stage:{background:'control',characters:[]}}]},
  supporter_pokey_intro:{id:'supporter_pokey_intro',chapter:'chapter_2',kicker:'SUPPORTER CHALLENGE',title:'Pokey Man',finishLabel:'Rack ’em up!',typewriterMs:22,finishFadeMs:1625,theatreEffects:true,
    assets:{backgrounds:{centre:{src:'assets/scenes/supporter-pokey-centre.webp'}},characters:{blackball:{src:'assets/scenes/captain-blackball-main.png',alt:'Captain Blackball',x:22,y:90,width:34,anchor:'bottom-center'},pokey:{src:'assets/portraits/pokey-man.png',alt:'Pokey Man',x:76,y:91,width:30,anchor:'bottom-center'}},props:{}},
    lines:[
      {"speaker": "Narrator", "text": "An oddly familiar red-roofed building stands in a sunny clearing. There is no explanation of what it is for and it sticks out like a sore thumb.", "stage": {"background": "centre", "characters": []}},
      {"speaker": "Captain Blackball", "text": "Ahoy! What is this forsaken place?", "stage": {"background": "centre", "characters": ["blackball"]}},
      {"speaker": "Pokey Man", "text": "...", "stage": {"background": "centre", "characters": ["blackball", "pokey"]}},
      {"speaker": "Captain Blackball", "text": "Is that all you can tell me?", "stage": {"background": "centre", "characters": ["blackball", "pokey"]}},
      {"speaker": "Pokey Man", "text": "I wanna...", "stage": {"background": "centre", "characters": ["blackball", "pokey"]}},
      {"speaker": "Captain Blackball", "text": "You want to tell me something? Spit it out lad. Spit it all out.", "stage": {"background": "centre", "characters": ["blackball", "pokey"]}},
      {"speaker": "Pokey Man", "text": "I WANNA BE... REALLY GOOD", "stage": {"background": "centre", "characters": ["blackball", "pokey"]}, "pokeySong": true},
      {"speaker": "Pokey Man", "text": "LIKE NO-ONE EVER SHOULD!", "stage": {"background": "centre", "characters": ["blackball", "pokey"]}, "pokeySong": true},
      {"speaker": "Pokey Man", "text": "TO CATCH IT IS MY REAL QUEST", "stage": {"background": "centre", "characters": ["blackball", "pokey"]}, "pokeySong": true},
      {"speaker": "Pokey Man", "text": "TO PLAY IT WITH MY WOOD", "stage": {"background": "centre", "characters": ["blackball", "pokey"]}, "pokeySong": true},
      {"speaker": "Captain Blackball", "text": "...Mate I'm not following you here-", "stage": {"background": "centre", "characters": ["blackball", "pokey"]}},
      {"speaker": "Pokey Man", "text": "POKEY MAN! IT'S ME, IT'S ME!", "stage": {"background": "centre", "characters": ["blackball", "pokey"]}, "pokeySong": true},
      {"speaker": "Pokey Man", "text": "I FEEL IT WITHIN MY KNEES, POKEY MAN-", "stage": {"background": "centre", "characters": ["blackball", "pokey"]}, "pokeySong": true},
      {"speaker": "Pokey Man", "text": "OooOoOoOOOOOOOO I'M MY BEST FRIEND", "stage": {"background": "centre", "characters": ["blackball", "pokey"]}, "pokeySong": true},
      {"speaker": "Pokey Man", "text": "COS I HAVE NO OTHER FRIENDS!", "stage": {"background": "centre", "characters": ["blackball", "pokey"]}, "pokeySong": true},
      {"speaker": "Captain Blackball", "text": "I noticed.", "stage": {"background": "centre", "characters": ["blackball", "pokey"]}},
      {"speaker": "Pokey Man", "text": "POKEY MAN!", "stage": {"background": "centre", "characters": ["blackball", "pokey"]}, "pokeySong": true},
      {"speaker": "Captain Blackball", "text": "Thanks. How's about a game of pool?", "stage": {"background": "centre", "characters": ["blackball", "pokey"]}},
      {"speaker": "Narrator", "text": "Pokey Man nods silently, and then the match begins as normal.", "stage": {"background": "centre", "characters": ["blackball", "pokey"]}}]},

  chapter_3_arrival:{
    id:'chapter_3_arrival',chapter:'chapter_3',kicker:'CHAPTER 3',title:'The Blockbeard Chronicles',finishLabel:'Next',typewriterMs:22,finishFadeMs:1625,theatreEffects:true,
    assets:{backgrounds:{cave:{src:'assets/scenes/ch3-mysterious-cave.webp'},home:{src:'assets/scenes/ch3-barley-home.webp'}},characters:{blackball:{src:'assets/scenes/captain-blackball-main.png',alt:'Captain Blackball',x:22,y:88,width:36,anchor:'bottom-center'},blockbeard:{src:'assets/scenes/ch3-blockbeard.png',alt:'Cave carver',x:75,y:90,width:35,anchor:'bottom-center'},barley:{src:'assets/scenes/ch3-barley.png',alt:'Barley',x:75,y:90,width:35,anchor:'bottom-center'}},props:{}},
    lines:[
      {speaker:"Narrator",text:"At the end of a long voyage, a darker cave, and several profoundly unhelpful directions, our heroes stumble upon a chance encounter of a man making a cave less cavey.",stage:{background:"cave",characters:["blackball", "blockbeard"]}},
      {speaker:"Captain Blackball",text:"Ahoy there! You there with the pickaxe!",stage:{background:"cave",characters:["blackball", "blockbeard"]}},
      {speaker:"Blockbeard",text:"Ahoy! Mind yer step. I'm carving this place into a nice, square dimension. Nothing more satisfying than a properly straight corner. Delicious, chop, chop chop.",stage:{background:"cave",characters:["blackball", "blockbeard"]}},
      {speaker:"Captain Blackball",text:"Are caves meant to have square corners? My caves don't. Did you really just say chop, chop chop?",stage:{background:"cave",characters:["blackball", "blockbeard"]}},
      {speaker:"Blockbeard",text:"Yours don't.",stage:{background:"cave",characters:["blackball", "blockbeard"]}},
      {speaker:"Captain Blackball",text:"And why are YOU all square? Is this some sort of square-loving fantasy dimension where everyone is some sort of cubelike entity?",stage:{background:"cave",characters:["blackball", "blockbeard"]}},
      {speaker:"Blockbeard",text:"Can't speak for everyone, potato face. I mostly just work down here. For free as well, I'll have you know. Used to be a pirate like you, but then I took an oblong to the elbow.",stage:{background:"cave",characters:["blackball", "blockbeard"]}},
      {speaker:"Captain Blackball",text:"A cubic pirate in a cave, carving squares... for free. Perfectly ordinary. Listen, we're searching for a legendary Golden Cue.",stage:{background:"cave",characters:["blackball", "blockbeard"]}},
      {speaker:"Blockbeard",text:"Golden, eh? Plenty of strange stories about this place. Probably because it's strange, or unique. I prefer unique. Ye might start with Barley Bramblebottom. Doesn't like visitors, mind. But loves potatoes, so go show him your face.",stage:{background:"cave",characters:["blackball", "blockbeard"]}},
      {speaker:"Captain Blackball",text:"Is he square as well?",stage:{background:"cave",characters:["blackball", "blockbeard"]}},
      {speaker:"Blockbeard",text:"Depends how much he's eaten. Follow the passage and careful yourself with the low ceiling.",stage:{background:"cave",characters:["blackball", "blockbeard"]}},
      {speaker:"Captain Blackball",text:"Come along, matey. If the rest of the island looks like him, we'll know we're in a land strange enough to be mystical enough to have what we desire.",stage:{background:"cave",characters:["blackball", "blockbeard"]}},
      {speaker:"Captain Blackball",text:"Oh! People! Well... small people. At least they look almost normal. Perhaps that square chap was an unfortunate right-angled accident.",stage:{background:"home",characters:["blackball", "barley"]}},
      {speaker:"Barley",text:"Visitors! Argh! I was just getting ready for second breakfast. Or early lunch. Depends whether you've already had the first one. Nice face mate.",stage:{background:"home",characters:["blackball", "barley"]}},
      {speaker:"Captain Blackball",text:"Why are you dressed like a medieval farmhand?",stage:{background:"home",characters:["blackball", "barley"]}},
      {speaker:"Barley",text:"Because I am a farmer, potato boy! And these are my turnips. Want to know their names?",stage:{background:"home",characters:["blackball", "barley"]}},
      {speaker:"Captain Blackball",text:"Of course you are, and no I don't. So this is a truly ancient kingdom full of elves, knights and relics. Actually... that makes sense. Where else would they keep a Golden Cue?",stage:{background:"home",characters:["blackball", "barley"]}},
      {speaker:"Barley",text:"You talking to me? Golden cue, is that a vegetable?",stage:{background:"home",characters:["blackball", "barley"]}},
      {speaker:"Captain Blackball",text:"I'm beginning to regret leaving the boat.",stage:{background:"home",characters:["blackball", "barley"]}}
    ]
  },
  chapter_3_barley_challenge:{id:"chapter_3_barley_challenge",chapter:"chapter_3",kicker:"CHAPTER 3",title:"Barley Bramblebottom",finishLabel:"Start the match",typewriterMs:22,finishFadeMs:1625,theatreEffects:true,assets:{backgrounds:{home:{src:"assets/scenes/ch3-barley-home.webp"}},characters:{blackball:{src:"assets/scenes/captain-blackball-main.png",alt:"Captain Blackball",x:22,y:88,width:36,anchor:"bottom-center"},barley:{src:"assets/scenes/ch3-barley.png",alt:"Barley",x:75,y:90,width:35,anchor:"bottom-center"}},props:{}},lines:[
      {speaker:"Barley",text:"Before we start, have you eaten? It's terribly hard to aim on an empty stomach. Can you eat your own face? Mmmmmmmm!",stage:{background:"home",characters:["blackball","barley"]}},
      {speaker:"Captain Blackball",text:"We had ship's biscuits. Three weeks ago. We're looking for a Golden Cue, not a dinner invitation.",stage:{background:"home",characters:["blackball","barley"]}},
      {speaker:"Barley",text:"Goodness! Then this is practically a medical emergency. I'll fetch a carrot. Ever made a stew out of your own face?",stage:{background:"home",characters:["blackball","barley"]}},
      {speaker:"Captain Blackball",text:"You appear to be HOLDING a carrot already.",stage:{background:"home",characters:["blackball","barley"]}},
      {speaker:"Barley",text:"Only my wife calls it that. Oh hang on... you mean this? That's my cue! I wouldn't eat that. Well, not before a match.",stage:{background:"home",characters:["blackball","barley"]}},
      {speaker:"Captain Blackball",text:"My friend will play you. I'll supervise the... vegetables.",stage:{background:"home",characters:["blackball","barley"]}}
  ]},
  chapter_3_legolass_challenge:{"id":"chapter_3_legolass_challenge","chapter":"chapter_3","kicker":"CHAPTER 3","title":"Legolass","finishLabel":"Start the match","typewriterMs":22,"finishFadeMs":1625,"theatreEffects":true,"assets":{"backgrounds":{"glade":{"src":"assets/scenes/ch3-glade.webp"}},"characters":{"blackball":{"src":"assets/scenes/captain-blackball-main.png","alt":"Captain Blackball","x":22,"y":88,"width":36,"anchor":"bottom-center"},"legolass":{"src":"assets/scenes/ch3-legolass.png","alt":"Legolass","x":75,"y":90,"width":35,"anchor":"bottom-center"}},"props":{}},"lines":[{"speaker":"Legolass","text":"I heard your approach three valleys away. The wind told me of your coming.","stage":{"background":"glade","characters":["blackball","legolass"]}},{"speaker":"Captain Blackball","text":"That'll be my knees. Long voyage. Also, that's not wind - you're indoors, and your air con is on full blast. Are you an elf or...what?","stage":{"background":"glade","characters":["blackball","legolass"]}},{"speaker":"Legolass","text":"I am Legolass, daughter of the silver woodland, mistress of the farthest arrow.","stage":{"background":"glade","characters":["blackball","legolass"]}},{"speaker":"Captain Blackball","text":"Right. You look like someone made you out of little building bricks.","stage":{"background":"glade","characters":["blackball","legolass"]}},{"speaker":"Legolass","text":"Our forms are but vessels for ancient wisdom. And I know who you are.","stage":{"background":"glade","characters":["blackball","legolass"]}},{"speaker":"Captain Blackball","text":"How do you know who... forget it. Does your ancient wisdom know where I can find a... Golden Cue?","stage":{"background":"glade","characters":["blackball","legolass"]}},{"speaker":"Legolass","text":"A gilded shaft of destiny, sung of by the eldest stars. Its line is true, its purpose—","stage":{"background":"glade","characters":["blackball","legolass"]}},{"speaker":"Captain Blackball","text":"Lovely. Can you point to it?","stage":{"background":"glade","characters":["blackball","legolass"]}},{"speaker":"Legolass","text":"First, prove the steadiness of your hand against mine.","stage":{"background":"glade","characters":["blackball","legolass"]}},{"speaker":"Captain Blackball","text":"I haven't brought my hand. I've brought my friend.","stage":{"background":"glade","characters":["blackball","legolass"]}}]},
  chapter_3_legolass_victory:{"id":"chapter_3_legolass_victory","chapter":"chapter_3","kicker":"CHAPTER 3","title":"Legolass","finishLabel":"Return to roster","typewriterMs":22,"finishFadeMs":1625,"theatreEffects":true,"assets":{"backgrounds":{"glade":{"src":"assets/scenes/ch3-glade.webp"}},"characters":{"blackball":{"src":"assets/scenes/captain-blackball-main.png","alt":"Captain Blackball","x":22,"y":88,"width":36,"anchor":"bottom-center"},"legolass":{"src":"assets/scenes/ch3-legolass.png","alt":"Legolass","x":75,"y":90,"width":35,"anchor":"bottom-center"}},"props":{}},"lines":[{"speaker":"Legolass","text":"A most inelegant victory. Yet victory it remains.","stage":{"background":"glade","characters":["blackball","legolass"]}},{"speaker":"Captain Blackball","text":"That's what happens when you pot the black instead of giving a speech about it.","stage":{"background":"glade","characters":["blackball","legolass"]}},{"speaker":"Legolass","text":"Seek Aragoon, ranger of the old road. He follows the tracks of one who covets golden relics.","stage":{"background":"glade","characters":["blackball","legolass"]}},{"speaker":"Captain Blackball","text":"A useful sentence! Finally.","stage":{"background":"glade","characters":["blackball","legolass"]}},{"speaker":"Legolass","text":"But beware: the path is long, and shadow—","stage":{"background":"glade","characters":["blackball","legolass"]}},{"speaker":"Captain Blackball","text":"Yes, yes. Shadow. Very ominous. Come along.","stage":{"background":"glade","characters":["blackball","legolass"]}}]},
  chapter_3_aragoon_challenge:{"id":"chapter_3_aragoon_challenge","chapter":"chapter_3","kicker":"CHAPTER 3","title":"Aragoon","finishLabel":"Start the match","typewriterMs":22,"finishFadeMs":1625,"theatreEffects":true,"assets":{"backgrounds":{"camp":{"src":"assets/scenes/ch3-camp.webp"}},"characters":{"blackball":{"src":"assets/scenes/captain-blackball-main.png","alt":"Captain Blackball","x":22,"y":88,"width":36,"anchor":"bottom-center"},"aragoon":{"src":"assets/scenes/ch3-aragoon.png","alt":"Aragoon","x":75,"y":90,"width":35,"anchor":"bottom-center"}},"props":{}},"lines":[{"speaker":"Aragoon","text":"You should not have come this way.","stage":{"background":"camp","characters":["blackball","aragoon"]}},{"speaker":"Captain Blackball","text":"Then put up a sign. Oh. You have. It points the wrong way.","stage":{"background":"camp","characters":["blackball","aragoon"]}},{"speaker":"Aragoon","text":"I am Aragoon. Son of Araprune,","stage":{"background":"camp","characters":["blackball","aragoon"]}},{"speaker":"Aragoon","text":"son of Aracroon,","stage":{"background":"camp","characters":["blackball","aragoon"]}},{"speaker":"Aragoon","text":"son of Araloon,","stage":{"background":"camp","characters":["blackball","aragoon"]}},{"speaker":"Aragoon","text":"son of Araswoon (I could go on),","stage":{"background":"camp","characters":["blackball","aragoon"]}},{"speaker":"Aragoon","text":"son of Arafffffffoon,","stage":{"background":"camp","characters":["blackball","aragoon"]}},{"speaker":"Aragoon","text":"son of Araspoon,","stage":{"background":"camp","characters":["blackball","aragoon"]}},{"speaker":"Aragoon","text":"son of Aramonth-of-June,","stage":{"background":"camp","characters":["blackball","aragoon"]}},{"speaker":"Aragoon","text":"son of Aramoon--","stage":{"background":"camp","characters":["blackball","aragoon"]}},{"speaker":"Captain Blackball","text":"ENOUGH! I beg you!","stage":{"background":"camp","characters":["blackball","aragoon"]}},{"speaker":"Aragoon","text":"...Heir to the throne of—","stage":{"background":"camp","characters":["blackball","aragoon"]}},{"speaker":"Captain Blackball","text":"NO FAMILY TREES I SAY! Just get to the point please, little wood scout. Tell me what you know of the Golden Cue.","stage":{"background":"camp","characters":["blackball","aragoon"]}},{"speaker":"Aragoon","text":"I know of a dark collector beyond the weeping fields. But first, your companion must prove worthy of my trust.","stage":{"background":"camp","characters":["blackball","aragoon"]}},{"speaker":"Captain Blackball","text":"At pool, I assume. Because nobody in this world can simply have a conversation.","stage":{"background":"camp","characters":["blackball","aragoon"]}},{"speaker":"Aragoon","text":"The ancient contest of spheres shall decide. May this be the moment we collide our brightly-coloured balls in battle together.","stage":{"background":"camp","characters":["blackball","aragoon"]}},{"speaker":"Captain Blackball","text":"Pool. It's called pool.","stage":{"background":"camp","characters":["blackball","aragoon"]}}]},
  chapter_3_aragoon_victory:{"id":"chapter_3_aragoon_victory","chapter":"chapter_3","kicker":"CHAPTER 3","title":"Aragoon","finishLabel":"Return to roster","typewriterMs":22,"finishFadeMs":1625,"theatreEffects":true,"assets":{"backgrounds":{"camp":{"src":"assets/scenes/ch3-camp.webp"}},"characters":{"blackball":{"src":"assets/scenes/captain-blackball-main.png","alt":"Captain Blackball","x":22,"y":88,"width":36,"anchor":"bottom-center"},"aragoon":{"src":"assets/scenes/ch3-aragoon.png","alt":"Aragoon","x":75,"y":90,"width":35,"anchor":"bottom-center"}},"props":{}},"lines":[{"speaker":"Aragoon","text":"Your companion has skill. And patience. More patience than you, Captain of potatoes.","stage":{"background":"camp","characters":["blackball","aragoon"]}},{"speaker":"Captain Blackball","text":"I've listened to eight generations of your ancestors. My patience is a national treasure.","stage":{"background":"camp","characters":["blackball","aragoon"]}},{"speaker":"Aragoon","text":"A potato treasure I'm sure. Anyway, now you've finally shut up about potatoes, I'll continue. The collector of magnificent relics is Lord Souronion. His fortress lies beyond the weeping fields.","stage":{"background":"camp","characters":["blackball","aragoon"]}},{"speaker":"Captain Blackball","text":"Weeping fields?","stage":{"background":"camp","characters":["blackball","aragoon"]}},{"speaker":"Aragoon","text":"You will understand when you smell them.","stage":{"background":"camp","characters":["blackball","aragoon"]}},{"speaker":"Captain Blackball","text":"I wish people would stop saying things like that.","stage":{"background":"camp","characters":["blackball","aragoon"]}},{"speaker":"Aragoon","text":"You have my trust. Should you ever need of me, o' potato lover, call upon the name of Aragoon, son of—","stage":{"background":"camp","characters":["blackball","aragoon"]}},{"speaker":"Captain Blackball","text":"On yer bike son, I've got business with this Lord of yours.","stage":{"background":"camp","characters":["blackball","aragoon"]}}]},
  chapter_3_souronion_challenge:{"id":"chapter_3_souronion_challenge","chapter":"chapter_3","kicker":"CHAPTER 3","title":"Lord Souronion","finishLabel":"Start the match","typewriterMs":22,"finishFadeMs":1625,"theatreEffects":true,"assets":{"backgrounds":{"war":{"src":"assets/scenes/ch3-war.webp"}},"characters":{"blackball":{"src":"assets/scenes/captain-blackball-main.png","alt":"Captain Blackball","x":22,"y":88,"width":36,"anchor":"bottom-center"},"souronion":{"src":"assets/scenes/ch3-lord_souronion.png","alt":"Lord Souronion","x":75,"y":90,"width":35,"anchor":"bottom-center"}},"props":{}},"lines":[{"speaker":"Lord Souronion","text":"WHO DARES ENTER THE DOMAIN OF LORD SOURONION, BRINGER OF TEARS?","stage":{"background":"war","characters":["blackball","souronion"]}},{"speaker":"Captain Blackball","text":"Captain Blackball. And this is my friend, who does all the difficult bits.","stage":{"background":"war","characters":["blackball","souronion"]}},{"speaker":"Lord Souronion","text":"I AM THE DARK LORD OF MANY NAMES! TITLES! PSEUDONYMS! ALIASES! AND, WHEN APPROPRIATE, SYNONYMS!","stage":{"background":"war","characters":["blackball","souronion"]}},{"speaker":"Captain Blackball","text":"Have you got one I can actually remember?","stage":{"background":"war","characters":["blackball","souronion"]}},{"speaker":"Lord Souronion","text":"MOST KNOW ME AS... u/lordsouronion1337.","stage":{"background":"war","characters":["blackball","souronion"]}},{"speaker":"Captain Blackball","text":"That's not a name. That's a cry for help.","stage":{"background":"war","characters":["blackball","souronion"]}},{"speaker":"Lord Souronion","text":"TREMBLE NOW, MERCENARY OF POTATO! MY PRESENCE REDUCES MIGHTY WARRIORS TO TEARS!","stage":{"background":"war","characters":["blackball","souronion"]}},{"speaker":"Captain Blackball","text":"That's the onion fumes, mate. Have a mint.","stage":{"background":"war","characters":["blackball","souronion"]}},{"speaker":"Lord Souronion","text":"INSOLENCE! I SHALL MASH YOU AT THE SACRED TABLE OF SPHERES! FEEL THE FIRE OF MY BLADE (which happens to simultaneously be a pool cue) AS I SCORCH AND CHAR YOUR POTATOED RENDERING INTO A CRISP!","stage":{"background":"war","characters":["blackball","souronion"]}},{"speaker":"Captain Blackball","text":"You can try. My friend will be the one playing.","stage":{"background":"war","characters":["blackball","souronion"]}}]},
  chapter_3_souronion_victory:{"id":"chapter_3_souronion_victory","chapter":"chapter_3","kicker":"CHAPTER 3","title":"Lord Souronion","finishLabel":"Return to roster","typewriterMs":22,"finishFadeMs":1625,"theatreEffects":true,"assets":{"backgrounds":{"war":{"src":"assets/scenes/ch3-war.webp"}},"characters":{"blackball":{"src":"assets/scenes/captain-blackball-main.png","alt":"Captain Blackball","x":22,"y":88,"width":36,"anchor":"bottom-center"},"souronion":{"src":"assets/scenes/ch3-lord_souronion.png","alt":"Lord Souronion","x":75,"y":90,"width":35,"anchor":"bottom-center"}},"props":{}},"lines":[{"speaker":"Lord Souronion","text":"SEEMINGLY IMPOSSIBLE! MY MANY LAYERS OF DARKNESS HAVE BEEN DEFEATED!","stage":{"background":"war","characters":["blackball","souronion"]}},{"speaker":"Captain Blackball","text":"And yet you're still making my eyes water. Where's the Golden Cue?","stage":{"background":"war","characters":["blackball","souronion"]}},{"speaker":"Lord Souronion","text":"I coveted the gleaming cue of a pirate known as CAPTAIN BLOCKBEARD! But he would not surrender it!","stage":{"background":"war","characters":["blackball","souronion"]}},{"speaker":"Captain Blackball","text":"Blockbeard? The cave carver? The fellow we met when we arrived?","stage":{"background":"war","characters":["blackball","souronion"]}},{"speaker":"Lord Souronion","text":"HE IS NO MERE CARVER! HE IS THE BEARER OF THE GOLDEN CUE!","stage":{"background":"war","characters":["blackball","souronion"]}},{"speaker":"Captain Blackball","text":"HE COULD HAVE MENTIONED THAT!","stage":{"background":"war","characters":["blackball","souronion"]}},{"speaker":"Lord Souronion","text":"Why are you shouting? Rude. Anyway... IT IS THE DUTY OF A DARK LORD TO OBSTRUCT THE POTATO HERO'S QUEST!","stage":{"background":"war","characters":["blackball","souronion"]}},{"speaker":"Captain Blackball","text":"Well, you've done a wonderful job. In fact, all your repulsively cute little friends have. Come along now. We're going back to the cave.","stage":{"background":"war","characters":["blackball","souronion"]}}]},
  chapter_3_blockbeard_challenge:{"chapter":"chapter_3","kicker":"CHAPTER 3","title":"Captain Blockbeard","typewriterMs":22,"finishFadeMs":1625,"theatreEffects":true,"assets":{"backgrounds":{"cave":{"src":"assets/scenes/ch3-mysterious-cave.webp"},"cathedral":{"src":"assets/scenes/ch3-blockbeard-cathedral.webp"},"shaft":{"src":"assets/scenes/ch3-deep-mine-shaft.webp"}},"characters":{"blackball":{"src":"assets/scenes/captain-blackball-main.png","alt":"Captain Blackball","x":22,"y":88,"width":36,"anchor":"bottom-center"},"blockbeard":{"src":"assets/scenes/ch3-blockbeard.png","alt":"Captain Blockbeard","x":75,"y":90,"width":35,"anchor":"bottom-center"}},"props":{}},"id":"chapter_3_blockbeard_challenge","finishLabel":"Start the match","lines":[{"speaker":"Captain Blackball","text":"YOU! You knew about the Golden Cue all along!","stage":{"background":"cave","characters":["blackball","blockbeard"]}},{"speaker":"Captain Blockbeard","text":"Ahoy, Captain! Back already? How'd ye find Barley?","stage":{"background":"cave","characters":["blackball","blockbeard"]}},{"speaker":"Captain Blackball","text":"He gave us a turnip and sent us through a kingdom of increasingly unstable people. Lord Souronion aka u/lordsouronion1337 says YOU have the Golden Cue!","stage":{"background":"cave","characters":["blackball","blockbeard"]}},{"speaker":"Captain Blockbeard","text":"Ah. Well, I suppose the secret's out.","stage":{"background":"cave","characters":["blackball","blockbeard"]}},{"speaker":"Captain Blackball","text":"...By the seven seas. It's real.","stage":{"background":"cave","characters":["blackball","blockbeard"]}},{"speaker":"Captain Blockbeard","text":"I've summoned you now to my blocky throne room. Or, blone room. A fine little place, isn't she...","stage":{"background":"cathedral","characters":["blackball","blockbeard"]}},{"speaker":"Captain Blackball","text":"Then why didn't you tell us when we first arrived?!","stage":{"background":"cathedral","characters":["blackball","blockbeard"]}},{"speaker":"Captain Blockbeard","text":"Ye never asked whether I had one. Ye asked where ye might find one.","stage":{"background":"cathedral","characters":["blackball","blockbeard"]}},{"speaker":"Captain Blackball","text":"I— THAT IS— Oh, for the love of—","stage":{"background":"cathedral","characters":["blackball","blockbeard"]}},{"speaker":"Captain Blockbeard","text":"A proper treasure must be earned. Have yer companion face me at the table. Not just any table. My SPECIAL table. Win, and ye may hold the Golden Cue all by yourself.","stage":{"background":"cathedral","characters":["blackball","blockbeard"]}},{"speaker":"Captain Blackball","text":"Splendid. My preferred method of interrogation. RACK 'EM UP!","stage":{"background":"cathedral","characters":["blackball","blockbeard"]}}]},
  chapter_3_blockbeard_victory:{"chapter":"chapter_3","kicker":"CHAPTER 3","title":"Captain Blockbeard","typewriterMs":22,"finishFadeMs":1625,"theatreEffects":true,"assets":{"backgrounds":{"cave":{"src":"assets/scenes/ch3-mysterious-cave.webp"},"cathedral":{"src":"assets/scenes/ch3-blockbeard-cathedral.webp"},"shaft":{"src":"assets/scenes/ch3-deep-mine-shaft.webp"}},"characters":{"blackball":{"src":"assets/scenes/captain-blackball-main.png","alt":"Captain Blackball","x":22,"y":88,"width":36,"anchor":"bottom-center"},"blockbeard":{"src":"assets/scenes/ch3-blockbeard.png","alt":"Captain Blockbeard","x":75,"y":90,"width":35,"anchor":"bottom-center"}},"props":{}},"id":"chapter_3_blockbeard_victory","finishLabel":"Chapter 3 complete","lines":[{"speaker":"Captain Blockbeard","text":"A fine victory! Ye've earned the right to behold the Golden Cue!","stage":{"background":"cathedral","characters":["blackball","blockbeard"]}},{"speaker":"Captain Blackball","text":"At last! After all this time... the legendary Golden Cue! I can scarcely believe—","stage":{"background":"cathedral","characters":["blackball","blockbeard"]}},{"speaker":"Captain Blackball","text":"Hang on.","stage":{"background":"cathedral","characters":["blackball","blockbeard"]}},{"speaker":"Captain Blockbeard","text":"Something wrong, Captain?","stage":{"background":"cathedral","characters":["blackball","blockbeard"]}},{"speaker":"Captain Blackball","text":"This... isn't made of gold?","stage":{"background":"cathedral","characters":["blackball","blockbeard"]}},{"speaker":"Captain Blockbeard","text":"What?","stage":{"background":"cathedral","characters":["blackball","blockbeard"]}},{"speaker":"Captain Blackball","text":"It weighs exactly the same as an ordinary pool cue!","stage":{"background":"cathedral","characters":["blackball","blockbeard"]}},{"speaker":"Captain Blockbeard","text":"Well, of course it does! How else would ye play pool with it?","stage":{"background":"cathedral","characters":["blackball","blockbeard"]}},{"speaker":"Captain Blackball","text":"YOU PAINTED IT?!","stage":{"background":"cathedral","characters":["blackball","blockbeard"]}},{"speaker":"Captain Blockbeard","text":"With three coats! And a protective finish!","stage":{"background":"cathedral","characters":["blackball","blockbeard"]}},{"speaker":"Captain Blackball","text":"I'VE SAILED ACROSS THE BLOODY WORLD FOR A CUE WITH THREE COATS OF PAINT?!","stage":{"background":"cathedral","characters":["blackball","blockbeard"]}},{"speaker":"Captain Blockbeard","text":"Four, if ye count the primer.","stage":{"background":"cathedral","characters":["blackball","blockbeard"]}},{"speaker":"Narrator","text":"...Lockers clatter and a group of people seem to shuffle and chatter in the background of the cave somewhere. Blockbeard shouts towards them:","stage":{"background":"cathedral","characters":["blackball","blockbeard"]}},{"speaker":"Captain Blockbeard","text":"See you lot tomorrow, yeah, same time?","stage":{"background":"cathedral","characters":["blackball","blockbeard"]}},{"speaker":"Offstage voice 1","text":"Yeah, sorry I'd stay longer tonight but got work tomorrow!","stage":{"background":"cathedral","characters":["blackball","blockbeard"]}},{"speaker":"Offstage voice 2","text":"Same, but I've got to take my mum to Snappy Snaps.","stage":{"background":"cathedral","characters":["blackball","blockbeard"]}},{"speaker":"Offstage voice 3","text":"I'm off to Greggs for a bake of steak. Thrice.","stage":{"background":"cathedral","characters":["blackball","blockbeard"]}},{"speaker":"Offstage voice 2","text":"Ooo, get me one pal!","stage":{"background":"cathedral","characters":["blackball","blockbeard"]}},{"speaker":"Offstage voice 3","text":"No.","stage":{"background":"cathedral","characters":["blackball","blockbeard"]}},{"speaker":"Captain Blackball","text":"...What peculiar battle cries.","stage":{"background":"cathedral","characters":["blackball","blockbeard"]}},{"speaker":"Captain Blockbeard","text":"Good people. Very committed to their adventures.","stage":{"background":"cathedral","characters":["blackball","blockbeard"]}},{"speaker":"Captain Blackball","text":"Well. That's it, then. We've come all this way for a painted stick.","stage":{"background":"cathedral","characters":["blackball","blockbeard"]}},{"speaker":"Captain Blockbeard","text":"Not entirely, Captain. I DID once have the actual REAL Golden Cue. Genuinely made of gold, and proper glistening. Would make a fortune on eBay.","stage":{"background":"cathedral","characters":["blackball","blockbeard"]}},{"speaker":"Captain Blackball","text":"You WHAT?","stage":{"background":"cathedral","characters":["blackball","blockbeard"]}},{"speaker":"Captain Blockbeard","text":"Won it fair and square. Kept it safe for... a while, too.","stage":{"background":"cathedral","characters":["blackball","blockbeard"]}},{"speaker":"Captain Blackball","text":"And where is it NOW?","stage":{"background":"cathedral","characters":["blackball","blockbeard"]}},{"speaker":"Captain Blockbeard","text":"Lost it in a high-stakes pool match didn't I.","stage":{"background":"cathedral","characters":["blackball","blockbeard"]}},{"speaker":"Captain Blackball","text":"To WHOM?","stage":{"background":"cathedral","characters":["blackball","blockbeard"]}},{"speaker":"Captain Blockbeard","text":"Someone called Lucy. Lives much deeper underground than I usually like to mine.","stage":{"background":"cathedral","characters":["blackball","blockbeard"]}},{"speaker":"Captain Blackball","text":"A miner afraid of going underground?","stage":{"background":"cathedral","characters":["blackball","blockbeard"]}},{"speaker":"Captain Blockbeard","text":"Not underground. Heights.","stage":{"background":"cathedral","characters":["blackball","blockbeard"]}},{"speaker":"Captain Blackball","text":"HEIGHTS?!","stage":{"background":"cathedral","characters":["blackball","blockbeard"]}},{"speaker":"Captain Blockbeard","text":"Aye. The higher the ground above me, the worse it gets.","stage":{"background":"cathedral","characters":["blackball","blockbeard"]}},{"speaker":"Captain Blackball","text":"That makes absolutely no sense. Show us where this Lucy lives.","stage":{"background":"cathedral","characters":["blackball","blockbeard"]}},{"speaker":"Narrator","text":"And so, having crossed an ocean in search of a legendary artefact, our heroes were led to a gaping hole. A very large, gaping hole.","stage":{"background":"shaft","characters":["blackball","blockbeard"]}},{"speaker":"Captain Blockbeard","text":"There she is. The deepest hole ever known, right down to the very burning core of the planet.","stage":{"background":"shaft","characters":["blackball","blockbeard"]}},{"speaker":"Captain Blackball","text":"That sounds awfully far and practically impossible to survive in.","stage":{"background":"shaft","characters":["blackball","blockbeard"]}},{"speaker":"Captain Blockbeard","text":"Tell me about it mate, it's like, a hundred metres down to the centre of the Earth.","stage":{"background":"shaft","characters":["blackball","blockbeard"]}},{"speaker":"Captain Blackball","text":"A HUNDRED METRES!? And you expect us to climb down that? With the cues? The bags? The rest of our equipment?","stage":{"background":"shaft","characters":["blackball","blockbeard"]}},{"speaker":"Captain Blockbeard","text":"Well, take yer time. One hand at a time.","stage":{"background":"shaft","characters":["blackball","blockbeard"]}},{"speaker":"Captain Blackball","text":"And what happens if one of us drops a cue? Or a bag? Or, heaven forbid, ME?","stage":{"background":"shaft","characters":["blackball","blockbeard"]}},{"speaker":"Captain Blockbeard","text":"Wouldn't recommend it. Long way to the bottom.","stage":{"background":"shaft","characters":["blackball","blockbeard"]}},{"speaker":"Captain Blackball","text":"My friend has spent three chapters doing all the hard work and now you want us to climb down the centre of the PLANET?!","stage":{"background":"shaft","characters":["blackball","blockbeard"]}},{"speaker":"Captain Blockbeard","text":"Could always take the lift.","stage":{"background":"shaft","characters":["blackball","blockbeard"]}},{"speaker":"Captain Blackball","text":"...The WHAT?","stage":{"background":"shaft","characters":["blackball","blockbeard"]}},{"speaker":"Captain Blockbeard","text":"The lift. Just round that corner.","stage":{"background":"shaft","characters":["blackball","blockbeard"]}},{"speaker":"Captain Blackball","text":"THERE'S A LIFT?!","stage":{"background":"shaft","characters":["blackball","blockbeard"]}},{"speaker":"Captain Blockbeard","text":"Aye. Much easier with equipment.","stage":{"background":"shaft","characters":["blackball","blockbeard"]}},{"speaker":"Captain Blackball","text":"I AM GOING TO THROW YOU DOWN THIS SHAFT.","stage":{"background":"shaft","characters":["blackball","blockbeard"]}},{"speaker":"Captain Blockbeard","text":"Might be quicker, but I'd still recommend the lift.","stage":{"background":"shaft","characters":["blackball","blockbeard"]}},{"speaker":"Captain Blackball","text":"Well. At least this is more civilised.","stage":{"background":"shaft","characters":["blackball","blockbeard"]}},{"speaker":"Captain Blackball","text":"...I think we've taken a wrong turn.","stage":{"background":"shaft","characters":["blackball","blockbeard"]}},{"speaker":"Captain Blockbeard","text":"Nope. Lucy's down here somewhere.","stage":{"background":"shaft","characters":["blackball","blockbeard"]}},{"speaker":"Captain Blackball","text":"Of course she is.","stage":{"background":"shaft","characters":["blackball","blockbeard"]}},{"speaker":"Narrator","text":"The voyage continues... somewhat further below sea level. Chapter 4 — Five Circles of Hell.","stage":{"background":"shaft","characters":["blackball","blockbeard"]}}]},
  chapter_3_barley_victory:{id:"chapter_3_barley_victory",chapter:"chapter_3",kicker:"CHAPTER 3",title:"Barley Bramblebottom",finishLabel:"Return to the roster",typewriterMs:22,finishFadeMs:1625,theatreEffects:true,assets:{backgrounds:{home:{src:"assets/scenes/ch3-barley-home.webp"}},characters:{blackball:{src:"assets/scenes/captain-blackball-main.png",alt:"Captain Blackball",x:22,y:88,width:36,anchor:"bottom-center"},barley:{src:"assets/scenes/ch3-barley.png",alt:"Barley",x:75,y:90,width:35,anchor:"bottom-center"}},props:{}},lines:[
      {speaker:"Barley",text:"Well played! You've beaten me fair and square. Which is appropriate, considering everything round here.",stage:{background:"home",characters:["blackball","barley"]}},
      {speaker:"Captain Blackball",text:"Golden Cue. Where?",stage:{background:"home",characters:["blackball","barley"]}},
      {speaker:"Barley",text:"Legolass might know. She talks about ancient golden things every time someone asks her to pass the salt. Follow the POINTY TREES. Try not to get your face mashed.",stage:{background:"home",characters:["blackball","barley"]}},
      {speaker:"Captain Blackball",text:"They're ALL pointy trees!",stage:{background:"home",characters:["blackball","barley"]}},
      {speaker:"Barley",text:"Then you can't get lost can you, potato urchin? Turnip for the road? Mmmmmmmm!",stage:{background:"home",characters:["blackball","barley"]}},
      {speaker:"Captain Blackball",text:"Keep it. I suspect we're about to meet someone even stranger.",stage:{background:"home",characters:["blackball","barley"]}}
  ]},

  chapter_1_intro:{
    id:'chapter_1_intro',chapter:'chapter_1',kicker:'CHAPTER 1',title:'Chapter 1: Liver Island tavern',finishLabel:'Enter the tavern',typewriterMs:28,finishFadeMs:4000,
    assets:{backgrounds:{black:{kind:'gradient',value:'linear-gradient(#000,#000)'},tavern:{src:'assets/scenes/liver-island-tavern.png'}},characters:{},props:{}},
    lines:[
      {text:"Hey, you're finally awake.",stage:{background:'black'}},
      {text:"You've woken up on a remote island's beach. Must be a long way from England. The weather is nicer, for a start.",stage:{background:'black'}},
      {text:"A faint smell of ale is in the distance, and an overwhelming sense that for some reason, there are pool players here, and not much else.",stage:{background:'black'}},
      {text:"That's handy - back home, you used to be king of the tables.",stage:{background:'black'}},
      {text:"The tavern seems like an obvious place to meet the locals and see what all of this is about.",stage:{background:'black'}},
      {text:'Your adventure...',transitionMs:4000,stage:{background:'tavern'}},
      {text:'Your pool adventure...',stage:{background:'tavern'}},
      {text:'Begins here.',stage:{background:'tavern'}}
    ]
  },
  chapter_2_intro:{
    id:'chapter_2_intro',chapter:'chapter_2',kicker:'CHAPTER 2',title:'Uncharted Waters',finishLabel:'See the island players',typewriterMs:28,finishFadeMs:1625,theatreEffects:true,
    assets:{backgrounds:{tavern:{src:'assets/scenes/liver-island-tavern.png'},ship:{src:'assets/scenes/open-ocean-ship-deck.png'},beach:{src:'assets/scenes/strangevoice-beach.png'}},characters:{blackball:{src:'assets/scenes/captain-blackball-main.png',alt:'Captain Blackball',x:22,y:88,width:36,anchor:'bottom-center'},sandy:{src:'assets/portraits/sandy-mandy-main.png',alt:'Sandy Mandy',x:74,y:90,width:34,anchor:'bottom-center'},shelle:{src:'assets/portraits/shelle-main.png',alt:'Shelle',x:74,y:90,width:34,anchor:'bottom-center'},graham:{src:'assets/portraits/graham-main.png',alt:'Graham',x:74,y:90,width:34,anchor:'bottom-center'},papa:{src:'assets/portraits/papa-surf-main.png',alt:'Papa Surf',x:74,y:90,width:34,anchor:'bottom-center'}},props:{sandcastle:{src:'assets/scenes/sandy-sandcastle.png',alt:'Sandcastle',x:74,y:86,width:18,anchor:'bottom-center'},shell:{src:'assets/scenes/shelle-pearl-shell.png',alt:'Pearly shell',x:75,y:80,width:13,anchor:'bottom-center'},fossil:{src:'assets/scenes/graham-fossil.png',alt:'Fossil',x:75,y:81,width:14,anchor:'bottom-center'},tongue:{src:'assets/scenes/graham-tongue.png',alt:'Tongue',x:75,y:72,width:10,anchor:'center'},stew:{src:'assets/scenes/papa-surf-stew.png',alt:'Stew',x:74,y:82,width:16,anchor:'bottom-center'}}},
    lines:[
      {speaker:'Captain Blackball',text:"Right. I've had time to reflect on recent events.",stage:{background:'tavern',characters:['blackball']}},
      {speaker:'Captain Blackball',text:"Apparently, losing one's title is considered an opportunity to learn.",stage:{background:'tavern',characters:['blackball']}},
      {speaker:'Captain Blackball',text:"I dislike the 'learn' part. Nevertheless, there must be players beyond these waters who have something worth stealing—knowledge-wise.",stage:{background:'tavern',characters:['blackball']}},
      {speaker:'Captain Blackball',text:'We sail for uncharted waters. Pack your cue.',stage:{background:'tavern',characters:['blackball']}},
      {speaker:'Narrator',text:'For roughly a week, there is water. Then more water. Then, unexpectedly, considerably less water.',transitionMs:1625,stage:{background:'ship',characters:['blackball']}},
      {speaker:'Captain Blackball',text:'Land.',stage:{background:'ship',characters:['blackball']}},
      {speaker:'STRANGE VOICE',text:"AH, YOU'RE THAT POOL GUY WHO THINKS HE'S ALL THAT.",stage:{background:'ship'}},
      {speaker:'STRANGE VOICE',text:"WELL, LET ME TELL YOU, SUNSHINE, YOU'RE NOT.",stage:{background:'ship'}},
      {speaker:'STRANGE VOICE',text:"COME TO OUR PLACE AND WE'LL SHOW YOU WHAT REAL POOL ACTUALLY LOOKS LIKE.",stage:{background:'ship'}},
      {speaker:'STRANGE VOICE',text:'AND BRING YOUR STINKY FRIEND.',stage:{background:'ship'}},
      {speaker:'Captain Blackball',text:'Who said that?',stage:{background:'ship',characters:['blackball']}},
      {speaker:'STRANGE VOICE',text:'Slurrrrrrp.',stage:{background:'ship'}},
      {speaker:'Captain Blackball',text:'I am unsure whether we have discovered civilisation or are about to be eaten.',stage:{background:'ship',characters:['blackball']}},
      {speaker:'Captain Blackball',text:"Alright lads, get your cues out, we're back in business.",stage:{background:'ship',characters:['blackball']}},
      {speaker:'Captain Blackball',text:'Are you the creature that was shouting at us?',transitionMs:1625,stage:{background:'beach',characters:['blackball','sandy'],props:['sandcastle']}},
      {speaker:'Sandy Mandy',text:'No. Shouting is for those who have lost their voice, which is why I carry my alarm clock with me.',stage:{background:'beach',characters:['blackball','sandy'],props:['sandcastle']}},
      {speaker:'Captain Blackball',text:'You disgust me.',stage:{background:'beach',characters:['blackball','sandy'],props:['sandcastle']}},
      {speaker:'Captain Blackball',text:'You there! Have you been beckoning ships from afar?',stage:{background:'beach',characters:['blackball','shelle'],props:['shell']}},
      {speaker:'Shelle',text:"Huh? I don't own a ship? You're so silly!?",stage:{background:'beach',characters:['blackball','shelle'],props:['shell']}},
      {speaker:'Captain Blackball',text:"...Yeah, it definitely wasn't you.",stage:{background:'beach',characters:['blackball','shelle'],props:['shell']}},
      {speaker:'Graham',text:'Hey guys, can I interest you in learning about this fossil I found? Look at it.',stage:{background:'beach',characters:['blackball','graham'],props:['fossil']}},
      {speaker:'Captain Blackball',text:"No, shut your face up, you foul mystery creature. I don't want to hear another word from your wretched gob-hole. Especially not one about your ornate pebbles.",stage:{background:'beach',characters:['blackball','graham'],props:['fossil']}},
      {speaker:'Narrator',text:'Graham slowly licks his lips for no apparent reason.',stage:{background:'beach',characters:['blackball','graham'],props:['tongue']}},
      {speaker:'Captain Blackball',text:'Keep walking.',stage:{background:'beach',characters:['blackball','graham'],props:['fossil']}},
      {speaker:'Papa Surf',text:'Greetings, traveller. You look weary. Do you need to fill your belly and sit by the fire, telling tales of your mighty voyages?',stage:{background:'beach',characters:['blackball','papa'],props:['stew']}},
      {speaker:'Captain Blackball',text:'I wish for no part to play in the repulsive activities of your alien goblin tribe. I merely wish to find the one who dared challenge the finest pool player in the ocean and his stinky friend.',stage:{background:'beach',characters:['blackball','papa'],props:['stew']}},
      {speaker:'Papa Surf',text:'Oh yes, we have a pool table. How exciting! We must play sometime. Tell me a tale of fair maidens and really big waves lapping all over you.',stage:{background:'beach',characters:['blackball','papa'],props:['stew']}},
      {speaker:'Captain Blackball',text:'Please spare me from this madness.',stage:{background:'beach',characters:['blackball','papa'],props:['stew']}},
      {speaker:'Narrator',text:'None of them summoned the ship. There is a brief silence.',stage:{background:'beach',characters:['blackball']}},
      {speaker:'STRANGE VOICE',text:'Slurrrrrrp.',stage:{background:'beach',characters:['blackball']}},
      {speaker:'Captain Blackball',text:"...It's still here.",stage:{background:'beach',characters:['blackball']}},
      {speaker:'Captain Blackball',text:"Right. I've met everyone I can see and smell for now, other than that mysterious voice. Time to see if they'll reveal more... wisdom? No. Reveal anything for me to go with, and to find out more about who beckoned us here.",stage:{background:'beach',characters:['blackball']}},
      {speaker:'Captain Blackball',text:"Using the only method I know. Pool victories! You there, player. You play them. You're slightly better than me so it'll be quicker.",stage:{background:'beach',characters:['blackball']}}
    ]
  },
  chapter_2_boss_reveal:{
    id:'chapter_2_boss_reveal',chapter:'chapter_2',kicker:'STRANGEVOICE ISLAND — AFTER PAPA SURF',title:'Boss Reveal',finishLabel:'Return to the island roster',typewriterMs:28,finishFadeMs:1625,theatreEffects:true,
    assets:{backgrounds:{beach:{src:'assets/scenes/strangevoice-beach.png'}},characters:{blackball:{src:'assets/scenes/captain-blackball-main.png',alt:'Captain Blackball',x:26,y:96,width:45,anchor:'bottom-center'},wiggles:{src:'assets/scenes/mr-wiggles-main.png',alt:'Mr Wiggles',x:72,y:96,width:42,anchor:'bottom-center',suppressSpeakerWobble:true},wiggle1:{src:'assets/scenes/mr-wiggles-wiggle-01.png',alt:'Mr Wiggles'},wiggle2:{src:'assets/scenes/mr-wiggles-wiggle-02.png',alt:'Mr Wiggles'},wiggle3:{src:'assets/scenes/mr-wiggles-wiggle-03.png',alt:'Mr Wiggles'},wiggle4:{src:'assets/scenes/mr-wiggles-wiggle-04.png',alt:'Mr Wiggles'},wiggle5:{src:'assets/scenes/mr-wiggles-wiggle-05.png',alt:'Mr Wiggles'},wiggle6:{src:'assets/scenes/mr-wiggles-wiggle-06.png',alt:'Mr Wiggles'},wiggle7:{src:'assets/scenes/mr-wiggles-wiggle-07.png',alt:'Mr Wiggles'},wiggle8:{src:'assets/scenes/mr-wiggles-wiggle-08.png',alt:'Mr Wiggles'}},props:{revealTitle:{text:'MR WIGGLES',className:'scene-reveal-title',x:50,y:50,width:80,anchor:'center'}}},
    lines:[
      {speaker:'Captain Blackball',text:"That's four. And still no sign of the loud-mouthed creature that summoned us here.",stage:{background:'beach',characters:['blackball']}},
      {speaker:'STRANGE VOICE',text:'Slurrrrrrp.',stage:{background:'beach',characters:['blackball']}},
      {speaker:'Captain Blackball',text:'...There you are.',stage:{background:'beach',characters:['blackball']}},
      {speaker:'STRANGE VOICE',text:'Ball!',stage:{background:'beach',characters:['blackball']}},
      {speaker:'Mr Wiggles',text:"I'm a worm! I'm a worm!",stage:{background:'beach',characters:['blackball','wiggles'],props:['revealTitle'],animate:[{target:'prop:revealTitle',effect:'reveal',duration:900,repeat:1},{target:'character:wiggles',effect:'swap',frames:['wiggle1','wiggle2','wiggle3','wiggle4','wiggle5','wiggle6','wiggle7','wiggle8'],interval:125,repeat:2}]}},
      {speaker:'Captain Blackball',text:"You're the one who's been shouting at us?",stage:{background:'beach',characters:['blackball','wiggles']}},
      {speaker:'Mr Wiggles',text:"I'm playing pool!",stage:{background:'beach',characters:['blackball','wiggles'],animate:[{target:'character:wiggles',effect:'swap',frames:['wiggle1','wiggle2','wiggle3','wiggle4','wiggle5','wiggle6','wiggle7','wiggle8'],interval:125,repeat:2}]}},
      {speaker:'Captain Blackball',text:"You dragged us across the ocean, insulted my ability, insulted my friend, and you're a worm.",stage:{background:'beach',characters:['blackball','wiggles']}},
      {speaker:'Mr Wiggles',text:'Slurrrrrrp.',stage:{background:'beach',characters:['blackball','wiggles'],animate:[{target:'character:wiggles',effect:'swap',frames:['wiggle1','wiggle2','wiggle3','wiggle4','wiggle5','wiggle6','wiggle7','wiggle8'],interval:125,repeat:2}]}},
      {speaker:'Captain Blackball',text:'I hate this island.',stage:{background:'beach',characters:['blackball','wiggles']}}
    ]
  },
  chapter_2_ending:{
    id:'chapter_2_ending',chapter:'chapter_2',kicker:'STRANGEVOICE ISLAND — AFTER THE MATCH',title:'Uncharted Waters — Chapter Ending',finishLabel:'Finish Chapter 2',typewriterMs:28,finishFadeMs:1625,theatreEffects:true,
    assets:{backgrounds:{beach:{src:'assets/scenes/strangevoice-beach.png'},voyage:{src:'assets/scenes/open-ocean-ship-deck.png'}},characters:{blackball:{src:'assets/scenes/captain-blackball-main.png',alt:'Captain Blackball',x:26,y:96,width:45,anchor:'bottom-center'},wiggles:{src:'assets/scenes/mr-wiggles-main.png',alt:'Mr Wiggles',x:72,y:96,width:42,anchor:'bottom-center',suppressSpeakerWobble:true},wiggle1:{src:'assets/scenes/mr-wiggles-wiggle-01.png',alt:'Mr Wiggles'},wiggle2:{src:'assets/scenes/mr-wiggles-wiggle-02.png',alt:'Mr Wiggles'},wiggle3:{src:'assets/scenes/mr-wiggles-wiggle-03.png',alt:'Mr Wiggles'},wiggle4:{src:'assets/scenes/mr-wiggles-wiggle-04.png',alt:'Mr Wiggles'},wiggle5:{src:'assets/scenes/mr-wiggles-wiggle-05.png',alt:'Mr Wiggles'},wiggle6:{src:'assets/scenes/mr-wiggles-wiggle-06.png',alt:'Mr Wiggles'},wiggle7:{src:'assets/scenes/mr-wiggles-wiggle-07.png',alt:'Mr Wiggles'},wiggle8:{src:'assets/scenes/mr-wiggles-wiggle-08.png',alt:'Mr Wiggles'}},props:{}},
    lines:[
      {speaker:'Mr Wiggles',text:'Ball!',stage:{background:'beach',characters:['blackball','wiggles'],animate:[{target:'character:wiggles',effect:'swap',frames:['wiggle1','wiggle2','wiggle3','wiggle4','wiggle5','wiggle6','wiggle7','wiggle8'],interval:125,repeat:2}]}},
      {speaker:'Captain Blackball',text:"Yes. You lost at ball. We've established this.",stage:{background:'beach',characters:['blackball','wiggles']}},
      {speaker:'Mr Wiggles',text:'Good ball!',stage:{background:'beach',characters:['blackball','wiggles'],animate:[{target:'character:wiggles',effect:'swap',frames:['wiggle1','wiggle2','wiggle3','wiggle4','wiggle5','wiggle6','wiggle7','wiggle8'],interval:125,repeat:2}]}},
      {speaker:'Captain Blackball',text:'Thank you.',stage:{background:'beach',characters:['blackball','wiggles']}},
      {speaker:'Mr Wiggles',text:'Cave!',stage:{background:'beach',characters:['blackball','wiggles'],animate:[{target:'character:wiggles',effect:'swap',frames:['wiggle1','wiggle2','wiggle3','wiggle4','wiggle5','wiggle6','wiggle7','wiggle8'],interval:125,repeat:2}]}},
      {speaker:'Captain Blackball',text:'...Cave?',stage:{background:'beach',characters:['blackball','wiggles']}},
      {speaker:'Mr Wiggles',text:'Dark cave!',stage:{background:'beach',characters:['blackball','wiggles'],animate:[{target:'character:wiggles',effect:'swap',frames:['wiggle1','wiggle2','wiggle3','wiggle4','wiggle5','wiggle6','wiggle7','wiggle8'],interval:125,repeat:2}]}},
      {speaker:'Captain Blackball',text:"I'm listening.",stage:{background:'beach',characters:['blackball','wiggles']}},
      {speaker:'Mr Wiggles',text:'Pool people!',stage:{background:'beach',characters:['blackball','wiggles'],animate:[{target:'character:wiggles',effect:'swap',frames:['wiggle1','wiggle2','wiggle3','wiggle4','wiggle5','wiggle6','wiggle7','wiggle8'],interval:125,repeat:2}]}},
      {speaker:'Captain Blackball',text:'There are pool players in this cave?',stage:{background:'beach',characters:['blackball','wiggles']}},
      {speaker:'Mr Wiggles',text:'Old!',stage:{background:'beach',characters:['blackball','wiggles'],animate:[{target:'character:wiggles',effect:'swap',frames:['wiggle1','wiggle2','wiggle3','wiggle4','wiggle5','wiggle6','wiggle7','wiggle8'],interval:125,repeat:2}]}},
      {speaker:'Captain Blackball',text:'Old pool players.',stage:{background:'beach',characters:['blackball','wiggles']}},
      {speaker:'Mr Wiggles',text:'OLD!',stage:{background:'beach',characters:['blackball','wiggles'],animate:[{target:'character:wiggles',effect:'swap',frames:['wiggle1','wiggle2','wiggle3','wiggle4','wiggle5','wiggle6','wiggle7','wiggle8'],interval:125,repeat:2}]}},
      {speaker:'Captain Blackball',text:'Ancient pool players?',stage:{background:'beach',characters:['blackball','wiggles']}},
      {speaker:'Mr Wiggles',text:'SLURRRRRP!',stage:{background:'beach',characters:['blackball','wiggles'],animate:[{target:'character:wiggles',effect:'swap',frames:['wiggle1','wiggle2','wiggle3','wiggle4','wiggle5','wiggle6','wiggle7','wiggle8'],interval:125,repeat:2}]}},
      {speaker:'Captain Blackball',text:'Ancient pool players, hidden away in a dark cave.',stage:{background:'beach',characters:['blackball','wiggles']}},
      {speaker:'Captain Blackball',text:'Masters from a time long gone, perhaps? Keepers of techniques forgotten by the modern game?',stage:{background:'beach',characters:['blackball','wiggles']}},
      {speaker:'Mr Wiggles',text:'Worm!',stage:{background:'beach',characters:['blackball','wiggles'],animate:[{target:'character:wiggles',effect:'swap',frames:['wiggle1','wiggle2','wiggle3','wiggle4','wiggle5','wiggle6','wiggle7','wiggle8'],interval:125,repeat:2}]}},
      {speaker:'Captain Blackball',text:"I'll take that as a yes.",stage:{background:'beach',characters:['blackball','wiggles']}},
      {speaker:'Mr Wiggles',text:'Boat!',stage:{background:'beach',characters:['blackball','wiggles'],animate:[{target:'character:wiggles',effect:'swap',frames:['wiggle1','wiggle2','wiggle3','wiggle4','wiggle5','wiggle6','wiggle7','wiggle8'],interval:125,repeat:2}]}},
      {speaker:'Captain Blackball',text:'We have a boat.',stage:{background:'beach',characters:['blackball','wiggles']}},
      {speaker:'Mr Wiggles',text:'Boat... boat... boat...',stage:{background:'beach',characters:['blackball','wiggles'],animate:[{target:'character:wiggles',effect:'swap',frames:['wiggle1','wiggle2','wiggle3','wiggle4','wiggle5','wiggle6','wiggle7','wiggle8'],interval:125,repeat:2}]}},
      {speaker:'Captain Blackball',text:'How far?',stage:{background:'beach',characters:['blackball','wiggles']}},
      {speaker:'Mr Wiggles',text:'Weeks!',stage:{background:'beach',characters:['blackball','wiggles'],animate:[{target:'character:wiggles',effect:'swap',frames:['wiggle1','wiggle2','wiggle3','wiggle4','wiggle5','wiggle6','wiggle7','wiggle8'],interval:125,repeat:2}]}},
      {speaker:'Captain Blackball',text:'How many weeks?',stage:{background:'beach',characters:['blackball','wiggles']}},
      {speaker:'Mr Wiggles',text:'Ball!',stage:{background:'beach',characters:['blackball','wiggles'],animate:[{target:'character:wiggles',effect:'swap',frames:['wiggle1','wiggle2','wiggle3','wiggle4','wiggle5','wiggle6','wiggle7','wiggle8'],interval:125,repeat:2}]}},
      {speaker:'Captain Blackball',text:'Useful.',stage:{background:'beach',characters:['blackball','wiggles']}},
      {speaker:'Captain Blackball',text:'Still... ancient masters of the game, hidden beyond the known waters. Knowledge untouched for generations.',stage:{background:'beach',characters:['blackball','wiggles']}},
      {speaker:'Mr Wiggles',text:"I'm a worm!",stage:{background:'beach',characters:['blackball','wiggles'],animate:[{target:'character:wiggles',effect:'swap',frames:['wiggle1','wiggle2','wiggle3','wiggle4','wiggle5','wiggle6','wiggle7','wiggle8'],interval:125,repeat:2}]}},
      {speaker:'Captain Blackball',text:"Lads, prepare the ship. We're going to find this cave.",stage:{background:'beach',characters:['blackball','wiggles']}},
      {speaker:'Mr Wiggles',text:'Your turn!',stage:{background:'beach',characters:['blackball','wiggles'],animate:[{target:'character:wiggles',effect:'swap',frames:['wiggle1','wiggle2','wiggle3','wiggle4','wiggle5','wiggle6','wiggle7','wiggle8'],interval:125,repeat:2}]}},
      {speaker:'Captain Blackball',text:"No, we're leaving.",stage:{background:'beach',characters:['blackball','wiggles']}},
      {speaker:'Mr Wiggles',text:'Slurrrrrrp.',stage:{background:'beach',characters:['blackball','wiggles'],animate:[{target:'character:wiggles',effect:'swap',frames:['wiggle1','wiggle2','wiggle3','wiggle4','wiggle5','wiggle6','wiggle7','wiggle8'],interval:125,repeat:2}]}},
      {speaker:'Captain Blackball',text:"If that worm has sent us three weeks across the ocean to look at a hole in a rock, I'm going back there and putting him in a plant pot.",transitionMs:1625,stage:{background:'voyage',characters:['blackball']}},
      {speaker:'Captain Blackball',text:"...Well I'll be damned.",stage:{background:'voyage',characters:['blackball']}},
      {speaker:'???',text:'The voyage continues...',stage:{background:'voyage',characters:[]}}
    ]
  },
  blackball_intro:{
    id:'blackball_intro',chapter:'chapter_1',kicker:"CAPTAIN BLACKBALL'S PRIVATE QUARTERS",title:'Captain Blackball',finishLabel:'Begin the ultimate showdown!',typewriterMs:28,finishFadeMs:1625,theatreEffects:true,
    assets:{backgrounds:{quarters:{src:'assets/scenes/blackball-private-quarters.png',filter:'brightness(0.86)'}},characters:{blackball:{src:'assets/scenes/captain-blackball-main.png',alt:'Captain Blackball',x:50,y:87,width:45,anchor:'bottom-center'}},props:{}},
    lines:[
      {speaker:'Captain Blackball',text:"So, welcome to my ship and my private pool room in the Captain's quarters. It's just me and you now, and you only get one chance... unless you lose and try again as if this never happened.",stage:{background:'quarters',characters:['blackball']}},
      {speaker:'Captain Blackball',text:'Defeat me to become the greatest pool player of all the oceans. But beware, otherworldly beings and mysterious creatures unknown also visit from time to time. Only time will tell.',stage:{background:'quarters',characters:['blackball']}},
      {speaker:'Captain Blackball',text:"This will not be an easy game. You will need everything you've learned, and I will show you that what you think you know might make you king of the tavern, you need to up your game and think of it more like chess: 3 steps ahead, if you're going to have a chance with me or out in uncharted waters.",stage:{background:'quarters',characters:['blackball']}}
    ]
  },
  blackball_ending:{
    id:'blackball_ending',chapter:'chapter_1',kicker:"CAPTAIN BLACKBALL'S PRIVATE QUARTERS",title:'Captain Blackball',finishLabel:'Return to the title',typewriterMs:28,finishFadeMs:1625,theatreEffects:true,
    assets:{backgrounds:{quarters:{src:'assets/scenes/blackball-private-quarters.png',filter:'brightness(0.86)'}},characters:{blackball:{src:'assets/scenes/captain-blackball-main.png',alt:'Captain Blackball',x:50,y:87,width:45,anchor:'bottom-center'}},props:{}},
    lines:[{speaker:'Captain Blackball',text:'Well done, well done indeed. A jolly fine match. Feel free to come and use my table any time you wish, and my beautiful cue. I must be at sea again in the morning, or the next morning, something like that. Gather all the practice you can muster, and most importantly, enjoy yourself!',stage:{background:'quarters',characters:['blackball']}}]
  }
};
let activeSceneId=null,activeSceneStep=0,activeSceneDone=null,activeSceneTimers=[],activeSceneTyping=false;
let scenePhase='idle',sceneEpoch=0,sceneReturn=null,scenePreview=false,sceneReady=Promise.resolve(),opponentIntroBusy=false;
const theatreDecisions=[];
function theatreTrace(event,sceneId,detail={}){if(!IS_DEVELOPMENT_BUILD)return;theatreDecisions.push({event,sceneId,...detail});if(theatreDecisions.length>200)theatreDecisions.shift();}
function setScenePhase(phase){scenePhase=phase;blackballStory.dataset.scenePhase=phase;blackballStory.setAttribute('aria-busy',String(phase!=='idle'&&phase!=='ready'));}
function theatreBusy(){return scenePhase!=='idle'||opponentIntroBusy;}
function theatreInputBlocked(){return theatreBusy()||!!document.querySelector('.scene-handoff-cover');}
function suspendTheatreGame(){const previous={visible:!gameApp.hidden,paused:gamePaused,focus:document.activeElement};gameApp.dispatchEvent(new Event('gameplay-suspend'));if(gameApp.contains(document.activeElement))document.activeElement.blur();gamePaused=true;gameApp.hidden=true;clearTimeout(aiTimer);clearTimeout(aiWatchdogTimer);aiThinking=false;return previous;}
function restoreTheatreGame(previous){gameApp.hidden=!previous.visible;gamePaused=previous.paused;last=performance.now();if(previous.visible&&!previous.paused)maybeScheduleAI();if(previous.focus?.isConnected&&!previous.focus.closest('[hidden]'))previous.focus.focus({preventScroll:true});}
function sceneArtworkNotice(failures){let notice=document.getElementById('sceneArtworkNotice');if(!notice){notice=document.createElement('small');notice.id='sceneArtworkNotice';notice.setAttribute('role','status');blackballStoryText.after(notice);}notice.hidden=!failures.length;notice.textContent=failures.length?'Some artwork could not be loaded. You can still continue the story.':'';}

function sceneById(id){return SCENES[id]||null;}
function clearSceneTimers(){activeSceneTimers.forEach(t=>clearTimeout(t));activeSceneTimers=[];}
function ensureSceneStage(){
  let stage=document.getElementById('genericSceneStage');if(stage)return stage;
  stage=document.createElement('div');stage.id='genericSceneStage';stage.className='generic-scene-stage';stage.setAttribute('aria-hidden','true');
  stage.innerHTML='<div class="generic-scene-background"></div><div class="generic-scene-characters"></div><div class="generic-scene-props"></div><div class="generic-scene-fx"></div>';
  blackballStory.querySelector('.blackball-room')?.appendChild(stage);return stage;
}
function sceneAsset(scene,type,id){return scene?.assets?.[type]?.[id]||null;}
function sceneLayerElement(type,id,def){
  const el=def.src?document.createElement('img'):document.createElement('div');
  el.className=`scene-layer scene-${type.slice(0,-1)}${def.className?' '+def.className:''}`;el.dataset.sceneAsset=id;
  if(def.src){if(SeamenTheatre.failed(def.src))el.hidden=true;else el.src=def.src;el.alt=def.alt||'';el.draggable=false;}else if(def.text!=null)el.textContent=def.text;
  const x=def.x??50,y=def.y??50,w=def.width??35;el.style.left=`${x}%`;el.style.top=`${y}%`;el.style.width=`${w}%`;
  const anchor=def.anchor||'center';el.dataset.anchor=anchor;const available=anchor==='bottom-center'?y:anchor==='top-center'?100-y:2*Math.min(y,100-y);el.style.setProperty('--scene-fit-height',Math.max(1,Math.min(100,available*.96))+'%');return el;
}
function sceneSpeakerCharacterId(entry){
  const speaker=entry?.speaker||'';
  if(speaker==='Spinball Wizard')return 'spinball_wizard';
  if(speaker==='Captain Blackball'||speaker==='Blackball'||speaker==='Blackball.')return 'blackball';
  const k4Speaker=window.SeamenChapter4.opponents.find(p=>p.name===speaker||(p.id==='lucy_fir'&&speaker==='Lucy')||(p.id==='filthy_youth'&&speaker==='Filthy youth with a phone'));if(k4Speaker)return k4Speaker.id;
  const map={'Sandy Mandy':'sandy','Shelle':'shelle','Graham':'graham','Papa Surf':'papa','Mr Wiggles':'wiggles','Barley':'barley','Blockbeard':'blockbeard','Captain Blockbeard':'blockbeard','Legolass':'legolass','Aragoon':'aragoon','Lord Souronion':'souronion','Gimlet':'gimlet','Bam Bam':'bambam','Pokey Man':'pokey'};
  return speaker==='TMECI'?'most_evil':map[speaker]||null;
}
function sceneVoiceWaves(stage,slurp=false){
  const fx=stage.querySelector('.generic-scene-fx');if(!fx)return;
  const w=document.createElement('div');w.className='scene-voicewaves'+(slurp?' slurp':'');
  for(let k=0;k<4;k++){const q=document.createElement('div');q.className='scene-wave';w.appendChild(q);}
  fx.appendChild(w);activeSceneTimers.push(setTimeout(()=>w.remove(),slurp?2200:1600));
}
function renderSceneStage(scene,entry){
  clearSceneTimers();const stage=ensureSceneStage(),state=entry.stage||{};
  const bg=stage.querySelector('.generic-scene-background'),chars=stage.querySelector('.generic-scene-characters'),props=stage.querySelector('.generic-scene-props'),fx=stage.querySelector('.generic-scene-fx');
  const bgDef=sceneAsset(scene,'backgrounds',state.background);
  const previousBackground=stage.dataset.sceneBackground||'';
  const nextBackground=state.background||'';
  const backgroundChanged=previousBackground!==nextBackground;
  stage.dataset.sceneBackground=nextBackground;stage.classList.toggle('scene-vaper-vapour',activeSceneId==='supporter_vaper_intro');
  bg.style.backgroundImage='';bg.style.background='';bg.style.filter='';
  if(bgDef?.kind==='gradient')bg.style.background=bgDef.value;else if(bgDef?.src&&!SeamenTheatre.failed(bgDef.src))bg.style.backgroundImage=`url("${bgDef.src}")`;
  if(bgDef?.filter)bg.style.filter=bgDef.filter;
  /* Candidate E7: stage-presence continuity. Characters persist between dialogue beats.
     They fade only when genuinely entering/leaving, or when a new background/location begins. */
  const wantedCharacters=new Set(state.characters||[]);
  const existingCharacters=[...chars.querySelectorAll('.scene-character')];
  for(const el of existingCharacters){
    const id=el.dataset.sceneAsset||'';
    if(backgroundChanged||!wantedCharacters.has(id)){
      el.classList.remove('scene-character-talking','scene-character-entering','scene-pokey-singing');
      if(scene.theatreEffects&&!backgroundChanged&&!matchMedia('(prefers-reduced-motion: reduce)').matches&&Number(getComputedStyle(el).opacity)>0){el.classList.add('scene-character-leaving');el.addEventListener('transitionend',()=>el.remove(),{once:true});}
      else if(scene.theatreEffects)el.remove();
      else el.remove();
    }
  }
  for(const id of wantedCharacters){
    if(!backgroundChanged&&chars.querySelector(`[data-scene-asset="${id}"]:not(.scene-character-leaving)`))continue;
    const def=sceneAsset(scene,'characters',id);if(!def)continue;
    const el=sceneLayerElement('characters',id,def);chars.appendChild(el);
    if(scene.theatreEffects){el.classList.add('scene-character-entering');requestAnimationFrame(()=>requestAnimationFrame(()=>el.classList.remove('scene-character-entering')));}
  }
  props.replaceChildren();if(fx&&!(scene.chapter==='chapter_4'&&state.characters?.includes('filthy_youth')&&fx.querySelector('.k4-phone-wave')))fx.replaceChildren();k4SceneEffects(stage,scene,entry);
  for(const id of state.props||[]){const def=sceneAsset(scene,'props',id);if(def)props.appendChild(sceneLayerElement('props',id,def));}
  // K2F.3: reset previous line's speaker before selecting this line's speaker.
  for(const el of chars.querySelectorAll('.scene-character'))el.classList.remove('scene-character-talking','scene-blockbeard-talking','scene-pokey-singing');
  if(scene.theatreEffects&&!entry.silent){const speakingId=sceneSpeakerCharacterId(entry),speakerEl=speakingId?chars.querySelector(`[data-scene-asset="${speakingId}"]`):null,speakingDef=speakingId?sceneAsset(scene,'characters',speakingId):null;if(speakerEl&&!speakingDef?.suppressSpeakerWobble){speakerEl.classList.add('scene-character-talking');if(speakingId==='blockbeard')speakerEl.classList.add('scene-blockbeard-talking');if(speakingId==='pokey'&&entry.pokeySong)speakerEl.classList.add('scene-pokey-singing');}if(entry.speaker==='STRANGE VOICE')sceneVoiceWaves(stage,String(entry.text||'').includes('Slur'));}
  for(const a of state.animate||[]){
    const [kind,id]=String(a.target||'').split(':'),root=kind==='prop'?props:chars,el=root.querySelector(`[data-scene-asset="${id}"]`);if(!el)continue;
    const effect=['shake','bounce','slide','fade','reveal'].includes(a.effect)?a.effect:'bounce',duration=Math.max(120,Number(a.duration)||500),repeat=Math.max(1,Math.min(12,Number(a.repeat)||1));
    el.style.setProperty('--scene-motion-duration',`${duration}ms`);el.style.setProperty('--scene-motion-count',repeat);el.classList.add(`scene-motion-${effect}`);
  }
  /* Optional frame swap: alternates static artwork to create intentionally crude pose animation. */
  for(const a of state.animate||[]){if(a.effect!=='swap'||!Array.isArray(a.frames)||a.frames.length<2)continue;const [kind,id]=String(a.target||'').split(':'),root=kind==='prop'?props:chars,el=root.querySelector(`[data-scene-asset="${id}"]`);if(!el||el.tagName!=='IMG')continue;const defs=a.frames.map(fid=>sceneAsset(scene,kind==='prop'?'props':'characters',fid)).filter(d=>d?.src&&!SeamenTheatre.failed(d.src));if(defs.length<2)continue;let i=0,left=Math.max(1,Math.min(24,Number(a.repeat)||4))*defs.length,interval=Math.max(80,Number(a.interval)||200);const tick=()=>{if(!activeSceneId||left--<=0)return;i=(i+1)%defs.length;el.src=defs[i].src;activeSceneTimers.push(setTimeout(tick,interval));};activeSceneTimers.push(setTimeout(tick,interval));}
}
function showScene(sceneId,onDone,options={}){
 const scene=sceneById(sceneId);if(!scene){theatreTrace('missing-scene',sceneId);if(onDone)onDone();return false;}
 if(theatreBusy()){theatreTrace('duplicate-blocked',sceneId);return false;}if(!document.getElementById('bootSplash').hidden){theatreTrace('blocked-boot',sceneId);return false;}
 if(!options.preview&&BOSS_MUSIC_SCENES[sceneId])k4BeginEncounter(BOSS_MUSIC_SCENES[sceneId]);
 const cover=SeamenTheatre.cover(),epoch=++sceneEpoch;
 activeSceneId=sceneId;activeSceneStep=0;activeSceneDone=onDone||null;scenePreview=!!options.preview;setScenePhase('loading');
 sceneReturn=suspendTheatreGame();blackballStoryNext.disabled=true;
 theatreTrace('waiting-assets',sceneId);
 sceneReady=(async()=>{
  const related=sceneId==='chapter_3_arrival'&&pendingPirateStart?.pirateId==='barley'?[scene,sceneById('chapter_3_barley_challenge')]:[scene];
  const failures=await SeamenTheatre.prepare(related);
  if(epoch!==sceneEpoch){cover.remove();return;}
  theatreTrace('assets-ready',sceneId,{failed:failures.map(item=>item.src)});
  blackballStory.classList.add('generic-story-mode','scene-preparing');blackballStory.classList.remove('fading');blackballStory.style.visibility='';
  if(blackballStory.parentElement!==document.body)document.body.appendChild(blackballStory);
  blackballStory.hidden=false;ensureSceneStage().dataset.sceneBackground='';sceneArtworkNotice(failures);renderScene();
  for(const img of blackballStory.querySelectorAll('img'))if(failures.some(item=>new URL(item.src,location.href).href===img.src))img.hidden=true;
  const lateFailures=await SeamenTheatre.destination(blackballStory);if(lateFailures.length)sceneArtworkNotice([...failures,...lateFailures]);
  if(epoch!==sceneEpoch){cover.remove();return;}
  blackballStory.classList.remove('scene-preparing');setScenePhase('ready');blackballStoryNext.disabled=false;blackballStoryNext.focus({preventScroll:true});theatreTrace('launched',sceneId);await SeamenTheatre.reveal(cover);
 })().catch(error=>{theatreTrace('load-error',sceneId,{message:String(error)});activeSceneId=null;activeSceneDone=null;setScenePhase('idle');blackballStory.hidden=true;clearSceneTimers();activeSceneTyping=false;if(sceneReturn.visible)restoreTheatreGame(sceneReturn);else showPirateRosterAfterStory();cover.remove();});
 return true;
}
function setSceneSpeakerColour(entry){
  const speaker=String(entry?.speaker||'').trim().toLowerCase();
  const kind=speaker==='tmeci'?'tmeci':speaker.includes('blackball')?'blackball':speaker.includes('narrator')?'narrator':(speaker.includes('voice')||speaker.includes('off-screen')||speaker.includes('offscreen'))?'voice':'standard';
  blackballStory.dataset.speakerColour=kind;
}
function renderScene(){const scene=sceneById(activeSceneId);if(!scene)return;const entry=scene.lines[activeSceneStep]||{};const kicker=blackballStory.querySelector('.blackball-story-copy small');if(kicker)kicker.textContent=scene.kicker||'';blackballStoryTitle.textContent=scene.title==='TMECI'&&entry.speaker==='TMECI'?'TMECI':entry.speaker?`${scene.title} — ${entry.speaker}`:scene.title;setSceneSpeakerColour(entry);renderSceneStage(scene,entry);const text=entry.text||'',typingMs=Math.max(0,Number(scene.typewriterMs)||0);blackballStoryText.textContent=typingMs?'':text;activeSceneTyping=!!(typingMs&&text);if(activeSceneTyping){let i=0;const typeNext=()=>{if(!activeSceneId||!activeSceneTyping)return;blackballStoryText.textContent=text.slice(0,++i);if(i>=text.length){activeSceneTyping=false;stopSceneSpeaking();return;}activeSceneTimers.push(setTimeout(typeNext,typingMs));};typeNext();}blackballStoryNext.textContent=activeSceneStep===scene.lines.length-1?(scene.finishLabel||'Continue'):'Next';}
function stopSceneSpeaking(){ensureSceneStage().querySelectorAll('.scene-character-talking,.scene-blockbeard-talking,.scene-pokey-singing').forEach(el=>el.classList.remove('scene-character-talking','scene-blockbeard-talking','scene-pokey-singing'));}
function completeSceneTyping(){if(!activeSceneTyping)return false;const scene=sceneById(activeSceneId),entry=scene?.lines?.[activeSceneStep]||{};activeSceneTyping=false;clearSceneTimers();stopSceneSpeaking();blackballStoryText.textContent=entry.text||'';return true;}
function advanceScene(){if(scenePhase!=='ready')return;const scene=sceneById(activeSceneId);if(!scene)return;if(completeSceneTyping())return;if(activeSceneStep>=scene.lines.length-1){
  // K2D: arrival and Barley's challenge are one continuous Theatre visit.
  // Keep the overlay mounted, change the scene in place, and only fade once
  // when the challenge finishes. Preserve the normal scene completion flags.
  if(!scenePreview&&activeSceneId==='chapter_3_arrival'&&pendingPirateStart?.pirateId==='barley'){
    clearSceneTimers();stopSceneSpeaking();activeSceneTyping=false;
    markChapterSceneSeen('chapter_3','intro');
    activeSceneId='chapter_3_barley_challenge';activeSceneStep=0;
    activeSceneDone=()=>{chapterState('chapter_3').barleyChallengeSeen=true;saveCareer();beginPendingPirateMatch(true);};
    renderScene();return;
  }
  closeScene();return;
}const next=scene.lines[activeSceneStep+1]||{},transitionMs=Math.max(0,Number(next.transitionMs)||0);
 if(!transitionMs){activeSceneStep++;renderScene();return;}
 setScenePhase('transition');blackballStoryNext.disabled=true;
 const epoch=sceneEpoch,half=Math.max(1,Math.round(transitionMs/2)),curtain=SeamenTheatre.cover('scene-internal-curtain');
 curtain.style.opacity='0';
 (async()=>{
  await SeamenTheatre.fade(curtain,1,half);if(epoch!==sceneEpoch){curtain.remove();return;}
  blackballStory.classList.add('scene-preparing');activeSceneStep++;renderScene();
  await SeamenTheatre.destination(blackballStory);if(epoch!==sceneEpoch){curtain.remove();return;}
  blackballStory.classList.remove('scene-preparing');await SeamenTheatre.reveal(curtain,half);setScenePhase('ready');blackballStoryNext.disabled=false;
 })();
}
function closeScene(){
 if(scenePhase!=='ready')return;
 setScenePhase('closing');k4ClearSceneFX();clearSceneTimers();activeSceneTyping=false;stopSceneSpeaking();blackballStoryNext.disabled=true;
 const scene=sceneById(activeSceneId),id=activeSceneId,done=activeSceneDone,previous=sceneReturn;
 const cover=SeamenTheatre.cover();cover.style.opacity='0';
 (async()=>{
  await SeamenTheatre.fade(cover,1,Math.max(0,Number(scene?.finishFadeMs)||450));
  // The cover is fully opaque before either the Theatre or destination changes.
  blackballStory.hidden=true;blackballStory.style.visibility='hidden';blackballStory.classList.remove('generic-story-mode','fading','scene-preparing');
  const stage=ensureSceneStage();stage.querySelector('.generic-scene-characters').replaceChildren();stage.querySelector('.generic-scene-props').replaceChildren();stage.querySelector('.generic-scene-fx').replaceChildren();stage.dataset.sceneBackground='';
  activeSceneId=null;activeSceneDone=null;scenePreview=false;setScenePhase('idle');gamePaused=previous.paused;last=performance.now();theatreTrace('completed',id);
  try{if(done)done();else{gameApp.hidden=!previous.visible;gamePaused=true;}}catch(error){theatreTrace('exit-error',id,{message:String(error)});showTitleScreen();}
  if(activeSceneId)await sceneReady;
  await SeamenTheatre.destination();await SeamenTheatre.reveal(cover,220);if(!done)restoreTheatreGame(previous);
  if(!activeSceneId)blackballStoryNext.disabled=false;
 })().catch(error=>{theatreTrace('exit-error',id,{message:String(error)});activeSceneId=null;activeSceneDone=null;setScenePhase('idle');blackballStory.hidden=true;showTitleScreen();cover.remove();});
}
if(IS_DEVELOPMENT_BUILD)window.SeamenTheatreQA=Object.freeze({decisions:theatreDecisions,preview:id=>showScene(id,null,{preview:true}),dismissPreview:()=>{if(!scenePreview||scenePhase!=='ready')return false;closeScene();return true;},get phase(){return scenePhase;}});
const BLACKBALL_INTRO_LINES=[
  "So, welcome to my ship and my private pool room in the Captain's quarters. It's just me and you now, and you only get one chance... unless you lose and try again as if this never happened.",
  "Defeat me to become the greatest pool player of all the oceans. But beware, otherworldly beings and mysterious creatures unknown also visit from time to time. Only time will tell.",
  "This will not be an easy game. You will need everything you've learned, and I will show you that what you think you know might make you king of the tavern, you need to up your game and think of it more like chess: 3 steps ahead, if you're going to have a chance with me or out in uncharted waters."
];
const BLACKBALL_ENDING_LINES=["Well done, well done indeed. A jolly fine match. Feel free to come and use my table any time you wish, and my beautiful cue. I must be at sea again in the morning, or the next morning, something like that. Gather all the practice you can muster, and most importantly, enjoy yourself!"];
let blackballStoryMode='',blackballStoryStep=0,blackballStoryDone=null;
function showBlackballStory(mode,onDone){return showScene(mode==='ending'?'blackball_ending':'blackball_intro',onDone);}
// Compatibility names share the ready/opaque scene pipeline; no legacy fade bypass.
function renderBlackballStory(){if(activeSceneId)renderScene();}
function closeBlackballStory(){closeScene();}
blackballStoryNext?.addEventListener('click',()=>{if(activeSceneId)advanceScene();});
document.addEventListener('keydown',e=>{if(activeSceneId&&e.key==='Tab'&&!e.ctrlKey&&!e.altKey&&!e.metaKey){e.preventDefault();if(scenePhase==='ready')blackballStoryNext.focus({preventScroll:true});}},true);
function beginBlackballFirstShowdown(){forcedTableTheme='privates';runChapterScene('chapter_1','bossIntro',()=>{career.blackballIntroSeen=true;saveCareer();beginPendingPirateMatch(true);});}
const progressionRewardModal=document.getElementById('progressionRewardModal'),progressionRewardTitle=document.getElementById('progressionRewardTitle'),progressionRewardBody=document.getElementById('progressionRewardBody'),closeProgressionReward=document.getElementById('closeProgressionReward');
function showProgressionReward(info){if(!progressionRewardModal||!info)return;progressionRewardTitle.textContent=`${info.pirate} defeated!`;progressionRewardBody.innerHTML=rewardSummaryHTML(info);progressionRewardModal.hidden=false;}
closeProgressionReward?.addEventListener('click',()=>{progressionRewardModal.hidden=true;pendingPirateReward=null;});
function showBlackballFirstVictory(){forcedTableTheme='privates';startOutroMusic();runChapterScene('chapter_1','ending',()=>{career.blackballEndingSeen=true;saveCareer();const reward=pendingPirateReward||pirateRewardInfo(5);forcedTableTheme=null;showTitleScreen();showProgressionReward(reward);});}
function startProfiledPirate(){if(theatreBusy())return;const p=pirateById(profiledPirateId);if(!p||!pirateIsOpen(p)){theatreTrace('blocked-progression',p?.id);return;}if(!saveStoryPlayerName({onlyIfChanged:true}))return;if(p.chapter!=='chapter_3'&&p.chapter!=='chapter_4'&&chapterById(p.chapter)?.scenes?.intro&&!chapterSceneSeen(p.chapter,'intro')){pirateProfileModal.hidden=true;playersModal.hidden=true;runChapterScene(p.chapter,'intro',startProfiledPirate);return;}if(devPirateAccessActive()&&p.id==='chapter2_boss'&&!chapterSceneSeen('chapter_2','bossIntro')){pirateProfileModal.hidden=true;playersModal.hidden=true;runChapterScene('chapter_2','bossIntro',()=>{applyChapter2BossIdentity();renderPirateRoster();startProfiledPirate();});return;}if(p.playable===false){const sceneId=p.scene||chapterById(p.chapter)?.scenes?.intro;if(sceneId){pirateProfileModal.hidden=true;playersModal.hidden=true;showScene(sceneId,()=>{playersModal.hidden=false;modeMenu.hidden=true;playersForm.hidden=true;piratePlaceholder.hidden=false;refreshPirateButtons();});}return;}const level=p.legacyLevel??p.aiLevel;pendingPirateStart={level,pirateId:p.id,playerName:piratePlayerName.value.trim()||'Player 1'};audioReady();if(p.chapter==='chapter_4'){k4StartOpponent(p);return;}pirateProfileModal.hidden=true;playersModal.hidden=true;if(p.id==='barley'){const beginBarley=()=>{if(!opponentSceneSeen(p,'barleyChallengeSeen')){showScene('chapter_3_barley_challenge',()=>{chapterState('chapter_3').barleyChallengeSeen=true;saveCareer();beginPendingPirateMatch(true);});}else beginPendingPirateMatch(true);};if(!chapterSceneSeen('chapter_3','intro')){runChapterScene('chapter_3','intro',beginBarley);}else beginBarley();return;}if(['vaper','pokey_man'].includes(p.id)&&!opponentSceneSeen(p,p.id+'SupporterIntroSeen')){showScene('supporter_'+(p.id==='vaper'?'vaper':'pokey')+'_intro',()=>{chapterState(p.chapter)[p.id+'SupporterIntroSeen']=true;saveCareer();beginPendingPirateMatch(true);});return;}if(['legolass','aragoon','souronion','blockbeard'].includes(p.id)&&!opponentSceneSeen(p,p.id+'ChallengeSeen')){
  showScene('chapter_3_'+p.id+'_challenge',()=>{chapterState('chapter_3')[p.id+'ChallengeSeen']=true;saveCareer();beginPendingPirateMatch(true);});return;
} if(p.id==='blackball'&&!chapterSceneSeen('chapter_1','bossIntro')){beginBlackballFirstShowdown();return;}showOpponentIntroduction(p,level);}
function showOpponentIntroduction(p,level){
 opponentIntroBusy=true;const cover=SeamenTheatre.cover();suspendTheatreGame();
 (async()=>{
  theatreTrace('waiting-assets','opponent:'+p.id);const artwork=await SeamenTheatre.load(p.image);
 matchIntroPortrait.hidden=!p.image||!artwork.ok;if(p.image&&artwork.ok)matchIntroPortrait.src=p.image;else matchIntroPortrait.removeAttribute('src');matchIntroName.textContent=p.nickname?`${p.name} ${p.nickname}`:p.name;matchIntroLine.textContent=p.legacyLevel==null?(p.challengeQuote||p.bio):((window.SeamenDialogue?.getLine(level,'intro'))||p.bio);matchIntroKicker.textContent=level>=6?'SPECIAL OPPONENT':'YOUR OPPONENT';pirateIntroModal.hidden=false;refreshFirstRunGuidance();
 await SeamenTheatre.destination(pirateIntroModal);opponentIntroBusy=false;theatreTrace('launched','opponent:'+p.id);await SeamenTheatre.reveal(cover);
 })().catch(error=>{opponentIntroBusy=false;theatreTrace('intro-error',p.id,{message:String(error)});showPirateRosterAfterStory();cover.remove();});
}

function campaignMatchTableTheme(p){
  if(!p)return null;
  if(p.id==='lucy_fir')return 'lucy_fir';
  if(p.id==='spinball_wizard')return 'larper';
  if(p.id==='vaper')return 'vaper';
  if(p.id==='pokey_man')return 'pokey';
  if(p.id==='blackball')return 'privates';
  if(p.id==='blockbeard')return 'blockbeard';
  if(p.chapter==='chapter_3')return 'larper';
    return null;
}
function beginPendingPirateMatch(storyApproved=false){if(theatreBusy()||!pendingPirateStart)return;const k4Pending=pirateById(pendingPirateStart.pirateId);if(k4Pending?.chapter==='chapter_4'&&!pirateIsOpen(k4Pending)){pendingPirateStart=null;showTitleScreen();return;}k4BeginEncounter(k4Pending?.id);if(pendingPirateStart.level===1&&firstRunGuideActive())completeFirstRunPath();if(pendingPirateStart.pirateId==='blackball'&&!chapterSceneSeen('chapter_1','bossIntro')&&!storyApproved){pirateIntroModal.hidden=true;beginBlackballFirstShowdown();return;}gamePaused=false;last=performance.now();startMatchMusic();if(titleScreen)titleScreen.hidden=true;if(playersModal)playersModal.hidden=true;const schoolScreen=document.getElementById('poolSchoolScreen');if(schoolScreen)schoolScreen.hidden=true;if(pirateProfileModal)pirateProfileModal.hidden=true;if(gameApp)gameApp.hidden=false;if(progressionRewardModal)progressionRewardModal.hidden=true;if(winModal)winModal.hidden=true;const {level,pirateId,playerName}=pendingPirateStart,p=pirateById(pirateId)||PIRATES[level];pendingPirateStart=null;pirateIntroModal.hidden=true;currentScenario=null;currentPirateLevel=level;currentPirateId=p.id;currentPirateName=p.name;gameMode='pirate';aiPlayer=2;playerNames={1:playerName,2:currentPirateName};forcedTableTheme=campaignMatchTableTheme(p);if(p.id==='chapter2_boss'){const key='tables:wiggles',fresh=!career.unlockedCosmetics?.includes(key);if(fresh)career.unlockedCosmetics=[...(career.unlockedCosmetics||[]),key];equippedTableTheme='wiggles';try{localStorage.setItem('seamenTableTheme',equippedTableTheme)}catch(e){}if(fresh)saveCareer();refreshCosmeticsUI?.();}if(p.chapter==='chapter_2'&&p.id!=='chapter2_boss'){const key='tables:strangevoice';if(!career.unlockedCosmetics?.includes(key)){career.unlockedCosmetics=[...(career.unlockedCosmetics||[]),key];equippedTableTheme='strangevoice';try{localStorage.setItem('seamenTableTheme',equippedTableTheme)}catch(e){}saveCareer();refreshCosmeticsUI?.();}}newFrame(1);}
startPirateMatch?.addEventListener('click',()=>beginPendingPirateMatch(false));
const cancelPirateIntro=document.getElementById('cancelPirateIntro');
cancelPirateIntro?.addEventListener('click',()=>{gamePaused=false;pendingPirateStart=null;pirateIntroModal.hidden=true;playersModal.hidden=false;modeMenu.hidden=true;playersForm.hidden=true;piratePlaceholder.hidden=false;if(testScenarioMenu)testScenarioMenu.hidden=true;if(aiVsAiMenu)aiVsAiMenu.hidden=true;refreshPirateButtons();});
document.getElementById('pirateList')?.addEventListener('click',e=>{if(theatreBusy())return;const begin=e.target.closest('#beginChapter2');if(begin){if(theatreBusy()||!chapterIsUnlocked('chapter_2')||chapterSceneSeen('chapter_2','intro'))return;playersModal.hidden=true;piratePlaceholder.hidden=true;runChapterScene('chapter_2','intro',()=>{playersModal.hidden=false;modeMenu.hidden=true;playersForm.hidden=true;piratePlaceholder.hidden=false;renderPirateRoster();piratePlayerName?.focus();});return;}const btn=e.target.closest('.pirate-choice[data-pirate-id]');if(btn){if(btn.dataset.pirateId==='barley'&&pirateIsOpen('barley')&&!chapterSceneSeen('chapter_3','intro')){profiledPirateId='barley';startProfiledPirate();}else showPirateProfile(btn.dataset.pirateId);}});
challengePirate?.addEventListener('click',startProfiledPirate);closePirateProfile?.addEventListener('click',()=>pirateProfileModal.hidden=true);
renderPirateRoster();
function detectUnsupportedBrowser(){
  const warning=document.getElementById('browserWarning');
  // Capacitor's Android WebView deliberately contains the normal Android `wv`
  // user-agent marker. It is our supported native runtime, not an in-app browser.
  const capacitorNative=!!(window.Capacitor&&typeof window.Capacitor.isNativePlatform==='function'&&window.Capacitor.isNativePlatform());
  const nativeContainer=!!(window.SeamenRuntime&&window.SeamenRuntime.isNativeContainer())||capacitorNative;
  if(nativeContainer){if(warning)warning.hidden=true;return;}
  const ua=navigator.userAgent||'';
  const embedded=/FBAN|FBAV|FB_IAB|Instagram|Messenger|Line\/|TikTok|BytedanceWebview|Snapchat|; wv\)|\bwv\b/i.test(ua);
  const obsolete=/MSIE|Trident\/|Edge\/[0-9]+/i.test(ua);
  const missing=!('PointerEvent' in window)||!document.createElement('canvas').getContext||!('requestAnimationFrame' in window);
  if(warning) warning.hidden=!(embedded||obsolete||missing);
}
detectUnsupportedBrowser();
syncAngleUI();newFrame(1);requestAnimationFrame(loop);

// V0.2.8: contextual break-scoring help.
breakHelp.onclick=()=>{breakRules.hidden=false};closeBreakRules.onclick=()=>{breakRules.hidden=true;if(gamePaused&&rulesHelpModal)rulesHelpModal.hidden=false};breakRules.addEventListener('click',e=>{if(e.target===breakRules){breakRules.hidden=true;if(gamePaused&&rulesHelpModal)rulesHelpModal.hidden=false}});

/* V0.14.6 in-match Game menu and persistent player aim guide. */
const gameMenuModal=document.getElementById('gameMenuModal'),resumeGame=document.getElementById('resumeGame'),aimGuideToggle=document.getElementById('aimGuideToggle'),gameMenuSettings=document.getElementById('gameMenuSettings'),gameMenuRules=document.getElementById('gameMenuRules'),gameMenuConcede=document.getElementById('gameMenuConcede'),gameMenuReturnTitle=document.getElementById('gameMenuReturnTitle'),rulesHelpModal=document.getElementById('rulesHelpModal'),rulesHelpBreak=document.getElementById('rulesHelpBreak'),rulesHelpBack=document.getElementById('rulesHelpBack');
for(const modal of [gameMenuModal,rulesHelpModal])if(modal&&modal.parentElement!==document.body)document.body.appendChild(modal);
let settingsOpenedFromGameMenu=false;
function syncAimGuideSwitch(){if(!aimGuideToggle)return;aimGuideToggle.classList.toggle('is-on',devAngleGuide);aimGuideToggle.setAttribute('aria-checked',String(devAngleGuide));aimGuideToggle.title=`Aim guide: ${devAngleGuide?'On':'Off'}`;}
const aimMethodSimulation=document.getElementById('aimMethodSimulation'),aimMethodReversed=document.getElementById('aimMethodReversed'),aimArrowsToggle=document.getElementById('aimArrowsToggle');
function syncAimMethodControls(){
  for(const [btn,method] of [[aimMethodSimulation,'simulation'],[aimMethodReversed,'reversed']]){
    if(!btn)continue;btn.classList.toggle('is-selected',aimMethod===method);btn.setAttribute('aria-pressed',String(aimMethod===method));
  }
  if(aimArrowsToggle){aimArrowsToggle.classList.toggle('is-on',aimArrows);aimArrowsToggle.setAttribute('aria-checked',String(aimArrows));}
}
if(aimMethodSimulation)aimMethodSimulation.onclick=()=>{aimMethod='simulation';saveAimUXPreferences();syncAimMethodControls();};
if(aimMethodReversed)aimMethodReversed.onclick=()=>{aimMethod='reversed';saveAimUXPreferences();syncAimMethodControls();};

if(aimArrowsToggle)aimArrowsToggle.onclick=()=>{aimArrows=!aimArrows;saveAimUXPreferences();syncAimMethodControls();};
syncAimMethodControls();
function pauseGameForMenu(){if(!state||(state.frameOver&&!schoolSession))return;gamePaused=true;gameApp.dispatchEvent(new Event('gameplay-suspend'));clearTimeout(aiTimer);clearTimeout(aiWatchdogTimer);aiTimer=aiWatchdogTimer=null;if(gameMenuModal)gameMenuModal.hidden=false;syncAimGuideSwitch();syncAimMethodControls();}
function resumePausedGame(){if(gameMenuModal)gameMenuModal.hidden=true;if(rulesHelpModal)rulesHelpModal.hidden=true;gamePaused=false;last=performance.now();setTimeout(maybeScheduleAI,80);}
const gameMenuButton=document.getElementById('reset');if(gameMenuButton)gameMenuButton.onclick=()=>{if(!state||(state.frameOver&&!schoolSession))return;pauseGameForMenu();};
if(resumeGame)resumeGame.onclick=resumePausedGame;
if(aimGuideToggle)aimGuideToggle.onclick=()=>{devAngleGuide=!devAngleGuide;saveAimGuidePreference();syncAimGuideSwitch();const btn=document.getElementById('toggleAngleGuide');if(btn)btn.textContent=`Toggle guide Ian angle: ${devAngleGuide?'ON':'OFF'}`;};
document.getElementById('gameMenuLog').onclick=()=>{gameMenuModal.hidden=true;openGameLog('menu');};
if(gameMenuRules)gameMenuRules.onclick=()=>{gameMenuModal.hidden=true;rulesHelpModal.hidden=false;};
if(rulesHelpBack)rulesHelpBack.onclick=()=>{rulesHelpModal.hidden=true;gameMenuModal.hidden=false;};
if(rulesHelpBreak)rulesHelpBreak.onclick=()=>{rulesHelpModal.hidden=true;breakRules.hidden=false;};
if(gameMenuConcede)gameMenuConcede.onclick=()=>{if(schoolSession){startSchoolLesson(schoolSession.id);return;}if(!confirm('Concede this frame?\n\nThis will count as a loss and immediately start a new frame.'))return;gameMenuModal.hidden=true;rulesHelpModal.hidden=true;gamePaused=false;const conceder=gameMode==='pirate'?1:state.player,winner=gameMode==='pirate'?2:opponent(state.player);recordCareerFrame(winner);state.frameOver=true;state.winner=winner;moving=false;shot=null;msg.textContent=`${pname(conceder)} conceded the frame. Starting a new one.`;lastShotEl.textContent=`CONCEDED • ${pname(winner)} wins`;updateHUD();setTimeout(()=>restartCurrentGame(1),80);};
if(gameMenuReturnTitle)gameMenuReturnTitle.onclick=()=>{if(!confirm('Return to title?\n\nThis unfinished frame will not count as a loss.'))return;gameMenuModal.hidden=true;rulesHelpModal.hidden=true;gamePaused=false;clearTimeout(aiTimer);clearTimeout(aiWatchdogTimer);aiTimer=aiWatchdogTimer=null;forcedTableTheme=null;startMenuMusic();showTitleScreen();};
syncAimGuideSwitch();

/* V0.9.0 audio/presentation controls + soundtrack manager. */
const soundToggle=document.getElementById('soundToggle'),settingsButton=document.getElementById('settingsButton'),settingsModal=document.getElementById('settingsModal'),closeSettings=document.getElementById('closeSettings'),masterVolume=document.getElementById('masterVolume'),masterVolumeText=document.getElementById('masterVolumeText'),masterMute=document.getElementById('masterMute'),musicVolume=document.getElementById('musicVolume'),musicVolumeText=document.getElementById('musicVolumeText'),musicMute=document.getElementById('musicMute'),portraitMotionToggle=document.getElementById('portraitMotionToggle');
// Keep the shared Settings modal at document level so it can open from both the standalone title screen and the in-game header.
if(settingsModal && settingsModal.parentElement!==document.body) document.body.appendChild(settingsModal);
let masterLevel=1,masterMuted=false,musicLevel=.50,musicMuted=false,reducedCharacterPortraitMotion=false,gameplayLayoutPreference='portrait',mobileLandscapePanels={players:true,lastTurn:true,details:false};
try{
  const saved=JSON.parse(localStorage.getItem('seamenAudioSettings')||'{}');
  if(Number.isFinite(saved.masterLevel))masterLevel=Math.max(0,Math.min(1,saved.masterLevel));
  if(typeof saved.masterMuted==='boolean')masterMuted=saved.masterMuted;
  if(Number.isFinite(saved.musicLevel))musicLevel=Math.max(0,Math.min(1,saved.musicLevel));
  if(typeof saved.musicMuted==='boolean')musicMuted=saved.musicMuted;
  if(typeof saved.reducedCharacterPortraitMotion==='boolean')reducedCharacterPortraitMotion=saved.reducedCharacterPortraitMotion;
  if(['portrait','landscape'].includes(saved.gameplayLayout))gameplayLayoutPreference=saved.gameplayLayout;
  for(const key of Object.keys(mobileLandscapePanels))if(typeof saved.mobileLandscapePanels?.[key]==='boolean')mobileLandscapePanels[key]=saved.mobileLandscapePanels[key];
  // V0.9.1 one-time migration: establish the revised 50% soundtrack baseline.
  // Once this marker is written, the player's own subsequent music-volume choice is preserved.
  if(localStorage.getItem('seamenAudio091Music50Migrated')!=='1'){
    musicLevel=.50;
    saved.musicLevel=musicLevel;
    localStorage.setItem('seamenAudioSettings',JSON.stringify({
      masterLevel,masterMuted,musicLevel,musicMuted,reducedCharacterPortraitMotion,gameplayLayout:gameplayLayoutPreference,mobileLandscapePanels
    }));
    localStorage.setItem('seamenAudio091Music50Migrated','1');
  }
}catch(e){}
document.body.classList.toggle('reduced-character-portrait-motion',reducedCharacterPortraitMotion);
function saveAudioSettings(){try{localStorage.setItem('seamenAudioSettings',JSON.stringify({masterLevel,masterMuted,musicLevel,musicMuted,reducedCharacterPortraitMotion,gameplayLayout:gameplayLayoutPreference,mobileLandscapePanels}));}catch(e){}}
function setSwitchState(el,on,label){if(!el)return;el.classList.toggle('is-on',on);el.setAttribute('aria-checked',String(on));el.title=`${label}: ${on?'On':'Off'}`;}
function refreshAudioSettings(){syncStoryNameSettings();if(masterVolume)masterVolume.value=Math.round(masterLevel*100);if(masterVolumeText)masterVolumeText.textContent=`${Math.round(masterLevel*100)}%`;setSwitchState(masterMute,masterMuted,'Master mute');if(musicVolume)musicVolume.value=Math.round(musicLevel*100);if(musicVolumeText)musicVolumeText.textContent=`${Math.round(musicLevel*100)}%`;setSwitchState(musicMute,musicMuted,'Music mute');setSwitchState(portraitMotionToggle,reducedCharacterPortraitMotion,'Reduced character portrait motion');document.body.classList.toggle('reduced-character-portrait-motion',reducedCharacterPortraitMotion);const icon=masterMuted?'🔇':(masterLevel<=0?'🔈':'🔊');const label=masterMuted?'Unmute all sound':'Mute all sound';for(const el of [soundToggle,document.getElementById('titleSoundToggle')]){if(el){el.textContent=icon;el.setAttribute('aria-label',label);el.title=label;}}updateMusicVolume();}
if(soundToggle)soundToggle.onclick=()=>{masterMuted=!masterMuted;refreshAudioSettings();saveAudioSettings();};
if(settingsButton)settingsButton.onclick=()=>{settingsOpenedFromGameMenu=false;refreshAudioSettings();settingsModal.hidden=false;};
if(gameMenuSettings)gameMenuSettings.onclick=()=>{settingsOpenedFromGameMenu=true;gameMenuModal.hidden=true;refreshAudioSettings();settingsModal.hidden=false;};
if(closeSettings)closeSettings.onclick=()=>{settingsModal.hidden=true;if(settingsOpenedFromGameMenu){settingsOpenedFromGameMenu=false;gameMenuModal.hidden=false;}};
/* V0.12.0 hidden DEV shortcut: while the title-screen Settings panel is open,
   pressing K jumps straight into the existing developer panel. Deliberately
   undiscoverable in the normal UI. */
document.addEventListener('keydown',e=>{
  if(theatreInputBlocked()||!IS_DEVELOPMENT_BUILD)return;
  if(e.ctrlKey||e.metaKey||e.altKey||e.repeat)return;
  if((e.key||'').toLowerCase()!=='k')return;
  const titleSettingsOpen=settingsModal && !settingsModal.hidden && titleScreen && !titleScreen.hidden;
  if(!titleSettingsOpen)return;
  const tag=(e.target?.tagName||'').toLowerCase();
  if(tag==='input'||tag==='textarea'||tag==='select')return;
  e.preventDefault();
  settingsModal.hidden=true;
  titleScreen.hidden=true;
  if(gameApp)gameApp.hidden=false;
  const devDetails=document.querySelector('.dev')?.closest('details');
  if(devDetails){devDetails.open=true;requestAnimationFrame(()=>devDetails.scrollIntoView({behavior:'smooth',block:'start'}));}
});
if(settingsModal)settingsModal.addEventListener('click',e=>{if(e.target===settingsModal){settingsModal.hidden=true;if(settingsOpenedFromGameMenu){settingsOpenedFromGameMenu=false;gameMenuModal.hidden=false;}}});
if(masterVolume)masterVolume.oninput=()=>{masterLevel=Number(masterVolume.value)/100;refreshAudioSettings();saveAudioSettings();};
if(masterMute)masterMute.onclick=()=>{masterMuted=!masterMuted;refreshAudioSettings();saveAudioSettings();};
if(musicVolume)musicVolume.oninput=()=>{musicLevel=Number(musicVolume.value)/100;refreshAudioSettings();saveAudioSettings();};
if(musicMute)musicMute.onclick=()=>{musicMuted=!musicMuted;refreshAudioSettings();saveAudioSettings();};
if(portraitMotionToggle)portraitMotionToggle.onclick=()=>{reducedCharacterPortraitMotion=!reducedCharacterPortraitMotion;refreshAudioSettings();saveAudioSettings();};

/* Hardened portable save-data framework. Only owned Seamen keys are exported/imported. */
const SAVE_FILE_SCHEMA=2;
const SAVE_KEYS=['seamenCareer','seamenPirateUnlocked','seamenTableTheme','seamenCue','seamenTutorialSeen','seamenAudioSettings','seamenAudio091Music50Migrated','seamenAimGuide','seamenAimMethod','seamenAimArrows','seamenAimUXMigration171','seamenDaveFirstSelectionSeen','seamenFirstRunPathComplete'];
const PLAYER_PROGRESS_KEYS=['seamenCareer','seamenPirateUnlocked','seamenTableTheme','seamenCue','seamenTutorialSeen','seamenDaveFirstSelectionSeen','seamenFirstRunPathComplete'];
const exportSaveBtn=document.getElementById('exportSave'),importSaveBtn=document.getElementById('importSave'),importSaveFile=document.getElementById('importSaveFile'),resetPlayerDataBtn=document.getElementById('resetPlayerData'),saveDataStatus=document.getElementById('saveDataStatus');
function setSaveDataStatus(text,isError=false){if(!saveDataStatus)return;saveDataStatus.textContent=text||'';saveDataStatus.style.color=isError?'#f0a49a':'';}
function collectStorage(keys=SAVE_KEYS){const data={};for(const key of keys){const value=localStorage.getItem(key);if(value!==null)data[key]=value;}return data;}
function collectPortableSave(){return{game:APP_NAME,saveSchema:SAVE_FILE_SCHEMA,gameVersion:APP_VERSION,exportedAt:new Date().toISOString(),data:collectStorage()};}
function validFlag(v){return v==='0'||v==='1';}
function validateCareerData(c){if(!c||typeof c!=='object'||Array.isArray(c))throw new Error('Career data is damaged.');if(Number(c.schema||1)>CAREER_SCHEMA)throw new Error('This career save was made by a newer incompatible version.');for(const key of ['framesPlayed','framesWon','framesLost','shotsTaken','legalBallsPotted','foulsCommitted','bestPotStreak','sevenBallWins','blackOnBlackWins','foulFreeWins','oneVisitClearances']){if(c[key]!==undefined&&(!Number.isFinite(Number(c[key]))||Number(c[key])<0))throw new Error('Career data contains an invalid statistic.');}if(c.earnedAchievements!==undefined&&!Array.isArray(c.earnedAchievements))throw new Error('Career achievement data is damaged.');if(c.seenCosmetics!==undefined&&!Array.isArray(c.seenCosmetics))throw new Error('Career cosmetic data is damaged.');if(c.unlockedCosmetics!==undefined&&!Array.isArray(c.unlockedCosmetics))throw new Error('Career unlocked cosmetic data is damaged.');if(c.piratesDefeated!==undefined&&(!c.piratesDefeated||typeof c.piratesDefeated!=='object'||Array.isArray(c.piratesDefeated)))throw new Error('Career pirate data is damaged.');if(c.chapters!==undefined&&(!c.chapters||typeof c.chapters!=='object'||Array.isArray(c.chapters)))throw new Error('Career chapter data is damaged.');if(c.pirateRecords!==undefined&&(!c.pirateRecords||typeof c.pirateRecords!=='object'||Array.isArray(c.pirateRecords)))throw new Error('Career pirate record data is damaged.');}
function validatePortableSave(obj){if(!obj||typeof obj!=='object'||Array.isArray(obj))throw new Error('This is not a valid Seamen save file.');if(obj.game!=='Seamen English Rules Pool')throw new Error('This file does not appear to be a Seamen save.');if(!Number.isInteger(obj.saveSchema)||obj.saveSchema<1||obj.saveSchema>SAVE_FILE_SCHEMA)throw new Error('This save uses an unsupported save-file version.');if(!obj.data||typeof obj.data!=='object'||Array.isArray(obj.data))throw new Error('The save file has no valid data section.');for(const key of Object.keys(obj.data)){if(!SAVE_KEYS.includes(key))throw new Error('The save contains an unexpected data field.');if(typeof obj.data[key]!=='string')throw new Error('The save contains malformed data.');}
 if(obj.data.seamenCareer){let c;try{c=JSON.parse(obj.data.seamenCareer)}catch(e){throw new Error('Career data is damaged.');}validateCareerData(c);}
 if(obj.data.seamenPirateUnlocked!==undefined){const n=Number(obj.data.seamenPirateUnlocked);if(!Number.isInteger(n)||n<1||n>5)throw new Error('Pirate progression data is damaged.');}
 if(obj.data.seamenTableTheme!==undefined&&!Object.prototype.hasOwnProperty.call(COSMETICS.tables,obj.data.seamenTableTheme))throw new Error('Table cosmetic data is damaged.');
 if(obj.data.seamenCue!==undefined&&!Object.prototype.hasOwnProperty.call(COSMETICS.cues,obj.data.seamenCue))throw new Error('Cue cosmetic data is damaged.');
 for(const key of ['seamenTutorialSeen','seamenAudio091Music50Migrated','seamenAimGuide','seamenAimArrows','seamenAimUXMigration171','seamenDaveFirstSelectionSeen','seamenFirstRunPathComplete'])if(obj.data[key]!==undefined&&!validFlag(obj.data[key]))throw new Error('A saved preference is damaged.');
 if(obj.data.seamenAimMethod!==undefined&&!['simulation','reversed'].includes(obj.data.seamenAimMethod))throw new Error('Aim method preference is damaged.');
 if(obj.data.seamenAudioSettings){let a;try{a=JSON.parse(obj.data.seamenAudioSettings)}catch(e){throw new Error('Audio/settings data is damaged.');}if(!a||typeof a!=='object'||Array.isArray(a))throw new Error('Audio/settings data is damaged.');if(a.mobileLandscapePanels!==undefined){const panels=a.mobileLandscapePanels;if(!panels||typeof panels!=='object'||Array.isArray(panels)||Object.keys(panels).some(key=>!['players','lastTurn','details'].includes(key)||typeof panels[key]!=='boolean'))throw new Error('Mobile information panel preferences are damaged.');}if(a.gameplayLayout!==undefined&&!['portrait','landscape'].includes(a.gameplayLayout))throw new Error('Gameplay layout preference is damaged.');for(const key of ['masterLevel','musicLevel'])if(a[key]!==undefined&&(!Number.isFinite(Number(a[key]))||Number(a[key])<0||Number(a[key])>1))throw new Error('Audio/settings data is damaged.');for(const key of ['masterMuted','musicMuted','reducedCharacterPortraitMotion'])if(a[key]!==undefined&&typeof a[key]!=='boolean')throw new Error('Audio/settings data is damaged.');}
 return true;}
function restoreStorageSnapshot(snapshot){for(const key of SAVE_KEYS)localStorage.removeItem(key);for(const [key,value] of Object.entries(snapshot))localStorage.setItem(key,value);}
function applyPortableSave(obj){validatePortableSave(obj);const before=collectStorage();try{for(const key of SAVE_KEYS)localStorage.removeItem(key);for(const [key,value] of Object.entries(obj.data))localStorage.setItem(key,value);for(const [key,value] of Object.entries(obj.data))if(localStorage.getItem(key)!==value)throw new Error('The browser could not verify the imported save.');}catch(e){try{restoreStorageSnapshot(before);}catch(rollbackError){}throw new Error('Import failed safely. Your previous save has been restored.');}}
if(exportSaveBtn)exportSaveBtn.onclick=async()=>{try{const payload=JSON.stringify(collectPortableSave(),null,2),d=new Date().toISOString().slice(0,10),filename=`seamen-pool-save-${d}.json`;const nativeContainer=!!(window.SeamenRuntime&&window.SeamenRuntime.isNativeContainer());const filesystem=window.Capacitor&&window.Capacitor.Plugins&&window.Capacitor.Plugins.Filesystem;if(nativeContainer){if(!filesystem||typeof filesystem.writeFile!=='function')throw new Error('Native save export is not available in this installation.');await filesystem.writeFile({path:filename,data:payload,directory:'DOCUMENTS',encoding:'utf8'});setSaveDataStatus(`Save exported to Documents/${filename}`);return;}const blob=new Blob([payload],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);setSaveDataStatus(`Save exported as ${filename}. Keep the JSON file somewhere safe.`);}catch(e){setSaveDataStatus(e&&e.message?e.message:'Could not export the save.',true);}};
if(importSaveBtn)importSaveBtn.onclick=()=>{if(importSaveFile){importSaveFile.value='';importSaveFile.click();}};
if(importSaveFile)importSaveFile.onchange=async()=>{const file=importSaveFile.files&&importSaveFile.files[0];if(!file)return;try{const obj=JSON.parse(await file.text());validatePortableSave(obj);if(!confirm('Import this save? Your current Seamen progress and saved settings will be replaced.')){setSaveDataStatus('Import cancelled.');return;}applyPortableSave(obj);setSaveDataStatus('Save imported successfully. Reloading…');setTimeout(()=>location.reload(),450);}catch(e){setSaveDataStatus(e&&e.message?e.message:'Could not import this save file.',true);}};
if(resetPlayerDataBtn)resetPlayerDataBtn.onclick=()=>{if(!confirm('Reset ALL Seamen player progress? This removes career statistics, trophies, pirate progress, unlocked/equipped cosmetics and first-run/tutorial progress. Audio and Aim guide preferences are kept. This cannot be undone.'))return;if(!confirm('Final confirmation: permanently reset all player progress on this browser?'))return;for(const key of PLAYER_PROGRESS_KEYS){try{localStorage.removeItem(key)}catch(e){}}if(IS_DEVELOPMENT_BUILD){setDevEntitlement('supporter_founder_test',false);}setSaveDataStatus('Player progress and development supporter test access reset. Reloading…');setTimeout(()=>location.reload(),450);};



/* V0.9.0 soundtrack manager.
   Music states:
   - anthem: fresh boot / pre-match navigation
   - match: continuous gameplay-session playlist; a new random non-repeating match track starts only when the current one ends
   - menu: Ale in the Hold after returning from a completed/started frame
   - credits: takes over when About / credits is opened and continues until a frame starts
   - outro: reserved for a future story/outro feature and intentionally unused
*/
const MUSIC={
  anthem:'assets/music/anthem.m4a',
  menu:'assets/music/ale-in-the-hold.m4a',
  credits:'assets/music/credits1.m4a',
  outro:'assets/music/outro1.m4a',
  matches:Array.from({length:10},(_,i)=>`assets/music/match${i+1}.m4a`)
};
const musicDeck=[new Audio(),new Audio()];
musicDeck.forEach(a=>{a.preload='auto';a.loop=false;a.playsInline=true;});
let activeMusicDeck=0,currentMusicKey='',pendingMusicRequest=null,lastMatchMusic=-1,musicFadeToken=0;
function musicTargetVolume(){return (masterMuted||musicMuted)?0:Math.max(0,Math.min(1,masterLevel*musicLevel));}
function updateMusicVolume(){
  k4UpdateCannonVolume();
  if(!musicDeck)return;
  const target=musicTargetVolume();
  musicDeck.forEach((a,i)=>{if(i===activeMusicDeck&&!a.paused)a.volume=target;else if(a.paused)a.volume=0;});
}
function fadeMusicVolume(audio,from,to,duration,token,onDone){
  const start=performance.now();
  function step(now){
    if(token!==musicFadeToken)return;
    const t=Math.min(1,(now-start)/duration),v=from+(to-from)*t;
    audio.volume=Math.max(0,Math.min(1,v));
    if(t<1)requestAnimationFrame(step);else if(onDone)onDone();
  }
  requestAnimationFrame(step);
}
async function playMusic(key,src,{crossfade=true}={}){
  if(!src)return;
  if(currentMusicKey===key&&!musicDeck[activeMusicDeck].paused){updateMusicVolume();return;}
  const old=musicDeck[activeMusicDeck],nextIndex=1-activeMusicDeck,next=musicDeck[nextIndex];
  const token=++musicFadeToken,target=musicTargetVolume();
  pendingMusicRequest={key,src};
  next.pause();next.currentTime=0;next.src=src;next.loop=!key.startsWith('match');next.onended=key.startsWith('match')?()=>{if(activeMusicDeck===nextIndex&&currentMusicKey===key)startMatchMusic();}:null;next.volume=0;
  try{
    await next.play();
    if(token!==musicFadeToken)return; // A newer gesture/track supersedes this request.
    if(token!==musicFadeToken)return;
    pendingMusicRequest=null;currentMusicKey=key;activeMusicDeck=nextIndex;
    if(crossfade&&!old.paused&&old.src){
      const oldStart=old.volume;
      fadeMusicVolume(old,oldStart,0,800,token,()=>{old.pause();old.currentTime=0;});
      fadeMusicVolume(next,0,target,800,token);
    }else{
      if(!old.paused){old.pause();old.currentTime=0;}
      next.volume=target;
    }
  }catch(err){
    // Mobile browsers may block audible autoplay until the first user gesture.
    // Keep the requested state queued; gameplay must never depend on music succeeding.
    if(token===musicFadeToken)next.pause();
  }
}
function retryPendingMusic(){
  if(!pendingMusicRequest)return;
  const {key,src}=pendingMusicRequest;
  playMusic(key,src,{crossfade:false});
}
// Retry rejected media only on a later real interaction; gameplay never waits for it.
function retryMusicFromGesture(){
  if(!pendingMusicRequest||musicTargetVolume()<=0)return;
  try{audioReady();retryPendingMusic();}catch(_){/* Audio can remain unavailable without blocking play. */}
}
document.addEventListener('pointerdown',retryMusicFromGesture,{passive:true});
document.addEventListener('keydown',retryMusicFromGesture,{passive:true});
function startBootAnthem(){playMusic('anthem',MUSIC.anthem,{crossfade:false});}
function startMenuMusic(){k4ExitEncounter();playMusic('menu',MUSIC.menu);}
function startCreditsMusic(){playMusic('credits',MUSIC.credits);}
function startOutroMusic(){if(k4Runtime.bossId||k4Runtime.lucy){k4LucyMusic();return;}playMusic('outro',MUSIC.outro);}
// V0.13.2: match music chooses randomly whenever a track ends, while
// preventing the track that just played from being selected immediately again.
// A track becomes eligible again after any different match track has played.
function startMatchMusic(){
  if(k4Runtime.bossId||k4Runtime.lucy){k4LucyMusic();return;}
  let pick=0;
  if(MUSIC.matches.length>1){
    do{pick=Math.floor(Math.random()*MUSIC.matches.length);}while(pick===lastMatchMusic);
  }
  lastMatchMusic=pick;
  playMusic(`match${pick+1}`,MUSIC.matches[pick]);
}
// V0.15.7c: if a match track reaches its end while Android has the WebView in the
// background, its normal ended -> next-track transition may be deferred or its
// play() call may be rejected. On resume, retry a queued request first; otherwise
// restart the normal non-repeating match selector only when the active track has
// genuinely ended/stopped. Menu/credits loops are left alone.
function reconcileMusicAfterResume(){
  if(masterMuted||musicMuted||masterLevel<=0||musicLevel<=0)return;
  if(k4Runtime.bossId||k4Runtime.lucy){k4RetryAudio();return;}
  if(pendingMusicRequest){retryPendingMusic();return;}
  const active=musicDeck[activeMusicDeck];
  if(currentMusicKey.startsWith('match')&&(!active||active.ended||active.paused)){startMatchMusic();return;}
  updateMusicVolume();
}
refreshAudioSettings();


/* V0.8.6 title screen / outer menu. Presentation only; gameplay engine unchanged. */
if(settingsModal&&settingsModal.parentElement?.id==='gameApp')document.body.appendChild(settingsModal);
const gameApp=document.getElementById('gameApp'),titleScreen=document.getElementById('titleScreen'),titlePlay=document.getElementById('titlePlay'),titleSettings=document.getElementById('titleSettings'),titleAbout=document.getElementById('titleAbout'),titleTrophies=document.getElementById('titleTrophies'),titleCosmetics=document.getElementById('titleCosmetics'),titleSupport=document.getElementById('titleSupport'),supportScreen=document.getElementById('supportScreen'),supportBack=document.getElementById('supportBack'),supportEntitlementState=document.getElementById('supportEntitlementState'),supportAvailability=document.getElementById('supportAvailability'),cosmeticsScreen=document.getElementById('cosmeticsScreen'),cosmeticsBack=document.getElementById('cosmeticsBack'),trophiesScreen=document.getElementById('trophiesScreen'),trophiesBack=document.getElementById('trophiesBack'),titleSoundToggle=document.getElementById('titleSoundToggle'),aboutScreen=document.getElementById('aboutScreen'),aboutContent=document.getElementById('aboutContent'),aboutBack=document.getElementById('aboutBack'),backToTitle=document.getElementById('backToTitle');
function renderAbout(){if(!aboutContent)return;const sections=window.SeamenAbout?.sections||[];aboutContent.innerHTML='';for(const s of sections){const section=document.createElement('section'),h=document.createElement('h3'),p=document.createElement('p');h.textContent=s.title||'';p.textContent=s.body||'';section.append(h,p);if(Array.isArray(s.links)&&s.links.length){const links=document.createElement('p');links.className='about-links';s.links.forEach((item,i)=>{if(i)links.append(document.createTextNode(' | '));const a=document.createElement('a');a.href=item.url;a.textContent=item.label;a.target='_blank';a.rel='noopener noreferrer';links.append(a);});section.append(links);}aboutContent.append(section);}}
function showPirateRosterAfterStory(){
  hidePirateDialogue();
  showTitleScreen();
  if(titleScreen)titleScreen.hidden=true;
  if(playersModal)playersModal.hidden=false;
  if(modeMenu)modeMenu.hidden=true;
  if(playersForm)playersForm.hidden=true;
  if(piratePlaceholder)piratePlaceholder.hidden=false;
  renderPirateRoster();
  document.dispatchEvent(new CustomEvent('story-roster-return'));
}
function showTitleScreen(){if(storyRenameFromSettings){storyRenameFromSettings=false;piratePlaceholder.classList.remove('story-name-only');pirateBack.textContent='Back';piratePlayerName.value=storyPlayerName();}k4ExitEncounter();resetCueSpin();if(typeof schoolSession!=='undefined'&&schoolSession)leaveSchoolTable();hidePirateDialogue();gamePaused=false;if(gameMenuModal)gameMenuModal.hidden=true;if(rulesHelpModal)rulesHelpModal.hidden=true;pendingPirateStart=null;if(gameApp)gameApp.hidden=true;if(playersModal)playersModal.hidden=true;if(pirateProfileModal)pirateProfileModal.hidden=true;if(pirateIntroModal)pirateIntroModal.hidden=true;if(winModal)winModal.hidden=true;if(gameLogModal)gameLogModal.hidden=true;if(aboutScreen)aboutScreen.hidden=true;if(trophiesScreen)trophiesScreen.hidden=true;if(cosmeticsScreen)cosmeticsScreen.hidden=true;if(supportScreen)supportScreen.hidden=true;if(progressionRewardModal)progressionRewardModal.hidden=true;if(titleScreen)titleScreen.hidden=false;renderStoryReminder();refreshFirstRunGuidance();}
function showWhoIsPlaying(){if(titleScreen)titleScreen.hidden=true;if(gameApp)gameApp.hidden=true;showModeMenu();refreshFirstRunGuidance();}
if(titlePlay)titlePlay.onclick=()=>{if(theatreBusy())return;audioReady();showWhoIsPlaying();pirateMode.click();};
const titleLocalMultiplayer=document.getElementById('titleLocalMultiplayer');
if(titleLocalMultiplayer)titleLocalMultiplayer.onclick=()=>{if(theatreBusy())return;audioReady();showWhoIsPlaying();localMode.click();};
const poolSchoolBack=document.getElementById('poolSchoolBack');if(poolSchoolBack)poolSchoolBack.onclick=()=>{document.getElementById('poolSchoolScreen').hidden=true;playersModal.hidden=false;modeMenu.hidden=true;playersForm.hidden=true;piratePlaceholder.hidden=false;renderPirateRoster();};
if(backToTitle)backToTitle.onclick=showTitleScreen;
if(titleSettings)titleSettings.onclick=()=>{audioReady();refreshAudioSettings();settingsModal.hidden=false;};
document.getElementById('renameStoryPlayer').onclick=()=>{
 if(document.getElementById('titleScreen').hidden)return;
 storyRenameFromSettings=true;settingsModal.hidden=true;playersModal.hidden=false;modeMenu.hidden=true;playersForm.hidden=true;testScenarioMenu.hidden=true;piratePlaceholder.hidden=false;
 piratePlaceholder.classList.add('story-name-only');document.getElementById('pirateRosterHeading').textContent='Your Story Mode name';pirateBack.textContent='Back to Settings';document.getElementById('storyNameFeedback').textContent='';piratePlayerName.value=storyPlayerName();piratePlayerName.focus();piratePlayerName.select();
};

let activeCosmeticFilter='all';
function cosmeticDisplayDef(type,id){
 const def=COSMETICS[type]?.[id];if(!def)return def;
 // Match the roster's reveal milestones; the developer I shortcut only opens rosters.
 const hiddenWiggles=id==='wiggles'&&(type==='tables'||type==='cues')&&!chapterState('chapter_2').bossIntroSeen;
 const hiddenBlockbeard=(id==='blockbeard'&&type==='tables'||id==='golden'&&type==='cues')&&!pirateDefeated('souronion');
 if((def.sourceId&&window.SeamenChapter4.opponents.some(p=>p.id===def.sourceId)&&!pirateDefeated(def.sourceId))||hiddenWiggles||hiddenBlockbeard)return {...def,name:'???',description:'A mysterious cosmetic. Its identity has not yet been revealed.',owner:undefined,unlock:'Continue the story to discover this cosmetic.'};
 return type==='cues'&&id==='golden'&&chapterState('chapter_3').completed?{...def,name:"Blockbeard's Golden Replica",description:'The legendary cue was only a painted imitation.'}:def;
}
function cosmeticStateText(type,id,unlocked,equipped){const def=cosmeticDisplayDef(type,id),key=cosmeticKey(type,id),isNew=unlocked&&!(career.seenCosmetics||[]).includes(key);if(equipped)return 'EQUIPPED';if(isNew)return 'NEW';if(unlocked)return 'OWNED';return `LOCKED • ${def?.unlock||'Requirement not met.'}`;}
function decorateCosmeticCard(card,type,id){const def=COSMETICS[type]?.[id];if(!def)return;let badge=card.querySelector('.cosmetic-source');if(!badge){badge=document.createElement('span');badge.className='cosmetic-source';const copy=card.querySelector('.cosmetic-copy')||card;copy.insertBefore(badge,copy.firstChild);}badge.textContent=COSMETIC_SOURCE_LABELS[def.source]||String(def.source||'').toUpperCase();badge.dataset.source=def.source;card.dataset.source=def.source;card.dataset.sourceId=def.sourceId||'';}
function cosmeticCardStatus(type,id){const unlocked=cosmeticIsUnlocked(type,id),equipped=unlocked&&((type==='tables'&&id===equippedTableTheme)||(type==='cues'&&id===equippedCue)),key=cosmeticKey(type,id),isNew=unlocked&&!(career.seenCosmetics||[]).includes(key);if(isNew)return 'new';if(equipped)return 'equipped';if(unlocked)return 'owned';return 'others';}
function applyCosmeticFilter(){const activePanel=document.querySelector('.cosmetic-panel.active');if(!activePanel)return;const type=activePanel.dataset.cosmeticPanel==='tables'?'tables':'cues';let shown=0;activePanel.querySelectorAll('[data-theme], [data-cue], .cue-preview-card.supporter').forEach(card=>{let status='others';const id=card.dataset.theme||card.dataset.cue;if(id)status=cosmeticCardStatus(type,id);const visible=activeCosmeticFilter==='all'||status===activeCosmeticFilter;card.classList.toggle('cosmetic-filter-hidden',!visible);if(visible)shown++;});let empty=activePanel.querySelector('.cosmetic-filter-empty');if(!empty){empty=document.createElement('p');empty.className='cosmetic-filter-empty';const grid=activePanel.querySelector('.cosmetic-showcase,.cue-showcase')||activePanel;grid.appendChild(empty);}const label={all:'cosmetics',new:'new cosmetics',equipped:'equipped cosmetics',owned:'owned cosmetics',others:'other cosmetics'}[activeCosmeticFilter]||'cosmetics';empty.textContent=`No ${label} in this category.`;empty.hidden=shown>0;}
function refreshCosmeticsUI(){validateEquippedCue();document.querySelectorAll('[data-theme], [data-cue]').forEach(card=>{const type=card.dataset.theme?'tables':'cues',id=card.dataset.theme||card.dataset.cue,def=cosmeticDisplayDef(type,id);if(!def)return;const name=card.querySelector(type==='tables'?'.cosmetic-copy > b':':scope > b'),desc=card.querySelector(type==='tables'?'.cosmetic-copy > small':':scope > small');if(name)name.textContent=def.name;if(desc)desc.textContent=def.description||'';if(type==='cues'){if(def.owner)card.dataset.owner=def.owner;else delete card.dataset.owner;}});document.querySelectorAll('.cosmetic-choice[data-theme]').forEach(b=>{const id=b.dataset.theme,unlocked=cosmeticIsUnlocked('tables',id),equipped=id===equippedTableTheme&&unlocked,key=cosmeticKey('tables',id),isNew=unlocked&&!(career.seenCosmetics||[]).includes(key);decorateCosmeticCard(b,'tables',id);b.classList.toggle('equipped',equipped);b.classList.toggle('locked',!unlocked);b.classList.toggle('new',isNew);b.disabled=!unlocked;const state=b.querySelector('.cosmetic-state');if(state)state.textContent=cosmeticStateText('tables',id,unlocked,equipped);});document.querySelectorAll('.cue-choice[data-cue]').forEach(b=>{const id=b.dataset.cue,unlocked=cosmeticIsUnlocked('cues',id),equipped=id===equippedCue&&unlocked,key=cosmeticKey('cues',id),isNew=unlocked&&!(career.seenCosmetics||[]).includes(key);decorateCosmeticCard(b,'cues',id);b.classList.toggle('equipped',equipped);b.classList.toggle('locked',!unlocked);b.classList.toggle('new',isNew);b.disabled=!unlocked;const state=b.querySelector('.cosmetic-state');if(state)state.textContent=cosmeticStateText('cues',id,unlocked,equipped);});applyCosmeticFilter();refreshCueCosmeticPreviews();}
function acknowledgeCosmetic(type,id){const key=cosmeticKey(type,id),seen=new Set(career.seenCosmetics||[]);if(!seen.has(key)){seen.add(key);career.seenCosmetics=[...seen];try{localStorage.setItem(CAREER_KEY,JSON.stringify(career));}catch(e){}}}
/* V0.17.0 build 1525: cosmetic cards are generated from COSMETICS. Adding a cue/table now requires catalogue metadata + its visual CSS/asset, not hand-written index.html markup. */
function renderCosmeticCatalogue(){
 const tableGrid=document.querySelector('[data-cosmetic-panel="tables"] .cosmetic-showcase'),cueGrid=document.querySelector('[data-cosmetic-panel="cues"] .cue-showcase');
 if(tableGrid){tableGrid.innerHTML='';for(const [id,rawDef] of Object.entries(COSMETICS.tables)){const def=cosmeticDisplayDef('tables',id);if(rawDef.devOnly&&!IS_DEVELOPMENT_BUILD)continue;const b=document.createElement('button');b.className='cosmetic-choice cosmetic-card-choice';b.dataset.theme=id;b.type='button';const preview=document.createElement('span');preview.className=`table-mini ${def.previewClass||''}`.trim();const copy=document.createElement('span');copy.className='cosmetic-copy';const name=document.createElement('b');name.textContent=def.name;const desc=document.createElement('small');desc.textContent=def.description||'';const state=document.createElement('em');state.className='cosmetic-state';copy.append(name,desc,state);b.append(preview,copy);tableGrid.appendChild(b);}}
 if(cueGrid){cueGrid.innerHTML='';for(const [id,rawDef] of Object.entries(COSMETICS.cues)){const def=cosmeticDisplayDef('cues',id);if(rawDef.devOnly&&!IS_DEVELOPMENT_BUILD)continue;const b=document.createElement('button');b.className=`cue-preview-card cue-choice${def.source==='supporter'?' supporter':''}`;b.dataset.cue=id;if(def.owner)b.dataset.owner=def.owner;b.type='button';const preview=document.createElement('canvas');preview.className='cue-preview cue-preview-live';preview.dataset.cueRender=id;preview.setAttribute('aria-hidden','true');const name=document.createElement('b');name.textContent=def.name;const desc=document.createElement('small');desc.textContent=def.description||'';const state=document.createElement('em');state.className='cosmetic-state';b.append(preview,name,desc,state);cueGrid.appendChild(b);}}
}
renderCosmeticCatalogue();
refreshCueCosmeticPreviews();
// Animate the Debugger catalogue cue using the same renderer as gameplay.
setInterval(()=>{const panel=document.querySelector('[data-cosmetic-panel="cues"]');if(panel&&panel.classList.contains('active')&&!document.getElementById('cosmeticsScreen')?.hidden){panel.querySelectorAll('canvas[data-cue-render]').forEach(preview=>{if(['debugger','most_evil','lucy_fir','spinball_wizard'].includes(preview.dataset.cueRender))renderCueCosmeticPreview(preview,preview.dataset.cueRender);});}},90);
document.querySelectorAll('.cosmetic-choice[data-theme]').forEach(b=>b.addEventListener('click',()=>{const id=b.dataset.theme;if(!cosmeticIsUnlocked('tables',id))return;acknowledgeCosmetic('tables',id);equippedTableTheme=id;try{localStorage.setItem('seamenTableTheme',equippedTableTheme)}catch(e){}refreshCosmeticsUI();if(schoolCosmeticLesson)completeSchoolLesson(5);}));
document.querySelectorAll('.cue-choice[data-cue]').forEach(b=>b.addEventListener('click',()=>{const id=b.dataset.cue;if(!cosmeticIsUnlocked('cues',id))return;acknowledgeCosmetic('cues',id);equippedCue=id;try{localStorage.setItem('seamenCue',equippedCue)}catch(e){}refreshCosmeticsUI();if(schoolCosmeticLesson)completeSchoolLesson(5);}));
const titlePrivacy=document.getElementById('titlePrivacy'),privacyScreen=document.getElementById('privacyScreen'),privacyBack=document.getElementById('privacyBack');
if(titlePrivacy)titlePrivacy.onclick=()=>{privacyScreen.hidden=false;};
if(privacyBack)privacyBack.onclick=()=>{privacyScreen.hidden=true;};
function refreshSupportArea(){
 const session=SeamenSupporter.getState(),status=session.status,owner=SeamenSupporter.hasVerifiedOwnership();
 const copy={verified_owner:'Supporter Pack verified and active. Thank you!',not_owned:'No Supporter Pack purchase was found on this Google Play account.',pending:'Your purchase is pending. Paid content stays locked until payment and verification finish.',checking:'Checking ownership...',verification_unavailable:session.verificationAvailable===false||session.reason==='server_verification_required'?'Ownership checking needs the updated Android billing integration. Purchases remain disabled.':'Ownership could not be verified. Google Play or verification is unavailable. No paid content has been unlocked.'};
 if(session.action==='purchase'&&session.busy)copy[status]='Waiting for Google Play… Finish or cancel the purchase in the Play window. Ownership will be checked afterwards.';
 if(owner&&session.action==='restore')copy.verified_owner='Restore successful. Google Play confirms your Supporter Pack is active. Thank you!';
 if(owner&&session.action==='purchase')copy.verified_owner=session.purchaseOutcome==='already_owned'?'Already owned. Google Play confirms your Supporter Pack is active. No second purchase is needed.':session.purchaseOutcome==='completed'?'Purchase completed. Google Play confirms your Supporter Pack is active. Thank you!':copy.verified_owner;
 if(!owner&&!session.busy&&session.action==='purchase'&&session.purchaseOutcome){
  const outcome={cancelled:'Purchase cancelled.',failed:'The purchase could not be completed.',unavailable:'This purchase is currently unavailable.',interrupted:'The purchase was interrupted.',in_progress:'A Google Play purchase is already being checked.',pending:'Payment is pending. Paid content remains locked.',completed:'Play returned from the purchase. Ownership still needs confirmation.',already_owned:'Google Play reported an existing purchase. Ownership still needs confirmation.'}[session.purchaseOutcome]||'Ownership still needs confirmation.';
  const result=status==='not_owned'?'No Supporter Pack purchase was found on this Google Play account.':status==='pending'?'Payment is pending; paid content remains locked.':'Ownership could not be verified. Restore Purchases to check again. No paid content has been unlocked.';
  copy[status]=status==='pending'?result:outcome+' '+result;
 }
 if(titleSupport){titleSupport.disabled=owner;titleSupport.dataset.ownership=status;const heading=titleSupport.querySelector('span'),subtitle=titleSupport.querySelector('small');heading.textContent=owner?'Supporter Pack purchased and active':'Support the game and extras';subtitle.textContent=owner?'Thank you!':status==='not_owned'?'Unlock lots of bonuses forever – find out more!':status==='pending'?'Purchase pending – find out more.':status==='checking'?'Checking ownership…':'Ownership verification unavailable – find out more.';}
 if(owner&&status!=='verified_owner')copy[status]=session.busy?'Checking ownership… Your current verified Supporter Pack access remains active.':'Your current verified Supporter Pack access remains active. Google Play could not refresh ownership yet.';
 if(supportEntitlementState){supportEntitlementState.textContent=copy[status];supportEntitlementState.classList.toggle('owned',owner);}
 const availability=document.getElementById('supportAvailability');
 if(availability){
  availability.textContent=session.reason==='web'?'Supporter purchases and Google Play ownership checks are available in the Android app.':owner?'Your permanent Supporter Pack is active. No further purchase is needed.':status==='pending'?'Payment is pending. Google Play will confirm when it is complete.':session.busy&&session.action==='purchase'?'Complete or cancel your purchase in the Google Play window.':session.busy?'Checking purchase availability…':session.purchasesEnabled===false?'Purchases are currently unavailable. You can still restore an existing purchase.':session.purchasesEnabled!==true||status==='verification_unavailable'?'Google Play purchase availability could not be confirmed. Check your connection and try Restore Purchases.':!session.price?'Google Play could not provide a price for this account. Try again later.':'One permanent purchase through Google Play. '+session.price+(session.currency?' ('+session.currency+')':'')+'.';
 }
 const price=document.getElementById('supportPrice');if(price)price.textContent=session.price?'Google Play regional price: '+session.price+(session.currency?' ('+session.currency+')':''):'Regional price unavailable. It will be supplied by Google Play.';
 const purchase=document.getElementById('purchaseSupporter');if(purchase){purchase.disabled=!SeamenSupporter.canPurchase();purchase.textContent=owner?'Purchased and active':session.busy&&session.action==='purchase'?'Processing purchase…':status==='pending'?'Payment pending':purchase.disabled?'Purchases not enabled':'Purchase Supporter Pack — '+session.price;}
 const restore=document.getElementById('restoreSupporter');if(restore){restore.disabled=session.busy||!SeamenSupporter.canCheck();restore.setAttribute('aria-busy',String(session.busy));}
}
if(titleSupport)titleSupport.onclick=()=>{if(SeamenSupporter.hasVerifiedOwnership())return;audioReady();if(gameApp)gameApp.hidden=true;titleScreen.hidden=true;supportScreen.hidden=false;refreshSupportArea();};
document.getElementById('restoreSupporter')?.addEventListener('click',()=>SeamenSupporter.restore());
document.getElementById('purchaseSupporter')?.addEventListener('click',()=>{if(SeamenSupporter.canPurchase())SeamenSupporter.purchase();});
let rosterOwnership=SeamenSupporter.hasVerifiedOwnership();
SeamenSupporter.subscribe(session=>{const owned=SeamenSupporter.hasVerifiedOwnership(),changed=owned!==rosterOwnership;rosterOwnership=owned;refreshSupportArea();refreshCosmeticsUI();if(changed&&!piratePlaceholder.hidden)renderPirateRoster();else refreshPirateButtons();if(changed&&!pirateProfileModal.hidden&&profiledPirateId)showPirateProfile(profiledPirateId);k4OwnershipChanged(session);});
refreshSupportArea();SeamenSupporter.check();
if(supportBack)supportBack.onclick=()=>{supportScreen.hidden=true;titleScreen.hidden=false;};
if(titleCosmetics)titleCosmetics.onclick=()=>{if(gameApp)gameApp.hidden=true;titleScreen.hidden=true;cosmeticsScreen.hidden=false;refreshCosmeticsUI();};
document.querySelectorAll('[data-cosmetic-tab]').forEach(tab=>tab.addEventListener('click',()=>{const key=tab.dataset.cosmeticTab;document.querySelectorAll('[data-cosmetic-tab]').forEach(t=>{const active=t===tab;t.classList.toggle('active',active);t.setAttribute('aria-selected',active?'true':'false');});document.querySelectorAll('[data-cosmetic-panel]').forEach(p=>{const on=p.dataset.cosmeticPanel===key;p.classList.toggle('active',on);p.hidden=!on;});refreshCosmeticsUI();}));
document.querySelectorAll('[data-cosmetic-filter]').forEach(btn=>btn.addEventListener('click',()=>{activeCosmeticFilter=btn.dataset.cosmeticFilter||'all';document.querySelectorAll('[data-cosmetic-filter]').forEach(b=>{const active=b===btn;b.classList.toggle('active',active);b.setAttribute('aria-pressed',active?'true':'false');});applyCosmeticFilter();}));
if(cosmeticsBack)cosmeticsBack.onclick=()=>{if(schoolCosmeticLesson){schoolCosmeticLesson=false;document.getElementById('schoolCosmeticGuide')?.remove();cosmeticsScreen.hidden=true;showPoolSchool();return;}cosmeticsScreen.hidden=true;titleScreen.hidden=false;};
refreshCosmeticsUI();
if(titleTrophies)titleTrophies.onclick=()=>{renderCareer();if(gameApp)gameApp.hidden=true;titleScreen.hidden=true;trophiesScreen.hidden=false;};if(trophiesBack)trophiesBack.onclick=()=>{trophiesScreen.hidden=true;titleScreen.hidden=false;};
if(titleAbout)titleAbout.onclick=()=>{if(!career.creditsRead){const trophiesBefore=trophyUnlockSet();career.creditsRead=true;saveCareer(trophiesBefore);}startCreditsMusic();renderAbout();if(gameApp)gameApp.hidden=true;titleScreen.hidden=true;aboutScreen.hidden=false;};
if(aboutBack)aboutBack.onclick=()=>{aboutScreen.hidden=true;titleScreen.hidden=false;};
function refreshTitleSound(){if(!titleSoundToggle)return;titleSoundToggle.textContent=masterMuted?'🔇':(masterLevel<=0?'🔈':'🔊');titleSoundToggle.setAttribute('aria-label',masterMuted?'Unmute all sound':'Mute all sound');titleSoundToggle.title=masterMuted?'Unmute all sound':'Mute all sound';}
if(titleSoundToggle)titleSoundToggle.onclick=()=>{masterMuted=!masterMuted;refreshAudioSettings();refreshTitleSound();saveAudioSettings();};
const _refreshAudioSettings=refreshAudioSettings;refreshAudioSettings=function(){_refreshAudioSettings();refreshTitleSound();};
document.querySelectorAll('[data-career-tab]').forEach(tab=>tab.addEventListener('click',()=>{const key=tab.dataset.careerTab;document.querySelectorAll('[data-career-tab]').forEach(t=>t.classList.toggle('active',t===tab));const sp=document.getElementById('careerStatsPanel'),tp=document.getElementById('careerTrophiesPanel');if(sp)sp.hidden=key!=='stats';if(tp)tp.hidden=key!=='trophies';renderCareer();}));
const devReturnTitle=document.getElementById('devReturnTitle');if(devReturnTitle)devReturnTitle.onclick=()=>{clearTimeout(aiTimer);clearTimeout(aiWatchdogTimer);moving=false;shot=null;pendingChoice=null;choice.hidden=true;winModal.hidden=true;startMenuMusic();showTitleScreen();};
/* V0.14.0b: QA-only modes live behind the developer panel rather than the player-facing Play menu. */
const devTestScenarios=document.getElementById('devTestScenarios');
if(devTestScenarios)devTestScenarios.onclick=()=>{audioReady();currentScenario=null;if(titleScreen)titleScreen.hidden=true;if(gameApp)gameApp.hidden=false;playersModal.hidden=false;modeMenu.hidden=true;playersForm.hidden=true;piratePlaceholder.hidden=true;if(aiVsAiMenu)aiVsAiMenu.hidden=true;if(testScenarioMenu){testScenarioMenu.hidden=false;nightmareScenario.disabled=!devScenariosUnlocked;cannonScenario.disabled=!devScenariosUnlocked;if(fiveFrameScenario)fiveFrameScenario.disabled=!devScenariosUnlocked;}testPlayerName?.focus();};
const devAiVsAi=document.getElementById('devAiVsAi');
if(devAiVsAi)devAiVsAi.onclick=()=>{audioReady();currentScenario=null;populateAiVsAi();if(titleScreen)titleScreen.hidden=true;if(gameApp)gameApp.hidden=false;playersModal.hidden=false;modeMenu.hidden=true;playersForm.hidden=true;piratePlaceholder.hidden=true;if(testScenarioMenu)testScenarioMenu.hidden=true;if(aiVsAiMenu)aiVsAiMenu.hidden=false;};
const devTriggerPlayerWin=document.getElementById('devTriggerPlayerWin');if(devTriggerPlayerWin)devTriggerPlayerWin.onclick=()=>{if(!gameApp||gameApp.hidden||!state||state.frameOver){msg.textContent='DEV: Start an active frame before triggering a player win.';return;}if(gameMode==='aivai'){msg.textContent='DEV: Trigger Player Win is for player-controlled frames, not AI vs AI.';return;}devForcedWin=true;try{finishFrame(1,`DEV: ${pname(1)} awarded the frame. ${pname(1)} beat off ${pname(2)}!`,`DEV WIN — ${pname(1)} wins`);}finally{devForcedWin=false;}};
// Promotional codes are entered from the normal Settings screen. This development
// code is never accepted in a production build and does not grant store ownership.
const promoCodeForm=document.getElementById('promoCodeForm');
const promoCodeInput=document.getElementById('promoCodeInput');
const promoCodeStatus=document.getElementById('promoCodeStatus');
function updatePromoStatus(message,error=false){if(promoCodeStatus){promoCodeStatus.textContent=message;promoCodeStatus.classList.toggle('is-error',error);}}
if(promoCodeForm)promoCodeForm.addEventListener('submit',event=>{
  event.preventDefault();
  const code=(promoCodeInput?.value||'').trim().toUpperCase();
  if(!code){updatePromoStatus('Please enter a promo code.',true);return;}
  if(code==='DEBUGGER-2026'){
    // UK deadline: 2026-12-31 23:59:59 GMT. Redemption is permanent once saved.
    const expiry=Date.UTC(2027,0,1,0,0,0);
    if(Date.now()>=expiry){updatePromoStatus('This closed-tester code expired on 31 December 2026.',true);return;}
    if(career.unlockedCosmetics?.includes('cues:debugger')){updatePromoStatus('The Debugger is already yours.');return;}
    career.unlockedCosmetics=Array.from(new Set([...(career.unlockedCosmetics||[]),'cues:debugger']));
    saveCareer();refreshCosmeticsUI();
    updatePromoStatus('The Debugger unlocked permanently! Find it in Cosmetics → Cues.');
    promoCodeInput.value='';return;
  }
  if(nativeSupporterRuntime()&&['SUPPORTER-DEV','SUPPORTER-OFF'].includes(code)){updatePromoStatus('Development supporter passes are only available in the web development build.',true);return;}
  if(IS_DEVELOPMENT_BUILD&&code==='SUPPORTER-DEV'){
    setDevEntitlement('supporter_founder_test',true);
    updatePromoStatus('Developer Supporter Pass activated for testing. No purchase has been made.');
    promoCodeInput.value='';return;
  }
  if(IS_DEVELOPMENT_BUILD&&code==='SUPPORTER-OFF'){
    setDevEntitlement('supporter_founder_test',false);
    updatePromoStatus('Developer Supporter Pass deactivated. Your campaign progress is unchanged.');
    promoCodeInput.value='';return;
  }
  updatePromoStatus('This code is invalid or is no longer available.',true);
});
const devGrantSupporter=document.getElementById('devGrantSupporter');if(devGrantSupporter)devGrantSupporter.onclick=()=>changeDevSupporterAccess(true);
const devRevokeSupporter=document.getElementById('devRevokeSupporter');if(devRevokeSupporter)devRevokeSupporter.onclick=()=>changeDevSupporterAccess(false);
if(nativeSupporterRuntime()){if(devGrantSupporter)devGrantSupporter.hidden=true;if(devRevokeSupporter)devRevokeSupporter.hidden=true;}
refreshDevEntitlementUI();
const devResetProgress=document.getElementById('devResetProgress');if(devResetProgress)devResetProgress.onclick=()=>{if(!confirm('Reset ALL saved progression and lifetime statistics? This cannot be undone.'))return;career=defaultCareer();pendingChapter2BossReveal=false;trophyKnownUnlocked=new Set();try{localStorage.removeItem(CAREER_KEY);localStorage.setItem('seamenPirateUnlocked','1');}catch(e){}devPiratesUnlocked=false;saveCareer();refreshPirateButtons();msg.textContent='DEV: progression and statistics reset.';};
const devAchievementSelect=document.getElementById('devAchievementSelect');
if(devAchievementSelect){devAchievementSelect.innerHTML=ACHIEVEMENTS.map(a=>`<option value="${a.id}">${a.tier} — ${a.name}</option>`).join('');}
const devTestTrophyToast=document.getElementById('devTestTrophyToast');if(devTestTrophyToast)devTestTrophyToast.onclick=()=>{const trophy=achievementById(devAchievementSelect?.value)||ACHIEVEMENTS[0];if(!trophy)return;trophyToastQueue.push({...trophy,id:`dev_preview_${trophy.id}`});runTrophyToastQueue();msg.textContent=`DEV: previewed ${trophy.tier} — ${trophy.name}. Career data unchanged.`;};
renderCareer();
renderAbout();refreshTitleSound();showTitleScreen();

/* V0.12.0 DEV Custom Game -------------------------------------------------
   A deliberately flexible test table. It keeps the current match/opponent
   identity, skips the break, and can optionally use the real career/trophy
   pipeline so achievement triggers can be QA-tested quickly. */
let customGameActive=false,customGameCountsStats=false;
const customGameModal=document.getElementById('customGameModal');
const customReds=document.getElementById('customReds'),customYellows=document.getElementById('customYellows');
const customCountStats=document.getElementById('customCountStats');
const startCustomGameBtn=document.getElementById('startCustomGame'),cancelCustomGameBtn=document.getElementById('cancelCustomGame'),devCustomGameBtn=document.getElementById('devCustomGame');
function setCustomStatsSwitch(on){customGameCountsStats=!!on;if(customCountStats){customCountStats.setAttribute('aria-checked',String(customGameCountsStats));customCountStats.classList.toggle('is-on',customGameCountsStats);}}
if(customCountStats)customCountStats.onclick=()=>setCustomStatsSwitch(!customGameCountsStats);
if(devCustomGameBtn)devCustomGameBtn.onclick=()=>{if(moving)return;setCustomStatsSwitch(false);customGameModal.hidden=false;};
if(cancelCustomGameBtn)cancelCustomGameBtn.onclick=()=>{customGameModal.hidden=true;};
function customSpot(existing){
  // Keep a generous cushion/pocket margin and use the existing collision-safe helper.
  return randomFreeSpot(existing,L+ballR*4,R-ballR*4,T+ballR*4,B-ballR*4);
}
function rackCustomGame(redCount,yellowCount){resetCueSpin();
  balls=[];
  // Cue retains the familiar starting location; black is fixed on the normal black spot.
  balls.push(ball(L+PLAY_W*.8,H/2,'white','cue'));
  const blackX=L+PLAY_W*.25;
  let id=0;
  balls.push(ball(blackX,H/2,'black',id++));
  for(const [type,count] of [['red',redCount],['yellow',yellowCount]]){
    for(let i=0;i<count;i++){
      const q=customSpot(balls);balls.push(ball(q.x,q.y,type,id++));
    }
  }
}
function startCustomGame(){
  const reds=clamp(parseInt(customReds?.value||'0',10)||0,0,7),yellows=clamp(parseInt(customYellows?.value||'0',10)||0,0,7);
  clearTimeout(aiTimer);clearTimeout(aiWatchdogTimer);aiTimer=aiWatchdogTimer=null;
  customGameActive=true;
  // Reset the frame counters manually: the ordinary helper intentionally excludes DEV scenarios.
  frameObjectPots={1:0,2:0};frameFouls={1:0,2:0};frameRecorded=false;pendingBlackOnBlackWin=false;pendingOneVisitClearance=false;frameStatsEligible=customGameCountsStats&&(gameMode==='pirate'||gameMode==='local');
  rackCustomGame(reds,yellows);potFadeVisuals=[];legalPotSparkles=[];resetPotStreak();dialogueReachedBlack={1:false,2:false};dialogueLastShot=-99;hidePirateDialogue();
  state=newState(1);state.breakShot=false;state.groups={1:null,2:null};moving=false;shot=null;placementMode='none';draggingCue=false;pendingChoice=null;choice.hidden=true;shootBtn.disabled=false;
  customGameModal.hidden=true;
  msg.textContent=`DEV CUSTOM GAME — ${reds} RED${reds===1?'':'S'} / ${yellows} YELLOW${yellows===1?'':'S'} • statistics ${customGameCountsStats?'ON':'OFF'}.`;
  playHistory.push(`=== DEV CUSTOM GAME • ${reds} RED${reds===1?'':'S'} / ${yellows} YELLOW${yellows===1?'':'S'} • STATISTICS ${customGameCountsStats?'ON':'OFF'} ===`);renderPlayLog();
  updateHUD();setTimeout(announceTurn,40);setTimeout(maybeScheduleAI,450);
}
if(startCustomGameBtn)startCustomGameBtn.onclick=startCustomGame;

// Wrap normal frame starts so a later New Frame / Rematch cleanly leaves custom mode.
const _newFrameNormal=newFrame;
newFrame=function(breaker=1){customGameActive=false;customGameCountsStats=false;return _newFrameNormal(breaker);};

// V0.12.2b: every modal begins at its top when opened.
// MutationObserver catches all existing and future code paths that reveal a .rules-modal.
(function installModalTopReset(){
  const resetModalTop=(modal)=>{
    const card=modal && modal.querySelector(':scope > .rules-modal-card');
    if(card){ card.scrollTop=0; card.scrollLeft=0; }
  };
  document.querySelectorAll('.rules-modal').forEach((modal)=>{
    const observer=new MutationObserver((mutations)=>{
      if(mutations.some(m=>m.type==='attributes' && m.attributeName==='hidden') && !modal.hidden){
        resetModalTop(modal);
        requestAnimationFrame(()=>resetModalTop(modal));
      }
    });
    observer.observe(modal,{attributes:true,attributeFilter:['hidden']});
  });
})();


/* Release surface hardening. Developer controls are bound above so the
   development build remains unchanged; public builds remove those surfaces only
   after setup, and all hidden developer keyboard shortcuts are gated centrally. */
function applyBuildModeSurface(){
  if(IS_DEVELOPMENT_BUILD)return;
  document.querySelector('.dev')?.closest('details')?.remove();
  document.querySelector('footer')?.remove();
  testMode?.remove();
  aiVsAiMode?.remove();
  document.querySelector('[data-cue="supporter_test"]')?.remove();
  const devSupportReward=document.querySelector('.support-reward-card');
  if(devSupportReward?.textContent.includes("Supporter's Test Cue"))devSupportReward.remove();
  const note=document.querySelector('.pirate-note');
  if(note)note.textContent='Beat each pirate to unlock the next difficulty.';
}
applyBuildModeSurface();

/* PWA/app presentation --------------------------------------------
   Installation remains optional and non-nagging. The browser decides whether
   an install prompt is available; installed/standalone sessions never show it.
   Service-worker controller changes are surfaced as a restart choice instead
   of silently reloading an active frame. */
(function installPwaPresentation(){
  const installBtn=document.getElementById('installGame');
  const notice=document.getElementById('pwaNotice');
  const noticeText=document.getElementById('pwaNoticeText');
  const noticeAction=document.getElementById('pwaNoticeAction');
  let deferredInstallPrompt=null;
  const isNativeContainer=()=>!!(window.SeamenRuntime&&window.SeamenRuntime.isNativeContainer());
  const isStandalone=()=>isNativeContainer()||window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true;
  function hideInstall(){if(installBtn){installBtn.hidden=true;installBtn.style.setProperty('display','none','important');}}
  if(isNativeContainer()){document.documentElement.classList.add('seamen-native');hideInstall();}
  function showNotice(text,actionLabel,onAction){
    if(!notice||!noticeText)return;
    noticeText.textContent=text;notice.hidden=false;
    if(noticeAction){noticeAction.hidden=!actionLabel;noticeAction.textContent=actionLabel||'';noticeAction.onclick=onAction||null;}
  }
  function hideNotice(){if(notice)notice.hidden=true;}
  window.addEventListener('beforeinstallprompt',e=>{
    if(isNativeContainer())return;
    e.preventDefault();deferredInstallPrompt=e;
    if(installBtn&&!isStandalone())installBtn.hidden=false;
  });
  window.addEventListener('appinstalled',()=>{deferredInstallPrompt=null;hideInstall();showNotice('Seamen Pool installed. You can now launch it like an app.');setTimeout(hideNotice,4500);});
  if(installBtn)installBtn.addEventListener('click',async()=>{
    if(!deferredInstallPrompt){hideInstall();return;}
    const prompt=deferredInstallPrompt;deferredInstallPrompt=null;hideInstall();
    try{await prompt.prompt();await prompt.userChoice;}catch(e){}
  });
  if(isStandalone())hideInstall();
  window.matchMedia('(display-mode: standalone)').addEventListener?.('change',e=>{if(e.matches)hideInstall();});

  // Offline is supported for core gameplay. Music is intentionally streamed,
  // so give one quiet status message rather than treating lost music as an error.
  let offlineNoticeShown=false;
  function reflectConnection(){
    if(!navigator.onLine){offlineNoticeShown=true;showNotice('Offline mode — the game remains playable; soundtrack may be unavailable.');}
    else if(offlineNoticeShown){showNotice('Back online.');offlineNoticeShown=false;setTimeout(hideNotice,2500);}
  }
  window.addEventListener('offline',reflectConnection);window.addEventListener('online',reflectConnection);
  if(!navigator.onLine)reflectConnection();

  if(!isNativeContainer()&&'serviceWorker' in navigator){
    let hadController=!!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener('controllerchange',()=>{
      if(hadController){showNotice('Game update ready.', 'Restart game', ()=>location.reload());}
      hadController=true;
    });
  }
})();

// Observe the existing controls; lesson success still requires an engine-resolved shot.
for(const event of ['pointerdown','keydown','input'])document.addEventListener(event,e=>{
 if(!schoolSession)return;
 const id=e.target.id;
 if(e.target.closest('#cueHelm')||['helmPort','helmStarboard'].includes(id))schoolSession.used.add('helm');
 if(['angleMinus','anglePlus'].includes(id))schoolSession.used.add('fine');
 if(id==='power'||id.startsWith('powerMinus')||id.startsWith('powerPlus'))schoolSession.used.add('power');
},true);
confirmCue.addEventListener('click',()=>{if(schoolSession?.id===3&&schoolSession.phase==='correction'&&placementMode==='none'){const p=schoolSession.placement,c=cue();schoolSession.confirmedPlacement=validCuePosition(c.x,c.y)&&Math.hypot(c.x-p.x,c.y-p.y)>1?{x:c.x,y:c.y}:null;}});

// K3B.1 Cue Helm: only the centre ball changes drag behaviour in spin mode.
function syncSpinUI(){
 const ball=document.getElementById('helmCueBall');if(!ball)return;
 const wrap=ball.closest('.cue-helm-wrap'),presets=document.getElementById('spinPresets');
 wrap.classList.toggle('spin-open',helmSpinMode);
 ball.setAttribute('aria-pressed',String(helmSpinMode));
 ball.setAttribute('aria-label',helmSpinMode?'Spin contact point: drag to adjust; double-tap or press Enter to return to aim':'Cue ball: swipe to aim; double-tap or press Enter for spin');
 document.getElementById('spinInstruction').textContent=helmSpinMode?'DOUBLE-TAP CUE BALL TO RETURN TO AIM':'DOUBLE-TAP CUE BALL FOR SPIN';
 document.getElementById('helmAimInstruction').hidden=helmSpinMode;
 presets.inert=!helmSpinMode;presets.setAttribute('aria-hidden',String(!helmSpinMode));
 document.getElementById('spinMarker').style.transform=`translate(-50%,-50%) translate(${selectedSpin.x*20}px,${selectedSpin.y*20}px)`;
 const positions={Centre:[0,0],Topspin:[0,-.65],Backspin:[0,.65],Left:[-.65,0],Right:[.65,0]};
 for(const button of presets.querySelectorAll('[data-spin]')){const p=positions[button.dataset.spin];button.setAttribute('aria-pressed',String(Math.hypot(selectedSpin.x-p[0],selectedSpin.y-p[1])<.01));}
}
function spinControlReady(){return !!state&&!moving&&!state.frameOver&&!pendingChoice&&placementMode==='none'&&!cue().potted&&!gameApp.hidden&&gameMode!=='aivai'&&!(gameMode==='pirate'&&aiPlayer===state.player);}
function setSpinContact(x,y){selectedSpin=SeamenSpinPhysics.contact(x,y);syncSpinUI();}
function toggleSpinMode(){if(!spinControlReady())return;helmSpinMode=!helmSpinMode;syncSpinUI();}
(function installSpinControls(){
 const ball=document.getElementById('helmCueBall');
 function point(e){const rect=ball.getBoundingClientRect();setSpinContact((e.clientX-rect.left-rect.width/2)/(rect.width/2),(e.clientY-rect.top-rect.height/2)/(rect.height/2));}
 ball.addEventListener('pointerdown',e=>{
  if(!e.isPrimary||(e.pointerType==='mouse'&&e.button!==0)||!spinControlReady())return;
  // Avoid a pointer-driven focus/scroll jump between taps on a small screen.
  // Keyboard focus remains available through Tab.
  e.preventDefault();
  spinPointer={id:e.pointerId,x:e.clientX,y:e.clientY,time:performance.now(),dragged:false,mode:helmSpinMode};
  try{ball.setPointerCapture(e.pointerId)}catch(_){}
  if(helmSpinMode){e.stopPropagation();e.preventDefault();}
 });
 ball.addEventListener('pointermove',e=>{
  const g=spinPointer;if(!g||g.id!==e.pointerId)return;
  if(Math.hypot(e.clientX-g.x,e.clientY-g.y)>7){g.dragged=true;lastSpinTap=null;}
  if(g.mode){e.stopPropagation();if(g.dragged&&spinControlReady())point(e);}
 });
 ball.addEventListener('pointerup',e=>{
  const g=spinPointer;spinPointer=null;if(!g||g.id!==e.pointerId)return;
  if(g.mode)e.stopPropagation();
  const now=performance.now();
  if(g.dragged||now-g.time>400||Math.hypot(e.clientX-g.x,e.clientY-g.y)>7){lastSpinTap=null;return;}
  if(lastSpinTap&&lastSpinTap.type===e.pointerType&&now-lastSpinTap.time<500&&Math.hypot(e.clientX-lastSpinTap.x,e.clientY-lastSpinTap.y)<18){
   finishHelmGesture(e);e.stopPropagation();e.preventDefault();lastSpinTap=null;toggleSpinMode();
  }else lastSpinTap={time:now,x:e.clientX,y:e.clientY,type:e.pointerType};
 });
 for(const event of ['pointercancel','lostpointercapture'])ball.addEventListener(event,e=>{if(spinPointer?.id===e.pointerId){spinPointer=null;lastSpinTap=null;}});
 ball.addEventListener('dblclick',e=>e.preventDefault()); // Pointer recognition owns double-taps.
 ball.addEventListener('keydown',e=>{
  if(theatreInputBlocked())return;
  if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();if(!e.repeat)toggleSpinMode();}
  else if(IS_DEVELOPMENT_BUILD&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&['a','d','w','s','e'].includes(e.key.toLowerCase())){
   // The new focusable ball must not swallow the existing development aiming,
   // power and shoot shortcuts, whose document handler excludes other buttons.
   e.preventDefault();e.stopPropagation();const key=e.key.toLowerCase();
   if(key==='a'||key==='d')nudgeAngle(key==='a'?-.1:.1);
   else if(key==='w'||key==='s')nudgePower(key==='w'?5:-5);
   else if(!shootBtn.disabled)beginShot();
  }
  else if(helmSpinMode&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){
   e.preventDefault();e.stopPropagation();if(spinControlReady())setSpinContact(selectedSpin.x+(e.key==='ArrowRight'?.05:e.key==='ArrowLeft'?-.05:0),selectedSpin.y+(e.key==='ArrowDown'?.05:e.key==='ArrowUp'?-.05:0));
  }
 });
 const positions={Centre:[0,0],Topspin:[0,-.65],Backspin:[0,.65],Left:[-.65,0],Right:[.65,0]};
 document.querySelectorAll('[data-spin]').forEach(button=>button.addEventListener('click',()=>{if(!helmSpinMode||!spinControlReady())return;setSpinContact(...positions[button.dataset.spin]);}));
 syncSpinUI();
})();
