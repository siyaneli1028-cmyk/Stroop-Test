import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '10mb' }));

// Ensure database directory exists
const DATA_DIR = path.resolve(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_FILE = path.join(DATA_DIR, 'stroop_database.json');
const AUTH_FILE = path.join(DATA_DIR, 'admin_auth.json');

// --- Cryptographic Password Utilities (PBKDF2) ---
function hashPassword(password: string, salt?: string): { salt: string; hash: string } {
  const generatedSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, generatedSalt, 100000, 64, 'sha512').toString('hex');
  return { salt: generatedSalt, hash };
}

function verifyPassword(password: string, salt: string, expectedHash: string): boolean {
  const { hash } = hashPassword(password, salt);
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(expectedHash, 'hex'));
}

// Initialize Default Admin if not existing
function initAdminAuth() {
  if (!fs.existsSync(AUTH_FILE)) {
    const defaultPassword = process.env.ADMIN_PASSWORD || 'AdminResearch2026!';
    const defaultEmail = process.env.ADMIN_EMAIL || 'researcher@lab.edu';
    const defaultUsername = 'admin';
    const { salt, hash } = hashPassword(defaultPassword);

    const initialData = {
      username: defaultUsername,
      email: defaultEmail,
      salt,
      hash,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    fs.writeFileSync(AUTH_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
    console.log(`[Admin Setup] Initialized admin account: ${defaultEmail} / ${defaultUsername}`);
  }
}
initAdminAuth();

// --- Database Operations ---
function readDatabase(): any[] {
  try {
    if (!fs.existsSync(DB_FILE)) {
      return [];
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('[DB Read Error]', err);
    return [];
  }
}

function writeDatabase(data: any[]): void {
  try {
    const tempFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    console.error('[DB Write Error]', err);
  }
}

// In-memory active session tokens for admin auth
const activeAdminTokens = new Map<string, { email: string; username: string; expiresAt: number }>();

function authenticateAdmin(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Admin authentication token required' });
    return;
  }

  const token = authHeader.substring(7).trim();
  const session = activeAdminTokens.get(token);

  if (!session) {
    res.status(401).json({ error: 'Unauthorized: Invalid or expired admin token' });
    return;
  }

  if (Date.now() > session.expiresAt) {
    activeAdminTokens.delete(token);
    res.status(401).json({ error: 'Unauthorized: Admin session expired, please log in again' });
    return;
  }

  // Extend token expiry on activity (24 hours)
  session.expiresAt = Date.now() + 24 * 60 * 60 * 1000;
  (req as any).adminUser = session;
  next();
}

// --- Public Participant Submission Endpoint ---
// When participant finishes the 50 items, client submits directly to server database
app.post('/api/participants/submit', (req: Request, res: Response) => {
  try {
    const { participantId, groupCondition, metrics, trialResults, startedAt, completedAt } = req.body;

    if (!participantId || !groupCondition || !Array.isArray(trialResults)) {
      res.status(400).json({ error: 'Invalid participant submission payload' });
      return;
    }

    const currentSessions = readDatabase();
    const newSessionId = `session-${participantId.replace(/[^a-zA-Z0-9_-]/g, '')}-${Date.now()}`;

    const newRecord = {
      id: newSessionId,
      participantId: String(participantId).trim().toUpperCase(),
      groupCondition,
      startedAt: startedAt || new Date().toISOString(),
      completedAt: completedAt || new Date().toISOString(),
      metrics: metrics || {},
      trialResults,
      submissionIp: req.ip || 'anonymous',
      recordedAt: new Date().toISOString(),
    };

    // Append to server database
    const updated = [newRecord, ...currentSessions];
    writeDatabase(updated);

    res.status(201).json({
      success: true,
      id: newSessionId,
      participantId: newRecord.participantId,
      message: 'Participant session recorded in persistent database',
    });
  } catch (err: any) {
    console.error('[Participant Submit Error]', err);
    res.status(500).json({ error: 'Failed to record participant submission on server' });
  }
});

// --- Admin Authentication Routes ---

// Admin Login
app.post('/api/admin/login', (req: Request, res: Response) => {
  try {
    const { identifier, password } = req.body; // identifier can be username or email

    if (!identifier || !password) {
      res.status(400).json({ error: 'Username/email and password are required' });
      return;
    }

    if (!fs.existsSync(AUTH_FILE)) {
      initAdminAuth();
    }

    const authData = JSON.parse(fs.readFileSync(AUTH_FILE, 'utf-8'));
    const isMatch =
      (identifier.trim().toLowerCase() === authData.email.toLowerCase() ||
       identifier.trim().toLowerCase() === authData.username.toLowerCase()) &&
      verifyPassword(password, authData.salt, authData.hash);

    if (!isMatch) {
      res.status(401).json({ error: 'Invalid username/email or password' });
      return;
    }

    // Generate secure 64-char crypto session token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    activeAdminTokens.set(token, {
      email: authData.email,
      username: authData.username,
      expiresAt,
    });

    res.json({
      success: true,
      token,
      admin: {
        username: authData.username,
        email: authData.email,
      },
    });
  } catch (err) {
    console.error('[Admin Login Error]', err);
    res.status(500).json({ error: 'Internal server error during login' });
  }
});

