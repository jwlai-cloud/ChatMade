import type { TwitchView } from './twitch.js';
export type Phase = 'LOBBY' | 'COLLECT' | 'SELECT' | 'GENERATE' | 'REVEAL' | 'PLAY' | 'RESULT';
export type Category = 'body' | 'power' | 'weakness';
export type Attack = 'charge' | 'bounce' | 'burst';
export type Weakness = 'stun' | 'slow' | 'soften';
export type Suggestion = { id: string; user: string; name: string; category: Category; text: string; approved: boolean; house?: boolean };
export type Recipe = { id: number; name: string; attack: Attack; weakness: Weakness; ingredients: Suggestion[] };
export type Point = { x: number; y: number };
export type Hazard = Point & { vx: number; vy: number; radius: number; life: number };
export type State = {
  roundId: string; seed: number; phase: Phase; remaining: number; paused: boolean; threshold: number;
  suggestions: Suggestion[]; recipes: Recipe[]; votes: Record<string, number>; winner: number | null; selected: Recipe | null;
  player: Point; monster: Point; hazards: Hazard[]; target: Point; hearts: number; invulnerable: number;
  elapsed: number; cycle: number; telegraph: boolean; help: Record<string, number>; helpUsed: Record<string, number>;
  rescueUntil: number; cooldownUntil: number; rescues: number; outcome: 'SURVIVED' | 'CAUGHT' | null;
  notice: string; saveStatus: string; provenance: 'original-fallback';
  mode: 'sample' | 'twitch'; channel: string | null; twitch?: TwitchView;
};
export const SIZE = { width: 960, height: 600 };
export const ATTACKS: Record<Attack, string> = { charge: 'Charge · locks onto your position, then lunges', bounce: 'Bounce · ricochets around the arena', burst: 'Burst · fires a ring of dodgeable projectiles' };
export const WEAKNESSES: Record<Weakness, string> = { stun: 'Stun · freezes attacks for 4 seconds', slow: 'Slow · halves attack speed for 4 seconds', soften: 'Soften · shrinks danger zones for 4 seconds' };
export const PARTICIPANTS = [{ id: 'sample-moss', name: 'Moss (sample)' }, { id: 'sample-pixel', name: 'Pixel (sample)' }, { id: 'sample-bean', name: 'Bean (sample)' }];
const categories: Category[] = ['body', 'power', 'weakness'];
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
export function initialState(seed = 42, roundId = 'sample'): State {
  return { roundId, seed, phase: 'LOBBY', remaining: 0, paused: false, threshold: 3, suggestions: [], recipes: [], votes: {}, winner: null, selected: null, player: { x: 480, y: 470 }, monster: { x: 480, y: 200 }, target: { x: 480, y: 470 }, hazards: [], hearts: 3, invulnerable: 0, elapsed: 0, cycle: 0, telegraph: false, help: {}, helpUsed: {}, rescueUntil: 0, cooldownUntil: 0, rescues: 0, outcome: null, notice: 'Your chat. Your creature. Your problem.', saveStatus: '', provenance: 'original-fallback', mode: 'sample', channel: null };
}
export function cleanText(value: unknown, max = 80): string {
  if (typeof value !== 'string') throw new Error('Text required.');
  const text = value.trim();
  if (!text || text.length > max || /[\u0000-\u001f\u007f<>]/u.test(text) || /https?:\/\/|www\./i.test(text)) throw new Error(`Use 1–${max} characters, without links, markup or control characters.`);
  return text;
}
function mapAttack(text: string): Attack { return /bounc|ricochet|hop/i.test(text) ? 'bounce' : /burst|shoot|projectile|spit/i.test(text) ? 'burst' : 'charge'; }
function mapWeakness(text: string): Weakness { return /slow|sticky|syrup/i.test(text) ? 'slow' : /soft|small|tiny/i.test(text) ? 'soften' : 'stun'; }
function pick(seed: number, length: number) { let x = seed | 0; x ^= x << 13; x ^= x >>> 17; x ^= x << 5; return (x >>> 0) % length; }
export class Game {
  state: State;
  movement: Point = { x: 0, y: 0 };
  private seen = new Set<string>();
  private velocity: Point = { x: 200, y: 140 };
  private burstIndex = 0;
  constructor(seed = 42, roundId = 'sample') { this.state = initialState(seed, roundId); }
  reset(seed: number, roundId: string) { const { threshold, mode } = this.state; this.state = initialState(seed, roundId); this.state.threshold = threshold; this.state.mode = mode; this.seen.clear(); this.movement = { x: 0, y: 0 }; this.velocity = { x: 200, y: 140 }; this.burstIndex = 0; }
  start() { this.require('LOBBY'); this.state.phase = 'COLLECT'; this.state.remaining = 30; this.state.notice = 'Invent something we probably should not bring to life.'; }
  require(phase: Phase) { if (this.state.phase !== phase || this.state.paused) throw new Error(`Action requires unpaused ${phase}.`); }
  input(eventId: string, user: string, name: string, command: string): string {
    if (this.seen.has(eventId)) return 'Duplicate ignored.';
    if (this.seen.size >= 10000) throw new Error('Round input limit reached.');
    cleanText(eventId, 100); cleanText(user, 80); cleanText(name, 40);
    if (['__proto__', 'constructor', 'prototype'].includes(user)) throw new Error('Invalid user identity.');
    if (typeof command !== 'string' || command.length > 100) throw new Error('Command too long.');
    if (this.state.paused) throw new Error('Round paused.');
    const match = /^!(body|power|weakness|vote|help)(?:\s+(.*))?$/i.exec(command.trim());
    if (!match) throw new Error('Use the command shown for this phase.');
    const key = match[1].toLowerCase(); const value = match[2]; const s = this.state;
    if (key === 'vote') {
      this.require('SELECT'); if (s.remaining <= 0) throw new Error('Voting closed; waiting for host approval.');
      if (!value || !/^[123]$/.test(value)) throw new Error('Vote 1, 2 or 3.');
      s.votes[user] = Number(value) - 1;
    } else if (key === 'help') {
      this.require('PLAY'); if (value) throw new Error('Use !help without extra text.');
      if (s.elapsed < s.cooldownUntil) throw new Error('Rescue cooling down.');
      if (s.helpUsed[user] !== undefined && s.elapsed - s.helpUsed[user] < 15) throw new Error('One help per viewer per 15 seconds.');
      s.help[user] = s.elapsed; s.helpUsed[user] = s.elapsed;
      this.pruneHelp();
      if (Object.keys(s.help).length >= s.threshold) { s.rescueUntil = s.elapsed + 4; s.cooldownUntil = s.elapsed + 10; s.help = {}; s.rescues++; s.notice = 'CHAT TO THE RESCUE!'; }
    } else {
      this.require('COLLECT'); const text = cleanText(value); const category = key as Category;
      const existing = s.suggestions.findIndex(x => x.user === user && x.category === category);
      const suggestion: Suggestion = { id: eventId, user, name, category, text, approved: false };
      if (existing >= 0) s.suggestions[existing] = suggestion;
      else { if (s.suggestions.length >= 150) throw new Error('Suggestion queue full.'); s.suggestions.push(suggestion); }
    }
    this.seen.add(eventId); return key === 'help' ? 'Help accepted.' : key === 'vote' ? 'Vote counted.' : 'Queued for host approval.';
  }
  moderate(id: string, approved: boolean) { this.require('COLLECT'); const suggestion = this.state.suggestions.find(x => x.id === id); if (!suggestion) throw new Error('Suggestion no longer exists.'); suggestion.approved = approved; }
  assemble() {
    this.require('COLLECT'); const s = this.state;
    const defaults = ['Jelly knight', 'Charging hugs', 'Rubber ducks'];
    const pools = categories.map((category, index) => {
      const pool = s.suggestions.filter(x => x.category === category && x.approved);
      return pool.length ? pool : [{ id: `house-${category}`, user: 'house', name: 'House suggestion', category, text: defaults[index], approved: true, house: true }];
    });
    s.recipes = [0, 1, 2].map(index => {
      const ingredients = pools.map((pool, category) => ({ ...pool[(index + pick(s.seed + category * 7, pool.length)) % pool.length] }));
      return { id: index, name: ['Sir Wobbleton', 'Professor Boing', 'The Midnight Munch'][index], attack: mapAttack(ingredients[1].text), weakness: mapWeakness(ingredients[2].text), ingredients };
    });
    s.phase = 'SELECT'; s.remaining = 15; s.notice = 'Three recipes. One very questionable idea.';
  }
  chooseWinner() { const s = this.state; const counts = s.recipes.map(r => Object.values(s.votes).filter(v => v === r.id).length); const best = Math.max(...counts); const tied = s.recipes.filter((_, i) => counts[i] === best); s.winner = tied[pick(s.seed, tied.length)].id; }
  closeVoting() { this.require('SELECT'); this.state.remaining = 0; this.chooseWinner(); }
  approve() {
    this.require('SELECT'); const s = this.state; if (s.remaining > 0) throw new Error('Close voting first.');
    if (s.winner === null) this.chooseWinner(); s.selected = s.recipes.find(x => x.id === s.winner)!;
    s.phase = 'GENERATE'; s.remaining = 2; s.notice = 'Preparing original fallback artwork · no AI request.';
  }
  reject(reason: string) { this.require('SELECT'); cleanText(reason, 100); const s = this.state; s.notice = `Host rejected selection: ${reason}`; s.phase = 'COLLECT'; s.remaining = 30; s.recipes = []; s.votes = {}; s.winner = null; s.suggestions.forEach(x => { x.approved = false; }); }
  reveal() { this.require('GENERATE'); this.state.phase = 'REVEAL'; this.state.remaining = 0; this.state.notice = 'You made it. Now survive it.'; }
  play() { this.require('REVEAL'); this.state.phase = 'PLAY'; this.state.remaining = 60; this.state.notice = 'Keep moving. Chat has your back.'; this.movement = { x: 0, y: 0 }; }
  pause() { if (['LOBBY', 'RESULT'].includes(this.state.phase)) throw new Error('Nothing to pause.'); this.state.paused = !this.state.paused; this.movement = { x: 0, y: 0 }; }
  private pruneHelp() { const s = this.state; for (const [user, time] of Object.entries(s.help)) if (s.elapsed - time >= 15) delete s.help[user]; }
  tick(dt: number) {
    const s = this.state; if (s.paused || dt <= 0 || !Number.isFinite(dt)) return;
    if (s.phase === 'COLLECT' || s.phase === 'SELECT' || s.phase === 'GENERATE') {
      s.remaining = Math.max(0, s.remaining - dt);
      if (s.remaining === 0) { if (s.phase === 'COLLECT') this.assemble(); else if (s.phase === 'GENERATE') this.reveal(); else if (s.winner === null) this.chooseWinner(); }
      return;
    }
    if (s.phase !== 'PLAY') return;
    s.elapsed += dt; s.remaining = Math.max(0, 60 - s.elapsed); this.pruneHelp();
    const length = Math.hypot(this.movement.x, this.movement.y) || 1;
    s.player.x = clamp(s.player.x + this.movement.x / length * 260 * dt, 20, 940);
    s.player.y = clamp(s.player.y + this.movement.y / length * 260 * dt, 20, 580);
    s.invulnerable = Math.max(0, s.invulnerable - dt);
    const rescued = s.elapsed < s.rescueUntil; const weakness = s.selected!.weakness;
    const speed = rescued && weakness === 'slow' ? 0.5 : 1;
    const soft = rescued && weakness === 'soften';
    if (!(rescued && weakness === 'stun')) {
      const before = s.cycle; s.cycle += dt * speed;
      if (before === 0) s.target = { ...s.player };
      s.telegraph = s.cycle < 1;
      if (s.cycle >= 1 && before < 1) {
        const dx = s.target.x - s.monster.x, dy = s.target.y - s.monster.y; const d = Math.hypot(dx, dy) || 1;
        this.velocity = { x: dx / d * 390, y: dy / d * 390 };
        if (s.selected!.attack === 'burst') {
          // Rotate successive rings so one safe angle does not solve every attack.
          const rotation = (s.seed % 10) * 0.1 + this.burstIndex++ * 0.37;
          for (let i = 0; i < 10; i++) { const angle = i * Math.PI / 5 + rotation; s.hazards.push({ ...s.monster, vx: Math.cos(angle) * 170, vy: Math.sin(angle) * 170, radius: 9, life: 5 }); }
        }
      }
      if (s.cycle >= 1 && s.selected!.attack !== 'burst') {
        s.monster.x += this.velocity.x * dt * speed; s.monster.y += this.velocity.y * dt * speed;
        if (s.monster.x < 45 || s.monster.x > 915) { this.velocity.x *= -1; s.monster.x = clamp(s.monster.x, 45, 915); }
        if (s.monster.y < 45 || s.monster.y > 555) { this.velocity.y *= -1; s.monster.y = clamp(s.monster.y, 45, 555); }
        if (s.selected!.attack === 'charge' && s.cycle > 1.65) this.velocity = { x: 0, y: 0 };
      }
      if (s.cycle >= (s.selected!.attack === 'bounce' ? 3.5 : 2.7)) s.cycle = 0;
      for (const h of s.hazards) { h.x += h.vx * dt * speed; h.y += h.vy * dt * speed; h.life -= dt; }
      s.hazards = s.hazards.filter(h => h.life > 0 && h.x > -20 && h.x < 980 && h.y > -20 && h.y < 620);
    }
    const hit = Math.hypot(s.player.x - s.monster.x, s.player.y - s.monster.y) < (soft ? 30 : 48) || s.hazards.some(h => Math.hypot(s.player.x - h.x, s.player.y - h.y) < (soft ? 16 : 24));
    if (hit && s.invulnerable === 0 && !(rescued && weakness === 'stun')) { s.hearts--; s.invulnerable = 1.5; }
    if (s.hearts <= 0 || s.remaining === 0) { s.outcome = s.hearts <= 0 ? 'CAUGHT' : 'SURVIVED'; s.phase = 'RESULT'; s.notice = s.outcome === 'SURVIVED' ? 'Made by chat. Survived together.' : 'Chat may have overdone it.'; this.movement = { x: 0, y: 0 }; }
  }
  snapshot(host = false): State { const s = structuredClone(this.state); if (!host) { s.suggestions = s.suggestions.filter(x => x.approved); s.votes = Object.fromEntries(s.recipes.map(r => [String(r.id), Object.values(s.votes).filter(v => v === r.id).length])); s.help = Object.fromEntries(Object.values(s.help).map((time, i) => [String(i), time])); s.helpUsed = {}; } return s; }
}
