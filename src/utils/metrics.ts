import { GroupCondition, SessionMetrics, TrialResult } from '../types/stroop';
import { TRIAL_CONSTANTS } from './constants';

export function calculateSessionMetrics(
  participantId: string,
  groupCondition: GroupCondition,
  results: TrialResult[]
): SessionMetrics {
  const totalTrials = results.length > 0 ? results.length : TRIAL_CONSTANTS.TOTAL_SCORED_TRIALS;
  let correctAnswers = 0;
  let incorrectAnswers = 0;
  let timeouts = 0;

  const validRts: number[] = [];
  const correctRts: number[] = [];

  let congruentTotal = 0;
  let congruentCorrect = 0;
  const congruentRts: number[] = [];

  let incongruentTotal = 0;
  let incongruentCorrect = 0;
  const incongruentRts: number[] = [];

  results.forEach((trial) => {
    if (trial.isTimeout) {
      timeouts++;
    } else {
      if (trial.reactionTimeMs !== null) {
        validRts.push(trial.reactionTimeMs);
      }
      if (trial.isCorrect) {
        correctAnswers++;
        if (trial.reactionTimeMs !== null) {
          correctRts.push(trial.reactionTimeMs);
        }
      } else {
        incorrectAnswers++;
      }
    }

    if (trial.trialType === 'Congruent') {
      congruentTotal++;
      if (trial.isCorrect) {
        congruentCorrect++;
      }
      if (!trial.isTimeout && trial.reactionTimeMs !== null) {
        congruentRts.push(trial.reactionTimeMs);
      }
    } else {
      incongruentTotal++;
      if (trial.isCorrect) {
        incongruentCorrect++;
      }
      if (!trial.isTimeout && trial.reactionTimeMs !== null) {
        incongruentRts.push(trial.reactionTimeMs);
      }
    }
  });

  const mean = (arr: number[]): number | null => {
    if (arr.length === 0) return null;
    const sum = arr.reduce((acc, val) => acc + val, 0);
    return Math.round((sum / arr.length) * 10) / 10;
  };

  const meanReactionTimeMs = mean(validRts);
  const meanCorrectReactionTimeMs = mean(correctRts);
  const congruentMeanRtMs = mean(congruentRts);
  const incongruentMeanRtMs = mean(incongruentRts);

  const accuracyPercentage = totalTrials > 0 ? Math.round((correctAnswers / totalTrials) * 1000) / 10 : 0;
  const congruentAccuracy = congruentTotal > 0 ? Math.round((congruentCorrect / congruentTotal) * 1000) / 10 : 0;
  const incongruentAccuracy = incongruentTotal > 0 ? Math.round((incongruentCorrect / incongruentTotal) * 1000) / 10 : 0;

  let stroopInterferenceMs: number | null = null;
  if (incongruentMeanRtMs !== null && congruentMeanRtMs !== null) {
    stroopInterferenceMs = Math.round((incongruentMeanRtMs - congruentMeanRtMs) * 10) / 10;
  }

  return {
    participantId,
    groupCondition,
    completedAt: new Date().toISOString(),
    totalTrials,
    correctAnswers,
    incorrectAnswers,
    timeouts,
    accuracyPercentage,
    meanReactionTimeMs,
    meanCorrectReactionTimeMs,
    congruentTotal,
    congruentCorrect,
    congruentAccuracy,
    congruentMeanRtMs,
    incongruentTotal,
    incongruentCorrect,
    incongruentAccuracy,
    incongruentMeanRtMs,
    stroopInterferenceMs,
  };
}
