# Judge quick start

ChatMade is a local Twitch audience-participation game, not a hosted website or installable Twitch Extension. No paid API key is required. Source target: Node.js 22.12+; the packaged preview targets macOS Apple Silicon only.

Start with the sample round below: it needs no Twitch account or authorization. To test real Twitch, the host connects their channel once per app session and participants use their usual signed-in Twitch browser. Judges do not need the video capture scripts, a separate browser login, a bot account or their own Twitch developer application. The isolated Chrome login used by our automated recording tool is a recording prerequisite, not part of normal ChatMade setup.

Run the application on **your own computer**. This project has no hosted app URL. `127.0.0.1:4317` means your computer after startup, not the submitter's server. No public tunnel is needed. The repository is public; the `submission` tag pins commit `04960dd` for reproducible judging. This guide on main includes later documentation corrections; the tag is intentionally unchanged.

## Install from source

```sh
git clone https://github.com/jwlai-cloud/ChatMade.git
cd ChatMade
git checkout submission
npm ci
npm run build
npm run launch
```

`launch` opens authenticated host controls automatically; no manual host-key entry is needed for the normal path. Keep Terminal running and complete the sample round below. No Twitch login, developer registration, paid API key or OBS installation is needed for sample testing. Reopen controls via local `data/open-host.html`; do not share this private launcher or `data/host-key.txt`. Broadcast page: `http://127.0.0.1:4317/broadcast`. Keep the server on loopback; no tunnel is required. If startup reports port 4317 is busy, stop the other ChatMade instance first. Do not run the video-capture scripts to test the submitted game.

## Full sample round, no Twitch login

1. Choose Sample mode and start an experiment. Load sample ideas, then approve each desired contribution in the host queue. Only approved suggestions reach broadcast.
2. Build recipes. Use the three simulated participants to vote; close voting. Check supported mechanics and approve the winner.
3. Observe the original-art reveal, then enter the arena. Click the arena and use WASD/arrows. Three hearts; survive 60 seconds or be caught. Pause/resume is available.
4. During play send `!help` from three different simulated participants within 15 seconds. Watch the rescue effect. These are explicitly simulated inputs.
5. On the result, check Saved locally and export PNG. Next experiment returns to lobby.

## Real Twitch path

Use the publisher-configured preview, or enter this **public** publisher Client ID in the source host's Publisher setup: `ajyhqrrpm84ac5eechmqblg9p98yu5`. This is application identification, not a credential. No Client Secret is used.

Click Connect Twitch and personally complete authorisation on Twitch. Only read-only chat permission is requested. The verified account selects its own channel; no code changes or separate bot account are needed. In the lobby choose Live Twitch chat. For a one-account smoke test choose rescue threshold 1 and Apply settings; restore 3 for the community test.

Start experiment and send these separately in that channel's Twitch chat during the 30-second collection window:

```text
!body Jelly knight
!power Charging hugs
!weakness Rubber ducks
```

Approve received suggestions, then Build recipes. Send `!vote 1` while voting is open. Close voting, approve the selected recipe, reveal and enter the arena. During play send `!help`; for threshold 3, three different accounts must send it within 15 seconds. An extra collection window is available through +15 seconds.

The application reads chat; it never posts commands for viewers. OAuth tokens remain in backend memory and restart requires reauthorisation. For actual stream output add the broadcast URL as an OBS Browser Source (1920 × 1080 suggested), while keeping host controls separate.

## Evidence and current limits

The optional bundled-runtime preview currently exists as a local macOS Apple Silicon ZIP, not an attached public release download. Use source instructions above unless a verified release asset is supplied. Same-Mac fresh-source build was checked; another-machine graphical onboarding and native Windows/Linux packaging have not been validated.

See [first live test](LIVE_TEST_2026-11-02.md). Real one-account delivery, vote, rescue, result and PNG passed. Repeated idle keepalive timeouts/recovery remain unresolved; controlled reconnect, three-viewer participation, OBS output, measured performance and clean-machine graphical onboarding are not yet verified. Same original fallback creature is used for all recipes.

Automated checks: `npm test` and `npm run build`. Twitch service responses/sockets in automated tests are mocked. Saved results live in ignored `data/`; no OAuth tokens are included in round records.
