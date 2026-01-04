
import React, { useState, useMemo, useEffect } from 'react';
import Modal from './Modal';
import { LogEntry, ProbeStatus, SlotType, DetailedProbeType } from '../../types';
import Tooltip from './Tooltip';

interface ProbeAuditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  logs: LogEntry[];
  focusId?: string | null;
  onClearFiltered: (ids: string[]) => void;
}

const SyntaxHighlighter: React.FC<{ json: any, colorMode?: 'teal' | 'purple' }> = ({ json, colorMode = 'teal' }) => {
  const formatValue = (val: any) => {
    if (typeof val === 'string') return <span className="text-[#28a745]">"{val}"</span>;
    if (typeof val === 'number') return <span className="text-[#f97316]">{val}</span>;
    if (typeof val === 'boolean') return <span className="text-[#bd00ff]">{String(val)}</span>;
    if (val === null) return <span className="text-[#bd00ff]">null</span>;
    return String(val);
  };

  const renderJson = (obj: any, depth = 0): React.ReactNode => {
    const indent = '  '.repeat(depth);
    if (Array.isArray(obj)) {
      if (obj.length === 0) return '[]';
      return (
        <>
          [
          {obj.map((item, i) => (
            <div key={i} className="pl-4">
              {renderJson(item, depth + 1)}{i < obj.length - 1 ? ',' : ''}
            </div>
          ))}
          {indent}]
        </>
      );
    }
    if (typeof obj === 'object' && obj !== null) {
      const keys = Object.keys(obj);
      if (keys.length === 0) return '{}';
      return (
        <>
          {"{"}
          {keys.map((key, i) => (
            <div key={key} className="pl-4">
              <span className="text-[#00ffd5]">"{key}"</span>: {renderJson(obj[key], depth + 1)}
              {i < keys.length - 1 ? ',' : ''}
            </div>
          ))}
          {indent}{"}"}
        </>
      );
    }
    return formatValue(obj);
  };

  return (
    <pre className="font-mono text-[9px] leading-tight whitespace-pre-wrap break-all selection:bg-teal-500/20">
      {renderJson(json)}
    </pre>
  );
};

