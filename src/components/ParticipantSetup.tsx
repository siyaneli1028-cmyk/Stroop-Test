import React, { useState } from 'react';
import { Eye, EyeOff, ShieldCheck, ArrowRight, Sparkles, AlertCircle, HardDrive, HelpCircle } from 'lucide-react';
import { GroupCondition } from '../types/stroop';
import { STUDY_TITLE, TRIAL_CONSTANTS } from '../utils/constants';

interface ParticipantSetupProps {
  initialParticipantId: string;
  initialCondition: GroupCondition;
  onProceed: (participantId: string, condition: GroupCondition) => void;
  onOpenProtocol: () => void;
}

export const ParticipantSetup: React.FC<ParticipantSetupProps> = ({
  initialParticipantId,
  initialCondition,
  onProceed,
  onOpenProtocol,
}) => {
  const [participantId, setParticipantId] = useState(initialParticipantId);
  const [condition, setCondition] = useState<GroupCondition>(initialCondition);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = participantId.trim().toUpperCase();
    if (!cleanId) {
      setError('Please provide a Participant ID (e.g., P001).');
      return;
    }
    if (cleanId.length < 2) {
      setError('Participant ID should be at least 2 characters (e.g., P01).');
      return;
    }
    setError(null);
    onProceed(cleanId, condition);
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {/* Title Card */}
      <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 md:p-8 shadow-xl backdrop-blur">
        <div className="text-center mb-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Experimental Psychology Study
          </span>
          <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">
            {STUDY_TITLE}
          </h2>
          <p className="text-sm text-slate-400 mt-2">
            Stroop Color-Word Experimental Protocol &bull; {TRIAL_CONSTANTS.TOTAL_SCORED_TRIALS} Scored Trials ({TRIAL_CONSTANTS.CONGRUENT_TRIALS_COUNT} Congruent, {TRIAL_CONSTANTS.INCONGRUENT_TRIALS_COUNT} Incongruent)
          </p>
        </div>

        {/* Data Privacy & Storage Disclosure */}
        <div className="mb-6 p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-xl flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-300 space-y-1">
            <p className="font-semibold text-emerald-300">
              IRB & Ethics Notice: No Full Names Collected &bull; Local Storage Only
            </p>
            <p className="text-slate-400 leading-relaxed">
              To safeguard participant anonymity, do not enter full names. Only standardized participant identification codes
              (e.g., P001) are recorded.
            </p>
            <div className="flex items-center gap-1.5 text-emerald-400/90 font-mono text-[11px] pt-1">
              <HardDrive className="w-3.5 h-3.5" />
              <span>Storage status: <strong>Local Browser Device Only</strong>. No data or telemetry are sent to remote servers.</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Participant ID */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="participantId" className="block text-sm font-semibold text-slate-200">
                1. Participant ID <span className="text-rose-400">*</span>
              </label>
              <span className="text-xs text-slate-400 font-mono">Use coded pseudonym (e.g. P001)</span>
            </div>
            <div className="relative">
              <input
                id="participantId"
                type="text"
                value={participantId}
                onChange={(e) => {
                  setParticipantId(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="e.g. P001, P042"
                maxLength={15}
                className="w-full bg-slate-900 border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-3 text-slate-100 font-mono text-base tracking-wide transition placeholder:text-slate-600"
              />
            </div>
            {error && (
              <p className="mt-2 text-xs text-rose-400 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {error}
              </p>
            )}
          </div>

          {/* Group Condition Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-slate-200">
                2. Experimental Group Condition <span className="text-rose-400">*</span>
              </label>
              <button
                type="button"
                onClick={onOpenProtocol}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                <HelpCircle className="w-3 h-3" />
                View Observation Protocol
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Observed Option */}
              <label
                className={`relative flex flex-col p-4 rounded-xl border cursor-pointer transition select-none ${
                  condition === 'Observed'
                    ? 'bg-amber-950/20 border-amber-500 ring-2 ring-amber-500/20 shadow-lg'
                    : 'bg-slate-900/60 border-slate-700/80 hover:border-slate-600 hover:bg-slate-850'
                }`}
              >
                <input
                  type="radio"
                  name="groupCondition"
                  value="Observed"
                  checked={condition === 'Observed'}
                  onChange={() => setCondition('Observed')}
                  className="sr-only"
                />
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 font-semibold text-white text-sm">
                    <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                      <Eye className="w-4 h-4" />
                    </div>
                    <span>Observed Group</span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${
                    condition === 'Observed' ? 'bg-amber-500/30 text-amber-300' : 'bg-slate-800 text-slate-400'
                  }`}>
                    Experimental
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  The experimenter sits in view with an observation clipboard, observing the participant throughout the test.
                </p>
              </label>

              {/* Unobserved Option */}
              <label
                className={`relative flex flex-col p-4 rounded-xl border cursor-pointer transition select-none ${
                  condition === 'Unobserved'
                    ? 'bg-blue-950/20 border-blue-500 ring-2 ring-blue-500/20 shadow-lg'
                    : 'bg-slate-900/60 border-slate-700/80 hover:border-slate-600 hover:bg-slate-850'
                }`}
              >
                <input
                  type="radio"
                  name="groupCondition"
                  value="Unobserved"
                  checked={condition === 'Unobserved'}
                  onChange={() => setCondition('Unobserved')}
                  className="sr-only"
                />
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 font-semibold text-white text-sm">
                    <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
                      <EyeOff className="w-4 h-4" />
                    </div>
                    <span>Unobserved Group</span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${
                    condition === 'Unobserved' ? 'bg-blue-500/30 text-blue-300' : 'bg-slate-800 text-slate-400'
                  }`}>
                    Control
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  The participant completes the test alone in the cubicle. The experimenter is completely outside the room.
                </p>
              </label>
            </div>
          </div>

          {/* Test Protocol Parameters Summary */}
          <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl">
            <h4 className="text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">
              Standardized Parameters (Identical for Both Conditions)
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2 bg-slate-800/60 rounded-lg">
                <span className="text-slate-400 block text-[10px]">Scored Trials</span>
                <span className="font-bold text-white text-sm font-mono">{TRIAL_CONSTANTS.TOTAL_SCORED_TRIALS}</span>
              </div>
              <div className="p-2 bg-slate-800/60 rounded-lg">
                <span className="text-slate-400 block text-[10px]">Congruent / Incong.</span>
                <span className="font-bold text-white text-sm font-mono">{TRIAL_CONSTANTS.CONGRUENT_TRIALS_COUNT} / {TRIAL_CONSTANTS.INCONGRUENT_TRIALS_COUNT}</span>
              </div>
              <div className="p-2 bg-slate-800/60 rounded-lg">
                <span className="text-slate-400 block text-[10px]">Timer Display</span>
                <span className="font-bold text-emerald-400 text-sm font-mono">Hidden (Silent RT)</span>
              </div>
              <div className="p-2 bg-slate-800/60 rounded-lg">
                <span className="text-slate-400 block text-[10px]">Practice Items</span>
                <span className="font-bold text-cyan-400 text-sm font-mono">{TRIAL_CONSTANTS.PRACTICE_TRIALS_COUNT} Optional</span>
              </div>
            </div>
          </div>

          {/* Action button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition text-base active:scale-[0.99]"
            >
              <span>Continue to Test Instructions</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
