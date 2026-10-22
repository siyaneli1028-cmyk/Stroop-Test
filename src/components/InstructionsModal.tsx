import React from 'react';
import { Play, Sparkles, AlertTriangle, Clock, Keyboard, Eye, EyeOff } from 'lucide-react';
import { GroupCondition } from '../types/stroop';
import { COLOR_CONFIGS, TRIAL_CONSTANTS } from '../utils/constants';

interface InstructionsProps {
  participantId: string;
  condition: GroupCondition;
  onStartPractice: () => void;
  onSkipToTest: () => void;
}

export const Instructions: React.FC<InstructionsProps> = ({
  participantId,
  condition,
  onStartPractice,
  onSkipToTest,
}) => {
  return (
    <div className="max-w-3xl mx-auto py-8 px-4 animate-fade-in">
      <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 md:p-8 shadow-2xl backdrop-blur">
        {/* Header Banner */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700/80 pb-5 mb-6">
          <div>
            <span className="text-xs font-mono font-semibold text-indigo-400 uppercase tracking-wider block">
              Standardized Experimental Instructions
            </span>
            <h2 className="text-2xl font-extrabold text-white">Stroop Color-Word Task</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-slate-900 border border-slate-700 text-xs px-3 py-1.5 rounded-lg font-mono text-slate-300">
              ID: <strong className="text-white">{participantId}</strong>
            </span>
            <span className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold border ${
              condition === 'Observed'
                ? 'bg-amber-950/30 text-amber-300 border-amber-600/40'
                : 'bg-blue-950/30 text-blue-300 border-blue-600/40'
            }`}>
              {condition === 'Observed' ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              {condition} Condition
            </span>
          </div>
        </div>

        {/* Core Task Rule (Crucial) */}
        <div className="p-5 bg-indigo-950/30 border-2 border-indigo-500/40 rounded-xl mb-6">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-indigo-600 text-white rounded-lg font-bold shrink-0 text-sm">
              RULE
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-1">
                Name the INK COLOR — DO NOT read the word!
              </h3>
              <p className="text-sm text-slate-200 leading-relaxed">
                A series of color words will appear on the screen one at a time. Your goal is to identify the
                <strong className="text-amber-300 underline underline-offset-4 mx-1">color of the ink</strong>
                in which the word is printed, while ignoring the meaning of the written word.
              </p>
            </div>
          </div>
        </div>

        {/* Concrete Illustrative Examples */}
        <div className="mb-6">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
            Illustrative Examples:
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Example 1: Incongruent */}
            <div className="p-4 bg-slate-900/90 border border-slate-700 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[11px] font-mono uppercase text-slate-400 block mb-1">Stimulus:</span>
                <span className="text-2xl font-black font-mono tracking-wider" style={{ color: COLOR_CONFIGS.BLUE.hex }}>
                  RED
                </span>
                <p className="text-[11px] text-slate-400 mt-1">Word says &ldquo;RED&rdquo;, but ink is Blue</p>
              </div>
              <div className="text-right">
                <span className="text-[11px] font-mono text-emerald-400 block mb-1">Correct Answer:</span>
                <span className="inline-block px-3 py-1 bg-blue-600 text-white font-bold text-sm rounded-lg shadow">
                  BLUE
                </span>
              </div>
            </div>

            {/* Example 2: Congruent */}
            <div className="p-4 bg-slate-900/90 border border-slate-700 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[11px] font-mono uppercase text-slate-400 block mb-1">Stimulus:</span>
                <span className="text-2xl font-black font-mono tracking-wider" style={{ color: COLOR_CONFIGS.GREEN.hex }}>
                  GREEN
                </span>
                <p className="text-[11px] text-slate-400 mt-1">Word says &ldquo;GREEN&rdquo; and ink is Green</p>
              </div>
              <div className="text-right">
                <span className="text-[11px] font-mono text-emerald-400 block mb-1">Correct Answer:</span>
                <span className="inline-block px-3 py-1 bg-emerald-600 text-white font-bold text-sm rounded-lg shadow">
                  GREEN
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Input Methods & Keyboard Shortcuts */}
        <div className="mb-6 p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-300 mb-3">
            <Keyboard className="w-4 h-4 text-cyan-400" />
            <span>Response Methods (Touch, Mouse, or Keyboard)</span>
          </div>
          <p className="text-xs text-slate-300 mb-3">
            You may click the on-screen buttons or use your keyboard keys. Both methods record reaction time with millisecond precision:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
            <div className="p-2.5 bg-slate-800 rounded-lg border border-slate-700">
              <span className="font-bold text-red-400 block text-sm mb-1">RED</span>
              <span className="font-mono text-[11px] text-slate-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                Key: 1 or R
              </span>
            </div>
            <div className="p-2.5 bg-slate-800 rounded-lg border border-slate-700">
              <span className="font-bold text-blue-400 block text-sm mb-1">BLUE</span>
              <span className="font-mono text-[11px] text-slate-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                Key: 2 or B
              </span>
            </div>
            <div className="p-2.5 bg-slate-800 rounded-lg border border-slate-700">
              <span className="font-bold text-emerald-400 block text-sm mb-1">GREEN</span>
              <span className="font-mono text-[11px] text-slate-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                Key: 3 or G
              </span>
            </div>
            <div className="p-2.5 bg-slate-800 rounded-lg border border-slate-700">
              <span className="font-bold text-amber-300 block text-sm mb-1">YELLOW</span>
              <span className="font-mono text-[11px] text-slate-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                Key: 4 or Y
              </span>
            </div>
          </div>
        </div>

        {/* Timing & Scoring Rules Notice */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8 text-xs text-slate-300">
          <div className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-800 flex items-start gap-2.5">
            <Clock className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block mb-0.5">Reaction-Time Recording</strong>
              Your reaction time is measured automatically in milliseconds for each item from stimulus onset to response. Respond as quickly and accurately as possible.
            </div>
          </div>
          <div className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-800 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block mb-0.5">No Feedback During Test</strong>
              To prevent learning confound, the scored test does not reveal if answers were right or wrong until the final debrief.
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={onStartPractice}
            className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition text-sm active:scale-[0.99]"
          >
            <Sparkles className="w-4 h-4" />
            <span>Start Practice (4 Trials) &mdash; Recommended</span>
          </button>

          <button
            onClick={onSkipToTest}
            className="w-full sm:w-auto flex items-center justify-center gap-2 py-3.5 px-5 rounded-xl font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition text-sm"
          >
            <Play className="w-4 h-4 text-emerald-400" />
            <span>Skip Practice &amp; Start {TRIAL_CONSTANTS.TOTAL_SCORED_TRIALS}-Item Test</span>
          </button>
        </div>
      </div>
    </div>
  );
};
