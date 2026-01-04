
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { OperationalMode, SessionInfo, CoreStats, AppSettings, Platform } from './types';
import Card from './components/common/Card';
import Tooltip from './components/common/Tooltip';
import TacticalButton from './components/common/TacticalButton';
import Modal from './components/common/Modal';
import { launcherSystem } from './services/launcherService';

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
  onLauncherSelect: (id: string, type: 'low' | 'medium' | 'high') => void;
  onAdapterCommand: (cmd: string) => void;
  onRefresh: () => void;
  processingId?: string;
  latestCoreProbeResult?: any;
  activeTelemetry?: Set<string>;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  mode, session, stats, settings, setSettings, terminalHistory, onHandshake, onDisconnect, onBrainClick, onProbeClick, onProbeInfo, onLauncherSelect, onAdapterCommand, processingId, latestCoreProbeResult, activeTelemetry
}) => {
  const [ipInput, setIpInput] = useState('10.121.41.108');
  const [user, setUser] = useState('kali');
  const [pass, setPass] = useState('');
  const [port, setPort] = useState(22);
  const [terminalMode, setTerminalMode] = useState(false);
  const [consoleInput, setConsoleInput] = useState('');
  const [serviceInAudit, setServiceInAudit] = useState<'telemetry' | 'neural' | null>(null);

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

  const toggleService = (type: 'telemetry' | 'neural') => {
    setSettings(prev => ({
      ...prev,
      [type === 'telemetry' ? 'telemetryEnabled' : 'neuralUplinkEnabled']: !prev[type === 'telemetry' ? 'telemetryEnabled' : 'neuralUplinkEnabled']
    }));
  };

  useEffect(() => {
    if (terminalMode && consoleInputRef.current) consoleInputRef.current.focus();
  }, [terminalMode]);

  const getLauncherColor = (panelId: string) => {
    const slot = settings.panelSlots[panelId]?.mediumSlot;
    const id = slot?.launcherId || 'std-core';
    return launcherSystem.getById(id)?.color || '#bd00ff';
  };

  const statusIndicatorColor = useMemo(() => {
    if (!isConnected && !isLocal) return '#ef4444';
    if (isLocal) return platformAccent;
    return '#22c55e';
  }, [isConnected, isLocal, platformAccent]);

  let handshakeVariant: 'blue' | 'green' | 'offline' = isLocal ? (stats ? 'blue' : 'offline') : (isConnected ? 'green' : 'offline');

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
            onProbe={() => isConnected && onProbeClick('GLOBAL_SYSTEM_PROBE', { stats, mode, activeFocus: Array.from(activeTelemetry || []) })}
            onBrain={() => onBrainClick('GLOBAL_SYSTEM_PROBE', 'Neural Hub Intelligence', { latestResult: latestCoreProbeResult })}
            onLauncherSelect={(pid, type) => onLauncherSelect(pid, type)}
            probeColor={getLauncherColor('GLOBAL_SYSTEM_PROBE')}
            platform={settings.platform}
          >
            <div className="flex flex-col h-full">
              <div className="flex justify-center gap-12 mb-6 border-b border-zinc-900/40 pb-3 shrink-0">
                  <Tooltip name="TELEMETRY_UPLINK" source="SYSTEM" desc="Click to inspect Telemetry Service status.">
                    <button 
                      onClick={() => setServiceInAudit('telemetry')}
                      className="flex items-center gap-3 group"
                    >
                        <div className={`w-2.5 h-2.5 rounded-full transition-all duration-500 ${settings.telemetryEnabled && isConnected ? 'bg-teal-500 glow-teal shadow-[0_0_10px_#00ffd5]' : 'bg-red-500 shadow-[0_0_10px_#ff3e3e]'}`}></div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-white transition-colors">Telemetry_Uplink</span>
                    </button>
                  </Tooltip>

                  <Tooltip name="NEURAL_LINK" source="SYSTEM" desc="Click to inspect Neural Link status.">
                    <button 
                      onClick={() => setServiceInAudit('neural')}
                      className="flex items-center gap-3 group"
                    >
                        <div className={`w-2.5 h-2.5 rounded-full transition-all duration-500 ${settings.neuralUplinkEnabled ? 'bg-purple-500 glow-purple shadow-[0_0_10px_#bd00ff]' : 'bg-red-500 shadow-[0_0_10px_#ff3e3e]'}`}></div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-white transition-colors">Neural_Link</span>
                    </button>
                  </Tooltip>
              </div>

              <div className="flex items-center justify-between gap-8 flex-1 min-h-0 px-4">
                <div className="flex-1 text-[10px] font-mono text-zinc-500 leading-relaxed border-r border-zinc-900/30 pr-4 h-full overflow-y-auto no-scroll flex flex-col justify-center">
                  <div className="text-[9px] text-zinc-700 font-black uppercase tracking-widest mb-2 border-b border-zinc-900/20 pb-1">Heuristic_Buffer</div>
                  {latestCoreProbeResult ? (
                    <div className="animate-in fade-in duration-500">
                      <div className="text-purple-400 font-black mb-1 uppercase tracking-tighter">Status: {latestCoreProbeResult.status}</div>
                      <div className="text-zinc-400 italic">"{latestCoreProbeResult.description}"</div>
                    </div>
                  ) : (
                    <div className="text-zinc-800 italic uppercase text-[8px] tracking-widest animate-pulse text-center">Awaiting System Scan...</div>
                  )}
                </div>

                <div className="flex flex-col items-center justify-center relative group w-64 shrink-0">
                    <button 
                      onClick={() => onProbeClick('GLOBAL_SYSTEM_PROBE', { stats, mode, activeFocus: Array.from(activeTelemetry || []) })}
                      disabled={isProbeActive || !isConnected}
                      className={`relative w-64 h-20 bg-[#050608] border-x border-b border-purple-500/60 shadow-2xl flex flex-col items-center justify-center transition-all group-hover:border-purple-400 group-hover:shadow-[0_0_30px_rgba(189,0,255,0.2)] disabled:opacity-50 overflow-hidden ${isConnected ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                    >
                      <span className={`text-[12px] font-black uppercase tracking-[0.6em] transition-colors ${isProbeActive ? 'text-white animate-pulse' : 'text-purple-400'}`}>
                        {isProbeActive ? 'SCANNING...' : 'CORE PROBE'}
                      </span>
                    </button>
                </div>

                <div className="flex-1 text-[10px] font-mono text-zinc-500 leading-relaxed border-l border-zinc-900/30 pl-4 h-full overflow-y-auto no-scroll flex flex-col justify-center">
                   <div className="text-[9px] text-zinc-700 font-black uppercase tracking-widest mb-2 border-b border-zinc-900/20 pb-1">Directives</div>
                  {latestCoreProbeResult ? (
                    <div className="animate-in fade-in duration-500">
                      <div className="text-teal-500 font-black mb-1 uppercase tracking-tighter">Recommendation:</div>
                      <div className="text-zinc-300 font-bold border-l-2 border-teal-500/30 pl-3 leading-tight">{latestCoreProbeResult.recommendation}</div>
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
        <div className="flex-1 flex flex-col bg-black/60 border border-zinc-900/60 rounded-sm relative overflow-hidden">
           <div className="h-10 border-b border-zinc-900 bg-zinc-950/40 flex items-center justify-between px-6">
              <span className="text-[10px] font-black text-teal-500 uppercase tracking-widest">SENTINEL_CONSOLE</span>
              <TacticalButton 
                label="PROBE_CMD" 
                size="sm" 
                onClick={() => onProbeClick('CONSOLE_DATA_PROBE', { lastCommand: consoleInput })} 
                color="#bd00ff"
              />
           </div>
           <div className="flex-1 p-6 font-mono text-[13px] overflow-y-auto no-scroll bg-black/80 space-y-1">
              {terminalHistory.map((line, i) => (
                <div key={i} className="whitespace-pre-wrap">
                  {line.startsWith('root@kali') || line.startsWith('PS C:') ? <span className="text-green-500 font-bold">{line}</span> : line.startsWith('[ERROR]') ? <span className="text-red-500 font-bold">{line}</span> : <span className="text-zinc-300">{line}</span>}
                </div>
              ))}
              <div ref={terminalEndRef} />
           </div>
           <div className="h-12 border-t border-zinc-900 bg-black/40 flex items-center px-6">
              <form onSubmit={handleConsoleSubmit} className="flex-1 flex items-center gap-3">
                 <span className="text-teal-500 font-black">{isLocal ? 'admin@sentinel' : 'kali@remote'}:~#</span>
                 <input 
                    ref={consoleInputRef} value={consoleInput} onChange={e => setConsoleInput(e.target.value)}
                    className="flex-1 bg-transparent border-none outline-none text-white selection:bg-teal-500/30"
                    placeholder="Transmit command..." autoFocus
                 />
              </form>
           </div>
        </div>
      )}

      {/* Service Control Modal */}
      <Modal 
        isOpen={!!serviceInAudit} 
        onClose={() => setServiceInAudit(null)} 
        title={serviceInAudit === 'telemetry' ? 'TELEMETRY_UPLINK_AUDIT' : 'NEURAL_LINK_AUDIT'}
        variant={serviceInAudit === 'telemetry' ? 'teal' : 'purple'}
      >
        <div className="space-y-6">
          <div className="p-6 bg-black/40 border border-zinc-900 rounded-sm">
            <h3 className="text-[12px] font-black uppercase tracking-widest text-zinc-300 mb-4 border-b border-zinc-900 pb-2">Service_Description</h3>
            <p className="text-[11px] text-zinc-500 italic leading-relaxed">
              {serviceInAudit === 'telemetry' 
                ? "Aggregates real-time metric streams from the 5050 Sentinel daemon. Provides the foundation for spectral analysis and system-wide telemetry visualization."
                : "Establishes a synaptic bridge to the AI reasoning core. Necessary for heuristic audits, anomaly classification, and strategic recommendations."
              }
            </p>
          </div>

          <div className="flex items-center justify-between p-6 border border-zinc-900 bg-zinc-950/30">
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Active_State</span>
              <span className={`text-[12px] font-mono font-black ${(serviceInAudit === 'telemetry' ? settings.telemetryEnabled : settings.neuralUplinkEnabled) ? 'text-green-500' : 'text-red-500'}`}>
                {(serviceInAudit === 'telemetry' ? settings.telemetryEnabled : settings.neuralUplinkEnabled) ? 'ENABLED' : 'DISABLED'}
              </span>
            </div>
            
            <button 
              onClick={() => toggleService(serviceInAudit!)}
              className={`px-8 py-3 text-[10px] font-black uppercase tracking-widest transition-all border ${
                (serviceInAudit === 'telemetry' ? settings.telemetryEnabled : settings.neuralUplinkEnabled)
                  ? 'bg-red-500/10 border-red-500 text-red-500 hover:bg-red-500 hover:text-white'
                  : 'bg-teal-500/10 border-teal-500 text-teal-500 hover:bg-teal-500 hover:text-white'
              }`}
            >
              {(serviceInAudit === 'telemetry' ? settings.telemetryEnabled : settings.neuralUplinkEnabled) ? 'DISABLE_SERVICE' : 'ENABLE_SERVICE'}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="bg-black/60 p-4 border border-zinc-900">
                <span className="text-[8px] text-zinc-700 font-black uppercase block mb-1">Latency</span>
                <span className="text-[10px] text-zinc-400 font-mono">12ms (NOMINAL)</span>
             </div>
             <div className="bg-black/60 p-4 border border-zinc-900">
                <span className="text-[8px] text-zinc-700 font-black uppercase block mb-1">Load</span>
                <span className="text-[10px] text-zinc-400 font-mono">0.2% (OPTIMAL)</span>
             </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Dashboard;
