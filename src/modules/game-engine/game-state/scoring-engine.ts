export type ScoringEngine = 'legacy' | 'v2';

export const SCORING_ENGINE: ScoringEngine = 'v2';

export const isScoringV2Enabled = (engine: ScoringEngine = SCORING_ENGINE) => engine === 'v2';

// V2 must not enter the legacy 3.5M-point high-score UI or storage until that data is versioned.
export const areLegacyHighScoresEnabled = (engine: ScoringEngine = SCORING_ENGINE) => engine === 'legacy';
