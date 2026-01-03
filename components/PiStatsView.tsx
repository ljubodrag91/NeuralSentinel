
import React from 'react';
import { PiStats, OperationalMode, Timeframe, AppSettings } from '../types';
import Card from './common/Card';
import Tooltip from './common/Tooltip';
import { launcherSystem } from '../services/launcherService';

interface PiStatsViewProps {
  stats: PiStats | null;
  mode: OperationalMode;
  timeframe: Timeframe;
  settings: AppSettings;
  onProbeClick: (panel: string, metrics: any) => void;
  onProbeInfo: (title: string, payload: any) => void;
  onBrainClick: (id: string, type: string, metrics: any) => void;
  onLauncherSelect: (id: string, type: 'core' | 'neural') => void;
  processingId?: string;
  activeTelemetry: Set<string>;
  setActiveTelemetry: (s: Set<string>) => void;
}

const PiStatsView: React.FC<PiStatsViewProps> = ({ stats, mode, timeframe, settings, onProbeClick, onProbeInfo, onBrainClick, onLauncherSelect, processingId, activeTelemetry, setActiveTelemetry }) => {

  const toggleMetric = (id: string) => {
    const next = new Set(activeTelemetry);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setActiveTelemetry(next);
  };

  const safe = (val: number | undefined, precision: number = 1, unit: string = '') => {
    if (val === undefined || val === null || (mode === OperationalMode.REAL && !stats)) return '—';
    return val.toFixed(precision) + unit;
  };

  const isDataActive = mode === OperationalMode.SIMULATED || (mode === OperationalMode.REAL && stats);
  const sourceState = !isDataActive && mode === OperationalMode.REAL ? 'OFFLINE' : mode as string;

  const getLauncherColor = (panelId: string) => {
    const id = settings.probeLaunchers[panelId];
    return launcherSystem.getById(id)?.color || '#bd00ff';
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20 no-scroll h-full overflow-y-auto pr-4">
      {/* Primary Telemetry Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
        {/* CPU */}
        <Tooltip name="CPU_MATRIX" source={sourceState} desc="Click to HIGHLIGHT for SCANNING context. Right-click for NEURAL tooltip probe." className="h-full">
          <div 
            onClick={() => toggleMetric('cpu')}
            onContextMenu={(e) => { e.preventDefault(); onBrainClick('CPU_CARD', 'Telemetry Card', stats?.cpu); }}
            className={`cursor-pointer border p-5 flex flex-col gap-3 transition-all group h-full ${
              activeTelemetry.has('cpu') ? 'bg-zinc-900/80 border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.1)]' : 'bg-black border-zinc-900 hover:border-zinc-800'
            }`}
          >
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-black text-zinc-700 uppercase tracking-widest group-hover:text-zinc-500">CPU_MATRIX</span>
              <div className={`w-1.5 h-1.5 rounded-full ${activeTelemetry.has('cpu') ? 'bg-purple-500 glow-purple' : 'bg-zinc-900'}`}></div>
            </div>
            <div className="flex flex-col flex-1 justify-center">
              <div className="flex items-baseline gap-4">
                <span className={`text-2xl font-black ${isDataActive ? 'text-zinc-200' : 'text-zinc-900'}`}>{safe(stats?.cpu?.usage, 1, '%')}</span>
                <span className={`text-md font-bold ${isDataActive ? 'text-zinc-500' : 'text-zinc-950'}`}>{safe(stats?.cpu?.temp, 1, '°C')}</span>
              </div>
            </div>
          </div>
        </Tooltip>

        {/* RAM */}
        <Tooltip name="MEMORY_POOL" source={sourceState} desc="Click to HIGHLIGHT for SCANNING context. Right-click for NEURAL tooltip probe." className="h-full">
          <div 
            onClick={() => toggleMetric('ram')}
            onContextMenu={(e) => { e.preventDefault(); onBrainClick('RAM_CARD', 'Telemetry Card', stats?.memory); }}
            className={`cursor-pointer border p-5 flex flex-col gap-3 transition-all group h-full ${
              activeTelemetry.has('ram') ? 'bg-zinc-900/80 border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.1)]' : 'bg-black border-zinc-900 hover:border-zinc-800'
            }`}
          >
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-black text-zinc-700 uppercase tracking-widest group-hover:text-zinc-500">MEMORY_POOL</span>
              <div className={`w-1.5 h-1.5 rounded-full ${activeTelemetry.has('ram') ? 'bg-purple-500 glow-purple' : 'bg-zinc-900'}`}></div>
            </div>
            <div className="flex flex-col flex-1 justify-center">
              <div className="flex items-baseline gap-4">
                <span className={`text-2xl font-black ${isDataActive ? 'text-zinc-200' : 'text-zinc-900'}`}>{safe(stats?.memory?.usage, 1, '%')}</span>
                <span className={`text-md font-bold ${isDataActive ? 'text-zinc-500' : 'text-zinc-950'}`}>{safe(stats?.memory?.used, 2, 'G')}</span>
              </div>
            </div>
          </div>
        </Tooltip>

        {/* DISK */}
        <Tooltip name="DISK_VOLUMES" source={sourceState} desc="Click to HIGHLIGHT for SCANNING context. Right-click for NEURAL tooltip probe." className="h-full">
          <div 
            onClick={() => toggleMetric('disk')}
            onContextMenu={(e) => { e.preventDefault(); onBrainClick('DISK_CARD', 'Telemetry Card', stats?.disk); }}
            className={`cursor-pointer border p-5 flex flex-col gap-3 transition-all group h-full ${
              activeTelemetry.has('disk') ? 'bg-zinc-900/80 border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.1)]' : 'bg-black border-zinc-900 hover:border-zinc-800'
            }`}
          >
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-black text-zinc-700 uppercase tracking-widest group-hover:text-zinc-500">DISK_VOLUMES</span>
              <div className={`w-1.5 h-1.5 rounded-full ${activeTelemetry.has('disk') ? 'bg-purple-500 glow-purple' : 'bg-zinc-900'}`}></div>
            </div>
            <div className="flex flex-col flex-1 justify-center">
              <div className="flex items-baseline gap-4">
                <span className={`text-2xl font-black ${isDataActive ? 'text-zinc-200' : 'text-zinc-900'}`}>{safe(stats?.disk?.rootUsage, 1, '%')}</span>
              </div>
            </div>
          </div>
        </Tooltip>

        {/* NETWORK */}
        <Tooltip name="IO_LINK" source={sourceState} desc="Click to HIGHLIGHT for SCANNING context. Right-click for NEURAL tooltip probe." className="h-full">
          <div 
            onClick={() => toggleMetric('net')}
            onContextMenu={(e) => { e.preventDefault(); onBrainClick('NET_CARD', 'Telemetry Card', stats?.network); }}
            className={`cursor-pointer border p-5 flex flex-col gap-3 transition-all group h-full ${
              activeTelemetry.has('net') ? 'bg-zinc-900/80 border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.1)]' : 'bg-black border-zinc-900 hover:border-zinc-800'
            }`}
          >
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-black text-zinc-700 uppercase tracking-widest group-hover:text-zinc-500">IO_LINK</span>
              <div className={`w-1.5 h-1.5 rounded-full ${activeTelemetry.has('net') ? 'bg-purple-500 glow-purple' : 'bg-zinc-900'}`}></div>
            </div>
            <div className="flex flex-col flex-1 justify-center">
              <div className="flex items-baseline gap-4">
                <span className={`text-2xl font-black ${isDataActive ? 'text-zinc-200' : 'text-zinc-900'}`}>RX {safe(stats?.network?.inRate, 1, 'K')}</span>
              </div>
            </div>
          </div>
        </Tooltip>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card 
          id="NODE_DIAGNOSTICS"
          title="NODE_DIAGNOSTICS" 
          variant="real" 
          probeColor={getLauncherColor('NODE_DIAGNOSTICS')}
          onProbe={() => onProbeClick('NODE_DIAGNOSTICS', stats)} 
          onProbeInfo={() => onProbeInfo('NODE_DIAGNOSTICS', stats)}
          onBrain={() => onBrainClick('node_diag_panel', 'Environment Audit', stats)} 
          onLauncherSelect={(type) => onLauncherSelect('NODE_DIAGNOSTICS', type)}
          isProcessing={processingId === 'NODE_DIAGNOSTICS'}
        >
          <div className="space-y-4 font-mono text-[11px]">
             <div className="flex justify-between border-b border-zinc-900 pb-2"><span className="text-zinc-600 uppercase">Hostname</span><span className="text-teal-500 uppercase font-black">{stats?.system?.hostname || 'SENTINEL_NULL'}</span></div>
             <div className="flex justify-between border-b border-zinc-900 pb-2"><span className="text-zinc-600 uppercase">OS_Kernel</span><span className="text-zinc-400">{stats?.system?.osName || 'Kali Linux'}</span></div>
          </div>
        </Card>
        <Card 
          id="PROCESS_AUDIT"
          title="TOP_PROCESSES" 
          variant="purple" 
          probeColor={getLauncherColor('PROCESS_AUDIT')}
          onProbe={() => onProbeClick('PROCESS_AUDIT', stats?.processes)} 
          onProbeInfo={() => onProbeInfo('PROCESS_AUDIT', stats?.processes)}
          onBrain={() => onBrainClick('process_audit_panel', 'Process Audit', stats?.processes)} 
          onLauncherSelect={(type) => onLauncherSelect('PROCESS_AUDIT', type)}
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
