# Submission review — 2 November 2026

Verdict: **the current Devpost entry is not ready for judging**. Its empty description and absent video hide the working product. The local build fits the audience-participation brief, but repeated idle reconnects and limited audience evidence weaken readiness. Complete the public Twitch/Codex video and judge access before final submission; do not spend the remaining time adding runtime generation.

This is a pre-submission artifact review, not an official score or a placement prediction. The Devpost Hackathons plugin was authenticated and read the live rules, requirements, criteria, dates and existing project. The standalone hackathon-judge and hackathon-submission skills shaped the review/draft. The guided prepare-submission workflow has no local state/rules-acknowledgement file; it has not been marked complete and no agreement was fabricated.

## Live Devpost evidence

- Project ID 1517312, slug `chatmate-lv56od`, name `ChatMate`, tagline `ChatMate`.
- `description: ""`, `video_url: null`, `state: "submission_draft"`, `published_at: null`, `submitted_at: null`.
- User is registered for Codex x TwitchCon. The aggregate list's `submitted` relationship is **not** treated as successful submission: the detailed project has no submitted timestamp.
- No published page/video exists to inspect for frames, captions, duration or beat coverage. Final public-artifact review must wait for those artifacts. Draft/storyboard material is not video evidence.
- GitHub plugin confirmed repository `jwlai-cloud/ChatMade` is private. Judge access was not established by that check.

## Official requirements and compliance

Source: live plugin responses on 2 November; [event](https://twitchcon-codex.devpost.com/) and [rules](https://twitchcon-codex.devpost.com/rules). Quotes below are verbatim excerpts, not legal advice or a substitute for the full rules.

| Requirement / exact excerpt | Current evidence | Remaining action |
| --- | --- | --- |
| “The Project must be an interactive experience that connects to Twitch” | First real-channel smoke test delivered ideas, vote and rescue through Twitch | Show that path in the video |
| “newly created during the Submission Period” | Git history begins 24 October; implementation commits 25 October | Entrant confirms originality and ownership; history alone does not certify eligibility |
| “capable of being successfully installed and running consistently” | Fresh source dependency install/build passed; packaged runtime smoke passed | Investigate repeated idle keepalive timeouts; clean-machine GUI/OBS still untested |
| “all source code, assets, and instructions needed for the project to run” | Source, lockfile, original SVG and launch instructions in repo | Put final docs in judge-accessible revision |
| “shared with testing@devpost.com” (private repo) | Repo private; judge sharing unverified | Confirm accepted access before final submission |
| “text description” and “how you used Codex” | Local draft prepared; remote description empty | Save reviewed copy to existing entry |
| “Codex session ID” | User confirmed `01a16cd5-1329-7140-b20c-c69757f52492` using `/status` | Use this exact ID in field 29289 |
| “less than three (3) minutes” | 165-second shot list only; no recording | Record and verify final runtime |
| “footage that shows the Project functioning on Twitch” | Live test observed, but not recorded as a video | Record actual Twitch and app interaction |
| “footage that shows how the project was built with Codex” | Main chat, commits, tests and documented fixes available | Include readable build/debug footage |
| “made publicly visible on YouTube” | `video_url: null` | Upload public video and verify playable without sign-in |
| “All Submission materials must be in English” | Draft and docs English | Check final captions/narration |

No hosted website, ZIP upload or architecture diagram is required by the live deliverable flags. Architecture is a supporting explanation. Three-viewer and OBS checks are our product-validation gates; do not mislabel them as custom official form requirements.

Deadline from live key-dates API: `2026-11-02T22:00:00Z`, **3 November 2026, 06:00 Perth**. The overview FAQ includes a conflicting UTC conversion, so use the structured timestamp, consistent with 14:00 PST. Formal rules and structured API also disagree on judging dates; do not pick an earlier end to withdraw access. Keep judging materials available through the later formal end (15 November) and check with organisers if needed.

## Rubric and provisional build assessment

Official scale: 5; four equally weighted criteria; no tracks returned. These are local build-review estimates, not scores for the empty remote draft or the unrecorded video.

| Official criterion and question | Estimate / 5 | Evidence and weakness |
| --- | --- | --- |
| Innovation/Idea — “How creative and novel is the concept and does the project differ from existing concepts?” | 3 | Pitch: “Chat builds the monster. The streamer survives it.” Creation plus rescue gives a clear loop. Voting and viewer attribution already exist elsewhere; same fallback artwork and potentially identical recipes limit visible novelty. No exhaustive competitor audit. |
| Potential Impact — “How useful or entertaining is it for streamers and their communities?” | 2 | Actual result: “0 hearts · 1 rescues”, five accepted commands. However one broadcaster account, threshold 1, no independent viewers or streamer feedback. No retention/engagement improvement established. |
| Technological implementation — “How well is it built, and how well does it use Codex?” | 3 | Fresh run: “tests 28”, “pass 28”, “fail 0”; real Twitch-to-result path, private host/broadcast boundary, package smoke. Repeated “Twitch keepalive timed out. Reconnecting…” remains an unresolved live reliability finding. |
| Design — “Is it easy to use and fun to watch?” | 3 | Real host flow showed moderation, “SELECTED · AWAITING APPROVAL”, fallback reveal, keyboard arena and Saved locally; exported PNG inspected. No OBS capture, measured performance, clean-Mac onboarding or independent usability observation. |

## Highest-value fixes

| Priority | Action | Why |
| --- | --- | --- |
| Before submission | Record a public YouTube demo under 3 minutes, showing real Twitch and Codex | Missing official deliverable; differentiator currently invisible to judges |
| Before submission | Verify judge repository access and save accurate ChatMade description/answers | Current draft is empty and repo private |
| Before demo | Investigate idle keepalive timeouts; observe stable reception/recovery | Visible repeated offline state undermines consistent operation |
| Before final form | Confirm country, declarations and final submission agreement | Required personal/legal answers cannot be guessed |
| Strongly recommended | Run three-viewer rescue and actual OBS capture | Supplies impact/design evidence that one-account test cannot establish |
| If time permits | Another streamer on a clean Mac; clearer varied contributions | Improves adoption evidence and demonstrates bounded recipe differences |
| Later | New creature art, runtime generation, other platform installers | Useful future work; adds cost/scope before core proof |

## Prepared artifacts

- `devpost-submission.md`: story, official custom-field answers and honest limitations.
- `docs/JUDGE_TESTING.md`: source/sample/live test paths and public publisher Client ID.
- `docs/ARCHITECTURE.md` plus rendered SVG: delivered components and interaction sequence.
- `docs/DEMO_SCRIPT.md`: 165-second shot list and transcript plan; not a completed video.
- `docs/submission-assets/first-live-result.png`: exported real test result, not footage of a broadcast.

No Devpost write, judge invitation, visibility change, video upload or final submission was performed during preparation.
