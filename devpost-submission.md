# ChatMade

## One-line Summary

Chat builds the monster. The streamer survives it.

## Inspiration

We wanted chat's ideas to become something the streamer has to face, then give that same audience a reason to help. ChatMade turns a few minutes between stream segments into a shared creature-making game. Viewers contribute through the Twitch chat they already use.

## What it does

ChatMade is a standalone audience-participation game: chat collectively chooses a creature's ingredients, then helps the streamer survive its attacks.

1. Viewers send `!body`, `!power` and `!weakness` ideas in Twitch chat. The host reviews suggestions before they appear on broadcast.
2. Approved ideas become three recipes. Chat votes with `!vote 1`, `!vote 2` or `!vote 3`; the host checks the supported mechanics and explicitly approves the winner.
3. The creature is revealed with selected contributors credited. The streamer uses WASD or arrow keys to dodge for up to 60 seconds with three hearts.
4. Viewers send `!help` to activate its weakness. The default requires three different viewers within 15 seconds; a one-viewer setting supports small-channel testing.
5. The round ends SURVIVED or CAUGHT, saves a local result, and offers a shareable PNG with optional contributor names.

Powers map to three bounded attack patterns: charge, bounce and projectile burst. Weaknesses stun, slow or shrink danger zones. The host sees the actual mechanic before approval. The current build uses the same original jelly-knight artwork for every recipe; body suggestions receive credit but do not generate new art.

## How we built it

The application runs locally alongside OBS. React 19.3.1 renders the host desk and broadcast layout; Canvas 2D draws the arena; Node.js runs the authoritative game and Twitch adapter. TypeScript 5.9.3, Vite 7.3.7 and ws 8.22.0 are pinned through the dependency lockfile.

Twitch Public-client device authorisation requests only `user:read:chat`. Twitch API token validation identifies the authorised streamer and EventSub WebSockets deliver `channel.chat.message` events. Tokens remain in backend memory; each streamer connects their own channel without source edits or a separate bot account. A separate read-only browser page is designed for an OBS Browser Source. Saved round records retain selected credits and outcomes, not OAuth tokens or a raw-chat archive.

## How we used Codex

I directed the product and approved decisions in one main Codex chat. Codex challenged the audience roles and scope, helped choose cooperative survival and bounded mechanics, recorded architecture decisions, then built the TypeScript game, React interface, Twitch adapter and macOS preview packaging.

Codex also wrote regression/integration tests and debugged concrete problems: private-file exposure through development-server paths, attack warnings disappearing during rescue effects, fixed projectile angles, and inherited Node flags breaking packaged startup. At my request, it drove the first real Twitch smoke test: ideas reached moderation, a vote counted, `!help` activated rescue, and a result PNG downloaded successfully.

## How we used AI

Codex was the development assistant. Gameplay, recipe mapping and physics execute deterministic application code. This version does not call a runtime language or image model and does not generate creature artwork.

## Challenges we ran into

Creative chat suggestions need predictable rules. We kept free-text ideas but showed their bounded gameplay mapping before host approval. Votes recommend a recipe; they cannot bypass that approval.

Local broadcast tooling also needs a clear control boundary. Host mutations require a private key and accepted origin; the broadcast view cannot control the game. Twitch credentials stay in the backend.

The first live test exposed repeated idle keepalive timeouts followed by recovery. That reliability finding is still open; mock reconnect tests are not evidence that live reconnect is fully reliable.

## Accomplishments we're proud of

- A complete create, vote, reveal, survive and export loop.
- 28 passing automated tests on 2 November, including mocked Twitch authentication, reconnect and duplicate-delivery cases.
- One completed real Twitch round on `jwlaicloud`: five accepted commands, zero rejected commands, one rescue, CAUGHT at 13.3 seconds, and a verified 1200 × 675 result PNG. This used the broadcaster's account and rescue threshold 1, not three viewers.
- A publisher-configured macOS Apple Silicon preview with a bundled Node runtime passed startup, host/broadcast, private-launcher and shutdown checks on the development Mac.

## What we learned

A viewer's idea needs a visible consequence they can understand. Showing attack and rescue mechanics before approval made the relationship between creative text and playable rules explicit. We also learned to separate mocked integration coverage from real Twitch evidence: the first live round validated delivery while exposing a reliability issue the mock suite had not established in production.

## What's next

Investigate idle keepalive timeouts, run a three-viewer playtest, check OBS readability/performance, and validate setup with another streamer on a clean Mac. Runtime generation remains a future decision with provider and spending limits still unresolved.

## Built With

Candidate tags: OpenAI Codex, TypeScript, React, Node.js, Vite, HTML5 Canvas, Twitch API, Twitch EventSub, WebSocket. Confirm Devpost's accepted tag names when saving. OBS is the intended broadcast integration; an OBS capture has not yet been verified.

## Architecture

See [architecture and interaction flow](docs/ARCHITECTURE.md) and [rendered architecture](docs/submission-assets/architecture.svg). Codex belongs to the build process, not the runtime request path.

## Testing Instructions

See [judge quick start](docs/JUDGE_TESTING.md). Sample mode runs without Twitch authorisation; clearly labelled simulated inputs exercise the full loop. Live mode requires the tester to authorise their own Twitch account and send commands in their own channel. No payment or runtime AI key is needed.

