import { ScoringEngine } from '~/modules/game-engine/game-state/scoring-engine';
import { getRoundedScoreV2 } from '~/routes/game/singing/game-overlay/helpers/format-score';

export default function getOverlayScore(score: number, scoringEngine: ScoringEngine) {
  return scoringEngine === 'v2' ? getRoundedScoreV2(score) : score;
}
