
import { SessionInfo, OperationalMode } from '../types';

const SESSION_KEY = 'neural_sentinel_active_session';

export const sessionManager = {
  saveSession(ip: string, user: string, authHash: string, port: number) {
    const sessionData = {
      ip,
      user,
      authHash, // Simulated secure token
      port,
      timestamp: Date.now()
    };
    // encryption simulated by base64 to avoid plaintext storage
    const encoded = btoa(JSON.stringify(sessionData));
    sessionStorage.setItem(SESSION_KEY, encoded);
  },

  loadSession(): { ip: string, user: string, authHash: string, port: number } | null {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    try {
      const data = JSON.parse(atob(raw));
      // Basic expiration check (24h)
      if (Date.now() - data.timestamp > 24 * 60 * 60 * 1000) {
        sessionStorage.removeItem(SESSION_KEY);
        return null;
      }
      return data;
    } catch (e) {
      console.error("Session restore failed", e);
      return null;
    }
  },

  clearSession() {
    sessionStorage.removeItem(SESSION_KEY);
  }
};
