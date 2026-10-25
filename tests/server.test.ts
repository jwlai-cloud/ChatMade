import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { WebSocket } from 'ws';
import { EventEmitter } from 'node:events';
import { createApp } from '../server/index.js';

function connection(origin: string) {
  const ws = new WebSocket(origin.replace('http', 'ws') + '/ws', { origin });
  const messages: any[] = [];
  ws.on('message', raw => messages.push(JSON.parse(raw.toString())));
  async function waitFor(check: (m: any) => boolean, timeout = 3000) {
    const end = Date.now() + timeout;
    while (Date.now() < end) { const index = messages.findIndex(check); if (index >= 0) return messages.splice(index, 1)[0]; await new Promise(r => setTimeout(r, 10)); }
    throw new Error('Timed out waiting for websocket response.');
  }
  return { ws, waitFor, send: (a: unknown) => ws.send(JSON.stringify(a)) };
}
test('loopback transport enforces host key and origin, hides moderation, reconnects read-only and persists results', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'chatmade-test-'));
  const app = await createApp({ port: 0, production: true, dataDir: dir, token: 'test-only-key' });
  try {
    const viewer = connection(app.origin); await viewer.waitFor(m => m.type === 'state');
    viewer.send({ type: 'start' }); assert.match((await viewer.waitFor(m => m.type === 'error')).message, /Read-only/); assert.equal(app.game.state.phase, 'LOBBY');
    viewer.send({ type: 'auth', token: 'wrong' }); assert.match((await viewer.waitFor(m => m.type === 'error')).message, /Invalid host/);
    const host = connection(app.origin); await host.waitFor(m => m.type === 'state'); host.send({ type: 'auth', token: 'test-only-key' }); await host.waitFor(m => m.type === 'authenticated');
    host.send({ type: 'start' }); await host.waitFor(m => m.type === 'ack');
    host.send({ type: 'sample', user: 'sample-moss', command: '!body Hidden pending idea', eventId: 'one' }); await host.waitFor(m => m.type === 'ack');
    assert.equal((await (await fetch(app.origin + '/api/state')).json()).suggestions.length, 0);
    assert.equal(app.game.state.suggestions.length, 1);
    host.send({ type: 'moderate', id: 'one', approved: true }); await host.waitFor(m => m.type === 'ack');
    assert.equal((await (await fetch(app.origin + '/api/state')).json()).suggestions[0].text, 'Hidden pending idea');
    assert.equal((await fetch(app.origin + '/data/host-key.txt')).status, 404);
    assert.equal((await fetch(app.origin + '/api/state', { method: 'POST' })).status, 405);
    await new Promise<void>((ok, fail) => { const bad = new WebSocket(app.origin.replace('http', 'ws') + '/ws', { origin: 'https://other.example' }); bad.on('unexpected-response', (_, res) => { assert.equal(res.statusCode, 403); res.resume(); bad.terminate(); ok(); }); bad.on('error', () => {}); bad.on('open', () => { bad.terminate(); fail(new Error('Bad origin accepted.')); }); });
    host.ws.close(); const reconnect = connection(app.origin); await reconnect.waitFor(m => m.type === 'state'); reconnect.send({ type: 'restart' }); assert.match((await reconnect.waitFor(m => m.type === 'error')).message, /Read-only/);
    app.game.assemble(); app.game.closeVoting(); app.game.approve(); app.game.reveal(); app.game.play(); app.game.state.hearts = 1; app.game.state.player = { ...app.game.state.monster };
    await viewer.waitFor(m => m.state?.saveStatus === 'Saved locally');
    const files = (await readdir(dir)).filter(x => x.endsWith('.json')); assert.equal(files.length, 1);
    const record = JSON.parse(await readFile(join(dir, files[0]), 'utf8')); assert.equal(record.outcome, 'CAUGHT'); assert.equal(record.provenance, 'original-fallback'); assert.equal(record.recipe.ingredients[0].name, 'Moss (sample)');
    assert.ok(!JSON.stringify(record).includes('test-only-key'));
    viewer.ws.close(); reconnect.ws.close();
  } finally { await app.close(); await rm(dir, { recursive: true, force: true }); }
});
test('development server cannot serve private data through normal or Vite filesystem URLs', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'chatmade-private-')); await writeFile(join(dir, 'host-key.txt'), 'never-public');
  const app = await createApp({ port: 0, dataDir: dir, token: 'test-only-key' });
  try {
    for (const path of ['/data/host-key.txt', '/%64ata/host-key.txt', `/@fs${dir}/host-key.txt`, '/.git/config']) {
      const response = await fetch(app.origin + path); const text = await response.text(); assert.ok(response.status >= 400); assert.ok(!text.includes('never-public'));
    }
  } finally { await app.close(); await rm(dir, { recursive: true, force: true }); }
});
test('guided Twitch login drives a live round, excludes simulated input and preserves gameplay on disconnect', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'chatmade-live-'));
  const clientId = 'publicclient123';
  const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
  class FakeTwitchSocket extends EventEmitter {
    terminate() { this.emit('close'); }
    message(kind: string, payload: unknown, metadata = {}) { this.emit('message', Buffer.from(JSON.stringify({ metadata: { message_type: kind, ...metadata }, payload }))); }
    chat(id: string, text: string, user = '456') { this.message('notification', { event: { broadcaster_user_id: '123', chatter_user_id: user, chatter_user_name: `Viewer${user}`, message_id: id, message: { text } } }, { message_id: id, message_timestamp: new Date().toISOString(), subscription_type: 'channel.chat.message' }); }
  }
  let twitchSocket!: FakeTwitchSocket;
  const fetcher = (async (url: unknown) => {
    if (String(url).endsWith('/device')) return response({ device_code: 'private-device', user_code: 'AUTHCODE', verification_uri: 'https://www.twitch.tv/activate', interval: 5, expires_in: 1800 });
    if (String(url).endsWith('/token')) return response({ access_token: 'private-access', refresh_token: 'private-refresh', scope: ['user:read:chat'] });
    if (String(url).endsWith('/validate')) return response({ client_id: clientId, scopes: ['user:read:chat'], user_id: '123', login: 'streamer' });
    if (String(url).endsWith('/subscriptions')) return response({ data: [{ id: 'sub' }] }, 202);
    throw new Error('Unexpected request.');
  }) as typeof fetch;
  const app = await createApp({ port: 0, production: true, dataDir: dir, token: 'local-test-key', twitchClientId: clientId, twitchTestOptions: { fetcher, openSocket: () => {
    twitchSocket = new FakeTwitchSocket(); queueMicrotask(() => twitchSocket.message('session_welcome', { session: { id: 'session-1', keepalive_timeout_seconds: 10 } })); return twitchSocket as unknown as WebSocket;
  } } });
  try {
    const host = connection(app.origin), viewer = connection(app.origin); await host.waitFor(m => m.type === 'state'); await viewer.waitFor(m => m.type === 'state');
    viewer.send({ type: 'twitch-connect' }); assert.match((await viewer.waitFor(m => m.type === 'error')).message, /Read-only/);
    host.send({ type: 'auth', token: 'local-test-key' }); await host.waitFor(m => m.type === 'authenticated');
    host.send({ type: 'mode', mode: 'twitch' }); await host.waitFor(m => m.state?.mode === 'twitch');
    host.send({ type: 'start' }); assert.match((await host.waitFor(m => m.type === 'error')).message, /Connect Twitch/); assert.equal(app.game.state.phase, 'LOBBY');
    host.send({ type: 'twitch-connect' }); await host.waitFor(m => m.state?.twitch?.authorization?.userCode === 'AUTHCODE');
    const publicAuth = JSON.stringify(await (await fetch(app.origin + '/api/state')).json());
    assert.ok(!publicAuth.includes('AUTHCODE')); assert.ok(!publicAuth.includes('private-device'));
    await host.waitFor(m => m.state?.twitch?.status === 'connected', 7000);
    host.send({ type: 'start' }); await host.waitFor(m => m.type === 'ack'); assert.equal(app.game.state.channel, 'streamer');
    host.send({ type: 'seed-samples' }); assert.match((await host.waitFor(m => m.type === 'error')).message, /disabled/);
    twitchSocket.chat('idea-1', '!body Viewer monster'); twitchSocket.chat('idea-1', '!body Duplicate');
    assert.equal(app.game.state.suggestions.length, 1); assert.equal(app.game.snapshot().suggestions.length, 0);
    host.send({ type: 'moderate', id: 'twitch-idea-1', approved: true }); await host.waitFor(m => m.type === 'ack');
    assert.equal((await (await fetch(app.origin + '/api/state')).json()).suggestions[0].text, 'Viewer monster');
    host.send({ type: 'assemble' }); await host.waitFor(m => m.type === 'ack'); twitchSocket.chat('vote-1', '!vote 2');
    for (const type of ['close-vote', 'approve', 'fallback', 'play']) { host.send({ type }); await host.waitFor(m => m.type === 'ack'); }
    for (const user of ['456', '457', '458']) twitchSocket.chat(`help-${user}`, '!help', user);
    assert.equal(app.game.state.rescues, 1);
    twitchSocket.chat('invalid-help', '!help extra text'); assert.equal(app.twitch.snapshot().rejected, 1);
    twitchSocket.emit('close'); assert.equal(app.twitch.snapshot().status, 'reconnecting'); assert.equal(app.game.state.phase, 'PLAY'); assert.equal(app.game.state.paused, false);
    host.send({ type: 'mode', mode: 'sample' }); assert.match((await host.waitFor(m => m.type === 'error')).message, /LOBBY/);
    host.send({ type: 'sample', user: 'sample-moss', command: '!help', eventId: 'not-live' }); assert.match((await host.waitFor(m => m.type === 'error')).message, /disabled/);
    app.game.state.rescueUntil = 0; app.game.state.hearts = 1; app.game.state.player = { ...app.game.state.monster };
    await host.waitFor(m => m.state?.saveStatus === 'Saved locally');
    const file = (await readdir(dir)).find(x => x.endsWith('.json'))!; const record = JSON.parse(await readFile(join(dir, file), 'utf8'));
    assert.equal(record.mode, 'twitch'); assert.equal(record.channel, 'streamer'); assert.equal(record.recipe.ingredients[0].name, 'Viewer456');
    assert.ok(!JSON.stringify(record).includes('private-access'));
    host.ws.close(); viewer.ws.close();
  } finally { await app.close(); await rm(dir, { recursive: true, force: true }); }
});
