import { render } from '@testing-library/react';

import { DetailedScore } from '~/interfaces';
import { ScoringV2Result } from '~/modules/game-engine/game-state/helpers/calculate-score-v2';
import { formatScoreV2 } from '~/routes/game/singing/game-overlay/helpers/format-score';
import { PlayerScore } from '~/routes/game/singing/post-game/post-game-view';
import PlayerScoreV2 from '~/routes/game/singing/post-game/views/results/player-score-v2';

const emptyDetailedScore: DetailedScore = {
  freestyle: 0,
  normal: 0,
  perfect: 0,
  rap: 0,
  rapstar: 0,
  star: 0,
  vibrato: 0,
};

const scoringV2: ScoringV2Result = {
  total: 8_742,
  pitch: 5_915,
  timing: 2_150,
  bonus: 677,
  bonusBreakdown: {
    perfect: 300,
    vibrato: 100,
    star: 177,
    streak: 100,
  },
  metrics: {
    pitchRatio: 0.91,
    timingRatio: 0.86,
    perfectRatio: 0.75,
    starRatio: 0.59,
    maxStreak: 12,
  },
};

const player: PlayerScore = {
  name: 'Singer',
  playerNumber: 0,
  detailedScore: [emptyDetailedScore, emptyDetailedScore],
  scoringV2,
};

describe('PlayerScoreV2', () => {
  it('renders total, pitch, timing and bonus directly from the V2 result', () => {
    const { container } = render(
      <PlayerScoreV2 player={player} playerNumber={0} highestScore={8_742} revealWinner={true} useColors={false} />,
    );

    expect(container.querySelector('[data-test="player-0-score"]')).toHaveAttribute('data-score', '8742');
    expect(container.querySelector('[data-test="v2-total-score"]')).toHaveTextContent(`/ ${formatScoreV2(10_000)}`);
    expect(container.querySelector('[data-test="v2-pitch-score"]')).toHaveTextContent(
      `Afinación ${formatScoreV2(5_915)} / ${formatScoreV2(6_500)}`,
    );
    expect(container.querySelector('[data-test="v2-timing-score"]')).toHaveTextContent(
      `Timing ${formatScoreV2(2_150)} / ${formatScoreV2(2_500)}`,
    );
    expect(container.querySelector('[data-test="v2-bonus-score"]')).toHaveTextContent(
      `Bonus ${formatScoreV2(677)} / ${formatScoreV2(1_000)}`,
    );
  });

  it('renders the bonus breakdown and safe informational metrics', () => {
    const { container } = render(
      <PlayerScoreV2 player={player} playerNumber={0} highestScore={8_742} revealWinner={true} useColors={false} />,
    );

    expect(container.querySelector('[data-test="v2-perfect-bonus"]')).toHaveTextContent('Perfect');
    expect(container.querySelector('[data-test="v2-vibrato-bonus"]')).toHaveTextContent('Vibrato');
    expect(container.querySelector('[data-test="v2-star-bonus"]')).toHaveTextContent('Star');
    expect(container.querySelector('[data-test="v2-streak-bonus"]')).toHaveTextContent('Racha');
    expect(container.querySelector('[data-test="v2-pitch-ratio"]')).toHaveTextContent('91%');
    expect(container.querySelector('[data-test="v2-timing-ratio"]')).toHaveTextContent('86%');
    expect(container.querySelector('[data-test="v2-perfect-ratio"]')).toHaveTextContent('75%');
    expect(container.querySelector('[data-test="v2-star-ratio"]')).toHaveTextContent('59%');
    expect(container.querySelector('[data-test="v2-max-streak"]')).toHaveTextContent('12');
  });
});
