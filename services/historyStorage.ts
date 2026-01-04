
interface HistoryEntry {
  timestamp: number;
  data: string;
}

const STORAGE_KEY = 'neural_sentinel_csv_history';
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

/**
 * Defensive History Storage Engine
 * Prevents "Cannot read properties of undefined (reading 'length')" errors
 * by ensuring return values are always strictly typed arrays.
 */
export const HistoryStorage = {
  clear(): void {
    localStorage.removeItem(STORAGE_KEY);
  },

  append(type: string, headers: string, values: string[]): void {
    const raw = localStorage.getItem(STORAGE_KEY);
    let store: Record<string, HistoryEntry[]> = {};
    
    try {
        const parsed = raw ? JSON.parse(raw) : null;
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            store = parsed;
        }
    } catch (e) {
        store = {};
    }
    
    if (!store[type]) store[type] = [];
    
    const now = Date.now();
    
    // Cleanup aged entries across all types to maintain storage health
    Object.keys(store).forEach(key => {
        const entries = store[key];
        if (Array.isArray(entries)) {
            store[key] = entries.filter(e => e && (now - e.timestamp) < MAX_AGE_MS);
        } else {
            store[key] = [];
        }
    });
    
    store[type].push({
      timestamp: now,
      data: values.join(',')
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  },

  getCSV(type: string, headers: string): string {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return headers;
    
    let store: Record<string, HistoryEntry[]> = {};
    try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            store = parsed;
        }
    } catch (e) {
        return headers;
    }

    let entries = store[type];
    if (!Array.isArray(entries)) return headers;
    
    const now = Date.now();
    entries = entries.filter(e => e && (now - e.timestamp) < MAX_AGE_MS);
    
    if (entries.length === 0) return headers;

    const rows = entries.map(e => {
      const date = new Date(e.timestamp).toISOString();
      return `${date},${e.data}`;
    });

    return `TIMESTAMP,${headers}\n${rows.join('\n')}`;
  },

  getTicks(type: string, depth: number, headers: string): any[][] {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    let store: Record<string, HistoryEntry[]> = {};
    try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            store = parsed;
        }
    } catch (e) {
        return [];
    }

    let entries = store[type];
    if (!Array.isArray(entries)) return [];
    
    const now = Date.now();
    entries = entries.filter(e => e && (now - e.timestamp) < MAX_AGE_MS);

    const headerKeys = (headers || "").split(',');

    return entries.slice(-depth).map(e => {
        const parts = (e.data || "").split(',');
        return headerKeys.map((key, i) => ({ [key]: parts[i] || '0' }));
    });
  },

  getEntries(type: string): { timestamp: number, values: string[] }[] {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    let store: Record<string, HistoryEntry[]> = {};
    try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            store = parsed;
        }
    } catch (e) {
        return [];
    }

    let entries = store[type];
    if (!Array.isArray(entries)) return [];
    
    const now = Date.now();
    entries = entries.filter(e => e && (now - e.timestamp) < MAX_AGE_MS);

    return entries.map(e => ({
      timestamp: e.timestamp,
      values: (e.data || '').split(',')
    })).reverse(); 
  },

  getParsed(type: string): any[] {
    const entries = this.getEntries(type);
    if (!Array.isArray(entries)) return [];
    
    return entries.map((e, index) => {
      const parts = e.values;
      return {
        id: `hist-${e.timestamp}-${index}`,
        timestamp: parts[0] || new Date(e.timestamp).toLocaleTimeString(),
        action: parts[1] || 'UNKNOWN',
        target: parts[2] || 'UNKNOWN',
        result: parts[3] || 'UNKNOWN'
      };
    });
  }
};
