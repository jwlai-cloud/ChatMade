# Devpost media upload set

Prepared 2 November 2026. All five images are PNG, below Devpost's 5 MB limit. Upload manually through the project editor; these files have not been uploaded by the assistant.

## Thumbnail

`01-thumbnail.png` — **1200×800, 3:2**. Use **Edit thumbnail** in General info. Designed project cover, using the same original creature SVG as the application; not a screenshot of generated artwork.

## Gallery order and captions

| Order | File | Suggested caption (under 140 characters) |
| --- | --- | --- |
| 1 | `02-live-rescue.png` | Real Twitch test: one account activates rescue while the streamer dodges. Rescue threshold set to 1. |
| 2 | `03-host-approval.png` | Chat votes on recipes; the host must approve the winner. Same original creature art across recipes. |
| 3 | `04-live-result.png` | Actual Twitch-round result PNG: CAUGHT after 15.9 seconds, with one rescue and selected contributor credits. |
| 4 | `05-architecture.png` | Local Node game state, Twitch EventSub chat, private host controls and a read-only broadcast page designed for OBS. |

Gallery files are **1920×1080**. Headers explain the genuine recorded UI; the result image is the real export, and the architecture describes the delivered system. Do not describe this as a three-viewer test, runtime AI art, or verified OBS footage.

Source take: `capture-twitch-2026-11-02T09-10-03-729Z`, round `7f36d5de-a215-451f-b311-c1cfbb51f3a9`, channel `jwlaicloud`. Frame timestamps: rescue 49.7 seconds, host approval 40.3 seconds. The rescue frame omits the recording's empty bottom strip. Composition does not alter game state, usernames, votes, hearts or outcome.

Reproduction script: `scripts/prepare-gallery.mjs`, accepting the verified walkthrough and same-round result PNG as arguments. The script uses real video-frame extraction and browser composition, not synthetic gameplay.
