
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { OperationalMode, SessionInfo, PiStats, AppSettings } from './types';
import Card from './components/common/Card';
import Tooltip from './components/common/Tooltip';
import { launcherSystem } from './services/launcherService';

interface DashboardProps {
  mode: OperationalMode;
  session: SessionInfo;
  stats: PiStats | null;
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
  processingId?: string;
  latestCoreProbeResult?: any;
  activeTelemetry?: Set<string>;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  mode, session, stats, settings, terminalHistory, onHandshake, onDisconnect, onBrainClick, onProbeClick, onProbeInfo, onLauncherSelect, onAdapterCommand, processingId, latestCoreProbeResult, activeTelemetry
}) => {
  const [ipInput, setIpInput] = useState('10.121.41.108');
  const [user, setUser] = useState('kali');
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
  const isProbeActive = processingId === 'GLOBAL_SYSTEM_AUDIT';

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
    const id = settings.probeLaunchers[panelId];
    return launcherSystem.getById(id)?.color || '#bd00ff';
  };

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
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
          <div className="text-[9px] font-mono text-zinc-800 uppercase">STN_NODE: {isConnected ? 'LINKED' : 'VOID'}</div>
        </div>
      </div>

      {!terminalMode ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch shrink-0">
            <Card 
              id="HANDSHAKE_CORE"
              title="HANDSHAKE_NODE" 
              variant={isConnected ? 'real' : 'offline'}
              onProbe={() => onProbeClick('HANDSHAKE_CORE', { ipInput, user, port })}
              onProbeInfo={() => onProbeInfo('HANDSHAKE_CORE', { ipInput, user, port })}
              onBrain={() => onBrainClick('handshake_panel', 'Connection Link', { ipInput, user, status: session.status })}
              onLauncherSelect={(type) => onLauncherSelect('HANDSHAKE_CORE', type)}
              isProcessing={processingId === 'HANDSHAKE_CORE'}
              probeColor={getLauncherColor('HANDSHAKE_CORE')}
            >
              <div className="space-y-4">
                <input value={ipInput} onChange={e => setIpInput(e.target.value)} disabled={isConnected} className={`bg-black/50 border border-zinc-900 p-2 text-[11px] font-mono outline-none w-full ${isConnected ? 'text-teal-500/50' : 'text-white'}`} placeholder="0.0.0.0" />
                <div className="grid grid-cols-3 gap-3">
                  <input value={user} onChange={e => setUser(e.target.value)} disabled={isConnected} className="bg-black/50 border border-zinc-900 p-1.5 text-[10px] font-mono outline-none" placeholder="user" />
                  <input type="password" value={pass} onChange={e => setPass(e.target.value)} disabled={isConnected} className="bg-black/50 border border-zinc-900 p-1.5 text-[10px] font-mono outline-none" placeholder="pass" />
                  <input type="number" value={port} onChange={e => setPort(Number(e.target.value))} disabled={isConnected} className="bg-black/50 border border-zinc-900 p-1.5 text-[10px] font-mono outline-none" />
                </div>
                <button 
                  onClick={isConnected ? onDisconnect : () => onHandshake(ipInput, user, pass, port)} 
                  className={`w-full py-3 text-[10px] font-black border transition-all tracking-widest uppercase ${isConnected ? 'border-red-900/40 text-red-500 hover:bg-red-500/10' : 'border-zinc-800 text-zinc-600 hover:text-white'}`}
                >
                  {isConnected ? 'TERMINATE_SESSION' : 'INITIALIZE_HANDSHAKE'}
                </button>
              </div>
            </Card>

            <Card 
              id="ADAPTER_HUB"
              title="ADAPTER_MATRIX" 
              variant={isConnected ? 'real' : 'offline'} 
              onProbe={() => onProbeClick('ADAPTER_HUB', { stats })} 
              onProbeInfo={() => onProbeInfo('ADAPTER_HUB', { stats })}
              onBrain={() => onBrainClick('adapter_hub', 'Network Matrix', { stats })} 
              onLauncherSelect={(type) => onLauncherSelect('ADAPTER_HUB', type)}
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
            id="GLOBAL_SYSTEM_AUDIT"
            title="MASTER_INTELLIGENCE_LINK" 
            variant="purple" 
            className="relative overflow-visible shrink-0 pb-6 flex-1 max-h-[350px]"
            // Header actions: Brain and Launcher Config restored
            onBrain={() => onBrainClick('MASTER_LINK', 'Neural Hub Intelligence', { latestResult: latestCoreProbeResult })}
            onLauncherSelect={(type) => onLauncherSelect('GLOBAL_SYSTEM_AUDIT', type)}
            probeColor={getLauncherColor('GLOBAL_SYSTEM_AUDIT')}
          >
            <div className="flex flex-col h-full">
              {/* STATUS CIRCLES RESTORED */}
              <div className="flex justify-center gap-6 mb-4 border-b border-zinc-900/30 pb-2 shrink-0">
                  <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-teal-500 glow-teal' : 'bg-red-500'}`}></div>
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
                        onClick={() => onProbeClick('GLOBAL_SYSTEM_AUDIT', { stats, mode, activeFocus: Array.from(activeTelemetry || []) })}
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
                 <span className="text-teal-500 font-black">root@kali:~#</span>
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
