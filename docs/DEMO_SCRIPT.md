# ChatMade demo — target 2:45

Official requirement: under three minutes, publicly visible on YouTube, showing the project working on Twitch and how it was built with Codex. A 42.53-second silent sample walkthrough now exists locally; it is not the final submission video. Real Twitch recording, Codex build footage, narration and upload remain pending.

## Automated capture status — 2 November

`npm run video:sample` drives a disposable server through moderation, voting, approval, reveal, keyboard movement, three simulated participants' rescue, actual outcome and PNG export. `npm run video:live` waits for human Twitch authorization and chat login before creating recorded pages, then drives real chat commands with threshold 1. See README for dependencies. Raw page videos and beat markers remain available for editing; failed captures are labelled incomplete and refused by the renderer.

Verified sample: `release/video/capture-sample-2026-11-02T04-12-37-074Z/walkthrough-1080p-silent.mp4`, 1920×1080, 42.533333 seconds. Full decode passed and nine sampled frames were visually inspected. The round ended CAUGHT after 19.45 game seconds with one rescue. Persistent captions identify sample mode and three simulated participants. This proves the capture pipeline, not Twitch integration. The first automated live capture authorized successfully but timed out waiting for its chat readiness selector (`ChatBadgeCarousel`) before recording began. No live video was produced; the selector must be corrected before another take.

## Shot list and narration

| Time | Actual footage to capture | Narration / on-screen text |
| --- | --- | --- |
| 0:00–0:10 | Readable ChatMade title and arena/rescue glimpse | “ChatMade: chat builds the monster. The streamer survives it. Viewers invent the threat, then help save the person playing.” |
| 0:10–0:25 | Connected channel, Live Twitch chat selection, broadcast URL; keep auth codes/host key off-screen | “The streamer runs a local companion, connects their own Twitch channel, and adds a read-only browser view to OBS. Viewers stay in Twitch chat.” Only show OBS if actually tested. |
| 0:25–0:50 | Split view: real Twitch commands and matching moderation queue. Approve three ideas; show their exact names and channel | “Chat suggests a body, power and weakness. These are real Twitch messages arriving through EventSub. The host reviews ideas before they reach the broadcast.” |
| 0:50–1:10 | Build recipes, real vote, tally, selected mechanic and explicit host approval | “Votes recommend a recipe. The host sees its supported attack and weakness before approving. Creative text maps to bounded rules, so the encounter stays playable.” |
| 1:10–1:20 | Real reveal, selected credits and original-art label | “The selected contributors get credit. This build uses original fallback artwork; it does not generate a new image.” |
| 1:20–1:45 | Arena movement and actual `!help` messages; visible rescue effect | “The streamer dodges with three hearts. Chat activates the weakness together.” If only one account, add “This smoke test uses the one-viewer setting.” Never describe it as three-viewer rescue. |
| 1:45–1:55 | Real outcome, Saved locally, downloaded PNG | “Survive or get caught: the result records the recipe, outcome and credits, with an optional-name PNG export.” Use actual outcome; do not promise survival footage from the CAUGHT test. |
| 1:55–2:20 | Readable Codex chat/build evidence: approved scope, actual diff or documented bug plus regression test, terminal test result | “I used Codex to challenge scope, build the game and Twitch integration, and debug concrete failures. One fix kept attack warnings visible during rescue effects; its regression test now checks all three rescue types. Twenty-eight tests pass.” Show the real test/diff, not an animation of an invented exchange. |
| 2:20–2:35 | Delivered architecture and brief honest proof card | “Node owns the game state. EventSub supplies chat; a separate view supplies broadcast output. Our first real-channel test completed the loop. Idle keepalive timeouts remain under investigation.” Update only after an observed fix. |
| 2:35–2:45 | Creature/result and repository link, held long enough to read | “Made by chat. Survived by the streamer. ChatMade.” On screen: repository URL and “Local Twitch companion · original artwork”. |

Total: 165 seconds. Record full source actions; cuts may compress waiting, but label time compression and keep messages, credits, channel and round consistent. If additional footage uses sample mode, label it explicitly.

## Capture checklist

- Record actual Twitch and host/broadcast interaction; never fabricate viewer names, rescues or frames.
- Use distinct power/weakness suggestions when demonstrating different mechanics. With only one approved idea per category, all three recipes may share mechanics; do not imply three different generated creatures.
- Prefer three actual viewers for the community segment. Threshold 1 is acceptable as honest smoke-test footage, not proof of community impact.
- Fix/investigate keepalive instability before capture. Do not hide a failed interaction behind a success claim.
- Record Codex evidence separately with legible text. Keep unrelated tabs, bookmarks, notifications, host launcher contents, auth/device codes and private conversations out of frame.
- Record at 1920 × 1080 where possible. Check command text, vote tally and rescue effect at reduced playback size. Do not claim measured frame rate from recording settings.
- Use original audio/narration or material you have permission to use. Check all public footage for unintended third-party material.

## Final video review, before submission

Record chosen filename and YouTube URL here. Verify duration with `ffprobe`, review the full narration/captions and sample frames at 0:05, 0:30, 1:00, 1:25, 1:50, 2:05 and 2:35. Map every shot above to actual final timestamps. Mark absent beats **NOT SHOWN**; a planned beat is not evidence.

Verify public playback signed out, actual Twitch effects, visible Codex build/debug work, readable text, no credentials and consistent claims/numbers across video and written description. Final runtime must remain under 180 seconds including title/end cards.

Filename: TODO. Public YouTube URL: TODO. Reviewed duration: TODO. Beat coverage: TODO.
