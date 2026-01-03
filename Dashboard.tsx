import React, { useState, useEffect, useMemo, useRef } from 'react';
import { OperationalMode, SessionInfo, PiStats } from './types';
import Card from './components/common/Card';
import Tooltip from './components/common/Tooltip';
import TacticalButton from './components/common/TacticalButton';
import BrainIcon from './components/common/BrainIcon';

interface DashboardProps {
  mode: OperationalMode;
  session: SessionInfo;
  stats: PiStats | null;
  onHandshake: (ip: string, username: string, password: string, port: number) => void;
  onDisconnect: () => void;
  onLog: (msg: string, level?: any) => void;
  onBrainClick: (id: string, type: string, metrics: any) => void;
  onProbeClick: (panel: string, metrics: any) => void;
  onAdapterCommand: (cmd: string) => void;
  onRefresh: () => void;
  processingId?: string;
  latestCoreProbeResult?: any;
  activeTelemetry?: Set<string>;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  mode, session, stats, onHandshake, onDisconnect, onLog, onBrainClick, onProbeClick, onAdapterCommand, onRefresh, processingId, latestCoreProbeResult, activeTelemetry
}) => {
  const [ipInput, setIpInput] = useState('10.121.41.108');
  const [user, setUser] = useState('kali');
  const [pass, setPass] = useState('');
  const [port, setPort] = useState(22);
  const [terminalMode, setTerminalMode] = useState(false);
  const [consoleInput, setConsoleInput] = useState('');
  const consoleInputRef = useRef<HTMLInputElement>(null);
  
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

  const getDynamicVariant = () => {
    if (mode === OperationalMode.SIMULATED) return 'sim';
    return isConnected ? 'real' : 'offline';
  };

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
                onClick={() => setTerminalMode(!terminalMode)}
                className={`px-4 py-1.5 border text-[9px] font-black uppercase tracking-widest transition-all ${terminalMode ? 'bg-teal-500/10 border-teal-500 text-teal-400' : 'bg-zinc-950 border-zinc-800 text-zinc-600 hover:text-white'}`}
              >
                {terminalMode ? 'DISENGAGE_TERMINAL' : 'ENGAGE_TERMINAL_OVERLAY'}
              </button>
            </Tooltip>
          )}
        </div>
        <Tooltip name="NODE_STATUS" source={isConnected ? 'LINKED' : 'READY'} desc="Handshake bridge integrity state.">
          <div className="text-[9px] font-mono text-zinc-800 uppercase cursor-help">STN_NODE_STATUS: {isConnected ? 'LINKED' : 'READY'}</div>
        </Tooltip>
      </div>

      {!terminalMode ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch shrink-0">
            <Card 
              title="HANDSHAKE_NODE" 
              titleTooltip="Primary SSH authentication node. SCANNING consumes 1 CORE CHARGE (Purple Launcher)."
              variant={getDynamicVariant()}
              onProbe={() => onProbeClick('HANDSHAKE_CORE', { ipInput, user, port })}
              onBrain={() => onBrainClick('handshake_panel', 'Connection Link', { ipInput, user, status: session.status })}
              isProcessing={processingId === 'HANDSHAKE_CORE'}
              className="flex-1"
              probeColor="#bd00ff"
            >
              <div className="space-y-4">
                <div className="flex flex-col gap-1">
                  <Tooltip name="TARGET_LINK" source="CONFIG" desc="Destination IP address for the remote Kali Linux node.">
                    <label className="text-[10px] font-black text-zinc-700 uppercase tracking-widest cursor-help">Target_Link</label>
                  </Tooltip>
                  <input value={ipInput} onChange={e => setIpInput(e.target.value)} disabled={isConnected} className={`bg-black/50 border border-zinc-900 p-2 text-[11px] font-mono outline-none ${isConnected ? 'text-teal-500/50 cursor-not-allowed' : 'text-white'}`} placeholder="0.0.0.0" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="flex flex-col gap-1">
                    <Tooltip name="USER_ID" source="CONFIG" desc="SSH username for authentication.">
                      <label className="text-[8px] font-black text-zinc-800 uppercase tracking-widest cursor-help">User</label>
                    </Tooltip>
                    <input value={user} onChange={e => setUser(e.target.value)} disabled={isConnected} className="bg-black/50 border border-zinc-900 p-1.5 text-[10px] font-mono text-zinc-400 outline-none" placeholder="user" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Tooltip name="AUTH_SECRET" source="CONFIG" desc="SSH password or keyphrase for authentication.">
                      <label className="text-[8px] font-black text-zinc-800 uppercase tracking-widest cursor-help">Pass</label>
                    </Tooltip>
                    <input type="password" value={pass} onChange={e => setPass(e.target.value)} disabled={isConnected} className="bg-black/50 border border-zinc-900 p-1.5 text-[10px] font-mono text-zinc-400 outline-none" placeholder="pass" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Tooltip name="COM_PORT" source="CONFIG" desc="Target SSH port (Default: 22).">
                      <label className="text-[8px] font-black text-zinc-800 uppercase tracking-widest cursor-help">Port</label>
                    </Tooltip>
                    <input type="number" value={port} onChange={e => setPort(Number(e.target.value))} disabled={isConnected} className="bg-black/50 border border-zinc-900 p-1.5 text-[10px] font-mono text-zinc-400 outline-none" />
                  </div>
                </div>
                <Tooltip name="HANDSHAKE_TRIGGER" source="SYSTEM" desc="Initiate encrypted SSH handshake with the remote target.">
                  <button 
                    onClick={isConnected ? onDisconnect : () => onHandshake(ipInput, user, pass, port)} 
                    disabled={!!processingId}
                    className={`w-full py-3 text-[10px] font-black border transition-all uppercase tracking-widest ${isConnected ? 'border-red-900/40 text-red-500 hover:bg-red-500/10' : 'border-zinc-800 text-zinc-600 hover:text-white hover:border-zinc-500'} ${processingId ? 'opacity-30' : ''}`}
                  >
                    {processingId === 'HANDSHAKE_CORE' ? 'SYNCING...' : (isConnected ? 'TERMINATE_SESSION' : 'INITIALIZE_HANDSHAKE')}
                  </button>
                </Tooltip>
              </div>
            </Card>

            <Card 
              title="ADAPTER_MATRIX" 
              titleTooltip="Network interface map. SCANNING consumes 1 CORE CHARGE (Purple Launcher)."
              variant={getDynamicVariant()} 
              onProbe={() => onProbeClick('ADAPTER_HUB', { stats })} 
              onBrain={() => onBrainClick('adapter_hub', 'Network Matrix', { stats })} 
              isProcessing={processingId === 'ADAPTER_HUB'}
              className="flex-1"
              probeColor="#bd00ff"
            >
              <div className="flex flex-col gap-2 max-h-40 overflow-y-auto no-scroll">
                {adapters.map(name => {
                  const data = getInterfaceData(name);
                  return (
                    <Tooltip key={name} name={name.toUpperCase()} source={data.up ? 'REAL' : 'OFFLINE'} desc={`Network interface status and IP allocation. Click to inspect.`}>
                      <div onClick={() => onAdapterCommand(`ip a show ${name}`)} className={`px-4 py-2 border border-zinc-900/40 bg-black/20 flex justify-between items-center transition-all cursor-pointer group hover:bg-teal-500/5 ${!data.up ? 'opacity-30' : ''}`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-1.5 h-1.5 rounded-full ${data.up ? 'bg-green-500 glow-green' : 'bg-red-500'}`}></div>
                          <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest group-hover:text-teal-400">{name}</span>
                        </div>
                        <span className="text-[10px] font-mono text-zinc-600">{data.ip}</span>
                      </div>
                    </Tooltip>
                  );
                })}
              </div>
            </Card>
          </div>

          <Card 
            title="MASTER_INTELLIGENCE_LINK" 
            titleTooltip="Unified AI reasoning hub. SCANNING consumes 1 CORE CHARGE (Purple Launcher)."
            variant="purple" 
            className="relative overflow-visible shrink-0 pb-6 min-h-0 flex-1 max-h-[300px]"
            onBrain={() => onBrainClick('MASTER_LINK', 'Neural Hub Intelligence', { latestResult: latestCoreProbeResult })}
            isProcessing={processingId === 'MASTER_LINK'}
            probeColor="#bd00ff"
          >
            <div className="flex items-center justify-between gap-8 h-full">
              {/* Left Column: AI Diagnostics */}
              <div className="flex-1 text-[10px] font-mono text-zinc-500 leading-relaxed border-r border-zinc-900/30 pr-4 h-full max-h-40 overflow-y-auto no-scroll flex flex-col justify-center">
                {latestCoreProbeResult ? (
                  <div className="animate-in fade-in duration-500">
                    <Tooltip name="NEURAL_STATUS" source="AI" variant="purple" desc="AI-generated high-fidelity system status summary.">
                      <div className="text-purple-400 font-black mb-1 uppercase tracking-tighter cursor-help">Status: {latestCoreProbeResult.status}</div>
                    </Tooltip>
                    <div className="text-zinc-400 italic">"{latestCoreProbeResult.description}"</div>
                    {latestCoreProbeResult.anomalies && latestCoreProbeResult.anomalies.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <span className="text-[8px] text-zinc-700 uppercase font-black tracking-widest">Anomalies:</span>
                        {latestCoreProbeResult.anomalies.map((a: string, i: number) => (
                          <div key={i} className="text-red-400 text-[9px]">• {a}</div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-zinc-800 italic uppercase text-[8px] tracking-widest animate-pulse text-center">Awaiting Neural Data Link...</div>
                )}
              </div>

              {/* Central Column: Redesigned CORE PROBE Button as a Transistor CPU */}
              <div className="flex flex-col items-center justify-center relative group w-64 shrink-0">
                 {/* Top lead decorative elements (Leads) */}
                 <div className="absolute top-[-35px] flex gap-10 pointer-events-none opacity-20 group-hover:opacity-40 transition-opacity">
                    {[...Array(5)].map((_, i) => (
                      <div key={`lead-t-${i}`} className={`w-[1.5px] bg-purple-500 transition-all ${isProbeActive ? 'h-40 animate-pulse' : 'h-32'}`} style={{ animationDelay: `${i * 0.1}s` }}></div>
                    ))}
                 </div>
                 
                 {/* Substrate Frame */}
                 <div className="w-28 h-4 bg-[#0a0c0f] border-x border-t border-purple-500/30 rounded-t-sm mb-0 flex items-center justify-around px-2">
                    {[...Array(6)].map((_, i) => (
                      <div key={`pin-t-${i}`} className="w-1.5 h-1.5 bg-yellow-600/40 rounded-full"></div>
                    ))}
                 </div>

                 <div className="relative z-10">
                    <Tooltip name="CORE_PROBE" source="AI" variant="purple" desc="Engage systemic neural scan. Consumes 1 CORE CHARGE (Purple).">
                      <button 
                        onClick={() => onProbeClick('GLOBAL_SYSTEM_AUDIT', { stats, mode, activeFocus: Array.from(activeTelemetry || []) })} 
                        disabled={!!processingId} 
                        className={`relative w-64 h-24 bg-[#050608] border border-purple-500/60 shadow-[0_10px_40px_rgba(0,0,0,0.8)] flex flex-col items-center justify-center transition-all group-hover:border-purple-400 group-hover:shadow-[0_0_30px_rgba(189,0,255,0.2)] disabled:opacity-50 overflow-hidden cursor-pointer rounded-sm`}
                      >
                        {/* Chrome Heat Spreader Background Effect */}
                        <div className="absolute inset-2 bg-gradient-to-br from-zinc-800 via-zinc-900 to-black opacity-40 border border-zinc-800/50 pointer-events-none"></div>
                        
                        {/* Silicon Die Indicator (Internal Die) */}
                        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 border border-purple-500/40 bg-black flex items-center justify-center z-0 transition-all ${isProbeActive ? 'scale-125 border-teal-500' : 'scale-100'}`}>
                           <div className={`w-4 h-4 rounded-sm ${isProbeActive ? 'bg-teal-500 glow-teal animate-ping' : 'bg-purple-900 animate-pulse'}`}></div>
                        </div>

                        {/* Gold Corner Marker */}
                        <div className="absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2 border-yellow-600 opacity-60"></div>
                        
                        <div className="absolute top-2 left-4 text-[6px] text-zinc-700 font-mono tracking-tighter uppercase z-10">NPN_STNL_PRO_v2</div>
                        <div className="absolute bottom-2 right-4 text-[6px] text-zinc-700 font-mono tracking-tighter uppercase z-10">FAB: 0xAI_CORE</div>

                        <span className={`relative z-10 text-[13px] font-black uppercase tracking-[0.5em] transition-colors ${isProbeActive ? 'text-teal-400' : 'text-purple-400 group-hover:text-purple-100'}`}>
                          {isProbeActive ? 'EXECUTING...' : 'CORE PROBE'}
                        </span>

                        {/* Data Flow Lines (Chrome etched traces) */}
                        <div className="absolute inset-0 pointer-events-none opacity-10">
                           <div className="absolute top-1/2 left-0 w-full h-[1px] bg-white"></div>
                           <div className="absolute left-1/2 top-0 w-[1px] h-full bg-white"></div>
                        </div>

                        {/* Scanning Overlay */}
                        {isProbeActive && (
                          <div className="absolute inset-0 bg-purple-500/10 animate-pulse z-20">
                            <div className="absolute top-0 left-0 w-full h-1 bg-teal-500/50 animate-[scan_2s_infinite]"></div>
                          </div>
                        )}
                      </button>
                    </Tooltip>
                 </div>

                 {/* Bottom Leads (Pins) */}
                 <div className="flex gap-14 mt-[-1px] pointer-events-none opacity-20 group-hover:opacity-60 transition-opacity">
                    {[...Array(4)].map((_, i) => (
                      <div key={`lead-b-${i}`} className={`w-[2px] bg-purple-500/40 transition-all ${isProbeActive ? 'h-24 bg-teal-500' : 'h-16'}`} style={{ animationDelay: `${i * 0.15}s` }}></div>
                    ))}
                 </div>
                 <span className="absolute bottom-[-35px] text-[7px] font-black uppercase tracking-[0.4em] text-zinc-800 pointer-events-none whitespace-nowrap group-hover:text-zinc-600 transition-colors">Neural_Interface_Synchronized</span>
              </div>

              {/* Right Column: AI Recommendations */}
              <div className="flex-1 text-[10px] font-mono text-zinc-500 leading-relaxed border-l border-zinc-900/30 pl-4 h-full max-h-40 overflow-y-auto no-scroll flex flex-col justify-center">
                {latestCoreProbeResult ? (
                  <div className="animate-in fade-in duration-500">
                    <Tooltip name="TACTICAL_REC" source="AI" variant="teal" desc="Direct recommendation from the neural engine based on identified anomalies.">
                      <div className="text-teal-500 font-black mb-1 uppercase tracking-tighter cursor-help">Recommendation:</div>
                    </Tooltip>
                    <div className="text-zinc-300 font-bold">{latestCoreProbeResult.recommendation}</div>
                    {latestCoreProbeResult.threatLevel && (
                      <Tooltip name="THREAT_LEVEL" source="SYSTEM" desc="Assessed severity of identified system anomalies.">
                        <div className={`mt-2 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 w-fit rounded-sm cursor-help ${latestCoreProbeResult.threatLevel === 'CRITICAL' ? 'bg-red-500 text-white animate-pulse' : 'bg-zinc-800 text-zinc-400'}`}>
                          [Threat: {latestCoreProbeResult.threatLevel}]
                        </div>
                      </Tooltip>
                    )}
                  </div>
                ) : (
                  <div className="text-zinc-800 italic uppercase text-[8px] tracking-widest text-center">System Matrix Stable...</div>
                )}
              </div>
            </div>
          </Card>
        </>
      ) : (
        <div className="flex-1 flex flex-col bg-black/60 border border-zinc-900/60 rounded-sm relative overflow-hidden animate-in fade-in slide-in-from-bottom-4">
           {/* Terminal Header */}
           <div className="h-10 border-b border-zinc-900 bg-zinc-950/40 flex items-center justify-between px-6">
              <div className="flex items-center gap-4">
                 <Tooltip name="INTERACTIVE_SHELL" source="REAL" desc="Direct access to the remote Kali Linux terminal session.">
                   <span className="text-[10px] font-black text-teal-500 uppercase tracking-widest cursor-help">KALI_INTERACTIVE_CONSOLE</span>
                 </Tooltip>
                 <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></div>
              </div>
              <div className="flex items-center gap-4">
                <Tooltip name="TERMINAL_PROBE" source="AI" variant="purple" desc="Perform security audit on the current terminal context.">
                  <TacticalButton 
                    label={processingId === 'TERMINAL_COMMAND_AUDIT' ? 'SYNC' : 'PROBE_SHELL'} 
                    onClick={() => onProbeClick('TERMINAL_COMMAND_AUDIT', { lastCommand: consoleInput })} 
                    disabled={!!processingId}
                    size="sm" 
                    color="#bd00ff" 
                  />
                </Tooltip>
                <BrainIcon onClick={() => onBrainClick('terminal_overlay', 'Interactive Console', { state: 'ACTIVE' })} isProcessing={processingId === 'terminal_overlay'} className="!p-1 !w-6 !h-6" color="#00ffd5" />
              </div>
           </div>

           {/* Terminal Input Area */}
           <div className="flex-1 p-8 font-mono text-sm overflow-hidden flex flex-col justify-center">
              <div className="max-w-4xl mx-auto w-full">
                <Tooltip name="COMMAND_PROMPT" source="SYSTEM" desc="Enter bash commands for execution. Outputs are logged in the right-side console.">
                  <div className="text-zinc-600 mb-2 uppercase text-[9px] tracking-widest cursor-help">Awaiting_Input_Vector...</div>
                </Tooltip>
                <form onSubmit={handleConsoleSubmit} className="flex items-center gap-4 group">
                   <span className="text-teal-500 font-black text-lg">root@kali:~#</span>
                   <input 
                    ref={consoleInputRef}
                    value={consoleInput}
                    onChange={e => setConsoleInput(e.target.value)}
                    className="flex-1 bg-transparent border-none outline-none text-white text-lg placeholder:text-zinc-800 selection:bg-teal-500/30"
                    placeholder="Enter tactical command..."
                    autoFocus
                   />
                </form>
                <div className="mt-12 grid grid-cols-2 gap-8 border-t border-zinc-900/40 pt-8">
                   <div className="space-y-2">
                      <Tooltip name="SYSTEM_CONTEXT" source="SYSTEM" desc="Identified user and host context for current bridge session.">
                        <span className="text-[8px] font-black text-zinc-800 uppercase tracking-widest cursor-help">System_Context</span>
                      </Tooltip>
                      <div className="text-[10px] text-zinc-600 font-mono">
                         NODE: {stats?.system?.hostname || 'PENDING'}<br/>
                         USER: kali (privileged)<br/>
                         PROC: {stats?.processes?.total || 0} active
                      </div>
                   </div>
                   <div className="space-y-2 text-right">
                      <Tooltip name="QUICK_LAUNCH" source="SYSTEM" desc="Pre-configured commands for rapid execution.">
                        <span className="text-[8px] font-black text-zinc-800 uppercase tracking-widest cursor-help">Quick_Launch</span>
                      </Tooltip>
                      <div className="flex gap-2 justify-end">
                        {['nmap -F', 'ip addr', 'netdiscover', 'ls -la'].map(q => (
                          <Tooltip key={q} name="QUICK_EXEC" source="SYSTEM" desc={`Instantly transmit '${q}' to host.`}>
                            <button onClick={() => onAdapterCommand(q)} className="text-[9px] px-2 py-0.5 border border-zinc-900 text-zinc-700 hover:text-teal-400 hover:border-teal-400/30 transition-all uppercase">{q}</button>
                          </Tooltip>
                        ))}
                      </div>
                   </div>
                </div>
              </div>
           </div>

           {/* Terminal Footer */}
           <div className="h-8 border-t border-zinc-900 bg-zinc-950/20 flex items-center px-6">
              <span className="text-[8px] font-black text-zinc-800 uppercase tracking-[0.3em]">Direct Command Link Stabilized. Data encrypted at rest.</span>
           </div>
        </div>
      )}

      <style>{`
        @keyframes scan {
          0% { top: 0%; opacity: 1; }
          100% { top: 100%; opacity: 0.1; }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;