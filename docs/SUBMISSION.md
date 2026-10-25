# Submission preparation

Status: Draft, 25 October 2026. This document prepares materials; nothing has been registered, shared with judges or submitted.

## Required deliverables

| Deliverable | Current evidence | Still required |
| --- | --- | --- |
| Runnable repository | [jwlai-cloud/ChatMade](https://github.com/jwlai-cloud/ChatMade) contains source, original fallback SVG, dependency lockfile, setup instructions and tests. Production build, 28 tests and the macOS preview runtime smoke check passed. | Test setup from a clean checkout; confirm judge access. The repo is private, so arrange access for testing@devpost.com before submission or explicitly choose public visibility. |
| Project description | Working draft below; contribution evidence in CONTRIBUTIONS.md. | Update after live integration and final validation so every feature claim matches the delivered build. |
| Codex session ID | Environment reports `01a16cd5-1329-7140-b20c-c69757f52492`; this session contains review, implementation, debugging and tests. | Cross-check with `/status` and confirm this remains the session containing most build work. See CODEX_SESSION.md. |
| Demo under three minutes | A 165-second storyboard is in DESIGN.md. | Record actual Twitch participation and Codex build evidence; publish the finished video as required and provide its URL. No video exists yet. |

An installable Twitch Extension is not specified in the supplied submission requirements. The project still needs to run reliably and demonstrate its Twitch interaction. Easy adoption by other streamers remains our own product requirement, with packaging and guided connection still outstanding.

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
