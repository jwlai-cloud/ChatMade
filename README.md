# ChatMade

**You made it. I have to survive it.**

**Chat builds the monster. The streamer survives it.**

ChatMade is an audience-participation game for Twitch streams. Viewers use Twitch chat to invent a monster, vote on its recipe, then cooperate to help the streamer survive a 60-second encounter shown on stream. The name means “made by chat.”

Local sample mode and guided Twitch authorisation/EventSub reception are implemented. A real one-account Twitch round passed on 2 November, including suggestions, vote, rescue, saved outcome and PNG download. Repeated idle keepalive timeouts/recovery remain under investigation; three-viewer and OBS checks are pending. Runtime AI generation is not implemented.

Intended delivery is a reusable streamer companion with guided Twitch connection and an OBS browser-source URL. A publisher-configured macOS Apple Silicon preview has been packaged with its own Node runtime and browser launcher. Another streamer's setup and clean-machine usability still need verification; other platform packages are not yet provided. Viewers participate in existing Twitch chat without another app.

## Run

Requires Node.js 22.12+ and npm.

```sh
npm ci
npm run build
npm start
```

For guided startup after building, run `npm run launch` instead of `npm start`. It opens the local host launcher and unlocks controls automatically. To reopen controls while the server is running, open `data/open-host.html`. This file contains a private host key: do not share it.

Manual alternative: open **http://127.0.0.1:4317/host** and copy the key from `data/host-key.txt` into the host unlock field. On macOS:

```sh
pbcopy < data/host-key.txt
```

The server binds only to `127.0.0.1`. Use that address, not `localhost`. The key is regenerated on each startup, remains in browser memory only, and must not be shared. `data/` is ignored by Git and blocked from HTTP access. Do not expose this local server through a public tunnel.

For development, run `npm run dev` instead. Source changes reload the page; unlock again if needed. Server source changes require restarting the process.

## Connect your Twitch channel

Publisher setup happens once for ChatMade, not once per streamer:

