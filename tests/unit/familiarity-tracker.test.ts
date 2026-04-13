import { describe, it, expect } from 'vitest';
// @ts-expect-error — module not implemented yet (Red phase).
import {
  nextFamiliarity,
  colorFor,
  Familiarity,
  // @ts-expect-error
} from '@/server/reading/familiarity';

/**
 * Familiarity state machine for reading view.
 * States: Unknown(grey), New(red), Learning(yellow), Known(green), Ignored(none).
 * Advancing is strictly linear: Unknown → New → Learning → Known.
 */
describe('familiarity tracker', () => {
  it('should start at Unknown for a never-seen word', () => {
    expect(Familiarity.Unknown).toBeDefined();
    expect(colorFor(Familiarity.Unknown)).toBe('grey');
  });

  it('should advance Unknown → New → Learning → Known on successive marks', () => {
    let f: Familiarity = Familiarity.Unknown;

    f = nextFamiliarity(f, 'advance');
    expect(f).toBe(Familiarity.New);
    f = nextFamiliarity(f, 'advance');
    expect(f).toBe(Familiarity.Learning);
    f = nextFamiliarity(f, 'advance');
    expect(f).toBe(Familiarity.Known);
  });

  it('should map each familiarity level to the correct background color', () => {
    expect(colorFor(Familiarity.Unknown)).toBe('grey');
    expect(colorFor(Familiarity.New)).toBe('red');
    expect(colorFor(Familiarity.Learning)).toBe('yellow');
    expect(colorFor(Familiarity.Known)).toBe('green');
    expect(colorFor(Familiarity.Ignored)).toBe('none');
  });

  it('should be idempotent at Known when advancing further', () => {
    const f = nextFamiliarity(Familiarity.Known, 'advance');

    expect(f).toBe(Familiarity.Known);
  });

  it('should jump directly to Ignored on the "ignore" action from any state', () => {
    expect(nextFamiliarity(Familiarity.Unknown, 'ignore')).toBe(Familiarity.Ignored);
    expect(nextFamiliarity(Familiarity.Learning, 'ignore')).toBe(Familiarity.Ignored);
  });

  it('should reset to New on the "reset" action', () => {
    expect(nextFamiliarity(Familiarity.Known, 'reset')).toBe(Familiarity.New);
  });
});
