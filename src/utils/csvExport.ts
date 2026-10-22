import { SessionMetrics, StoredSession, TrialResult } from '../types/stroop';

/**
 * Escapes CSV field value according to RFC 4180
 */
function escapeCsvValue(val: string | number | boolean | null | undefined): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Downloads a string as a CSV file in the browser
 */
export function downloadCsv(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generates trial-level CSV with the exact columns requested:
 * Participant ID, Group condition, Trial number, Displayed word, Ink color,
 * Trial type, Selected response, Correct or incorrect, Reaction time (ms),
 * Timeout status, Stimulus onset timestamp
 */
export function generateTrialLevelCsv(trialResults: TrialResult[]): string {
  const headers = [
    'Participant ID',
    'Group condition',
    'Trial number',
    'Displayed word',
    'Ink color',
    'Trial type',
    'Selected response',
    'Correct or incorrect',
    'Reaction time (ms)',
    'Timeout status',
    'Stimulus onset timestamp',
  ];

  const rows = trialResults.map((t) => [
    t.participantId,
    t.groupCondition,
    t.trialNumber,
    t.displayedWord,
    t.inkColor,
    t.trialType,
    t.selectedResponse ?? 'UNANSWERED',
    t.isTimeout ? 'UNANSWERED' : t.isCorrect ? 'CORRECT' : 'INCORRECT',
    t.reactionTimeMs !== null ? t.reactionTimeMs : 'NA',
    t.isTimeout ? 'TRUE' : 'FALSE',
    t.stimulusOnsetTimestamp,
  ]);

  const csvLines = [
    headers.map(escapeCsvValue).join(','),
    ...rows.map((row) => row.map(escapeCsvValue).join(',')),
  ];

  return csvLines.join('\r\n');
}

/**
 * Generates Summary CSV containing:
 * Participant ID, Group condition, Correct answers, Incorrect answers, Timeouts,
 * Accuracy percentage, Mean reaction time (and research metrics)
 */
export function generateSummaryCsv(metricsList: SessionMetrics[]): string {
  const headers = [
    'Participant ID',
    'Group condition',
    'Correct answers',
    'Incorrect answers',
    'Timeouts',
    'Accuracy percentage',
    'Mean reaction time',
    'Mean correct reaction time (ms)',
    'Congruent accuracy (%)',
    'Congruent mean RT (ms)',
    'Incongruent accuracy (%)',
    'Incongruent mean RT (ms)',
    'Stroop interference effect (ms)',
    'Completed timestamp',
  ];

  const rows = metricsList.map((m) => [
    m.participantId,
    m.groupCondition,
    m.correctAnswers,
    m.incorrectAnswers,
    m.timeouts,
    m.accuracyPercentage,
    m.meanReactionTimeMs !== null ? m.meanReactionTimeMs : 'NA',
    m.meanCorrectReactionTimeMs !== null ? m.meanCorrectReactionTimeMs : 'NA',
    m.congruentAccuracy,
    m.congruentMeanRtMs !== null ? m.congruentMeanRtMs : 'NA',
    m.incongruentAccuracy,
    m.incongruentMeanRtMs !== null ? m.incongruentMeanRtMs : 'NA',
    m.stroopInterferenceMs !== null ? m.stroopInterferenceMs : 'NA',
    m.completedAt,
  ]);

  const csvLines = [
    headers.map(escapeCsvValue).join(','),
    ...rows.map((row) => row.map(escapeCsvValue).join(',')),
  ];

  return csvLines.join('\r\n');
}

/**
 * Generates multi-participant master trial-level CSV from all stored sessions
 */
export function generateCombinedTrialCsv(sessions: StoredSession[]): string {
  const allTrials = sessions.flatMap((s) => s.trialResults);
  return generateTrialLevelCsv(allTrials);
}

/**
 * Downloads trial-level CSV for a single participant
 */
export function exportParticipantTrialsCsv(session: StoredSession): void {
  const csv = generateTrialLevelCsv(session.trialResults || []);
  const safePId = session.participantId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `stroop_${safePId}_${session.groupCondition}_50items.csv`;
  downloadCsv(filename, csv);
}

