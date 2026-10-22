/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import {
  AppPhase,
  GroupCondition,
  StoredSession,
  StroopTrial,
  TrialResult,
} from './types/stroop';
import {
  generateScoredTrials,
  generatePracticeTrials,
  generateMockSession,
} from './utils/stroopGenerator';
import { calculateSessionMetrics } from './utils/metrics';
import {
  getStoredSessions,
  saveSession,
  importSessions,
  deleteStoredSession,
  clearAllStoredSessions,
  getNextParticipantId,
} from './utils/storage';
import { Header } from './components/Header';
import { ParticipantSetup } from './components/ParticipantSetup';
import { Instructions } from './components/InstructionsModal';
import { PracticePhase } from './components/PracticePhase';
import { TestingPhase } from './components/TestingPhase';
import { ResultsView } from './components/ResultsView';
import { ObservationProtocolModal } from './components/ObservationProtocolModal';
import { SessionHistoryModal } from './components/SessionHistoryModal';
import { ResetConfirmModal } from './components/ResetConfirmModal';
import { DownloadAppModal } from './components/DownloadAppModal';
import { AdminLoginView } from './components/admin/AdminLoginView';
import { AdminDashboard } from './components/admin/AdminDashboard';

export default function App() {
  const [phase, setPhase] = useState<AppPhase>('SETUP');
  const [participantId, setParticipantId] = useState<string>('P001');
  const [condition, setCondition] = useState<GroupCondition>('Observed');

  // Trials state
  const [practiceTrials, setPracticeTrials] = useState<StroopTrial[]>([]);
  const [scoredTrials, setScoredTrials] = useState<StroopTrial[]>([]);
  const [currentSession, setCurrentSession] = useState<StoredSession | null>(null);

  // Storage & History state
  const [savedSessions, setSavedSessions] = useState<StoredSession[]>([]);

  // Modals state
  const [isProtocolOpen, setIsProtocolOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isDownloadAppOpen, setIsDownloadAppOpen] = useState(false);

  // Admin & Researcher Portal state
  const [isAdminView, setIsAdminView] = useState<boolean>(() => {
    return window.location.hash === '#admin' || window.location.search.includes('admin');
  });
  const [adminToken, setAdminToken] = useState<string | null>(() => {
    return sessionStorage.getItem('stroop_admin_token');
  });
  const [adminUser, setAdminUser] = useState<{ email: string; username: string } | null>(() => {
    const raw = sessionStorage.getItem('stroop_admin_user');
    return raw ? JSON.parse(raw) : null;
  });

  // Verify Admin Token on mount if present
  useEffect(() => {
    if (adminToken) {
      fetch('/api/admin/me', {
        headers: { Authorization: `Bearer ${adminToken}` },
      })
        .then((res) => {
          if (!res.ok) {
            sessionStorage.removeItem('stroop_admin_token');
            sessionStorage.removeItem('stroop_admin_user');
            setAdminToken(null);
            setAdminUser(null);
          }
        })
        .catch(() => {});
    }
  }, [adminToken]);

  // Sync hash changes (e.g. #admin)
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#admin') {
        setIsAdminView(true);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Initialize stored sessions & default participant ID
  useEffect(() => {
    const existing = getStoredSessions();
    setSavedSessions(existing);
    setParticipantId(getNextParticipantId());
  }, []);

  // Refresh saved sessions
  const reloadSessions = useCallback(() => {
    const updated = getStoredSessions();
    setSavedSessions(updated);
  }, []);

  // Step 1: Proceed from Setup to Instructions
  const handleProceedFromSetup = (pId: string, groupCond: GroupCondition) => {
    setParticipantId(pId);
    setCondition(groupCond);
    setPhase('INSTRUCTIONS');
  };

  // Step 2a: Start Practice Phase (4 trials)
  const handleStartPractice = () => {
    const practice = generatePracticeTrials();
    setPracticeTrials(practice);
    setPhase('PRACTICE_ACTIVE');
  };

  // Step 2b: Skip Practice & Begin Scored Test directly
  const handleSkipToTest = () => {
    const trials = generateScoredTrials(); // 50 items (25 congruent, 25 incongruent)
    setScoredTrials(trials);
    setPhase('TEST_ACTIVE');
  };

  // Finish Practice -> Begin Scored Test
  const handleFinishPractice = () => {
    const trials = generateScoredTrials(); // 50 items
    setScoredTrials(trials);
    setPhase('TEST_ACTIVE');
  };

  // Complete Scored Test (all 50 trials finished)
  const handleCompleteTest = (results: TrialResult[]) => {
    const metrics = calculateSessionMetrics(participantId, condition, results);
    const newSession: StoredSession = {
      id: `session-${participantId}-${Date.now()}`,
      participantId,
      groupCondition: condition,
      startedAt: results[0]?.stimulusOnsetTimestamp || new Date().toISOString(),
      completedAt: new Date().toISOString(),
      metrics,
      trialResults: results,
    };

    // 1. Save to local storage for offline redundancy
    saveSession(newSession);
    reloadSessions();
    setCurrentSession(newSession);
    setPhase('RESULTS');

    // 2. Persist to server backend database
    fetch('/api/participants/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSession),
    }).catch((err) => {
      console.warn('[Sync] Participant saved locally; server sync deferred:', err);
    });
  };

  // Admin authentication handlers
  const handleAdminLoginSuccess = (token: string, user: { email: string; username: string }) => {
    setAdminToken(token);
    setAdminUser(user);
    setIsAdminView(true);
  };

  const handleAdminLogout = async () => {
    if (adminToken) {
      try {
        await fetch('/api/admin/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${adminToken}` },
        });
      } catch {
        // Ignore network errors on logout
      }
    }
    sessionStorage.removeItem('stroop_admin_token');
    sessionStorage.removeItem('stroop_admin_user');
    setAdminToken(null);
    setAdminUser(null);
  };

  // Start Next Participant flow
  const handleStartNextParticipant = () => {
    const nextId = getNextParticipantId();
    setParticipantId(nextId);
    // Alternate or keep condition for balanced counterbalancing
    setCondition((prev) => (prev === 'Observed' ? 'Unobserved' : 'Observed'));
    setCurrentSession(null);
    setPhase('SETUP');
  };

  // Reset Test trigger
  const handleResetClick = () => {
    if (phase === 'TEST_ACTIVE' || phase === 'PRACTICE_ACTIVE') {
      setIsResetConfirmOpen(true);
    } else {
      executeReset();
    }
  };

  const executeReset = () => {
    setIsResetConfirmOpen(false);
    setCurrentSession(null);
    setParticipantId(getNextParticipantId());
    setPhase('SETUP');
  };

  // Session history actions
  const handleDeleteSession = (id: string) => {
    deleteStoredSession(id);
    reloadSessions();
  };

  const handleClearAllSessions = () => {
    clearAllStoredSessions();
    reloadSessions();
  };

  const handleInspectHistoricalSession = (sess: StoredSession) => {
    setCurrentSession(sess);
    setParticipantId(sess.participantId);
    setCondition(sess.groupCondition);
    setPhase('RESULTS');
  };

  const handleLoadSampleData = () => {
    // Generate sample observed participant
    const mockObserved = generateMockSession('P001', 'Observed');
    const metricsObs = calculateSessionMetrics('P001', 'Observed', mockObserved);
    const sessionObs: StoredSession = {
      id: `session-P001-${Date.now() - 3600000}`,
      participantId: 'P001',
      groupCondition: 'Observed',
      startedAt: mockObserved[0].stimulusOnsetTimestamp,
      completedAt: new Date(Date.now() - 3000000).toISOString(),
      metrics: metricsObs,
      trialResults: mockObserved,
    };

    // Generate sample unobserved participant
    const mockUnobserved = generateMockSession('P002', 'Unobserved');
    const metricsUnobs = calculateSessionMetrics('P002', 'Unobserved', mockUnobserved);
    const sessionUnobs: StoredSession = {
      id: `session-P002-${Date.now() - 1800000}`,
      participantId: 'P002',
      groupCondition: 'Unobserved',
      startedAt: mockUnobserved[0].stimulusOnsetTimestamp,
      completedAt: new Date(Date.now() - 1200000).toISOString(),
      metrics: metricsUnobs,
      trialResults: mockUnobserved,
    };

    saveSession(sessionObs);
    saveSession(sessionUnobs);
    reloadSessions();
    setParticipantId('P003');
  };

  const handleImportSessions = (imported: StoredSession[]) => {
    importSessions(imported);
    reloadSessions();
  };

  if (isAdminView) {
    if (!adminToken || !adminUser) {
      return (
        <AdminLoginView
          onLoginSuccess={handleAdminLoginSuccess}
          onBackToStudy={() => {
            setIsAdminView(false);
            window.location.hash = '';
          }}
        />
      );
    }

    return (
      <AdminDashboard
        adminUser={adminUser}
        token={adminToken}
        onLogout={handleAdminLogout}
        onBackToStudy={() => {
          setIsAdminView(false);
          window.location.hash = '';
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Persistent Academic Header */}
      <Header
        phase={phase}
        participantId={participantId}
        condition={condition}
        savedSessionsCount={savedSessions.length}
        onOpenProtocol={() => setIsProtocolOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenDownloadApp={() => setIsDownloadAppOpen(true)}
        onResetTest={handleResetClick}
        onOpenAdmin={() => setIsAdminView(true)}
      />

      {/* Main Study Body */}
      <main className="flex-1">
        {phase === 'SETUP' && (
          <ParticipantSetup
            initialParticipantId={participantId}
            initialCondition={condition}
            onProceed={handleProceedFromSetup}
            onOpenProtocol={() => setIsProtocolOpen(true)}
          />
        )}

        {phase === 'INSTRUCTIONS' && (
          <Instructions
            participantId={participantId}
            condition={condition}
            onStartPractice={handleStartPractice}
            onSkipToTest={handleSkipToTest}
          />
        )}

        {phase === 'PRACTICE_ACTIVE' && (
          <PracticePhase
            practiceTrials={practiceTrials}
            onFinishPractice={handleFinishPractice}
            onSkipPractice={handleSkipToTest}
          />
        )}

        {phase === 'TEST_ACTIVE' && (
          <TestingPhase
            participantId={participantId}
            condition={condition}
            trials={scoredTrials}
            onComplete={handleCompleteTest}
          />
        )}

        {phase === 'RESULTS' && currentSession && (
          <ResultsView
            session={currentSession}
            onStartNextParticipant={handleStartNextParticipant}
            onOpenHistory={() => setIsHistoryOpen(true)}
            onResetTest={handleResetClick}
          />
        )}
      </main>

      {/* Standardized Observation Protocol Modal */}
      <ObservationProtocolModal
        isOpen={isProtocolOpen}
        onClose={() => setIsProtocolOpen(false)}
        activeCondition={condition}
      />

      {/* Saved Sessions & Master Export Modal */}
      <SessionHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        sessions={savedSessions}
        onDeleteSession={handleDeleteSession}
        onClearAll={handleClearAllSessions}
        onSelectSession={handleInspectHistoricalSession}
        onLoadSampleData={handleLoadSampleData}
        onImportSessions={handleImportSessions}
      />

      {/* Reset Confirmation Modal */}
      <ResetConfirmModal
        isOpen={isResetConfirmOpen}
        onConfirm={executeReset}
        onCancel={() => setIsResetConfirmOpen(false)}
      />

      {/* Download App Code & Offline Instructions Modal */}
      <DownloadAppModal
        isOpen={isDownloadAppOpen}
        onClose={() => setIsDownloadAppOpen(false)}
      />
    </div>
  );
}
