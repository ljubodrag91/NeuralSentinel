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

const ProbeAuditDialog: React.FC<ProbeAuditDialogProps> = ({ isOpen, onClose, logs, focusId, onClearFiltered }) => {
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showRawRequest, setShowRawRequest] = useState<Record<string, boolean>>({});
  const [showRawResponse, setShowRawResponse] = useState<Record<string, boolean>>({});
  const [localFocusId, setLocalFocusId] = useState<string | null>(focusId || null);

  useEffect(() => {
    setLocalFocusId(focusId || null);
  }, [focusId]);

  const probeLogs = useMemo(() => {
    return logs.filter(l => l.metadata?.type === 'PROBE_RESULT' || l.message.includes('Neural Probe Output'));
  }, [logs]);

  // Auto-expand latest log if it's new or focused
  useEffect(() => {
    if (isOpen) {
      if (localFocusId) {
        setExpandedId(localFocusId);
      } else if (probeLogs.length > 0 && !expandedId) {
        setExpandedId(probeLogs[0].id);
      }
    }
  }, [isOpen, localFocusId, probeLogs.length]);

  const displayLogs = useMemo(() => {
    if (localFocusId) {
        return probeLogs.filter(l => l.id === localFocusId);
    }
    if (!search) return probeLogs;
    const s = search.toLowerCase();
    return probeLogs.filter(l => 
        l.message.toLowerCase().includes(s) || 
        l.metadata?.panelId?.toLowerCase().includes(s) ||
        l.metadata?.slotType?.toLowerCase().includes(s) ||
        l.metadata?.probeType?.toLowerCase().includes(s) ||
        l.metadata?.probeStatus?.toLowerCase().includes(s)
    );
  }, [probeLogs, search, localFocusId]);

  const toggleExpand = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  const copyToClipboard = (data: any) => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
  };

  const getStatusColorClass = (status: ProbeStatus | undefined, threatLevel?: string) => {
    if (status === 'ERROR') return 'text-[#dc3545]';
    if (threatLevel === 'CRITICAL' || threatLevel === 'HIGH') return 'text-[#f97316]';
    if (status === 'COMPLETED') return 'text-[#28a745]';
    return 'text-teal-500';
  };

  const getStatusBgClass = (status: ProbeStatus | undefined, threatLevel?: string) => {
    if (status === 'ERROR') return 'bg-[#dc3545]/10 border-[#dc3545]/30';
    if (threatLevel === 'CRITICAL' || threatLevel === 'HIGH') return 'bg-[#f97316]/10 border-[#f97316]/30';
    if (status === 'COMPLETED') return 'bg-[#28a745]/10 border-[#28a745]/30';
    return 'bg-zinc-900 border-zinc-800';
  };

  const getSlotColor = (slot: SlotType | undefined) => {
    switch (slot) {
      case 'LOW': return 'text-[#00ffd5]';
      case 'PROBE': return 'text-[#bd00ff]';
      case 'SENSOR': return 'text-[#f97316]';
      case 'MAIN': return 'text-purple-500';
      default: return 'text-zinc-500';
    }
  };

  const formatProbeLabel = (type: DetailedProbeType | undefined) => {
    if (!type) return 'GENERIC_INFERENCE';
    return type.replace('_', ' ');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={localFocusId ? "Neural Audit – Focused Breakdown" : "Neural Breakdown – Full Neural Audit"} variant="purple">
      <div className="flex flex-col h-[75vh] overflow-hidden">
        
        {/* TOOLBAR */}
        <div className="flex items-center gap-4 mb-6 border-b border-zinc-900 pb-4 shrink-0">
          {localFocusId ? (
            <div className="flex-1 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></div>
                    <span className="text-[10px] font-black uppercase text-teal-400 tracking-widest">Focused_Probe_Context</span>
                </div>
                <button 
                    onClick={() => setLocalFocusId(null)}
                    className="text-[9px] font-black uppercase tracking-widest border border-zinc-800 bg-zinc-950 px-4 py-2 hover:border-teal-500/50 hover:text-white transition-all"
                >
                    VIEW_FULL_HISTORY
                </button>
            </div>
          ) : (
            <>
              <div className="relative flex-1">
                <input 
                    type="text" 
                    value={search} 
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="FILTER_AUDIT_TRAIL..."
                    className="w-full bg-black border border-zinc-800 p-2 text-[10px] font-mono text-zinc-300 outline-none focus:border-purple-500/50"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-20"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg></div>
              </div>
              
              <button 
                onClick={() => onClearFiltered(displayLogs.map(l => l.id))}
                className="px-4 py-2 border border-red-900/40 text-red-500 text-[9px] font-black uppercase tracking-widest hover:bg-red-500/10 transition-all h-9"
              >PURGE_VIEW_HISTORY</button>
            </>
          )}
        </div>

        {/* LIST */}
        <div className="flex-1 overflow-y-auto no-scroll space-y-4 pr-2 pb-10">
           {displayLogs.length > 0 ? displayLogs.map((log, index) => {
             const meta = log.metadata;
             const isExpanded = expandedId === log.id;
             const res = meta?.responsePayload;
             const isError = meta?.probeStatus === 'ERROR';
             const statusColorClass = getStatusColorClass(meta?.probeStatus, res?.threatLevel);
             const statusBgClass = getStatusBgClass(meta?.probeStatus, res?.threatLevel);

             return (
                <div key={log.id} className={`border transition-all duration-500 animate-in slide-in-from-top-4 ${statusBgClass} ${isExpanded ? 'shadow-lg' : ''}`}>
                   
                   {/* LOG HEADER */}
                   <div 
                      onClick={() => toggleExpand(log.id)}
                      className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors group"
                   >
                      <div className="flex items-center gap-6">
                         <div className="flex flex-col items-center border-r border-zinc-800/50 pr-4">
                            <span className="text-[9px] font-mono text-zinc-600">{log.timestamp.split(' ')[0]}</span>
                            <span className="text-[12px] font-black text-zinc-500 font-mono tracking-tighter">#{probeLogs.length - index}</span>
                         </div>
                         
                         <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                               <span className="text-[11px] font-black text-white uppercase tracking-widest">{meta?.panelId || 'SYSTEM_SYNC'}</span>
                               <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 border border-zinc-800 bg-black/40 ${getSlotColor(meta?.slotType)}`}>{meta?.slotType || 'LOW'} TIER</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                               <span className="text-[7px] text-zinc-500 font-mono uppercase tracking-tighter">VECTOR: {formatProbeLabel(meta?.probeType)}</span>
                               {meta?.hasHistoricalData && <span className="text-[7px] bg-blue-900/30 text-blue-400 px-1 border border-blue-800/40 font-bold uppercase">HISTORICAL</span>}
                            </div>
                         </div>
                      </div>

                      <div className="flex items-center gap-8">
                         <div className="flex flex-col items-end">
                            <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${statusColorClass}`}>
                               {isError ? 'FAULT_DETECTED' : (res?.threatLevel || 'NOMINAL')}
                            </span>
                            <span className="text-[7px] text-zinc-600 font-mono uppercase">Status_Link: {meta?.probeStatus || 'SYNCED'}</span>
                         </div>
                         <svg className={`w-4 h-4 text-zinc-600 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-white' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7"/></svg>
                      </div>
                   </div>

                   {/* LOG BODY */}
                   {isExpanded && (
                      <div className="p-6 border-t border-zinc-900 bg-[#050608]/80 animate-in fade-in zoom-in-95 space-y-6">
                         
                         {/* TEMPLATE VIEW (Main Content) */}
                         <div className="space-y-6">
                            <section className="bg-black/40 p-4 border border-zinc-900 rounded-sm">
                               <div className="flex items-center gap-2 mb-3">
                                  <div className={`w-1.5 h-1.5 rounded-full ${statusColorClass} animate-pulse`}></div>
                                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Assessment_Summary</span>
                               </div>
                               <p className="text-[12px] text-zinc-200 leading-relaxed font-mono">
                                  {res?.description || "Awaiting neural reasoning fragment..."}
                                </p>
                            </section>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                               <section className="bg-black/40 p-4 border border-zinc-900 rounded-sm">
                                  <span className="text-[9px] font-black text-teal-600 uppercase block mb-3 tracking-widest">Tactical_Directives</span>
                                  <div className="text-[11px] text-zinc-300 font-bold border-l-2 border-teal-500/40 pl-3 leading-relaxed">
                                     {res?.recommendation || "Maintain standard operational parameters."}
                                  </div>
                               </section>

                               <section className="bg-black/40 p-4 border border-zinc-900 rounded-sm">
                                  <span className="text-[9px] font-black text-[#f97316] uppercase block mb-3 tracking-widest">Identified_Anomalies</span>
                                  <div className="space-y-1.5">
                                     {res?.anomalies && res.anomalies.length > 0 ? res.anomalies.map((a: string, i: number) => (
                                        <div key={i} className="flex items-center gap-2 text-[10px] text-zinc-400 font-mono">
                                           <span className="text-[#f97316] font-black">!</span>
                                           <span>{a}</span>
                                        </div>
                                     )) : (
                                        <div className="text-[10px] text-zinc-600 italic">No specific anomaly signatures matched.</div>
                                     )}
                                  </div>
                               </section>
                            </div>
                         </div>

                         {/* RAW DATA TABS (Hidden/Toggleable) */}
                         <div className="pt-4 border-t border-zinc-900 space-y-4">
                            <div className="flex gap-4">
                               <button 
                                  onClick={() => setShowRawRequest(prev => ({...prev, [log.id]: !prev[log.id]}))}
                                  className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 border transition-all ${showRawRequest[log.id] ? 'bg-teal-500/20 border-teal-500 text-teal-400' : 'bg-black border-zinc-800 text-zinc-600 hover:text-zinc-400'}`}
                               >
                                  {showRawRequest[log.id] ? 'HIDE_REQUEST_JSON' : 'VIEW_REQUEST_JSON'}
                               </button>
                               <button 
                                  onClick={() => setShowRawResponse(prev => ({...prev, [log.id]: !prev[log.id]}))}
                                  className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 border transition-all ${showRawResponse[log.id] ? 'bg-purple-500/20 border-purple-500 text-purple-400' : 'bg-black border-zinc-800 text-zinc-600 hover:text-zinc-400'}`}
                               >
                                  {showRawResponse[log.id] ? 'HIDE_RAW_RESPONSE' : 'VIEW_RAW_RESPONSE'}
                               </button>
                            </div>

                            {showRawRequest[log.id] && (
                               <div className="animate-in slide-in-from-top-2">
                                  <div className="flex justify-between items-center mb-1">
                                     <span className="text-[7px] text-zinc-700 font-black uppercase">Probe_Input_Payload</span>
                                     <button onClick={() => copyToClipboard(meta?.requestPayload)} className="text-[6px] text-zinc-500 hover:text-zinc-300 uppercase">[ COPY_DATA ]</button>
                                  </div>
                                  <div className="bg-black border border-zinc-900 p-4 h-48 overflow-y-auto no-scroll">
                                     <pre className="text-[9px] font-mono text-teal-700 leading-tight whitespace-pre-wrap">
                                        {JSON.stringify(meta?.requestPayload, null, 2)}
                                     </pre>
                                  </div>
                               </div>
                            )}

                            {showRawResponse[log.id] && (
                               <div className="animate-in slide-in-from-top-2">
                                  <div className="flex justify-between items-center mb-1">
                                     <span className="text-[7px] text-zinc-700 font-black uppercase">Probe_Output_Fulltext</span>
                                     <button onClick={() => copyToClipboard(res)} className="text-[6px] text-zinc-500 hover:text-zinc-300 uppercase">[ COPY_TEXT ]</button>
                                  </div>
                                  <div className="bg-black border border-zinc-900 p-4 h-48 overflow-y-auto no-scroll">
                                     <pre className="text-[9px] font-mono text-purple-700 leading-tight whitespace-pre-wrap">
                                        {JSON.stringify(res, null, 2)}
                                     </pre>
                                  </div>
                               </div>
                            )}
                         </div>
                      </div>
                   )}
                </div>
             );
           }) : (
             <div className="h-full flex flex-col items-center justify-center opacity-20 py-20">
                <svg className="w-16 h-16 text-zinc-800 mb-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                <span className="text-[11px] font-black uppercase tracking-[0.5em] text-zinc-700 animate-pulse">Neural Audit Stream Inactive</span>
             </div>
           )}
        </div>
      </div>
    </Modal>
  );
};

export default ProbeAuditDialog;