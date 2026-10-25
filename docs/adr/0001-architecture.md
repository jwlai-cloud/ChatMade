# ADR 0001 — Local-first bounded generative game
Status: Accepted in part for the deterministic local milestone through ADRs 0002–0004. Twitch and generation details below remain proposed until their milestones are reviewed.
Date: 2026-10-24

## Context
Solo hackathon, short schedule, real Twitch demonstration, generated creature artwork, predictable gameplay and no requirement for public hosting. The user wants an identifiable Codex build session. Provider credentials and hosting are not yet configured.

## Decision
Propose TypeScript throughout, React for controller/layout, Canvas 2D for the arena, and a Node backend for Twitch, generation and authoritative round state. Confirm current framework/API documentation when implementing; this ADR specifies architecture, not package versions. Run locally first with OBS capturing a browser view. Use server-to-browser WebSocket updates and Twitch EventSub WebSocket transport subject to supported subscriptions and current auth requirements.

Backend modules: Twitch adapter, input validator/moderation queue, round state machine, recipe generator, image provider, deterministic game rules and persistence. Keep provider adapters replaceable. OpenAI is a candidate runtime provider, not a hackathon requirement; confirm available model, costs and credentials before live calls.

State machine: LOBBY → COLLECT → SELECT → GENERATE → REVEAL → PLAY → RESULT. Host can pause/resume, abort to lobby or skip generation into fallback. Deadline timers belong to authoritative state, not UI components. Only a host can change phases. Generation callbacks include round ID and are discarded after cancellation or when stale.

CreatureSpec: id, roundId, name, bodyDescription, attack enum, weakness enum, bounded difficulty, selectedContributions[], artPrompt, assetRef, provenance, seed. Reject unknown fields/behaviours and out-of-range values. Prompt inputs are untrusted data. No generated code execution. AI proposes composition; deterministic engine owns physics/outcomes.

Deduplicate Twitch delivery IDs; use stable broadcaster/user IDs for votes. Record accepted inputs and seeds to reproduce bugs. Persist lightweight round records and local assets; SQLite proposed if file persistence becomes fragile. Do not archive raw chat by default. Contributor names are displayed only for voluntarily submitted selected ideas; enable omission in exports.

Auth and isolation: backend owns secrets. Host control endpoints require a local session token and origin checks; broadcast URL is read-only. Loopback binding default. A public deployment needs a separate security/auth review and is deferred.

Generation: one image request per approved recipe; bounded timeout, limited retries, cached result and original fallback art. Controller exposes generation usage and a configurable spend cap. Model output cannot alter arbitrary system settings or game code. Generation latency is measured; no fixed-latency guarantee.

## Alternatives
Public cloud app: easier remote judging but increases deployment/auth work; defer until local loop works.
Full game engine/3D: more animation flexibility but much larger asset and physics scope.
Runtime autonomous code generation: unpredictable, unsafe and untestable within deadline; reject.
Generated video: weak latency/control fit; defer.
Deterministic assets only: retain as fallback and development mode, but primary demonstration should show authentic generation if implemented.

## Consequences
Easy local demonstration and reproducible rules, but installation and OAuth remain judge friction. Provide exact setup, optional clearly-labelled sample mode, and a real Twitch demo recording. Single-image animation limits visual range but preserves polish. Unsupported creative suggestions must be translated honestly.

## Verification
Unit: phase transitions, vote replacement, duplicate events, rescue cooldown, stale generation rejection, schema bounds and seeded outcomes.
Integration: Twitch adapter reconnect, provider timeout/refusal, host permission boundaries.
End to end: three real viewers complete a round; pause/resume and fallback round; record demo capture and keyboard usability.

## Open decisions
1. Cooperative rescue accepted in ADR 0002; fun and viewer motivation still need playtest evidence.
2. Survival accepted in ADR 0002; boss combat remains outside scope.
3. Which runtime provider and spend cap? Unresolved, no live spending authorised by this ADR.
4. Can the app be installed and authenticated by judges easily? Test clean setup.
5. Full competitor audit and creator validation still required.
