#!/usr/bin/env python3
"""Rebuild the K4 catalogue from the byte-preserved authoritative handover."""
from pathlib import Path
import json,re
r=Path(__file__).resolve().parents[1]
manifest=json.loads((r/"docs/K4/asset-manifest.json").read_text())["assets"]
ids=['vile_hedgehog','filthy_youth','socks_sandals','most_evil','lucy_fir'];names=['Vile Blue Hedgehog','Filthy Youth with a Phone','Socks and Sandals','The Most Evil Creature Imaginable','Lucy Fir'];levels=[3,3,4,5,6];trophies=['100m under, 1 down!','Noise suppression',"Don’t judge a bork",'The most evil trophy imaginable','Hell is unleashed'];trophies[2]="Don't judge a bork"
files=[x['file'] for x in manifest if x['file'][:2] in ['01','02','03','04','05']]
source=(r/'docs/K4/K4-APPROVED-DIALOGUE-VERBATIM.txt').read_text()
amendments=json.loads((r/'docs/K4/K4A.2-APPROVED-AMENDMENTS.json').read_text())
scenes={};opponents=[]
for i,(id,name,lev) in enumerate(zip(ids,names,levels)):
 sec=re.split(r'\n[1-5]\. [A-Z]',source)[i+1] # section starts after first capital; remaining body intact
 intro=sec.split('A. BEFORE MATCH')[1].split('B. THEATRE')[0]
 victory=sec.split('C. AFTER MATCH')[1].split('Reward / trophy')[0]
 quote=re.search(r'Challenge / acceptance line: (.*)',sec).group(1)
 p=dict(id=id,legacyLevel=None,aiLevel=lev,chapter='chapter_4',chapterPosition=i+1,campaignRole='main',difficulty=lev,name=name,fullName=name,role='Five Circles of Hell',style=['66% power and topspin','Standard level 3','Backspin and cushion play','Left and right spin','Centred spin and positional play'][i],bio=quote,challengeQuote=quote,reputation='Chapter 4 story opponent.',portrait=name[:2],image='assets/k4/'+files[i],playable=True,unlockRule={'type':'default'} if i==0 else {'type':'defeat_pirate','pirate':ids[i-1]},rewards=[{'type':'cue','id':id}]+([{'type':'table','id':id}] if i==4 else []))
 opponents.append(p)
 for kind,body in [('challenge',intro),('victory',victory)]:
  lines=[];entered=False
  for raw in body.splitlines():
   line=raw.strip()
   if line.startswith('[The Most Evil Creature Imaginable enters'):entered=True;continue
   m=re.match(r'(Vile Blue Hedgehog|Blackball|Filthy youth with a phone|Socks and Sandals|The Most Evil Creature Imaginable|Lucy)(: |\. )(.*)',line)
   if not m:
    if line=='Dialogue prompt: Bork! Bork!':speaker='Socks and Sandals';text='Bork! Bork!'
    else:continue
   else:speaker=m[1]+('.' if m[2]=='. ' else '');text=m[3]
   # Stage annotations remain in canonical source, never silently rewritten into spoken words.
   stage={'background':'hell','characters':['blackball',id]+(['most_evil'] if entered else [])}
   if '[Vile Blue Hedgehog fades away, scene ends]' in text:
    text=text.split(' [Vile Blue Hedgehog fades away, scene ends]')[0]
    stage['fadeHedgehog']=True
   lines.append(dict(speaker='TMECI' if speaker=='The Most Evil Creature Imaginable' else speaker,text=text,stage=stage))
  if kind=='challenge':lines.append(dict(speaker='TMECI' if i==3 else names[i] if i!=4 else 'Lucy',text=quote,stage={'background':'hell','characters':['blackball',id]}))
  if i==1 and kind=='challenge':lines.append(dict(speaker='Blackball',text=amendments['additionalYouthLine'],stage={'background':'hell','characters':['blackball',id]}))
  assets={'backgrounds':{'hell':{'src':'assets/k4/'+('07_Lucy_Dungeon_Theatre.png' if i==4 else '06_Shared_Fiery_Pits_Theatre.png')}},'characters':{'blackball':{'src':'assets/scenes/captain-blackball-main.png','alt':'Captain Blackball','x':23,'y':96,'width':36,'anchor':'bottom-center'},id:{'src':p['image'],'alt':name,'x':73,'y':96,'width':15.2 if i==4 else 47.5 if i==3 else 38,'anchor':'bottom-center','className':'k4-character '+('k4-hedgehog' if i==0 else 'k4-youth' if i==1 else 'k4-tmeci' if i==3 else 'k4-lucy' if i==4 else ''),'suppressSpeakerWobble':False}},'props':{}}
  if i==4:assets['characters']['most_evil']={'src':'assets/k4/'+files[3],'alt':names[3],'x':49,'y':95,'width':33.75,'anchor':'bottom-center','className':'k4-character k4-tmeci','suppressSpeakerWobble':False}
  sid='chapter_4_'+id+'_'+kind
  scenes[sid]=dict(id=sid,chapter='chapter_4',kicker='FIVE CIRCLES OF HELL',title='TMECI' if i==3 else name,finishLabel='Begin match' if kind=='challenge' else 'Finish Chapter 4' if i==4 else 'Return to roster',typewriterMs=22,finishFadeMs=1625,theatreEffects=True,assets=assets,lines=lines)
