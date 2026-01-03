
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { OperationalMode, SessionInfo, CoreStats, AppSettings, Platform } from '../types';
import Card from './common/Card';
import Tooltip from './common/Tooltip';
import { launcherSystem } from '../services/launcherService';

interface DashboardProps {
  mode: OperationalMode;
  session: SessionInfo;
  stats: CoreStats | null;
  settings: AppSettings;
  terminalHistory: string[];
  onHandshake: (ip: string, user: string, pass: string, port: number) => void;
  onDisconnect: () => void;
  onLog: (msg: string, level?: any) => void;
  onBrainClick: (id: string, type: string, metrics: any) => void;
  onProbeClick: (panel: string, metrics: any) => void;
  onProbeInfo: (panelName: string, metrics: any) => void;
  onLauncherSelect: (id: string, type: 'core' | 'neural') => void;
  onAdapterCommand: (cmd: string) => void;
  onRefresh: () => void;
  onHistoryShow?: (panelId: string, title: string, headers: string[]) => void;
  processingId?: string;
  latestCoreProbeResult?: any;
  activeTelemetry?: Set<string>;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  mode, session, stats, settings, terminalHistory, onHandshake, onDisconnect, onBrainClick, onProbeClick, onProbeInfo, onLauncherSelect, onAdapterCommand, onHistoryShow, processingId, latestCoreProbeResult, activeTelemetry
}) => {
  // Removed hardcoded placeholders. Remote connections require manual entry.
  const [ipInput, setIpInput] = useState('');
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [port, setPort] = useState(22);
  const [terminalMode, setTerminalMode] = useState(false);
  const [consoleInput, setConsoleInput] = useState('');
  const consoleInputRef = useRef<HTMLInputElement>(null);
  const terminalEndRef = useRef<HTMLDivElement>(null);
  
  const adapters = useMemo(() => {
    const base = ['wlan0', 'wlan1', 'eth0', 'lo'];
    if (stats?.network?.interfaces) {
      return Array.from(new Set([...base, ...Object.keys(stats.network.interfaces)]));
    }
    return base;
  }, [stats]);

  useEffect(() => {
    if (terminalEndRef.current) terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [terminalHistory]);

  const getInterfaceData = (name: string) => {
    if (mode === OperationalMode.SIMULATED) return { up: true, ip: '192.168.1.104' };
    const realData = stats?.network?.interfaces?.[name];
    return { up: realData?.up || false, ip: realData?.ip || 'OFFLINE' };
  };

  const isConnected = session.status === 'ACTIVE';
  const isRemote = settings.dataSourceMode === 'REMOTE';
  const isLocal = settings.dataSourceMode === 'LOCAL';
  const isProbeActive = processingId === 'GLOBAL_SYSTEM_PROBE';

  // Determine Local Identity based on Platform (Windows vs Linux)
  const localIdentity = settings.platform === Platform.WINDOWS ? 'Administrator' : 'root';
  const prompt = settings.platform === Platform.WINDOWS ? 'PS C:\\Users\\Admin>' : 'root@kali:~#';

  const handleConsoleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (consoleInput.trim()) {
      onAdapterCommand(consoleInput);
      setConsoleInput('');
    }
  };

  useEffect(() => {
    if (terminalMode && consoleInputRef.current) consoleInputRef.current.focus();
  }, [terminalMode]);

  const getLauncherColor = (panelId: string) => {
    const slot = settings.panelSlots[panelId]?.dataSlot;
    const id = slot?.launcherId || 'std-core';
    return launcherSystem.getById(id)?.color || '#bd00ff';
  };

  // Logic for Handshake Panel Visuals
  // Local: Blue if stats present (online), Red if not. Always disabled.
  // Remote: Green if connected, Red if disconnected. Enabled when disconnected.
  let handshakeVariant: 'real' | 'sim' | 'offline' | 'blue' | 'green' = 'offline';
  let isHandshakeInputDisabled = false;
  let handshakeButtonText = "INITIALIZE_HANDSHAKE";
  
  if (isLocal) {
    handshakeVariant = stats ? 'blue' : 'offline';
    isHandshakeInputDisabled = true;
    handshakeButtonText = stats ? "LOCAL_LINK_ACTIVE" : "LOCAL_DATA_OFFLINE";
  } else {
    handshakeVariant = isConnected ? 'green' : 'offline';
    isHandshakeInputDisabled = isConnected;
    handshakeButtonText = isConnected ? "TERMINATE_SESSION" : "INITIALIZE_HANDSHAKE";
  }

  return (
    <div className="space-y-6 h-full flex flex-col no-scroll overflow-hidden pb-4">
      <div className="flex justify-between items-center px-2 shrink-0">
        <div className="flex items-center gap-4">
          <Tooltip name="DASHBOARD_STREAM" source="SYSTEM" desc="Real-time link monitoring.">
            <span className="text-[10px] font-black text-zinc-700 uppercase tracking-widest cursor-help">Dashboard_Stream</span>
          </Tooltip>
          {isConnected && (
            <button 
              onClick={() => setTerminalMode(!terminalMode)}
              className={`px-4 py-1.5 border text-[9px] font-black uppercase tracking-widest transition-all ${terminalMode ? 'bg-teal-500/10 border-teal-500 text-teal-400' : 'bg-zinc-950 border-zinc-800 text-zinc-600 hover:text-white'}`}
            >
              {terminalMode ? 'DISENGAGE_CONSOLE' : 'ENGAGE_TERMINAL_OVERLAY'}
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${isConnected ? (isRemote ? 'bg-green-500 animate-pulse' : 'bg-blue-500 animate-pulse') : 'bg-red-500'}`}></div>
          <div className="text-[9px] font-mono text-zinc-800 uppercase">STN_NODE: {isConnected ? 'LINKED' : 'VOID'}</div>
        </div>
      </div>

      {!terminalMode ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch shrink-0">
            <Card 
              id="HANDSHAKE_CORE"
              title="HANDSHAKE_NODE" 
              variant={handshakeVariant}
              onProbe={() => onProbeClick('HANDSHAKE_CORE', { ipInput: isLocal ? '127.0.0.1' : ipInput, user: isLocal ? localIdentity : user, port })}
              onProbeInfo={() => onProbeInfo('HANDSHAKE_CORE', { ipInput: isLocal ? '127.0.0.1' : ipInput, user: isLocal ? localIdentity : user, port })}
              onBrain={() => onBrainClick('HANDSHAKE_CORE', 'Connection Link', { ipInput: isLocal ? '127.0.0.1' : ipInput, user, status: session.status })}
              onLauncherSelect={(_, type) => onLauncherSelect('HANDSHAKE_CORE', type)}
              onHistory={() => onHistoryShow?.('HANDSHAKE_CORE', 'CONNECTION_ATTEMPTS', ['IP', 'USER', 'PORT', 'STATUS'])}
              isProcessing={processingId === 'HANDSHAKE_CORE'}
              probeColor={getLauncherColor('HANDSHAKE_CORE')}
            >
              <div className="space-y-4">
                <input 
                  value={isLocal ? 'LOCALHOST [127.0.0.1]' : ipInput} 
                  onChange={e => setIpInput(e.target.value)} 
                  disabled={isHandshakeInputDisabled} 
                  className={`bg-black/50 border p-2 text-[11px] font-mono outline-none w-full transition-colors ${
                    isLocal 
                      ? 'border-zinc-900 text-blue-500/50 cursor-not-allowed' 
                      : (isConnected ? 'border-green-900/50 text-green-500/50' : 'border-zinc-800 text-white focus:border-green-500')
                  }`} 
                  placeholder={isLocal ? "" : "Target IP Address..."} 
                />
                <div className="grid grid-cols-3 gap-3">
                  <input 
                    value={isLocal ? localIdentity : user} 
                    onChange={e => setUser(e.target.value)} 
                    disabled={isHandshakeInputDisabled} 
                    className={`bg-black/50 border p-1.5 text-[10px] font-mono outline-none ${isLocal ? 'border-zinc-900 text-blue-500/50' : 'border-zinc-900 text-zinc-300 focus:border-green-500'}`} 
                    placeholder="user" 
                  />
                  <input 
                    type={isLocal ? "text" : "password"}
                    value={isLocal ? '******' : pass} 
                    onChange={e => setPass(e.target.value)} 
                    disabled={isHandshakeInputDisabled} 
                    className={`bg-black/50 border p-1.5 text-[10px] font-mono outline-none ${isLocal ? 'border-zinc-900 text-blue-500/50' : 'border-zinc-900 text-zinc-300 focus:border-green-500'}`} 
                    placeholder="pass" 
                  />
                  <input 
                    type={isLocal ? "text" : "number"}
                    value={isLocal ? 'N/A' : port} 
                    onChange={e => setPort(Number(e.target.value))} 
                    disabled={isHandshakeInputDisabled} 
                    className={`bg-black/50 border p-1.5 text-[10px] font-mono outline-none ${isLocal ? 'border-zinc-900 text-blue-500/50' : 'border-zinc-900 text-zinc-300 focus:border-green-500'}`} 
                  />
                </div>
                <button 
                  onClick={isLocal ? undefined : (isConnected ? onDisconnect : () => onHandshake(ipInput, user, pass, port))} 
                  disabled={isLocal}
                  className={`w-full py-3 text-[10px] font-black border transition-all tracking-widest uppercase ${
                    isLocal 
                      ? 'border-zinc-900 text-zinc-700 bg-zinc-950 cursor-not-allowed'
                      : isConnected 
                        ? 'border-red-900/40 text-red-500 hover:bg-red-500/10' 
                        : 'border-green-900/40 text-green-500 hover:bg-green-500/10'
                  }`}
                >
                  {handshakeButtonText}
                </button>
              </div>
            </Card>

            <Card 
              id="ADAPTER_HUB"
              title="ADAPTER_MATRIX" 
              variant={handshakeVariant} 
              onProbe={() => onProbeClick('ADAPTER_HUB', { stats })} 
              onProbeInfo={() => onProbeInfo('ADAPTER_HUB', { stats })}
              onBrain={() => onBrainClick('ADAPTER_HUB', 'Network Matrix', { stats })} 
              onLauncherSelect={(_, type) => onLauncherSelect('ADAPTER_HUB', type)}
              onHistory={() => onHistoryShow?.('ADAPTER_HUB', 'INTERFACE_TRAFFIC', ['CONNS', 'RX(KB)', 'TX(KB)'])}
              isProcessing={processingId === 'ADAPTER_HUB'}
              probeColor={getLauncherColor('ADAPTER_HUB')}
            >
              <div className="flex flex-col gap-2 max-h-40 overflow-y-auto no-scroll">
                {adapters.map(name => {
                  const data = getInterfaceData(name);
                  return (
                    <div key={name} className="px-4 py-2 border border-zinc-900/40 bg-black/20 flex justify-between items-center group hover:bg-teal-500/5 transition-all">
                      <div className="flex items-center gap-3">
                        <div className={`w-1.5 h-1.5 rounded-full ${data.up ? 'bg-green-500 glow-green' : 'bg-red-500'}`}></div>
                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest group-hover:text-teal-400">{name}</span>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-600">{data.ip}</span>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          <Card 
            id="GLOBAL_SYSTEM_PROBE"
            title="MASTER_INTELLIGENCE_LINK" 
            variant="purple" 
            className="relative overflow-visible shrink-0 pb-6 flex-1 max-h-[350px]"
            // Header actions: Brain and Launcher Config restored
            onBrain={() => onBrainClick('GLOBAL_SYSTEM_PROBE', 'Neural Hub Intelligence', { latestResult: latestCoreProbeResult })}
            onLauncherSelect={(_, type) => onLauncherSelect('GLOBAL_SYSTEM_PROBE', type)}
            onHistory={() => onHistoryShow?.('GLOBAL_SYSTEM_PROBE', 'CORE_METRICS', ['CPU%', 'RAM%', 'DISK%'])}
            probeColor={getLauncherColor('GLOBAL_SYSTEM_PROBE')}
          >
            <div className="flex flex-col h-full">
              {/* STATUS CIRCLES RESTORED */}
              <div className="flex justify-center gap-6 mb-4 border-b border-zinc-900/30 pb-2 shrink-0">
                  <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? (isRemote ? 'bg-green-500 glow-green' : 'bg-blue-500 glow-blue') : 'bg-red-500'}`}></div>
                      <span className="text-[8px] font-black uppercase text-zinc-600">Service_Link</span>
                  </div>
                  <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${latestCoreProbeResult ? 'bg-purple-500 glow-purple' : 'bg-zinc-800'}`}></div>
                      <span className="text-[8px] font-black uppercase text-zinc-600">Neural_Uplink</span>
                  </div>
              </div>

              <div className="flex items-center justify-between gap-8 flex-1 min-h-0">
                {/* Status Left */}
                <div className="flex-1 text-[10px] font-mono text-zinc-500 leading-relaxed border-r border-zinc-900/30 pr-4 h-full overflow-y-auto no-scroll flex flex-col justify-center">
                  {latestCoreProbeResult ? (
                    <div className="animate-in fade-in duration-500">
                      <div className="text-purple-400 font-black mb-1 uppercase tracking-tighter">Status: {latestCoreProbeResult.status}</div>
                      <div className="text-zinc-400 italic">"{latestCoreProbeResult.description}"</div>
                    </div>
                  ) : (
                    <div className="text-zinc-800 italic uppercase text-[8px] tracking-widest animate-pulse text-center">Awaiting Neural Data Link...</div>
                  )}
                </div>

                {/* CORE PROBE VISUAL (Transistor Style preserved) */}
                <div className="flex flex-col items-center justify-center relative group w-64 shrink-0">
                  <div className="absolute top-[-30px] flex gap-12 pointer-events-none opacity-20">
                    <div className="w-[1px] h-32 bg-purple-500"></div>
                    <div className="w-[1px] h-40 bg-purple-500"></div>
                    <div className="w-[1px] h-32 bg-purple-500"></div>
                  </div>

                  <div className="w-24 h-6 bg-zinc-800 border-x border-t border-purple-500/30 rounded-t-sm mb-0 flex items-center justify-center">
                    <div className="w-4 h-4 rounded-full bg-black border border-zinc-700 shadow-inner"></div>
                  </div>

                  <div className="relative z-10">
                    <div className="block cursor-help">
                      <button 
                        onClick={() => onProbeClick('GLOBAL_SYSTEM_PROBE', { stats, mode, activeFocus: Array.from(activeTelemetry || []) })}
                        disabled={isProbeActive}
                        className="relative w-64 h-20 bg-[#050608] border-x border-b border-purple-500/60 shadow-2xl flex flex-col items-center justify-center transition-all group-hover:border-purple-400 group-hover:shadow-[0_0_30px_rgba(189,0,255,0.2)] disabled:opacity-50 overflow-hidden cursor-pointer"
                      >
                        <div className="absolute top-2 left-4 text-[6px] text-zinc-800 font-mono tracking-tighter uppercase">Sentinel_NPN_v2.9</div>
                        <div className="absolute bottom-2 right-4 text-[6px] text-zinc-800 font-mono tracking-tighter uppercase">Lot: 0xNEURAL</div>
                        
                        <span className={`text-[12px] font-black uppercase tracking-[0.6em] transition-colors ${isProbeActive ? 'text-white animate-pulse' : 'text-purple-400 group-hover:text-purple-200'}`}>
                          {isProbeActive ? 'SCANNING...' : 'CORE PROBE'}
                        </span>
                        
                        {isProbeActive && (
                          <div className="absolute inset-0 pointer-events-none">
                            <div className="w-full h-full bg-purple-500/10 animate-ping opacity-20"></div>
                          </div>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-16 mt-[-2px] pointer-events-none">
                    <div className="w-0.5 h-10 bg-purple-500/40 transition-all"></div>
                    <div className="w-0.5 h-16 bg-purple-500/40 transition-all"></div>
                    <div className="w-0.5 h-10 bg-purple-500/40 transition-all"></div>
                  </div>

                  <span className="absolute bottom-[-30px] text-[7px] font-black uppercase tracking-[0.4em] text-zinc-800 pointer-events-none whitespace-nowrap">
                    {isProbeActive ? 'Engagement_Active' : 'Neural_Bridge_Standby_Ready'}
                  </span>
                </div>

                {/* Recommendation Right */}
                <div className="flex-1 text-[10px] font-mono text-zinc-500 leading-relaxed border-l border-zinc-900/30 pl-4 h-full overflow-y-auto no-scroll flex flex-col justify-center">
                  {latestCoreProbeResult ? (
                    <div className="animate-in fade-in duration-500">
                      <div className="text-teal-500 font-black mb-1 uppercase tracking-tighter">Recommendation:</div>
                      <div className="text-zinc-300 font-bold">{latestCoreProbeResult.recommendation}</div>
                    </div>
                  ) : (
                    <div className="text-zinc-800 italic uppercase text-[8px] tracking-widest text-center">System Matrix Stable...</div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </>
      ) : (
        <div className="flex-1 flex flex-col bg-black/60 border border-zinc-900/60 rounded-sm relative overflow-hidden">
           <div className="h-10 border-b border-zinc-900 bg-zinc-950/40 flex items-center justify-between px-6">
              <span className="text-[10px] font-black text-teal-500 uppercase tracking-widest">KALI_INTERACTIVE_CONSOLE</span>
              <button 
                onClick={() => onProbeClick('TERMINAL_COMMAND_AUDIT', { lastCommand: consoleInput })} 
                className="text-purple-500 text-[9px] font-black border border-purple-500/20 px-3 py-1 hover:bg-purple-500/10 transition-colors"
              >
                PROBE_CMD
              </button>
           </div>
           <div className="flex-1 p-6 font-mono text-[13px] overflow-y-auto no-scroll bg-black/80 space-y-1">
              {terminalHistory.map((line, i) => (
                <div key={i} className="whitespace-pre-wrap">
                  {line.startsWith('root@kali') ? <span className="text-green-500 font-bold">{line}</span> : line.startsWith('[ERROR]') ? <span className="text-red-500 font-bold">{line}</span> : <span className="text-zinc-300">{line}</span>}
                </div>
              ))}
              <div ref={terminalEndRef} />
           </div>
           <div className="h-12 border-t border-zinc-900 bg-black/40 flex items-center px-6">
              <form onSubmit={handleConsoleSubmit} className="flex-1 flex items-center gap-3">
                 <span className="text-teal-500 font-black">{prompt}</span>
                 <input 
                    ref={consoleInputRef} value={consoleInput} onChange={e => setConsoleInput(e.target.value)}
                    className="flex-1 bg-transparent border-none outline-none text-white selection:bg-teal-500/30 placeholder-zinc-800"
                    placeholder="Enter command vector..." autoFocus
                 />
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
