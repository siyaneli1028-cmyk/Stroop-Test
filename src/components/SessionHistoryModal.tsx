import React, { useState } from 'react';
import {
  X,
  Database,
  Download,
  Trash2,
  Eye,
  EyeOff,
  Filter,
  FileSpreadsheet,
  AlertCircle,
  Upload,
  Share2,
  CheckCircle2,
} from 'lucide-react';
import { StoredSession } from '../types/stroop';
import {
  downloadCsv,
  generateCombinedTrialCsv,
  generateSummaryCsv,
} from '../utils/csvExport';

interface SessionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: StoredSession[];
  onDeleteSession: (id: string) => void;
  onClearAll: () => void;
  onSelectSession?: (session: StoredSession) => void;
  onLoadSampleData?: () => void;
  onImportSessions?: (sessions: StoredSession[]) => void;
}

export const SessionHistoryModal: React.FC<SessionHistoryModalProps> = ({
  isOpen,
  onClose,
  sessions,
  onDeleteSession,
  onClearAll,
  onSelectSession,
  onLoadSampleData,
  onImportSessions,
}) => {
  const [filterCondition, setFilterCondition] = useState<'ALL' | 'Observed' | 'Unobserved'>('ALL');
  const [confirmClear, setConfirmClear] = useState(false);
  const [importNotice, setImportNotice] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const filteredSessions = sessions.filter((s) => {
    if (filterCondition === 'ALL') return true;
    return s.groupCondition === filterCondition;
  });

  // Calculate Group Comparison Statistics (Observed vs Unobserved)
  const observedSessions = sessions.filter((s) => s.groupCondition === 'Observed');
  const unobservedSessions = sessions.filter((s) => s.groupCondition === 'Unobserved');

  const calcGroupStats = (group: StoredSession[]) => {
    if (group.length === 0) return { count: 0, meanAccuracy: null, meanRt: null, meanStroop: null };
    const totalAcc = group.reduce((sum, s) => sum + s.metrics.accuracyPercentage, 0);
    const validRts = group
      .map((s) => s.metrics.meanReactionTimeMs)
      .filter((rt): rt is number => rt !== null);
    const validStroops = group
      .map((s) => s.metrics.stroopInterferenceMs)
      .filter((st): st is number => st !== null);

    return {
      count: group.length,
      meanAccuracy: Math.round((totalAcc / group.length) * 10) / 10,
      meanRt: validRts.length > 0 ? Math.round((validRts.reduce((a, b) => a + b, 0) / validRts.length) * 10) / 10 : null,
      meanStroop: validStroops.length > 0 ? Math.round((validStroops.reduce((a, b) => a + b, 0) / validStroops.length) * 10) / 10 : null,
    };
  };

  const observedStats = calcGroupStats(observedSessions);
  const unobservedStats = calcGroupStats(unobservedSessions);

  // Master Export Handlers
  const handleExportMasterTrials = () => {
    const csv = generateCombinedTrialCsv(filteredSessions);
    const filename = `stroop_master_all_trials_${new Date().toISOString().slice(0, 10)}.csv`;
    downloadCsv(filename, csv);
  };

  const handleExportMasterSummary = () => {
    const summaries = filteredSessions.map((s) => s.metrics);
    const csv = generateSummaryCsv(summaries);
    const filename = `stroop_master_summary_${new Date().toISOString().slice(0, 10)}.csv`;
    downloadCsv(filename, csv);
  };

  // Export all sessions as JSON (for backup or transferring to other laptop/phone)
  const handleExportAllJson = () => {
    const jsonStr = JSON.stringify(sessions, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stroop_all_sessions_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Handle importing a file from another participant or device
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        const sessionsToImport: StoredSession[] = Array.isArray(parsed) ? parsed : [parsed];

        // Basic schema verification
        const valid = sessionsToImport.filter(
          (s) => s && s.participantId && s.metrics && Array.isArray(s.trialResults)
        );

        if (valid.length === 0) {
          setImportNotice('No valid session records found in file.');
          setTimeout(() => setImportNotice(null), 4000);
          return;
        }

        if (onImportSessions) {
          onImportSessions(valid);
          setImportNotice(`Successfully imported ${valid.length} session(s) from other device!`);
          setTimeout(() => setImportNotice(null), 4000);
        }
      } catch (err) {
        setImportNotice('Error parsing file. Please select a valid .json session file.');
        setTimeout(() => setImportNotice(null), 4000);
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl text-slate-100 flex flex-col justify-between">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Researcher Session Database</h2>
              <p className="text-xs text-slate-400">
                Local repository of recorded participants &bull; Comparative Analysis
              </p>
            </div>
          </div>

          {/* Group Comparison Dashboard (Hypothesis Testing) */}
          <div className="mb-6 p-4 bg-slate-800/80 rounded-xl border border-slate-700/80">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-1.5">
              <span>Study Comparison: Observed vs Unobserved Performance</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Observed Stats */}
              <div className="p-3 bg-amber-950/20 border border-amber-500/30 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between font-bold text-amber-400">
                  <div className="flex items-center gap-1.5">
                    <Eye className="w-4 h-4" />
                    <span>Observed Condition (N={observedStats.count})</span>
                  </div>
                  <span className="text-[10px] bg-amber-500/20 px-2 py-0.5 rounded">Experimental</span>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-1 font-mono">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Mean Acc</span>
                    <span className="text-white font-bold">{observedStats.meanAccuracy !== null ? `${observedStats.meanAccuracy}%` : 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Mean RT</span>
                    <span className="text-white font-bold">{observedStats.meanRt !== null ? `${observedStats.meanRt} ms` : 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Stroop Effect</span>
                    <span className="text-amber-300 font-bold">{observedStats.meanStroop !== null ? `${observedStats.meanStroop} ms` : 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Unobserved Stats */}
              <div className="p-3 bg-blue-950/20 border border-blue-500/30 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between font-bold text-blue-400">
                  <div className="flex items-center gap-1.5">
                    <EyeOff className="w-4 h-4" />
                    <span>Unobserved Condition (N={unobservedStats.count})</span>
                  </div>
                  <span className="text-[10px] bg-blue-500/20 px-2 py-0.5 rounded">Control</span>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-1 font-mono">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Mean Acc</span>
                    <span className="text-white font-bold">{unobservedStats.meanAccuracy !== null ? `${unobservedStats.meanAccuracy}%` : 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Mean RT</span>
                    <span className="text-white font-bold">{unobservedStats.meanRt !== null ? `${unobservedStats.meanRt} ms` : 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Stroop Effect</span>
                    <span className="text-blue-300 font-bold">{unobservedStats.meanStroop !== null ? `${unobservedStats.meanStroop} ms` : 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Bar & Filter */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            {/* Filter buttons */}
            <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs">
              <span className="px-2 text-slate-400 flex items-center gap-1">
                <Filter className="w-3 h-3" />
              </span>
              <button
                onClick={() => setFilterCondition('ALL')}
                className={`px-3 py-1 rounded-lg font-medium transition ${
                  filterCondition === 'ALL' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                All ({sessions.length})
              </button>
              <button
                onClick={() => setFilterCondition('Observed')}
                className={`px-3 py-1 rounded-lg font-medium transition ${
                  filterCondition === 'Observed' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Observed ({observedSessions.length})
              </button>
              <button
                onClick={() => setFilterCondition('Unobserved')}
                className={`px-3 py-1 rounded-lg font-medium transition ${
                  filterCondition === 'Unobserved' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Unobserved ({unobservedSessions.length})
              </button>
            </div>

            {/* Import & Master Export Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-cyan-300 bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-700/60 transition"
                title="Import participant session files (.json) exported from other devices"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Import File from Other Device</span>
              </button>

              {sessions.length > 0 && (
                <>
                  <button
                    onClick={handleExportMasterTrials}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow transition"
                    title="Download all trials across all participants"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Master Trial CSV</span>
                  </button>
                  <button
                    onClick={handleExportMasterSummary}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition"
                    title="Download summary row per participant"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Master Summary CSV</span>
                  </button>
                  <button
                    onClick={handleExportAllJson}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-850 hover:bg-slate-800 border border-slate-700 transition"
                    title="Export JSON backup to transfer to another device"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Backup JSON</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Import notification toast */}
          {importNotice && (
            <div className="p-3 bg-emerald-950/60 border border-emerald-500/50 rounded-xl text-emerald-300 text-xs flex items-center gap-2 mb-3 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{importNotice}</span>
            </div>
          )}

          {/* Sessions Table */}
          {filteredSessions.length === 0 ? (
            <div className="p-8 text-center text-slate-400 bg-slate-800/40 rounded-xl border border-slate-800 space-y-3">
              <p className="text-sm">No recorded sessions match the current filter.</p>
              <p className="text-xs text-slate-500">
                Complete a test run to log participant data, or generate sample sessions to test CSV export immediately:
              </p>
              {onLoadSampleData && (
                <button
                  onClick={onLoadSampleData}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md transition"
                >
                  <Download className="w-4 h-4" />
                  <span>Generate Sample Data (P001 Observed &amp; P002 Unobserved)</span>
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-700">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-800/80 text-slate-400 uppercase font-mono text-[11px] border-b border-slate-700">
                  <tr>
                    <th className="py-2.5 px-3">Participant ID</th>
                    <th className="py-2.5 px-3">Condition</th>
                    <th className="py-2.5 px-3">Accuracy</th>
                    <th className="py-2.5 px-3">Correct / Total</th>
                    <th className="py-2.5 px-3">Mean RT</th>
                    <th className="py-2.5 px-3">Stroop Effect</th>
                    <th className="py-2.5 px-3">Completed</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredSessions.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-800/60 transition">
                      <td className="py-2.5 px-3 font-mono font-bold text-white">{s.participantId}</td>
                      <td className="py-2.5 px-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${
                          s.groupCondition === 'Observed'
                            ? 'bg-amber-950/40 text-amber-300 border border-amber-500/30'
                            : 'bg-blue-950/40 text-blue-300 border border-blue-500/30'
                        }`}>
                          {s.groupCondition === 'Observed' ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                          {s.groupCondition}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-emerald-400">
                        {s.metrics.accuracyPercentage}%
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-300">
                        {s.metrics.correctAnswers} / {s.metrics.totalTrials}
                      </td>
                      <td className="py-2.5 px-3 font-mono">
                        {s.metrics.meanReactionTimeMs !== null ? `${s.metrics.meanReactionTimeMs} ms` : 'N/A'}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-purple-300">
                        {s.metrics.stroopInterferenceMs !== null ? `${s.metrics.stroopInterferenceMs} ms` : 'N/A'}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-400 text-[10px]">
                        {new Date(s.completedAt).toLocaleTimeString()}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {onSelectSession && (
                            <button
                              onClick={() => {
                                onSelectSession(s);
                                onClose();
                              }}
                              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-indigo-400 hover:text-indigo-300 font-semibold text-[11px]"
                            >
                              Inspect
                            </button>
                          )}
                          <button
                            onClick={() => onDeleteSession(s.id)}
                            className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition"
                            title="Delete session"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer with Clear All */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
          <div>
            {confirmClear ? (
              <div className="flex items-center gap-2">
                <span className="text-rose-400 flex items-center gap-1 font-semibold">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Erase all sessions?
                </span>
                <button
                  onClick={() => {
                    onClearAll();
                    setConfirmClear(false);
                  }}
                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded font-bold"
                >
                  Confirm Delete All
                </button>
                <button
                  onClick={() => setConfirmClear(false)}
                  className="px-2 py-1 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>
            ) : (
              sessions.length > 0 && (
                <button
                  onClick={() => setConfirmClear(true)}
                  className="text-slate-400 hover:text-rose-400 flex items-center gap-1 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear Local History</span>
                </button>
              )
            )}
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