# K4B's optional boss stays outside the authoritative five-circle opponent list.
bonus=dict(id='spinball_wizard',achievementId='k4_spinball_wizard',legacyLevel=None,aiLevel=5,chapter='chapter_4',chapterPosition=1,campaignRole='bonus',difficulty=5,name='Spinball Wizard',fullName='Spinball Wizard',role='Optional supporter boss',style='A wizard with a penchant for... spinning.',bio='You wanna get dizz with the wizz?',challengeQuote='You wanna get dizz with the wizz?',reputation='An optional challenge, separate from the Five Circles of Hell.',portrait='Spinball Wizard',image='assets/k4/09_spinball_wizard_2s.webp',playable=True,unlockRule={'type':'default'},rewards=[{'type':'cue','id':'spinball_wizard'}])
brief=(r/'docs/K4/K4B-APPROVED-BRIEF.md').read_text()
for kind,body in [('challenge',brief.split('### Opening Theatre — exact dialogue')[1].split('### Victory Theatre')[0]),('victory',brief.split('### Victory Theatre — after defeating Spinball Wizard')[1].split('## 3.')[0])]:
 lines=[]
 for speaker,text in re.findall(r'\*\*(Blackball|Spinball Wizard):\*\* (.*)',body):
  stage={'background':'lair','characters':['blackball','spinball_wizard']}
  line=dict(speaker=speaker,text=text,stage=stage)
  if text=='*nods*':
   line.update(text='',silent=True,stageDirection='*nods*')
   stage['animate']=[{'target':'character:spinball_wizard','effect':'bounce','duration':550,'repeat':1}]
  lines.append(line)
 sid='chapter_4_spinball_wizard_'+kind
 scenes[sid]=dict(id=sid,chapter='chapter_4',kicker='OPTIONAL SUPPORTER BOSS',title='Spinball Wizard',finishLabel='Begin match' if kind=='challenge' else 'Return to roster',typewriterMs=22,finishFadeMs=1625,theatreEffects=True,assets={'backgrounds':{'lair':{'src':'assets/k4/08_Spinball_Wizard_Lair_Theatre.png'}},'characters':{'blackball':{'src':'assets/scenes/captain-blackball-main.png','alt':'Captain Blackball','x':23,'y':96,'width':36,'anchor':'bottom-center'},'spinball_wizard':{'src':bonus['image'],'alt':'Spinball Wizard','x':73,'y':90,'width':36,'anchor':'bottom-center','className':'k4-character k4-wizard','suppressSpeakerWobble':False}},'props':{}},lines=lines)
data=dict(chapter=dict(id='chapter_4',number=4,name='Five Circles of Hell',mainPirates=ids,bonusPirates=['spinball_wizard'],boss='lucy_fir',unlockRule={'type':'complete_chapter','chapter':'chapter_3'},scenes={},requiresEntitlement='supporter_founder_test',bonusUnlock={'type':'complete_chapter','chapter':'chapter_3'}),opponents=opponents,bonusOpponents=[bonus],scenes=scenes,trophies=trophies)
(r/'www/chapter4.js').write_text("'use strict';\n// Approved K4 dialogue and immutable artwork; generated by tools/build-k4-dialogue.py.\nwindow.SeamenChapter4="+json.dumps(data,ensure_ascii=False,indent=2)+';\n')
