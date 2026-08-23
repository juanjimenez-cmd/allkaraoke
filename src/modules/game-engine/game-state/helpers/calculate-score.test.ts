import { Note, NoteFrequencyRecord, PlayerNote } from '~/interfaces';
import calculateScore, {
  calculateDetailedScoreData,
  MAX_POINTS,
} from '~/modules/game-engine/game-state/helpers/calculate-score';
import { generateNote, generatePlayerNote, generateSong } from '~/modules/utils/test-utils';

const generateFrequencyRecords = (...preciseDistances: number[]): NoteFrequencyRecord[] =>
  preciseDistances.map((preciseDistance, timestamp) => ({
    frequency: 440,
    preciseDistance,
    timestamp,
  }));

const generateScoredPlayerNote = (
  note: Note,
  preciseDistance = 0,
  options: {
    distance?: number;
    isPerfect?: boolean;
    length?: number;
    vibrato?: boolean;
  } = {},
) =>
  generatePlayerNote(
    note,
    options.distance ?? 0,
    0,
    options.length ?? note.length,
    options.isPerfect ?? false,
    options.vibrato ?? false,
    generateFrequencyRecords(preciseDistance),
  );

describe('calculateScore', () => {
  const note1 = generateNote(0, 5, { type: 'normal' });
  const note2 = generateNote(5, 5, { type: 'star' });
  const note3 = generateNote(10, 5, { type: 'normal' });
  const note4 = generateNote(15, 5, { type: 'star' });

  const song = generateSong([
    [
      { start: 0, type: 'notes', notes: [note1, note2] },
      { start: 0, type: 'notes', notes: [note3, note4] },
    ],
    [
      { start: 0, type: 'notes', notes: [note1] },
      { start: 0, type: 'notes', notes: [note4] },
    ],
  ]);

  it('should properly calculate score for player with no sung notes', () => {
    const playerNotes: PlayerNote[] = [];

    expect(calculateScore(playerNotes, song, 0)).toEqual(0);
  });

  it('should properly calculate score for player with all sung notes perfectly at full pitch quality', () => {
    const options = { isPerfect: true, vibrato: true };
    const playerNotes: PlayerNote[] = [
      generateScoredPlayerNote(note1, 0, options),
      generateScoredPlayerNote(note2, 0, options),
      generateScoredPlayerNote(note3, 0, options),
      generateScoredPlayerNote(note4, 0, options),
    ];

    expect(calculateScore(playerNotes, song, 0)).toEqual(MAX_POINTS);
  });

  it('should properly calculate score for player with not every sung note being perfect', () => {
    const playerNotes: PlayerNote[] = [
      generateScoredPlayerNote(note1, 0, { isPerfect: true, vibrato: true }),
      generateScoredPlayerNote(note2, 0, { isPerfect: true, vibrato: true }),
      generateScoredPlayerNote(note3),
      generateScoredPlayerNote(note4),
    ];

    expect(Math.floor(calculateScore(playerNotes, song, 0))).toEqual(Math.floor(MAX_POINTS * 0.833333333));
  });

  it('should properly calculate score for player with only half notes sung', () => {
    const options = { isPerfect: true, vibrato: true };
    const playerNotes: PlayerNote[] = [
      generateScoredPlayerNote(note1, 0, options),
      generateScoredPlayerNote(note4, 0, options),
    ];

    expect(calculateScore(playerNotes, song, 0)).toEqual(MAX_POINTS * 0.5);
  });

  it('should properly calculate score for multiple tracks', () => {
    const options = { isPerfect: true, vibrato: true };
    const player1Notes: PlayerNote[] = [
      generateScoredPlayerNote(note1, 0, options),
      generateScoredPlayerNote(note2, 0, options),
      generateScoredPlayerNote(note3, 0, options),
      generateScoredPlayerNote(note4, 0, options),
    ];
    const player2Notes: PlayerNote[] = [
      generateScoredPlayerNote(note1, 0, options),
      generateScoredPlayerNote(note4, 0, options),
    ];

    expect(calculateScore(player1Notes, song, 0)).toEqual(MAX_POINTS);
    expect(calculateScore(player2Notes, song, 1)).toEqual(MAX_POINTS);
  });

  describe('continuous pitch quality', () => {
    const normalNote = generateNote(0, 4, { type: 'normal' });
    const normalSong = generateSong([[{ start: 0, type: 'notes', notes: [normalNote] }]]);

    it('should give approximately half the base contribution for pitch quality 0.5', () => {
      const fullQualityScore = calculateScore([generateScoredPlayerNote(normalNote, 0)], normalSong, 0);
      const halfQualityScore = calculateScore([generateScoredPlayerNote(normalNote, 90)], normalSong, 0);

      expect(halfQualityScore).toBeCloseTo(fullQualityScore * 0.5);
    });

    it('should score precise distances of 0 and 100 according to their different qualities', () => {
      const fullQualityScore = calculateScore([generateScoredPlayerNote(normalNote, 0)], normalSong, 0);
      const reducedQualityScore = calculateScore([generateScoredPlayerNote(normalNote, 100)], normalSong, 0);

      expect(reducedQualityScore).toBeCloseTo(fullQualityScore * 0.4);
    });

    it('should contribute no points at a precise distance of 200 or more', () => {
      const playerNote = generateScoredPlayerNote(normalNote, 200, { isPerfect: true, vibrato: true });

      expect(calculateScore([playerNote], normalSong, 0)).toBe(0);
    });

    it('should contribute no points when all precise distances contain the invalid sentinel', () => {
      const playerNote = generateScoredPlayerNote(normalNote, -1, { isPerfect: true, vibrato: true });

      expect(calculateScore([playerNote], normalSong, 0)).toBe(0);
    });

    it('should use precise pitch quality instead of the binary note distance', () => {
      const inPitchDistanceScore = calculateScore([generateScoredPlayerNote(normalNote, 0)], normalSong, 0);
      const outOfPitchDistanceScore = calculateScore(
        [generateScoredPlayerNote(normalNote, 0, { distance: 5 })],
        normalSong,
        0,
      );

      expect(outOfPitchDistanceScore).toBe(inPitchDistanceScore);
    });

    it('should preserve the star multiplier on pitch-weighted duration', () => {
      const starNote = generateNote(0, 4, { type: 'star' });
      const starSong = generateSong([[{ start: 0, type: 'notes', notes: [starNote] }]]);
      const [, counts] = calculateDetailedScoreData([generateScoredPlayerNote(starNote, 100)], starSong, 0);

      expect(counts.star).toBeCloseTo(starNote.length * 0.4 * 2);
    });

    it('should include pitch-weighted rapstar duration in the total score', () => {
      const rapstarNote = generateNote(0, 4, { type: 'rapstar' });
      const rapstarSong = generateSong([[{ start: 0, type: 'notes', notes: [rapstarNote] }]]);
      const fullQualityScore = calculateScore([generateScoredPlayerNote(rapstarNote, 0)], rapstarSong, 0);
      const reducedQualityScore = calculateScore([generateScoredPlayerNote(rapstarNote, 100)], rapstarSong, 0);

      expect(reducedQualityScore).toBeCloseTo(fullQualityScore * 0.4);
    });

    it('should scale the perfect bonus by pitch quality', () => {
      const playerNote = generateScoredPlayerNote(normalNote, 100, { isPerfect: true });
      const [, counts] = calculateDetailedScoreData([playerNote], normalSong, 0);

      expect(counts.perfect).toBeCloseTo(normalNote.length * 0.4 * 0.5);
    });

    it('should scale the vibrato bonus by pitch quality', () => {
      const playerNote = generateScoredPlayerNote(normalNote, 100, { vibrato: true });
      const [, counts] = calculateDetailedScoreData([playerNote], normalSong, 0);

      expect(counts.vibrato).toBeCloseTo(normalNote.length * 0.4 * 0.25);
    });
  });

  describe('freestyle and rap', () => {
    it.each(['freestyle', 'rap'] as const)('should fully score %s even with poor pitch quality', (type) => {
      const note = generateNote(0, 5, { type });
      const speechSong = generateSong([[{ start: 0, type: 'notes', notes: [note] }]]);
      const playerNote = generateScoredPlayerNote(note, 250, {
        distance: 5,
        isPerfect: true,
        vibrato: true,
      });

      expect(calculateScore([playerNote], speechSong, 0)).toEqual(MAX_POINTS);
    });
  });
});
