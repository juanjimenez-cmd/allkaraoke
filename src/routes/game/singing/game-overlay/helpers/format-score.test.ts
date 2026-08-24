import {
  formatScoreV2,
  getRoundedScoreV2,
  scoreFormatter,
} from '~/routes/game/singing/game-overlay/helpers/format-score';

describe('Scoring V2 display formatting', () => {
  it.each([8_742, 10_000])('formats %i as a localized integer', (score) => {
    expect(formatScoreV2(score)).toBe(scoreFormatter.format(score));
  });

  it('rounds and clamps scores to the V2 display range', () => {
    expect(getRoundedScoreV2(1_234.6)).toBe(1_235);
    expect(getRoundedScoreV2(-50)).toBe(0);
    expect(getRoundedScoreV2(12_000)).toBe(10_000);
    expect(getRoundedScoreV2(Number.NaN)).toBe(0);
  });
});
