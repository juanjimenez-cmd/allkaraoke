import CountUp from 'react-countup';

import styles from '~/modules/game-engine/drawing/styles';
import { MAX_SCORE } from '~/modules/game-engine/game-state/helpers/calculate-score-v2';
import { PlayerNumber } from '~/modules/players/player-number';
import { formatScoreV2, getRoundedScoreV2 } from '~/routes/game/singing/game-overlay/helpers/format-score';
import getScoreRatingV2 from '~/routes/game/singing/post-game/helpers/get-score-rating-v2';
import { PlayerScore } from '~/routes/game/singing/post-game/post-game-view';
import PlayerDetailedScore from '~/routes/game/singing/post-game/views/results/player-detailed-score';
import { cn } from '~/utils/cn';

interface Props {
  player: PlayerScore;
  playerNumber: PlayerNumber;
  highestScore: number;
  revealWinner: boolean;
  useColors: boolean;
}

export default function PlayerScoreV2({ player, playerNumber, highestScore, revealWinner, useColors }: Props) {
  const result = player.scoringV2!;
  const playerScore = getRoundedScoreV2(result.total);
  const isWinner = revealWinner && playerScore === highestScore;

  return (
    <div
      className={cn(
        'relative flex flex-col items-center gap-1 bg-black/50 px-2 py-1 transition-all ease-in-out',
        revealWinner ? '' : 'mb-4 2xl:mb-6',
      )}>
      <div
        data-win={isWinner}
        data-test={`player-${playerNumber}-score`}
        data-score={playerScore}
        className={cn(
          'typography text-md flex w-full justify-between bg-transparent text-white transition-[font-size,color] duration-400 ease-in-out 2xl:text-xl',
          isWinner ? 'text-active text-lg 2xl:text-2xl' : '',
        )}>
        <span
          style={useColors ? { color: styles.colors.players[playerNumber].text } : undefined}
          data-test={`player-${playerNumber}-name`}
          className="ph-no-capture">
          {player.name}
        </span>
        <span data-test="v2-total-score">
          Score <CountUp preserveValue end={playerScore} formattingFn={formatScoreV2} duration={1} /> /{' '}
          {formatScoreV2(MAX_SCORE)}
        </span>
      </div>
      <span className="typography text-active text-sm" data-test="v2-score-rating">
        {getScoreRatingV2(playerScore)}
      </span>
      <PlayerDetailedScore playerNumber={playerNumber} player={player} segment={5} />
    </div>
  );
}
