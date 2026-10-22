import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ColorName, StroopTrial } from '../types/stroop';
import { COLOR_CONFIGS, COLOR_KEYS, TRIAL_CONSTANTS } from '../utils/constants';
import { ArrowRight, CheckCircle2, XCircle } from 'lucide-react';

interface PracticePhaseProps {
  practiceTrials: StroopTrial[];
  onFinishPractice: () => void;
  onSkipPractice: () => void;
}

export const PracticePhase: React.FC<PracticePhaseProps> = ({
  practiceTrials,
  onFinishPractice,
  onSkipPractice,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [feedback, setFeedback] = useState<{
    selectedColor: ColorName | null;
    isCorrect: boolean;
    isTimeout: boolean;
    correctColor: ColorName;
    word: ColorName;
  } | null>(null);

  const [isCompleted, setIsCompleted] = useState(false);
  const [practiceStats, setPracticeStats] = useState({ correct: 0, total: 0 });

  const hasAnsweredRef = useRef<boolean>(false);
  const currentTrial = practiceTrials[currentIndex];

  const handleResponse = useCallback((color: ColorName) => {
    if (hasAnsweredRef.current || feedback !== null) return;
    hasAnsweredRef.current = true;

    const isCorrect = color === currentTrial.inkColor;
    setFeedback({
      selectedColor: color,
      isCorrect,
      isTimeout: false,
      correctColor: currentTrial.inkColor,
      word: currentTrial.word,
    });
    setPracticeStats((prev) => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1,
    }));
  }, [currentTrial, feedback]);

  // Reset answer state per trial
  useEffect(() => {
    if (isCompleted || !currentTrial) return;
    hasAnsweredRef.current = false;
    setFeedback(null);
  }, [currentIndex, isCompleted, currentTrial]);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (feedback !== null || hasAnsweredRef.current) return;
      const key = e.key.toLowerCase();

      if (key === '1' || key === 'r') handleResponse('RED');
      else if (key === '2' || key === 'b') handleResponse('BLUE');
      else if (key === '3' || key === 'g') handleResponse('GREEN');
      else if (key === '4' || key === 'y') handleResponse('YELLOW');
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleResponse, feedback]);

  const handleNext = () => {
    if (currentIndex + 1 < practiceTrials.length) {
      setCurrentIndex((prev) => prev + 1);
      setFeedback(null);
    } else {
      setIsCompleted(true);
    }
  };

  // Practice Completion Screen
  if (isCompleted) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 animate-fade-in text-center">
        <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-8 shadow-2xl backdrop-blur">
          <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-extrabold text-white mb-2">Practice Session Complete!</h2>
          <p className="text-sm text-slate-300 mb-6">
            You achieved <strong className="text-emerald-400">{practiceStats.correct} out of {practiceStats.total}</strong> correct on practice trials.
          </p>

          <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 text-xs text-slate-300 text-left mb-6 space-y-2">
            <p className="font-semibold text-indigo-300">Important Reminders for Scored Test:</p>
            <ul className="list-disc list-inside space-y-1 text-slate-400">
              <li>The real test contains <strong>{TRIAL_CONSTANTS.TOTAL_SCORED_TRIALS} items</strong> (25 congruent, 25 incongruent).</li>
              <li>Reaction time is automatically recorded for each item in the background.</li>
              <li><strong>NO correctness feedback</strong> will be displayed during the test.</li>
              <li>Practice results are not included in your final scores.</li>
            </ul>
          </div>

          <button
            onClick={onFinishPractice}
            className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition text-base active:scale-[0.99]"
          >
            <span>Begin Scored {TRIAL_CONSTANTS.TOTAL_SCORED_TRIALS}-Item Stroop Test</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  const activeColorConfig = COLOR_CONFIGS[currentTrial.inkColor];

  return (
    <div className="max-w-2xl mx-auto py-6 px-4">
      {/* Practice Header Bar */}
      <div className="flex items-center justify-between bg-slate-800/80 border border-slate-700/80 px-4 py-2.5 rounded-xl mb-4 text-xs">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold uppercase text-[10px]">
            Practice Mode
          </span>
          <span className="text-slate-300 font-mono">
            Item {currentIndex + 1} of {practiceTrials.length}
          </span>
        </div>
        <button
          onClick={onSkipPractice}
          className="text-slate-400 hover:text-slate-200 transition text-[11px] underline underline-offset-2"
        >
          Skip Practice &rarr;
        </button>
      </div>

      {/* Main Stimulus Card - Distraction-free, no visible countdown timer */}
      <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden text-center min-h-[380px] flex flex-col justify-between">
        {/* Centered Large Stimulus */}
        <div className="py-10 my-auto select-none">
          <div
            className="text-6xl sm:text-7xl md:text-8xl font-black font-mono tracking-widest drop-shadow-md transition-all scale-100"
            style={{
              color: activeColorConfig.hex,
              textShadow: `0 0 30px ${activeColorConfig.hex}77, 0 0 10px ${activeColorConfig.hex}aa`,
            }}
          >
            {currentTrial.word}
          </div>
          <p className="text-xs text-slate-400 mt-4 font-medium">
            (Identify the{' '}
            <span
              className="px-2 py-0.5 rounded font-bold uppercase"
              style={{
                backgroundColor: `${activeColorConfig.hex}22`,
                color: activeColorConfig.hex,
                border: `1px solid ${activeColorConfig.hex}55`,
              }}
            >
              INK COLOR
            </span>
            , not the word)
          </p>
        </div>

        {/* Feedback Banner if answered */}
        {feedback && (
          <div className={`p-4 rounded-xl border mb-4 animate-scale-up ${
            feedback.isCorrect
              ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
              : 'bg-rose-950/40 border-rose-500/50 text-rose-300'
          }`}>
            <div className="flex items-center justify-center gap-2 font-bold text-sm mb-1">
              {feedback.isCorrect ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span>Correct! The ink color is {feedback.correctColor}.</span>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-rose-400" />
                  <span>Incorrect. You chose {feedback.selectedColor}, but the ink was {feedback.correctColor}.</span>
                </>
              )}
            </div>
            <button
              onClick={handleNext}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow transition"
            >
              <span>Continue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* 4 Colored Response Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
          {COLOR_KEYS.map((color) => {
            const config = COLOR_CONFIGS[color];
            const isDisabled = feedback !== null;
            return (
              <button
                key={color}
                disabled={isDisabled}
                onClick={() => handleResponse(color)}
                className={`py-3.5 px-2 rounded-xl border-2 font-black text-sm sm:text-base transition-all select-none flex flex-col items-center justify-center gap-1 ${
                  isDisabled
                    ? 'opacity-40 cursor-not-allowed bg-slate-800/50 border-slate-700 text-slate-400'
                    : `cursor-pointer active:scale-95 shadow-md hover:brightness-125 ${config.buttonClass}`
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${config.dotClass}`} />
                  <span>{color}</span>
                </div>
                <span className="text-[10px] font-mono opacity-80 font-normal">
                  [{config.keyLabel}]
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
