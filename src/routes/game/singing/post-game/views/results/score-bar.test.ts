import getScoreBarProgress from '~/routes/game/singing/post-game/helpers/get-score-bar-progress';

describe('getScoreBarProgress', () => {
  it.each([
    [0, 0],
    [5_000, 0.5],
    [10_000, 1],
    [12_000, 1],
    [-10, 0],
  ])('normalizes %i against 10,000 to %f', (score, expected) => {
    expect(getScoreBarProgress(score, 10_000)).toBe(expected);
  });

  it('returns zero for non-finite inputs', () => {
    expect(getScoreBarProgress(Number.NaN, 10_000)).toBe(0);
    expect(getScoreBarProgress(5_000, Number.POSITIVE_INFINITY)).toBe(0);
  });
});
