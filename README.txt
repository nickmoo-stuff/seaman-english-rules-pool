SEAMEN ENGLISH RULES POOL — V0.14.1b
====================================

A pirate-themed, portrait-first browser pool game built around English Pool Association international eightball rules. Designed for desktop and mobile browsers and installable as a Progressive Web App (PWA).

CURRENT GAME
------------
• 2 players locally on the same device.
• Pirates o' the Tavern single-player campaign with sequential opponent progression.
• Five standard pirate difficulty levels, plus developer/special opponents used for advanced QA.
• Captain Blackball campaign finale, private-quarters showdown, ending sequence and unlockable "Captain Blackball's Privates" table.
• Career statistics, trophies and persistent pirate progression.
• Table and cue cosmetics, including unlockable opponent rewards.
• First-time tutorial with replay option in Settings.
• Export/import save data and reset-player-data controls.
• Original soundtrack, contextual pirate dialogue and game sound effects.
• Master/music volume, mute controls and reduced character portrait motion setting.

RULES & GAMEPLAY
----------------
The game uses the EPA International Eightball rules framework implemented by the existing rules engine, including the three-point legal-break system, open-table/group assignment, fouls, ball-in-hand handling and black-ball frame outcomes.

The physics, rules and AI are shared by human and computer-controlled play. AI opponents do not receive hidden physics advantages. Higher-level AI can evaluate pots, safeties, escapes and frame-ball decisions using the same table state and physics engine.

CONTROLS
--------
Aim with the angle slider/buttons and choose shot strength with the power slider/buttons, then press PLAY SHOT. During cue-ball-in-hand placement, tap/drag the white or use the directional controls and confirm its position.

Useful desktop keys during play:
A / D  fine aim
W / S  power
E      play shot
G      developer angle guide
R      rematch from the result screen

PWA / INSTALLATION
------------------
The game can be installed from a supported browser as a standalone PWA. Core game code, portraits and icons are cached for fallback/offline use. Large soundtrack files are deliberately not stored in the service-worker cache. Core HTML/CSS/JavaScript uses network-first loading so deployed updates are preferred when online.

DEVELOPER / QA TOOLS
--------------------
The normal Play menu intentionally shows only the two player-facing modes: local two-player and Pirates o' the Tavern.

Developer test scenarios and AI-vs-AI simulation remain available through the Developer test panel. From the title screen, open Settings and press K to jump to the developer panel. The panel also contains progression unlocks, custom tables, Blackball showdown triggering and other QA controls.

Some additional QA keyboard shortcuts remain in the source/build for testing.

V0.14.1b MILESTONE
-----------------
V0.14.1b is a release-polish milestone promoted from the passing V0.13.5 baseline. It does not retune pool physics, EPA rules, AI behaviour, soundtrack logic, progression, cosmetics or the Captain Blackball sequence.

Changes in this milestone:
• Replaced the historical prototype README with current game documentation.
• Removed Test scenarios and AI vs AI from the ordinary player-facing Play menu.
• Retained both QA modes through the Developer test panel.
• Advanced visible version and PWA cache generation to V0.14.1b.

FUTURE / DELIBERATELY NOT PART OF V0.14.1b
------------------------------------------
• Online multiplayer.
• Supporter/reward functionality.
• Further "Uncharted Waters" post-campaign opponents and content.

ABOUT / CREDITS
---------------
See About / credits inside the game for the current creator, testing, tools and soundtrack credits and music links.


V0.14.1b — PROGRESSION & REWARD INTEGRATION
• First-time pirate victories now present the trophy, cue cosmetic and next-opponent unlock together on the result screen.
• Captain Blackball's first victory presents his cue, private table and campaign-completion milestone after the ending scene.
• Career > Pirates defeated now shows each pirate's reward and progression relationship.
• Portable save metadata now reports the current game version (0.14.1) instead of the stale 0.13.4 value.
• No pool physics, EPA rules, AI behaviour or soundtrack logic changed.
