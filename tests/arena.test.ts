import test from 'node:test';
import assert from 'node:assert/strict';
import { initialState } from '../shared/game.js';
import { drawArena } from '../src/arena.js';

test('attack warnings remain visible during slow/soften rescue and disappear during stun', () => {
  for (const weakness of ['stun', 'slow', 'soften'] as const) {
    const s = initialState(); s.selected = { id: 0, name: 'Test', attack: 'charge', weakness, ingredients: [] }; s.telegraph = true; s.rescueUntil = 4;
    const dashCalls: number[][] = [];
    const ctx = new Proxy({ setLineDash: (dash: number[]) => dashCalls.push(dash) }, { get: (target, key) => Reflect.get(target, key) ?? (() => {}) }) as unknown as CanvasRenderingContext2D;
    drawArena(ctx, s, { complete: false } as HTMLImageElement);
    assert.equal(dashCalls.length > 0, weakness !== 'stun');
  }
});
