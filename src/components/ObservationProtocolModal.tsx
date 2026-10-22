import React from 'react';
import { Eye, EyeOff, ShieldCheck, FileText, CheckCircle2, X } from 'lucide-react';
import { GroupCondition } from '../types/stroop';

interface ProtocolModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeCondition?: GroupCondition;
}

export const ObservationProtocolModal: React.FC<ProtocolModalProps> = ({
  isOpen,
  onClose,
  activeCondition,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl text-slate-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          aria-label="Close protocol modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-400">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Experimental Protocol & Standardization Guide</h2>
            <p className="text-xs text-slate-400">Study: The Effect of Being Observed on Task Performance Among Psychology Students</p>
          </div>
        </div>

        <div className="space-y-5 text-sm">
          {/* Methodological Context */}
          <div className="p-4 bg-slate-800/60 rounded-xl border border-slate-700/60">
            <h3 className="font-semibold text-slate-200 mb-1 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Standardization Requirement (Zajonc Social Facilitation Paradigm)
            </h3>
            <p className="text-slate-300 leading-relaxed text-xs">
              To isolate the independent variable (the psychological effect of being observed) from extraneous variables,
              both groups must receive <strong>identical computerized instructions, identical stimulus timings (15s limit),
              and identical keyboard/touch inputs</strong>.
            </p>
          </div>

          {/* Condition Comparison Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Observed Condition */}
            <div className={`p-4 rounded-xl border ${
              activeCondition === 'Observed'
                ? 'bg-amber-950/20 border-amber-500/50 ring-1 ring-amber-500/30'
                : 'bg-slate-800/40 border-slate-700/80'
            }`}>
              <div className="flex items-center gap-2 mb-2 text-amber-400 font-semibold">
                <Eye className="w-4 h-4" />
                Condition 1: Observed (Experimental)
              </div>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span>Experimenter sits <strong>1.0 meter beside or slightly behind</strong> the participant, with direct visual line of sight to the participant and screen.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span>Experimenter holds a clipboard/tablet and takes visible notes during the test to reinforce evaluation apprehension.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span>Experimenter maintains silent, neutral demeanor without offering encouragement or corrections.</span>
                </li>
              </ul>
            </div>

            {/* Unobserved Condition */}
            <div className={`p-4 rounded-xl border ${
              activeCondition === 'Unobserved'
                ? 'bg-blue-950/20 border-blue-500/50 ring-1 ring-blue-500/30'
                : 'bg-slate-800/40 border-slate-700/80'
            }`}>
              <div className="flex items-center gap-2 mb-2 text-blue-400 font-semibold">
                <EyeOff className="w-4 h-4" />
                Condition 2: Unobserved (Control)
              </div>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                  <span>Experimenter explains the software setup and then <strong>leaves the experimental cubicle completely</strong>.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                  <span>Door is closed; the participant performs the 20 items in complete solitude.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                  <span>Participant opens door or rings bell when the Results screen appears.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Scripted Instructions */}
          <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/60">
            <h4 className="font-semibold text-slate-200 mb-1">Standardized Verbal Script (Verbatim)</h4>
            <blockquote className="italic text-xs text-slate-300 border-l-2 border-indigo-400 pl-3 py-1 bg-slate-900/60 rounded">
              &ldquo;Please read the instructions on screen. You will see 20 color words. Your goal is to report the INK COLOR as quickly and accurately as possible within 15 seconds per item. You may practice with 4 practice trials first. Once you are ready, please press Start.&rdquo;
            </blockquote>
          </div>

          {/* Ethical & Privacy note */}
          <div className="text-xs text-slate-400 border-t border-slate-800 pt-3">
            <strong>Ethics & Privacy Compliance:</strong> In accordance with APA ethical standards, participant identities are coded using pseudonyms (e.g., P001). No real names or biometric data are gathered. All data are maintained locally in your browser storage.
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition shadow-lg shadow-indigo-600/20"
          >
            I Understand & Close Protocol
          </button>
        </div>
      </div>
    </div>
  );
};
