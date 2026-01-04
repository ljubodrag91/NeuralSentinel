
import React, { useState, useMemo } from 'react';
import Modal from './Modal';
import { LogEntry, ProbeStatus, SlotType, DetailedProbeType } from '../../types';
import Tooltip from './Tooltip';

interface ProbeAuditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  logs: LogEntry[];
  onClearFiltered: (ids: string[]) => void;
}

const ProbeAuditDialog: React.FC<ProbeAuditDialogProps> = ({ isOpen, onClose, logs, onClearFiltered }) => {
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'TREE' | 'TABLE'>('TREE');

  const probeLogs = useMemo(() => {
    return logs.filter(l => l.metadata?.type === 'PROBE_RESULT' || l.message.includes('Neural Probe Output'));
  }, [logs]);

  const filteredLogs = useMemo(() => {
    if (!search) return probeLogs;
    const s = search.toLowerCase();
    return probeLogs.filter(l => 
        l.message.toLowerCase().includes(s) || 
        l.metadata?.panelId?.toLowerCase().includes(s) ||
        l.metadata?.slotType?.toLowerCase().includes(s) ||
        l.metadata?.probeType?.toLowerCase().includes(s) ||
        l.metadata?.probeStatus?.toLowerCase().includes(s)
    );
  }, [probeLogs, search]);

  const toggleExpand = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  const copyToClipboard = (data: any) => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
  };

  const getStatusColor = (status: ProbeStatus | undefined) => {
    switch (status) {
      case 'COMPLETED': return 'text-green-500';
      case 'PARTIAL': return 'text-yellow-500';
      case 'ERROR': return 'text-red-500';
      case 'NO_DATA': return 'text-zinc-600';
      default: return 'text-teal-500';
    }
  };

  const getStatusBorder = (status: ProbeStatus | undefined) => {
    switch (status) {
      case 'COMPLETED': return 'border-green-900/30';
      case 'PARTIAL': return 'border-yellow-900/30';
      case 'ERROR': return 'border-red-900/30';
      case 'NO_DATA': return 'border-zinc-900';
      default: return 'border-teal-900/30';
    }
  };

  const getSlotColor = (slot: SlotType | undefined) => {
    switch (slot) {
      case 'LOW': return 'text-teal-400';
      case 'PROBE': return 'text-purple-400'; // Renamed from MEDIUM
      case 'SENSOR': return 'text-orange-400';
      case 'MAIN': return 'text-purple-500';
      default: return 'text-zinc-500';
    }
  };

  const formatProbeLabel = (type: DetailedProbeType | undefined) => {
    if (!type) return 'GENERIC_INFERENCE';
    return type.replace('_', ' ');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="FULL_NEURAL_AUDIT" variant="purple">
      <div className="flex flex-col h-[75vh] overflow-hidden">
        
        {/* TOOLBAR */}
        <div className="flex items-center gap-4 mb-6 border-b border-zinc-900 pb-4 shrink-0">
          <div className="relative flex-1">
             <input 
                type="text" 
                value={search} 
                onChange={(e) => setSearch(e.target.value)}
                placeholder="FILTER_BY_PANEL_SLOT_TYPE_OR_STATUS..."
                className="w-full bg-black border border-zinc-800 p-2 text-[10px] font-mono text-zinc-300 outline-none focus:border-purple-500/50"
             />
             <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-20"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg></div>
          </div>
          
          <div className="flex border border-zinc-800 h-9">
             <button 
                onClick={() => setViewMode('TREE')}
                className={`px-3 text-[9px] font-black uppercase transition-all ${viewMode === 'TREE' ? 'bg-purple-500/20 text-purple-400' : 'text-zinc-600 hover:text-white'}`}
             >TREE</button>
             <div className="w-[1px] bg-zinc-900"></div>
             <button 
                onClick={() => setViewMode('TABLE')}
                className={`px-3 text-[9px] font-black uppercase transition-all ${viewMode === 'TABLE' ? 'bg-purple-500/20 text-purple-400' : 'text-zinc-600 hover:text-white'}`}
             >TABLE</button>
          </div>

          <button 
             onClick={() => onClearFiltered(filteredLogs.map(l => l.id))}
             className="px-4 py-2 border border-red-900/40 text-red-500 text-[9px] font-black uppercase tracking-widest hover:bg-red-500/10 transition-all h-9"
          >CLEAR_VIEW_LOGS</button>
        </div>

        {/* LIST */}
        <div className="flex-1 overflow-y-auto no-scroll space-y-4 pr-2">
           {filteredLogs.length > 0 ? filteredLogs.map(log => {
             const meta = log.metadata;
             const tooltipText = `Request sent with ${meta?.tokenLimit || 0} tokens (${formatProbeLabel(meta?.probeType)}, ${meta?.slotType} Slot) from ${meta?.panelId || 'System'}`;
             const isExpanded = expandedId === log.id;

             return (
                <div key={log.id} className={`border bg-black/40 transition-all ${getStatusBorder(meta?.probeStatus)}`}>
                   
                   {/* LOG HEADER */}
                   <div 
                      onClick={() => toggleExpand(log.id)}
                      className="p-3 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors group"
                   >
                      <div className="flex items-center gap-4">
                         <Tooltip name="AUDIT_TIMESTAMP" source="LOG" desc="Standardized ISO-8601 execution timestamp.">
                            <span className="text-[10px] font-mono text-zinc-600">{log.timestamp}</span>
                         </Tooltip>
                         
                         <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                               <span className="text-[10px] font-black text-white uppercase tracking-widest">{meta?.panelId || log.message.replace('Neural Probe Output: ', '')}</span>
                               <span className={`text-[8px] font-black uppercase px-1 border border-zinc-800 ${getSlotColor(meta?.slotType)}`}>{meta?.slotType || 'UNKNOWN'}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                               <Tooltip name="AUDIT_LAUNCHER" source="SYSTEM" desc={tooltipText}>
                                  <span className="text-[7px] text-zinc-700 font-mono uppercase tracking-tighter cursor-help">PROBE: {formatProbeLabel(meta?.probeType)}</span>
                               </Tooltip>
                               {meta?.hasHistoricalData && <span className="text-[7px] bg-blue-900/30 text-blue-400 px-1 border border-blue-800/40 font-bold uppercase">HISTORICAL_STREAM</span>}
                            </div>
                         </div>
                      </div>

                      <div className="flex items-center gap-6">
                         <span className={`text-[9px] font-black uppercase tracking-widest ${getStatusColor(meta?.probeStatus)}`}>
                            {meta?.probeStatus || 'COMPLETED'}
                         </span>
                         <svg className={`w-3 h-3 text-zinc-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7"/></svg>
                      </div>
                   </div>

                   {/* LOG BODY */}
                   {isExpanded && (
                      <div className="p-4 border-t border-zinc-900 bg-zinc-950/40 animate-in slide-in-from-top-1 space-y-4">
                         
                         {/* REQUEST / RESPONSE SPLIT */}
                         <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {/* REQUEST */}
                            <div className="flex flex-col gap-2">
                               <div className="flex justify-between items-center">
                                  <span className="text-[8px] font-black text-zinc-700 uppercase tracking-widest">PROBE_REQUEST_PAYLOAD</span>
                                  <button onClick={() => copyToClipboard(meta?.requestPayload)} className="text-[7px] font-black text-zinc-500 hover:text-zinc-300 uppercase">[ COPY ]</button>
                               </div>
                               <div className="bg-black/90 p-4 border border-zinc-900 h-64 overflow-y-auto no-scroll relative group/req">
                                  <pre className="text-[10px] font-mono text-teal-600 leading-relaxed whitespace-pre-wrap">
                                     {JSON.stringify(meta?.requestPayload, null, 2)}
                                  </pre>
                                  <div className="absolute inset-0 pointer-events-none opacity-5 transition-opacity bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px]"></div>
                               </div>
                            </div>

                            {/* RESPONSE */}
                            <div className="flex flex-col gap-2">
                               <div className="flex justify-between items-center">
                                  <span className="text-[8px] font-black text-zinc-700 uppercase tracking-widest">PROBE_RESPONSE_PAYLOAD</span>
                                  <button onClick={() => copyToClipboard(meta?.responsePayload)} className="text-[7px] font-black text-zinc-500 hover:text-zinc-300 uppercase">[ COPY ]</button>
                               </div>
                               <div className="bg-black/90 p-4 border border-zinc-900 h-64 overflow-y-auto no-scroll relative group/res">
                                  <pre className="text-[10px] font-mono text-purple-400 leading-relaxed whitespace-pre-wrap">
                                     {JSON.stringify(meta?.responsePayload, null, 2)}
                                  </pre>
                                  <div className="absolute inset-0 pointer-events-none opacity-5 transition-opacity bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px]"></div>
                               </div>
                            </div>
                         </div>
                      </div>
                   )}
                </div>
             );
           }) : (
             <div className="h-full flex flex-col items-center justify-center opacity-30">
                <svg className="w-12 h-12 text-zinc-800 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-700 animate-pulse">Awaiting Unified Audit Stream</span>
             </div>
           )}
        </div>
      </div>
    </Modal>
  );
};

export default ProbeAuditDialog;
