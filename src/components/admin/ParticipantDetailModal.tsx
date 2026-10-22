import React, { useState } from 'react';
import { X, Download, CheckCircle, XCircle, AlertTriangle, Clock, Activity, Zap, FileSpreadsheet } from 'lucide-react';
import { StoredSession, ColorName } from '../../types/stroop';
import { COLOR_CONFIGS } from '../../utils/constants';
import { exportParticipantTrialsCsv } from '../../utils/csvExport';

interface ParticipantDetailModalProps {
  session: StoredSession;
  onClose: () => void;
}

export const ParticipantDetailModal: React.FC<ParticipantDetailModalProps> = ({
  session,
  onClose,
}) => {
  const [filterType, setFilterType] = useState<'ALL' | 'CONGRUENT' | 'INCONGRUENT' | 'ERRORS'>('ALL');

  const { participantId, groupCondition, completedAt, trialResults = [] } = session;

  // Filter 50 items calculations
  const totalItems = trialResults.length;
  const congruentItems = trialResults.filter((t) => t.trialType === 'Congruent');
  const incongruentItems = trialResults.filter((t) => t.trialType === 'Incongruent');

  // Congruent statistics
  const congruentCorrect = congruentItems.filter((t) => t.isCorrect).length;
  const congruentIncorrect = congruentItems.filter((t) => !t.isCorrect && !t.isTimeout).length;
  const congruentTimeouts = congruentItems.filter((t) => t.isTimeout).length;
  const congruentAccuracy = congruentItems.length > 0 ? Math.round((congruentCorrect / congruentItems.length) * 1000) / 10 : 0;
  
  const congruentValidRts = congruentItems
    .map((t) => t.reactionTimeMs)
    .filter((rt): rt is number => typeof rt === 'number' && rt > 0);
  const congruentMeanRt = congruentValidRts.length > 0
    ? Math.round((congruentValidRts.reduce((a, b) => a + b, 0) / congruentValidRts.length) * 10) / 10
    : null;

  // Incongruent statistics
  const incongruentCorrect = incongruentItems.filter((t) => t.isCorrect).length;
  const incongruentIncorrect = incongruentItems.filter((t) => !t.isCorrect && !t.isTimeout).length;
  const incongruentTimeouts = incongruentItems.filter((t) => t.isTimeout).length;
  const incongruentAccuracy = incongruentItems.length > 0 ? Math.round((incongruentCorrect / incongruentItems.length) * 1000) / 10 : 0;
  
  const incongruentValidRts = incongruentItems
    .map((t) => t.reactionTimeMs)
    .filter((rt): rt is number => typeof rt === 'number' && rt > 0);
  const incongruentMeanRt = incongruentValidRts.length > 0
    ? Math.round((incongruentValidRts.reduce((a, b) => a + b, 0) / incongruentValidRts.length) * 10) / 10
    : null;

  // Correct vs Incorrect RTs across all items (excluding timeouts/missing RTs)
  const correctRts = trialResults
    .filter((t) => t.isCorrect && typeof t.reactionTimeMs === 'number' && t.reactionTimeMs > 0)
    .map((t) => t.reactionTimeMs as number);
  const meanCorrectRt = correctRts.length > 0
    ? Math.round((correctRts.reduce((a, b) => a + b, 0) / correctRts.length) * 10) / 10
    : null;

  const incorrectRts = trialResults
    .filter((t) => !t.isCorrect && !t.isTimeout && typeof t.reactionTimeMs === 'number' && t.reactionTimeMs > 0)
    .map((t) => t.reactionTimeMs as number);
  const meanIncorrectRt = incorrectRts.length > 0
    ? Math.round((incorrectRts.reduce((a, b) => a + b, 0) / incorrectRts.length) * 10) / 10
    : null;

  const totalCorrect = trialResults.filter((t) => t.isCorrect).length;
  const totalIncorrect = trialResults.filter((t) => !t.isCorrect && !t.isTimeout).length;
  const totalUnanswered = trialResults.filter((t) => t.isTimeout).length;
  const overallAccuracy = totalItems > 0 ? Math.round((totalCorrect / totalItems) * 1000) / 10 : 0;

  // Stroop effect interference
  const stroopInterference = incongruentMeanRt !== null && congruentMeanRt !== null
    ? Math.round((incongruentMeanRt - congruentMeanRt) * 10) / 10
    : null;

  // Filtered rows for the 50-item table
  const displayedTrials = trialResults.filter((t) => {
    if (filterType === 'CONGRUENT') return t.trialType === 'Congruent';
    if (filterType === 'INCONGRUENT') return t.trialType === 'Incongruent';
    if (filterType === 'ERRORS') return !t.isCorrect;
    return true;
  });

  const handleDownloadSingleCsv = () => {
    exportParticipantTrialsCsv(session);
  };

  const getColorConfig = (colorName: ColorName) => {
    return COLOR_CONFIGS[colorName] || {
      name: colorName,
      hex: '#ffffff',
      bgLightHex: '#334155',
      badgeClass: 'bg-slate-700 text-slate-100',
    };
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header Banner */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">
                  Participant {participantId} Detailed Results
                </h3>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  groupCondition === 'Observed'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                }`}>
                  {groupCondition} Condition
                </span>
                <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700">
                  {totalItems} Items Logged
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Completed: {completedAt ? new Date(completedAt).toLocaleString() : 'N/A'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadSingleCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition shadow-sm"
              title="Download 50 items CSV for this participant"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Download CSV</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Summary Breakdown Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* 1. Overall Performance Card */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Overall (50 Items)
                </span>
                <span className="text-xs font-bold text-indigo-400">
                  {overallAccuracy}% Acc
                </span>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Correct Answers:</span>
                  <span className="font-semibold text-emerald-400">{totalCorrect} / {totalItems}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Incorrect Answers:</span>
                  <span className="font-semibold text-rose-400">{totalIncorrect}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Unanswered / Timed out:</span>
                  <span className="font-semibold text-amber-400">{totalUnanswered}</span>
                </div>
                <div className="pt-2 border-t border-slate-800 flex justify-between">
                  <span className="text-slate-400">Mean RT (Correct):</span>
                  <span className="font-mono font-medium text-slate-200">
                    {meanCorrectRt !== null ? `${meanCorrectRt} ms` : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Mean RT (Incorrect):</span>
                  <span className="font-mono font-medium text-slate-200">
                    {meanIncorrectRt !== null ? `${meanIncorrectRt} ms` : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Congruent Trials Card (25 items) */}
            <div className="bg-emerald-950/20 border border-emerald-800/40 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                  Congruent ({congruentItems.length} Items)
                </span>
                <span className="text-xs font-bold text-emerald-300">
                  {congruentAccuracy}% Acc
                </span>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Correct:</span>
                  <span className="font-semibold text-emerald-300">{congruentCorrect} / {congruentItems.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Incorrect:</span>
                  <span className="font-semibold text-rose-300">{congruentIncorrect}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Unanswered:</span>
                  <span className="font-semibold text-amber-300">{congruentTimeouts}</span>
                </div>
                <div className="pt-2 border-t border-emerald-900/60 flex justify-between">
                  <span className="text-slate-400">Mean RT (All valid):</span>
                  <span className="font-mono font-medium text-emerald-200">
                    {congruentMeanRt !== null ? `${congruentMeanRt} ms` : 'N/A'}
                  </span>
                </div>
                <p className="text-[10px] text-emerald-400/70 pt-0.5">Word text and ink color matched.</p>
              </div>
            </div>

            {/* 3. Incongruent Trials Card (25 items) */}
            <div className="bg-amber-950/20 border border-amber-800/40 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                  Incongruent ({incongruentItems.length} Items)
                </span>
                <span className="text-xs font-bold text-amber-300">
                  {incongruentAccuracy}% Acc
                </span>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Correct:</span>
                  <span className="font-semibold text-emerald-300">{incongruentCorrect} / {incongruentItems.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Incorrect:</span>
                  <span className="font-semibold text-rose-300">{incongruentIncorrect}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Unanswered:</span>
                  <span className="font-semibold text-amber-300">{incongruentTimeouts}</span>
                </div>
                <div className="pt-2 border-t border-amber-900/60 flex justify-between">
                  <span className="text-slate-400">Mean RT (All valid):</span>
                  <span className="font-mono font-medium text-amber-200">
                    {incongruentMeanRt !== null ? `${incongruentMeanRt} ms` : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between text-indigo-300 font-semibold pt-0.5">
                  <span>Stroop Interference:</span>
                  <span className="font-mono">{stroopInterference !== null ? `+${stroopInterference} ms` : 'N/A'}</span>
                </div>
              </div>
            </div>

          </div>

          {/* Filtering and Table Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400 mr-2 font-medium">Show items:</span>
              <button
                onClick={() => setFilterType('ALL')}
                className={`text-xs px-3 py-1 rounded-lg border transition ${
                  filterType === 'ALL'
                    ? 'bg-indigo-600 text-white border-indigo-500'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                All 50 Items ({trialResults.length})
              </button>
              <button
                onClick={() => setFilterType('CONGRUENT')}
                className={`text-xs px-3 py-1 rounded-lg border transition ${
                  filterType === 'CONGRUENT'
                    ? 'bg-emerald-600 text-white border-emerald-500'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                Congruent Only ({congruentItems.length})
              </button>
              <button
                onClick={() => setFilterType('INCONGRUENT')}
                className={`text-xs px-3 py-1 rounded-lg border transition ${
                  filterType === 'INCONGRUENT'
                    ? 'bg-amber-600 text-white border-amber-500'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                Incongruent Only ({incongruentItems.length})
              </button>
              <button
                onClick={() => setFilterType('ERRORS')}
                className={`text-xs px-3 py-1 rounded-lg border transition ${
                  filterType === 'ERRORS'
                    ? 'bg-rose-600 text-white border-rose-500'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                Errors &amp; Unanswered ({totalIncorrect + totalUnanswered})
              </button>
            </div>

            <div className="text-[11px] text-slate-400 italic">
              * Note: Missing / unanswered reaction times are not treated as 0 ms.
            </div>
          </div>

          {/* Full 50-Item Table */}
          <div className="border border-slate-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto max-h-[380px]">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/90 sticky top-0 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Item #</th>
                    <th className="py-2.5 px-3">Condition</th>
                    <th className="py-2.5 px-4">Stimulus Presented (Word / Ink)</th>
                    <th className="py-2.5 px-3">Correct Answer</th>
                    <th className="py-2.5 px-3">Participant Response</th>
                    <th className="py-2.5 px-3">Accuracy Status</th>
                    <th className="py-2.5 px-3 text-right">Reaction Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {displayedTrials.map((trial) => {
                    const inkConf = getColorConfig(trial.inkColor);
                    const isCongruent = trial.trialType === 'Congruent';
                    const isUnanswered = trial.isTimeout || !trial.selectedResponse;

                    return (
                      <tr
                        key={trial.trialNumber}
                        className={`hover:bg-slate-800/40 transition ${
                          !trial.isCorrect ? 'bg-rose-950/15' : ''
                        }`}
                      >
                        <td className="py-2.5 px-3 text-slate-400 font-sans font-semibold">
                          #{trial.trialNumber}
                        </td>
                        <td className="py-2.5 px-3 font-sans">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              isCongruent
                                ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/50'
                                : 'bg-amber-950/60 text-amber-400 border border-amber-800/50'
                            }`}
                          >
                            {trial.trialType}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 font-sans">
                          <div className="inline-flex items-center gap-2">
                            <span
                              className="font-black tracking-wider text-sm px-2 py-0.5 rounded bg-slate-950 border border-slate-800"
                              style={{ color: inkConf.hex }}
                            >
                              {trial.displayedWord}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              (ink: {trial.inkColor})
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 font-sans">
                          <span
                            className="font-bold text-xs px-2 py-0.5 rounded"
                            style={{
                              backgroundColor: `${inkConf.hex}22`,
                              color: inkConf.hex,
                              border: `1px solid ${inkConf.hex}44`,
                            }}
                          >
                            {trial.inkColor}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-sans">
                          {isUnanswered ? (
                            <span className="text-amber-400/80 italic text-xs font-sans">
                              (No Response)
                            </span>
                          ) : (
                            <span className="font-semibold text-xs text-slate-200">
                              {trial.selectedResponse}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-sans">
                          {isUnanswered ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>No Response</span>
                            </span>
                          ) : trial.isCorrect ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Correct</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-400">
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Incorrect</span>
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {trial.reactionTimeMs !== null ? (
                            <span className="font-mono text-slate-200 font-medium">
                              {trial.reactionTimeMs.toFixed(1)} ms
                            </span>
                          ) : (
                            <span className="text-slate-500 italic text-[11px]">
                              N/A
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={onClose}
              className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition"
            >
              Close Detailed View
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
