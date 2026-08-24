import { GAME_MODE, NoteFrequencyRecord } from '~/interfaces';
import { GameStateClass } from '~/modules/game-engine/game-state/game-state';
import { ScoringV2Result } from '~/modules/game-engine/game-state/helpers/calculate-score-v2';
import { generateNote, generatePlayerNote, generateSong } from '~/modules/utils/test-utils';

const result = (value: number, maxStreak: number): ScoringV2Result => ({
  total: value,
  pitch: value * 0.65,
  timing: value * 0.25,
  bonus: value * 0.1,
  bonusBreakdown: {
    perfect: value * 0.035,
    vibrato: value * 0.015,
    star: value * 0.03,
    streak: value * 0.02,
  },
  metrics: {
    pitchRatio: value / 10_000,
    timingRatio: value / 10_000,
    perfectRatio: value / 10_000,
    starRatio: value / 10_000,
    maxStreak,
  },
});

const frequencyRecords = (preciseDistance: number): NoteFrequencyRecord[] => [
  { frequency: 440, preciseDistance, timestamp: 0 },
];

describe('GameState Scoring V2', () => {
  it('exposes the numeric and detailed V2 result for one player', () => {
    const note = generateNote(0, 4);
    const sections = [{ start: 0, type: 'notes' as const, notes: [note] }];
    const song = generateSong([sections], { mergedTrack: { sections, changes: [] } });
    const gameState = new GameStateClass();
    gameState.setSong(song);
    gameState.setSingSetup({
      id: 'v2-single',
      mode: GAME_MODE.DUEL,
      players: [{ number: 0, track: 0 }],
      tolerance: 2,
    });
    gameState
      .getPlayer(0)!
      .getPlayerNotes()
      .push(generatePlayerNote(note, 0, 0, note.length, false, false, frequencyRecords(0)));

    expect(gameState.getPlayerScoreResultV2(0)).toMatchObject({
      total: 9_000,
      pitch: 6_500,
      timing: 2_500,
    });
    expect(gameState.getPlayerScoreV2(0)).toBe(9_000);
  });

  it('averages CO_OP values and keeps the greatest max streak', () => {
    const note = generateNote(0, 1);
    const song = generateSong([[{ start: 0, type: 'notes', notes: [note] }]]);
    const gameState = new GameStateClass();
    gameState.setSong(song);
    gameState.setSingSetup({
      id: 'v2-coop',
      mode: GAME_MODE.CO_OP,
      players: [
        { number: 0, track: 0 },
        { number: 1, track: 0 },
      ],
      tolerance: 2,
    });
    vi.spyOn(gameState.getPlayer(0)!, 'getScoreV2').mockReturnValue(result(4_000, 4));
    vi.spyOn(gameState.getPlayer(1)!, 'getScoreV2').mockReturnValue(result(8_000, 12));

    const coopResult = gameState.getPlayerScoreResultV2(0);
    expect(coopResult).toMatchObject({
      total: 6_000,
      pitch: 3_900,
      timing: 1_500,
      bonus: 600,
      bonusBreakdown: {
        perfect: 210,
        vibrato: 90,
        star: 180,
        streak: 120,
      },
      metrics: { maxStreak: 12 },
    });
    expect(coopResult.metrics.pitchRatio).toBeCloseTo(0.6);
    expect(coopResult.metrics.timingRatio).toBeCloseTo(0.6);
    expect(coopResult.metrics.perfectRatio).toBeCloseTo(0.6);
    expect(coopResult.metrics.starRatio).toBeCloseTo(0.6);
    expect(gameState.getPlayerScoreV2(1)).toBe(6_000);
  });

  it('returns zero and reports an invalid V2 result instead of leaking NaN to the UI', () => {
    const note = generateNote(0, 1);
    const song = generateSong([[{ start: 0, type: 'notes', notes: [note] }]], {
      mergedTrack: { sections: [{ start: 0, type: 'notes', notes: [note] }], changes: [] },
    });
    const gameState = new GameStateClass();
    gameState.setSong(song);
    gameState.setSingSetup({
      id: 'v2-invalid',
      mode: GAME_MODE.DUEL,
      players: [{ number: 0, track: 0 }],
      tolerance: 2,
    });
    vi.spyOn(gameState.getPlayer(0)!, 'getScoreV2').mockReturnValue({ ...result(4_000, 4), total: Number.NaN });
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    expect(gameState.getPlayerScoreResultV2(0).total).toBe(0);
    expect(consoleError).toHaveBeenCalledWith('Invalid Scoring V2 result', expect.objectContaining({ total: NaN }));

    consoleError.mockRestore();
  });

  it('keeps the legacy score API unchanged', () => {
    const note = generateNote(0, 1);
    const sections = [{ start: 0, type: 'notes' as const, notes: [note] }];
    const song = generateSong([sections], { mergedTrack: { sections, changes: [] } });
    const gameState = new GameStateClass();
    gameState.setSong(song);
    gameState.setSingSetup({
      id: 'legacy',
      mode: GAME_MODE.DUEL,
      players: [{ number: 0, track: 0 }],
      tolerance: 2,
    });
    const player = gameState.getPlayer(0)!;

    expect(gameState.getPlayerScore(0)).toBe(player.getScore());
  });
});
