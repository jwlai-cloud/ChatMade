# ChatMade — video capture and submission handoff

Prepared 2 November 2026 for the next operator or coding assistant. This is an execution brief, not evidence that the final video or submission exists. Read this file first, then DEMO_SCRIPT.md and VIDEO_NARRATION.md. Keep the main build session ID even if another assistant finishes the edit.

## 1. What the application does

**ChatMade: chat builds the monster. The streamer survives it.**

ChatMade is a local audience-participation game for Twitch streamers. Viewers suggest a body, power and weakness through ordinary Twitch chat. The streamer moderates suggestions, chat votes on recipes, and the streamer approves the winner. The streamer then dodges attacks with WASD or arrow keys for up to 60 seconds with three hearts. Chat can activate the selected weakness with `!help`. Selected contributors receive credit; the result saves locally and can be exported as a PNG.

The default rescue needs three different viewers within 15 seconds. The one-viewer setting is useful for a smoke test. Powers map to charge, bounce or projectile burst; weaknesses map to stun, slow or smaller danger zones. The same original jelly-knight artwork appears for every recipe. Free text does not generate new artwork or arbitrary game code.

This is a standalone local companion with a read-only broadcast page intended for OBS, not a messaging app or Twitch Extension. Viewers install nothing. Codex helped build the application; the application does not call a runtime AI model. Audience participation is its primary fit with the brief; the reveal and broadcast page also enhance stream content.

## 2. Submission contract

Devpost Hackathons plugin rechecked requirements and structured dates at 2026-11-02 04:46 UTC. Official pages: https://twitchcon-codex.devpost.com/ and https://twitchcon-codex.devpost.com/rules . Recheck before final submission if state changes.

| Required item | Prepared value / action |
| --- | --- |
| Source repository with all source, assets and run instructions | https://github.com/jwlai-cloud/ChatMade . Private at last verification; judge access must be confirmed. If private, share with testing@devpost.com. |
| Video | YouTube, publicly visible, maximum three minutes, showing actual Twitch operation AND how Codex was used. Our safer export target is 165 seconds and strictly below 180 including titles/end cards. |
| Description | Root `devpost-submission.md` contains the prepared story and exact custom-field answers. Reconcile its claims with the final video. |
| Main Codex session ID | `01a16cd5-1329-7140-b20c-c69757f52492`, confirmed by the user through `/status`. |
| Deadline | 2 November 2026 22:00 UTC = 2 November 14:00 Pacific Standard Time = **3 November 06:00 Perth**. |

No hosted website or uploaded ZIP is required by the current deliverable fields. The macOS preview is optional help, not a substitute for source. Judging criteria are innovation, potential impact, technological implementation/Codex, and design. Make the viewer contribution and its visible consequence easy to understand.

Existing Devpost draft at last inspection: project `1517312`, slug `chatmate-lv56od`, displayed name ChatMate, empty description, no video and no submitted timestamp. Do not create a duplicate project. Intended project name is ChatMade; any draft rename/save must be deliberate. No upload or final submission has been performed here.

## 3. What already exists

Workspace: `/Users/junwei.lai/Projects/Agent/ChatMade`. Automation commit `416580e` is pushed to main. Further handoff documents may be newer. Run `git status` before editing; preserve unrelated changes.

| Artifact | Exact location / status |
| --- | --- |
| Completed sample MP4 | `release/video/capture-sample-2026-11-02T04-12-37-074Z/walkthrough-1080p-silent.mp4` — 1920×1080, silent, 42.533333 seconds. Full decode and nine-frame visual review passed. Clearly labelled SAMPLE MODE. |
| Sample raw clips and edit evidence | Same folder: `raw/`, `capture.json`, `edit.json`, `result-summary.json`, `result.png`, `result-export.png`, `review-frames.jpg`. Manifest maps page videos and beat times. |
| Completed sample round | `1cf0e87a-e411-426e-99ec-de974a4d3203`; CAUGHT after 19.45 game seconds, one rescue from three simulated participants. |
| Failed automated live take | `release/video/capture-twitch-2026-11-02T04-17-04-112Z/capture.json`: `complete:false`, empty videos and markers. Authorization succeeded, but chat-readiness selector timed out before recording. **No live footage exists from this take.** |
| Earlier real Twitch evidence | `docs/LIVE_TEST_2026-11-02.md`, `docs/submission-assets/first-live-result.png`. One broadcaster account in `jwlaicloud`, threshold 1, five accepted commands, one rescue, CAUGHT at 13.3 seconds, PNG verified. This is a separate round, not video footage. |
| Architecture | `docs/ARCHITECTURE.md`, `docs/submission-assets/architecture.svg`. |
| Submission story and field answers | `devpost-submission.md`. |
| Judge setup | `docs/JUDGE_TESTING.md`. Sample path requires no Twitch login. |

