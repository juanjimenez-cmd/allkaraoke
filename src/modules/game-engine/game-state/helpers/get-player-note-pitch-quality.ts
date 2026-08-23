import { noDistanceNoteTypes } from '~/consts';
import { PlayerNote } from '~/interfaces';
import calculatePitchQuality from '~/modules/game-engine/game-state/helpers/calculate-pitch-quality';

export default function getPlayerNotePitchQuality(playerNote: PlayerNote): number {
  if (noDistanceNoteTypes.includes(playerNote.note.type)) return 1;

  const validRecords = playerNote.frequencyRecords.filter(({ preciseDistance }) => Number.isFinite(preciseDistance));
  if (validRecords.length === 0) return 0;

  const totalQuality = validRecords.reduce(
    (sum, { preciseDistance }) => sum + calculatePitchQuality(preciseDistance),
    0,
  );

  return totalQuality / validRecords.length;
}
