
import React, { useMemo, useState, useEffect } from 'react';
import { HistoryStorage } from '../services/historyStorage';

interface HistoryViewerProps {
  panelId: string;
  headers: string[];
}

const HistoryViewer: React.FC<HistoryViewerProps> = ({ panelId, headers }) => {
  // Map panelId to storage keys consistent with App.tsx
  const storageKey = useMemo(() => {
    switch(panelId) {
        case 'GLOBAL_SYSTEM_PROBE': return 'HISTORY_CORE_STATS';
        case 'GLOBAL_SYSTEM_AUDIT': return 'HISTORY_CORE_STATS'; // Legacy support
        case 'HANDSHAKE_CORE': return 'HISTORY_HANDSHAKE_CORE';
        case 'ADAPTER_HUB': return 'HISTORY_ADAPTER_HUB';
        case 'NODE_DIAGNOSTICS': return 'HISTORY_NODE_DIAGNOSTICS';
        case 'PROCESS_PROBE': return 'HISTORY_PROCESS_PROBE';
        case 'RSSI_REPORT': return 'HISTORY_RSSI_REPORT';
        default: return `HISTORY_${panelId}`;
    }
  }, [panelId]);

  const [entries, setEntries] = useState(HistoryStorage.getEntries(storageKey));

  // Live update effect
  useEffect(() => {
    const interval = setInterval(() => {
        setEntries(HistoryStorage.getEntries(storageKey));
    }, 2000);
    return () => clearInterval(interval);
  }, [storageKey]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center text-[10px] text-zinc-500 font-mono uppercase border-b border-zinc-900 pb-2">
         <span>Storage_Key: {storageKey}</span>
         <span>Entries: {entries.length}</span>
      </div>
      
      <div className="overflow-x-auto border border-zinc-900 bg-zinc-950/30 max-h-[60vh] no-scroll">
        <table className="w-full text-left border-collapse">
          <thead className="bg-zinc-900 text-zinc-400 sticky top-0 z-10">
            <tr>
              <th className="p-2 text-[9px] font-black uppercase tracking-wider border-b border-zinc-800">TIMESTAMP</th>
              {headers.map((h, i) => (
                <th key={i} className="p-2 text-[9px] font-black uppercase tracking-wider border-b border-zinc-800">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="text-[10px] font-mono text-zinc-400">
            {entries.length > 0 ? (
                entries.map((e, idx) => (
                <tr key={`${e.timestamp}-${idx}`} className="hover:bg-teal-500/5 transition-colors border-b border-zinc-900/50 last:border-0 group">
                    <td className="p-2 text-zinc-600 whitespace-nowrap">{new Date(e.timestamp).toLocaleTimeString()}</td>
                    {e.values.map((val, vIdx) => (
                        <td key={vIdx} className="p-2 group-hover:text-teal-400 transition-colors">{val}</td>
                    ))}
                </tr>
                ))
            ) : (
                <tr>
                    <td colSpan={headers.length + 1} className="p-8 text-center text-zinc-700 italic text-[9px] uppercase tracking-widest">
                        [ NO_HISTORICAL_DATA_FOUND ]
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HistoryViewer;
