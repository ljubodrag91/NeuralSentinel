interface HistoryEntry {
  timestamp: number;
  data: string;
}

const STORAGE_KEY = 'neural_sentinel_csv_history';
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

export const HistoryStorage = {
  clear(): void {
    localStorage.removeItem(STORAGE_KEY);
  },

  append(type: string, headers: string, values: string[]): void {
    const raw = localStorage.getItem(STORAGE_KEY);
    let store: Record<string, HistoryEntry[]> = raw ? JSON.parse(raw) : {};
    
    if (!store[type]) store[type] = [];
    
    const now = Date.now();
    // Prune old entries
    store[type] = store[type].filter(e => now - e.timestamp < MAX_AGE_MS);
    
    store[type].push({
      timestamp: now,
      data: values.join(',')
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  },

  getCSV(type: string, headers: string): string {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return headers;
    
    const store: Record<string, HistoryEntry[]> = JSON.parse(raw);
    const entries = store[type] || [];
    
    if (entries.length === 0) return headers;

    const rows = entries.map(e => {
      const date = new Date(e.timestamp).toISOString();
      return `${date},${e.data}`;
    });

    return `TIMESTAMP,${headers}\n${rows.join('\n')}`;
  }
};