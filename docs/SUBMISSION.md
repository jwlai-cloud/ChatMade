# Submission preparation

Status: Draft, reviewed 29 October 2026. This document prepares materials; no hackathon submission or judge sharing has been performed.

## Required deliverables

| Deliverable | Current evidence | Still required |
| --- | --- | --- |
| Runnable repository | [jwlai-cloud/ChatMade](https://github.com/jwlai-cloud/ChatMade) contains source, original fallback SVG, dependency lockfile, setup instructions and tests. Production build, 28 tests and the macOS preview runtime smoke check passed. | Test setup from a clean checkout; confirm judge access. The repo is private, so arrange access for testing@devpost.com before submission or explicitly choose public visibility. |
| Project description | Working draft below; contribution evidence in CONTRIBUTIONS.md. | Update after live integration and final validation so every feature claim matches the delivered build. |
| Codex session ID | Environment reports `01a16cd5-1329-7140-b20c-c69757f52492`; this session contains review, implementation, debugging and tests. | Cross-check with `/status` and confirm this remains the session containing most build work. See CODEX_SESSION.md. |
| Demo under three minutes | A 165-second storyboard is in DESIGN.md. | Record actual Twitch participation and Codex build evidence; publish the finished video as required and provide its URL. No video exists yet. |

An installable Twitch Extension is not specified in the supplied submission requirements. The project still needs to run reliably and demonstrate its Twitch interaction. Easy adoption by other streamers remains our own product requirement: packaging and guided connection are implemented, while real-channel and clean-machine usability checks are still outstanding.

## Final-week priorities — 29 October 2026

The [official brief](https://twitchcon-codex.devpost.com/) still lists 2 November 2026 at 14:00 PST, equivalent to **3 November at 06:00 in Perth**. Keep the earlier operational target of 2 November Perth evening. Its four judging criteria remain innovation, potential impact, implementation/Codex and design.

| Criterion | Existing evidence | Highest-value remaining evidence |
| --- | --- | --- |
| Innovation/Idea | Collective creature recipe, bounded playable consequences and cooperative rescue. | Explain the specific difference from existing audience-directed games without claiming market uniqueness. |
| Potential Impact | A short standalone segment designed for a streamer and a small audience. | Observe one streamer and three actual viewers using it; record whether they understand commands and want another round. Do not claim retention improvements. |
| Implementation/Codex | Source, 28 passing tests at the last run, build/package checks, design decisions and documented debugging in the main Codex session. | Verify actual Twitch authorisation/chat/reconnect; capture readable Codex implementation/debug evidence for the video. |
| Design | Creature reveal, arena, contribution credits, host controls and separate broadcast view. | Check guided setup with another streamer, readable OBS capture and complete real round. New setup UI and PNG download still need browser verification. |

Execution order: finish publisher Client ID setup and real Twitch connection; complete the live round/playtest; fix observed reliability/usability issues; record a sub-three-minute demo and finalise repository access, description and session ID. Generation remains planned and needs provider/budget agreement before paid calls; it must not delay establishing a working Twitch demonstration. Do not add new platforms, competing teams, combat mechanics or Extension delivery before the demonstrated core loop works.

## Showcase comparison — limited historical review

Reviewed the official [Showcase](https://dev.twitch.tv/showcase/) and two linked Twitch case studies on 29 October. These are historical examples, not a current exhaustive competitor audit:

- [Crowd Control, 2019](https://blog.twitch.tv/en/2019/02/15/the-evolution-of-speedrunning-crowd-control-caf6e259e848/): Twitch describes viewers helping or hindering an existing game through effects. ChatMade's proposed distinction is a standalone creature-making survival segment rather than integration with a catalogue of external games.
- [Vermintide 2 integration, 2019](https://blog.twitch.tv/en/2019/03/08/a-twitch-integration-lets-the-viewers-call-the-shots-b5eae972d3ef/): Twitch describes chat votes changing game events and discusses viewer names appearing in games. Audience voting and attribution therefore cannot serve as uniqueness claims by themselves. Make the actual gameplay effect of audience choices obvious and keep choices balanced.

Our differentiation is a positioning hypothesis to demonstrate, not proof that no comparable product exists. Do not reuse the case studies' historical APIs or growth claims as current technical guidance or ChatMade outcome evidence.

## Project description — working draft

**ChatMade: chat builds the monster; the streamer survives it.**

ChatMade is designed as a reusable audience-participation game for Twitch streamers. Viewers propose a creature's body, power and weakness, vote on a recipe, then cooperate to help the streamer survive a 60-second encounter. The streamer dodges attacks while chat works together to activate the creature's weakness. Selected contributors receive visible credit.

The current local prototype supports moderated suggestions, voting, deterministic recipe selection, three bounded attack patterns and three rescue effects. It includes keyboard-controlled gameplay, pause and restart controls, a separate read-only broadcast view, local result records and original fallback artwork. PNG export is implemented but still needs end-to-end download verification. Guided read-only Twitch authorisation and EventSub reception are implemented and tested with mocked Twitch responses, including reconnect and duplicate delivery. A real Twitch connection has not yet been verified. Runtime image generation is not implemented. Sample rounds are explicitly labelled simulations; live rounds block sample inputs.

Codex helped stress-test the product through a structured design review, record decisions and terminology, implement the TypeScript/React/Canvas/Node application, and write regression and integration tests. Its debugging work included protecting private local files from the development server, preserving attack warnings during rescue effects and varying successive projectile rings deterministically. The current production build and 28 automated tests pass. A macOS preview package with a bundled runtime also passed a headless startup, host/broadcast access, private-file and shutdown check; clean-machine usability remains unverified.

Before submission, replace this prototype-status paragraph with the verified final functionality. Do not claim live Twitch integration, generated artwork, streamer usability results or performance measurements until they exist.

## Demo evidence

Use the [165-second storyboard](DESIGN.md#demo-storyboard-165-seconds). Show the actual Twitch channel, real viewer commands and their visible effect on the same round. Show the streamer's movement, one chat rescue, the outcome and accurate selected credits. Include readable Codex footage demonstrating implementation or debugging, not only a static session-ID screen.

Keep credentials, host keys and unrelated private information out of the recording. Label any sample-mode footage. Do not present sample inputs as a real Twitch playtest.

## Release gate

- [ ] Real Twitch connection and a completed live round verified.
- [ ] Other-streamer setup and clean-checkout instructions tested.
- [ ] PNG download and OBS/broadcast readability checked.
- [ ] Final feature claims match the frozen code and video.
- [ ] Repository access for judges confirmed.
- [ ] Main build session ID checked through `/status`.
- [ ] Video length, visibility and URL checked.
- [ ] User explicitly requests final registration/submission before those actions occur.
