# Codex continuation

Updated 25 October 2026. Continue in this session; review is closed for the deterministic local milestone.

## Current state

The requested grill-me/grill-with-docs review ran with their grilling and domain-modeling dependencies. User accepted recommendations Q1–Q10. Read ADRs 0002–0004 and CONTEXT.md for agreed scope; remaining Twitch/generation proposals are not silently approved requirements.

The repo is already at `~/Projects/Agent/ChatMade`. GitHub plugin access was verified for the private `jwlai-cloud/ChatMade` repository; the user also completed CLI device authentication. Do not create another repo or change visibility.

Implemented: the deterministic local game plus guided Public-client Twitch device authorisation, read-only EventSub chat adapter, reconnect/deduplication, live/sample isolation, dynamic broadcaster selection, mode-aware persistence, guided OBS setup, private local host launcher and macOS preview packaging. See README, ADR 0005 and CONTRIBUTIONS.md. 28 tests, the production build and the packaged-runtime smoke check passed. Twitch APIs/EventSub were mocked; actual Twitch compatibility remains unverified.

Browser walkthrough completed a sample round and verified Saved locally. PNG export download was not verified: automatic browser approval review failed due to its usage limit. Do not bypass that check through alternate browser surfaces or indirect execution. Further visual checks also remain outstanding.

## Product positioning

ChatMade means “made by chat”: **Chat builds the monster. The streamer survives it.** This is an audience-participation game, with a creature reveal and broadcast overlay as content enhancement. It is not intended as a messaging app. The user specifically questioned this alignment; the official brief was rechecked and DESIGN.md now records the fit.

The user also requires easy adoption by other streamers. Target one reusable local companion, guided Twitch connection, a supplied OBS browser-source URL and no viewer installation or per-channel code edits. Current npm/manual-key setup is a developer milestone; release packaging and nontechnical onboarding validation remain outstanding. Do not silently switch to a hosted product or Twitch Extension.

## Next milestones

1. Finish manual PNG-export and OBS/broadcast-readability checks when browser approval is available. Measure actual frame rate rather than claiming 60 FPS.
2. The user is registering a Public Twitch application. Obtain only its public Client ID, configure the host desk, then have the user authorise their own channel through Twitch. Transport and guided setup code are now implemented and mock-tested. Run the real live/reconnect checks in docs/TWITCH_INTEGRATION.md. No real Client ID/tokens have been configured yet.
3. Review runtime generation provider and spend cap before paid calls. Add schema validation, bounded generation timeout and original fallback recovery.
4. Run the live three-viewer playtest and record evidence. Test the macOS arm64 preview on another Mac with a nontechnical streamer; packaging is implemented but not notarized or clean-machine verified. Native Windows/Linux packages are still outstanding.

Keep most build work in this session. CODEX_SESSION.md records the environment-reported session ID; `/status` cross-check is still required before submission. Never substitute a task-operation ID. Keep CONTRIBUTIONS.md accurate. No registration or final hackathon submission is requested.

## Distribution and current limits

Run `npm run build` then `npm run launch` for source startup, or `npm run package` on macOS to build a bundled-runtime ZIP. The initial preview under `release/` is not publisher-configured; rebuild after saving Client ID so recipients only need Connect Twitch. Never commit or distribute source `data/`, host keys, `.env` or tokens. Tests and package smoke checks must not open browsers while the prior approval-review block remains unresolved. Runtime Twitch tokens are memory-only; restarting requires reauthorisation.
