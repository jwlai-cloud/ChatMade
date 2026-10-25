import test from 'node:test';
import assert from 'node:assert/strict';
import { Game, ATTACKS, PARTICIPANTS, type Attack, type Weakness } from '../shared/game.js';
import { applyAction, validToken } from '../server/index.js';

function ready(attack: Attack = 'charge', weakness: Weakness = 'stun') { const g = new Game(); g.start(); g.assemble(); g.closeVoting(); g.approve(); g.reveal(); g.state.selected!.attack = attack; g.state.selected!.weakness = weakness; g.play(); return g; }
test('suggestion replacement requires renewed moderation; private queue stays off broadcast', () => {
  const g = new Game(); g.start(); g.input('e1', 'u', 'Viewer', '!body Blob');
  assert.equal(g.snapshot().suggestions.length, 0); g.moderate('e1', true); assert.equal(g.snapshot().suggestions.length, 1);
  g.input('e2', 'u', 'Viewer', '!body Jelly knight'); assert.equal(g.state.suggestions.length, 1); assert.equal(g.snapshot().suggestions.length, 0);
  assert.throws(() => g.input('e3', 'u', 'Viewer', '!power <script>')); assert.throws(() => g.input('e4', 'u', 'Viewer', '!body https://example.com'));
});
test('duplicate events ignored and latest vote replaces earlier vote', () => {
  const g = new Game(); g.start(); g.assemble();
  g.input('one', 'u', 'Viewer', '!vote 1'); g.input('one', 'u', 'Viewer', '!vote 2'); assert.equal(g.state.votes.u, 0);
  g.input('two', 'u', 'Viewer', '!vote 3'); assert.deepEqual(Object.values(g.state.votes), [2]);
  g.closeVoting(); assert.equal(g.state.winner, 2); assert.throws(() => g.input('late', 'v', 'Late', '!vote 1'));
});
test('seed resolves ties and no votes reproducibly; host approval never automatic', () => {
  const a = new Game(51), b = new Game(51);
  for (const g of [a, b]) { g.start(); g.tick(30); assert.equal(g.state.phase, 'SELECT'); g.tick(30); assert.equal(g.state.phase, 'SELECT'); assert.equal(g.state.selected, null); }
  assert.equal(a.state.winner, b.state.winner);
  assert.ok(a.state.recipes.every(r => r.ingredients.every(i => i.house && i.name === 'House suggestion')));
});
test('selected credits match approved input and unsupported power maps honestly', () => {
  const g = new Game(); g.start(); g.input('1', 'u', 'Moss', '!power Magnetic pull'); g.moderate('1', true); g.assemble();
  assert.equal(g.state.recipes[0].attack, 'charge'); assert.match(ATTACKS[g.state.recipes[0].attack], /Charge/); assert.equal(g.state.recipes[0].ingredients[1].name, 'Moss');
});
test('rescue needs unique users; cooldown and rolling window prevent repeat help', () => {
  const g = ready(); g.input('1', 'a', 'A', '!help'); assert.throws(() => g.input('2', 'a', 'A', '!help'));
  g.input('3', 'b', 'B', '!help'); assert.equal(g.state.rescues, 0); g.input('4', 'c', 'C', '!help'); assert.equal(g.state.rescues, 1);
  assert.throws(() => g.input('5', 'd', 'D', '!help')); g.state.elapsed = 11; assert.throws(() => g.input('6', 'a', 'A', '!help'));
  g.state.elapsed = 16; g.input('7', 'a', 'A', '!help'); assert.equal(Object.keys(g.state.help).length, 1);
  g.state.elapsed = 32; g.tick(1 / 60); assert.equal(Object.keys(g.state.help).length, 0);
});
test('pause freezes clock, physics and rescue; reset clears transient round state', () => {
  const g = ready(); g.input('1', 'a', 'A', '!help'); g.movement = { x: 1, y: 1 }; g.pause(); const snapshot = structuredClone(g.state); g.tick(10); assert.deepEqual(g.state, snapshot);
  assert.throws(() => g.input('2', 'b', 'B', '!help')); g.pause(); g.reset(42, 'next'); assert.equal(g.state.phase, 'LOBBY'); assert.equal(g.state.hearts, 3); assert.deepEqual(g.state.help, {}); assert.deepEqual(g.movement, { x: 0, y: 0 });
});
test('collision costs one heart and grants invulnerability; zero hearts means CAUGHT', () => {
  const g = ready(); g.state.player = { ...g.state.monster }; g.tick(1 / 60); assert.equal(g.state.hearts, 2); g.tick(1 / 60); assert.equal(g.state.hearts, 2);
  g.state.hearts = 1; g.state.invulnerable = 0; g.tick(1 / 60); assert.equal(g.state.outcome, 'CAUGHT'); assert.equal(g.state.phase, 'RESULT');
});
test('survival and all attacks are deterministic and stay bounded', () => {
  for (const attack of ['charge', 'bounce', 'burst'] as const) {
    const a = ready(attack), b = ready(attack); a.state.invulnerable = b.state.invulnerable = 100;
    for (let i = 0; i < 3601; i++) { a.movement = b.movement = { x: Math.sin(i / 90) > 0 ? 1 : -1, y: 1 }; a.tick(1 / 60); b.tick(1 / 60); }
    assert.deepEqual(a.state, b.state); assert.equal(a.state.outcome, 'SURVIVED'); assert.ok(a.state.player.x >= 20 && a.state.player.x <= 940); assert.ok(a.state.hazards.length <= 30);
  }
});
test('host action boundary rejects malformed values, phases and unknown sample identities', () => {
  const g = new Game(); assert.throws(() => applyAction(g, { type: 'move', x: NaN, y: 0 })); assert.throws(() => applyAction(g, { type: 'settings', seed: 1, threshold: 0 }));
  assert.throws(() => applyAction(g, { type: 'approve' })); assert.throws(() => applyAction(g, { type: 'sample', user: 'someone', command: '!help', eventId: 'x' }));
  assert.equal(validToken('abc', 'abc'), true); assert.equal(validToken('ab', 'abc'), false); assert.equal(validToken({}, 'abc'), false);
});
test('three sample participants traverse the complete loop', () => {
  const g = new Game(); applyAction(g, { type: 'start' }); applyAction(g, { type: 'seed-samples' });
  for (const idea of g.state.suggestions) g.moderate(idea.id, true);
  g.assemble(); PARTICIPANTS.forEach((p, i) => g.input(`vote-${i}`, p.id, p.name, '!vote 2')); g.closeVoting(); g.approve(); g.tick(2); assert.equal(g.state.phase, 'REVEAL'); g.play();
  PARTICIPANTS.forEach((p, i) => g.input(`help-${i}`, p.id, p.name, '!help')); assert.equal(g.state.rescues, 1); assert.equal(g.state.selected!.id, 1);
  g.state.invulnerable = 100; for (let i = 0; i < 3601; i++) g.tick(1 / 60); assert.equal(g.state.outcome, 'SURVIVED');
});
test('successive projectile rings rotate while a reset reproduces the first ring', () => {
  const g = ready('burst'); g.state.invulnerable = 100;
  for (let i = 0; i < 61; i++) g.tick(1 / 60);
  const first = { vx: g.state.hazards[0].vx, vy: g.state.hazards[0].vy };
  g.state.hazards = []; g.state.cycle = 0;
  for (let i = 0; i < 61; i++) g.tick(1 / 60);
  assert.notEqual(g.state.hazards[0].vx, first.vx);
  g.reset(42, 'reset'); g.start(); g.assemble(); g.closeVoting(); g.approve(); g.reveal(); g.state.selected!.attack = 'burst'; g.play();
  for (let i = 0; i < 61; i++) g.tick(1 / 60);
  assert.deepEqual({ vx: g.state.hazards[0].vx, vy: g.state.hazards[0].vy }, first);
});
test('rescue effects freeze, slow or shrink danger without changing the survival clock', () => {
  const stun = ready('charge', 'stun'); stun.state.rescueUntil = 4; stun.state.player = { ...stun.state.monster };
  const monster = { ...stun.state.monster }; stun.tick(1 / 60);
  assert.deepEqual(stun.state.monster, monster); assert.equal(stun.state.hearts, 3); assert.ok(stun.state.elapsed > 0);
  const normal = ready('bounce'), slow = ready('bounce', 'slow');
  normal.state.cycle = slow.state.cycle = 1.2; slow.state.rescueUntil = 4;
  normal.tick(1 / 60); slow.tick(1 / 60);
  assert.ok(Math.abs((normal.state.monster.x - 480) / 2 - (slow.state.monster.x - 480)) < 1e-8);
  const soft = ready('charge', 'soften'), full = ready(); soft.state.rescueUntil = 4;
  soft.state.player = full.state.player = { x: 520, y: 200 }; soft.tick(1 / 60); full.tick(1 / 60);
  assert.equal(soft.state.hearts, 3); assert.equal(full.state.hearts, 2);
});
