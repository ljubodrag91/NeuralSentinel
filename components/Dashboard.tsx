
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { OperationalMode, SessionInfo, PiStats, AppSettings } from '../types';
import Card from './common/Card';
import Tooltip from './common/Tooltip';
import TacticalButton from './common/TacticalButton';
import BrainIcon from './components/common/BrainIcon';
import { launcherSystem } from '../services/launcherService';

interface DashboardProps {
  mode: OperationalMode;
  session: SessionInfo;
  stats: PiStats | null;
  settings: AppSettings;
  terminalHistory: string[];
  onHandshake: (ip: string, username: string, password: string, port: number) => void;
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
  mode, session, stats, settings, terminalHistory, onHandshake, onDisconnect, onLog, onBrainClick, onProbeClick, onProbeInfo, onLauncherSelect, onAdapterCommand, onRefresh, processingId, latestCoreProbeResult, activeTelemetry
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
      const keys = Object.keys(stats.network.interfaces);
      return Array.from(new Set([...base, ...keys]));
    }
    return base;
  }, [stats]);

  useEffect(() => {
    if (session.targetIp) setIpInput(session.targetIp);
  }, [session.targetIp]);

  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [terminalHistory]);

  const getInterfaceData = (name: string) => {
    if (mode === OperationalMode.SIMULATED) {
      return { 
        up: ['wlan0', 'wlan1', 'eth0', 'lo'].includes(name), 
        ip: name === 'wlan0' ? '192.168.1.104' : (name === 'wlan1' ? '10.0.0.15' : (name === 'eth0' ? '10.0.5.12' : '127.0.0.1')) 
      };
    }
    const realData = stats?.network?.interfaces?.[name];
    const isUp = realData?.up || (!!session.targetIp && name === 'wlan0');
    const displayIp = realData?.ip || (!!session.targetIp && name === 'wlan0' ? session.targetIp : 'OFFLINE');
    return { up: isUp, ip: displayIp };
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
    if (terminalMode && consoleInputRef.current) {
      consoleInputRef.current.focus();
    }
  }, [terminalMode]);

  const getLauncherColor = (panelId: string) => {
    const id = settings.probeLaunchers[panelId];
    return launcherSystem.getById(id)?.color || '#bd00ff';
  };

  return (
    <div className="space-y-6 h-full flex flex-col no-scroll overflow-hidden pb-4">
      <div className="flex justify-between items-center px-2 shrink-0">
        <div className="flex items-center gap-4">
          <Tooltip name="DASHBOARD_STREAM" source="SYSTEM" desc="Real-time tactical data stream toggle and status monitor.">
            <span className="text-[10px] font-black text-zinc-700 uppercase tracking-widest cursor-help">Dashboard_Stream</span>
          </Tooltip>
          {isConnected && (
            <Tooltip name="TERMINAL_OVERLAY" source="SYSTEM" desc="Engage/Disengage the interactive bash console overlay.">
              <button 
                type="button"
                onClick={() => setTerminalMode(!terminalMode)}
                className={`px-4 py-1.5 border text-[9px] font-black uppercase tracking-widest transition-all ${terminalMode ? 'bg-teal-500/10 border-teal-500 text-teal-400' : 'bg-zinc-950 border-zinc-800 text-zinc-600 hover:text-white'}`}
              >
                {terminalMode ? 'DISENGAGE_TERMINAL' : 'ENGAGE_TERMINAL_OVERLAY'}
              </button>
            </Tooltip>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
          <div className="text-[9px] font-mono text-zinc-800 uppercase">STN_NODE_STATUS: {isConnected ? 'LINKED' : 'VOID'}</div>
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
              className="flex-1"
              probeColor={getLauncherColor('HANDSHAKE_CORE')}
            >
              <div className="space-y-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black text-zinc-700 uppercase tracking-widest">Target_Link</label>
                  <input value={ipInput ?? ""} onChange={e => setIpInput(e.target.value)} disabled={isConnected} className={`bg-black/50 border border-zinc-900 p-2 text-[11px] font-mono outline-none ${isConnected ? 'text-teal-500/50 cursor-not-allowed' : 'text-white'}`} placeholder="0.0.0.0" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[8px] font-black text-zinc-800 uppercase tracking-widest">User</label>
                    <input value={user ?? ""} onChange={e => setUser(e.target.value)} disabled={isConnected} className="bg-black/50 border border-zinc-900 p-1.5 text-[10px] font-mono text-zinc-400 outline-none" placeholder="user" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[8px] font-black text-zinc-800 uppercase tracking-widest">Pass</label>
                    <input type="password" value={pass ?? ""} onChange={e => setPass(e.target.value)} disabled={isConnected} className="bg-black/50 border border-zinc-900 p-1.5 text-[10px] font-mono text-zinc-400 outline-none" placeholder="pass" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[8px] font-black text-zinc-800 uppercase tracking-widest">Port</label>
                    <input type="number" value={port ?? 22} onChange={e => setPort(Number(e.target.value))} disabled={isConnected} className="bg-black/50 border border-zinc-900 p-1.5 text-[10px] font-mono text-zinc-400 outline-none" />
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={isConnected ? onDisconnect : () => onHandshake(ipInput, user, pass, port)} 
                  disabled={!!processingId}
                  className={`w-full py-3 text-[10px] font-black border transition-all uppercase tracking-widest ${isConnected ? 'border-red-900/40 text-red-500 hover:bg-red-500/10' : 'border-zinc-800 text-zinc-600 hover:text-white hover:border-zinc-500'} ${processingId ? 'opacity-30' : ''}`}
                >
                  {processingId === 'HANDSHAKE_CORE' ? 'SYNCING...' : (isConnected ? 'TERMINATE_SESSION' : 'INITIALIZE_HANDSHAKE')}
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
              className="flex-1"
              probeColor={getLauncherColor('ADAPTER_HUB')}
            >
              <div className="flex flex-col gap-2 max-h-40 overflow-y-auto no-scroll">
                {adapters.map(name => {
                  const data = getInterfaceData(name);
                  return (
                    <div key={name} onClick={() => onAdapterCommand(`ip a show ${name}`)} className={`px-4 py-2 border border-zinc-900/40 bg-black/20 flex justify-between items-center transition-all cursor-pointer group hover:bg-teal-500/5 ${!data.up ? 'opacity-30' : ''}`}>
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
            className="relative overflow-visible shrink-0 pb-6 flex-1 max-h-[300px]"
            onProbe={() => onProbeClick('GLOBAL_SYSTEM_AUDIT', { stats, mode, activeFocus: Array.from(activeTelemetry || []) })} 
            onProbeInfo={() => onProbeInfo('GLOBAL_SYSTEM_AUDIT', { stats, mode, activeFocus: Array.from(activeTelemetry || []) })}
            onBrain={() => onBrainClick('MASTER_LINK', 'Neural Hub Intelligence', { latestResult: latestCoreProbeResult })}
            onLauncherSelect={(type) => onLauncherSelect('GLOBAL_SYSTEM_AUDIT', type)}
            isProcessing={processingId === 'MASTER_LINK'}
            probeColor={getLauncherColor('GLOBAL_SYSTEM_AUDIT')}
          >
            <div className="flex items-center justify-between gap-8 h-full">
              <div className="flex-1 text-[10px] font-mono text-zinc-500 leading-relaxed border-r border-zinc-900/30 pr-4 h-full overflow-y-auto no-scroll flex flex-col justify-center">
                {latestCoreProbeResult ? (
                  <div className="animate-in fade-in duration-500">
                    <div className="text-purple-400 font-black mb-1 uppercase tracking-tighter">Status: {latestCoreProbeResult.status}</div>
                    <div className="text-zinc-400 italic">"{latestCoreProbeResult.description}"</div>
                  </div>
                ) : (
                  <div className="text-zinc-800 italic uppercase text-[8px] tracking-widest text-center animate-pulse">Awaiting Neural Link...</div>
                )}
              </div>

              <div className="flex flex-col items-center justify-center relative w-64 shrink-0">
                 <div className={`relative w-64 h-20 bg-[#050608] border shadow-2xl flex flex-col items-center justify-center transition-all ${isProbeActive ? 'animate-pulse' : ''}`} style={{ borderColor: getLauncherColor('GLOBAL_SYSTEM_AUDIT') }}>
                    <span className={`text-[12px] font-black uppercase tracking-[0.6em]`} style={{ color: getLauncherColor('GLOBAL_SYSTEM_AUDIT') }}>
                      {isProbeActive ? 'SCANNING...' : 'CORE PROBE'}
                    </span>
                 </div>
              </div>

              <div className="flex-1 text-[10px] font-mono text-zinc-500 leading-relaxed border-l border-zinc-900/30 pl-4 h-full overflow-y-auto no-scroll flex flex-col justify-center">
                {latestCoreProbeResult ? (
                  <div className="animate-in fade-in duration-500">
                    <div className="text-teal-500 font-black mb-1 uppercase tracking-tighter">Recommendation:</div>
                    <div className="text-zinc-300 font-bold">{latestCoreProbeResult.recommendation}</div>
                  </div>
                ) : (
                  <div className="text-zinc-800 italic uppercase text-[8px] tracking-widest text-center">System Matrix Ready.</div>
                )}
              </div>
            </div>
          </Card>
        </>
      ) : (
        <div className="flex-1 flex flex-col bg-black/60 border border-zinc-900/60 rounded-sm relative overflow-hidden">
           <div className="h-10 border-b border-zinc-900 bg-zinc-950/40 flex items-center justify-between px-6">
              <span className="text-[10px] font-black text-teal-500 uppercase tracking-widest">KALI_INTERACTIVE_CONSOLE</span>
              <div className="flex gap-4">
                 <button onClick={() => onProbeInfo('TERMINAL_COMMAND_AUDIT', { lastCommand: consoleInput })} className="w-3.5 h-3.5 rounded-full bg-purple-500/40 hover:bg-purple-400 border border-purple-900" title="Payload Audit" />
                 <TacticalButton label="PROBE" onClick={() => onProbeClick('TERMINAL_COMMAND_AUDIT', { lastCommand: consoleInput })} size="sm" color={getLauncherColor('TERMINAL_COMMAND_AUDIT')} />
              </div>
           </div>

           <div className="flex-1 p-6 font-mono text-[13px] overflow-y-auto no-scroll bg-black/80">
              <div className="space-y-1">
                 {terminalHistory.map((line, i) => (
                   <div key={i} className="whitespace-pre-wrap">
                     {line.startsWith('root@kali') ? (
                       <span className="text-green-500 font-bold">{line}</span>
                     ) : line.startsWith('[ERROR]') ? (
                       <span className="text-red-500 font-bold">{line}</span>
                     ) : (
                       <span className="text-zinc-300">{line}</span>
                     )}
                   </div>
                 ))}
                 <div ref={terminalEndRef} />
              </div>
           </div>

           <div className="h-12 border-t border-zinc-900 bg-black/40 flex items-center px-6">
              <form onSubmit={handleConsoleSubmit} className="flex-1 flex items-center gap-3">
                 <span className="text-teal-500 font-black">root@kali:~#</span>
                 <input 
                    ref={consoleInputRef}
                    value={consoleInput}
                    onChange={e => setConsoleInput(e.target.value)}
                    className="flex-1 bg-transparent border-none outline-none text-white selection:bg-teal-500/30"
                    placeholder="Enter command..."
                    autoFocus
                 />
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
