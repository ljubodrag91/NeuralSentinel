
import React, { useState } from 'react';
import { PiStats, OperationalMode, Timeframe } from '../types';
import Card from './common/Card';
import Tooltip from './common/Tooltip';

interface PiStatsViewProps {
  stats: PiStats | null;
  mode: OperationalMode;
  timeframe: Timeframe;
  onProbeClick: (panel: string, metrics: any) => void;
  onBrainClick: (id: string, type: string, metrics: any) => void;
  processingId?: string;
}

const PiStatsView: React.FC<PiStatsViewProps> = ({ stats, mode, timeframe, onProbeClick, onBrainClick, processingId }) => {
  const [activeMetrics, setActiveMetrics] = useState<Set<string>>(new Set(['cpu', 'ram', 'net', 'disk']));

  const toggleMetric = (id: string) => {
    const next = new Set(activeMetrics);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setActiveMetrics(next);
  };

  const safe = (val: number | undefined, precision: number = 1, unit: string = '') => {
    if (val === undefined || val === null || (mode === OperationalMode.REAL && !stats)) return '—';
    return val.toFixed(precision) + unit;
  };

  const isDataActive = mode === OperationalMode.SIMULATED || (mode === OperationalMode.REAL && stats);
  const sourceState = !isDataActive && mode === OperationalMode.REAL ? 'OFFLINE' : mode as string;

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20 no-scroll h-full overflow-y-auto pr-4">
      {/* Primary Telemetry Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* CPU */}
        <Tooltip name="CPU_MATRIX" unit="Percent (%)" source={sourceState} desc="Main computational load and thermal diagnostics. Critical for monitoring performance during active cryptanalysis.">
          <div 
            onClick={() => toggleMetric('cpu')}
            className={`cursor-pointer border p-5 flex flex-col gap-3 transition-all group h-full ${
              activeMetrics.has('cpu') ? 'bg-zinc-900/80 border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.1)]' : 'bg-black border-zinc-900 hover:border-zinc-800'
            }`}
          >
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-black text-zinc-700 uppercase tracking-widest group-hover:text-zinc-500 transition-colors">CPU_MATRIX</span>
              <div className={`w-1.5 h-1.5 rounded-full ${activeMetrics.has('cpu') ? 'bg-green-500 glow-green' : 'bg-zinc-900'}`}></div>
            </div>
            <div className="flex items-baseline gap-4">
              <span className={`text-2xl font-black ${isDataActive ? 'text-zinc-200' : 'text-zinc-900'}`}>{safe(stats?.cpu?.usage, 1, '%')}</span>
              <span className={`text-md font-bold ${isDataActive ? 'text-zinc-500' : 'text-zinc-950'}`}>{safe(stats?.cpu?.temp, 1, '°C')}</span>
            </div>
            <div className="text-[8px] text-zinc-800 font-mono tracking-tighter uppercase">Load: {stats?.cpu?.load?.join(' / ') || '—'}</div>
          </div>
        </Tooltip>

        {/* RAM */}
        <Tooltip name="MEMORY_POOL" unit="Gigabytes (GB)" source={sourceState} desc="Volatile storage metrics. High memory saturation indicates resource-heavy modules like Metasploit are active.">
          <div 
            onClick={() => toggleMetric('ram')}
            className={`cursor-pointer border p-5 flex flex-col gap-3 transition-all group h-full ${
              activeMetrics.has('ram') ? 'bg-zinc-900/80 border-blue-500/50 shadow-[0_0_15px_rgba(0,242,255,0.1)]' : 'bg-black border-zinc-900 hover:border-zinc-800'
            }`}
          >
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-black text-zinc-700 uppercase tracking-widest group-hover:text-zinc-500 transition-colors">MEMORY_POOL</span>
              <div className={`w-1.5 h-1.5 rounded-full ${activeMetrics.has('ram') ? 'bg-blue-500 glow-blue' : 'bg-zinc-900'}`}></div>
            </div>
            <div className="flex items-baseline gap-4">
              <span className={`text-2xl font-black ${isDataActive ? 'text-zinc-200' : 'text-zinc-900'}`}>{safe(stats?.memory?.usage, 1, '%')}</span>
              <span className={`text-md font-bold ${isDataActive ? 'text-zinc-500' : 'text-zinc-950'}`}>{safe(stats?.memory?.used, 2, 'G')}</span>
            </div>
            <div className="text-[8px] text-zinc-800 font-mono tracking-tighter uppercase">Avail: {safe(stats?.memory?.available, 2, 'G')}</div>
          </div>
        </Tooltip>

        {/* DISK */}
        <Tooltip name="DISK_VOLUMES" unit="GB / Rate (K/s)" source={sourceState} desc="Persistent storage integrity and I/O rates. Monitor this during database operations or exfiltration.">
          <div 
            onClick={() => toggleMetric('disk')}
            className={`cursor-pointer border p-5 flex flex-col gap-3 transition-all group h-full ${
              activeMetrics.has('disk') ? 'bg-zinc-900/80 border-orange-500/50 shadow-[0_0_15px_rgba(255,136,0,0.1)]' : 'bg-black border-zinc-900 hover:border-zinc-800'
            }`}
          >
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-black text-zinc-700 uppercase tracking-widest group-hover:text-zinc-500 transition-colors">DISK_VOLUMES</span>
              <div className={`w-1.5 h-1.5 rounded-full ${activeMetrics.has('disk') ? 'bg-orange-500 glow-orange' : 'bg-zinc-900'}`}></div>
            </div>
            <div className="flex items-baseline gap-4">
              <span className={`text-2xl font-black ${isDataActive ? 'text-zinc-200' : 'text-zinc-900'}`}>{safe(stats?.disk?.rootUsage, 1, '%')}</span>
              <span className={`text-md font-bold ${isDataActive ? 'text-zinc-500' : 'text-zinc-950'}`}>{safe(stats?.disk?.readRate, 1, 'K/s')}</span>
            </div>
            <div className="text-[8px] text-zinc-800 font-mono tracking-tighter uppercase">Root: {safe(stats?.disk?.rootUsage, 1, '%')}</div>
          </div>
        </Tooltip>

        {/* NETWORK */}
        <Tooltip name="IO_LINK" unit="Kilobytes (KB/s)" source={sourceState} desc="Real-time throughput analysis of network links. Crucial for verifying reverse-shell stability.">
          <div 
            onClick={() => toggleMetric('net')}
            className={`cursor-pointer border p-5 flex flex-col gap-3 transition-all group h-full ${
              activeMetrics.has('net') ? 'bg-zinc-900/80 border-teal-500/50 shadow-[0_0_15px_rgba(0,255,213,0.1)]' : 'bg-black border-zinc-900 hover:border-zinc-800'
            }`}
          >
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-black text-zinc-700 uppercase tracking-widest group-hover:text-zinc-500 transition-colors">IO_LINK</span>
              <div className={`w-1.5 h-1.5 rounded-full ${activeMetrics.has('net') ? 'bg-teal-500 glow-teal' : 'bg-zinc-900'}`}></div>
            </div>
            <div className="flex items-baseline gap-4">
              <span className={`text-2xl font-black ${isDataActive ? 'text-zinc-200' : 'text-zinc-900'}`}>RX {safe(stats?.network?.inRate, 1, 'K')}</span>
              <span className={`text-md font-bold ${isDataActive ? 'text-zinc-500' : 'text-zinc-950'}`}>TX {safe(stats?.network?.outRate, 1, 'K')}</span>
            </div>
            <div className="text-[8px] text-zinc-800 font-mono tracking-tighter uppercase">Sync_Rate: Active</div>
          </div>
        </Tooltip>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card 
          title="NODE_DIAGNOSTICS" 
          variant="real" 
          onProbe={() => onProbeClick('NODE_DIAGNOSTICS', stats)}
          onBrain={() => onBrainClick('node_diag_panel', 'Environment Audit', stats)}
          isProcessing={processingId === 'NODE_DIAGNOSTICS'}
        >
          <div className="space-y-4 font-mono text-[11px]">
             <div className="flex justify-between border-b border-zinc-900 pb-2"><span className="text-zinc-600">HOSTNAME</span><span className="text-teal-500 uppercase font-black">{stats?.system?.hostname || 'SENTINEL_NULL'}</span></div>
             <div className="flex justify-between border-b border-zinc-900 pb-2"><span className="text-zinc-600">OS_KERNEL</span><span className="text-zinc-400">{stats?.system?.osName || 'Kali Linux'}</span></div>
             <div className="flex justify-between border-b border-zinc-900 pb-2"><span className="text-zinc-600">THROTTLING</span><span className={stats?.sensors?.throttled && stats?.sensors?.throttled !== '0x0' ? 'text-red-500 animate-pulse font-black' : 'text-green-500'}>{stats?.sensors?.throttled || '0x0'}</span></div>
             <div className="flex justify-between"><span className="text-zinc-600">CORES_FREQ</span><span className="text-zinc-400">{stats?.cpu?.cores || 4}x @ {stats?.cpu?.freqCurrent || '—'}MHz</span></div>
          </div>
        </Card>
        <Card 
          title="TOP_PROCESSES" 
          variant="purple" 
          onProbe={() => onProbeClick('PROCESS_AUDIT', stats?.processes)}
          onBrain={() => onBrainClick('process_audit_panel', 'Process Audit', stats?.processes)}
          isProcessing={processingId === 'PROCESS_AUDIT'}
        >
          <div className="space-y-2 max-h-48 overflow-y-auto no-scroll">
            {stats?.processes?.topByCpu?.slice(0, 6).map((p: any, i: number) => (
              <div key={i} className="flex justify-between items-center text-[10px] font-mono border-b border-zinc-900/40 py-1.5 hover:bg-white/5 transition-colors group">
                <div className="flex gap-4"><span className="text-zinc-700 w-8">{p.pid}</span><span className="text-zinc-300 truncate w-32 uppercase group-hover:text-white transition-colors">{p.name}</span></div>
                <div className="flex gap-4"><span className="text-zinc-600 uppercase text-[8px]">CPU:</span><span className="text-teal-500 w-12 text-right font-black">{p.cpu_percent}%</span></div>
              </div>
            )) || <div className="text-center py-10 text-zinc-800 uppercase tracking-widest text-[9px]">Awaiting tactical data...</div>}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PiStatsView;