// Admin Logout
app.post('/api/admin/logout', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    activeAdminTokens.delete(token);
  }
  res.json({ success: true, message: 'Logged out successfully' });
});

// Admin Profile Verification
app.get('/api/admin/me', authenticateAdmin, (req: Request, res: Response) => {
  const admin = (req as any).adminUser;
  res.json({
    authenticated: true,
    email: admin.email,
    username: admin.username,
  });
});

// Admin Change Password
app.post('/api/admin/change-password', authenticateAdmin, (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword || newPassword.length < 8) {
      res.status(400).json({ error: 'New password must be at least 8 characters long' });
      return;
    }

    const authData = JSON.parse(fs.readFileSync(AUTH_FILE, 'utf-8'));
    const isCurrentValid = verifyPassword(currentPassword, authData.salt, authData.hash);

    if (!isCurrentValid) {
      res.status(400).json({ error: 'Current password is incorrect' });
      return;
    }

    const { salt, hash } = hashPassword(newPassword);
    authData.salt = salt;
    authData.hash = hash;
    authData.updatedAt = new Date().toISOString();

    fs.writeFileSync(AUTH_FILE, JSON.stringify(authData, null, 2), 'utf-8');

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update password' });
  }
});

// --- Admin Protected Data Routes ---

// Get All Participant Sessions (Summary list)
app.get('/api/admin/participants', authenticateAdmin, (req: Request, res: Response) => {
  const sessions = readDatabase();
  // Strip heavy trialResults in overview list for high performance
  const summaries = sessions.map((s) => ({
    id: s.id,
    participantId: s.participantId,
    groupCondition: s.groupCondition,
    completedAt: s.completedAt,
    startedAt: s.startedAt,
    totalTrials: s.metrics?.totalTrials || s.trialResults?.length || 50,
    correctAnswers: s.metrics?.correctAnswers ?? 0,
    incorrectAnswers: s.metrics?.incorrectAnswers ?? 0,
    timeouts: s.metrics?.timeouts ?? 0,
    accuracyPercentage: s.metrics?.accuracyPercentage ?? 0,
    meanReactionTimeMs: s.metrics?.meanReactionTimeMs ?? null,
    meanCorrectReactionTimeMs: s.metrics?.meanCorrectReactionTimeMs ?? null,
    congruentAccuracy: s.metrics?.congruentAccuracy ?? 0,
    congruentMeanRtMs: s.metrics?.congruentMeanRtMs ?? null,
    incongruentAccuracy: s.metrics?.incongruentAccuracy ?? 0,
    incongruentMeanRtMs: s.metrics?.incongruentMeanRtMs ?? null,
    stroopInterferenceMs: s.metrics?.stroopInterferenceMs ?? null,
    isCompleted: (s.trialResults?.length || 0) >= 50,
  }));

  res.json({ participants: summaries });
});

// Get Detailed 50-Item Results for a Specific Participant
app.get('/api/admin/participants/:id', authenticateAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const sessions = readDatabase();
  const session = sessions.find((s) => s.id === id || s.participantId === id);

  if (!session) {
    res.status(404).json({ error: 'Participant session not found' });
    return;
  }

  res.json({ session });
});

// Delete Participant Record (Admin only)
app.delete('/api/admin/participants/:id', authenticateAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const sessions = readDatabase();
  const updated = sessions.filter((s) => s.id !== id && s.participantId !== id);

  if (updated.length === sessions.length) {
    res.status(404).json({ error: 'Participant record not found' });
    return;
  }

  writeDatabase(updated);
  res.json({ success: true, message: 'Participant record deleted' });
});

// Summary Statistics & Group Comparison (Admin only)
app.get('/api/admin/stats', authenticateAdmin, (req: Request, res: Response) => {
  const sessions = readDatabase();

  const totalParticipants = sessions.length;
  const completedTests = sessions.filter((s) => (s.trialResults?.length || 0) >= 50).length;
  const incompleteTests = totalParticipants - completedTests;

  // Overall accuracy & RT across all participants
  const validAccuracies = sessions
    .map((s) => s.metrics?.accuracyPercentage)
    .filter((a): a is number => typeof a === 'number');

  const validRts = sessions
    .map((s) => s.metrics?.meanReactionTimeMs)
    .filter((rt): rt is number => typeof rt === 'number' && rt > 0);

  const overallAccuracy = validAccuracies.length > 0
    ? Math.round((validAccuracies.reduce((a, b) => a + b, 0) / validAccuracies.length) * 10) / 10
    : 0;

  const averageReactionTime = validRts.length > 0
    ? Math.round((validRts.reduce((a, b) => a + b, 0) / validRts.length) * 10) / 10
    : null;

  // Group Comparison: Observed vs Unobserved
  const observedGroup = sessions.filter((s) => s.groupCondition === 'Observed');
  const unobservedGroup = sessions.filter((s) => s.groupCondition === 'Unobserved');

  const calcGroupMetrics = (group: any[]) => {
    if (group.length === 0) {
      return { count: 0, meanCorrect: null, meanAccuracy: null, meanRt: null };
    }
    const corrects = group.map((s) => s.metrics?.correctAnswers ?? 0);
    const accs = group.map((s) => s.metrics?.accuracyPercentage ?? 0);
    const rts = group
      .map((s) => s.metrics?.meanReactionTimeMs)
      .filter((r): r is number => typeof r === 'number' && r > 0);

    return {
      count: group.length,
      meanCorrect: Math.round((corrects.reduce((a, b) => a + b, 0) / group.length) * 10) / 10,
      meanAccuracy: Math.round((accs.reduce((a, b) => a + b, 0) / group.length) * 10) / 10,
      meanRt: rts.length > 0 ? Math.round((rts.reduce((a, b) => a + b, 0) / rts.length) * 10) / 10 : null,
    };
  };

  res.json({
    summary: {
      totalParticipants,
      completedTests,
      incompleteTests,
      overallAccuracy,
      averageReactionTime,
    },
    groupComparison: {
      observed: calcGroupMetrics(observedGroup),
      unobserved: calcGroupMetrics(unobservedGroup),
    },
  });
});

