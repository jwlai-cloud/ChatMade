# Delivered architecture

This describes the current build, not the proposed runtime generation in ADR 0001. Codex helped build/test the application; there is no runtime model or multi-agent service.

![Delivered architecture](submission-assets/architecture.svg)

## Components

| Component | Responsibility | Source |
| --- | --- | --- |
| Twitch adapter | Public device auth, token validation/refresh, EventSub subscription/recovery/deduplication | `server/twitch.ts` |
| Local server | Loopback HTTP/WebSocket, host authentication, origin checks, public/private snapshots, result persistence | `server/index.ts` |
| Game engine | Phase gates, moderation, seeded recipes, votes, physics, rescue and outcomes | `shared/game.ts` |
| Host desk | Setup, approvals, keyboard controls and export | `src/main.tsx`, `src/ConnectionPanel.tsx`, `src/arena.ts` |
| Broadcast view | Read-only rendering for an OBS Browser Source | `/broadcast` |
| Local files | Private launcher/key, public publisher configuration, selected round JSON | ignored `data/` |

## One interaction

```mermaid
sequenceDiagram
    participant V as Viewer
    participant T as Twitch chat / EventSub
    participant A as Local adapter / game
    participant H as Host desk
    participant B as Read-only broadcast
    V->>T: 1. !power Charging hugs
    T->>A: 2. channel.chat.message
    A->>H: 3. Validate, deduplicate, queue privately
    H->>A: 4. Approve suggestion
    A->>B: 5. Approved content only
    V->>T: 6. !vote 1
    T->>A: 7. Latest vote per user
    A->>H: 8. Winner awaits host approval
    H->>A: 9. Approve recipe, reveal, start arena
    V->>T: 10. !help
    T->>A: 11. Unique viewers trigger bounded rescue
    A->>B: 12. Arena and outcome updates
```

Host controls require an authenticated local WebSocket. Broadcast clients receive no host-only moderation queue or device authorisation instructions. Access/refresh/device tokens stay backend-only. The game is authoritative at fixed simulation steps; the browser renders server snapshots. Round JSON saves selected credits and outcome rather than raw chat. Export PNG is generated locally by Canvas.

## Verification boundary

The 28-test suite covers deterministic gameplay and mocked service/protocol paths. A real one-account Twitch round additionally verified delivery through to PNG. Repeated idle keepalive timeouts remain open. Intended OBS capture, three-viewer usability and clean-machine onboarding still need observation. No FPS or latency result is claimed.
