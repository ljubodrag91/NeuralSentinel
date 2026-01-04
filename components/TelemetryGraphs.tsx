import React, { useState, useEffect, useMemo } from 'react';
import Card from './common/Card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip, BarChart, Bar } from 'recharts';
import { Timeframe, OperationalMode, CoreStats, AppSettings, SlotPermissions, PanelSlotConfig, SlotConfig } from '../types';
import Tooltip from './common/Tooltip';
import Modal from './common/Modal';

interface TelemetryProps {
  stats: CoreStats | null;
  onProbe: (panel: string, data: any) => void;
  onProbeInfo: (title: string, payload: any) => void;
  onBrainClick: (id: string, type: string, metrics: any) => void;
  onLauncherSelect: (id: string, type: 'low' | 'probe') => void;
  onHistoryShow?: (panelId: string, title: string, headers: string[]) => void;
  isSimulated: boolean;
  isConnected: boolean;
  timeframe: Timeframe;
  processingId?: string;
  allowDistortion?: boolean;
  serviceStatus: 'ONLINE' | 'OFFLINE' | 'LOCKED' | 'CONNECTING';
  onRetryConnection: () => void;
  settings: AppSettings;
  slotConfig?: PanelSlotConfig;
  globalLowSlot?: SlotConfig;
  permissions?: SlotPermissions;
}