1. Register a **Public** Twitch application in the [Developer Console](https://dev.twitch.tv/console/apps). Twitch requires verified email and 2FA. Use a unique name; if registration requires HTTPS for its redirect field, use `https://localhost:4317` as registration metadata. Device-code login does not use that redirect or require a local HTTPS server. ChatMade's publisher has completed registration; testers can use the public ID in [judge instructions](docs/JUDGE_TESTING.md).
2. Save its **public Client ID** under Publisher setup in the host desk. Alternatively set `TWITCH_CLIENT_ID` in a local `.env` file using `.env.example`. No client secret is used or distributed.
3. Click **Connect Twitch**, open Twitch's authorisation link and enter the displayed code. Grant read-only chat access. The authorised account's own channel is selected automatically.
4. In the lobby, choose **Live Twitch chat**. Starting a live round requires a connected account; sample inputs are rejected server-side in this mode.
5. Copy the OBS URL from the setup panel into an OBS Browser Source. Viewers enter commands in existing Twitch chat. Approve suggestions before displaying them.

Access, refresh and device tokens stay in the backend's memory and are not logged, stored in browser state or saved in round records. Reauthorise after restarting the app. Disconnect forgets local tokens; revoke the app grant separately in Twitch Connections if desired. The app reads chat and does not send chat messages. Keepalive failures trigger reconnect; official Twitch reconnect handoffs preserve subscriptions; fresh connections recreate them. Deduplication persists across rounds. Chat loss does not stop an encounter.

Real one-account authorisation, delivery, vote and rescue passed; reconnect reliability and community validation remain open. See [integration details and live checklist](docs/TWITCH_INTEGRATION.md) and [observed live evidence](docs/LIVE_TEST_2026-11-02.md).

## Package a streamer preview

On macOS with a self-contained official Node.js runtime:

```sh
npm run package
```

This builds and smoke-tests a ZIP under `release/` for the current Mac architecture. It bundles Node, the compiled backend, frontend, original artwork, WebSocket dependency and third-party notices. Recipients extract it and double-click **Start ChatMade.command**; no Node/npm install is required. The server stays local. Keep its Terminal window open while playing.

A Client ID saved in the host desk or set through `TWITCH_CLIENT_ID` is embedded as public publisher configuration, so other streamers only click Connect. Source `data/`, host keys, tokens and `.env` files are never copied. Package verification uses a temporary loopback server with browser opening disabled and removes generated test credentials before creating the ZIP.

The current preview is macOS Apple Silicon and is not a notarized installer. Clean-machine setup, system compatibility, another streamer's onboarding and OBS output still need manual validation. Windows/Linux source use is possible with Node, but native release packages have not been built or verified.

## Try a complete sample round

1. Open/unlock the host desk and choose **Sample mode**. Optionally set a seed and rescue threshold, then click **Apply settings**.
2. Click **Start experiment**, then **Load sample ideas**. Review and approve suggestions individually. Extend collection with **+15 seconds** if needed; only approved ideas appear on broadcast.
3. Click **Build recipes**. Choose each sample participant and submit `!vote 1`, `!vote 2` or `!vote 3`. The latest vote replaces the earlier one. Vote ties and no-vote rounds use seeded selection.
4. Close voting (or wait 15 seconds), inspect the supported attack/weakness and approve the selected recipe. Rejection requires a visible reason and reopens moderation.
5. The original fallback creature is revealed. Click **Enter arena**, then click or Tab into the arena. Move with **WASD or arrow keys**. Three hearts; survive 60 seconds. Pause/resume freezes the simulation.
6. Submit `!help` from three different sample participants within 15 seconds to trigger rescue. Each participant can help once per 15 seconds; activation has a 10-second cooldown. A one-viewer threshold is available before starting.
7. The result is saved under `data/<round-id>.json`. Click **Export result PNG**; optionally omit contributor names. **Next experiment** returns to the lobby. **Abort to lobby** discards an unfinished round, not saved results.

All sample controls stay on the host page. Capture **http://127.0.0.1:4317/broadcast** in OBS. This view has no host controls or credentials; unauthenticated connections cannot mutate state. The footer reserves a camera area outside gameplay. Real OBS capture at 1920×1080 and live participant usability still require validation.

## What works

- Server-authoritative phases, clock and deterministic physics; charge, bounce and projectile burst attacks.
- Moderation queue, per-category suggestion replacement, per-person vote replacement and seeded tie resolution.
- Stun, slow and smaller danger zones; rolling unique-viewer rescue and cooldown.
- Keyboard movement, collision invulnerability, pause, reset and system-stall auto-pause.
- Read-only broadcast, host key/origin checks, private-file isolation, a private local launcher and reconnecting browser state.
- Public-client Twitch device authorisation, server-only tokens, refresh/validation, EventSub reconnect and delivery deduplication. Auth/delivery passed a real one-account test; broader lifecycle cases are mock-tested and idle reconnect reliability remains open.
- Explicit live/sample separation, channel-aware saved results and guided OBS setup.
- macOS preview packaging with a bundled runtime and a headless startup/privacy/shutdown smoke check.
- Local result persistence, selected attribution, original fallback provenance and PNG export.
- Responsive layout, keyboard focus states and reduced-motion preference. System fonts; no external font service.

The same original SVG fallback is used for every recipe. Body text is an ingredient credit, not a claim that artwork has been generated. Text powers map to a bounded supported mechanic shown before approval.

## Checks

```sh
npm test
npm run build
```

Tests cover the core loop, deterministic attacks, moderation/privacy, malformed input, vote/delivery replacement, rescue timing, collision, pause/reset, host authentication, origin rejection, browser reconnection and result persistence. Integration tests open temporary loopback ports. Twitch responses and EventSub sockets are mocked; passing these checks does not establish real Twitch compatibility.

## Scripted demo recording

Requires Google Chrome and `ffmpeg` / `ffprobe` on PATH. Install Playwright's recording helper once, then capture:

```sh
npx playwright install ffmpeg
npm run video:sample
```

The script starts a disposable local server, drives an actual sample round, and saves raw page videos, timing markers, result PNGs and an edited silent 1080p MP4 under a new `release/video/` folder. Sample footage is visibly labelled as simulated participants. Existing captures are preserved.

`npm run video:live` instead waits for you to authorize Twitch and sign into chat in its separate Chrome browser before recording begins. It uses one real account and rescue threshold 1; it does not validate three-viewer participation. Login state stays in memory, without reading your existing Chrome profile or saving credentials. The first live capture timed out at its chat-readiness selector before recording: fix that check before retrying. See the [complete video handoff](docs/VIDEO_HANDOFF.md).

The edited walkthrough must still be combined with actual Codex build evidence and narration for submission. The renderer checks the MP4 stays below three minutes. Re-render a completed capture with `node scripts/render-demo.mjs /absolute/path/to/capture.json`; preserve or rename an existing MP4 first.

## Planning and evidence

- [Product requirements](docs/PRD.md), [design](docs/DESIGN.md), [glossary](CONTEXT.md), [decisions](docs/adr/)
- [Build session](docs/CODEX_SESSION.md), [contribution log](docs/CONTRIBUTIONS.md)
- [Twitch integration follow-up](docs/TWITCH_INTEGRATION.md)
- [Submission checklist and working description](docs/SUBMISSION.md)
- [Prepared Devpost copy](devpost-submission.md), [judge quick start](docs/JUDGE_TESTING.md), [review](docs/HACKATHON_REVIEW.md)
- [Video capture and submission handoff](docs/VIDEO_HANDOFF.md), [165-second shot list](docs/DEMO_SCRIPT.md), [narration read](docs/VIDEO_NARRATION.md)
- [Recorded Codex build evidence clip](docs/BUILD_EVIDENCE_CLIP.md) — actual repository source and fresh test run, with reproduction command.

No paid generation calls or final hackathon submission have been performed by Codex. Main build session ID was confirmed by the user on 2 November. Before submission, resolve the review blockers, verify judge access and record the public Twitch/Codex video.
