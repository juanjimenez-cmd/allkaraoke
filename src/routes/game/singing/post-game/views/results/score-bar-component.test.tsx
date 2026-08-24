import { render } from '@testing-library/react';

import ScoreBar from '~/routes/game/singing/post-game/views/results/score-bar';

describe('ScoreBar V2 rendering', () => {
  it.each([
    [0, '0%'],
    [5_000, '50%'],
    [10_000, '100%'],
    [12_000, '100%'],
    [-10, '0%'],
  ])('renders %i as %s of the 10,000-point bar', (score, width) => {
    const { container } = render(
      <ScoreBar score={score} maxScore={10_000} color="#fff" maxWidthPercent={100} easingEnabled={false} />,
    );

    expect(container.firstElementChild).toHaveStyle({ width });
  });
});