Generated videos under ignored `release/` are local only: a fresh clone will not contain them. Transfer that specific capture folder to another machine if needed. Do not transfer `data/`, browser profiles, OAuth credentials or the private launcher.

## 4. Operator rules

1. Capture real application actions. Never fabricate Twitch messages, viewer identities, successful rescues, outcomes, test results or Codex conversations. A diagram/title card may explain architecture; it must not impersonate a live interaction.
2. Label sample footage continuously. Label threshold-1 live footage **“Real Twitch test · one account · rescue threshold 1”**. It does not prove three-viewer cooperation.
3. Keep commands, channel, credits and result from the same round together. If clips span rounds, label the transition. Never pair the earlier live PNG with the sample round as if it were the same result.
4. Record complete source actions, then edit waiting time. Mark time compression where needed. Keep the vote tally, host approval and rescue consequence readable.
5. Keep authentication outside recording. Never request or capture a Client Secret, access/refresh token, device code, private host key, launcher contents, unrelated tabs or private chats. Public Client ID is safe metadata: `ajyhqrrpm84ac5eechmqblg9p98yu5`.
6. Use only authorized browser/app access. Previous browser policy blocked local launcher navigation and extension controls. Do not bypass through CDP, another automation surface or a user Chrome profile. New disposable test servers may create their own random host key, as the capture script does.
7. The normal source server used port 4317 and had memory-only Twitch authorization. Check whether it is still running; do not restart it casually. Restarting loses authorization. Do not read its private key to automate recording.
8. Do not publish the video, change repository visibility, invite judges, accept legal declarations or submit the project merely because this handoff exists. Prepare and review artifacts first; obtain authorization for those external actions.
9. Preserve raw takes and incomplete manifests. Do not overwrite the verified sample or relabel a failed take as success. Do not commit generated video or credentials.
10. Do not add runtime generation or new gameplay to finish the video. Investigate failures honestly and keep feature claims within verified behavior.

## 5. Script capture route

Prerequisites: Node 22.12+, npm, Google Chrome, `ffmpeg` and `ffprobe` on PATH. Commands are run from the workspace:

```sh
cd /Users/junwei.lai/Projects/Agent/ChatMade
npm ci
npx playwright install ffmpeg
npm run video:sample
```

`scripts/capture-demo.mjs` starts an isolated server on a dynamic port with a temporary data directory and a fresh random key. It drives the real UI, records host/broadcast pages at 1920×1080 and closes browser contexts to finalize WebMs. It records markers and real result files. `scripts/render-demo.mjs` edits completed takes into a silent MP4; incomplete captures are refused. No narration or Codex footage is added automatically.

Sample capture is working. The following command is **implemented but not yet successful end to end**:

```sh
npm run video:live
```

### Live blocker to fix before retry

The live script authorized the streamer, then waited ten minutes for:

```js
chat.getByRole('button', { name: 'ChatBadgeCarousel', exact: true }).waitFor(...)
```

That selector never became visible. Do not assert that the user failed login: the readiness assumption itself is unverified. Replace it with observed, reliable chat readiness and a short, clear timeout/status. Inspect the actual chat UI in the newly authorized browser. Keep all login outside recorded contexts. Never bypass Twitch login or read existing-profile cookies. Revalidate sending a real message and receiving it through EventSub before a full take.

