import { MAX_SCORE } from '~/modules/game-engine/game-state/helpers/calculate-score-v2';

export type ScoreRatingV2 = 'Keep singing' | 'Good' | 'Great' | 'Excellent' | 'Amazing' | 'Superstar' | 'Perfect';

export default function getScoreRatingV2(score: number): ScoreRatingV2 {
  const safeScore = Number.isFinite(score) ? Math.min(Math.max(Math.round(score), 0), MAX_SCORE) : 0;

  if (safeScore === MAX_SCORE) return 'Perfect';
  if (safeScore >= 9_500) return 'Superstar';
  if (safeScore >= 8_500) return 'Amazing';
  if (safeScore >= 7_000) return 'Excellent';
  if (safeScore >= 5_000) return 'Great';
  if (safeScore >= 3_000) return 'Good';
  return 'Keep singing';
}
