import { formatScore, scoreFormatter } from '~/routes/game/singing/game-overlay/helpers/format-score';

interface Props {
  score: number;
}

// eslint-disable-next-line react-refresh/only-export-components
export const formatter = scoreFormatter;

export default function ScoreText({ score }: Props) {
  return <>{formatScore(score)}</>;
}