The live script uses an isolated browser, so it cannot inherit the user's usual Twitch sign-in. This extra login is a recording prerequisite, not normal product onboarding. Explain this once and avoid repeated unclear authorization prompts.

### Lower-friction alternative: add a manual-chat capture mode

If isolated chat login remains troublesome, adapt the capture script to record only its own host/broadcast pages while the user sends commands in their normal signed-in Twitch browser. This mode **does not exist yet**; implement it explicitly rather than running undocumented flags. Keep the same real EventSub path. Prompt before each phase, wait for actual suggestions/vote/rescue in server state, then advance. Do not inject sample messages into live mode. Capture a separate clean Twitch-chat clip with the user's chosen recording method if needed, and verify it belongs to the same round. If chat footage cannot be captured, retain clear live-mode/channel indicators and real observed effects; never manufacture a chat panel.

### Manual sequence for either live route

1. Connect the streamer's channel before recording. In lobby select Live Twitch chat, threshold 1 for a one-account test, Apply settings. Three real viewers can instead use default threshold 3.
2. Start experiment. During collection send these three messages separately in ordinary Twitch chat:

```text
!body Jelly knight
!power Charging hugs
!weakness Rubber ducks
```

3. Confirm all three arrived in the host queue. Approve each, then Build recipes. If time is short, use +15 seconds during collection; do not fake a received suggestion.
4. Send `!vote 1` during SELECT. Show the tally. Close voting; show the explicit approval gate; Approve selected recipe.
5. Show reveal, original art and credits. Enter arena. Focus the arena and use WASD/arrows; record actual movement.
6. Send `!help` during play. Threshold 1 needs one account; threshold 3 needs three different accounts within 15 seconds. Record the visible rescue effect and count.
7. Let the real outcome occur, whether SURVIVED or CAUGHT. Record result, local save and PNG export. Do not guarantee a 60-second survival take.

Idle keepalive timeouts/recovery remain unresolved. If messages fail, preserve logs without credentials, investigate and retake. Do not hide failed delivery behind a success narration. Three-viewer, controlled reconnect, OBS and another-Mac onboarding remain unverified.

## 6. Final timeline and narration

Use `docs/DEMO_SCRIPT.md` for the 165-second shot table and `docs/VIDEO_NARRATION.md` for the clean read. Record separate sources rather than one fragile continuous take:

| Final window | Source and required proof |
| --- | --- |
| 0:00–0:10 | Hook and actual arena/result glimpse. |
| 0:10–0:25 | Connected channel and live-mode setup; authorization excluded. Only show OBS if actually tested. |
| 0:25–0:50 | Real suggestions and matching moderation queue. |
| 0:50–1:10 | Actual vote, mechanic mapping and host approval. |
| 1:10–1:20 | Reveal and contributor credits; original-art label. |
| 1:20–1:45 | Actual movement, `!help` and rescue consequence; one-account label if applicable. |
| 1:45–1:55 | Actual outcome and PNG. |
| 1:55–2:20 | Actual Codex development evidence and verified tests. |
| 2:20–2:35 | Delivered architecture and honest proof/limits card. |
| 2:35–2:45 | Closing result/title and readable repository URL. |

165 seconds is an editorial target, not a minimum or existing capture. Shorter is acceptable if both Twitch and Codex requirements are visibly met. Do not stretch the 42-second sample into a purported live demo.

### Codex evidence source

The owner can show the main Codex chat around an actual design/implementation/debug exchange; avoid unrelated history. `docs/CONTRIBUTIONS.md` records what happened. A concrete code example is `tests/arena.test.ts`: attack warnings remain visible during slow/soften rescue and disappear during stun. Show the actual corresponding renderer/diff, plus a fresh `npm test` result if narrating a current pass count. Last recorded suite result was 28 passing tests on 2 November. Do not present a session ID card alone as build/debug footage, or fake a recreated assistant exchange. If assistant access to the Codex app is denied, have the owner capture this segment; do not bypass app restrictions.

### Voice and captions

