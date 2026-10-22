import { StoredSession } from '../types/stroop';

const STORAGE_KEY = 'stroop_research_sessions_v1';

export function getStoredSessions(): StoredSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to read stored sessions from localStorage', err);
    return [];
  }
}

export function saveSession(session: StoredSession): void {
  try {
    const existing = getStoredSessions();
    // Prepend new session
    const updated = [session, ...existing.filter((s) => s.id !== session.id)];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save session to localStorage', err);
  }
}

export function importSessions(newSessions: StoredSession[]): number {
  try {
    const existing = getStoredSessions();
    const existingIds = new Set(existing.map((s) => s.id));
    const toAdd = newSessions.filter((s) => !existingIds.has(s.id));
    const merged = [...toAdd, ...existing];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    return toAdd.length;
  } catch (err) {
    console.error('Failed to import sessions', err);
    return 0;
  }
}

export function deleteStoredSession(id: string): void {
  try {
    const existing = getStoredSessions();
    const updated = existing.filter((s) => s.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to delete session', err);
  }
}

export function clearAllStoredSessions(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear sessions', err);
  }
}

export function getNextParticipantId(): string {
  const sessions = getStoredSessions();
  if (sessions.length === 0) return 'P001';

  let maxNum = 0;
  sessions.forEach((s) => {
    const match = s.participantId.match(/P(\d+)/i);
    if (match && match[1]) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  });

  const nextNum = maxNum + 1;
  return `P${String(nextNum).padStart(3, '0')}`;
}
