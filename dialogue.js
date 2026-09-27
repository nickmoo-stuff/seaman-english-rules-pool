'use strict';
/*
  SEAMEN ENGLISH RULES POOL — DIALOGUE LIBRARY
  ------------------------------------------------
  Edit character dialogue here without touching game.js.

  Categories prepared for later releases:
    intro          - shown before a normal human-vs-pirate frame
    humanPot       - human pots a normal on-ball
    humanMiss      - human loses turn without a pot
    humanFoul      - human commits a foul / gives ball in hand
    humanStreak    - human builds a notable potting streak
    humanBigStreak - human builds a major streak
    aiPot          - pirate pots a normal on-ball
    aiMiss         - pirate loses turn without a pot
    aiFoul         - pirate commits a foul
    aiStreak       - pirate builds a notable streak
    humanCannonPot - human makes a legal multi-ball / combination pot
    aiCannonPot    - pirate makes a legal multi-ball / combination pot
    humanCushionPot- human legally pots after post-contact cushion action
    aiCushionPot   - pirate legally pots after post-contact cushion action
    humanBallInHand- human is awarded cue ball in hand after pirate foul
    aiBallInHand   - pirate is awarded cue ball in hand after human foul
    humanOnBlack   - human reaches the black
    aiOnBlack      - pirate reaches the black
    humanPotsBlack - human legally finishes the frame
    victory        - pirate wins
    defeat         - pirate loses

  Add or remove quoted strings inside an array. Keep commas between lines.
  The selector below uses a shuffled bag: within each character/category,
  every available line is used once in random order before any repeats.
*/
(() => {
  const emptyCategories = () => ({
    humanPot:[], humanMiss:[], humanFoul:[], humanStreak:[], humanBigStreak:[],
    aiPot:[], aiMiss:[], aiFoul:[], aiStreak:[],
    humanCannonPot:[], aiCannonPot:[], humanCushionPot:[], aiCushionPot:[],
    humanBallInHand:[], aiBallInHand:[],
    humanOnBlack:[], aiOnBlack:[], humanPotsBlack:[], victory:[], defeat:[]
  });

  const characters = {
    1: { ...emptyCategories(), intro: [
      "Done me research, mate. Three YouTube videos. I know what I'm doing.",
      "Let's just have a laugh, yeah? Unless I lose. Then the table's bent.",
      "School of hard knocks, me. You don't learn angles in a classroom.",
      "Lovely big table, this. Can't stand them little ones.",
      "Right. Proper pool. None of that fancy nonsense. Live, laugh, break."
    ]},
    2: { ...emptyCategories(), intro: [
      "It is largely geometry, you know. We covered Euclid at school.",
      "My uncle once explained billiards over homemade marmalade. Fascinating man.",
      "One finds that a classical education is surprisingly transferable to cue sports.",
      "I don't normally play in places like this, but I suppose broadening oneself is important.",
      "Angles, discipline and breeding. I should imagine that covers most of it."
    ]},
    3: { ...emptyCategories(), intro: [
      "Go on then. A quid says this gets interesting.",
      "I'm completely invested in this now. Ask me about something else in twenty minutes.",
      "No grand plan. See the shot, feel the shot, try not to pot the white.",
      "Winner gets bragging rights. Loser gets to pretend they weren't trying.",
      "Right, I'm in the moment. Let's play some pool."
    ]},
    4: { ...emptyCategories(), intro: [
      "You are playing The Tornado now. Try not to look nervous.",
      "They know this cue down at the Sunday tournament. And they know the man holding it.",
      "Watch closely. You might pick up a few things from The Tornado.",
      "Thirty years around a pool table teaches you things. Mostly who can't handle pressure.",
      "Don't worry, I won't embarrass you on purpose. The Tornado just sort of happens."
    ]},
    5: { ...emptyCategories(), intro: [
      "Potting the ball is the easy part. Think about where the white finishes.",
      "Take your time. The table isn't going anywhere.",
      "I've sailed with better players than you. Most of them are dead.",
      "Don't watch the pocket. Watch what comes after it.",
      "Show me how far ahead you can think."
    ]},
    6: { ...emptyCategories(), intro: [
      "...",
      "Hit hard.",
      "Table strong?",
      "No small shots.",
      "You break. I break harder."
    ]},
    7: { ...emptyCategories(), intro: [
      "Your first mistake will be sufficient.",
      "I have already considered the next three shots.",
      "You may break.",
      "Probability favours me. I merely improve upon it.",
      "Do not mistake restraint for mercy."
    ]}
  };

  // V0.8.6 starter contextual copy. Edit or replace freely; gameplay never depends on these strings.
  characters[1].humanPot=['Alright, show-off.', 'Yeah, yeah. One ball.'];
  characters[1].humanMiss=['Knew you would miss that.', 'Table did you there, mate.'];
  characters[1].humanFoul=['Ball in hand? Lovely stuff.', 'That is what I call an opportunity.'];
  characters[1].humanStreak=['Steady on, this is meant to be a laugh.', 'Someone has been practising.'];
  characters[1].humanBigStreak=['Alright, calm down, Ronnie.', 'This table is definitely leaning.'];
  characters[1].aiPot=['See? YouTube.', 'Natural talent, that.'];
  characters[1].aiMiss=['Was not warmed up.', 'Cue slipped. Obviously.'];
  characters[1].aiFoul=['That rule is ridiculous anyway.', 'Ref would have let that go.'];
  characters[1].aiStreak=['Told you I had done me research.', 'Now we are talking.'];
  characters[1].humanOnBlack=['Black already? Bit keen.', 'Do not bottle it now.'];
  characters[1].aiOnBlack=['Right. Big one.', 'This is the easy bit.'];
  characters[1].victory=['School of hard knocks. Never fails.', 'Live. Laugh. Win at pool.'];
  characters[1].defeat=['Table is bent. Knew it.', 'Only a laugh anyway, mate.'];
  characters[2].humanPot=['Elementary geometry. Even you can do it.', 'A serviceable shot.'];
  characters[2].humanMiss=['One really ought to understand the angle first.', 'My uncle would have called that optimistic.'];
  characters[2].humanFoul=['Oh dear. Rather basic.', 'Ball in hand. How civilised.'];
  characters[2].humanStreak=['Unexpectedly competent.', 'You appear to have found a rhythm.'];
  characters[2].humanBigStreak=['This is becoming statistically irritating.', 'I may have underestimated your practical education.'];
  characters[2].aiPot=['Euclid, naturally.', 'Quite straightforward when one understands angles.'];
  characters[2].aiMiss=['An anomalous result.', 'The cloth is rather provincial.'];
  characters[2].aiFoul=['A technicality, surely.', 'I question the interpretation of that rule.'];
  characters[2].aiStreak=['Education does reveal itself eventually.', 'One does enjoy a demonstration.'];
  characters[2].humanOnBlack=['Already? How unexpectedly efficient.', 'Try not to squander the conclusion.'];
  characters[2].aiOnBlack=['And now the inevitable conclusion.', 'A simple final exercise.'];
  characters[2].victory=['As expected. Good breeding and geometry.', 'A pleasant little demonstration.'];
  characters[2].defeat=['How very... unexpected.', 'I shall have to review the variables.'];
  characters[3].humanPot=['Nice one.', 'Okay, that was clean.'];
  characters[3].humanMiss=['Nearly. Your turn will come back around.', 'Ah well. Next one.'];
  characters[3].humanFoul=['Oof. That one hurts.', 'Free white? I will take it.'];
  characters[3].humanStreak=['Oh, you are properly in this now.', 'Okay, I see you.'];
  characters[3].humanBigStreak=['That is a serious run. Respect.', 'You are absolutely feeling it now.'];
  characters[3].aiPot=['That felt good.', 'Yep. I will take that.'];
  characters[3].aiMiss=['Worth a go.', 'Nope. Not today.'];
  characters[3].aiFoul=['Well, that was stupid.', 'Pretend you did not see that.'];
  characters[3].aiStreak=['I am in the zone now.', 'Right now I care about nothing except this table.'];
  characters[3].humanOnBlack=['Go on then. Finish it.', 'Big ball time.'];
  characters[3].aiOnBlack=['Okay. One more.', 'Everything else can wait.'];
  characters[3].victory=['Good game. Fancy another?', 'That was fun. I am keeping the quid.'];
  characters[3].defeat=['Fair play. You earned that.', 'Good game. I owe you a quid.'];
  characters[4].humanPot=['The Tornado has seen better.', 'Decent. Do that in the Sunday league.'];
  characters[4].humanMiss=['Pressure. Gets everyone eventually.', 'That is why experience matters.'];
  characters[4].humanFoul=['Ball in hand? You cannot give The Tornado that.', 'That is a league-night mistake.'];
  characters[4].humanStreak=['Not bad. The Tornado remains calm.', 'You have put a few together. I noticed.'];
  characters[4].humanBigStreak=['Alright, you can play a bit.', 'The Tornado respects a proper clearance.'];
  characters[4].aiPot=['Textbook Tornado.', 'Seen me do that a thousand times.'];
  characters[4].aiMiss=['Even The Tornado gets a bad roll.', 'That one looked better from here.'];
  characters[4].aiFoul=['Rare Tornado error. Very rare.', 'Chalk issue. Happens to the best.'];
  characters[4].aiStreak=['This is why they know the name.', 'The Tornado is gathering pace.'];
  characters[4].humanOnBlack=['Do not let the occasion get to you.', 'Black ball. Now we see what you are made of.'];
  characters[4].aiOnBlack=['The Tornado closes these out.', 'Watch the finish.'];
  characters[4].victory=['Another one for The Tornado.', 'Thirty years, mate. Thirty years.'];
  characters[4].defeat=['Enjoy that one. They do not happen often.', 'Fair enough. The Tornado will be back.'];
  characters[5].humanPot=['Good. Now where did you leave the white?', 'A pot is only half the shot.'];
  characters[5].humanMiss=['You saw the pocket. Not the position.', 'Think one shot further ahead.'];
  characters[5].humanFoul=['Never hand control of the table away cheaply.', 'Ball in hand changes everything.'];
  characters[5].humanStreak=['Good rhythm. Keep thinking.', 'Now you are building a visit.'];
  characters[5].humanBigStreak=['That is proper cueing.', 'You have my attention.'];
  characters[5].aiPot=['Position first. Pot second.', 'The next shot began with that one.'];
  characters[5].aiMiss=['Not every correct decision succeeds.', 'Leave yourself another chance.'];
  characters[5].aiFoul=['Poor discipline. Mine, this time.', 'A mistake. Remember it.'];
  characters[5].aiStreak=['Control the white and the table follows.', 'This is where planning pays.'];
  characters[5].humanOnBlack=['You earned the chance. Finish it.', 'One ball. One decision.'];
  characters[5].aiOnBlack=['The frame has narrowed to one decision.', 'Now there is nowhere left to hide.'];
  characters[5].victory=['Good frame. Remember what beat you.', 'You played the balls. I played the table.'];
  characters[5].defeat=['Well played. You thought ahead.', 'You earned that. I have no complaint.'];
  characters[6].humanPot=['Hmm.', 'Fine.'];
  characters[6].humanMiss=['Miss.', 'Weak.'];
  characters[6].humanFoul=['Mine.', 'Bad.'];
  characters[6].humanStreak=['Enough.', 'Still standing.'];
  characters[6].humanBigStreak=['Annoying.', 'Stop that.'];
  characters[6].aiPot=['Hard.', 'Good.'];
  characters[6].aiMiss=['Again.', 'Not hard enough.'];
  characters[6].aiFoul=['Hmph.', 'Table moved.'];
  characters[6].aiStreak=['More.', 'Harder.'];
  characters[6].humanOnBlack=['Hit it.', 'Finish.'];
  characters[6].aiOnBlack=['Black.', 'Full power.'];
  characters[6].victory=['Done.', 'Strong table.'];
  characters[6].defeat=['...', 'Again.'];
  characters[7].humanPot=['Acceptable.', 'A temporary success.'];
  characters[7].humanMiss=['There it is.', 'The error was inevitable.'];
  characters[7].humanFoul=['Your first mistake will suffice.', 'You have surrendered control.'];
  characters[7].humanStreak=['Continue. I am observing.', 'Competence does not concern me.'];
  characters[7].humanBigStreak=['Interesting. You exceed expectation.', 'At last, resistance.'];
  characters[7].aiPot=['As calculated.', 'The position was decided before impact.'];
  characters[7].aiMiss=['An imperfect outcome. Correctable.', 'Variance. Nothing more.'];
  characters[7].aiFoul=['Unacceptable.', 'An error I will not repeat.'];
  characters[7].aiStreak=['Do not expect another turn.', 'The sequence is already in motion.'];
  characters[7].humanOnBlack=['One ball between you and survival.', 'Show me whether pressure changes you.'];
  characters[7].aiOnBlack=['The conclusion approaches.', 'Your options are diminishing.'];
  characters[7].victory=['The outcome required no prophecy.', 'You were permitted opportunities. You wasted them.'];
  characters[7].defeat=['You had the necessary odds. This time.', 'Victory acknowledged. Do not confuse it with superiority.'];


  // V0.8.6 advanced, objective event hooks. These deliberately avoid any "lucky shot" judgement.
  const advanced = {
    1:{
      humanCannonPot:['Alright, two at once. Greedy.', 'Bit fancy, that.'], aiCannonPot:['Planned that. Obviously.', 'Two birds, one massive boat.'],
      humanCushionPot:['Using the walls now, are we?', 'Show-off cushion nonsense.'], aiCushionPot:['Knew the cushion was there.', 'Banked it. Saw it on YouTube.'],
      humanBallInHand:['Go on then, put it wherever you like.', 'Free white. Must be nice.'], aiBallInHand:['Lovely. I will just put this somewhere useful.', 'Ball in hand? This is basically cheating. Legal cheating.']
    },
    2:{
      humanCannonPot:['A compound interaction. Quite respectable.', 'Two balls from one calculation. Unexpected.'], aiCannonPot:['A pleasing demonstration of applied geometry.', 'Multiple bodies, one elegant solution.'],
      humanCushionPot:['Reflection angles. At least you were paying attention.', 'The cushion does introduce a second geometric problem.'], aiCushionPot:['Elementary reflection.', 'One merely accounts for the cushion.'],
      humanBallInHand:['An enviable positional privilege.', 'Do try to use the free placement intelligently.'], aiBallInHand:['Excellent. A controlled initial condition.', 'Free placement removes several tedious variables.']
    },
    3:{
      humanCannonPot:['Okay, that was fun.', 'Nice! More of that.'], aiCannonPot:['Ha! I meant at least most of that.', 'That is why I love this game.'],
      humanCushionPot:['Lovely off the cushion.', 'That had a nice shape to it.'], aiCushionPot:['Yes! That felt right.', 'Cushions make everything more interesting.'],
      humanBallInHand:['Make it count.', 'Free placement. Pick somewhere good.'], aiBallInHand:['Ooh, choices.', 'Right. Where do I want this?']
    },
    4:{
      humanCannonPot:['The Tornado appreciates a combination.', 'Alright. That belongs in a Sunday final.'], aiCannonPot:['Classic Tornado combination.', 'They have seen that one down the league.'],
      humanCushionPot:['Decent cushion work.', 'You have been watching The Tornado.'], aiCushionPot:['Cushions are part of the table for a reason.', 'The Tornado uses the whole table.'],
      humanBallInHand:['Do not waste ball in hand.', 'This is where a proper player takes control.'], aiBallInHand:['You cannot hand The Tornado free position.', 'Ball in hand. Now watch the visit develop.']
    },
    5:{
      humanCannonPot:['Good combination. Now assess what it left you.', 'Two balls moved with purpose. Keep thinking ahead.'], aiCannonPot:['One contact can solve more than one problem.', 'A combination is useful when the position justifies it.'],
      humanCushionPot:['Good use of the cushion.', 'You used the table, not just the pocket.'], aiCushionPot:['The cushion changes the route, not the objective.', 'Sometimes the longer path is the cleaner one.'],
      humanBallInHand:['Ball in hand is control. Do not spend it cheaply.', 'Choose the position before you choose the pot.'], aiBallInHand:['You have given me control of the white.', 'Ball in hand. The next few shots begin here.']
    },
    6:{
      humanCannonPot:['Two.', 'More balls. Good.'], aiCannonPot:['CRASH.', 'Two. Hard.'],
      humanCushionPot:['Wall helped.', 'Hit wall. Still went in.'], aiCushionPot:['Cushion strong.', 'Wall. Ball. Pocket.'],
      humanBallInHand:['Put white down.', 'Free ball.'], aiBallInHand:['Mine.', 'Good. Move white.']
    },
    7:{
      humanCannonPot:['A competent multi-object solution.', 'You identified the combination.'], aiCannonPot:['Multiple outcomes. One stroke.', 'The secondary contact was accounted for.'],
      humanCushionPot:['You incorporated the boundary correctly.', 'A longer route. Still valid.'], aiCushionPot:['The cushion was part of the calculation.', 'Direct paths are not always optimal.'],
      humanBallInHand:['Use the freedom carefully. It will not recur often.', 'You have unrestricted placement. For now.'], aiBallInHand:['You have removed the positional constraint for me.', 'Free placement. Your error compounds.']
    }
  };
  for(const [level,cats] of Object.entries(advanced)) Object.assign(characters[level],cats);

  const bags = new Map();
  const shuffle = values => {
    const out = values.slice();
    for(let i=out.length-1;i>0;i--){
      const j=Math.floor(Math.random()*(i+1));
      [out[i],out[j]]=[out[j],out[i]];
    }
    return out;
  };

  function getLine(level, category){
    const lines=characters[level]?.[category];
    if(!Array.isArray(lines)||!lines.length)return null;
    const key=`${level}:${category}`;
    let bag=bags.get(key);
    if(!bag||!bag.length){
      const previous=bags.get(`${key}:last`);
      bag=shuffle(lines.map((_,i)=>i));
      if(lines.length>1 && previous!=null && bag[0]===previous){
        const swap=bag.findIndex(i=>i!==previous);
        if(swap>0)[bag[0],bag[swap]]=[bag[swap],bag[0]];
      }
      bags.set(key,bag);
    }
    const index=bag.shift();
    bags.set(`${key}:last`,index);
    return lines[index];
  }

  window.SeamenDialogue={characters,getLine};
})();
