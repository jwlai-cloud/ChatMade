import test, { type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import type { WebSocket } from 'ws';
import { TwitchConnection, validReconnectUrl } from '../server/twitch.js';

const clientId = 'publicclient123';
const token = { access_token: 'fake-access', refresh_token: 'fake-refresh', scope: ['user:read:chat'] };
const identity = { client_id: clientId, scopes: ['user:read:chat'], user_id: '123', login: 'streamer', expires_in: 14400 };
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status });
class Socket extends EventEmitter {
  closed = false;
  message(message_type: string, payload: unknown, metadata: Record<string, unknown> = {}) { this.emit('message', Buffer.from(JSON.stringify({ metadata: { message_type, ...metadata }, payload }))); }
  welcome(id = 'session-1') { this.message('session_welcome', { session: { id, keepalive_timeout_seconds: 10 } }); }
  terminate() { if (!this.closed) { this.closed = true; this.emit('close'); } }
}
const flush = () => new Promise<void>(ok => setImmediate(ok));
function setup(t: TestContext, override?: (url: string, init: RequestInit) => Response | Promise<Response> | undefined) {
  t.mock.timers.enable({ apis: ['setTimeout', 'setInterval', 'Date'], now: Date.now() });
  const sockets: Socket[] = [], urls: string[] = [], requests: { url: string; init: RequestInit }[] = [], commands: unknown[] = [];
  let automaticWelcome = true;
  const fetcher = (async (input: string | URL | Request, init: RequestInit = {}) => {
    const url = String(input); requests.push({ url, init });
    const custom = override?.(url, init); if (custom) return custom;
    if (url.endsWith('/device')) return json({ device_code: 'private-device-code', user_code: 'ABCDEF', verification_uri: 'https://www.twitch.tv/activate?public=true&device-code=ABCDEF', interval: 5, expires_in: 1800 });
    if (url.endsWith('/token')) return json(token);
    if (url.endsWith('/validate')) return json(identity);
    if (url.endsWith('/subscriptions')) return json({ data: [{ id: 'sub-1' }] }, 202);
    throw new Error('Unexpected test URL.');
  }) as typeof fetch;
  const connection = new TwitchConnection({ clientId, fetcher, onCommand: command => commands.push(command), openSocket: url => { const socket = new Socket(); sockets.push(socket); urls.push(url); if (automaticWelcome) queueMicrotask(() => socket.welcome(`session-${sockets.length}`)); return socket as unknown as WebSocket; } });
  t.after(() => connection.close());
  async function connect() { await connection.begin(); t.mock.timers.tick(5000); await flush(); assert.equal(connection.snapshot().status, 'connected'); }
  return { connection, connect, sockets, urls, requests, commands, welcomeManually: () => { automaticWelcome = false; } };
}
function chat(socket: Socket, id = 'chat-1', extra: Record<string, unknown> = {}, delivery = id) {
  socket.message('notification', { event: { broadcaster_user_id: '123', chatter_user_id: '456', chatter_user_name: 'Viewer', message_id: id, message: { text: '!vote 2' }, ...extra } }, { message_id: delivery, message_timestamp: new Date().toISOString(), subscription_type: 'channel.chat.message' });
}
test('device login requests read-only permission, subscribes to authorised account and hides auth material', async t => {
  const a = setup(t); await a.connection.begin();
  assert.equal(a.connection.snapshot().authorization, undefined); assert.equal(a.connection.snapshot(true).authorization?.userCode, 'ABCDEF');
  assert.ok(!JSON.stringify(a.connection.snapshot(true)).includes('private-device-code'));
  t.mock.timers.tick(5000); await flush(); assert.equal(a.connection.snapshot().status, 'connected'); assert.equal(a.connection.channel, 'streamer');
  const device = a.requests.find(r => r.url.endsWith('/device'))!; assert.equal((device.init.body as FormData).get('scopes'), 'user:read:chat');
  const subscription = JSON.parse(String(a.requests.find(r => r.url.endsWith('/subscriptions'))!.init.body));
  assert.deepEqual(subscription.condition, { broadcaster_user_id: '123', user_id: '123' });
  assert.ok(!JSON.stringify(a.connection.snapshot(true)).includes('fake-access')); assert.ok(!JSON.stringify(a.connection.snapshot()).includes('fake-refresh'));
});
test('device polling respects pending/slow_down and cancellation stops further polling', async t => {
  let polls = 0;
  const a = setup(t, (url, init) => url.endsWith('/token') && init.body instanceof FormData ? json({ message: ++polls === 1 ? 'authorization_pending' : 'slow_down' }, 400) : undefined);
  await a.connection.begin(); t.mock.timers.tick(5000); await flush(); assert.equal(polls, 1);
  t.mock.timers.tick(4999); await flush(); assert.equal(polls, 1); t.mock.timers.tick(1); await flush(); assert.equal(polls, 2);
  t.mock.timers.tick(9999); await flush(); assert.equal(polls, 2); a.connection.disconnect(); t.mock.timers.tick(60000); await flush(); assert.equal(polls, 2); assert.equal(a.sockets.length, 0);
});
test('mismatched client identity never connects', async t => {
  const a = setup(t, url => url.endsWith('/validate') ? json({ ...identity, client_id: 'wrong-client' }) : undefined);
  await a.connection.begin(); t.mock.timers.tick(5000); await flush(); assert.equal(a.connection.snapshot().status, 'error'); assert.equal(a.sockets.length, 0);
});
test('late token response cannot revive a disconnected session', async t => {
  let release!: (response: Response) => void;
  const a = setup(t, url => url.endsWith('/token') ? new Promise<Response>(ok => { release = ok; }) : undefined);
  await a.connection.begin(); t.mock.timers.tick(5000); await flush(); a.connection.disconnect(); release(json(token)); await flush();
  assert.equal(a.connection.snapshot().status, 'disconnected'); assert.equal(a.sockets.length, 0); assert.equal(a.requests.filter(r => r.url.endsWith('/validate')).length, 0);
});
test('deduplicates chat and delivery IDs and filters old/unrelated/shared chat', async t => {
  const a = setup(t); await a.connect(); const socket = a.sockets[0];
  chat(socket); chat(socket, 'chat-1', {}, 'another-delivery'); chat(socket, 'chat-2', {}, 'chat-1');
  chat(socket, 'other', { broadcaster_user_id: '999' }); chat(socket, 'shared', { source_broadcaster_user_id: '999' }); chat(socket, 'normal', { message: { text: 'hello!' } });
  socket.message('notification', { event: { broadcaster_user_id: '123', chatter_user_id: '456', chatter_user_name: 'Viewer', message_id: 'old', message: { text: '!help' } } }, { message_id: 'old-delivery', message_timestamp: '2020-01-01T00:00:00Z', subscription_type: 'channel.chat.message' });
  await flush(); assert.equal(a.commands.length, 1); assert.deepEqual(a.commands[0], { id: 'twitch-chat-1', user: 'twitch-456', name: 'Viewer', text: '!vote 2' });
});
test('Twitch reconnect handoff keeps old socket until welcome and does not resubscribe', async t => {
  const a = setup(t); await a.connect(); a.welcomeManually(); const old = a.sockets[0];
  const url = 'wss://eventsub.wss.twitch.tv/ws?reconnect=abc'; old.message('session_reconnect', { session: { reconnect_url: url } }); await flush();
  assert.equal(a.urls[1], url); assert.equal(old.closed, false); chat(old); await flush(); assert.equal(a.commands.length, 1);
  a.sockets[1].welcome('replacement'); await flush(); assert.equal(old.closed, true); assert.equal(a.connection.snapshot().status, 'connected');
  assert.equal(a.requests.filter(r => r.url.endsWith('/subscriptions')).length, 1); chat(a.sockets[1]); await flush(); assert.equal(a.commands.length, 1);
});
test('keepalive timeout reconnects and resubscribes after a lost connection', async t => {
  const a = setup(t); await a.connect(); t.mock.timers.tick(10001); await flush(); assert.equal(a.connection.snapshot().status, 'reconnecting');
  assert.equal(a.sockets[0].closed, true); t.mock.timers.tick(1000); await flush(); assert.equal(a.connection.snapshot().status, 'connected');
  assert.equal(a.requests.filter(r => r.url.endsWith('/subscriptions')).length, 2);
});
test('401 refresh rotates public-client tokens and retries subscription without a client secret', async t => {
  let subscriptions = 0;
  const a = setup(t, (url, init) => {
    if (url.endsWith('/subscriptions') && ++subscriptions === 1) return json({}, 401);
    if (url.endsWith('/token') && init.body instanceof URLSearchParams) { assert.equal(init.body.get('client_secret'), null); assert.equal(init.body.get('refresh_token'), 'fake-refresh'); return json({ ...token, access_token: 'rotated-access', refresh_token: 'rotated-refresh' }); }
    return undefined;
  });
  await a.connect(); assert.equal(subscriptions, 2);
  assert.equal(new Headers(a.requests.filter(r => r.url.endsWith('/subscriptions'))[1].init.headers).get('Authorization'), 'Bearer rotated-access');
});
test('hourly validation and revocation end invalid sessions', async t => {
  let validations = 0;
  const a = setup(t, url => {
    if (url.endsWith('/validate') && ++validations > 1) return json({}, 401);
    if (url.endsWith('/token') && validations > 1) return json({}, 400);
    return undefined;
  });
  await a.connect(); t.mock.timers.tick(60 * 60 * 1000); await flush(); assert.equal(a.connection.snapshot().status, 'error'); assert.equal(a.connection.channel, null);
});
test('subscription revocation is terminal and reconnect URLs cannot target other hosts', async t => {
  const a = setup(t); await a.connect(); a.sockets[0].message('revocation', { subscription: { status: 'authorization_revoked' } }); await flush();
  assert.equal(a.connection.snapshot().status, 'error'); t.mock.timers.tick(60000); await flush(); assert.equal(a.sockets.length, 1);
  for (const url of ['ws://eventsub.wss.twitch.tv/ws', 'wss://evil.example/ws', 'wss://eventsub.wss.twitch.tv.evil.example/ws', 'wss://user@eventsub.wss.twitch.tv/ws', 'wss://eventsub.wss.twitch.tv:444/ws']) assert.equal(validReconnectUrl(url), false);
  assert.equal(validReconnectUrl('wss://eventsub.wss.twitch.tv/ws?reconnect=abc'), true);
});
test('denied device authorisation clears host code and never opens EventSub', async t => {
  const a = setup(t, url => url.endsWith('/token') ? json({ error: 'access_denied' }, 400) : undefined);
  await a.connection.begin(); t.mock.timers.tick(5000); await flush();
  assert.equal(a.connection.snapshot().status, 'error'); assert.equal(a.connection.snapshot(true).authorization, undefined); assert.equal(a.sockets.length, 0);
});
test('missing required chat scope is rejected before token validation or subscription', async t => {
  const a = setup(t, url => url.endsWith('/token') ? json({ ...token, scope: [] }) : undefined);
  await a.connection.begin(); t.mock.timers.tick(5000); await flush();
  assert.equal(a.connection.snapshot().status, 'error'); assert.equal(a.requests.some(r => r.url.endsWith('/validate')), false); assert.equal(a.sockets.length, 0);
});
