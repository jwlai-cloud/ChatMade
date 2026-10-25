import { WebSocket } from 'ws';
import type { TwitchView } from '../shared/twitch.js';

const AUTH = 'https://id.twitch.tv/oauth2';
const EVENTS = 'wss://eventsub.wss.twitch.tv/ws';
const SCOPE = 'user:read:chat';
type Command = { id: string; user: string; name: string; text: string };
type Identity = { id: string; login: string };
type Tokens = { access: string; refresh: string };
type SocketEntry = { socket: WebSocket; watchdog?: ReturnType<typeof setTimeout>; welcomed: boolean; timeout: number };
class AuthFailure extends Error {}
function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid Twitch response.');
  return value as Record<string, unknown>;
}
function field(data: Record<string, unknown>, name: string, max = 1000): string {
  const value = data[name];
  if (typeof value !== 'string' || !value || value.length > max) throw new Error('Incomplete Twitch response.');
  return value;
}
function seconds(value: unknown, max: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0 || value > max) throw new Error('Invalid Twitch timing.');
  return value;
}
export function validClientId(value: unknown): value is string { return typeof value === 'string' && /^[a-z\d]{8,64}$/i.test(value); }
export function validReconnectUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  try { const u = new URL(value); return u.protocol === 'wss:' && u.hostname === 'eventsub.wss.twitch.tv' && !u.username && !u.password && !u.port && !u.hash; }
  catch { return false; }
}

