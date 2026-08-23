import { noDistanceNoteTypes, noPointsNoteTypes } from '~/consts';
import { Note, PlayerNote, Song } from '~/interfaces';
import getPlayerNotePitchQuality from '~/modules/game-engine/game-state/helpers/get-player-note-pitch-quality';
import isNotesSection from '~/modules/songs/utils/is-notes-section';

export const MAX_SCORE = 10_000;
export const MAX_PITCH_SCORE = 6_500;
export const MAX_TIMING_SCORE = 2_500;
export const MAX_BONUS_SCORE = 1_000;

export const MAX_PERFECT_BONUS = 350;
export const MAX_VIBRATO_BONUS = 150;
export const MAX_STAR_BONUS = 300;
export const MAX_STREAK_BONUS = 200;

export const MIN_VIBRATO_NOTE_LENGTH = 2;

const PERFECT_PITCH_THRESHOLD = 0.9;
const PERFECT_COVERAGE_THRESHOLD = 0.9;
const STREAK_PITCH_THRESHOLD = 0.8;
const STREAK_COVERAGE_THRESHOLD = 0.8;
const THRESHOLD_EPSILON = 1e-10;

export interface ScoringV2Result {
  total: number;
  pitch: number;
  timing: number;
  bonus: number;
  bonusBreakdown: {
    perfect: number;
    vibrato: number;
    star: number;
    streak: number;
  };
  metrics: {
    pitchRatio: number;
    timingRatio: number;
    perfectRatio: number;
    starRatio: number;
    maxStreak: number;
  };
}

interface PerformanceInterval {
  start: number;
  end: number;
  pitchQuality: number;
  playerNote: PlayerNote;
}

interface NotePerformance {
  note: Note;
  coveredLength: number;
  pitchWeightedLength: number;
  coverage: number;
  pitchQuality: number;
  isPerfect: boolean;
  vibrato: boolean;
}

const clamp = (value: number, min: number, max: number) => {
  if (!Number.isFinite(value)) return min;
  return Math.min(Math.max(value, min), max);
};

const clampRatio = (value: number) => clamp(value, 0, 1);

const divideOrZero = (value: number, divideBy: number) =>
  Number.isFinite(value) && Number.isFinite(divideBy) && divideBy > 0 ? value / divideBy : 0;

const isPitchNote = (note: Note) => !noDistanceNoteTypes.includes(note.type);

const meetsThreshold = (value: number, threshold: number) => value >= threshold - THRESHOLD_EPSILON;

const getTargetNotes = (song: Song, trackNumber: number) => {
  const track = song.tracks[trackNumber];
  if (!track) return [];

  return track.sections
    .filter(isNotesSection)
    .flatMap((section) => section.notes)
    .filter(
      (note) =>
        !noPointsNoteTypes.includes(note.type) &&
        Number.isFinite(note.start) &&
        Number.isFinite(note.length) &&
        note.length > 0,
    )
    .sort((a, b) => a.start - b.start);
};

const getPerformanceIntervals = (note: Note, playerNotes: PlayerNote[]): PerformanceInterval[] => {
  const noteEnd = note.start + note.length;

  return playerNotes.flatMap((playerNote) => {
    if (!Number.isFinite(playerNote.start) || !Number.isFinite(playerNote.length) || playerNote.length <= 0) return [];

    const start = Math.max(note.start, playerNote.start);
    const end = Math.min(noteEnd, playerNote.start + playerNote.length);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return [];

    return [
      {
        start,
        end,
        pitchQuality: clampRatio(getPlayerNotePitchQuality(playerNote)),
        playerNote,
      },
    ];
  });
};

const calculateNotePerformance = (note: Note, playerNotes: PlayerNote[]): NotePerformance => {
  const intervals = getPerformanceIntervals(note, playerNotes);
  const boundaries = [...new Set(intervals.flatMap(({ start, end }) => [start, end]))].sort((a, b) => a - b);

  let coveredLength = 0;
  let pitchWeightedLength = 0;

  for (let i = 1; i < boundaries.length; i++) {
    const start = boundaries[i - 1];
    const end = boundaries[i];
    const activeIntervals = intervals.filter((interval) => interval.start < end && interval.end > start);
    if (activeIntervals.length === 0) continue;

    const length = end - start;
    const averagePitchQuality =
      activeIntervals.reduce((sum, interval) => sum + interval.pitchQuality, 0) / activeIntervals.length;

    coveredLength += length;
    pitchWeightedLength += length * averagePitchQuality;
  }

  const coverage = clampRatio(divideOrZero(coveredLength, note.length));
  const pitchQuality = clampRatio(divideOrZero(pitchWeightedLength, coveredLength));

  return {
    note,
    coveredLength: Math.min(coveredLength, note.length),
    pitchWeightedLength: Math.min(pitchWeightedLength, note.length),
    coverage,
    pitchQuality,
    isPerfect: intervals.some(({ playerNote }) => playerNote.isPerfect),
    vibrato: intervals.some(({ playerNote }) => playerNote.vibrato),
  };
};

const interpolateStreakBonus = (
  streak: number,
  minimumStreak: number,
  maximumStreak: number,
  minimumBonus: number,
  maximumBonus: number,
) => minimumBonus + ((streak - minimumStreak) / (maximumStreak - minimumStreak)) * (maximumBonus - minimumBonus);

