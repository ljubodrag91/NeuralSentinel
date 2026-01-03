
import React, { useState, useEffect } from 'react';
import { CoreStats, OperationalMode, Timeframe, AppSettings, Platform } from '../types';
import Card from './common/Card';
import Tooltip from './common/Tooltip';
import { launcherSystem } from '../services/launcherService';
import Modal from './common/Modal';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

interface CoreStatsViewProps {
  stats: CoreStats | null;
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

const CoreStatsView: React.FC<CoreStatsViewProps> = ({ stats, mode, settings, onProbeClick, onProbeInfo, onBrainClick, onLauncherSelect, processingId, activeTelemetry, setActiveTelemetry }) => {
  const [showInfo, setShowInfo] = useState(false);
  const [tempHistory, setTempHistory] = useState<{time: string, temp: number}[]>([]);

  useEffect(() => {
    if (stats?.sensors?.cpu_thermal_temp1) {
      setTempHistory(prev => {
        const next = [...prev, { time: new Date().toLocaleTimeString(), temp: stats.sensors.cpu_thermal_temp1 }];
        return next.slice(-20); // Keep last 20 points
      });
    }
  }, [stats]);

  const toggleMetric = (id: string) => {
    const next = new Set(activeTelemetry);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setActiveTelemetry(next);
  };

  const safe = (val: number | undefined, precision: number = 1, unit: string = '') => {
    if (val === undefined || val === null) return '—';
    return val.toFixed(precision) + unit;
  };

  const isDataActive = mode === OperationalMode.REAL && !!stats;
  const sourceState = isDataActive ? 'REAL' : 'OFFLINE';

  const getLauncherColor = (panelId: string) => {
    const id = settings.probeLaunchers[panelId];
    return launcherSystem.getById(id)?.color || '#bd00ff';
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20 no-scroll h-full overflow-y-auto pr-4">
      <div className="flex justify-between items-center px-4">
        <div className="text-[10px] font-black text-zinc-700 uppercase tracking-widest">{settings.platform}_CORE_METRICS</div>
        <button 
          onClick={() => setShowInfo(true)}
          className="text-[9px] font-black border border-zinc-900 bg-black/40 px-3 py-1.5 text-zinc-500 hover:text-white hover:border-zinc-500 transition-all uppercase tracking-widest"
        >
          Source_Intel
        </button>
      </div>

      {/* Primary Telemetry Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
        {/* CPU */}
        <Tooltip name="CPU_MATRIX" source={sourceState} desc="Click to HIGHLIGHT. Right-click for NEURAL probe." className="h-full">
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
                <span className={`text-md font-bold ${stats?.cpu?.temperature && stats.cpu.temperature > 70 ? 'text-red-500' : (isDataActive ? 'text-zinc-500' : 'text-zinc-950')}`}>{safe(stats?.cpu?.temperature, 1, '°C')}</span>
              </div>
              <div className="text-[9px] text-zinc-600 mt-2 font-mono flex justify-between">
                 <span>Load: {safe(stats?.cpu?.cpuLoad1, 2)} / {safe(stats?.cpu?.cpuLoad5, 2)}</span>
                 <span>Cores: {stats?.cpu?.cpuCores || '-'}</span>
              </div>
            </div>
          </div>
        </Tooltip>

        {/* RAM */}
        <Tooltip name="MEMORY_POOL" source={sourceState} desc="Click to HIGHLIGHT. Right-click for NEURAL probe." className="h-full">
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
                <span className={`text-md font-bold ${isDataActive ? 'text-zinc-500' : 'text-zinc-950'}`}>{safe(stats?.memory?.ramUsed, 2, 'G')}</span>
              </div>
              <div className="text-[9px] text-zinc-600 mt-2 font-mono flex justify-between">
                 <span>Total: {safe(stats?.memory?.ramTotal, 1, 'G')}</span>
                 <span>Swap: {safe(stats?.memory?.swapPercent, 0, '%')}</span>
              </div>
            </div>
          </div>
        </Tooltip>

        {/* DISK */}
        <Tooltip name="DISK_VOLUMES" source={sourceState} desc="Click to HIGHLIGHT. Right-click for NEURAL probe." className="h-full">
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
              <div className="text-[9px] text-zinc-600 mt-2 font-mono flex justify-between">
                 <span>R: {safe(stats?.disk?.readRateKB, 0, 'KB/s')}</span>
                 <span>W: {safe(stats?.disk?.writeRateKB, 0, 'KB/s')}</span>
              </div>
            </div>
          </div>
        </Tooltip>

        {/* NETWORK */}
        <Tooltip name="IO_LINK" source={sourceState} desc="Click to HIGHLIGHT. Right-click for NEURAL probe." className="h-full">
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
                <span className={`text-2xl font-black ${isDataActive ? 'text-zinc-200' : 'text-zinc-900'}`}>RX {safe(stats?.network?.inRateKB, 1, 'KB')}</span>
              </div>
              <div className="text-[9px] text-zinc-600 mt-2 font-mono flex justify-between">
                 <span>TX: {safe(stats?.network?.outRateKB, 1, 'KB')}</span>
                 <span>Pkts: {stats?.network?.packetsRecv || 0}</span>
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
             <div className="flex justify-between border-b border-zinc-900 pb-2"><span className="text-zinc-600 uppercase">{settings.platform === Platform.WINDOWS ? 'OS_Version' : 'OS_Kernel'}</span><span className="text-zinc-400">{stats?.system?.osName || 'Unknown'}</span></div>
             <div className="flex justify-between border-b border-zinc-900 pb-2"><span className="text-zinc-600 uppercase">Uptime</span><span className="text-zinc-400">{stats?.system?.uptime ? (stats.system.uptime / 3600).toFixed(1) + 'h' : '—'}</span></div>
             
             {/* Partitions List */}
             {stats?.disk?.partitions && (
               <div className="mt-4">
                 <h4 className="text-[9px] font-black text-zinc-700 uppercase mb-2">Partition_Matrix</h4>
                 <div className="space-y-1">
                   {stats.disk.partitions.map((p, i) => (
                     <div key={i} className="flex justify-between text-[10px] text-zinc-500 hover:text-zinc-300">
                        <span className="w-20 truncate">{p.mountpoint}</span>
                        <span className="w-20 truncate text-zinc-700">{p.fstype}</span>
                        <span className={p.percent > 90 ? 'text-red-500 font-bold' : 'text-zinc-400'}>{p.percent}%</span>
                     </div>
                   ))}
                 </div>
               </div>
             )}

             {/* Temp Graph */}
             {tempHistory.length > 0 && (
                <div className="h-24 mt-4 border border-zinc-900/50 bg-black/20">
                   <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={tempHistory}>
                         <XAxis dataKey="time" hide />
                         <YAxis domain={['auto', 'auto']} hide />
                         <Area type="monotone" dataKey="temp" stroke="#f87171" fill="#f87171" fillOpacity={0.1} strokeWidth={1} isAnimationActive={false} />
                      </AreaChart>
                   </ResponsiveContainer>
                </div>
             )}
          </div>
        </Card>
        
        <Card 
          id="PROCESS_PROBE"
          title="TOP_PROCESSES" 
          variant="purple" 
          probeColor={getLauncherColor('PROCESS_PROBE')}
          onProbe={() => onProbeClick('PROCESS_PROBE', stats?.processes)} 
          onProbeInfo={() => onProbeInfo('PROCESS_PROBE', stats?.processes)}
          onBrain={() => onBrainClick('process_audit_panel', 'Process Probe', stats?.processes)} 
          onLauncherSelect={(type) => onLauncherSelect('PROCESS_PROBE', type)}
          isProcessing={processingId === 'PROCESS_PROBE'}
        >
          <div className="space-y-2 max-h-64 overflow-y-auto no-scroll">
            {stats?.processes?.topByCpu?.slice(0, 8).map((p: any, i: number) => (
              <div key={i} className="flex justify-between items-center text-[10px] font-mono border-b border-zinc-900/40 py-1.5 hover:bg-white/5 transition-colors group">
                <div className="flex gap-4"><span className="text-zinc-700 w-10">{p.pid}</span><span className="text-zinc-300 truncate w-24 uppercase group-hover:text-white transition-colors">{p.name}</span></div>
                <div className="flex gap-4">
                  <span className="text-zinc-600 uppercase text-[8px]">MEM:</span><span className="text-purple-400 w-8 text-right">{p.memory_percent ? p.memory_percent.toFixed(1) : 0}%</span>
                  <span className="text-zinc-600 uppercase text-[8px]">CPU:</span><span className="text-teal-500 w-10 text-right font-black">{p.cpu_percent ? p.cpu_percent.toFixed(1) : 0}%</span>
                </div>
              </div>
            )) || <div className="text-center py-10 text-zinc-800 uppercase tracking-widest text-[9px]">Awaiting tactical data...</div>}
          </div>
        </Card>
      </div>

      <Modal isOpen={showInfo} onClose={() => setShowInfo(false)} title="SYSTEM_METRICS_SOURCE_INTEL" variant="blue">
        <div className="space-y-6">
          <section className="space-y-2">
            <h4 className="text-teal-500 font-black uppercase text-[12px]">Metrics Origin: {stats?.system?.hostname || 'UNKNOWN'}</h4>
            <p className="text-zinc-400 text-[11px] leading-relaxed">
              Consolidated telemetry feed via Sentinel Port 5050. Data is normalized from {settings.platform} specific counters.
            </p>
          </section>
          
          {stats?.network?.interfaces && (
             <section className="space-y-2">
               <h4 className="text-teal-500 font-black uppercase text-[12px]">Interface_Map</h4>
               <div className="grid grid-cols-1 gap-2">
                 {Object.entries(stats.network.interfaces).map(([name, inf]: [string, any]) => (
                   <div key={name} className="flex justify-between items-center bg-zinc-950 p-2 border border-zinc-900">
                      <span className="text-zinc-300 font-black text-[10px]">{name}</span>
                      <div className="flex gap-2">
                        {(inf.ipv4 || []).map((ip: string) => <span key={ip} className="text-zinc-500 font-mono text-[9px]">{ip}</span>)}
                      </div>
                      <span className={`text-[8px] uppercase ${inf.isUp ? 'text-green-500' : 'text-red-500'}`}>{inf.isUp ? 'UP' : 'DOWN'}</span>
                   </div>
                 ))}
               </div>
             </section>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default CoreStatsView;
