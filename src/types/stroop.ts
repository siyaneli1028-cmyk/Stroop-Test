export type ColorName = 'RED' | 'BLUE' | 'GREEN' | 'YELLOW';

export type GroupCondition = 'Observed' | 'Unobserved';

export type TrialType = 'Congruent' | 'Incongruent';

export interface StroopColorConfig {
  name: ColorName;
  hex: string;
  bgLightHex: string;
  badgeClass: string;
  buttonClass: string;
  dotClass: string;
  keyLabel: string;
  numericKey: string;
  charKey: string;
}

export interface StroopTrial {
  id: string;
  trialNumber: number; // 1 to 20 (or 1 to 4 for practice)
  word: ColorName;
  inkColor: ColorName;
  trialType: TrialType;
  isPractice: boolean;
}

export interface TrialResult {
  participantId: string;
  groupCondition: GroupCondition;
  trialNumber: number;
  displayedWord: ColorName;
  inkColor: ColorName;
  trialType: TrialType;
  selectedResponse: ColorName | null;
  isCorrect: boolean;
  reactionTimeMs: number | null; // null if timeout
  isTimeout: boolean;
  stimulusOnsetTimestamp: string; // ISO 8601
  onsetMonotonicMs: number;
}

export interface SessionMetrics {
  participantId: string;
  groupCondition: GroupCondition;
  completedAt: string;
  totalTrials: number;
  correctAnswers: number;
  incorrectAnswers: number;
  timeouts: number;
  accuracyPercentage: number;
  meanReactionTimeMs: number | null; // valid responses
  meanCorrectReactionTimeMs: number | null;
  
  // Congruent
  congruentTotal: number;
  congruentCorrect: number;
  congruentAccuracy: number;
  congruentMeanRtMs: number | null;
  
  // Incongruent
  incongruentTotal: number;
  incongruentCorrect: number;
  incongruentAccuracy: number;
  incongruentMeanRtMs: number | null;
  
  // Stroop Interference (Incongruent RT - Congruent RT)
  stroopInterferenceMs: number | null;
}

export interface StoredSession {
  id: string;
  participantId: string;
  groupCondition: GroupCondition;
  startedAt: string;
  completedAt: string;
  metrics: SessionMetrics;
  trialResults: TrialResult[];
}

export type AppPhase =
  | 'SETUP'
  | 'INSTRUCTIONS'
  | 'PRACTICE_INTRO'
  | 'PRACTICE_ACTIVE'
  | 'PRACTICE_FEEDBACK'
  | 'PRE_TEST_READY'
  | 'TEST_ACTIVE'
  | 'RESULTS';