export function calculateStreakBonus(maxStreak: number): number {
  const streak = Number.isFinite(maxStreak) ? Math.max(0, Math.floor(maxStreak)) : 0;

  if (streak <= 2) return 0;
  if (streak <= 5) return interpolateStreakBonus(streak, 3, 5, 0, 50);
  if (streak <= 10) return interpolateStreakBonus(streak, 6, 10, 50, 100);
  if (streak <= 20) return interpolateStreakBonus(streak, 11, 20, 100, 150);
  if (streak <= 30) return interpolateStreakBonus(streak, 21, 30, 150, MAX_STREAK_BONUS);

  return MAX_STREAK_BONUS;
}

const getMaxStreak = (performances: NotePerformance[]) => {
  let currentStreak = 0;
  let maxStreak = 0;

  performances.forEach((performance) => {
    const pitchHit = !isPitchNote(performance.note) || meetsThreshold(performance.pitchQuality, STREAK_PITCH_THRESHOLD);
    const timingHit = meetsThreshold(performance.coverage, STREAK_COVERAGE_THRESHOLD);

    if (pitchHit && timingHit) {
      currentStreak += 1;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  });

  return maxStreak;
};

export default function calculateScoreV2(playerNotes: PlayerNote[], song: Song, trackNumber: number): ScoringV2Result {
  const targetNotes = getTargetNotes(song, trackNumber);
  const playerNotesByTarget = new Map<Note, PlayerNote[]>();

  playerNotes.forEach((playerNote) => {
    const notes = playerNotesByTarget.get(playerNote.note) ?? [];
    notes.push(playerNote);
    playerNotesByTarget.set(playerNote.note, notes);
  });

  const performances = targetNotes.map((note) => calculateNotePerformance(note, playerNotesByTarget.get(note) ?? []));
  const pitchPerformances = performances.filter(({ note }) => isPitchNote(note));

  const totalTargetPitchDuration = pitchPerformances.reduce((sum, { note }) => sum + note.length, 0);
  const pitchWeightedDuration = pitchPerformances.reduce(
    (sum, performance) => sum + performance.pitchWeightedLength,
    0,
  );

  const pitchRatio = clampRatio(divideOrZero(pitchWeightedDuration, totalTargetPitchDuration));
  const pitch = clamp(pitchRatio * MAX_PITCH_SCORE, 0, MAX_PITCH_SCORE);

  const totalTargetDuration = targetNotes.reduce((sum, note) => sum + note.length, 0);
  const totalCoveredDuration = performances.reduce((sum, performance) => sum + performance.coveredLength, 0);
  const timingRatio = clampRatio(divideOrZero(totalCoveredDuration, totalTargetDuration));
  const timing = clamp(timingRatio * MAX_TIMING_SCORE, 0, MAX_TIMING_SCORE);

  const perfectHits = performances.filter(
    (performance) =>
      performance.isPerfect &&
      meetsThreshold(performance.pitchQuality, PERFECT_PITCH_THRESHOLD) &&
      meetsThreshold(performance.coverage, PERFECT_COVERAGE_THRESHOLD),
  ).length;
  const perfectRatio = clampRatio(divideOrZero(perfectHits, targetNotes.length));
  const perfect = clamp(perfectRatio * MAX_PERFECT_BONUS, 0, MAX_PERFECT_BONUS);

  const vibratoOpportunities = pitchPerformances.filter(({ note }) => note.length >= MIN_VIBRATO_NOTE_LENGTH);
  const vibratoHits = vibratoOpportunities.filter(
    (performance) =>
      performance.vibrato && performance.pitchQuality > 0 && performance.coveredLength >= MIN_VIBRATO_NOTE_LENGTH,
  ).length;
  const vibratoRatio = clampRatio(divideOrZero(vibratoHits, vibratoOpportunities.length));
  const vibrato = clamp(vibratoRatio * MAX_VIBRATO_BONUS, 0, MAX_VIBRATO_BONUS);

  const starOpportunities = performances.filter(({ note }) => note.type === 'star' || note.type === 'rapstar');
  const maximumStarDuration = starOpportunities.reduce((sum, { note }) => sum + note.length, 0);
  const achievedStarDuration = starOpportunities.reduce((sum, performance) => {
    const pitchFactor = isPitchNote(performance.note) ? performance.pitchQuality : 1;
    return sum + performance.note.length * performance.coverage * pitchFactor;
  }, 0);
  const starRatio = clampRatio(divideOrZero(achievedStarDuration, maximumStarDuration));
  const star = clamp(starRatio * MAX_STAR_BONUS, 0, MAX_STAR_BONUS);

  const maxStreak = getMaxStreak(performances);
  const streak = clamp(calculateStreakBonus(maxStreak), 0, MAX_STREAK_BONUS);

  const bonus = clamp(perfect + vibrato + star + streak, 0, MAX_BONUS_SCORE);
  const total = clamp(pitch + timing + bonus, 0, MAX_SCORE);

  return {
    total,
    pitch,
    timing,
    bonus,
    bonusBreakdown: {
      perfect,
      vibrato,
      star,
      streak,
    },
    metrics: {
      pitchRatio,
      timingRatio,
      perfectRatio,
      starRatio,
      maxStreak,
    },
  };
}
