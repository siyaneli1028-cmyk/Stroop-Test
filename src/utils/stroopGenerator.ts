import { ColorName, StroopTrial } from '../types/stroop';
import { COLOR_KEYS, TRIAL_CONSTANTS } from './constants';

/**
 * Fisher-Yates array shuffle
 */
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Generates exactly 50 scored items (or configured total):
 * - 25 Congruent trials (word matches ink color)
 * - 25 Incongruent trials (word != ink color)
 * - 4 colors (RED, BLUE, GREEN, YELLOW) balanced across trials
 * - Fully randomized presentation order
 */
export function generateScoredTrials(
  totalCount: number = TRIAL_CONSTANTS.TOTAL_SCORED_TRIALS
): StroopTrial[] {
  const congruentCount = Math.floor(totalCount / 2); // 25
  const incongruentCount = totalCount - congruentCount; // 25

  const congruentList: Array<{ word: ColorName; inkColor: ColorName }> = [];
  const incongruentList: Array<{ word: ColorName; inkColor: ColorName }> = [];

  // Generate Congruent items (balanced across the 4 colors)
  const congruentColors: ColorName[] = [];
  for (let i = 0; i < congruentCount; i++) {
    congruentColors.push(COLOR_KEYS[i % COLOR_KEYS.length]);
  }
  const shuffledCongruentColors = shuffleArray(congruentColors);
  shuffledCongruentColors.forEach((color) => {
    congruentList.push({
      word: color,
      inkColor: color,
    });
  });

  // Generate Incongruent items (balanced across the 4 colors)
  const incongruentInkColors: ColorName[] = [];
  for (let i = 0; i < incongruentCount; i++) {
    incongruentInkColors.push(COLOR_KEYS[i % COLOR_KEYS.length]);
  }
  const shuffledIncongruentInks = shuffleArray(incongruentInkColors);

  // Track word assignments to avoid over-representation of any word-color pair
  shuffledIncongruentInks.forEach((ink, idx) => {
    const candidates = COLOR_KEYS.filter((c) => c !== ink);
    // Cycle candidates for even distribution
    const chosenWord = candidates[idx % candidates.length];
    incongruentList.push({
      word: chosenWord,
      inkColor: ink,
    });
  });

  // Combine congruent and incongruent items
  const combined = [
    ...congruentList.map((item) => ({ ...item, trialType: 'Congruent' as const })),
    ...incongruentList.map((item) => ({ ...item, trialType: 'Incongruent' as const })),
  ];

  // Completely shuffle the 50 items
  const randomized = shuffleArray(combined);

  // Assign sequential 1-indexed trial numbers and unique IDs
  return randomized.map((item, index) => ({
    id: `trial-${index + 1}-${Math.random().toString(36).substring(2, 7)}`,
    trialNumber: index + 1,
    word: item.word,
    inkColor: item.inkColor,
    trialType: item.trialType,
    isPractice: false,
  }));
}

/**
 * Generates 4 practice trials (2 congruent, 2 incongruent)
 */
export function generatePracticeTrials(): StroopTrial[] {
  const practiceItems: Array<{ word: ColorName; inkColor: ColorName; trialType: 'Congruent' | 'Incongruent' }> = [
    { word: 'RED', inkColor: 'RED', trialType: 'Congruent' },
    { word: 'GREEN', inkColor: 'BLUE', trialType: 'Incongruent' },
    { word: 'YELLOW', inkColor: 'YELLOW', trialType: 'Congruent' },
    { word: 'BLUE', inkColor: 'GREEN', trialType: 'Incongruent' },
  ];

  const shuffled = shuffleArray(practiceItems);

  return shuffled.map((item, index) => ({
    id: `practice-${index + 1}`,
    trialNumber: index + 1,
    word: item.word,
    inkColor: item.inkColor,
    trialType: item.trialType,
    isPractice: true,
  }));
}

/**
 * Generates a realistic completed 50-item session for researcher pipeline verification & CSV testing
 */
export function generateMockSession(
  participantId: string,
  condition: 'Observed' | 'Unobserved'
) {
  const trials = generateScoredTrials(50);
  const now = Date.now();

  const results = trials.map((t, idx) => {
    // Realistic psychology RT distributions:
    // Congruent mean ~ 620ms (SD ~ 70ms)
    // Incongruent mean ~ 780ms (SD ~ 110ms)
    const isCongruent = t.trialType === 'Congruent';
    const baseRt = isCongruent ? 620 : 790;
    // Add observed social facilitation / pressure effect
    const conditionFactor = condition === 'Observed' ? 25 : 0;
    const jitter = Math.floor((Math.random() - 0.5) * 140);
    const rt = Math.max(380, baseRt + conditionFactor + jitter);

    // 92% accuracy on congruent, 86% on incongruent
    const accuracyRoll = Math.random();
    const threshold = isCongruent ? 0.94 : 0.88;
    const isCorrect = accuracyRoll < threshold;

    let selectedResponse = t.inkColor;
    if (!isCorrect) {
      // Picked wrong response
      const wrongCandidates = COLOR_KEYS.filter((c) => c !== t.inkColor);
      selectedResponse = wrongCandidates[idx % wrongCandidates.length];
    }

    const onset = new Date(now - (50 - idx) * 2500).toISOString();

    return {
      participantId,
      groupCondition: condition,
      trialNumber: t.trialNumber,
      displayedWord: t.word,
      inkColor: t.inkColor,
      trialType: t.trialType,
      selectedResponse,
      isCorrect,
      reactionTimeMs: rt,
      isTimeout: false,
      stimulusOnsetTimestamp: onset,
      onsetMonotonicMs: 1000 + idx * 2500,
    };
  });

  return results;
}
