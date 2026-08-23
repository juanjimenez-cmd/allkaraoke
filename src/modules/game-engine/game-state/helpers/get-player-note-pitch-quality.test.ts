import { NoteFrequencyRecord } from '~/interfaces';
import getPlayerNotePitchQuality from '~/modules/game-engine/game-state/helpers/get-player-note-pitch-quality';
import { generateNote, generatePlayerNote } from '~/modules/utils/test-utils';

const generateRecord = (preciseDistance: number): NoteFrequencyRecord => ({
  frequency: 440,
  preciseDistance,
  timestamp: 0,
});

describe('getPlayerNotePitchQuality', () => {
  it('averages the pitch quality of valid frequency records', () => {
    const playerNote = generatePlayerNote(generateNote(0), 0, 0, 1, false, false, [
      generateRecord(0),
      generateRecord(40),
      generateRecord(50),
    ]);

    expect(getPlayerNotePitchQuality(playerNote)).toBeCloseTo((1 + 0.9 + 0.84) / 3);
  });

  it('ignores records with non-finite precise distances', () => {
    const playerNote = generatePlayerNote(generateNote(0), 0, 0, 1, false, false, [
      generateRecord(20),
      generateRecord(Number.NaN),
      generateRecord(Infinity),
    ]);

    expect(getPlayerNotePitchQuality(playerNote)).toBe(0.97);
  });

  it.each(['normal', 'star', 'rapstar'] as const)('returns 0 for a %s note without valid records', (type) => {
    const playerNote = generatePlayerNote(generateNote(0, 1, { type }), 0, 0, 1, false, false, [
      generateRecord(Number.NaN),
    ]);

    expect(getPlayerNotePitchQuality(playerNote)).toBe(0);
  });

  it.each(['freestyle', 'rap'] as const)('returns 1 for a %s note without valid records', (type) => {
    const playerNote = generatePlayerNote(generateNote(0, 1, { type }), 0);

    expect(getPlayerNotePitchQuality(playerNote)).toBe(1);
  });

  it.each(['freestyle', 'rap'] as const)('does not penalize a %s note for pitch deviation', (type) => {
    const playerNote = generatePlayerNote(generateNote(0, 1, { type }), 0, 0, 1, false, false, [generateRecord(200)]);

    expect(getPlayerNotePitchQuality(playerNote)).toBe(1);
  });

  it.each(['normal', 'star', 'rapstar'] as const)('applies pitch quality to a %s note', (type) => {
    const playerNote = generatePlayerNote(generateNote(0, 1, { type }), 0, 0, 1, false, false, [generateRecord(100)]);

    expect(getPlayerNotePitchQuality(playerNote)).toBe(0.4);
  });
});
