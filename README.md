# ChatMade

**You made it. I have to survive it.**

**Chat builds the monster. The streamer survives it.**

ChatMade is an audience-participation game for Twitch streams. Viewers use Twitch chat to invent a monster, vote on its recipe, then cooperate to help the streamer survive a 60-second encounter shown on stream. The name means “made by chat.”

First milestone runs locally with clearly labelled simulated participants. Twitch and AI generation are not connected yet.

Intended delivery is a reusable streamer companion with guided Twitch connection and an OBS browser-source URL. The setup below is for the current developer build; downloadable packaging and streamer onboarding are not finished. Viewers will participate in existing Twitch chat without another app.

## Run

Requires Node.js 22.12+ and npm.

```sh
npm ci
npm run build
npm start
```

Open **http://127.0.0.1:4317/host**. Copy the key from `data/host-key.txt` into the host unlock field. On macOS, copy it without printing it into terminal history:

```sh
pbcopy < data/host-key.txt
```

The server binds only to `127.0.0.1`. Use that address, not `localhost`. The key is regenerated on each startup, remains in browser memory only, and must not be shared. `data/` is ignored by Git and blocked from HTTP access. Do not expose this local server through a public tunnel.

For development, run `npm run dev` instead. Source changes reload the page; unlock again if needed. Server source changes require restarting the process.

## Try a complete round

1. Unlock the host desk. Optionally set a seed and rescue threshold, then click **Apply settings**.
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
- Read-only broadcast, host key/origin checks, private-file isolation, reconnecting browser state.
- Local result persistence, selected attribution, original fallback provenance and PNG export.
- Responsive layout, keyboard focus states and reduced-motion preference. System fonts; no external font service.

The same original SVG fallback is used for every recipe. Body text is an ingredient credit, not a claim that artwork has been generated. Text powers map to a bounded supported mechanic shown before approval.

## Checks

```sh
npm test
npm run build
```

Tests cover the core loop, deterministic attacks, moderation/privacy, malformed input, vote/delivery replacement, rescue timing, collision, pause/reset, host authentication, origin rejection, browser reconnection and result persistence. Integration tests open temporary loopback ports.

## Planning and evidence

- [Product requirements](docs/PRD.md), [design](docs/DESIGN.md), [glossary](CONTEXT.md), [decisions](docs/adr/)
- [Build session](docs/CODEX_SESSION.md), [contribution log](docs/CONTRIBUTIONS.md)
- [Twitch integration follow-up](docs/TWITCH_INTEGRATION.md)
- [Submission checklist and working description](docs/SUBMISSION.md)

No paid API calls, registration or hackathon submission have been performed. Before submission, verify official rules, the actual build session ID, clean installation and live Twitch behaviour.
