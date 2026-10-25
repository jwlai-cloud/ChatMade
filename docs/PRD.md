# Product requirements — ChatMade
Version 0.1, 24 October 2026. Proposed baseline for grilling and implementation.

Review update: cooperative rescue, 60-second survival with three hearts and no streamer attacks, and local operation alongside OBS were accepted in grilling round 1. See ADR 0002. Remaining details below are still proposed.

Grilling round 2 accepted bounded free-text interpretation, audience selection with host approval, seeded vote tie/no-vote resolution, labelled house suggestions for missing categories, pre-round rescue thresholds and the deterministic first-build scope. See ADR 0003 for exact decisions. Other details remain proposed until review closes.

## Product and audience
A Twitch audience invents a monster; the streamer survives an encounter with it; viewers cooperate to activate its weakness. Primary user: a small streamer hosting a short interactive segment. Secondary user: a viewer who can participate with one chat command. No audience size, paid subscription, or Channel Points dependency.

Adoption requirement, clarified by the user on 25 October 2026: the same product must be easy for other streamers to use. Target a reusable local companion with guided Twitch connection and an OBS browser-source URL. A streamer should not need to edit source code, replace hardcoded channel IDs or ask viewers to install another app. The current Node/npm sample build is a developer milestone, not evidence that this onboarding requirement is met. Downloadable packaging and a nontechnical streamer setup test remain release work. A Twitch Extension is a separate delivery option, not an approved replacement for local-first scope.

Hypothesis: visible authorship and playable consequences make viewers feel more involved. This is unvalidated; conduct three creator interviews and a small live playtest. Do not claim retention improvements or unique market originality without evidence.

## Core loop
Collect suggestions for 30 seconds; assemble and select a recipe in 15 seconds; reveal within a 30-second generation window; play a 60-second encounter; show a result card for 15 seconds. Host can extend collection. Generation failure must not block a round.
Commands: !body, !power, !weakness, !vote 1/2/3, and !help during an encounter. Only commands valid for the current phase are accepted. Each user has one active suggestion per category and one vote; latest valid input replaces earlier input. Equal vote weight. Selected suggestions retain author attribution. The host confirms the chosen recipe.

Streamer moves an avatar with WASD/arrows, dodges telegraphed attacks and survives until the timer expires. Collision removes one of three hearts, followed by a short invulnerability period. Zero hearts loses; surviving wins. Viewers fill a rescue meter; activation briefly stuns/slows the creature or weakens its attacks. No boss health or attack controls in MVP. Thus the result says SURVIVED or CAUGHT, never DEFEATED.

## Must-have requirements
1. Authenticate one broadcaster and receive real Twitch chat. Show connection state and reconnect without duplicate actions.
2. Run a complete round with three participants; support a clearly labelled local simulation for development.
3. Validate and moderate input before display/generation; host can exclude suggestions, approve recipes, pause, skip and restart.
4. Produce a schema-valid recipe using only supported behaviours. Explain interpretations of free-text powers before approval.
5. Generate one original creature image with a consistent art direction; use a prepared original fallback after timeout/refusal/failure. Track live versus fallback provenance.
6. Show selected contributor credits, commands, timer, hearts, help meter and result card.
7. Persist recipe, seed, selected contributions, asset provenance and outcome; export a result image.
8. Keep provider/Twitch credentials server-side and out of logs/repository. Document local setup and optional live-generation configuration.

## Rules and interaction
Initial attacks: charge, bounce and projectile burst. Weakness effects: stun, slow and reduced attack intensity. Each has bounded, tested parameters. Rescue baseline: three unique contributors within a rolling 15-second window; allow host to set threshold to one before a round. One contribution per user per window; fixed cooldown after activation. Do not depend on precise timing through delayed video.

## Acceptance and validation
- A three-person Twitch playtest completes three rounds with no stuck phases.
- A new participant can identify the current command within ten seconds in a moderated usability test.
- Repeated EventSub messages cause exactly one vote/help update.
- Disconnect, invalid model output, provider refusal and image timeout have tested recovery paths.
- Visible input acknowledgement targets under one second after backend receipt; this excludes Twitch broadcast delay.
- Arena targets 60 FPS on developer laptop; record device and observed results rather than promising universal performance.
- All four judging criteria have evidence: originality comparison, participant feedback, functioning integration/Codex record, readable entertaining demo.

## Non-goals
Multiplayer streamers, paid effects, video generation, arbitrary generated executable code, 3D rigs, commercial-game integration, public accounts/payment system and persistent community economy.

## Delivery
Milestone 1: deterministic local round and polished reveal. Milestone 2: real chat with idempotency and controls. Milestone 3: structured text and image generation plus fallback. Milestone 4: live playtest, fixes, documentation and submission video. Cut optional generation flourishes before reliability or demo clarity.

## Submission checklist and sources
Deadline: 2 November 2026 14:00 PST = 3 November 06:00 Perth. Aim to submit 2 November Perth evening. Recheck official rules before submitting.
New work during competition; built with Codex; interactive Twitch connection; runnable repository and assets; English description and instructions; YouTube video under three minutes showing Twitch and Codex; main build session ID. Provide testing access through judging. Public repo simplest; private GitHub/GitLab requires testing@devpost.com access. Freeze submission snapshot at deadline. Attendance is optional, including for cash prize eligibility.
Rules: https://twitchcon-codex.devpost.com/rules
Resources: https://twitchcon-codex.devpost.com/resources
Codex: https://chatgpt.com/codex/
Starter: https://dev.twitch.tv/docs/chat/chatbot-guide/
Chat: https://dev.twitch.tv/docs/chat/
EventSub: https://dev.twitch.tv/docs/eventsub/
Discord: https://discord.com/invite/G8UQqNy (#codex-twitchcon-hackathon)
Participants: https://twitchcon-codex.devpost.com/participants
Submission: https://devpost.com/submit-to/31742-codex-x-twitchcon-hackathon/manage/submissions
Judging: innovation, impact, implementation/Codex and design equally weighted. These are evidence goals, not guarantees of scoring. Direction: audience participation primary, content enhancement secondary.

## Review closure — 24 October 2026
Q8–Q10 accepted; first-milestone review is closed (ADR 0004). The deterministic local build is authorised. Live Twitch playtests, runtime generation, paid calls, public hosting and submission have not been completed or authorised by this milestone's acceptance.
