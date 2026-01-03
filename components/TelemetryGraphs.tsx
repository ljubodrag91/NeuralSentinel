
import React, { useState, useEffect, useMemo } from 'react';
import Card from './common/Card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip, BarChart, Bar } from 'recharts';
import { Timeframe } from '../types';
import Tooltip from './common/Tooltip';

interface TelemetryProps {
  onProbe: (panel: string, data: any) => void;
  onBrainClick: (id: string, type: string, metrics: any) => void;
  isSimulated: boolean;
  isConnected: boolean;
  timeframe: Timeframe;
  processingId?: string;
}

const TelemetryGraphs: React.FC<TelemetryProps> = ({ onProbe, onBrainClick, isSimulated, isConnected, timeframe, processingId }) => {
  const [rssiData, setRssiData] = useState<any[]>([]);
  const [activeMetrics, setActiveMetrics] = useState<Set<string>>(new Set(['rssi']));

  const windowSize = useMemo(() => {
    switch (timeframe) {
      case '1m': return 60;
      case '5m': return 300;
      case '15m': return 900;
      case '30m': return 1800;
      case '1h': return 3600;
      case '6h': return 21600;
      default: return 60;
    }
  }, [timeframe]);

  const toggleMetric = (id: string) => {
    const next = new Set(activeMetrics);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setActiveMetrics(next);
  };

  const isDataActive = isSimulated || isConnected;
  const sourceState = !isDataActive && !isSimulated ? 'OFFLINE' : (isSimulated ? 'SIMULATED' : 'REAL');

  useEffect(() => {
    if (!isDataActive) {
      setRssiData([]);
      return;
    }

    const interval = setInterval(() => {
      setRssiData(prev => {
        const val = Math.floor(Math.random() * -30 - 45);
        const entry = { time: new Date().toLocaleTimeString(), val };
        return [...prev, entry].slice(-windowSize);
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isDataActive, windowSize]);

  const currentRssi = rssiData.length > 0 ? rssiData[rssiData.length - 1].val : -99;
  const themeColor = isSimulated ? '#0088ff' : '#00ffd5';

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20 no-scroll h-full">
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
            <Tooltip name="SIGNAL_INTEGRITY" unit="Decibels (dBm)" source={sourceState} rate="1000ms" desc="Relative Signal Strength Indicator. Decibel-milliwatts scale.">
              <span className={`text-3xl font-black ${isDataActive ? 'text-zinc-200' : 'text-zinc-900'}`}>{currentRssi} dBm</span>
            </Tooltip>
            <Tooltip name="LINK_STABILITY" unit="Percentage (%)" source={sourceState} rate="1000ms" desc="Measured consistency of the carrier wave.">
              <span className="text-[10px] text-zinc-600 font-mono uppercase">Stability: {isDataActive ? '98.2%' : 'VOID'}</span>
            </Tooltip>
          </div>
          <div className="text-[9px] text-zinc-800 font-mono tracking-tighter uppercase">Carrier: 2.4GHz_Node_Active</div>
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
            <Tooltip name="PEAK_CHANNEL" unit="Frequency Band" source={sourceState} rate="Static" desc="Displays spectrum analysis of neural signals over time. Useful for detecting anomalies and trends in neural activity.">
              <span className={`text-3xl font-black ${isDataActive ? 'text-zinc-200' : 'text-zinc-900'}`}>CH 6</span>
            </Tooltip>
            <Tooltip name="NOISE_FLOOR" unit="Decibels (dBm)" source={sourceState} rate="Static" desc="Level of background RF energy.">
              <span className="text-[10px] text-zinc-600 font-mono uppercase">Noise_Floor: {isDataActive ? '-102 dBm' : 'VOID'}</span>
            </Tooltip>
          </div>
          <div className="text-[9px] text-zinc-800 font-mono tracking-tighter uppercase">Scanning: Full_Band_Scan_Interval</div>
        </div>
      </div>

      <div className="space-y-12">
        {activeMetrics.has('rssi') && (
          <Card 
            title={`SIGNAL_CHRONO_GRAPH [${timeframe}]`} 
            variant={isSimulated ? 'sim' : 'real'} 
            className="h-[400px] animate-in zoom-in-95"
            onProbe={() => onProbe('RSSI_CSV_REPORT', { data: rssiData, mode: isSimulated ? 'SIM' : 'REAL' })}
            onBrain={() => onBrainClick('rssi_graph', 'RF Intelligence', { currentRssi })}
            isProcessing={processingId === 'RSSI_CSV_REPORT' || processingId === 'rssi_graph'}
          >
            <div className="w-full h-full pb-10">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <AreaChart data={rssiData}>
                  <defs>
                    <linearGradient id="colorMain" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={themeColor} stopOpacity={0.2}/>
                      <stop offset="95%" stopColor={themeColor} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#111" vertical={false} />
                  <XAxis 
                    dataKey="time" 
                    stroke="#444" 
                    fontSize={14} 
                    fontWeight="bold" 
                    tickFormatter={(val) => val.split(':').slice(0, 2).join(':')}
                  />
                  <YAxis domain={[-100, 0]} stroke="#333" fontSize={10} fontWeight="black" />
                  <RechartsTooltip contentStyle={{ backgroundColor: '#020405', border: '1px solid #1a2f2c', fontSize: '10px' }} />
                  <Area type="monotone" dataKey="val" stroke={themeColor} strokeWidth={2} fill="url(#colorMain)" isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}

        {activeMetrics.has('spectrum') && (
          <Card 
            title={`CHANNEL_LOAD_MAP [${timeframe}]`} 
            variant="purple" 
            className="h-[400px] animate-in zoom-in-95"
            onProbe={() => onProbe('CHANNEL_DENSITY_ANALYSIS', { timeframe })}
            onBrain={() => onBrainClick('spectrum_panel', 'Spectrum Intelligence', { active: true })}
            isProcessing={processingId === 'CHANNEL_DENSITY_ANALYSIS' || processingId === 'spectrum_panel'}
          >
            <div className="w-full h-full pb-10">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <BarChart data={[
                  { chan: '1', usage: 12 + Math.random() * 20 }, 
                  { chan: '6', usage: 75 + Math.random() * 20 }, 
                  { chan: '11', usage: 24 + Math.random() * 15 }
                ]}>
                  <CartesianGrid strokeDasharray="2 2" stroke="#111" vertical={false} />
                  <XAxis dataKey="chan" stroke="#444" fontSize={14} fontWeight="bold" />
                  <YAxis hide />
                  <Bar dataKey="usage" fill="#bd00ff" radius={[1, 1, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}
      </div>

      {!activeMetrics.size && (
        <div className="py-20 flex flex-col items-center justify-center opacity-10 select-none grayscale">
           <svg className="w-16 h-16 text-zinc-800 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071a9.5 9.5 0 0113.434 0m-17.678-4.243a15.5 15.5 0 0121.92 0"/></svg>
           <span className="text-[14px] font-black uppercase tracking-[0.5em] text-zinc-800">Telemetry_Standby</span>
        </div>
      )}
    </div>
  );
};

export default TelemetryGraphs;
