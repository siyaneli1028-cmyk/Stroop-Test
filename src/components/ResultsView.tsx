import React, { useState } from 'react';
import {
  Download,
  CheckCircle2,
  XCircle,
  Clock,
  BarChart3,
  ArrowRight,
  Database,
  FileSpreadsheet,
  Copy,
  Check,
  Eye,
  EyeOff,
  TrendingUp,
  RotateCcw,
  Sparkles,
  Share2,
} from 'lucide-react';
import { SessionMetrics, StoredSession, TrialResult } from '../types/stroop';
import { COLOR_CONFIGS } from '../utils/constants';
import {
  downloadCsv,
  generateTrialLevelCsv,
  generateSummaryCsv,
} from '../utils/csvExport';

interface ResultsViewProps {
  session: StoredSession;
  onStartNextParticipant: () => void;
  onOpenHistory: () => void;
  onResetTest: () => void;
}

export const ResultsView: React.FC<ResultsViewProps> = ({
  session,
  onStartNextParticipant,
  onOpenHistory,
  onResetTest,
}) => {
  const [filterType, setFilterType] = useState<'ALL' | 'Congruent' | 'Incongruent'>('ALL');
  const [copied, setCopied] = useState(false);

  const { metrics, trialResults, participantId, groupCondition } = session;

  // Download Trial-Level CSV
  const handleDownloadTrialCsv = () => {
    const csv = generateTrialLevelCsv(trialResults);
    const filename = `stroop_${participantId}_${groupCondition}_trials.csv`;
    downloadCsv(filename, csv);
  };

  // Download Summary CSV
  const handleDownloadSummaryCsv = () => {
    const csv = generateSummaryCsv([metrics]);
    const filename = `stroop_${participantId}_${groupCondition}_summary.csv`;
    downloadCsv(filename, csv);
  };

  // Download complete Session JSON for transfer across devices
  const handleDownloadSessionJson = () => {
    const jsonStr = JSON.stringify(session, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stroop_${participantId}_${groupCondition}_session.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Copy Summary text to clipboard
  const handleCopySummary = async () => {
    const text = [
      `STROOP COLOR-WORD TEST RESULTS`,
      `Participant ID: ${participantId}`,
      `Group Condition: ${groupCondition}`,
      `Completed At: ${new Date(metrics.completedAt).toLocaleString()}`,
      `----------------------------------------`,
      `Total Trials: ${metrics.totalTrials}`,
      `Correct: ${metrics.correctAnswers} / ${metrics.totalTrials} (${metrics.accuracyPercentage}%)`,
      `Incorrect: ${metrics.incorrectAnswers}`,
      `Timeouts: ${metrics.timeouts}`,
      `Mean RT (Valid): ${metrics.meanReactionTimeMs !== null ? `${metrics.meanReactionTimeMs} ms` : 'N/A'}`,
      `Mean RT (Correct): ${metrics.meanCorrectReactionTimeMs !== null ? `${metrics.meanCorrectReactionTimeMs} ms` : 'N/A'}`,
      `----------------------------------------`,
      `Congruent Trials: ${metrics.congruentCorrect}/${metrics.congruentTotal} (${metrics.congruentAccuracy}%) | Mean RT: ${metrics.congruentMeanRtMs} ms`,
      `Incongruent Trials: ${metrics.incongruentCorrect}/${metrics.incongruentTotal} (${metrics.incongruentAccuracy}%) | Mean RT: ${metrics.incongruentMeanRtMs} ms`,
      `Stroop Interference Effect: ${metrics.stroopInterferenceMs !== null ? `${metrics.stroopInterferenceMs > 0 ? '+' : ''}${metrics.stroopInterferenceMs} ms` : 'N/A'}`,
    ].join('\n');

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  // Filtered trial results
  const filteredTrials = trialResults.filter((t) => {
    if (filterType === 'ALL') return true;
    return t.trialType === filterType;
  });

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-6 animate-fade-in">
      {/* Top Banner */}
      <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-6 shadow-xl backdrop-blur flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono uppercase tracking-wider text-indigo-400 font-semibold">
              Research Debrief &bull; {metrics.totalTrials}-Item Scored Session
            </span>
            <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
              groupCondition === 'Observed'
                ? 'bg-amber-950/40 text-amber-300 border-amber-500/40'
                : 'bg-blue-950/40 text-blue-300 border-blue-500/40'
            }`}>
              {groupCondition === 'Observed' ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              {groupCondition} Condition
            </span>
          </div>
          <h2 className="text-2xl font-black text-white">
            Performance Summary: Participant <span className="text-indigo-400 font-mono">{participantId}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Completed on {new Date(metrics.completedAt).toLocaleString()} &bull; Monotonic timer precision recorded
          </p>
        </div>

        {/* Quick CSV Export & Copy Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleDownloadTrialCsv}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/20 transition active:scale-95"
            title="Download trial-level CSV with all 50 trials"
          >
            <Download className="w-4 h-4" />
            <span>Download Trial CSV</span>
          </button>

          <button
            onClick={handleDownloadSummaryCsv}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-200 bg-slate-700 hover:bg-slate-600 border border-slate-600 shadow-md transition active:scale-95"
            title="Download participant summary CSV"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Download Summary CSV</span>
          </button>

          <button
            onClick={handleDownloadSessionJson}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition"
            title="Export session JSON to transfer to researcher's device"
          >
            <Share2 className="w-4 h-4 text-cyan-400" />
            <span>Export for Other Device</span>
          </button>

          <button
            onClick={handleCopySummary}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition"
            title="Copy formatted summary to clipboard"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
            <span>{copied ? 'Copied!' : 'Copy Summary'}</span>
          </button>
        </div>
      </div>

      {/* Primary Key Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Correct Answers */}
        <div className="bg-slate-800/80 border border-slate-700/80 p-4 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Correct</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <span className="text-2xl font-black text-white font-mono">{metrics.correctAnswers}</span>
            <span className="text-xs text-slate-400 ml-1 font-mono">/ {metrics.totalTrials}</span>
          </div>
          <span className="text-[10px] text-emerald-400 mt-1 font-semibold">
            {metrics.accuracyPercentage}% Accuracy
          </span>
        </div>

        {/* Incorrect Answers */}
        <div className="bg-slate-800/80 border border-slate-700/80 p-4 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Incorrect</span>
            <XCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div>
            <span className="text-2xl font-black text-white font-mono">{metrics.incorrectAnswers}</span>
            <span className="text-xs text-slate-400 ml-1 font-mono">errors</span>
          </div>
          <span className="text-[10px] text-rose-400 mt-1">
            {Math.round((metrics.incorrectAnswers / metrics.totalTrials) * 1000) / 10}% Error rate
          </span>
        </div>

        {/* Unanswered / Skipped */}
        <div className="bg-slate-800/80 border border-slate-700/80 p-4 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Unanswered</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <span className="text-2xl font-black text-white font-mono">{metrics.timeouts}</span>
            <span className="text-xs text-slate-400 ml-1 font-mono">skipped</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1">
            {metrics.timeouts === 0 ? 'All answered' : `${metrics.timeouts} unanswered`}
          </span>
        </div>

        {/* Mean RT (All Valid) */}
        <div className="bg-slate-800/80 border border-slate-700/80 p-4 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Mean RT (Valid)</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <span className="text-2xl font-black text-cyan-400 font-mono">
              {metrics.meanReactionTimeMs !== null ? metrics.meanReactionTimeMs : 'N/A'}
            </span>
            <span className="text-xs text-slate-400 ml-1">ms</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1">Across all responded items</span>
        </div>

        {/* Mean RT (Correct Only) */}
        <div className="bg-slate-800/80 border border-slate-700/80 p-4 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Mean RT (Correct)</span>
            <TrendingUp className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <span className="text-2xl font-black text-indigo-400 font-mono">
              {metrics.meanCorrectReactionTimeMs !== null ? metrics.meanCorrectReactionTimeMs : 'N/A'}
            </span>
            <span className="text-xs text-slate-400 ml-1">ms</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1">Correct responses only</span>
        </div>

        {/* Stroop Interference Effect */}
        <div className="bg-slate-800/80 border border-slate-700/80 p-4 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Stroop Effect</span>
            <Sparkles className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <span className="text-2xl font-black text-purple-400 font-mono">
              {metrics.stroopInterferenceMs !== null
                ? `${metrics.stroopInterferenceMs > 0 ? '+' : ''}${metrics.stroopInterferenceMs}`
                : 'N/A'}
            </span>
            <span className="text-xs text-slate-400 ml-1">ms</span>
          </div>
          <span className="text-[10px] text-purple-300/80 mt-1">Incongruent - Congruent</span>
        </div>
      </div>

      {/* Congruent vs Incongruent Experimental Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Congruent Card */}
        <div className="bg-slate-800/70 border border-emerald-500/30 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h3 className="font-bold text-white text-base">Congruent Condition (25 Trials)</h3>
            </div>
            <span className="text-xs font-mono bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
              Word matches ink
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
              <span className="text-[11px] text-slate-400 block mb-0.5">Accuracy</span>
              <div className="text-xl font-bold font-mono text-emerald-400">
                {metrics.congruentAccuracy}%
              </div>
              <span className="text-[10px] text-slate-400">
                {metrics.congruentCorrect} of {metrics.congruentTotal} correct
              </span>
            </div>

            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
              <span className="text-[11px] text-slate-400 block mb-0.5">Mean RT</span>
              <div className="text-xl font-bold font-mono text-white">
                {metrics.congruentMeanRtMs !== null ? `${metrics.congruentMeanRtMs} ms` : 'N/A'}
              </div>
              <span className="text-[10px] text-slate-400">Baseline facilitation</span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Congruent Accuracy Bar</span>
              <span>{metrics.congruentAccuracy}%</span>
            </div>
            <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${metrics.congruentAccuracy}%` }}
              />
            </div>
          </div>
        </div>

        {/* Incongruent Card */}
        <div className="bg-slate-800/70 border border-purple-500/30 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-pulse" />
              <h3 className="font-bold text-white text-base">Incongruent Condition (25 Trials)</h3>
            </div>
            <span className="text-xs font-mono bg-purple-950/60 text-purple-300 border border-purple-500/30 px-2.5 py-0.5 rounded-full">
              Word conflicts with ink
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
              <span className="text-[11px] text-slate-400 block mb-0.5">Accuracy</span>
              <div className="text-xl font-bold font-mono text-purple-400">
                {metrics.incongruentAccuracy}%
              </div>
              <span className="text-[10px] text-slate-400">
                {metrics.incongruentCorrect} of {metrics.incongruentTotal} correct
              </span>
            </div>

            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
              <span className="text-[11px] text-slate-400 block mb-0.5">Mean RT</span>
              <div className="text-xl font-bold font-mono text-white">
                {metrics.incongruentMeanRtMs !== null ? `${metrics.incongruentMeanRtMs} ms` : 'N/A'}
              </div>
              <span className="text-[10px] text-purple-300/80">Cognitive interference</span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Incongruent Accuracy Bar</span>
              <span>{metrics.incongruentAccuracy}%</span>
            </div>
            <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
              <div
                className="bg-purple-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${metrics.incongruentAccuracy}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Trial-by-Trial Data Table */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-white text-base">
              Item-Level Trial Log ({trialResults.length} Items)
            </h3>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-700 text-xs">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                filterType === 'ALL' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({trialResults.length})
            </button>
            <button
              onClick={() => setFilterType('Congruent')}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                filterType === 'Congruent' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Congruent ({metrics.congruentTotal})
            </button>
            <button
              onClick={() => setFilterType('Incongruent')}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                filterType === 'Incongruent' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Incongruent ({metrics.incongruentTotal})
            </button>
          </div>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-700/80">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/90 text-slate-400 uppercase font-mono text-[11px] border-b border-slate-700">
              <tr>
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">Word</th>
                <th className="py-2.5 px-3">Ink Color</th>
                <th className="py-2.5 px-3">Trial Type</th>
                <th className="py-2.5 px-3">Selected</th>
                <th className="py-2.5 px-3">Outcome</th>
                <th className="py-2.5 px-3 text-right">RT (ms)</th>
                <th className="py-2.5 px-3 text-right">Onset Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredTrials.map((trial) => {
                const inkCfg = COLOR_CONFIGS[trial.inkColor];
                return (
                  <tr key={trial.trialNumber} className="hover:bg-slate-750/50 transition">
                    <td className="py-2.5 px-3 font-mono text-slate-400">{trial.trialNumber}</td>
                    <td className="py-2.5 px-3 font-bold text-white font-mono">{trial.displayedWord}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className="inline-block px-2 py-0.5 rounded font-bold font-mono text-[11px]"
                        style={{ backgroundColor: `${inkCfg.hex}22`, color: inkCfg.hex }}
                      >
                        {trial.inkColor}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        trial.trialType === 'Congruent'
                          ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30'
                          : 'bg-purple-950/60 text-purple-300 border border-purple-500/30'
                      }`}>
                        {trial.trialType}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono">
                      {trial.selectedResponse ? (
                        <span className="font-bold text-slate-200">{trial.selectedResponse}</span>
                      ) : (
                        <span className="text-amber-400 italic">Unanswered</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      {trial.isTimeout ? (
                        <span className="inline-flex items-center gap-1 text-amber-400 font-semibold">
                          <Clock className="w-3.5 h-3.5" />
                          Unanswered
                        </span>
                      ) : trial.isCorrect ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Correct
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-400 font-semibold">
                          <XCircle className="w-3.5 h-3.5" />
                          Incorrect
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold">
                      {trial.reactionTimeMs !== null ? (
                        <span className="text-white">{trial.reactionTimeMs}</span>
                      ) : (
                        <span className="text-slate-500">N/A</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-400 text-[10px]">
                      {new Date(trial.stimulusOnsetTimestamp).toLocaleTimeString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Researcher Action Footer */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h4 className="font-bold text-white text-sm">Next Research Action</h4>
          <p className="text-xs text-slate-400">
            Session saved in browser storage. Proceed to next participant or examine session logs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onOpenHistory}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition"
          >
            <Database className="w-4 h-4 text-cyan-400" />
            <span>View All Sessions</span>
          </button>

          <button
            onClick={onResetTest}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset / Reconfigure</span>
          </button>

          <button
            onClick={onStartNextParticipant}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition active:scale-95"
          >
            <span>Start Next Participant</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
