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
import { PlayerNumber } from '~/modules/players/player-number';
import { formatScoreV2 } from '~/routes/game/singing/game-overlay/helpers/format-score';
import ScoreBar from '~/routes/game/singing/post-game/views/results/score-bar';

interface Props {
  playerNumber: PlayerNumber;
  result: ScoringV2Result;
  color: string;
}

const formatRatio = (ratio: number) => {
  if (!Number.isFinite(ratio)) return '0%';
  return `${Math.round(Math.min(Math.max(ratio, 0), 1) * 100)}%`;
};

const formatStreak = (streak: number) => (Number.isFinite(streak) ? Math.max(0, Math.floor(streak)) : 0);

function ScoreValue({
  label,
  score,
  maximum,
  testId,
}: {
  label: string;
  score: number;
  maximum: number;
  testId: string;
}) {
  return (
    <span className="whitespace-nowrap" data-test={testId}>
      {label} {formatScoreV2(score)} / {formatScoreV2(maximum)}
    </span>
  );
}

export default function PlayerDetailedScoreV2({ playerNumber, result, color }: Props) {
  return (
    <div
      className="typography flex w-full flex-col gap-1 text-xs 2xl:text-sm"
      data-test={`player-${playerNumber}-v2-details`}>
      <div className="box-border h-4 w-full rounded-xl bg-black/50 p-1 2xl:h-6">
        <ScoreBar score={result.total} maxScore={MAX_SCORE} color={color} maxWidthPercent={100} easingEnabled={false} />
      </div>
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
        <ScoreValue label="Afinación" score={result.pitch} maximum={MAX_PITCH_SCORE} testId="v2-pitch-score" />
        <ScoreValue label="Timing" score={result.timing} maximum={MAX_TIMING_SCORE} testId="v2-timing-score" />
        <ScoreValue label="Bonus" score={result.bonus} maximum={MAX_BONUS_SCORE} testId="v2-bonus-score" />
      </div>
      <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-white/90">
        <ScoreValue
          label="Perfect"
          score={result.bonusBreakdown.perfect}
          maximum={MAX_PERFECT_BONUS}
          testId="v2-perfect-bonus"
        />
        <ScoreValue
          label="Vibrato"
          score={result.bonusBreakdown.vibrato}
          maximum={MAX_VIBRATO_BONUS}
          testId="v2-vibrato-bonus"
        />
        <ScoreValue label="Star" score={result.bonusBreakdown.star} maximum={MAX_STAR_BONUS} testId="v2-star-bonus" />
        <ScoreValue
          label="Racha"
          score={result.bonusBreakdown.streak}
          maximum={MAX_STREAK_BONUS}
          testId="v2-streak-bonus"
        />
      </div>
      <div className="flex flex-wrap justify-center gap-x-3 text-white/75">
        <span data-test="v2-pitch-ratio">Afinación {formatRatio(result.metrics.pitchRatio)}</span>
        <span data-test="v2-timing-ratio">Timing {formatRatio(result.metrics.timingRatio)}</span>
        <span data-test="v2-perfect-ratio">Perfect {formatRatio(result.metrics.perfectRatio)}</span>
        <span data-test="v2-star-ratio">Star {formatRatio(result.metrics.starRatio)}</span>
        <span data-test="v2-max-streak">Racha máxima {formatStreak(result.metrics.maxStreak)}</span>
      </div>
    </div>
  );
}
