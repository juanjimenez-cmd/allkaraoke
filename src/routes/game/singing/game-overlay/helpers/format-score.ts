import { MAX_SCORE } from '~/modules/game-engine/game-state/helpers/calculate-score-v2';

export const scoreFormatter = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 });

export const getRoundedScore = (score: number, maximum = Number.POSITIVE_INFINITY) => {
  if (!Number.isFinite(score)) return 0;
  return Math.round(Math.min(Math.max(score, 0), maximum));
};

export const getRoundedScoreV2 = (score: number) => getRoundedScore(score, MAX_SCORE);

export const formatScore = (score: number) => scoreFormatter.format(Number.isFinite(score) ? score : 0);

export const formatScoreV2 = (score: number) => scoreFormatter.format(getRoundedScoreV2(score));
