import React, { useState } from 'react';
import { ShieldCheck, Lock, Mail, ArrowLeft, AlertCircle, Key, CheckCircle2 } from 'lucide-react';

interface AdminLoginViewProps {
  onLoginSuccess: (token: string, adminUser: { email: string; username: string }) => void;
  onBackToStudy: () => void;
}

export const AdminLoginView: React.FC<AdminLoginViewProps> = ({
  onLoginSuccess,
  onBackToStudy,
}) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!identifier.trim() || !password) {
      setErrorMessage('Please enter both your researcher username/email and password.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: identifier.trim(), password }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Authentication failed. Please verify credentials.');
      }

      // Store token in sessionStorage for session-only persistence (prevents session hijacking)
      sessionStorage.setItem('stroop_admin_token', data.token);
      sessionStorage.setItem('stroop_admin_user', JSON.stringify(data.admin));

      onLoginSuccess(data.token, data.admin);
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred during sign in.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseDemoCredentials = () => {
    setIdentifier('researcher@lab.edu');
    setPassword('AdminResearch2026!');
    setErrorMessage(null);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl relative">
        {/* Return to Study Button */}
        <button
          onClick={onBackToStudy}
          className="absolute top-6 left-6 text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Exit to Study</span>
        </button>

        <div className="text-center pt-4 mb-8">
          <div className="w-14 h-14 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl mx-auto flex items-center justify-center text-indigo-400 mb-4 shadow-inner">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <span className="text-[11px] font-mono uppercase tracking-widest text-indigo-400 font-semibold bg-indigo-950/60 border border-indigo-800/40 px-2.5 py-1 rounded-full">
            Faculty &amp; Researcher Access
          </span>
          <h2 className="text-xl font-bold text-white mt-3">Admin Portal Login</h2>
          <p className="text-xs text-slate-400 mt-1.5 max-w-xs mx-auto">
            Authorized access only. View real-time participant records, 50-item breakdown, group comparisons, and exports.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-6 bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs p-3.5 rounded-xl flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <div className="leading-relaxed">{errorMessage}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Username or Lab Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="text"
                autoComplete="username"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="researcher@lab.edu or admin"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 transition"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:opacity-60 text-white font-medium rounded-xl text-sm transition shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 mt-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <Key className="w-4 h-4" />
                <span>Sign In to Dashboard</span>
              </>
            )}
          </button>
        </form>

        {/* Lab Credentials Notice */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 bg-slate-950/40 -mx-8 -mb-8 p-6 rounded-b-2xl">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Initial Lab Credentials
            </span>
            <button
              type="button"
              onClick={handleUseDemoCredentials}
              className="text-xs text-indigo-400 hover:text-indigo-300 underline font-mono cursor-pointer"
            >
              Fill Credentials
            </button>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 font-mono text-[11px] text-slate-300 space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">User/Email:</span>
              <span className="text-slate-200">researcher@lab.edu</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Password:</span>
              <span className="text-indigo-300">AdminResearch2026!</span>
            </div>
          </div>
          <p className="text-[10px] text-slate-500 mt-2 leading-tight">
            Passwords are encrypted using PBKDF2 with SHA-512 and salted storage. You can change your password inside the dashboard.
          </p>
        </div>
      </div>
    </div>
  );
};
