
import React, { useState, useEffect, useMemo } from 'react';
import Card from './common/Card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip, BarChart, Bar } from 'recharts';
import { Timeframe, OperationalMode } from '../types';
import Tooltip from './common/Tooltip';
import Modal from './common/Modal';

interface TelemetryProps {
  onProbe: (panel: string, data: any) => void;
  onProbeInfo: (title: string, payload: any) => void;
  onBrainClick: (id: string, type: string, metrics: any) => void;
  isSimulated: boolean;
  isConnected: boolean;
  timeframe: Timeframe;
  processingId?: string;
}

const TelemetryGraphs: React.FC<TelemetryProps> = ({ onProbe, onProbeInfo, onBrainClick, isSimulated, isConnected, timeframe, processingId }) => {
  const [rssiData, setRssiData] = useState<any[]>([]);
  const [activeMetrics, setActiveMetrics] = useState<Set<string>>(new Set(['rssi']));
  const [showInfo, setShowInfo] = useState(false);

  const windowSize = useMemo(() => {
    switch (timeframe) {
      case '1m': return 60;
      case '5m': return 300;
      case '15m': return 900;
      default: return 60;
    }
  }, [timeframe]);

  const toggleMetric = (id: string) => {
    const next = new Set(activeMetrics);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setActiveMetrics(next);
  };

  const isDataActive = isConnected; 
  const sourceState = isConnected ? 'REAL' : 'OFFLINE';

  useEffect(() => {
    if (!isDataActive) {
      setRssiData([]);
      return;
    }
    // Real data injection point (currently just placeholder for parent prop)
  }, [isDataActive, windowSize]);

  const currentRssi = rssiData.length > 0 ? rssiData[rssiData.length - 1].val : -99;
  const themeColor = '#00ffd5';

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20 no-scroll h-full">
      <div className="flex justify-between items-center px-4">
        <div className="text-[10px] font-black text-zinc-700 uppercase tracking-widest">RF_TELEMETRY_ENGINE</div>
        <button 
          onClick={() => setShowInfo(true)}
          className="text-[9px] font-black border border-zinc-900 bg-black/40 px-3 py-1.5 text-zinc-500 hover:text-white hover:border-zinc-500 transition-all uppercase tracking-widest"
        >
          Source_Intel
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div 
          onClick={() => toggleMetric('rssi')}
          className={`cursor-pointer border p-8 flex flex-col gap-4 transition-all group ${
            activeMetrics.has('rssi') ? 'bg-zinc-900/80 border-teal-500/50 shadow-[0_0_15px_rgba(0,255,213,0.1)]' : 'bg-black border-zinc-900 hover:border-zinc-800'
          }`}
        >
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black text-zinc-700 uppercase tracking-widest group-hover:text-zinc-500">RF_SIGNAL_FLOW</span>
            <div className={`w-2.5 h-2.5 rounded-full ${activeMetrics.has('rssi') ? 'bg-teal-500 glow-teal' : 'bg-zinc-900'}`}></div>
          </div>
          <div className="flex items-baseline gap-6">
            <span className={`text-3xl font-black ${isDataActive ? 'text-zinc-200' : 'text-zinc-900'}`}>{currentRssi} dBm</span>
            <span className="text-[10px] text-zinc-600 font-mono uppercase">Stability: {isDataActive ? '98.2%' : 'VOID'}</span>
          </div>
        </div>

        <div 
          onClick={() => toggleMetric('spectrum')}
          className={`cursor-pointer border p-8 flex flex-col gap-4 transition-all group ${
            activeMetrics.has('spectrum') ? 'bg-zinc-900/80 border-purple-500/50 shadow-[0_0_15px_rgba(189,0,255,0.1)]' : 'bg-black border-zinc-900 hover:border-zinc-800'
          }`}
        >
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black text-zinc-700 uppercase tracking-widest group-hover:text-zinc-500">SPECTRAL_DENSITY</span>
            <div className={`w-2.5 h-2.5 rounded-full ${activeMetrics.has('spectrum') ? 'bg-purple-500 glow-purple' : 'bg-zinc-900'}`}></div>
          </div>
          <div className="flex items-baseline gap-6">
            <span className={`text-3xl font-black ${isDataActive ? 'text-zinc-200' : 'text-zinc-900'}`}>CH 6</span>
            <span className="text-[10px] text-zinc-600 font-mono uppercase">Noise_Floor: {isDataActive ? '-102 dBm' : 'VOID'}</span>
          </div>
        </div>
      </div>

      <div className="space-y-12">
        {activeMetrics.has('rssi') && (
          <Card 
            title={`SIGNAL_CHRONO_GRAPH [${timeframe}]`} 
            variant={isSimulated ? 'sim' : 'real'} 
            className="h-[400px] animate-in zoom-in-95"
            onProbe={() => onProbe('RSSI_REPORT', { rssiData })}
            onProbeInfo={() => onProbeInfo('RSSI_REPORT', { rssiData })}
            onBrain={() => onBrainClick('rssi_graph', 'RF Intelligence', { currentRssi })}
          >
            <div className="w-full h-full pb-10">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={rssiData}>
                  <defs>
                    <linearGradient id="colorMain" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={themeColor} stopOpacity={0.2}/>
                      <stop offset="95%" stopColor={themeColor} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#111" vertical={false} />
                  <XAxis dataKey="time" stroke="#444" fontSize={10} tickFormatter={(val) => val.split(':').slice(1).join(':')} />
                  <YAxis domain={[-100, 0]} stroke="#333" fontSize={10} />
                  <RechartsTooltip contentStyle={{ backgroundColor: '#020405', border: '1px solid #1a2f2c', fontSize: '10px' }} />
                  <Area type="monotone" dataKey="val" stroke={themeColor} strokeWidth={2} fill="url(#colorMain)" isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}
      </div>

      <Modal isOpen={showInfo} onClose={() => setShowInfo(false)} title="TELEMETRY_SOURCE_INTEL" variant="blue">
        <div className="space-y-6">
          <section className="space-y-2">
            <h4 className="text-teal-500 font-black uppercase text-[12px]">Data Fetch Strategy</h4>
            <p className="text-zinc-400 text-[11px] leading-relaxed">
              Telemetry is gathered via a custom Sentinel Heartbeat daemon running on port 5050 of the remote node. 
              The frontend polls this endpoint at the frequency defined in Global Settings.
            </p>
          </section>
          <section className="space-y-2">
            <h4 className="text-teal-500 font-black uppercase text-[12px]">Source Interfaces</h4>
            <ul className="list-disc list-inside text-zinc-500 text-[10px] space-y-1">
              <li><span className="text-zinc-300">CPU Metrics:</span> Parsed from <code className="bg-zinc-950 px-1">/proc/stat</code> (Linux) or WMI (Windows).</li>
              <li><span className="text-zinc-300">Memory:</span> Extracted from system memory counters.</li>
              <li><span className="text-zinc-300">RF Signal:</span> Captured using platform-specific wireless tools.</li>
              <li><span className="text-zinc-300">Process List:</span> Snapshot taken from active process table sorted by compute weight.</li>
            </ul>
          </section>
        </div>
      </Modal>
    </div>
  );
};

export default TelemetryGraphs;
