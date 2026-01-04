
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { OperationalMode, SessionInfo, CoreStats, AppSettings, Platform } from '../types';
import Card from './common/Card';
import Tooltip from './common/Tooltip';
import TacticalButton from './common/TacticalButton';
import { launcherSystem } from '../services/launcherService';
import { serverService } from '../services/serverService';

interface DashboardProps {
  mode: OperationalMode;
  session: SessionInfo;
  stats: CoreStats | null;
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  terminalHistory: string[];
  onHandshake: (ip: string, user: string, pass: string, port: number) => void;
  onDisconnect: () => void;
  onLog: (msg: string, level?: any) => void;
  onBrainClick: (id: string, type: string, metrics: any) => void;
  onProbeClick: (panel: string, metrics: any) => void;
  onProbeInfo: (panelName: string, metrics: any) => void;
  onLauncherSelect: (id: string, type: 'low' | 'probe') => void;
  onAdapterCommand: (cmd: string) => void;
  onRefresh: () => void;
  processingId?: string;
  latestCoreProbeResult?: any;
  activeTelemetry?: Set<string>;
  tick?: number;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  mode, session, stats, settings, setSettings, terminalHistory, onHandshake, onDisconnect, onBrainClick, onProbeClick, onProbeInfo, onLauncherSelect, onAdapterCommand, processingId, latestCoreProbeResult, activeTelemetry, tick
}) => {
  const [ipInput, setIpInput] = useState('10.121.41.108');
  const [user, setUser] = useState('kali');
  const [pass, setPass] = useState('');
  const [port, setPort] = useState(22);
  const [terminalMode, setTerminalMode] = useState(false);
  const [consoleInput, setConsoleInput] = useState('');
  const [masterProbeCd, setMasterProbeCd] = useState(0);

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

  // Master Probe Cooldown Tracking
  useEffect(() => {
    const lastFire = Number(localStorage.getItem('master_probe_last_fire_ts') || 0);
    setMasterProbeCd(Math.max(0, (lastFire + 300000) - Date.now()));
  }, [tick]);

  const isConnected = session.status === 'ACTIVE';
  const isLocal = settings.dataSourceMode === 'LOCAL';
  const isProbeActive = processingId === 'GLOBAL_SYSTEM_PROBE';
  const platformAccent = settings.platform === Platform.LINUX ? '#eab308' : '#00f2ff';

  const handleConsoleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (consoleInput.trim()) {
      onAdapterCommand(consoleInput);
      setConsoleInput('');
    }
  };

  const handlePlatformToggle = (p: Platform) => {
    if (isLocal) return; 
    setSettings(s => ({ ...s, platform: p }));
  };

  useEffect(() => {
    if (terminalMode && consoleInputRef.current) consoleInputRef.current.focus();
  }, [terminalMode]);

  const getLauncherColor = (panelId: string) => {
    const slot = settings.panelSlots[panelId]?.probeSlot; 
    const id = slot?.launcherId || 'std-core';
    return launcherSystem.getById(id)?.color || '#bd00ff';
  };

  const statusIndicatorColor = isConnected ? (isLocal ? platformAccent : '#22c55e') : '#ef4444';

  let handshakeVariant: 'blue' | 'green' | 'offline' = isLocal ? (stats ? 'blue' : 'offline') : (isConnected ? 'green' : 'offline');

  const isAvailable = isConnected && masterProbeCd === 0;
  
  const getMainProbeStatusText = () => {
    if (!isConnected) return "Disabled - System Node Offline";
    if (masterProbeCd > 0) return `Sync Buffer Cooling... (${(masterProbeCd/1000).toFixed(0)}s)`;
    return "Ready - Full Dashboard Aggregation Probe Available";
  };

  const isResultError = latestCoreProbeResult?.elementId === 'TRANSPORT_ERROR' || latestCoreProbeResult?.elementId === 'ERROR';

  return (
    <div className="space-y-6 h-full flex flex-col no-scroll overflow-hidden pb-4">
      <div className="flex justify-between items-center px-2 shrink-0">
        <div className="flex items-center gap-4">
          <Tooltip name="DASHBOARD_STREAM" source="SYSTEM" desc="Real-time link monitoring.">
            <span className="text-[10px] font-black text-zinc-700 uppercase tracking-widest cursor-help">Dashboard_Stream</span>
          </Tooltip>
          
          <div className="flex items-center border border-zinc-800 bg-black/40 rounded-sm overflow-hidden group">
            <Tooltip name="HUD_SELECTION" source="SYSTEM" desc="Switch HUD for selected platform (Windows/Linux).">
                <div className="flex items-center">
                    <button 
                       onClick={() => handlePlatformToggle(Platform.WINDOWS)}
                       className={`px-3 py-1 text-[8px] font-black uppercase tracking-widest transition-all ${settings.platform === Platform.WINDOWS ? 'bg-blue-500/20 text-blue-400' : 'text-zinc-600 hover:text-zinc-400'} ${isLocal ? 'cursor-not-allowed opacity-50' : ''}`}
                       disabled={isLocal}
                    >
                       WINDOWS
                    </button>
                    <div className="w-[1px] h-4 bg-zinc-900"></div>
                    <button 
                       onClick={() => handlePlatformToggle(Platform.LINUX)}
                       className={`px-3 py-1 text-[8px] font-black uppercase tracking-widest transition-all ${settings.platform === Platform.LINUX ? 'bg-yellow-500/20 text-yellow-500' : 'text-zinc-600 hover:text-zinc-400'} ${isLocal ? 'cursor-not-allowed opacity-50' : ''}`}
                       disabled={isLocal}
                    >
                       LINUX
                    </button>
                </div>
            </Tooltip>
          </div>

          {(isConnected || isLocal) && (
            <button 
              onClick={() => setTerminalMode(!terminalMode)}
              className={`px-4 py-1.5 border text-[9px] font-black uppercase tracking-widest transition-all ${terminalMode ? 'bg-teal-500/10 border-teal-500 text-teal-400' : 'bg-zinc-950 border-zinc-800 text-zinc-600 hover:text-white'}`}
            >
              {terminalMode ? 'DISENGAGE' : 'TERMINAL'}
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full animate-pulse`} style={{ backgroundColor: statusIndicatorColor }}></div>
          <div className="text-[9px] font-mono text-zinc-800 uppercase">NODE: {isConnected ? 'LINKED' : 'VOID'}</div>
        </div>
      </div>

      {!terminalMode ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch shrink-0">
            <Card 
              id="HANDSHAKE_CORE"
              title="HANDSHAKE_NODE" 
              variant={handshakeVariant}
              onProbe={() => onProbeClick('HANDSHAKE_CORE', { ipInput, user, port })}
              onBrain={() => onBrainClick('HANDSHAKE_CORE', 'Connection Link', { ipInput, user, status: session.status })}
              onLauncherSelect={(pid, type) => onLauncherSelect(pid, type)}
              isProcessing={processingId === 'HANDSHAKE_CORE'}
              probeColor={getLauncherColor('HANDSHAKE_CORE')}
              platform={settings.platform}
              slotConfig={settings.panelSlots['HANDSHAKE_CORE']}
              globalLowSlot={settings.globalLowSlot}
              permissions={settings.slotPermissions['HANDSHAKE_CORE']}
            >
              <div className="space-y-4">
                <input value={isLocal ? '127.0.0.1 (LOCAL_LOCKED)' : ipInput} onChange={e => !isLocal && setIpInput(e.target.value)} disabled={isConnected && !isLocal} className={`bg-black/50 border border-zinc-900 p-2 text-[11px] font-mono outline-none w-full ${(isConnected && !isLocal) || isLocal ? 'text-zinc-600' : 'text-white'}`} placeholder="0.0.0.0" />
                <div className="grid grid-cols-3 gap-3">
                  <input value={isLocal ? 'admin' : user} onChange={e => !isLocal && setUser(e.target.value)} disabled={isConnected && !isLocal} className="bg-black/50 border border-zinc-900 p-1.5 text-[10px] font-mono outline-none" placeholder="user" />
                  <input type="password" value={isLocal ? '******' : pass} onChange={e => !isLocal && setPass(e.target.value)} disabled={isConnected && !isLocal} className="bg-black/50 border border-zinc-900 p-1.5 text-[10px] font-mono outline-none" placeholder="pass" />
                  <input type="number" value={isLocal ? 0 : port} onChange={e => !isLocal && setPort(Number(e.target.value))} disabled={isConnected && !isLocal} className="bg-black/50 border border-zinc-900 p-1.5 text-[10px] font-mono outline-none" />
                </div>
                <button 
                  onClick={isConnected && !isLocal ? onDisconnect : () => onHandshake(ipInput, user, pass, port)} 
                  disabled={isLocal}
                  className={`w-full py-3 text-[10px] font-black border transition-all tracking-widest uppercase ${isConnected && !isLocal ? 'border-red-900/40 text-red-500 hover:bg-red-500/10' : 'border-zinc-800 text-zinc-600 hover:text-white'} ${isLocal ? 'opacity-30 cursor-not-allowed' : ''}`}
                >
                  {isLocal ? 'LOCAL_HOST_STABLE' : (isConnected ? 'TERMINATE' : 'HANDSHAKE')}
                </button>
              </div>
            </Card>

            <Card 
              id="ADAPTER_HUB"
              title="ADAPTER_MATRIX" 
              variant={handshakeVariant} 
              onProbe={() => onProbeClick('ADAPTER_HUB', { stats })} 
              onBrain={() => onBrainClick('ADAPTER_HUB', 'Network Matrix', { stats })} 
              onLauncherSelect={(pid, type) => onLauncherSelect(pid, type)}
              isProcessing={processingId === 'ADAPTER_HUB'}
              probeColor={getLauncherColor('ADAPTER_HUB')}
              platform={settings.platform}
              slotConfig={settings.panelSlots['ADAPTER_HUB']}
              globalLowSlot={settings.globalLowSlot}
              permissions={settings.slotPermissions['ADAPTER_HUB']}
            >
              <div className="flex flex-col gap-2 max-h-40 overflow-y-auto no-scroll">
                {adapters.map(name => {
                  const iface = stats?.network?.interfaces?.[name];
                  return (
                    <div key={name} className="px-4 py-2 border border-zinc-900/40 bg-black/20 flex justify-between items-center group hover:bg-teal-500/5 transition-all">
                      <div className="flex items-center gap-3">
                        <div className={`w-1.5 h-1.5 rounded-full ${iface?.isUp ? 'bg-green-500 glow-green' : 'bg-red-500'}`}></div>
                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest group-hover:text-teal-400">{name}</span>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-600">{(iface?.ipv4 && iface.ipv4[0]) || 'OFFLINE'}</span>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          <Card 
            id="GLOBAL_SYSTEM_PROBE"
            title="MASTER_INTELLIGENCE" 
            variant="purple" 
            className="relative overflow-visible shrink-0 pb-6 flex-1 max-h-[350px]"
            onProbe={() => isAvailable && onProbeClick('GLOBAL_SYSTEM_PROBE', { stats, mode, activeFocus: Array.from(activeTelemetry || []) })}
            onBrain={() => onBrainClick('GLOBAL_SYSTEM_PROBE', 'Neural Hub Intelligence', { latestResult: latestCoreProbeResult })}
            onLauncherSelect={(pid, type) => onLauncherSelect(pid, type)}
            probeColor={getLauncherColor('GLOBAL_SYSTEM_PROBE')}
            platform={settings.platform}
            permissions={settings.slotPermissions['GLOBAL_SYSTEM_PROBE']}
            slotConfig={settings.panelSlots['GLOBAL_SYSTEM_PROBE']}
            globalLowSlot={settings.globalLowSlot}
          >
            <div className="flex flex-col h-full">
              <div className="flex justify-center gap-12 mb-6 border-b border-zinc-900/40 pb-3 shrink-0">
                  <div className="flex items-center gap-3 group">
                      <div className={`w-2 h-2 rounded-full transition-all duration-500 bg-teal-500 glow-teal shadow-[0_0_10px_#00ffd5]`}></div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Telemetry_Uplink</span>
                  </div>

                  <div className="flex items-center gap-3 group">
                      <div className={`w-2 h-2 rounded-full transition-all duration-500 bg-purple-500 glow-purple shadow-[0_0_10px_#bd00ff]`}></div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Neural_Link</span>
                  </div>
              </div>

              <div className="flex items-center justify-between gap-8 flex-1 min-h-0 px-4">
                <div className="flex-1 text-[10px] font-mono text-zinc-500 leading-relaxed border-r border-zinc-900/30 pr-4 h-full overflow-y-auto no-scroll flex flex-col justify-center">
                  <div className={`text-[9px] font-black uppercase tracking-widest mb-2 border-b border-zinc-900/20 pb-1 ${isResultError ? 'text-red-500' : 'text-zinc-700'}`}>
                    {isResultError ? 'HEURISTIC_FAULT' : 'Heuristic_Buffer'}
                  </div>
                  {latestCoreProbeResult ? (
                    <div className="animate-in fade-in duration-500">
                      <div className={`font-black mb-1 uppercase tracking-tighter ${isResultError ? 'text-red-400' : 'text-purple-400'}`}>
                        {isResultError ? 'API_EXCEPTION' : `Status: ${latestCoreProbeResult.status}`}
                      </div>
                      <div className={`${isResultError ? 'text-red-300 font-bold' : 'text-zinc-400'} italic`}>
                        "{latestCoreProbeResult.description}"
                      </div>
                    </div>
                  ) : (
                    <div className="text-zinc-800 italic uppercase text-[8px] tracking-widest animate-pulse text-center">Awaiting System Scan...</div>
                  )}
                </div>

                <div className="flex flex-col items-center justify-center relative group w-64 shrink-0">
                  <div className="absolute top-[-30px] flex gap-12 pointer-events-none opacity-20">
                    <div className={`w-[1px] h-32 bg-purple-500 ${isProbeActive ? 'animate-pulse' : ''}`}></div>
                    <div className={`w-[1px] h-40 bg-purple-500 ${isProbeActive ? 'animate-pulse' : ''}`}></div>
                    <div className={`w-[1px] h-32 bg-purple-500 ${isProbeActive ? 'animate-pulse' : ''}`}></div>
                  </div>
                  <div className="w-24 h-6 bg-zinc-800 border-x border-t border-purple-500/30 rounded-t-sm mb-0 flex items-center justify-center">
                    <div className={`w-4 h-4 rounded-full bg-black border border-zinc-700 shadow-inner ${isProbeActive ? 'glow-purple shadow-[0_0_10px_#bd00ff] animate-pulse' : ''}`}></div>
                  </div>
                  <div className="relative z-10">
                    <Tooltip name="AGGREGATED_CORE_PROBE" source="NEURAL_NETWORK" desc={`${getMainProbeStatusText()}. Single execution combines all active node vectors. Limits: 4000 Tokens.`} variant="purple">
                      <button 
                        onClick={() => isAvailable && onProbeClick('GLOBAL_SYSTEM_PROBE', { stats, mode, activeFocus: Array.from(activeTelemetry || []) })}
                        disabled={isProbeActive || !isAvailable}
                        className={`relative w-64 h-20 bg-[#050608] border-x border-b border-purple-500/60 shadow-2xl flex flex-col items-center justify-center transition-all overflow-hidden ${isAvailable ? 'cursor-pointer hover:border-purple-400 hover:shadow-[0_0_30px_rgba(189,0,255,0.2)]' : 'cursor-not-allowed opacity-50'}`}
                      >
                        <div className="absolute top-2 left-4 text-[6px] text-zinc-800 font-mono tracking-tighter uppercase">Sentinel_MASTER_CORE_v2</div>
                        <div className="absolute bottom-2 right-4 text-[6px] text-zinc-800 font-mono tracking-tighter uppercase">5m COOLDOWN</div>
                        <span className={`text-[12px] font-black uppercase tracking-[0.6em] transition-colors ${isProbeActive ? 'text-white animate-pulse' : 'text-purple-400'}`}>
                          {isProbeActive ? 'AGGREGATING...' : 'CORE PROBE'}
                        </span>
                        {isProbeActive && (
                          <div className="absolute inset-0 pointer-events-none transition-opacity">
                            <div className="w-full h-full bg-purple-500/20 animate-pulse"></div>
                          </div>
                        )}
                        {(masterProbeCd > 0 && !isProbeActive) && (
                           <div className="absolute inset-0 bg-red-950/20 flex items-center justify-center z-20 backdrop-blur-[1px]">
                             <span className="text-[10px] font-black text-red-500 tracking-[0.2em]">{(masterProbeCd/1000).toFixed(0)}s</span>
                           </div>
                        )}
                      </button>
                    </Tooltip>
                  </div>
                  <div className="flex gap-16 mt-[-2px] pointer-events-none">
                    <div className={`w-0.5 h-10 bg-purple-500/40 transition-all ${isProbeActive ? 'animate-pulse' : ''}`}></div>
                    <div className={`w-0.5 h-16 bg-purple-500/40 transition-all ${isProbeActive ? 'animate-pulse' : ''}`}></div>
                    <div className={`w-0.5 h-10 bg-purple-500/40 transition-all ${isProbeActive ? 'animate-pulse' : ''}`}></div>
                  </div>
                  <span className={`absolute bottom-[-30px] text-[7px] font-black uppercase tracking-[0.4em] pointer-events-none whitespace-nowrap transition-colors ${isProbeActive ? 'text-purple-500' : 'text-zinc-800'}`}>
                    {isProbeActive ? 'UPLINK_DENSE_STREAM' : 'Neural_Bridge_Standby_Ready'}
                  </span>
                </div>

                <div className="flex-1 text-[10px] font-mono text-zinc-500 leading-relaxed border-l border-zinc-900/30 pl-4 h-full overflow-y-auto no-scroll flex flex-col justify-center">
                   <div className={`text-[9px] font-black uppercase tracking-widest mb-2 border-b border-zinc-900/20 pb-1 ${isResultError ? 'text-red-500' : 'text-zinc-700'}`}>Directives</div>
                  {latestCoreProbeResult ? (
                    <div className="animate-in fade-in duration-500">
                      <div className={`font-black mb-1 uppercase tracking-tighter ${isResultError ? 'text-red-500 animate-pulse' : 'text-teal-500'}`}>
                        {isResultError ? 'CRITICAL_SUGGESTION:' : 'Recommendation:'}
                      </div>
                      <div className={`${isResultError ? 'text-red-400' : 'text-zinc-300 font-bold'} border-l-2 ${isResultError ? 'border-red-500/50' : 'border-teal-500/30'} pl-3 leading-tight`}>
                        {latestCoreProbeResult.recommendation}
                      </div>
                    </div>
                  ) : (
                    <div className="text-zinc-800 italic uppercase text-[8px] tracking-widest text-center">Standby...</div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </>
      ) : (
        <Card
          id="CONSOLE_DATA_PROBE"
          title="SENTINEL_CONSOLE_MATRIX"
          variant="blue"
          className="flex-1"
          onProbe={() => onProbeClick('CONSOLE_DATA_PROBE', { lastCommand: terminalHistory[terminalHistory.length - 1] || '' })}
          onBrain={() => onBrainClick('CONSOLE_DATA_PROBE', 'Terminal Interface', { historyDepth: terminalHistory.length })}
          onLauncherSelect={(pid, type) => onLauncherSelect(pid, type)}
          slotConfig={settings.panelSlots['CONSOLE_DATA_PROBE']}
          globalLowSlot={settings.globalLowSlot}
          permissions={settings.slotPermissions['CONSOLE_DATA_PROBE']}
          isProcessing={processingId === 'CONSOLE_DATA_PROBE'}
          platform={settings.platform}
        >
           <div className="flex-1 p-6 font-mono text-[13px] overflow-y-auto no-scroll bg-black/80 space-y-1 rounded-sm border border-zinc-900/40">
              {terminalHistory.map((line, i) => (
                <div key={i} className="whitespace-pre-wrap">
                  {line.startsWith('root@kali') || line.startsWith('PS C:') ? <span className="text-green-500 font-bold">{line}</span> : line.startsWith('[ERROR]') ? <span className="text-red-500 font-bold">{line}</span> : <span className="text-zinc-300">{line}</span>}
                </div>
              ))}
              <div ref={terminalEndRef} />
           </div>
           <div className="h-12 border-t border-zinc-900 bg-black/40 flex items-center px-6 mt-2">
              <form onSubmit={handleConsoleSubmit} className="flex-1 flex items-center gap-3">
                 <span className="text-teal-500 font-black">{isLocal ? 'admin@sentinel' : 'kali@remote'}:~#</span>
                 <input 
                    ref={consoleInputRef} value={consoleInput} onChange={e => setConsoleInput(e.target.value)}
                    className="flex-1 bg-transparent border-none outline-none text-white selection:bg-teal-500/30"
                    placeholder="Transmit command..." autoFocus
                 />
              </form>
           </div>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;
