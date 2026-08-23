import { noDistanceNoteTypes } from '~/consts';
import { PlayerNote } from '~/interfaces';
import calculatePitchQuality from '~/modules/game-engine/game-state/helpers/calculate-pitch-quality';

const INVALID_PRECISE_DISTANCE = -1;

export default function getPlayerNotePitchQuality(playerNote: PlayerNote): number {
  if (noDistanceNoteTypes.includes(playerNote.note.type)) return 1;

  const validRecords = playerNote.frequencyRecords.filter(
    ({ preciseDistance }) => Number.isFinite(preciseDistance) && preciseDistance !== INVALID_PRECISE_DISTANCE,
  );
  if (validRecords.length === 0) return 0;

  const totalQuality = validRecords.reduce(
    (sum, { preciseDistance }) => sum + calculatePitchQuality(preciseDistance),
    0,
  );

  return totalQuality / validRecords.length;
}