## Public Demo Link

No hosted demo. Local companion: follow repository instructions. The macOS arm64 preview is currently a local ZIP, not an online download link.

## Public Repository Link

https://github.com/jwlai-cloud/ChatMade — currently private. Access for `testing@devpost.com` must be verified before submission. Do not label it public until visibility is changed.

## Demo Video

**TODO: publicly visible YouTube URL.** No video is attached to the existing Devpost draft. Target 165 seconds; record actual Twitch interaction and readable Codex build/debug footage using [the shot list](docs/DEMO_SCRIPT.md). Do not substitute a slideshow or simulated chat for working-on-Twitch footage.

## Screenshot Shot List

1. Real Twitch command beside host moderation queue, with matching contribution and channel.
2. Recipe vote plus explicit host approval gate.
3. Arena and visible rescue effect, with the real threshold stated.
4. Result and selected credits. [Verified exported result](docs/submission-assets/first-live-result.png) is prepared; it is an exported artifact, not a screenshot of a live stream.

## Submission Readiness Notes

Local draft only. Existing Devpost project: `chatmate-lv56od` (ID 1517312), currently titled ChatMate, state `submission_draft`, no submitted timestamp or video as inspected on 2 November. Use ChatMade consistently when updating that draft; no duplicate project is needed. No Devpost fields were changed during this preparation.

Blocking material: public YouTube demonstration, judge repository access, required unanswered personal fields and eligibility confirmations. Main technical risk: repeated idle keepalive timeouts. Three-viewer, controlled network interruption, actual OBS output and clean-machine onboarding remain unverified; these are product validation gates, not additional official deliverable fields.

## Known Limitations

Same original fallback art for every creature; no runtime generation. macOS package unsigned and not notarized. Tokens forgotten at shutdown. Other platform packages unverified. No measured FPS, latency, audience retention, independent streamer usability or market-uniqueness claim.

## TODO Official Form Fields

Live field IDs verified with the Devpost Hackathons plugin on 2 November 2026. The following are preparation notes, not a submitted payload.

| Field ID | Official label | Prepared answer |
| --- | --- | --- |
| 29286 | Submitter Type | Individual — user confirmed |
| 29287 | Submitter Country of Residence | TODO: user confirmation; do not infer from timezone |
| 29288 | Provide a URL to your code repository on GitHub, GitLab or Bitbucket. | https://github.com/jwlai-cloud/ChatMade — verify judge access |
| 29289 | Provide the Codex session ID for the thread where you built most of your project. | `01a16cd5-1329-7140-b20c-c69757f52492` — user confirmed `/status` and build chat on 2 November |
| 29290 | Explain how your project meets the main technology requirement. | Copy answer below |
| 29291 | Explain how streamers and their community on Twitch use your project. | Copy answer below |
| 29292 | How much did this hackathon help you develop new skills or knowledge? | A lot — user supplied |
| 29293 | How likely are you to use OpenAI Codex again, at work or in your personal projects? | Very likely — user supplied |
| 29294 | Age of majority | TODO: user confirmation of exact declaration |
| 29295 | Eligible jurisdiction | TODO: user confirmation of exact declaration |
| 29296 | Not employee of the sponsors | TODO: user confirmation of exact declaration |

### Answer for 29290 — technology requirement

I used OpenAI Codex in the main build chat to review scope, record decisions, implement the TypeScript/React/Canvas/Node.js application, write regression and integration tests, debug security and packaging issues, and drive a real Twitch smoke test. ChatMade uses Twitch Public-client device authorisation with `user:read:chat`, Twitch API token validation and EventSub WebSockets for `channel.chat.message`. Viewers' chat commands become moderated suggestions, votes and rescue inputs in a local server-authoritative game. A read-only broadcast URL is designed for OBS. The completed real-channel smoke test verified five accepted commands and one rescue; mocked tests cover broader auth/reconnect cases. Runtime artwork generation is not implemented, and repeated idle keepalive timeouts remain under investigation.

### Answer for 29291 — streamer and community use

The streamer runs ChatMade locally, connects their own Twitch account and adds the read-only broadcast URL to OBS. Viewers stay in Twitch chat: they propose a body, power and weakness, vote on approved recipes, then send `!help` to activate the selected weakness while the streamer dodges attacks with WASD or arrow keys. The host approves suggestions and the winning recipe before reveal. A round lasts up to 60 seconds with three hearts; selected contributors are credited and the result can be exported as a PNG. No viewer installation is needed. Three-viewer rescue is the default; a one-viewer setting supported our first live smoke test. OBS output and a three-viewer playtest still need validation.

### Declarations awaiting the user's explicit confirmation

- 29294: “I, and, if applicable, all of my teammates, are at at least 18 or the age of majority where I reside, whichever is older.”
- 29295: “I, and, if applicable, all of my teammates, are from an eligible jurisdiction to compete.”
- 29296: “I, and, if applicable, all of my teammates, are not employees, representatives nor agents of the Promotion Entities of this hackathon.”

Read the [official rules](https://twitchcon-codex.devpost.com/rules) and [Devpost terms](https://info.devpost.com/terms-of-service) before final submission. No declaration is checked and no agreement is inferred from preparing this draft.
