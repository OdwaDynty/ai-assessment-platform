// apps/api/src/modules/generation/application/blooms-allocation.util.spec.ts
//
// Tests the largest-remainder allocation logic used to convert
// assessment-wide percentage distributions into concrete per-question
// targets for a generation batch. This is exactly the kind of pure
// logic that's easy to get subtly wrong with rounding edge cases, and
// hard to manually re-verify every time -- a real test suite here
// protects against silent regressions.

import { allocateByDistribution } from './blooms-allocation.util';

describe('allocateByDistribution', () => {
  it('allocates a clean even split exactly', () => {
    const result = allocateByDistribution({ APPLY: 60, EVALUATE: 40 }, 5);
    expect(result.filter((x) => x === 'APPLY')).toHaveLength(3);
    expect(result.filter((x) => x === 'EVALUATE')).toHaveLength(2);
    expect(result).toHaveLength(5);
  });

  it('handles an uneven split using largest-remainder rounding', () => {
    // 33/33/34 of 3 questions: naive flooring would give 0/0/1 = 1 total,
    // losing 2 questions. Largest-remainder must distribute the leftover
    // 2 items to the levels with the largest fractional remainders.
    const result = allocateByDistribution(
      { EASY: 33, MEDIUM: 33, HARD: 34 },
      3,
    );
    expect(result).toHaveLength(3);
  });

  it('excludes levels with 0%, even if flooring would otherwise round them up', () => {
    const result = allocateByDistribution(
      { REMEMBER: 0, UNDERSTAND: 100 },
      5,
    );
    expect(result.every((x) => x === 'UNDERSTAND')).toBe(true);
    expect(result).not.toContain('REMEMBER');
  });

  it('returns an empty array when count is 0', () => {
    const result = allocateByDistribution({ EASY: 50, HARD: 50 }, 0);
    expect(result).toEqual([]);
  });

  it('returns an empty array when every level is 0%', () => {
    const result = allocateByDistribution({ EASY: 0, HARD: 0 }, 5);
    expect(result).toEqual([]);
  });

  it('handles a single level at 100%', () => {
    const result = allocateByDistribution({ MEDIUM: 100 }, 4);
    expect(result).toEqual(['MEDIUM', 'MEDIUM', 'MEDIUM', 'MEDIUM']);
  });

  it('always returns exactly `count` items regardless of rounding', () => {
    // A stress case with several levels and a count that doesn't divide
    // evenly across any of them -- the real risk case for rounding bugs.
    const distribution = { REMEMBER: 17, UNDERSTAND: 23, APPLY: 15, ANALYZE: 20, EVALUATE: 12, CREATE: 13 };
    for (const count of [1, 2, 3, 5, 7, 11, 13, 20]) {
      const result = allocateByDistribution(distribution, count);
      expect(result).toHaveLength(count);
    }
  });

  it('produces a result whose per-level counts are proportional within one unit of the target percentage', () => {
    const result = allocateByDistribution({ APPLY: 60, EVALUATE: 40 }, 10);
    const applyCount = result.filter((x) => x === 'APPLY').length;
    const evaluateCount = result.filter((x) => x === 'EVALUATE').length;
    expect(applyCount).toBe(6);
    expect(evaluateCount).toBe(4);
  });
});