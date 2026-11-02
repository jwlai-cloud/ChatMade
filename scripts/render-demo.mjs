import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const run = promisify(execFile);
export async function renderDemo(manifestPath) {
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  if (!manifest.complete) throw new Error('Refusing to present an incomplete capture as a completed walkthrough.');
  const folder = dirname(resolve(manifestPath));
  const output = resolve(folder, 'walkthrough-1080p-silent.mp4');
  const times = Object.fromEntries(manifest.markers.map(marker => [marker.beat, marker.seconds]));
  const files = [manifest.videos.host, manifest.videos.broadcast, ...(manifest.videos.chat ? [manifest.videos.chat] : [])];
  const durations = await Promise.all(files.map(async file => Number((await run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', file])).stdout.trim())));
  // Videos start when each page is created; the common beat clock starts after
  // both are loaded. Derive the leading load time from the recorded tail hold.
  const offsets = durations.map(duration => Math.max(0, duration - times.export - 1.5));
  const cuts = [
    { input: 1, start: 0, end: times.collect, beat: 'title and mode' },
    { input: 0, start: times.collect, end: times.recipes, beat: 'actual suggestion moderation' },
    { input: 0, start: times.recipes, end: times.reveal, beat: 'actual vote and host approval' },
    { input: 1, start: times.reveal, end: times.play, beat: 'fallback reveal' },
    { input: 1, start: times.play, end: times.result, beat: 'actual gameplay and rescue' },
    { input: 1, start: times.result, end: times.export + 1, beat: 'actual outcome' },
  ];
  if (manifest.live && manifest.videos.chat) cuts.splice(1, 0, { input: 2, start: times.collect, end: Math.min(times.moderated, times.collect + 6), beat: 'real Twitch commands' });
  const duration = cuts.reduce((total, cut) => total + cut.end - cut.start, 0);
  if (!Number.isFinite(duration) || duration <= 0 || duration >= 175) throw new Error(`Planned runtime ${duration}s leaves insufficient margin below 3 minutes. Adjust the cut list; do not truncate proof blindly.`);
  const parts = cuts.map((cut, i) => `[${cut.input}:v]trim=start=${(cut.start + offsets[cut.input]).toFixed(3)}:end=${(cut.end + offsets[cut.input]).toFixed(3)},setpts=PTS-STARTPTS,fps=30,scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1[v${i}]`);
  const label = manifest.live ? 'REAL TWITCH TEST - one account, rescue threshold 1' : 'SAMPLE MODE - three simulated participants';
  parts.push(cuts.map((_, i) => `[v${i}]`).join('') + `concat=n=${cuts.length}:v=1:a=0,drawtext=fontfile=/System/Library/Fonts/Supplemental/Arial.ttf:text='${label}':fontcolor=white:fontsize=22:box=1:boxcolor=black@0.85:boxborderw=9:x=24:y=18,format=yuv420p[out]`);
  await run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-n', ...files.flatMap(file => ['-i', file]), '-filter_complex', parts.join(';'), '-map', '[out]', '-an', '-c:v', 'libx264', '-preset', 'fast', '-crf', '20', '-movflags', '+faststart', output], { maxBuffer: 8 * 1024 * 1024 });
  const measured = Number((await run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', output])).stdout.trim());
  if (measured >= 180 || measured <= 0) throw new Error(`Final duration check failed: ${measured}s.`);
  await writeFile(resolve(folder, 'edit.json'), JSON.stringify({ output, duration: measured, silent: true, mode: manifest.live ? 'real-twitch' : 'sample-simulation', cuts, note: 'Straight cuts of actual UI recording; no synthetic gameplay frames. This walkthrough still needs Codex build footage and narration for the final submission.' }, null, 2));
  console.log(`Edited video: ${output}\nVerified duration: ${measured}s (silent).`);
  return output;
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  if (!process.argv[2]) throw new Error('Usage: node scripts/render-demo.mjs path/to/capture.json');
  await renderDemo(resolve(process.argv[2]));
}