const ProbeAuditDialog: React.FC<ProbeAuditDialogProps> = ({ isOpen, onClose, logs, focusId, onClearFiltered }) => {
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [localFocusId, setLocalFocusId] = useState<string | null>(focusId || null);
  const [showFullPayload, setShowFullPayload] = useState<Record<string, boolean>>({});
  const [showOptimizedPayload, setShowOptimizedPayload] = useState<Record<string, boolean>>({});

  useEffect(() => { setLocalFocusId(focusId || null); }, [focusId]);

  const probeLogs = useMemo(() => {
    return logs.filter(l => l.metadata?.type === 'PROBE_RESULT' || l.message.includes('Neural Probe Output'));
  }, [logs]);

  useEffect(() => {
    if (isOpen) {
      if (localFocusId) setExpandedId(localFocusId);
      else if (probeLogs.length > 0 && !expandedId) setExpandedId(probeLogs[0].id);
    }
  }, [isOpen, localFocusId, probeLogs.length]);

  const displayLogs = useMemo(() => {
    if (localFocusId) return probeLogs.filter(l => l.id === localFocusId);
    if (!search) return probeLogs;
    const s = search.toLowerCase();
    return probeLogs.filter(l => l.message.toLowerCase().includes(s) || l.metadata?.probeTypeUsed?.toLowerCase().includes(s));
  }, [probeLogs, search, localFocusId]);

  const toggleExpand = (id: string) => { setExpandedId(prev => (prev === id ? null : id)); };
  const copyToClipboard = (data: any) => { navigator.clipboard.writeText(JSON.stringify(data, null, 2)); };

  const getStatusColorClass = (status: ProbeStatus | undefined, threatLevel?: string) => {
    if (status === 'ERROR') return 'text-[#dc3545]';
    if (threatLevel === 'CRITICAL' || threatLevel === 'HIGH') return 'text-[#f97316]';
    return 'text-[#28a745]';
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={localFocusId ? "Focused Probe Breakdown" : "Neural Audit Stream"} variant="purple">
      <div className="flex flex-col h-[75vh] overflow-hidden">
        
        {!localFocusId && (
            <div className="flex items-center gap-4 mb-6 border-b border-zinc-900 pb-4 shrink-0">
                <input 
                    type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                    placeholder="FILTER_AUDIT_STREAM..."
                    className="flex-1 bg-black border border-zinc-800 p-2 text-[10px] font-mono text-zinc-300 outline-none focus:border-purple-500/50"
                />
                <button onClick={() => onClearFiltered(displayLogs.map(l => l.id))} className="px-4 py-2 border border-red-900/40 text-red-500 text-[9px] font-black uppercase hover:bg-red-500/10 transition-all h-9">PURGE_TRAIL</button>
            </div>
        )}

        <div className="flex-1 overflow-y-auto no-scroll space-y-4 pr-2 pb-10">
           {displayLogs.length > 0 ? displayLogs.map((log, index) => {
             const meta = log.metadata;
             const isExpanded = expandedId === log.id;
             const res = meta?.responsePayload;
             const isError = meta?.probeStatus === 'ERROR';
             const probeTypeLabel = meta?.probeTypeUsed || "Standard";

             return (
                <div key={log.id} className={`border border-zinc-900 bg-zinc-950/40 transition-all ${isExpanded ? 'bg-black/60 shadow-xl border-purple-500/30' : ''}`}>
                   <div onClick={() => toggleExpand(log.id)} className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors group">
                      <div className="flex items-center gap-6">
                         <div className="flex flex-col items-center border-r border-zinc-800/50 pr-4"><span className="text-[9px] font-mono text-zinc-600">{log.timestamp}</span><span className="text-[12px] font-black text-zinc-500">#{probeLogs.length - index}</span></div>
                         <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                               <span className="text-[11px] font-black text-white uppercase tracking-widest">{meta?.panelId || 'SYSTEM'}</span>
                               {meta?.depth && <span className="text-[7px] border border-zinc-800 px-1 text-zinc-600 font-mono">D:{meta.depth}</span>}
                            </div>
                            <span className="text-[7px] text-teal-500 font-mono uppercase tracking-tighter mt-1">{probeTypeLabel} Probe Carrier</span>
                         </div>
                      </div>
                      <div className="flex items-center gap-8">
                         <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${getStatusColorClass(meta?.probeStatus, res?.threatLevel)}`}>{res?.threatLevel || (isError ? 'FAULT' : 'SYNCED')}</span>
                         <svg className={`w-4 h-4 text-zinc-600 transition-transform ${isExpanded ? 'rotate-180 text-white' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7"/></svg>
                      </div>
                   </div>

                   {isExpanded && (
                      <div className="p-6 border-t border-zinc-900 bg-[#050608]/80 space-y-6 animate-in fade-in">
                         <section className="bg-black/40 p-4 border border-zinc-900">
                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-2">Neural_Assessment</span>
                            <p className="text-[12px] text-zinc-200 font-mono leading-relaxed">{res?.description || "Processing reasoning fragment..."}</p>
                         </section>

                         <div className="grid grid-cols-2 gap-4">
                            <section className="bg-black/40 p-4 border border-zinc-900"><span className="text-[9px] font-black text-teal-600 uppercase block mb-2">Tactical_Directives</span><div className="text-[11px] text-zinc-300 font-bold border-l-2 border-teal-500/40 pl-3 leading-relaxed">{res?.recommendation}</div></section>
                            <section className="bg-black/40 p-4 border border-zinc-900"><span className="text-[9px] font-black text-[#f97316] uppercase block mb-2">Anomaly_Signatures</span><div className="space-y-1">{res?.anomalies?.map((a: string, i: number) => <div key={i} className="text-[10px] text-zinc-400 font-mono flex gap-2"><span className="text-[#f97316]">!</span>{a}</div>)}</div></section>
                         </div>

                         <div className="pt-4 border-t border-zinc-900 space-y-4">
                            <div className="flex gap-4">
                               <button onClick={() => setShowFullPayload(v => ({...v, [log.id]: !v[log.id]}))} className={`text-[8px] font-black uppercase px-2 py-1 border ${showFullPayload[log.id] ? 'bg-teal-500/20 border-teal-500 text-teal-400' : 'bg-black border-zinc-800 text-zinc-600'}`}>Full_Envelope_Carrier</button>
                               <button onClick={() => setShowOptimizedPayload(v => ({...v, [log.id]: !v[log.id]}))} className={`text-[8px] font-black uppercase px-2 py-1 border ${showOptimizedPayload[log.id] ? 'bg-purple-500/20 border-purple-500 text-purple-400' : 'bg-black border-zinc-800 text-zinc-600'}`}>Token_Optimized_JSON</button>
                            </div>

                            {showFullPayload[log.id] && (
                               <div className="animate-in slide-in-from-top-2">
                                  <div className="flex justify-between items-center mb-1"><span className="text-[7px] text-zinc-700 uppercase font-black">Carrier_Unfiltered_JSON</span><button onClick={() => copyToClipboard(meta?.requestPayload)} className="text-[6px] text-zinc-500 hover:text-white uppercase">[ COPY ]</button></div>
                                  <div className="bg-[#1e1e1e] border border-zinc-900 p-4 h-64 overflow-y-auto no-scroll rounded-sm"><SyntaxHighlighter json={meta?.requestPayload} colorMode="teal" /></div>
                               </div>
                            )}

                            {showOptimizedPayload[log.id] && (
                               <div className="animate-in slide-in-from-top-2">
                                  <div className="flex justify-between items-center mb-1"><span className="text-[7px] text-zinc-700 uppercase font-black">AI_Ingress_Optimized</span><button onClick={() => copyToClipboard(meta?.responsePayload?._sentPayload?.optimizedPayload)} className="text-[6px] text-zinc-500 hover:text-white uppercase">[ COPY ]</button></div>
                                  <div className="bg-[#1e1e1e] border border-zinc-900 p-4 h-64 overflow-y-auto no-scroll rounded-sm"><SyntaxHighlighter json={meta?.responsePayload?._sentPayload?.optimizedPayload || meta?.requestPayload} colorMode="purple" /></div>
                               </div>
                            )}
                         </div>
                      </div>
                   )}
                </div>
             );
           }) : (
             <div className="h-full flex flex-col items-center justify-center opacity-20 py-20"><svg className="w-16 h-16 text-zinc-800 mb-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg><span className="text-[11px] font-black uppercase tracking-[0.5em] text-zinc-700 animate-pulse">Audit Stream Void</span></div>
           )}
        </div>
      </div>
    </Modal>
  );
};

export default ProbeAuditDialog;
