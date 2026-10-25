# Design plan
## Product positioning
ChatMade means “made by chat.” Lead with: **Chat builds the monster. The streamer survives it.** This is an audience-participation game played through Twitch chat and watched on stream. The primary interface is the creature reveal and survival arena; the host desk is a production control surface, not the viewer experience.

Fit to the [official hackathon brief](https://twitchcon-codex.devpost.com/), checked 25 October 2026:
- Audience participation: viewer suggestions, recipe voting and collective rescue change the streamer's live encounter. This is the primary direction.
- Content enhancements: creature reveals, contributor credits and the OBS broadcast view create a shared on-stream segment.
- Streamer collaboration is not part of the current scope. The brief describes these directions as starting points rather than mandatory categories.

Category fit does not establish submission readiness. The local simulation still needs a working Twitch connection and a recorded live demonstration. Avoid marketing it as a messaging app or presenting simulated input as real audience participation.

## Creative direction
Neon creature laboratory with playful expressive monsters. Midnight #100B24 background, cream #FFF7E8 text, cyan #53E0EC controls, lime #C5F45B specimen accents, coral #FF766E danger. Avoid indiscriminate neon glow. Large rounded display type for names; readable sans serif for instructions. Verify font licensing before shipping.

## Surfaces
Broadcast: 1920x1080 reference, responsive 16:9. Main stage roughly 70%; dossier right 25%; bottom instruction band. Reserve bottom-left webcam region with configurable safe area. No admin controls or credentials on broadcast.
Controller: authenticated local host screen with connection state, suggestions queue, selected recipe, start/pause/skip, rescue threshold, generation status and asset fallback choice.
Player: keyboard-focused arena on host screen; OBS captures broadcast view. Synchronize controller/player/broadcast from one authoritative round state.

## Streamer onboarding
Target reusable companion workflow: open ChatMade → connect the streamer's Twitch account → copy the broadcast URL into an OBS browser source → start a round. Viewers stay in the channel's existing Twitch chat. The connected broadcaster determines the channel; no per-streamer source edits or embedded broadcaster IDs.

Current build exposes developer setup and a manual local host key. These are not the finished onboarding experience. Before release, provide suitable distribution, guided connection and a setup test with a streamer who did not build the app. Retain authenticated host controls and a separate read-only broadcast when simplifying setup. Public hosting and Twitch Extension delivery remain outside the agreed first milestone.

## Screen sequence
Lobby: large incubation tank, clear connect/start state, three example commands.
Collect: specimen cards with readable text, category icon and contributor; rate-limit visual arrivals and queue overflow.
Assemble: three recipe cards assembled from eligible ideas; timer and one-vote instruction. Host approves selection.
Incubate: silhouette, bubbles and ingredient labels; show honest progress state, no fabricated percentage.
Reveal: clear surrounding clutter; open tank; enlarge creature; name stamp; credits and one-line ability description. Short sound accent with mute control.
Encounter: arena and movement prompt, three hearts, 60-second timer, attack telegraphs and labelled help meter. Dossier explains actual supported weakness. Never make readability depend on animation or colour alone.
Result: SURVIVED/CAUGHT stamp, creature art, credited ingredients, seed/round label and export action on controller.

## Example
Sir Wobbleton: jelly knight, magnetic pull visual motif, duck weakness. In MVP map the power to a supported attack explicitly, or choose another supported power; do not promise unimplemented magnet physics. Duck rescue triggers stun. Viewer creativity must affect an actual supported mechanic as well as appearance.

## Motion and access
Idle breathing, squash/stretch and hop transforms on a single image. Telegraph before attacks; screen shake optional. Reduced-motion option replaces dramatic motion with fades; no strobing. Readable at 720p; minimum broadcast instruction target 32px at 1080p. Icons plus words for state. Keyboard-visible focus; pause stops gameplay clock. Distinguish generation fallback visibly on controller and provenance record.

## Demo storyboard (165 seconds)
0–15: problem and promise. 15–45: actual viewers enter ingredients and vote. 45–65: reveal with credits. 65–110: streamer dodges and chat activates rescue. 110–125: result card. 125–150: show meaningful Codex build/debug work. 150–165: explain differentiation and closing shot. Record real integration; label any simulation.

## Review before build
Can a viewer understand the premise in ten seconds? Do credits match actual selection? Does help work with three participants? Is one round fun before AI art? Is the feature distinguishable from existing chat games and Crowd Control? Validate using observation rather than enthusiasm alone.
