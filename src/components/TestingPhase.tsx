import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ColorName, GroupCondition, StroopTrial, TrialResult } from '../types/stroop';
import { COLOR_CONFIGS, COLOR_KEYS } from '../utils/constants';
import { Eye, EyeOff, SkipForward } from 'lucide-react';

interface TestingPhaseProps {
  participantId: string;
  condition: GroupCondition;
  trials: StroopTrial[];
  onComplete: (results: TrialResult[]) => void;
}

export const TestingPhase: React.FC<TestingPhaseProps> = ({
  participantId,
  condition,
  trials,
  onComplete,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<TrialResult[]>([]);

  // Refs for high-precision monotonic timing (runs silently in the background)
  const onsetMonotonicRef = useRef<number>(0);
  const onsetIsoTimestampRef = useRef<string>('');
  const hasRespondedRef = useRef<boolean>(false);

  const currentTrial = trials[currentIndex] || trials[0];
  const totalTrials = trials.length;

  // Process advance to next trial or finish
  const advanceToNext = useCallback(
    (trialResult: TrialResult) => {
      const updatedResults = [...results, trialResult];
      setResults(updatedResults);

      if (currentIndex + 1 < totalTrials) {
        // Advance immediately to next item
        setCurrentIndex((prev) => prev + 1);
      } else {
        // Scored test completed!
        onComplete(updatedResults);
      }
    },
    [results, currentIndex, totalTrials, onComplete]
  );

  // Handle Participant Skip / Unanswered Response
  const handleSkip = useCallback(() => {
    if (hasRespondedRef.current) return;
    hasRespondedRef.current = true;

    const unansweredResult: TrialResult = {
      participantId,
      groupCondition: condition,
      trialNumber: currentTrial.trialNumber,
      displayedWord: currentTrial.word,
      inkColor: currentTrial.inkColor,
      trialType: currentTrial.trialType,
      selectedResponse: null,
      isCorrect: false,
      reactionTimeMs: null, // Untimed / unanswered
      isTimeout: true, // Marker for unanswered/skipped
      stimulusOnsetTimestamp: onsetIsoTimestampRef.current,
      onsetMonotonicMs: onsetMonotonicRef.current,
    };

    advanceToNext(unansweredResult);
  }, [participantId, condition, currentTrial, advanceToNext]);

  // Handle Participant Response (Click or Keypress)
  const handleResponse = useCallback(
    (selectedColor: ColorName) => {
      if (hasRespondedRef.current) return;
      hasRespondedRef.current = true;

      // Monotonic high-resolution reaction time measurement (ms)
      const responseMonotonic = performance.now();
      const rawRtMs = responseMonotonic - onsetMonotonicRef.current;
      const reactionTimeMs = Math.round(rawRtMs * 10) / 10;

      const isCorrect = selectedColor === currentTrial.inkColor;

      const validResult: TrialResult = {
        participantId,
        groupCondition: condition,
        trialNumber: currentTrial.trialNumber,
        displayedWord: currentTrial.word,
        inkColor: currentTrial.inkColor,
        trialType: currentTrial.trialType,
        selectedResponse: selectedColor,
        isCorrect,
        reactionTimeMs,
        isTimeout: false,
        stimulusOnsetTimestamp: onsetIsoTimestampRef.current,
        onsetMonotonicMs: onsetMonotonicRef.current,
      };

      advanceToNext(validResult);
    },
    [currentTrial, participantId, condition, advanceToNext]
  );

  // Stimulus onset lifecycle for each trial (resets timing per item)
  useEffect(() => {
    if (currentIndex >= totalTrials || !currentTrial) return;

    // Reset lock and record onset timestamps silently
    hasRespondedRef.current = false;
    onsetMonotonicRef.current = performance.now();
    onsetIsoTimestampRef.current = new Date().toISOString();
  }, [currentIndex, totalTrials, currentTrial]);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (hasRespondedRef.current) return;
      const key = e.key.toLowerCase();

      if (key === '1' || key === 'r') {
        e.preventDefault();
        handleResponse('RED');
      } else if (key === '2' || key === 'b') {
        e.preventDefault();
        handleResponse('BLUE');
      } else if (key === '3' || key === 'g') {
        e.preventDefault();
        handleResponse('GREEN');
      } else if (key === '4' || key === 'y') {
        e.preventDefault();
        handleResponse('YELLOW');
      } else if (key === 'escape' || key === ' ') {
        // Optional skip via Escape or Spacebar
        e.preventDefault();
        handleSkip();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleResponse, handleSkip]);

  const colorConfig = currentTrial ? COLOR_CONFIGS[currentTrial.inkColor] : COLOR_CONFIGS.RED;

  return (
    <div className="max-w-3xl mx-auto py-4 sm:py-8 px-4 flex flex-col justify-center min-h-[calc(100vh-140px)]">
      {/* Test Status Bar - Distraction-free, no countdown timer */}
      <div className="flex items-center justify-between bg-slate-800/90 border border-slate-700/80 px-4 py-2.5 rounded-2xl mb-4 text-xs shadow-md">
        <div className="flex items-center gap-3">
          <span className="font-mono font-bold text-white text-sm">
            Item {currentIndex + 1} of {totalTrials}
          </span>
          <span className="text-slate-400 font-mono text-[11px] hidden sm:inline">
            Participant: {participantId}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg border ${
            condition === 'Observed'
              ? 'bg-amber-950/40 text-amber-300 border-amber-600/40'
              : 'bg-blue-950/40 text-blue-300 border-blue-600/40'
          }`}>
            {condition === 'Observed' ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            <span>{condition}</span>
          </span>
        </div>
      </div>

      {/* Main Stimulus Card - No visible countdown timer */}
      <div className="bg-slate-900 border-2 border-slate-700/90 rounded-3xl p-6 sm:p-12 shadow-2xl relative overflow-hidden text-center flex flex-col justify-between min-h-[420px] sm:min-h-[460px]">
        {/* Subtle ambient colored glow behind card */}
        <div
          className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-48 rounded-full blur-3xl opacity-20 pointer-events-none transition-all duration-300"
          style={{ backgroundColor: colorConfig.hex }}
        />

        {/* Center Display: Vivid Stimulus Word */}
        <div className="my-auto py-12 flex flex-col items-center justify-center select-none relative z-10">
          <div
            className="text-6xl sm:text-7xl md:text-8xl font-black font-mono tracking-widest select-none transition-all duration-150 transform hover:scale-[1.02]"
            style={{
              color: colorConfig.hex,
              textShadow: `0 0 30px ${colorConfig.hex}77, 0 0 10px ${colorConfig.hex}aa`,
            }}
          >
            {currentTrial.word}
          </div>
          <div className="text-[12px] font-mono text-slate-400 mt-5 tracking-wider uppercase font-semibold flex items-center gap-1.5">
            <span>Name the</span>
            <span
              className="px-2 py-0.5 rounded-md font-bold uppercase"
              style={{
                backgroundColor: `${colorConfig.hex}22`,
                color: colorConfig.hex,
                border: `1px solid ${colorConfig.hex}55`,
              }}
            >
              INK COLOR
            </span>
            <span>&bull; Ignore the word</span>
          </div>
        </div>

        {/* 4 Colored Response Buttons */}
        <div className="space-y-4 relative z-10">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {COLOR_KEYS.map((color) => {
              const cfg = COLOR_CONFIGS[color];

              return (
                <button
                  key={color}
                  onClick={() => handleResponse(color)}
                  className={`py-4 px-2 rounded-2xl border-2 font-black text-base sm:text-lg transition-all select-none flex flex-col items-center justify-center gap-1 active:scale-95 cursor-pointer shadow-lg hover:brightness-125 ${cfg.buttonClass}`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${cfg.dotClass}`} />
                    <span className="tracking-wider">{color}</span>
                  </div>
                  <span className="text-[11px] font-mono font-medium opacity-80">
                    [{cfg.keyLabel}]
                  </span>
                </button>
              );
            })}
          </div>

          {/* Footer Controls: Keyboard Shortcuts Guide and Skip Option */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 font-mono">
            <p className="text-center sm:text-left">
              Keys: <kbd className="bg-slate-800 text-red-400 font-bold px-1.5 py-0.5 rounded border border-slate-700">1</kbd> Red, <kbd className="bg-slate-800 text-blue-400 font-bold px-1.5 py-0.5 rounded border border-slate-700">2</kbd> Blue, <kbd className="bg-slate-800 text-emerald-400 font-bold px-1.5 py-0.5 rounded border border-slate-700">3</kbd> Green, <kbd className="bg-slate-800 text-amber-300 font-bold px-1.5 py-0.5 rounded border border-slate-700">4</kbd> Yellow
            </p>

            <button
              onClick={handleSkip}
              className="text-slate-400 hover:text-slate-200 hover:bg-slate-800 px-2.5 py-1 rounded-lg border border-transparent hover:border-slate-700 transition flex items-center gap-1 cursor-pointer"
              title="Skip this item if unable to answer"
            >
              <SkipForward className="w-3.5 h-3.5" />
              <span>Skip / No Response</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