export class TwitchConnection {
  private clientId: string;
  // shortcut: tokens stay in memory; add OS keychain storage when reconnect-on-launch is required.
  private tokens?: Tokens;
  private identity?: Identity;
  private controller = new AbortController();
  private generation = 0;
  private pollTimer?: ReturnType<typeof setTimeout>;
  private retryTimer?: ReturnType<typeof setTimeout>;
  private validationTimer?: ReturnType<typeof setInterval>;
  private refreshTask?: Promise<void>;
  private sockets = new Set<SocketEntry>();
  private primary?: SocketEntry;
  private candidate?: SocketEntry;
  private retries = 0;
  private seen = new Map<string, number>();
  private view: TwitchView;
  private fetcher: typeof fetch;
  private openSocket: (url: string) => WebSocket;
  constructor(private options: { clientId?: string; onCommand: (command: Command) => void; onChange?: () => void; fetcher?: typeof fetch; openSocket?: (url: string) => WebSocket }) {
    this.clientId = validClientId(options.clientId) ? options.clientId : '';
    this.fetcher = options.fetcher ?? fetch;
    this.openSocket = options.openSocket ?? (url => new WebSocket(url, { maxPayload: 128 * 1024 }));
    this.view = { status: this.clientId ? 'disconnected' : 'unconfigured', channel: null, message: this.clientId ? 'Connect your Twitch channel.' : 'Publisher setup: add a public Twitch Client ID.', accepted: 0, rejected: 0 };
  }
  snapshot(host = false): TwitchView {
    const view = structuredClone(this.view);
    if (!host) delete view.authorization;
    return view;
  }
  get connected() { return this.view.status === 'connected'; }
  get channel() { return this.identity?.login ?? null; }
  configure(clientId: unknown) {
    if (!validClientId(clientId)) throw new Error('Enter the public Twitch Client ID, not a secret or token.');
    if (this.tokens || this.view.status === 'authorizing') throw new Error('Disconnect Twitch before changing publisher settings.');
    this.clientId = clientId; this.update('disconnected', 'Connect your Twitch channel.');
  }
  private update(status: TwitchView['status'], message: string) {
    this.view.status = status; this.view.message = message; this.view.channel = this.identity?.login ?? null; this.options.onChange?.();
  }
  private async request(url: string, init: RequestInit = {}) {
    const signal = AbortSignal.any([this.controller.signal, AbortSignal.timeout(8000)]);
    return this.fetcher(url, { ...init, signal, redirect: 'error' });
  }
  private form(values: Record<string, string>) { const form = new FormData(); for (const [key, value] of Object.entries(values)) form.set(key, value); return form; }
  private active(generation: number) { return this.generation === generation && !this.controller.signal.aborted; }
  async begin() {
    if (!this.clientId) throw new Error('Publisher must configure a public Twitch Client ID first.');
    this.stop(); this.controller = new AbortController(); const generation = this.generation;
    this.update('authorizing', 'Requesting Twitch authorisation…');
    try {
      const response = await this.request(`${AUTH}/device`, { method: 'POST', body: this.form({ client_id: this.clientId, scopes: SCOPE }) });
      if (!response.ok) throw new Error('Twitch could not start authorisation. Check that the application is a Public client.');
      const data = record(await response.json());
      if (!this.active(generation)) return;
      const deviceCode = field(data, 'device_code'), userCode = field(data, 'user_code', 32);
      const verificationUri = field(data, 'verification_uri'); const uri = new URL(verificationUri);
      if (uri.protocol !== 'https:' || !['www.twitch.tv', 'twitch.tv'].includes(uri.hostname) || uri.pathname !== '/activate' || uri.username || uri.password || uri.port) throw new Error('Invalid Twitch authorisation address.');
      let interval = Math.max(5, seconds(data.interval, 60)); const expiresAt = Date.now() + seconds(data.expires_in, 3600) * 1000;
      this.view.authorization = { userCode, verificationUri, expiresAt };
      this.update('authorizing', 'Open Twitch, enter the code and approve read-only chat access.');
      const poll = async () => {
        if (!this.active(generation)) return;
        if (Date.now() >= expiresAt) { this.fail('Authorisation code expired. Connect Twitch again.'); return; }
        try {
          const tokenResponse = await this.request(`${AUTH}/token`, { method: 'POST', body: this.form({ client_id: this.clientId, scopes: SCOPE, device_code: deviceCode, grant_type: 'urn:ietf:params:oauth:grant-type:device_code' }) });
          const result = record(await tokenResponse.json()); if (!this.active(generation)) return;
          if (!tokenResponse.ok) {
            const code = result.message ?? result.error;
            if (code === 'authorization_pending' || code === 'slow_down') { if (code === 'slow_down') interval += 5; this.pollTimer = setTimeout(() => { void poll(); }, interval * 1000); return; }
            throw new Error('Authorisation denied or expired. Connect Twitch to try again.');
          }
          this.tokens = this.parseTokens(result); delete this.view.authorization;
          await this.validate(false); if (!this.active(generation)) return;
          this.update('connecting', 'Joining your channel’s Twitch chat…'); this.open();
          this.validationTimer = setInterval(() => { void this.validate().catch(error => { if (this.active(generation)) this.fail(error instanceof AuthFailure ? error.message : 'Could not validate Twitch authorisation. Reconnect Twitch.'); }); }, 60 * 60 * 1000);
        } catch (error) { if (this.active(generation)) this.fail(error instanceof AuthFailure ? error.message : 'Twitch authorisation failed. Connect again to retry.'); }
      };
      this.pollTimer = setTimeout(() => { void poll(); }, interval * 1000);
    } catch (error) {
      if (this.active(generation)) this.fail(error instanceof Error ? error.message : 'Twitch authorisation failed.');
      throw new Error(this.view.message);
    }
  }
  private parseTokens(data: Record<string, unknown>): Tokens {
    if (!Array.isArray(data.scope) || !data.scope.includes(SCOPE)) throw new AuthFailure('Read-only chat permission was not granted. Connect Twitch again.');
    return { access: field(data, 'access_token'), refresh: field(data, 'refresh_token') };
  }
  private async refresh() {
    if (this.refreshTask) return this.refreshTask;
    const generation = this.generation;
    const task = (async () => {
      if (!this.tokens) throw new AuthFailure('Connect Twitch again.');
      const response = await this.request(`${AUTH}/token`, { method: 'POST', body: new URLSearchParams({ client_id: this.clientId, grant_type: 'refresh_token', refresh_token: this.tokens.refresh }) });
      if (!response.ok) throw new AuthFailure('Twitch authorisation expired or was revoked. Connect again.');
      const tokens = this.parseTokens(record(await response.json()));
      if (this.active(generation)) this.tokens = tokens;
    })();
    this.refreshTask = task;
    try { await task; } finally { if (this.refreshTask === task) this.refreshTask = undefined; }
  }
  private async validate(refresh = true) {
    const generation = this.generation;
    if (!this.tokens) throw new AuthFailure('Connect Twitch again.');
    let response = await this.request(`${AUTH}/validate`, { headers: { Authorization: `OAuth ${this.tokens.access}` } });
    if (!this.active(generation)) return;
    if (response.status === 401 && refresh) { await this.refresh(); if (!this.active(generation) || !this.tokens) return; response = await this.request(`${AUTH}/validate`, { headers: { Authorization: `OAuth ${this.tokens.access}` } }); }
    if (!response.ok) throw new AuthFailure('Twitch authorisation is no longer valid. Connect again.');
    const data = record(await response.json()); if (!this.active(generation)) return;
    if (data.client_id !== this.clientId || !Array.isArray(data.scopes) || !data.scopes.includes(SCOPE)) throw new AuthFailure('Twitch account or permission mismatch. Connect again.');
    const id = field(data, 'user_id', 32), login = field(data, 'login', 40);
    if (!/^\d+$/.test(id) || !/^[a-z\d_]+$/i.test(login) || (this.identity && this.identity.id !== id)) throw new AuthFailure('Twitch account changed. Disconnect and connect again.');
    this.identity = { id, login };
  }
  private arm(entry: SocketEntry) {
    clearTimeout(entry.watchdog);
    entry.watchdog = setTimeout(() => this.recover(entry, 'Twitch keepalive timed out. Reconnecting…'), (entry.welcomed ? entry.timeout : 10) * 1000);
  }
  private open(url = EVENTS, transfer = false) {
    if (!this.tokens || !this.identity) return;
    const generation = this.generation;
    let socket: WebSocket;
    try { socket = this.openSocket(url); } catch { this.retry('Could not reach Twitch. Reconnecting…'); return; }
    const entry: SocketEntry = { socket, welcomed: false, timeout: 10 };
    this.sockets.add(entry); if (transfer) this.candidate = entry; else this.primary = entry;
    this.arm(entry);
    socket.on('message', raw => {
      if (!this.active(generation) || !this.sockets.has(entry)) return;
      void this.receive(entry, raw.toString(), transfer).catch(error => {
        if (!this.active(generation) || !this.sockets.has(entry)) return;
        if (error instanceof AuthFailure) this.fail(error.message); else this.recover(entry, 'Twitch connection interrupted. Reconnecting…');
      });
    });
    socket.on('error', () => this.recover(entry, 'Twitch connection interrupted. Reconnecting…'));
    socket.on('close', () => this.recover(entry, 'Twitch disconnected. Reconnecting…'));
  }
  private async receive(entry: SocketEntry, raw: string, transfer: boolean) {
    const data = record(JSON.parse(raw)); const metadata = record(data.metadata), payload = record(data.payload);
    const kind = field(metadata, 'message_type', 64);
    if (kind === 'session_welcome') {
      if (entry.welcomed) return;
      entry.welcomed = true; const session = record(payload.session); const sessionId = field(session, 'id', 512); entry.timeout = seconds(session.keepalive_timeout_seconds, 600); this.arm(entry);
      if (!transfer) await this.subscribe(sessionId, entry);
      if (!this.sockets.has(entry)) return;
      if (transfer) { const old = this.primary; this.primary = entry; this.candidate = undefined; if (old) this.remove(old); }
      this.retries = 0; this.update('connected', `Reading chat in ${this.identity!.login}.`);
    } else if (kind === 'session_keepalive' || kind === 'notification') {
      if (!entry.welcomed) throw new Error('Twitch notification arrived before welcome.');
      this.arm(entry);
      if (kind === 'notification' && metadata.subscription_type === 'channel.chat.message') this.command(metadata, payload);
    } else if (kind === 'session_reconnect') {
      const url = record(payload.session).reconnect_url;
      if (!validReconnectUrl(url)) throw new Error('Invalid Twitch reconnect address.');
      if (!this.candidate) { this.update('reconnecting', 'Twitch is moving this connection…'); this.open(url, true); }
    } else if (kind === 'revocation') {
      throw new AuthFailure('Twitch chat authorisation was revoked. Connect again.');
    }
  }
  private async subscribe(sessionId: string, entry: SocketEntry) {
    const generation = this.generation;
    const request = () => this.request('https://api.twitch.tv/helix/eventsub/subscriptions', { method: 'POST', headers: { Authorization: `Bearer ${this.tokens!.access}`, 'Client-Id': this.clientId, 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'channel.chat.message', version: '1', condition: { broadcaster_user_id: this.identity!.id, user_id: this.identity!.id }, transport: { method: 'websocket', session_id: sessionId } }) });
    let response = await request();
    if (!this.active(generation) || !this.sockets.has(entry)) return;
    if (response.status === 401) { await this.refresh(); await this.validate(false); if (!this.active(generation) || !this.sockets.has(entry)) return; response = await request(); }
    if (response.status === 401 || response.status === 403) throw new AuthFailure('Twitch refused chat access. Connect again with read-only chat permission.');
    if (response.status !== 202) throw new Error('Could not subscribe to Twitch chat.');
  }
  private command(metadata: Record<string, unknown>, payload: Record<string, unknown>) {
    const event = record(payload.event);
    if (event.broadcaster_user_id !== this.identity?.id || (event.source_broadcaster_user_id && event.source_broadcaster_user_id !== this.identity?.id)) return;
    const text = record(event.message).text;
    if (typeof text !== 'string' || !/^!(body|power|weakness|vote|help)(?:\s|$)/i.test(text)) return;
    const id = field(event, 'message_id', 80); const delivery = field(metadata, 'message_id', 80);
    const now = Date.now(), timestamp = Date.parse(field(metadata, 'message_timestamp', 64));
    if (!Number.isFinite(timestamp) || now - timestamp > 10 * 60 * 1000 || timestamp - now > 60 * 1000) return;
    for (const [key, time] of this.seen) { if (now - time > 10 * 60 * 1000 || this.seen.size > 10000) this.seen.delete(key); else break; }
    if (this.seen.has(id) || this.seen.has(delivery)) return;
    this.seen.set(id, now); this.seen.set(delivery, now);
    try { this.options.onCommand({ id: `twitch-${id}`, user: `twitch-${field(event, 'chatter_user_id', 32)}`, name: field(event, 'chatter_user_name', 40), text }); this.view.accepted++; }
    catch { this.view.rejected++; }
    this.options.onChange?.();
  }
  private remove(entry: SocketEntry) { this.sockets.delete(entry); clearTimeout(entry.watchdog); entry.socket.terminate(); }
  private recover(entry: SocketEntry, message: string) { if (!this.sockets.has(entry)) return; this.retry(message); }
  private retry(message: string) {
    for (const entry of [...this.sockets]) this.remove(entry);
    this.primary = this.candidate = undefined;
    if (this.retryTimer || !this.tokens || !this.identity || this.controller.signal.aborted) return;
    this.update('reconnecting', message);
    const delay = Math.min(30000, 1000 * 2 ** Math.min(this.retries++, 5));
    this.retryTimer = setTimeout(() => { this.retryTimer = undefined; this.open(); }, delay);
  }
  private stop() {
    this.generation++; this.controller.abort(); clearTimeout(this.pollTimer); clearTimeout(this.retryTimer); clearInterval(this.validationTimer);
    this.pollTimer = this.retryTimer = this.validationTimer = undefined;
    for (const entry of [...this.sockets]) this.remove(entry);
    this.primary = this.candidate = undefined; this.tokens = undefined; this.identity = undefined; this.refreshTask = undefined; this.retries = 0; delete this.view.authorization;
  }
  private fail(message: string) { this.stop(); this.update('error', message); }
  disconnect() { this.stop(); this.view.accepted = this.view.rejected = 0; this.update(this.clientId ? 'disconnected' : 'unconfigured', 'Disconnected locally. Revoke app access in Twitch Connections if needed.'); }
  close() { this.stop(); }
}
