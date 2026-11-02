# Recorded Codex build evidence segment

Completed 2 November 2026. This is a real recording of a purpose-built repository evidence viewer, not a recording of the Codex app or a recreated conversation. It explains documented Codex work using actual repository source and a fresh test execution. Do not relabel it as native Codex chat footage.

## Ready-to-use artifact

`release/video/codex-build-2026-11-02T05-04-24-948Z/codex-build-evidence-1080p-silent.mp4`

- 1920×1080, H.264, 30 fps, silent, **33.766667 seconds**.
- Full ffmpeg decode passed. All three scene screenshots were inspected; initial take was replaced after its full test source clipped below the viewport.
- Fresh `npm test` was launched by clicking the viewer's button during recording: **28 passed, zero failed**, exit 0. Output is streamed from the actual child process, not typed or replayed.
- Checkout recorded: `817fe99`; regression source commit: `f8d0dec`.
- Raw WebM, `source-evidence.json`, complete `npm-test.txt`, `capture.json`, `edit.json` and three screenshots are in the same folder.

## Content and assembly

1. Documented contribution: scope, implementation, debugging and the recorded rescue-warning fix from CONTRIBUTIONS.md.
2. Actual `src/arena.ts:10` guard plus line-numbered excerpts from `tests/arena.test.ts`. Omitted setup is labelled; full source remains in the evidence JSON and repository.
3. Fresh suite execution and readable 28/28 summary. Persistent footer identifies the repository viewer. Mocked Twitch limits remain visible.

Use this segment with the separately captured real application/Twitch footage. It replaces the build-evidence window of the storyboard; it does not replace the Twitch demonstration. At 33.77 seconds it is about nine seconds longer than the original 25-second slot. Shorten optional intro/architecture holds, or trim verified idle time, to keep the final film below 180 seconds. A 165-second final target remains optional, not a required exact duration.

Suggested voice read:

> I used Codex to challenge the scope, build the game and Twitch connection, and debug concrete failures. This documented fix kept attack warnings visible during slow and soften rescue effects. Here is the actual renderer condition and the regression test covering all three rescue types. Now the real test suite runs against this checkout: twenty-eight pass. Twitch protocol tests use mocks; live Twitch evidence is shown separately.

If native Codex chat footage is desired, the owner must capture that permitted app surface separately. Earlier assistant access to the Codex application was denied; this viewer does not bypass or access it.

## Reproduce

From the full project checkout, with npm dependencies, Google Chrome, Playwright recording helper, ffmpeg and ffprobe installed:

```sh
node scripts/capture-build-evidence.mjs
```

The script reads only fixed repository files and git metadata, starts a temporary loopback evidence viewer, records an isolated browser, and executes only the fixed `npm test` command. It does not use the running game server, Twitch login, host key, personal Chrome profile or chat contents. Each take goes into a new timestamped folder. Live test failures must remain failures; do not edit their output into a pass.
