import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { WebSocketServer, WebSocket } from 'ws';
import { Game, PARTICIPANTS, cleanText } from '../shared/game.js';

export function validToken(candidate: unknown, expected: string) {
  if (typeof candidate !== 'string') return false;
  const a = Buffer.from(candidate), b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
export function applyAction(game: Game, a: Record<string, unknown>) {
  const s = game.state;
  switch (a.type) {
    case 'start': game.start(); break;
    case 'restart': game.reset(s.seed, randomUUID()); break;
    case 'pause': game.pause(); break;
    case 'extend': game.require('COLLECT'); s.remaining = Math.min(120, s.remaining + 15); break;
    case 'assemble': game.assemble(); break;
    case 'close-vote': game.closeVoting(); break;
    case 'approve': game.approve(); break;
    case 'reject': game.reject(cleanText(a.reason, 100)); break;
    case 'fallback': game.reveal(); break;
    case 'play': game.play(); break;
    case 'settings':
      game.require('LOBBY');
      if (a.threshold !== 1 && a.threshold !== 3) throw new Error('Threshold must be 1 or 3.');
      if (!Number.isInteger(a.seed) || Number(a.seed) < 1 || Number(a.seed) > 999999) throw new Error('Seed must be 1–999999.');
      s.threshold = a.threshold; s.seed = Number(a.seed); break;
    case 'moderate':
      if (typeof a.approved !== 'boolean') throw new Error('Approval must be boolean.');
      game.moderate(cleanText(a.id, 100), a.approved); break;
    case 'move':
      if (typeof a.x !== 'number' || typeof a.y !== 'number' || ![-1, 0, 1].includes(a.x) || ![-1, 0, 1].includes(a.y)) throw new Error('Invalid movement.');
      game.movement = s.phase === 'PLAY' && !s.paused ? { x: a.x, y: a.y } : { x: 0, y: 0 }; break;
    case 'sample': {
      const user = PARTICIPANTS.find(p => p.id === a.user);
      if (!user) throw new Error('Choose a sample participant.');
      return game.input(cleanText(a.eventId, 100), user.id, user.name, cleanText(a.command, 100));
    }
    case 'seed-samples': {
      game.require('COLLECT');
      const samples = [['Jelly knight', 'Charging hugs', 'Rubber ducks'], ['Cosmic mushroom', 'Bouncing boots', 'Sticky syrup'], ['Sleepy dragon', 'Projectile burst', 'Tiny marshmallows']];
      for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) game.input(randomUUID(), PARTICIPANTS[i].id, PARTICIPANTS[i].name, `!${['body', 'power', 'weakness'][j]} ${samples[i][j]}`);
      return 'Nine sample ideas queued. Review before broadcasting.';
    }
    default: throw new Error('Unknown action.');
  }
  return 'Done.';
}

