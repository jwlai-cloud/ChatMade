# ChatMade — narration read

Draft voice track for the 165-second storyboard in DEMO_SCRIPT.md. Read at a natural pace, leaving space for visible actions. These are planned lines, not claims that the corresponding footage exists. Replace or omit any line whose evidence is absent. For a threshold-1 take retain the one-account sentence. Do not describe sample footage as Twitch footage.

## 0:00–0:10 — hook

ChatMade: chat builds the monster. The streamer survives it. Viewers invent the threat, then help save the person playing.

## 0:10–0:25 — setup

ChatMade runs locally and connects to the streamer's own Twitch channel. Viewers stay in ordinary Twitch chat. A separate read-only broadcast page keeps the game display apart from the host controls.

## 0:25–0:50 — contributions

Here, chat suggests a body, a power and a weakness. These messages arrive through Twitch EventSub. The streamer reviews each suggestion before it reaches the broadcast. Chat's creative text maps to a small set of supported mechanics, so the encounter stays predictable and playable.

## 0:50–1:10 — vote and approval

Chat votes on the approved recipes. The host sees the attack and rescue effect before approving the winner. Voting recommends a choice; the streamer keeps control over what goes on screen.

## 1:10–1:20 — reveal

Selected contributors receive credit. This prototype uses original fallback artwork. It does not generate a new image for each creature.

## 1:20–1:45 — play and rescue

The streamer dodges with three hearts. Viewers send help to activate the creature's weakness. The normal setting needs three different viewers within fifteen seconds. This recorded smoke test uses one account and the one-viewer setting. Watch the rescue affect the encounter.

## 1:45–1:55 — actual result

The round ends with the real outcome, saves locally, and offers a result PNG with optional contributor names.

## 1:55–2:20 — Codex build evidence

I used Codex to challenge the scope, build the game and Twitch integration, and debug concrete failures. One fix preserved attack warnings during rescue effects. Its regression test checks the rescue types. The last verified suite had twenty-eight passing tests, including mocked Twitch integration cases.

## 2:20–2:35 — architecture and limits

Node owns the game state. EventSub supplies chat, and browsers render the controls and broadcast view. A real-channel round completed the loop. Idle keepalive timeouts remain under investigation.

## 2:35–2:45 — close

ChatMade turns viewers' ideas into a short shared challenge. Chat builds the monster. The streamer survives it.

Hold repository URL on screen: `github.com/jwlai-cloud/ChatMade`.

## Recording notes

- If three real viewers are filmed, replace the one-account sentence with an accurate description of that observed take; do not invent participation.
- If the latest test run changes the count, update both voice and submission draft together.
- Say CAUGHT or SURVIVED only if it matches the shown round. The neutral result line above works for either.
- If keepalive behavior is fixed and verified later, update the limitation with precise evidence; do not remove it on speculation.
- Target natural clarity, not an exact word rate. Trim narration and optional architecture time before speeding up speech. Leave the actual vote, approval and rescue readable.
