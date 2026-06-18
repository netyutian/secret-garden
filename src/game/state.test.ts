// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { getDefaultAction, getActionLabel } from './state';
import { Plot } from './types';

function plot(state: Plot['state'], overrides: Partial<Plot> = {}): Plot {
  return { id: '0-0', x: 0, y: 0, state, flowerId: null, plantedAt: null, locked: false, ...overrides };
}

describe('getDefaultAction', () => {
  it('returns hoe for wild plots', () => {
    expect(getDefaultAction(plot('wild'))).toBe('hoe');
  });

  it('returns seed for tilled plots', () => {
    expect(getDefaultAction(plot('tilled'))).toBe('seed');
  });

  it('returns water for seed, sprout, growing plots', () => {
    expect(getDefaultAction(plot('seed'))).toBe('water');
    expect(getDefaultAction(plot('sprout'))).toBe('water');
    expect(getDefaultAction(plot('growing'))).toBe('water');
  });

  it('returns wither for blooming plots', () => {
    expect(getDefaultAction(plot('blooming'))).toBe('wither');
  });

  it('returns shovel for withered plots', () => {
    expect(getDefaultAction(plot('withered'))).toBe('shovel');
  });

  it('returns null for locked plots', () => {
    expect(getDefaultAction(plot('wild', { locked: true }))).toBeNull();
  });
});

describe('getActionLabel', () => {
  it('returns Chinese action labels', () => {
    expect(getActionLabel(plot('wild'))).toBe('开荒');
    expect(getActionLabel(plot('tilled'))).toBe('播种');
    expect(getActionLabel(plot('seed'))).toBe('浇水');
    expect(getActionLabel(plot('sprout'))).toBe('浇水');
    expect(getActionLabel(plot('growing'))).toBe('浇水');
    expect(getActionLabel(plot('blooming'))).toBe('凋谢');
    expect(getActionLabel(plot('withered'))).toBe('铲除');
  });

  it('returns 解锁 for locked plots', () => {
    expect(getActionLabel(plot('wild', { locked: true }))).toBe('解锁');
  });
});
