// apps/api/src/modules/generation/application/blooms-allocation.util.ts
//
// Converts assessment-wide percentage distributions (from Step 4 of the
// wizard) into a concrete, ordered list of per-question targets for a
// single question-type batch. E.g. { APPLY: 60, EVALUATE: 40 } with
// questionCount=5 becomes [APPLY, APPLY, APPLY, EVALUATE, EVALUATE].
//
// Uses the "largest remainder" rounding method so the allocated counts
// sum exactly to questionCount even when percentages don't divide evenly
// (e.g. 3 questions at 33/33/34% would otherwise round to 2 total).

/**
 * Allocates `count` items across the levels in `distribution` (percentage
 * map) proportionally, returning a flat array of length `count` where
 * each entry is one of the distribution's keys.
 */
export function allocateByDistribution<T extends string>(
  distribution: Record<T, number>,
  count: number,
): T[] {
  const levels = Object.keys(distribution) as T[];

  // Levels with 0% shouldn't receive any allocation, even if rounding
  // would otherwise give them one -- filter those out up front.
  const activeLevels = levels.filter((level) => distribution[level] > 0);

  if (activeLevels.length === 0 || count === 0) {
    return [];
  }

  // Step 1: compute the raw (fractional) share of `count` each level
  // should get, then take the floor as a starting allocation.
  const rawShares = activeLevels.map((level) => (distribution[level] / 100) * count);
  const flooredShares = rawShares.map(Math.floor);
  const remainders = rawShares.map((raw, i) => raw - flooredShares[i]);

  let allocated = flooredShares.reduce((sum, n) => sum + n, 0);
  let remaining = count - allocated;

  // Step 2: distribute the leftover items (due to flooring) to the
  // levels with the largest fractional remainders first -- this is the
  // standard "largest remainder" apportionment method, which minimizes
  // distortion from the true percentage split.
  const order = activeLevels
    .map((level, i) => ({ level, remainder: remainders[i] }))
    .sort((a, b) => b.remainder - a.remainder);

  const finalCounts = new Map<T, number>(
    activeLevels.map((level, i) => [level, flooredShares[i]]),
  );

  for (let i = 0; i < remaining; i++) {
    const level = order[i % order.length].level;
    finalCounts.set(level, (finalCounts.get(level) ?? 0) + 1);
  }

  // Step 3: flatten into the final ordered array, e.g.
  // Map{APPLY: 3, EVALUATE: 2} -> [APPLY, APPLY, APPLY, EVALUATE, EVALUATE]
  const result: T[] = [];
  for (const level of activeLevels) {
    const n = finalCounts.get(level) ?? 0;
    for (let i = 0; i < n; i++) {
      result.push(level);
    }
  }

  return result;
}