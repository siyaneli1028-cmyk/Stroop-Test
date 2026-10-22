import { ColorName, StroopColorConfig } from '../types/stroop';

export const COLOR_CONFIGS: Record<ColorName, StroopColorConfig> = {
  RED: {
    name: 'RED',
    hex: '#EF4444',
    bgLightHex: '#FEE2E2',
    badgeClass: 'bg-red-500/20 text-red-400 border-red-500/40',
    buttonClass: 'border-red-500/70 bg-red-950/30 hover:bg-red-900/50 hover:border-red-400 text-red-400 shadow-md shadow-red-500/10 ring-red-500/30',
    dotClass: 'bg-red-500 shadow-[0_0_8px_#ef4444]',
    keyLabel: 'R / 1',
    numericKey: '1',
    charKey: 'r',
  },
  BLUE: {
    name: 'BLUE',
    hex: '#3B82F6',
    bgLightHex: '#DBEAFE',
    badgeClass: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
    buttonClass: 'border-blue-500/70 bg-blue-950/30 hover:bg-blue-900/50 hover:border-blue-400 text-blue-400 shadow-md shadow-blue-500/10 ring-blue-500/30',
    dotClass: 'bg-blue-500 shadow-[0_0_8px_#3b82f6]',
    keyLabel: 'B / 2',
    numericKey: '2',
    charKey: 'b',
  },
  GREEN: {
    name: 'GREEN',
    hex: '#10B981',
    bgLightHex: '#D1FAE5',
    badgeClass: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
    buttonClass: 'border-emerald-500/70 bg-emerald-950/30 hover:bg-emerald-900/50 hover:border-emerald-400 text-emerald-400 shadow-md shadow-emerald-500/10 ring-emerald-500/30',
    dotClass: 'bg-emerald-500 shadow-[0_0_8px_#10b981]',
    keyLabel: 'G / 3',
    numericKey: '3',
    charKey: 'g',
  },
  YELLOW: {
    name: 'YELLOW',
    hex: '#FACC15',
    bgLightHex: '#FEF08A',
    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    buttonClass: 'border-amber-400/80 bg-amber-950/30 hover:bg-amber-900/50 hover:border-amber-300 text-amber-300 shadow-md shadow-amber-400/10 ring-amber-400/30',
    dotClass: 'bg-amber-400 shadow-[0_0_8px_#facc15]',
    keyLabel: 'Y / 4',
    numericKey: '4',
    charKey: 'y',
  },
};

export const COLOR_KEYS: ColorName[] = ['RED', 'BLUE', 'GREEN', 'YELLOW'];

export const TRIAL_CONSTANTS = {
  TOTAL_SCORED_TRIALS: 50,
  CONGRUENT_TRIALS_COUNT: 25,
  INCONGRUENT_TRIALS_COUNT: 25,
  PRACTICE_TRIALS_COUNT: 4,
  TIME_LIMIT_SECONDS: 15,
  TIME_LIMIT_MS: 15000,
  FIXATION_DURATION_MS: 0, // Direct seamless transition so color never disappears
};

export const STUDY_TITLE = "The Effect of Being Observed on Task Performance Among Psychology Students";
export const STUDY_SUBTITLE = "Standardized Experimental Stroop Color-Word Protocol (50-Trial Version)";
