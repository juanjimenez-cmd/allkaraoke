import getScoreRatingV2 from '~/routes/game/singing/post-game/helpers/get-score-rating-v2';

describe('getScoreRatingV2', () => {
  it.each([
    [0, 'Keep singing'],
    [2_999, 'Keep singing'],
    [3_000, 'Good'],
    [4_999, 'Good'],
    [5_000, 'Great'],
    [6_999, 'Great'],
    [7_000, 'Excellent'],
    [8_499, 'Excellent'],
    [8_500, 'Amazing'],
    [9_499, 'Amazing'],
    [9_500, 'Superstar'],
    [9_999, 'Superstar'],
    [10_000, 'Perfect'],
  ] as const)('rates %i as %s', (score, rating) => {
    expect(getScoreRatingV2(score)).toBe(rating);
  });
});
