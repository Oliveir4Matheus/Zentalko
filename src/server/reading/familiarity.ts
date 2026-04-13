/**
 * Word familiarity state machine for the reading view.
 *
 * Linear advancement: Unknown → New → Learning → Known.
 * `Ignored` is a side-state reached via the "ignore" action from anywhere.
 * Colors are applied to the word's BACKGROUND (per product spec).
 */

export const Familiarity = {
  Unknown: 'Unknown',
  New: 'New',
  Learning: 'Learning',
  Known: 'Known',
  Ignored: 'Ignored',
} as const;

export type Familiarity = (typeof Familiarity)[keyof typeof Familiarity];

export type FamiliarityAction = 'advance' | 'ignore' | 'reset';

const ADVANCE_CHAIN: Familiarity[] = [
  Familiarity.Unknown,
  Familiarity.New,
  Familiarity.Learning,
  Familiarity.Known,
];

export function nextFamiliarity(
  current: Familiarity,
  action: FamiliarityAction,
): Familiarity {
  if (action === 'ignore') return Familiarity.Ignored;
  if (action === 'reset') return Familiarity.New;

  const idx = ADVANCE_CHAIN.indexOf(current);
  if (idx === -1) return current;
  return ADVANCE_CHAIN[Math.min(idx + 1, ADVANCE_CHAIN.length - 1)];
}

const COLORS: Record<Familiarity, string> = {
  Unknown: 'grey',
  New: 'red',
  Learning: 'yellow',
  Known: 'green',
  Ignored: 'none',
};

export function colorFor(f: Familiarity): string {
  return COLORS[f];
}
