import getOverlayScore from '~/routes/game/singing/game-overlay/helpers/get-overlay-score';

describe('getOverlayScore', () => {
  it('shows zero before any V2 notes have been sung', () => {
    expect(getOverlayScore(0, 'v2')).toBe(0);
  });

  it('rounds the live V2 score', () => {
    expect(getOverlayScore(8_741.6, 'v2')).toBe(8_742);
  });

  it('never exposes more than 10,000 or a non-finite V2 score', () => {
    expect(getOverlayScore(10_001, 'v2')).toBe(10_000);
    expect(getOverlayScore(Number.NaN, 'v2')).toBe(0);
  });

  it('does not change the legacy score path', () => {
    expect(getOverlayScore(1_234.5, 'legacy')).toBe(1_234.5);
  });
});
