
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
    
    // Prune old entries strictly before appending
    Object.keys(store).forEach(key => {
        store[key] = store[key].filter(e => (now - e.timestamp) < MAX_AGE_MS);
    });
    
    // Store as flat CSV string data to save space
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
    let entries = store[type] || [];
    
    const now = Date.now();
    // Filter on read as well
    entries = entries.filter(e => (now - e.timestamp) < MAX_AGE_MS);
    
    if (entries.length === 0) return headers;

    const rows = entries.map(e => {
      const date = new Date(e.timestamp).toISOString();
      return `${date},${e.data}`;
    });

    return `TIMESTAMP,${headers}\n${rows.join('\n')}`;
  },

  // Retrieve raw entries for generic UI display
  getEntries(type: string): { timestamp: number, values: string[] }[] {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const store: Record<string, HistoryEntry[]> = JSON.parse(raw);
    let entries = store[type] || [];
    
    const now = Date.now();
    entries = entries.filter(e => (now - e.timestamp) < MAX_AGE_MS);

    return entries.map(e => ({
      timestamp: e.timestamp,
      values: e.data.split(',')
    })).reverse(); // Newest first
  },

  getParsed(type: string): any[] {
    const entries = this.getEntries(type);
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
