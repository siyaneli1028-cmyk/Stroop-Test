import React from 'react';
import { Eye, EyeOff, RotateCcw, Database, BookOpen, Activity, Lock, DownloadCloud, ShieldCheck } from 'lucide-react';
import { AppPhase, GroupCondition } from '../types/stroop';
import { STUDY_TITLE } from '../utils/constants';

interface HeaderProps {
  phase: AppPhase;
  participantId: string;
  condition: GroupCondition;
  savedSessionsCount: number;
  onOpenProtocol: () => void;
  onOpenHistory: () => void;
  onOpenDownloadApp: () => void;
  onResetTest: () => void;
  onOpenAdmin: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  phase,
  participantId,
  condition,
  savedSessionsCount,
  onOpenProtocol,
  onOpenHistory,
  onOpenDownloadApp,
  onResetTest,
  onOpenAdmin,
}) => {
  const isTestingActive = phase === 'TEST_ACTIVE' || phase === 'PRACTICE_ACTIVE';

  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 flex flex-wrap items-center justify-between gap-3">
        {/* Study Title & Affiliation */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 border border-indigo-500/30 rounded-lg text-indigo-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-semibold text-indigo-400 font-mono">
                Psychology Experimental Lab
              </span>
              <span className="text-[10px] bg-slate-800 text-slate-400 border border-slate-700 rounded px-1.5 py-0.5">
                Stroop Protocol (50 Items)
              </span>
            </div>
            <h1 className="text-sm sm:text-base font-bold text-slate-100 truncate max-w-md sm:max-w-xl">
              {STUDY_TITLE}
            </h1>
          </div>
        </div>

        {/* Status Indicators & Researcher Controls */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Active Participant & Condition Pill */}
          {participantId && (
            <div className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700 text-xs px-2.5 py-1.5 rounded-lg font-mono">
              <span className="text-slate-400">Participant:</span>
              <span className="font-bold text-white">{participantId}</span>
              <span className="text-slate-600">|</span>
              <span className={`flex items-center gap-1 font-semibold ${
                condition === 'Observed' ? 'text-amber-400' : 'text-blue-400'
              }`}>
                {condition === 'Observed' ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                {condition}
              </span>
            </div>
          )}

          {/* Local Storage disclosure pill */}
          <div
            title="Ethical compliance: All data are retained strictly on this local device. No data is transmitted to remote servers."
            className="hidden lg:flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-950/30 border border-emerald-500/20 px-2 py-1 rounded"
          >
            <Lock className="w-3 h-3 text-emerald-400" />
            <span>Local Storage</span>
          </div>

          {/* Protocol Button */}
          <button
            onClick={onOpenProtocol}
            className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 px-2.5 py-1.5 rounded-lg transition"
            title="Standardized Observation Protocol Guide"
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Protocol Guide</span>
          </button>

          {/* Session History Log Button */}
          <button
            onClick={onOpenHistory}
            className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 px-2.5 py-1.5 rounded-lg transition"
            title="View Saved Sessions & Download CSVs"
          >
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            <span>History &amp; CSV ({savedSessionsCount})</span>
          </button>

          {/* Researcher Admin Portal Button */}
          {!isTestingActive && (
            <button
              onClick={onOpenAdmin}
              className="flex items-center gap-1.5 text-xs text-indigo-200 hover:text-white bg-indigo-950/60 hover:bg-indigo-900 border border-indigo-700/80 px-2.5 py-1.5 rounded-lg transition shadow-sm"
              title="Faculty / Researcher Admin Portal (Login Protected)"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span className="font-medium">Admin Portal</span>
            </button>
          )}

          {/* Download App Code Button */}
          <button
            onClick={onOpenDownloadApp}
            className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-700 px-2.5 py-1.5 rounded-lg transition"
            title="Download the complete application code (.ZIP) or install to desktop"
          >
            <DownloadCloud className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Download App</span>
          </button>

          {/* Reset Test (Researcher Control) */}
          <button
            onClick={onResetTest}
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition ${
              isTestingActive
                ? 'bg-rose-950/40 text-rose-300 border-rose-800/80 hover:bg-rose-900/60'
                : 'text-slate-400 hover:text-slate-200 bg-slate-800 border-slate-700 hover:bg-slate-700'
            }`}
            title="Reset test or start new participant session"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Reset</span>
          </button>
        </div>
      </div>
    </header>
  );
};
