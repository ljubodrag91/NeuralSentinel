
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
  const [activeMetrics, setActiveMetrics] = useState<Set<string>>(new Set(['cpu']));

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
    <div className="space-y-10 animate-in fade-in duration-700 pb-20 no-scroll h-full overflow-y-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* CPU TOGGLE */}
        <div 
          onClick={() => toggleMetric('cpu')}
          className={`cursor-pointer border p-6 flex flex-col gap-4 transition-all group ${
            activeMetrics.has('cpu') ? 'bg-zinc-900/80 border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.1)]' : 'bg-black border-zinc-900 hover:border-zinc-800'
          }`}
        >
          <div className="flex justify-between items-center">
            <Tooltip name="CPU_MATRIX_LABEL" source={sourceState} desc="Overview of core computational throughput and thermal safety.">
              <span className="text-[10px] font-black text-zinc-700 uppercase tracking-widest group-hover:text-zinc-500 transition-colors">CPU_MATRIX</span>
            </Tooltip>
            <div className={`w-2 h-2 rounded-full ${activeMetrics.has('cpu') ? 'bg-green-500 glow-green' : 'bg-zinc-900'}`}></div>
          </div>
          <div className="flex items-baseline gap-6">
            <Tooltip name="CPU_LOAD" unit="Percentage (%)" source={sourceState} rate="3000ms" desc="Current processor cycle saturation.">
              <span className={`text-3xl font-black ${isDataActive ? 'text-zinc-200' : 'text-zinc-900'}`}>{safe(stats?.cpu?.usage, 1, '%')}</span>
            </Tooltip>
            <Tooltip name="CORE_TEMP" unit="Celsius (°C)" source={sourceState} rate="3000ms" desc="Measured die temperature.">
              <span className={`text-xl font-bold ${isDataActive ? 'text-zinc-500' : 'text-zinc-950'}`}>{safe(stats?.cpu?.temp, 1, '°C')}</span>
            </Tooltip>
          </div>
          <div className="text-[9px] text-zinc-800 font-mono tracking-tighter uppercase">Load_Avg: {stats?.cpu?.load?.join(' / ') || '—'}</div>
        </div>

        {/* RAM TOGGLE */}
        <div 
          onClick={() => toggleMetric('ram')}
          className={`cursor-pointer border p-6 flex flex-col gap-4 transition-all group ${
            activeMetrics.has('ram') ? 'bg-zinc-900/80 border-blue-500/50 shadow-[0_0_15px_rgba(0,242,255,0.1)]' : 'bg-black border-zinc-900 hover:border-zinc-800'
          }`}
        >
          <div className="flex justify-between items-center">
            <Tooltip name="MEMORY_POOL_LABEL" source={sourceState} desc="Monitoring of physical RAM usage.">
              <span className="text-[10px] font-black text-zinc-700 uppercase tracking-widest group-hover:text-zinc-500 transition-colors">MEMORY_POOL</span>
            </Tooltip>
            <div className={`w-2 h-2 rounded-full ${activeMetrics.has('ram') ? 'bg-blue-500 glow-blue' : 'bg-zinc-900'}`}></div>
          </div>
          <div className="flex items-baseline gap-6">
            <Tooltip name="RAM_ALLOC" unit="Gigabytes (GB)" source={sourceState} rate="3000ms" desc="Total volatile memory currently mapped.">
              <span className={`text-3xl font-black ${isDataActive ? 'text-zinc-200' : 'text-zinc-900'}`}>{safe(stats?.memory?.used, 2, 'G')}</span>
            </Tooltip>
            <Tooltip name="RAM_SATURATION" unit="Percentage (%)" source={sourceState} rate="3000ms" desc="Memory saturation ratio.">
              <span className={`text-xl font-bold ${isDataActive ? 'text-zinc-500' : 'text-zinc-950'}`}>{safe(stats?.memory?.usage, 1, '%')}</span>
            </Tooltip>
          </div>
          <div className="text-[9px] text-zinc-800 font-mono tracking-tighter uppercase">Total: {safe(stats?.memory?.total, 1, ' GB')}</div>
        </div>

        {/* NET TOGGLE */}
        <div 
          onClick={() => toggleMetric('net')}
          className={`cursor-pointer border p-6 flex flex-col gap-4 transition-all group ${
            activeMetrics.has('net') ? 'bg-zinc-900/80 border-purple-500/50 shadow-[0_0_15px_rgba(189,0,255,0.1)]' : 'bg-black border-zinc-900 hover:border-zinc-800'
          }`}
        >
          <div className="flex justify-between items-center">
            <Tooltip name="IO_ADAPTER_LABEL" source={sourceState} desc="Real-time network traffic volume.">
              <span className="text-[10px] font-black text-zinc-700 uppercase tracking-widest group-hover:text-zinc-500 transition-colors">IO_ADAPTER</span>
            </Tooltip>
            <div className={`w-2 h-2 rounded-full ${activeMetrics.has('net') ? 'bg-purple-500 glow-purple' : 'bg-zinc-900'}`}></div>
          </div>
          <div className="flex items-baseline gap-6">
            <Tooltip name="NET_RX" unit="Kilobytes (KB/s)" source={sourceState} rate="3000ms" desc="Ingress packet flow.">
              <span className={`text-3xl font-black ${isDataActive ? 'text-zinc-200' : 'text-zinc-900'}`}>RX {stats?.network?.interfaces?.wlan0?.rx || 0}K</span>
            </Tooltip>
            <Tooltip name="NET_TX" unit="Kilobytes (KB/s)" source={sourceState} rate="3000ms" desc="Egress packet flow.">
              <span className={`text-xl font-bold ${isDataActive ? 'text-zinc-500' : 'text-zinc-950'}`}>TX {stats?.network?.interfaces?.wlan0?.tx || 0}K</span>
            </Tooltip>
          </div>
          <div className="text-[9px] text-zinc-800 font-mono tracking-tighter uppercase">Interface: wlan0_Active</div>
        </div>
      </div>

      <div className="space-y-12">
        {activeMetrics.has('cpu') && (
          <Card 
            title={`CPU_DETAILED_DIAGNOSTIC [${timeframe}]`} 
            variant={mode === OperationalMode.REAL ? 'real' : 'sim'}
            onProbe={() => onProbeClick('CPU_CORE', stats?.cpu)}
            onBrain={() => onBrainClick('cpu_panel', 'Core Processor', stats?.cpu)}
            isProcessing={processingId === 'CPU_CORE' || processingId === 'cpu_panel'}
            className="animate-in slide-in-from-top-4"
          >
            <div className="grid grid-cols-2 gap-8 py-4">
              <div className="p-4 bg-zinc-950/50 border border-zinc-900">
                <Tooltip name="UTILIZATION_FLOW_LABEL" source={sourceState} desc="Visual representation of compute resource allocation.">
                  <span className="text-[9px] text-zinc-700 uppercase block mb-3 font-black">Utilization_Flow</span>
                </Tooltip>
                <div className="h-2.5 bg-zinc-900 rounded-sm overflow-hidden border border-zinc-800">
                   <div className="h-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)] transition-all duration-1000" style={{ width: `${stats?.cpu?.usage || 0}%` }}></div>
                </div>
              </div>
              <div className="p-4 bg-zinc-950/50 border border-zinc-900">
                <Tooltip name="THERMAL_ENVELOPE_LABEL" source={sourceState} desc="Monitoring core die heat against safety thresholds.">
                  <span className="text-[9px] text-zinc-700 uppercase block mb-3 font-black">Thermal_Envelope</span>
                </Tooltip>
                <div className="h-2.5 bg-zinc-900 rounded-sm overflow-hidden border border-zinc-800">
                   <div className="h-full bg-red-600 shadow-[0_0_10px_rgba(255,62,62,0.3)] transition-all duration-1000" style={{ width: `${Math.min(100, (stats?.cpu?.temp || 0))}%` }}></div>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PiStatsView;
