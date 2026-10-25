import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { WebSocket } from 'ws';
import { createApp } from '../server/index.js';

function connection(origin: string) {
  const ws = new WebSocket(origin.replace('http', 'ws') + '/ws', { origin });
  const messages: any[] = [];
  ws.on('message', raw => messages.push(JSON.parse(raw.toString())));
  async function waitFor(check: (m: any) => boolean) {
    const end = Date.now() + 3000;
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
