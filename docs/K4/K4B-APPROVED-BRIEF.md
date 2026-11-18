# Seamen Pool — K4B: Spinball Wizard Implementation

**Starting point:** Latest K4A.4 fully approved baseline (12/12 PASS).

**Objective:** Complete Chapter 4 by implementing Spinball Wizard as its final optional supporter boss.

## 1. Roster and access

- Add Spinball Wizard as a selectable optional Chapter 4 supporter boss, separate from the five-circle story sequence.
- Require legitimate supporter entitlement or temporary development supporter access.
- Do not require defeating Lucy to challenge him, provided the supporter has unlocked access.
- Preserve all existing story progression, rewards and Chapter 5 placeholder.
- Ensure the future-proofed **Unlock All Pirates** developer cheat includes Spinball Wizard.

## 2. Character and Theatre

- Use the existing approved animated Spinball Wizard artwork and **Spinball Wizard's Lair** background.
- Follow established Theatre transitions, typewriter effects and speaker-specific movement.
- Preserve the character's special rotation animation without interfering with Theatre layout.
- Display his full name, **“Spinball Wizard”**, as the Theatre speaker label throughout both his introduction and victory dialogue.
- The abbreviation “SW” in the supplied script is shorthand only and must never appear as his in-game speaker name.
- Preserve the dialogue exactly as written, including punctuation, capitalisation and comedic timing.
- The final *nods* is a silent stage direction, not spoken dialogue.

### Opening Theatre — exact dialogue

**Blackball:** Well what do we have here then?

**Spinball Wizard:** Rotation is my motivation

**Blackball:** I see...

**Spinball Wizard:** You wanna get dizz with the wizz?

**Blackball:** I must say I wasn't planning on it.

**Spinball Wizard:** The dizzy wizz with the rizz?

**Blackball:** So it seems.

**Spinball Wizard:** Don't get too close or you'll catch my j...

**Blackball:** I get it. So that's all you do? Spin about?

**Spinball Wizard:** Mostly, but also: viva la revolution!

**Blackball:** That sounds more up my neck of the islands, what does that involve?

**Spinball Wizard:** Well, you have to revolve before you can evolve.

**Blackball:** Oh. It's just more spinning. We seem to be going round in circles here.

**Spinball Wizard:** THAT'S THE SPIRIT!

**Blackball:** That's not... urgh. Whatever. Pool?

**Spinball Wizard:** *nods*

### Victory Theatre — after defeating Spinball Wizard

**Spinball Wizard:** My parents wanted me to become a doctor.

**Blackball:** Oh did they, aye?

**Spinball Wizard:** So I became a SPIN doctor. Haha!

**Blackball:** Of course. Bye.

## 3. AI — Chaotic show-off

**Difficulty:** Level 5

**Listed character attribute:** “A wizard with a penchant for... spinning.”

- Apply meaningful cue-ball spin on **every single shot**.
- Vary topspin, backspin, left/right sidespin and combinations.
- Prefer flamboyant spin-based positioning and unusual shots, even when straightforward alternatives exist.
- Retain Level 5 competence: challenging but more chaotic and showy than Lucy.
- Use the game's existing spin physics and shot simulation.
- Spin must genuinely affect cue-ball movement, not merely animate the Cue Helm.
- Do not introduce separate physics rules or compromise legal EPA shots.
- Do not interfere with the player's spin settings.

## 4. Cue — Spinball Wizard's Staff

Create a highly elaborate magical wizard's staff with:

- A **very strong, visibly pulsating purple glow**.
- Cyan spiral highlights wrapping around the staff.
- Intricate magical decorations.
- Preferably, a rotating visual animation of the staff itself, provided this does not interfere with cue alignment, aiming or shot mechanics.
- If full staff rotation would look incorrect or compromise cue alignment, use **translucent magical orbs revolving around the handle** instead.
- Identical visual rendering in gameplay and the Cosmetics catalogue.
- Strictly cosmetic behaviour: no physics, power, accuracy or spin modifiers.

**Cosmetics description:** Describe the staff's visual appearance and magical effects only. Do not repeat the wizard's character attribute or describe his AI behaviour.

## 5. Table

- Use the existing **Mysterious Cave table** (formerly the LARPer table) for Spinball Wizard's matches.
- Do not create a new table cosmetic.
- Preserve the existing table unlock conditions.

## 6. Trophy

**Name:** The Dizzy Wizzy

- Award upon defeating Spinball Wizard.
- Persist correctly across reloads.
- Keep separate from the Chapter 4 **Five Circles of Hell** completion trophy.
- Avoid revealing locked trophy spoilers unnecessarily.

## 7. Quality assurance and delivery

- Preserve all K4A.4 PASS behaviour.
- Test supporter gating, opponent selection, spin application, legal shots, Theatre dialogue, animations, cue rendering, trophy persistence and rematches.
- Confirm Spinball Wizard does not interfere with Chapter 4's main story completion.
- Update game version/build and offline asset references as necessary.
- Produce a fresh version/build-labelled desktop source ZIP.
- Provide branch and commit details.
- Do not deploy, publish or enable native payments.

**Important:** This is an optional Chapter 4 supporter opponent, not a sixth circle of Hell. Defeating him must not be required to complete Chapter 4 or unlock its main-story trophy.