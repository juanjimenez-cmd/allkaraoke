import {
  areLegacyHighScoresEnabled,
  isScoringV2Enabled,
  SCORING_ENGINE,
} from '~/modules/game-engine/game-state/scoring-engine';

describe('scoring engine selection', () => {
  it('uses Scoring V2 by default on this branch', () => {
    expect(SCORING_ENGINE).toBe('v2');
    expect(isScoringV2Enabled()).toBe(true);
  });

  it('does not mix V2 scores into legacy high-score persistence or presentation', () => {
    expect(areLegacyHighScoresEnabled('v2')).toBe(false);
    expect(areLegacyHighScoresEnabled('legacy')).toBe(true);
  });
});