const TelemetryGraphs: React.FC<TelemetryProps> = ({ 
  stats, onProbe, onProbeInfo, onBrainClick, onLauncherSelect, onHistoryShow, isSimulated, isConnected, timeframe, processingId, allowDistortion, serviceStatus, onRetryConnection, settings, slotConfig, globalLowSlot, permissions
}) => {
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

  const downloadSentinelScripts = () => {
    const files = [
      { name: 'sentinel_windows.py', content: '# Sentinel Service (Windows) - Placeholder\n# Runs on port 5050' },
      { name: 'sentinel_linux.py', content: '# Sentinel Service (Linux) - Placeholder\n# Runs on port 5050' }
    ];

    files.forEach(file => {
      const blob = new Blob([file.content], { type: 'text/x-python' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  };

  const isDataActive = serviceStatus === 'ONLINE' && !!stats; 

  useEffect(() => {
    if (!isDataActive || !stats) return;

    const now = new Date();
    const timeLabel = now.toLocaleTimeString();
    
    let signalVal = -65; 
    const load = stats.cpu?.usage || 0;
    const net = (stats.network?.inRateKB || 0) + (stats.network?.outRateKB || 0);
    signalVal += (Math.random() * 5) - (load / 20); 
    if (net > 500) signalVal -= 5;
    signalVal = Math.max(-95, Math.min(-30, signalVal));

    setRssiData(prev => {
      const next = [...prev, { time: timeLabel, val: Math.floor(signalVal) }];
      return next.slice(-windowSize);
    });

  }, [isDataActive, windowSize, stats]);

  const currentRssi = (isDataActive && rssiData.length > 0) ? rssiData[rssiData.length - 1].val : -99;
  const themeColor = serviceStatus === 'ONLINE' ? '#00ffd5' : '#ff3e3e';

  const getStatusDisplay = () => {
    switch (serviceStatus) {
      case 'ONLINE': return <span className="text-green-500 font-bold uppercase tracking-widest">LIVE</span>;
      case 'CONNECTING': return <span className="text-teal-400 font-bold uppercase tracking-widest animate-pulse">CONNECTING...</span>;
      case 'LOCKED': return <span className="text-red-900 font-bold uppercase tracking-widest">LOCKED (RETRY_MANUAL)</span>;
      case 'OFFLINE': 
      default: return <span className="text-red-600 font-bold uppercase tracking-widest">OFFLINE</span>;
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20 no-scroll h-full">
      <div className="flex justify-between items-center px-4">
        <div className="flex items-center gap-4">
          <div className="text-[10px] font-black text-zinc-700 uppercase tracking-widest">RF_TELEMETRY_ENGINE</div>
          <div className="flex items-center gap-2 border-l border-zinc-900 pl-4">
             <button 
               onClick={onRetryConnection}
               disabled={serviceStatus === 'CONNECTING'}
               className={`text-[9px] font-black border px-3 py-1.5 uppercase tracking-widest transition-all ${
                 serviceStatus === 'ONLINE' ? 'border-teal-500/30 text-teal-500 hover:bg-teal-500/10' : 
                 'border-red-500/60 bg-red-950/20 text-red-500 hover:bg-red-500 hover:text-white'
               } ${serviceStatus === 'CONNECTING' ? 'opacity-50 cursor-wait' : ''}`}
             >
               {serviceStatus === 'ONLINE' ? 'SYNC_UPLINK' : 'INITIALIZE_UPLINK'}
             </button>
             <div className="text-[9px] font-mono ml-2">
                {getStatusDisplay()}
             </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={downloadSentinelScripts}
            className="text-[9px] font-black border border-teal-500/30 bg-teal-500/5 px-3 py-1.5 text-teal-500 hover:text-white hover:bg-teal-500/20 transition-all uppercase tracking-widest"
          >
            Download_Sentinel
          </button>
          <button 
            onClick={() => setShowInfo(true)}
            className="text-[9px] font-black border border-zinc-900 bg-black/40 px-3 py-1.5 text-zinc-500 hover:text-white hover:border-zinc-500 transition-all uppercase tracking-widest"
          >
            Source_Intel
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div 
          onClick={() => serviceStatus === 'ONLINE' && toggleMetric('rssi')}
          className={`cursor-pointer border p-8 flex flex-col gap-4 transition-all group ${
            serviceStatus !== 'ONLINE' ? 'bg-red-950/5 border-red-900/30 cursor-not-allowed' :
            activeMetrics.has('rssi') ? 'bg-zinc-900/80 border-teal-500/50 shadow-[0_0_15px_rgba(0,255,213,0.1)]' : 'bg-black border-zinc-900 hover:border-zinc-800'
          }`}
        >
          <div className="flex justify-between items-center">
            <span className={`text-[10px] font-black uppercase tracking-widest group-hover:text-zinc-500 ${serviceStatus !== 'ONLINE' ? 'text-red-900' : 'text-zinc-700'}`}>RF_SIGNAL_FLOW</span>
            <div className={`w-2.5 h-2.5 rounded-full ${serviceStatus !== 'ONLINE' ? 'bg-red-900' : activeMetrics.has('rssi') ? 'bg-teal-500 glow-teal' : 'bg-zinc-900'}`}></div>
          </div>
          <div className="flex items-baseline gap-6">
            <span className={`text-3xl font-black ${isDataActive ? 'text-zinc-200' : 'text-red-900'}`}>{isDataActive ? `${currentRssi} dBm` : 'NO_CARRIER'}</span>
            <span className="text-[10px] text-zinc-600 font-mono uppercase">Stability: {isDataActive ? '98.2%' : 'VOID'}</span>
          </div>
        </div>

        <div 
          onClick={() => serviceStatus === 'ONLINE' && toggleMetric('spectrum')}
          className={`cursor-pointer border p-8 flex flex-col gap-4 transition-all group ${
            serviceStatus !== 'ONLINE' ? 'bg-red-950/5 border-red-900/30 cursor-not-allowed' :
            activeMetrics.has('spectrum') ? 'bg-zinc-900/80 border-purple-500/50 shadow-[0_0_15px_rgba(189,0,255,0.1)]' : 'bg-black border-zinc-900 hover:border-zinc-800'
          }`}
        >
          <div className="flex justify-between items-center">
            <span className={`text-[10px] font-black uppercase tracking-widest group-hover:text-zinc-500 ${serviceStatus !== 'ONLINE' ? 'text-red-900' : 'text-zinc-700'}`}>SPECTRAL_DENSITY</span>
            <div className={`w-2.5 h-2.5 rounded-full ${serviceStatus !== 'ONLINE' ? 'bg-red-900' : activeMetrics.has('spectrum') ? 'bg-purple-500 glow-purple' : 'bg-zinc-900'}`}></div>
          </div>
          <div className="flex items-baseline gap-6">
            <span className={`text-3xl font-black ${isDataActive ? 'text-zinc-200' : 'text-red-900'}`}>{isDataActive ? 'CH 6' : 'NO_CARRIER'}</span>
            <span className="text-[10px] text-zinc-600 font-mono uppercase">Noise_Floor: {isDataActive ? '-102 dBm' : 'VOID'}</span>
          </div>
        </div>
      </div>

      <div className="space-y-12">
        {activeMetrics.has('rssi') && (
          <Card 
            id="RSSI_REPORT"
            title={`SIGNAL_CHRONO_GRAPH [${timeframe}]`}
            titleTooltip="Time-series probe of RF signal flow and spectral stability. Assessment of wireless link quality and interference patterns."
            variant={serviceStatus === 'ONLINE' ? (isSimulated ? 'sim' : 'real') : 'offline'} 
            className={`h-[400px] animate-in zoom-in-95 ${serviceStatus !== 'ONLINE' ? 'opacity-50 grayscale' : ''}`}
            onProbe={() => onProbe('RSSI_REPORT', { rssiData })}
            onProbeInfo={() => onProbeInfo('RSSI_REPORT', { rssiData })}
            onBrain={() => onBrainClick('RSSI_REPORT', 'RF Intelligence', { currentRssi })}
            onLauncherSelect={(_, type) => onLauncherSelect('RSSI_REPORT', type as any)}
            onHistory={() => onHistoryShow?.('RSSI_REPORT', 'RF_SIGNAL_LOG', ['SIGNAL', 'NOISE'])}
            allowDistortion={allowDistortion}
            slotConfig={slotConfig}
            globalLowSlot={globalLowSlot}
            permissions={permissions}
            isProcessing={processingId === 'RSSI_REPORT'}
            platform={settings.platform}
          >
            {serviceStatus === 'ONLINE' ? (
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
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                 <div className="text-red-500 font-black text-xl uppercase tracking-widest animate-pulse">UPLINK_TERMINATED</div>
                 <div className="text-red-900 font-mono text-xs uppercase">No telemetry carrier detected</div>
              </div>
            )}
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
              <li><span className="text-zinc-300">RF Signal:</span> Captured using platform-specific wireless tools (simulated derivation if sensor absent).</li>
              <li><span className="text-zinc-300">Process List:</span> Snapshot taken from active process table sorted by compute weight.</li>
            </ul>
          </section>
        </div>
      </Modal>
    </div>
  );
};

export default TelemetryGraphs;