The user can record the narration. Alternatively use an authorized OpenAI or Google Cloud/Gemini speech service with the user's own configured access; no provider, spend cap or generated voice has been finalized. Do not ask for secrets in chat. Keep voice consistent and natural, avoid machine-like macOS fallback. Read the narration against the actual cut; remove claims whose shot was not captured. Add captions and a short limitations card. Use original or permitted audio only.

## 7. Edit, verify and deliver

Re-render an existing completed manifest only after preserving/renaming its existing MP4; renderer deliberately refuses overwrite:

```sh
node scripts/render-demo.mjs /absolute/path/to/capture.json
```

The current renderer uses tail-derived page offsets and fixed cuts. Review synchronization after changes or slow context shutdown; do not assume exact chat/host alignment. The final multi-source assembly still needs an editor or an additional script: current renderer produces only the gameplay walkthrough. Normalize clips to 1920×1080, 30 fps and matching pixel/audio formats before concatenating. Keep final title/end cards inside the runtime budget. Do not use audio truncation to conceal missing beats.

Run these checks against the final file, not the sample:

```sh
ffprobe -v error -show_entries format=duration:stream=codec_type,width,height -of json /absolute/path/to/chatmade-final.mp4
ffmpeg -v error -i /absolute/path/to/chatmade-final.mp4 -f null -
```

Watch the entire final video with sound, then muted. Check readable commands/credits, accurate captions, real Twitch effects, visible Codex work, clean audio, no credentials, no unrelated private material and a measured duration below 180 seconds. Sample representative frames at 0:05, 0:30, 1:00, 1:25, 1:50, 2:05 and 2:35 when present. Actual export settings are not measured app FPS.

Deliver to the owner:

- Final MP4 and measured duration; raw source paths and edit manifest.
- Narration audio/script and captions; final timestamp-to-evidence map.
- Public YouTube URL only after authorized upload, with signed-out playback checked.
- Updated `devpost-submission.md` matching the actual delivered build/video.
- Remaining blockers and explicit NOT SHOWN beats; no silent claims of completion.

## 8. Final submission checklist

- [ ] Actual Twitch operation and Codex development shown in final video.
- [ ] MP4 decoded, reviewed, below 180 seconds including all cards.
- [ ] Authorized YouTube upload is Public and signed-out playback works.
- [ ] Private repository judge access confirmed, or owner explicitly approves another visibility choice.
- [ ] Description and custom answers copied from current root draft; project name reconciled.
- [ ] Session ID copied exactly; Individual / A lot / Very likely match supplied answers.
- [ ] Country of residence supplied by owner; do not infer from Perth timezone.
- [ ] Owner confirms age, eligible jurisdiction, and nonemployee declarations after reviewing exact terms.
- [ ] Owner authorizes final submission; verify returned submission status and timestamp afterward.

Nothing in this document marks the project submitted. Do not substitute a prepared draft, an aggregate “submitted projects” list or a successful video export for the actual submission confirmation.

## 9. Copy-paste brief for the next assistant

> Continue ChatMade video/submission preparation in `/Users/junwei.lai/Projects/Agent/ChatMade`. Read `docs/VIDEO_HANDOFF.md`, `docs/DEMO_SCRIPT.md`, `docs/VIDEO_NARRATION.md`, `devpost-submission.md` and local instructions. Preserve main build session ID `01a16cd5-1329-7140-b20c-c69757f52492`. A verified 42.53-second silent SAMPLE clip exists; NO completed live Twitch capture or final YouTube video exists. Fix the brittle `ChatBadgeCarousel` readiness wait in `scripts/capture-demo.mjs`, or add an explicit manual-chat mode using ordinary signed-in Twitch chat while recording isolated app pages. Do not read the user's Chrome profile or existing host key; respect blocked browser/app surfaces. Record actual round actions, actual Codex work, then assemble a truthful roughly 165-second video strictly below 180 seconds. Use original fallback art claims and one-account labels accurately. Preserve raw takes, check decode/runtime/frames/audio and return exact artifact paths plus remaining blockers. Prepare all external changes for review; do not publish, invite, agree to terms or finally submit without authorization. Deadline is 3 November 2026 06:00 Perth. Do not add new gameplay features to finish this task.
