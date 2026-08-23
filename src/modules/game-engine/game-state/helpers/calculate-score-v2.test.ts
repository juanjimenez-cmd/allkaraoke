import { Note, NoteFrequencyRecord } from '~/interfaces';
import calculateScoreV2, {
  calculateStreakBonus,
  MAX_BONUS_SCORE,
  MAX_PITCH_SCORE,
  MAX_SCORE,
  MAX_STAR_BONUS,
  MAX_TIMING_SCORE,
} from '~/modules/game-engine/game-state/helpers/calculate-score-v2';
import { generateNote, generatePlayerNote, generateSong } from '~/modules/utils/test-utils';

const generateFrequencyRecords = (...preciseDistances: number[]): NoteFrequencyRecord[] =>
  preciseDistances.map((preciseDistance, timestamp) => ({
    frequency: 440,
    preciseDistance,
    timestamp,
  }));

const generateScoredPlayerNote = (
  note: Note,
  options: {
    distance?: number;
    isPerfect?: boolean;
    length?: number;
    preciseDistances?: number[];
    startOffset?: number;
    vibrato?: boolean;
  } = {},
) =>
  generatePlayerNote(
    note,
    options.distance ?? 0,
    options.startOffset ?? 0,
    options.length ?? note.length,
    options.isPerfect ?? false,
    options.vibrato ?? false,
    generateFrequencyRecords(...(options.preciseDistances ?? [0])),
  );

const generateScoringSong = (notes: Note[]) => generateSong([[{ start: notes[0]?.start ?? 0, type: 'notes', notes }]]);

const generateNotes = (count: number, length = 1, type: Note['type'] = 'normal') =>
  Array.from({ length: count }, (_, index) => generateNote(index * length, length, { type }));

