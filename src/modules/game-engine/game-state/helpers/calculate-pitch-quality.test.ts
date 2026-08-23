import calculatePitchQuality from '~/modules/game-engine/game-state/helpers/calculate-pitch-quality';

describe('calculatePitchQuality', () => {
  it.each`
    cents         | expectedQuality
    ${0}          | ${1}
    ${20}         | ${0.97}
    ${40}         | ${0.9}
    ${60}         | ${0.78}
    ${80}         | ${0.6}
    ${100}        | ${0.4}
    ${150}        | ${0.1}
    ${200}        | ${0}
    ${250}        | ${0}
    ${-40}        | ${0.9}
    ${Number.NaN} | ${0}
    ${Infinity}   | ${0}
  `('returns $expectedQuality for $cents cents', ({ cents, expectedQuality }) => {
    expect(calculatePitchQuality(cents)).toBe(expectedQuality);
  });

  it('interpolates linearly between reference points', () => {
    expect(calculatePitchQuality(50)).toBeCloseTo(0.84);
  });
});
