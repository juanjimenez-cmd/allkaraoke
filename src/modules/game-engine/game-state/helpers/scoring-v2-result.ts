import {
  MAX_BONUS_SCORE,
  MAX_PERFECT_BONUS,
  MAX_PITCH_SCORE,
  MAX_SCORE,
  MAX_STAR_BONUS,
  MAX_STREAK_BONUS,
  MAX_TIMING_SCORE,
  MAX_VIBRATO_BONUS,
  ScoringV2Result,
} from '~/modules/game-engine/game-state/helpers/calculate-score-v2';

export const createEmptyScoringV2Result = (): ScoringV2Result => ({
  total: 0,
  pitch: 0,
  timing: 0,
  bonus: 0,
  bonusBreakdown: {
    perfect: 0,
    vibrato: 0,
    star: 0,
    streak: 0,
  },
  metrics: {
    pitchRatio: 0,
    timingRatio: 0,
    perfectRatio: 0,
    starRatio: 0,
    maxStreak: 0,
  },
});

const isWithinRange = (value: number, maximum: number) => Number.isFinite(value) && value >= 0 && value <= maximum;

export const isValidScoringV2Result = (result: ScoringV2Result) =>
  isWithinRange(result.total, MAX_SCORE) &&
  isWithinRange(result.pitch, MAX_PITCH_SCORE) &&
  isWithinRange(result.timing, MAX_TIMING_SCORE) &&
  isWithinRange(result.bonus, MAX_BONUS_SCORE) &&
  isWithinRange(result.bonusBreakdown.perfect, MAX_PERFECT_BONUS) &&
  isWithinRange(result.bonusBreakdown.vibrato, MAX_VIBRATO_BONUS) &&
  isWithinRange(result.bonusBreakdown.star, MAX_STAR_BONUS) &&
  isWithinRange(result.bonusBreakdown.streak, MAX_STREAK_BONUS) &&
  isWithinRange(result.metrics.pitchRatio, 1) &&
  isWithinRange(result.metrics.timingRatio, 1) &&
  isWithinRange(result.metrics.perfectRatio, 1) &&
  isWithinRange(result.metrics.starRatio, 1) &&
  Number.isFinite(result.metrics.maxStreak) &&
  result.metrics.maxStreak >= 0;

export const averageScoringV2Results = (results: ScoringV2Result[]): ScoringV2Result => {
  if (results.length === 0) return createEmptyScoringV2Result();

  const average = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;

  return {
    total: average(results.map(({ total }) => total)),
    pitch: average(results.map(({ pitch }) => pitch)),
    timing: average(results.map(({ timing }) => timing)),
    bonus: average(results.map(({ bonus }) => bonus)),
    bonusBreakdown: {
      perfect: average(results.map(({ bonusBreakdown }) => bonusBreakdown.perfect)),
      vibrato: average(results.map(({ bonusBreakdown }) => bonusBreakdown.vibrato)),
      star: average(results.map(({ bonusBreakdown }) => bonusBreakdown.star)),
      streak: average(results.map(({ bonusBreakdown }) => bonusBreakdown.streak)),
    },
    metrics: {
      pitchRatio: average(results.map(({ metrics }) => metrics.pitchRatio)),
      timingRatio: average(results.map(({ metrics }) => metrics.timingRatio)),
      perfectRatio: average(results.map(({ metrics }) => metrics.perfectRatio)),
      starRatio: average(results.map(({ metrics }) => metrics.starRatio)),
      maxStreak: Math.max(...results.map(({ metrics }) => metrics.maxStreak)),
    },
  };
};