describe('calculateScoreV2', () => {
  it('returns an empty score when the player has not sung any notes', () => {
    const note = generateNote(0, 4);
    const result = calculateScoreV2([], generateScoringSong([note]), 0);

    expect(result).toEqual({
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
  });

  it('awards 10,000 points for a performance that maximizes every component', () => {
    const notes = generateNotes(21, 2, 'star');
    const playerNotes = notes.map((note) => generateScoredPlayerNote(note, { isPerfect: true, vibrato: true }));
    const result = calculateScoreV2(playerNotes, generateScoringSong(notes), 0);

    expect(result).toMatchObject({
      total: MAX_SCORE,
      pitch: MAX_PITCH_SCORE,
      timing: MAX_TIMING_SCORE,
      bonus: MAX_BONUS_SCORE,
      bonusBreakdown: {
        perfect: 350,
        vibrato: 150,
        star: 300,
        streak: 200,
      },
      metrics: {
        pitchRatio: 1,
        timingRatio: 1,
        perfectRatio: 1,
        starRatio: 1,
        maxStreak: 21,
      },
    });
  });

  it('keeps perfect pitch near its maximum when timing coverage is 50%', () => {
    const note = generateNote(0, 4);
    const playerNote = generateScoredPlayerNote(note, { length: 2 });
    const result = calculateScoreV2([playerNote], generateScoringSong([note]), 0);

    expect(result.pitch).toBe(MAX_PITCH_SCORE);
    expect(result.timing).toBe(MAX_TIMING_SCORE * 0.5);
  });

  it('scores pitch quality 0.5 independently from perfect timing', () => {
    const note = generateNote(0, 4);
    const playerNote = generateScoredPlayerNote(note, { preciseDistances: [90] });
    const result = calculateScoreV2([playerNote], generateScoringSong([note]), 0);

    expect(result.pitch).toBeCloseTo(MAX_PITCH_SCORE * 0.5);
    expect(result.timing).toBe(MAX_TIMING_SCORE);
  });

  it('gives no pitch points for deviations of 200 cents while preserving timing points', () => {
    const note = generateNote(0, 4);
    const playerNote = generateScoredPlayerNote(note, { preciseDistances: [200] });
    const result = calculateScoreV2([playerNote], generateScoringSong([note]), 0);

    expect(result.pitch).toBe(0);
    expect(result.timing).toBe(MAX_TIMING_SCORE);
  });

  it('never gives pitch points for the invalid precise distance sentinel', () => {
    const note = generateNote(0, 4);
    const playerNote = generateScoredPlayerNote(note, { preciseDistances: [-1] });
    const result = calculateScoreV2([playerNote], generateScoringSong([note]), 0);

    expect(result.pitch).toBe(0);
    expect(result.timing).toBe(MAX_TIMING_SCORE);
  });

  it.each(['rap', 'freestyle'] as const)('scores %s through timing without a pitch component', (type) => {
    const note = generateNote(0, 4, { type });
    const playerNote = generateScoredPlayerNote(note, { preciseDistances: [250] });
    const result = calculateScoreV2([playerNote], generateScoringSong([note]), 0);

    expect(result.pitch).toBe(0);
    expect(result.timing).toBe(MAX_TIMING_SCORE);
  });

  it('awards star bonus according to pitch quality and timing coverage', () => {
    const note = generateNote(0, 4, { type: 'star' });
    const playerNote = generateScoredPlayerNote(note, { length: 2, preciseDistances: [100] });
    const result = calculateScoreV2([playerNote], generateScoringSong([note]), 0);

    expect(result.metrics.starRatio).toBeCloseTo(0.5 * 0.4);
    expect(result.bonusBreakdown.star).toBeCloseTo(MAX_STAR_BONUS * 0.5 * 0.4);
  });

  it('keeps the existing pitched semantics for rapstar bonus', () => {
    const note = generateNote(0, 4, { type: 'rapstar' });
    const playerNote = generateScoredPlayerNote(note, { preciseDistances: [90] });
    const result = calculateScoreV2([playerNote], generateScoringSong([note]), 0);

    expect(result.metrics.starRatio).toBeCloseTo(0.5);
    expect(result.bonusBreakdown.star).toBeCloseTo(MAX_STAR_BONUS * 0.5);
  });

  it('awards vibrato bonus without changing pitch or timing base scores', () => {
    const note = generateNote(0, 2);
    const song = generateScoringSong([note]);
    const withoutVibrato = calculateScoreV2([generateScoredPlayerNote(note)], song, 0);
    const withVibrato = calculateScoreV2([generateScoredPlayerNote(note, { vibrato: true })], song, 0);

    expect(withVibrato.pitch).toBe(withoutVibrato.pitch);
    expect(withVibrato.timing).toBe(withoutVibrato.timing);
    expect(withVibrato.bonusBreakdown.vibrato).toBe(150);
  });

  it('requires both target and sung duration to meet the vibrato threshold', () => {
    const note = generateNote(0, 2);
    const playerNote = generateScoredPlayerNote(note, { length: 1, vibrato: true });
    const result = calculateScoreV2([playerNote], generateScoringSong([note]), 0);

    expect(result.bonusBreakdown.vibrato).toBe(0);
  });

  it('normalizes perfect bonus across all target notes', () => {
    const notes = generateNotes(2);
    const playerNote = generateScoredPlayerNote(notes[0], { isPerfect: true, preciseDistances: [40] });
    const result = calculateScoreV2([playerNote], generateScoringSong(notes), 0);

    expect(result.metrics.perfectRatio).toBe(0.5);
    expect(result.bonusBreakdown.perfect).toBe(175);
  });

  it('does not award perfect bonus when pitch quality is below 0.9', () => {
    const note = generateNote(0, 1);
    const playerNote = generateScoredPlayerNote(note, { isPerfect: true, preciseDistances: [60] });
    const result = calculateScoreV2([playerNote], generateScoringSong([note]), 0);

    expect(result.metrics.perfectRatio).toBe(0);
    expect(result.bonusBreakdown.perfect).toBe(0);
  });

  it('does not award perfect bonus when timing coverage is below 0.9', () => {
    const note = generateNote(0, 10);
    const playerNote = generateScoredPlayerNote(note, { isPerfect: true, length: 8.9 });
    const result = calculateScoreV2([playerNote], generateScoringSong([note]), 0);

    expect(result.bonusBreakdown.perfect).toBe(0);
  });

  it.each`
    maxStreak | expectedBonus
    ${0}      | ${0}
    ${3}      | ${50 / 3}
    ${5}      | ${50}
    ${10}     | ${100}
    ${20}     | ${150}
    ${21}     | ${200}
  `('calculates $expectedBonus streak points for a streak of $maxStreak', ({ maxStreak, expectedBonus }) => {
    expect(calculateStreakBonus(maxStreak)).toBeCloseTo(expectedBonus);
  });

  it('uses pitch and timing thresholds when calculating consecutive hits', () => {
    const notes = generateNotes(5);
    const playerNotes = [
      ...notes.slice(0, 3).map((note) =>
        generateScoredPlayerNote(note, {
          length: 0.8,
          preciseDistances: [50],
        }),
      ),
      generateScoredPlayerNote(notes[3], { preciseDistances: [60] }),
      generateScoredPlayerNote(notes[4]),
    ];
    const result = calculateScoreV2(playerNotes, generateScoringSong(notes), 0);

    expect(result.metrics.maxStreak).toBe(3);
    expect(result.bonusBreakdown.streak).toBeCloseTo(50 / 3);
  });

  it('uses timing only when calculating rap and freestyle streak hits', () => {
    const notes = [
      generateNote(0, 1, { type: 'rap' }),
      generateNote(1, 1, { type: 'freestyle' }),
      generateNote(2, 1, { type: 'rap' }),
    ];
    const playerNotes = notes.map((note) => generateScoredPlayerNote(note, { length: 0.8, preciseDistances: [250] }));
    const result = calculateScoreV2(playerNotes, generateScoringSong(notes), 0);

    expect(result.metrics.maxStreak).toBe(3);
  });

  it('does not count overlapping segments for the same target note more than once', () => {
    const note = generateNote(0, 4);
    const playerNotes = [
      generateScoredPlayerNote(note, { length: 3 }),
      generateScoredPlayerNote(note, { startOffset: 2, length: 3 }),
    ];
    const result = calculateScoreV2(playerNotes, generateScoringSong([note]), 0);

    expect(result.metrics.timingRatio).toBe(1);
    expect(result.timing).toBe(MAX_TIMING_SCORE);
  });

  it('does not reward duration outside the target note', () => {
    const note = generateNote(2, 4);
    const playerNote = generateScoredPlayerNote(note, { startOffset: -2, length: 8 });
    const result = calculateScoreV2([playerNote], generateScoringSong([note]), 0);

    expect(result.metrics.timingRatio).toBe(1);
    expect(result.timing).toBe(MAX_TIMING_SCORE);
  });

  it('preserves octave-independent scoring by relying on precise distance rather than discrete distance', () => {
    const note = generateNote(0, 4);
    const song = generateScoringSong([note]);
    const baseResult = calculateScoreV2([generateScoredPlayerNote(note)], song, 0);
    const octaveResult = calculateScoreV2([generateScoredPlayerNote(note, { distance: 12 })], song, 0);

    expect(octaveResult).toEqual(baseResult);
  });

  it('keeps every component finite and within its bounds', () => {
    const notes = generateNotes(30, 2, 'star');
    const playerNotes = notes.flatMap((note) => [
      generateScoredPlayerNote(note, { isPerfect: true, vibrato: true }),
      generateScoredPlayerNote(note, { isPerfect: true, vibrato: true }),
    ]);
    const result = calculateScoreV2(playerNotes, generateScoringSong(notes), 0);

    expect(result.pitch).toBeGreaterThanOrEqual(0);
    expect(result.pitch).toBeLessThanOrEqual(MAX_PITCH_SCORE);
    expect(result.timing).toBeGreaterThanOrEqual(0);
    expect(result.timing).toBeLessThanOrEqual(MAX_TIMING_SCORE);
    expect(result.bonus).toBeGreaterThanOrEqual(0);
    expect(result.bonus).toBeLessThanOrEqual(MAX_BONUS_SCORE);
    expect(result.total).toBeGreaterThanOrEqual(0);
    expect(result.total).toBeLessThanOrEqual(MAX_SCORE);
    const values = [
      result.total,
      result.pitch,
      result.timing,
      result.bonus,
      ...Object.values(result.bonusBreakdown),
      ...Object.values(result.metrics),
    ];

    expect(values.every(Number.isFinite)).toBe(true);
  });
});
