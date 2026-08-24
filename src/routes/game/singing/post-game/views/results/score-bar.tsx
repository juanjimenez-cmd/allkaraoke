import clsx from 'clsx';

import getScoreBarProgress from '~/routes/game/singing/post-game/helpers/get-score-bar-progress';

interface Props {
  score: number;
  maxScore: number;
  color: string;
  maxWidthPercent?: number;
  easingEnabled?: boolean;
}

function easeOutCubic(x: number): number {
  return 1 - Math.pow(1 - x, 3);
}

function easing(x: number): number {
  return easeOutCubic(x);
}

function ScoreBar({ color, maxScore, score, maxWidthPercent = 24, easingEnabled = true }: Props) {
  const progress = getScoreBarProgress(score, maxScore);

  return (
    <div
      className={clsx(
        'box-border h-full rounded-lg transition-all duration-1000',
        progress === 0 ? 'border-0' : 'border border-black',
      )}
      style={{
        width: `${(easingEnabled ? easing(progress) : progress) * maxWidthPercent}%`,
        backgroundColor: color,
        backgroundImage:
          'linear-gradient(180deg, rgba(0, 0, 0, 0.17) 0%, rgba(0, 0, 0, 0.03) 50%, rgba(0, 0, 0, 0.18) 51%, rgba(0, 0, 0, 0.18) 100%)',
      }}
    />
  );
}

export default ScoreBar;