// CSV Export Helpers
function escapeCsv(val: any): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// Export All Participants Summary CSV (Admin only)
app.get('/api/admin/export/summary-csv', authenticateAdmin, (req: Request, res: Response) => {
  const sessions = readDatabase();

  const headers = [
    'Participant ID',
    'Group condition',
    'Completion status',
    'Correct answers',
    'Incorrect answers',
    'Unanswered',
    'Accuracy percentage',
    'Mean reaction time (ms)',
    'Mean correct reaction time (ms)',
    'Congruent accuracy (%)',
    'Congruent mean RT (ms)',
    'Incongruent accuracy (%)',
    'Incongruent mean RT (ms)',
    'Stroop interference (ms)',
    'Completed timestamp',
  ];

  const rows = sessions.map((s) => [
    s.participantId,
    s.groupCondition,
    (s.trialResults?.length || 0) >= 50 ? 'COMPLETED' : 'INCOMPLETE',
    s.metrics?.correctAnswers ?? 0,
    s.metrics?.incorrectAnswers ?? 0,
    s.metrics?.timeouts ?? 0,
    s.metrics?.accuracyPercentage ?? 0,
    s.metrics?.meanReactionTimeMs !== null ? s.metrics?.meanReactionTimeMs : 'NA',
    s.metrics?.meanCorrectReactionTimeMs !== null ? s.metrics?.meanCorrectReactionTimeMs : 'NA',
    s.metrics?.congruentAccuracy ?? 0,
    s.metrics?.congruentMeanRtMs !== null ? s.metrics?.congruentMeanRtMs : 'NA',
    s.metrics?.incongruentAccuracy ?? 0,
    s.metrics?.incongruentMeanRtMs !== null ? s.metrics?.incongruentMeanRtMs : 'NA',
    s.metrics?.stroopInterferenceMs !== null ? s.metrics?.stroopInterferenceMs : 'NA',
    s.completedAt || '',
  ]);

  const csv = [
    headers.map(escapeCsv).join(','),
    ...rows.map((r) => r.map(escapeCsv).join(',')),
  ].join('\r\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="stroop_all_participants_summary_${new Date().toISOString().slice(0, 10)}.csv"`);
  res.send(csv);
});

// Export All Item-Level Trials for All Participants CSV (Admin only)
app.get('/api/admin/export/trials-csv', authenticateAdmin, (req: Request, res: Response) => {
  const sessions = readDatabase();

  const headers = [
    'Participant ID',
    'Group condition',
    'Item number',
    'Displayed word',
    'Ink color',
    'Congruency condition',
    'Correct answer',
    'Participant response',
    'Accuracy status',
    'Reaction time (ms)',
    'Unanswered status',
    'Stimulus onset timestamp',
  ];

  const rows: any[] = [];
  sessions.forEach((s) => {
    (s.trialResults || []).forEach((t: any) => {
      rows.push([
        s.participantId,
        s.groupCondition,
        t.trialNumber,
        t.displayedWord,
        t.inkColor,
        t.trialType,
        t.inkColor, // Correct answer is always the ink color
        t.selectedResponse ?? 'NO RESPONSE',
        t.isTimeout ? 'NO RESPONSE' : t.isCorrect ? 'CORRECT' : 'INCORRECT',
        t.reactionTimeMs !== null ? t.reactionTimeMs : 'NA',
        t.isTimeout ? 'TRUE' : 'FALSE',
        t.stimulusOnsetTimestamp,
      ]);
    });
  });

  const csv = [
    headers.map(escapeCsv).join(','),
    ...rows.map((r) => r.map(escapeCsv).join(',')),
  ].join('\r\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="stroop_all_trials_detailed_${new Date().toISOString().slice(0, 10)}.csv"`);
  res.send(csv);
});

// --- Vite Middlewares in Dev / Static file serving in Production ---
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Stroop Study Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Server Startup Error]', err);
  process.exit(1);
});
