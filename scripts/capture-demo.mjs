// Record actual browser actions against an isolated, real ChatMade server.
// Sample mode is explicitly simulated; --live uses real Twitch after human login.
import { chromium } from 'playwright';
import { randomBytes } from 'node:crypto';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createApp } from '../build/server/index.js';
import { renderDemo } from './render-demo.mjs';

const live = process.argv.includes('--live');
const output = resolve('release/video', `capture-${live ? 'twitch' : 'sample'}-${new Date().toISOString().replace(/[:.]/g, '-')}`);
await mkdir(output, { recursive: true });
const dataDir = await mkdtemp(join(tmpdir(), 'chatmade-capture-'));
const token = randomBytes(32).toString('hex');
const app = await createApp({ port: 0, production: true, dataDir, token, twitchClientId: live ? 'ajyhqrrpm84ac5eechmqblg9p98yu5' : '' });
let browser, controllerContext, recordingContext;
const markers = [], videos = {};
let start = 0, driveError, recordHost;
const hold = ms => new Promise(ok => setTimeout(ok, ms));
const state = async () => (await fetch(`${app.origin}/api/state`)).json();
async function until(check, label, timeout = 15000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) { const s = await state(); if (check(s)) return s; await hold(100); }
  throw new Error(`Timed out: ${label}`);
}
function mark(beat, extra = {}) {
  const entry = { beat, seconds: Number(((Date.now() - start) / 1000).toFixed(3)), ...extra };
  markers.push(entry); console.log(`Capture: ${beat}`);
}
try {
  browser = await chromium.launch({ channel: 'chrome', headless: !live });
  controllerContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const controller = await controllerContext.newPage();
  // New random key authenticates this disposable test server, not a user browser.
  await controller.goto(`${app.origin}/host#host-key=${token}`);
  await controller.getByText('UNLOCKED', { exact: true }).waitFor();
  let chat;
  if (live) {
    await controller.getByRole('button', { name: 'Connect Twitch', exact: false }).click();
    console.log('HUMAN STEP: authorise Twitch in the new host window. No login/auth material is recorded.');
    const connected = await until(s => s.twitch?.status === 'connected', 'human Twitch authorisation', 10 * 60 * 1000);
    chat = await controllerContext.newPage();
    await chat.goto(`https://www.twitch.tv/popout/${connected.twitch.channel}/chat`);
    console.log('HUMAN STEP: sign in to Twitch chat in the new browser if prompted. Keep this browser open.');
    await chat.getByRole('textbox', { name: 'Send a message' }).waitFor({ timeout: 10 * 60 * 1000 });
    await chat.getByRole('button', { name: 'ChatBadgeCarousel', exact: true }).waitFor({ timeout: 10 * 60 * 1000 });
    await controller.getByLabel('Round input').selectOption('twitch');
    await controller.getByLabel('Rescue threshold').selectOption('1');
    await controller.getByRole('button', { name: 'Apply settings', exact: true }).click();
  }
  recordingContext = await browser.newContext({
    viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1,
    // Carry this run's human-created ephemeral login into its recording context.
    // Never read the user's existing Chrome profile or save storage state to disk.
    storageState: live ? await controllerContext.storageState() : undefined,
    recordVideo: { dir: join(output, 'raw'), size: { width: 1920, height: 1080 } },
  });
  const host = await recordingContext.newPage();
  recordHost = host;
  await host.goto(`${app.origin}/host#host-key=${token}`);
  await host.getByText('UNLOCKED', { exact: true }).waitFor();
  const broadcast = await recordingContext.newPage();
  await broadcast.goto(`${app.origin}/broadcast`);
  await broadcast.evaluate(() => document.fonts.ready);
  videos.host = await host.video().path(); videos.broadcast = await broadcast.video().path();
  if (live) {
    const channel = (await state()).twitch.channel;
    chat = await recordingContext.newPage();
    await chat.goto(`https://www.twitch.tv/popout/${channel}/chat`);
    await chat.getByRole('textbox', { name: 'Send a message' }).waitFor();
    videos.chat = await chat.video().path();
  }
  // Both recorded pages are created only after human login/authorisation finishes.
  start = Date.now(); mark('lobby', { mode: live ? 'twitch' : 'sample' }); await hold(2200);
  await host.getByRole('button', { name: 'Start experiment', exact: false }).click();
  await until(s => s.phase === 'COLLECT', 'collection'); mark('collect');
  if (!live) {
    await host.getByRole('button', { name: 'Load sample ideas', exact: true }).click();
  } else {
    for (const text of ['!body Jelly knight', '!power Charging hugs', '!weakness Rubber ducks']) {
      await chat.getByRole('textbox', { name: 'Send a message' }).fill(text);
      await chat.getByRole('textbox', { name: 'Send a message' }).press('Enter');
      await hold(700);
    }
  }
  await host.locator('.queue-row').first().waitFor(); await hold(1800);
  for (const row of await host.locator('.queue-row').all()) { await row.getByRole('button', { name: 'Approve', exact: true }).click(); await hold(200); }
  mark('moderated'); await hold(1500);
  await host.getByRole('button', { name: 'Build recipes', exact: false }).click();
  await until(s => s.phase === 'SELECT', 'voting'); mark('recipes');
  if (live) {
    await chat.getByRole('textbox', { name: 'Send a message' }).fill('!vote 1');
    await chat.getByRole('textbox', { name: 'Send a message' }).press('Enter');
    await until(s => s.votes['0'] === 1, 'real vote');
  } else {
    await host.getByLabel('Sample command', { exact: true }).fill('!vote 1');
    await host.getByRole('button', { name: 'Send sample', exact: true }).click();
  }
  mark('vote_received'); await hold(2200);
  await host.getByRole('button', { name: 'Close voting', exact: true }).click();
  await until(s => s.remaining === 0 && s.phase === 'SELECT', 'approval gate');
  await host.locator('.recipes').scrollIntoViewIfNeeded(); mark('approval_gate'); await hold(2200);
  await host.getByRole('button', { name: 'Approve selected recipe', exact: false }).click();
  await until(s => s.phase === 'REVEAL', 'fallback reveal');
  await host.locator('.stage').scrollIntoViewIfNeeded(); mark('reveal'); await hold(3000);
  await host.getByRole('button', { name: 'Enter arena', exact: false }).click();
  await until(s => s.phase === 'PLAY', 'arena'); await host.locator('canvas').scrollIntoViewIfNeeded(); mark('play');
  if (live) {
    await chat.getByRole('textbox', { name: 'Send a message' }).fill('!help');
    await chat.getByRole('textbox', { name: 'Send a message' }).press('Enter');
  } else {
    await host.getByLabel('Sample command', { exact: true }).fill('!help');
    const participants = host.locator('.sample-form select');
    await participants.waitFor();
    const choices = await participants.locator('option').all();
    if (choices.length !== 3) throw new Error('Expected three labelled sample participants.');
    for (const choice of choices) {
      const user = await choice.getAttribute('value');
      await participants.selectOption(user);
      await host.getByRole('button', { name: 'Send sample', exact: true }).click();
      await until(() => app.game.state.helpUsed[user] !== undefined, `help from ${user}`, 3000);
    }
  }
  await until(s => s.rescues >= 1, 'rescue'); mark('rescue');
  await host.locator('canvas').scrollIntoViewIfNeeded(); await host.locator('canvas').focus();
  for (const key of ['ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown']) {
    if ((await state()).phase !== 'PLAY') break;
    await host.keyboard.down(key); await hold(1800); await host.keyboard.up(key);
  }
  mark('movement');
  const result = await until(s => s.phase === 'RESULT', 'real game outcome', 70000);
  await host.locator('.stage').scrollIntoViewIfNeeded(); mark('result', { outcome: result.outcome, rescues: result.rescues, roundId: result.roundId });
  await broadcast.screenshot({ path: join(output, 'result.png') }); await hold(3500);
  const download = host.waitForEvent('download');
  await host.getByRole('button', { name: 'Export result PNG', exact: false }).click();
  await (await download).saveAs(join(output, 'result-export.png')); mark('export'); await hold(1500);
  await writeFile(join(output, 'result-summary.json'), JSON.stringify({ mode: result.mode, channel: result.channel, threshold: result.threshold, roundId: result.roundId, outcome: result.outcome, elapsed: result.elapsed, rescues: result.rescues }, null, 2));
} catch (error) {
  driveError = error; console.error('Capture incomplete:', error.message);
  console.error('Last game state:', JSON.stringify({ phase: app.game.state.phase, elapsed: app.game.state.elapsed, hearts: app.game.state.hearts, paused: app.game.state.paused, help: app.game.state.help, helpUsed: app.game.state.helpUsed, rescues: app.game.state.rescues }));
  if (recordHost) { console.error('UI feedback:', await recordHost.locator('.feedback').innerText().catch(() => 'unavailable')); await recordHost.screenshot({path:join(output,'failure.png'),fullPage:true}).catch(()=>{}); }
} finally {
  await recordingContext?.close(); await controllerContext?.close(); await browser?.close(); await app.close();
  await writeFile(join(output, 'capture.json'), JSON.stringify({ complete: !driveError, live, videos, markers, error: driveError?.message }, null, 2));
}
console.log(`Capture manifest: ${join(output, 'capture.json')}`);
if (driveError) process.exitCode = 1;
else await renderDemo(join(output, 'capture.json'));