export async function createApp({ port = 4317, production = false, dataDir = resolve('data'), token: suppliedToken }: { port?: number; production?: boolean; dataDir?: string; token?: string } = {}) {
  await mkdir(dataDir, { recursive: true, mode: 0o700 });
  const token = suppliedToken ?? randomBytes(32).toString('hex');
  if (!suppliedToken) await writeFile(resolve(dataDir, 'host-key.txt'), token, { mode: 0o600 });
  const game = new Game(42, randomUUID());
  let origin = `http://127.0.0.1:${port}`;
  let vite: Awaited<ReturnType<typeof import('vite')['createServer']>> | undefined;
  const server = createServer((req, res) => { void handle(req, res).catch(() => { if (!res.headersSent) res.writeHead(500); res.end('Server error.'); }); });
  const wss = new WebSocketServer({ noServer: true, maxPayload: 4096 });
  const hosts = new Set<WebSocket>();
  const send = (ws: WebSocket, value: unknown) => { if (ws.readyState === WebSocket.OPEN) { if (ws.bufferedAmount > 1024 * 1024) ws.close(1013, 'Client too slow'); else ws.send(JSON.stringify(value)); } };
  function broadcast() { const pub = { type: 'state', state: game.snapshot() }; const host = { type: 'state', state: game.snapshot(true) }; for (const ws of wss.clients) send(ws, hosts.has(ws) ? host : pub); }
  async function handle(req: IncomingMessage, res: ServerResponse) {
    res.setHeader('X-Content-Type-Options', 'nosniff'); res.setHeader('Referrer-Policy', 'no-referrer'); res.setHeader('Cache-Control', 'no-store');
    if (req.headers.host !== new URL(origin).host) { res.writeHead(403); res.end('Invalid host. Use 127.0.0.1.'); return; }
    if (req.method !== 'GET') { res.writeHead(405); res.end('Method not allowed.'); return; }
    const path = new URL(req.url ?? '/', origin).pathname;
    if (path === '/api/state') { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(game.snapshot())); return; }
    if (path.startsWith('/api/')) { res.writeHead(404); res.end('Not found.'); return; }
    if (!production && vite) {
      const decoded = decodeURIComponent(path);
      if (decoded.split('/').some(part => ['data', '.git', '.env'].includes(part))) { res.writeHead(403); res.end('Private path.'); return; }
      vite.middlewares(req, res); return;
    }
    const root = resolve('dist');
    const requested = path === '/' || path === '/host' || path === '/broadcast' ? 'index.html' : decodeURIComponent(path.slice(1));
    const file = resolve(root, requested);
    if (!file.startsWith(root + sep)) { res.writeHead(403); res.end(); return; }
    try { const body = await readFile(file); res.setHeader('Content-Type', ({ '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png' } as Record<string, string>)[extname(file)] ?? 'application/octet-stream'); res.end(body); }
    catch { res.writeHead(404); res.end('Not found.'); }
  }
  server.on('upgrade', (req, socket, head) => {
    const pathname = req.url?.split('?')[0];
    if (pathname !== '/ws') return;
    if (req.headers.origin !== origin || req.headers.host !== new URL(origin).host) { socket.write('HTTP/1.1 403 Forbidden\r\n\r\n'); socket.destroy(); return; }
    wss.handleUpgrade(req, socket, head, ws => wss.emit('connection', ws));
  });
  wss.on('connection', ws => {
    send(ws, { type: 'state', state: game.snapshot() });
    let count = 0, window = Date.now(), lastMovement = 0;
    ws.on('message', raw => {
      try {
        if (Date.now() - window > 1000) { count = 0; window = Date.now(); }
        if (++count > 80) { ws.close(1008, 'Rate limit'); return; }
        const a: unknown = JSON.parse(raw.toString());
        if (!a || typeof a !== 'object' || Array.isArray(a)) throw new Error('Invalid action.');
        const action = a as Record<string, unknown>;
        if (action.type === 'auth') { if (!validToken(action.token, token)) throw new Error('Invalid host key.'); hosts.add(ws); send(ws, { type: 'authenticated' }); send(ws, { type: 'state', state: game.snapshot(true) }); return; }
        if (!hosts.has(ws)) throw new Error('Read-only connection. Unlock host controls first.');
        const message = applyAction(game, action);
        if (action.type === 'move') lastMovement = Date.now();
        else send(ws, { type: 'ack', message });
        broadcast();
      } catch (error) { send(ws, { type: 'error', message: error instanceof Error ? error.message : 'Invalid request.' }); }
    });
    const watchdog = setInterval(() => { if (hosts.has(ws) && lastMovement && Date.now() - lastMovement > 400) { game.movement = { x: 0, y: 0 }; lastMovement = 0; } }, 200);
    ws.on('close', () => { clearInterval(watchdog); if (hosts.delete(ws)) game.movement = { x: 0, y: 0 }; });
  });
  if (!production) { const { createServer: createVite } = await import('vite'); vite = await createVite({ server: { middlewareMode: true, hmr: { server }, fs: { deny: ['.env', '.env.*', '*.{crt,pem}', '**/.git/**', '**/data/**', `${dataDir}/**`] } }, appType: 'spa' }); }
  await new Promise<void>((ok, fail) => { server.once('error', fail); server.listen(port, '127.0.0.1', () => { const address = server.address(); if (address && typeof address !== 'string') origin = `http://127.0.0.1:${address.port}`; ok(); }); });
  let frame = 0, previous = performance.now(), accumulator = 0; const saving = new Set<string>();
  const tick = setInterval(() => {
    const now = performance.now();
    // Do not fast-forward a sleeping laptop into an unavoidable loss.
    const elapsed = (now - previous) / 1000; previous = now;
    if (elapsed > 1 && !['LOBBY', 'RESULT'].includes(game.state.phase)) { game.state.paused = true; game.movement = { x: 0, y: 0 }; game.state.notice = 'Paused after system sleep or server stall.'; }
    accumulator += Math.min(elapsed, 0.25);
    while (accumulator >= 1 / 60) { game.tick(1 / 60); accumulator -= 1 / 60; }
    const s = game.state;
    if (s.phase === 'RESULT' && !saving.has(s.roundId)) {
      saving.add(s.roundId); s.saveStatus = 'Saving…';
      const record = { version: 1, roundId: s.roundId, seed: s.seed, mode: 'local-simulation', recipe: s.selected, provenance: s.provenance, asset: '/creature.svg', outcome: s.outcome, elapsed: s.elapsed, hearts: s.hearts, rescues: s.rescues, savedAt: new Date().toISOString() };
      void writeFile(resolve(dataDir, `${s.roundId}.json`), JSON.stringify(record, null, 2), { flag: 'wx', mode: 0o600 }).then(() => { s.saveStatus = 'Saved locally'; }).catch(() => { s.saveStatus = 'Save failed · export result before restarting'; });
    }
    if (++frame % 3 === 0) broadcast();
  }, 1000 / 60);
  return { game, origin, close: async () => { clearInterval(tick); for (const ws of wss.clients) ws.terminate(); wss.close(); await vite?.close(); await new Promise<void>(ok => server.close(() => ok())); } };
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const app = await createApp({ production: process.env.NODE_ENV === 'production' });
  console.log(`ChatMade: ${app.origin}/host\nBroadcast: ${app.origin}/broadcast\nHost unlock key: data/host-key.txt (private; regenerated on startup)`);
  for (const signal of ['SIGINT', 'SIGTERM'] as const) process.once(signal, () => { void app.close().then(() => process.exit(0)); });
}
