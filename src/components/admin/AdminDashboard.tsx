import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  CheckCircle2,
  AlertCircle,
  Clock,
  Target,
  Download,
  Search,
  Eye,
  EyeOff,
  LogOut,
  ArrowLeft,
  RefreshCw,
  Trash2,
  ExternalLink,
  ShieldAlert,
  Database,
  BarChart3,
  KeyRound,
  FileSpreadsheet,
  PlusCircle,
} from 'lucide-react';
import { StoredSession, GroupCondition } from '../../types/stroop';
import { ParticipantDetailModal } from './ParticipantDetailModal';
import { generateMockSession } from '../../utils/stroopGenerator';
import { calculateSessionMetrics } from '../../utils/metrics';

interface AdminDashboardProps {
  adminUser: { email: string; username: string };
  token: string;
  onLogout: () => void;
  onBackToStudy: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  adminUser,
  token,
  onLogout,
  onBackToStudy,
}) => {
  const [participants, setParticipants] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCondition, setFilterCondition] = useState<'ALL' | 'Observed' | 'Unobserved'>('ALL');
  const [filterCompletion, setFilterCompletion] = useState<'ALL' | 'COMPLETED' | 'INCOMPLETE'>('ALL');

  // Selected participant for detailed 50-item view
  const [selectedSession, setSelectedSession] = useState<StoredSession | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Change Password Modal
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Fetch Dashboard Data (participants + stats)
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [participantsRes, statsRes] = await Promise.all([
        fetch('/api/admin/participants', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/admin/stats', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (participantsRes.status === 401 || statsRes.status === 401) {
        onLogout();
        return;
      }

      const pData = await participantsRes.json();
      const sData = await statsRes.json();

      setParticipants(pData.participants || []);
      setStats(sData);
    } catch (err) {
      console.error('[Dashboard fetch error]', err);
    } finally {
      setIsLoading(false);
    }
  }, [token, onLogout]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Open Detailed Results modal for single participant
  const handleViewParticipant = async (participantId: string, id: string) => {
    setIsLoadingDetails(true);
    try {
      const res = await fetch(`/api/admin/participants/${id || participantId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.session) {
          setSelectedSession(data.session);
          return;
        }
      }
      throw new Error('Unable to retrieve full participant data');
    } catch (err) {
      // Fallback: check localStorage if server fails or in dev fallback
      const local = localStorage.getItem('stroop_sessions_v1');
      if (local) {
        const parsed = JSON.parse(local);
        const match = parsed.find((s: StoredSession) => s.id === id || s.participantId === participantId);
        if (match) {
          setSelectedSession(match);
          return;
        }
      }
      alert('Could not load detailed results for this participant.');
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // Delete participant
  const handleDeleteParticipant = async (id: string, participantId: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete Participant ${participantId}? This action cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/participants/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        fetchData();
      } else {
        alert('Failed to delete participant.');
      }
    } catch (err) {
      alert('Network error while deleting participant.');
    }
  };

  // Master Summary CSV Export
  const handleExportSummaryCsv = async () => {
    try {
      const res = await fetch('/api/admin/export/summary-csv', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `stroop_participants_summary_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to export summary CSV.');
    }
  };

  // Master All Trials CSV Export
  const handleExportTrialsCsv = async () => {
    try {
      const res = await fetch('/api/admin/export/trials-csv', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `stroop_all_trials_50items_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to export detailed trials CSV.');
    }
  };

  // Seed Sample Research Data
  const handleSeedSampleData = async () => {
    try {
      const mockObserved = generateMockSession('P001', 'Observed');
      const metricsObs = calculateSessionMetrics('P001', 'Observed', mockObserved);
      const sampleObs = {
        participantId: 'P001',
        groupCondition: 'Observed',
        startedAt: mockObserved[0].stimulusOnsetTimestamp,
        completedAt: new Date(Date.now() - 3600000).toISOString(),
        metrics: metricsObs,
        trialResults: mockObserved,
      };

      const mockUnobs = generateMockSession('P002', 'Unobserved');
      const metricsUnobs = calculateSessionMetrics('P002', 'Unobserved', mockUnobs);
      const sampleUnobs = {
        participantId: 'P002',
        groupCondition: 'Unobserved',
        startedAt: mockUnobs[0].stimulusOnsetTimestamp,
        completedAt: new Date(Date.now() - 1800000).toISOString(),
        metrics: metricsUnobs,
        trialResults: mockUnobs,
      };

      await Promise.all([
        fetch('/api/participants/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sampleObs),
        }),
        fetch('/api/participants/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sampleUnobs),
        }),
      ]);

      fetchData();
    } catch (err) {
      alert('Failed to seed sample data.');
    }
  };

  // Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordStatus(null);

    if (!currentPassword || !newPassword) {
      setPasswordStatus({ type: 'error', message: 'All fields are required.' });
      return;
    }

    if (newPassword.length < 8) {
      setPasswordStatus({ type: 'error', message: 'New password must be at least 8 characters long.' });
      return;
    }

    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update password');
      }

      setPasswordStatus({ type: 'success', message: 'Password updated successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setTimeout(() => {
        setIsPasswordModalOpen(false);
        setPasswordStatus(null);
      }, 1500);
    } catch (err: any) {
      setPasswordStatus({ type: 'error', message: err.message || 'Error updating password' });
    }
  };

  // Filtered participants list
  const filteredParticipants = participants.filter((p) => {
    const matchesSearch = p.participantId.toLowerCase().includes(searchQuery.toLowerCase().trim());
    const matchesCondition =
      filterCondition === 'ALL' || p.groupCondition === filterCondition;
    const matchesCompletion =
      filterCompletion === 'ALL' ||
      (filterCompletion === 'COMPLETED' && p.isCompleted) ||
      (filterCompletion === 'INCOMPLETE' && !p.isCompleted);
    return matchesSearch && matchesCondition && matchesCompletion;
  });

  const observedGroupStats = stats?.groupComparison?.observed;
  const unobservedGroupStats = stats?.groupComparison?.unobserved;
  const summaryStats = stats?.summary;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* Admin Top Navigation */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-30 px-4 py-3 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider font-semibold bg-indigo-950 text-indigo-400 border border-indigo-800 px-2 py-0.5 rounded">
                  Admin Dashboard
                </span>
                <span className="text-xs text-slate-400">
                  {adminUser.email}
                </span>
              </div>
              <h1 className="text-base font-bold text-white">
                Stroop Experiment Study Analytics
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPasswordModalOpen(true)}
              className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-1.5 rounded-lg transition"
            >
              <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Change Password</span>
            </button>
            <button
              onClick={onBackToStudy}
              className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-1.5 rounded-lg transition"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-cyan-400" />
              <span>Back to Study</span>
            </button>
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 text-xs text-rose-300 hover:text-white bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/80 px-3 py-1.5 rounded-lg transition"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Content */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 space-y-6 flex-1">
        
        {/* KPI Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Participants</span>
              <Users className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-black text-white font-mono">
              {summaryStats?.totalParticipants ?? participants.length}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Submitted sessions</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider">Completed Tests</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-400 font-mono">
              {summaryStats?.completedTests ?? participants.filter((p) => p.isCompleted).length}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">All 50 items completed</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider">Incomplete Tests</span>
              <AlertCircle className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-amber-400 font-mono">
              {summaryStats?.incompleteTests ?? participants.filter((p) => !p.isCompleted).length}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Terminated prematurely</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider">Overall Accuracy</span>
              <Target className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-black text-cyan-400 font-mono">
              {summaryStats?.overallAccuracy != null ? `${summaryStats.overallAccuracy}%` : '0%'}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Mean across participants</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider">Average RT</span>
              <Clock className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-black text-white font-mono">
              {summaryStats?.averageReactionTime != null ? `${summaryStats.averageReactionTime} ms` : 'N/A'}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Valid responses only</p>
          </div>
        </div>

        {/* Group Comparison: Observed vs Unobserved */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-400" />
                Group Condition Comparison: Observed vs. Unobserved
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Investigating social facilitation &amp; observation effects on task accuracy and processing speed.
              </p>
            </div>
            <div className="text-xs font-mono text-slate-400 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
              Study Protocol: 25 Congruent / 25 Incongruent
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Observed Group Card */}
            <div className="bg-amber-950/20 border border-amber-800/40 rounded-xl p-4">
              <div className="flex items-center justify-between border-b border-amber-900/40 pb-2.5 mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-amber-500/20 text-amber-300 rounded-lg">
                    <Eye className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-amber-300 text-sm">Observed Group</span>
                </div>
                <span className="text-xs bg-amber-950 text-amber-300 px-2.5 py-0.5 rounded-full font-mono border border-amber-800/60">
                  N = {observedGroupStats?.count ?? 0}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                  <div className="text-[10px] uppercase text-slate-400 font-semibold">Mean Correct</div>
                  <div className="text-lg font-bold font-mono text-white mt-0.5">
                    {observedGroupStats?.meanCorrect != null ? `${observedGroupStats.meanCorrect} / 50` : '—'}
                  </div>
                </div>
                <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                  <div className="text-[10px] uppercase text-slate-400 font-semibold">Mean Accuracy</div>
                  <div className="text-lg font-bold font-mono text-amber-300 mt-0.5">
                    {observedGroupStats?.meanAccuracy != null ? `${observedGroupStats.meanAccuracy}%` : '—'}
                  </div>
                </div>
                <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                  <div className="text-[10px] uppercase text-slate-400 font-semibold">Mean RT</div>
                  <div className="text-lg font-bold font-mono text-slate-100 mt-0.5">
                    {observedGroupStats?.meanRt != null ? `${observedGroupStats.meanRt} ms` : '—'}
                  </div>
                </div>
              </div>
            </div>

            {/* Unobserved Group Card */}
            <div className="bg-blue-950/20 border border-blue-800/40 rounded-xl p-4">
              <div className="flex items-center justify-between border-b border-blue-900/40 pb-2.5 mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-500/20 text-blue-300 rounded-lg">
                    <EyeOff className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-blue-300 text-sm">Unobserved Group</span>
                </div>
                <span className="text-xs bg-blue-950 text-blue-300 px-2.5 py-0.5 rounded-full font-mono border border-blue-800/60">
                  N = {unobservedGroupStats?.count ?? 0}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                  <div className="text-[10px] uppercase text-slate-400 font-semibold">Mean Correct</div>
                  <div className="text-lg font-bold font-mono text-white mt-0.5">
                    {unobservedGroupStats?.meanCorrect != null ? `${unobservedGroupStats.meanCorrect} / 50` : '—'}
                  </div>
                </div>
                <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                  <div className="text-[10px] uppercase text-slate-400 font-semibold">Mean Accuracy</div>
                  <div className="text-lg font-bold font-mono text-blue-300 mt-0.5">
                    {unobservedGroupStats?.meanAccuracy != null ? `${unobservedGroupStats.meanAccuracy}%` : '—'}
                  </div>
                </div>
                <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                  <div className="text-[10px] uppercase text-slate-400 font-semibold">Mean RT</div>
                  <div className="text-lg font-bold font-mono text-slate-100 mt-0.5">
                    {unobservedGroupStats?.meanRt != null ? `${unobservedGroupStats.meanRt} ms` : '—'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Bar & CSV Exports */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-1">
              Data Exports:
            </span>
            <button
              onClick={handleExportSummaryCsv}
              className="flex items-center gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-3 py-1.5 rounded-lg transition shadow-sm"
              title="Download summary CSV of all participants"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Participants Summary CSV</span>
            </button>
            <button
              onClick={handleExportTrialsCsv}
              className="flex items-center gap-1.5 text-xs bg-cyan-600 hover:bg-cyan-500 text-white font-medium px-3 py-1.5 rounded-lg transition shadow-sm"
              title="Download 50 item-level trials for every participant in CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>All 50-Item Trials CSV</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {participants.length === 0 && (
              <button
                onClick={handleSeedSampleData}
                className="flex items-center gap-1.5 text-xs text-amber-300 hover:text-white bg-amber-950/40 hover:bg-amber-900/60 border border-amber-800/80 px-3 py-1.5 rounded-lg transition"
                title="Populate 2 sample participants (Observed & Unobserved) for immediate testing"
              >
                <PlusCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>Seed Sample Data</span>
              </button>
            )}
            <button
              onClick={fetchData}
              disabled={isLoading}
              className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-1.5 rounded-lg transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Participant Data Table Section */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          {/* Table Search & Filters Header */}
          <div className="p-4 border-b border-slate-800 bg-slate-950/40 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-400" />
                Participant Results Records ({filteredParticipants.length})
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              {/* Search Box */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Participant ID..."
                  className="bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Group Condition Filter */}
              <select
                value={filterCondition}
                onChange={(e) => setFilterCondition(e.target.value as any)}
                className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="ALL">All Conditions</option>
                <option value="Observed">Observed Only</option>
                <option value="Unobserved">Unobserved Only</option>
              </select>

              {/* Completion Filter */}
              <select
                value={filterCompletion}
                onChange={(e) => setFilterCompletion(e.target.value as any)}
                className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="COMPLETED">Completed Only</option>
                <option value="INCOMPLETE">Incomplete Only</option>
              </select>
            </div>
          </div>

          {/* Table Body */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Participant ID</th>
                  <th className="py-3 px-3">Condition</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Correct / 50</th>
                  <th className="py-3 px-3">Incorrect</th>
                  <th className="py-3 px-3">Accuracy</th>
                  <th className="py-3 px-3">Mean RT</th>
                  <th className="py-3 px-4">Completion Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredParticipants.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-500 font-sans">
                      {participants.length === 0 ? (
                        <div className="space-y-2">
                          <p>No participant submissions recorded yet.</p>
                          <p className="text-xs text-slate-600">
                            Participants will automatically appear here upon completing the Stroop test.
                          </p>
                          <button
                            onClick={handleSeedSampleData}
                            className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-sans transition"
                          >
                            <PlusCircle className="w-3.5 h-3.5" />
                            <span>Load 2 Sample Participants</span>
                          </button>
                        </div>
                      ) : (
                        <p>No participants match your search filters.</p>
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredParticipants.map((p) => {
                    const isObs = p.groupCondition === 'Observed';
                    return (
                      <tr key={p.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3 px-4 font-bold text-white font-sans flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-indigo-400" />
                          <span>{p.participantId}</span>
                        </td>
                        <td className="py-3 px-3 font-sans">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                              isObs
                                ? 'bg-amber-950/60 text-amber-400 border border-amber-800/60'
                                : 'bg-blue-950/60 text-blue-400 border border-blue-800/60'
                            }`}
                          >
                            {isObs ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                            {p.groupCondition}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-sans">
                          {p.isCompleted ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/60">
                              COMPLETED
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-950/60 text-amber-400 border border-amber-800/60">
                              INCOMPLETE
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-emerald-400 font-semibold">
                          {p.correctAnswers} / {p.totalTrials || 50}
                        </td>
                        <td className="py-3 px-3 text-rose-400 font-semibold">
                          {p.incorrectAnswers}
                        </td>
                        <td className="py-3 px-3 font-semibold text-cyan-300">
                          {p.accuracyPercentage}%
                        </td>
                        <td className="py-3 px-3 text-slate-200">
                          {p.meanReactionTimeMs !== null ? `${p.meanReactionTimeMs} ms` : '—'}
                        </td>
                        <td className="py-3 px-4 text-slate-400 font-sans text-[11px]">
                          {p.completedAt ? new Date(p.completedAt).toLocaleString() : 'N/A'}
                        </td>
                        <td className="py-3 px-4 text-right font-sans">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => handleViewParticipant(p.participantId, p.id)}
                              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[11px] font-medium transition flex items-center gap-1"
                              title="View full 50-item breakdown"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>View 50 Items</span>
                            </button>
                            <button
                              onClick={() => handleDeleteParticipant(p.id, p.participantId)}
                              className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 rounded transition"
                              title="Delete participant record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>

      {/* Participant Detail 50-Item Modal */}
      {selectedSession && (
        <ParticipantDetailModal
          session={selectedSession}
          onClose={() => setSelectedSession(null)}
        />
      )}

      {/* Change Password Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-indigo-400" />
              Change Admin Password
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Update the researcher password. Passwords are encrypted with PBKDF2 with SHA-512.
            </p>

            {passwordStatus && (
              <div className={`p-3 rounded-xl text-xs mb-4 ${
                passwordStatus.type === 'success'
                  ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800'
                  : 'bg-rose-950/60 text-rose-300 border border-rose-800'
              }`}>
                {passwordStatus.message}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-300 mb-1">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                  placeholder="••••••••••••"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">New Password (min 8 chars)</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                  placeholder="••••••••••••"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsPasswordModalOpen(false);
                    setPasswordStatus(null);
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition"
                >
                  Save New Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
