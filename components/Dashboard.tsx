
import React, { useState, useEffect } from 'react';
import { OperationalMode, SessionInfo, PiStats } from '../types';
import Card from './common/Card';
import Tooltip from './common/Tooltip';

interface DashboardProps {
  mode: OperationalMode;
  session: SessionInfo;
  stats: PiStats | null;
  onHandshake: (ip: string, username?: string, password?: string, port?: number) => void;
  onDisconnect: () => void;
  onLog: (msg: string, level?: any) => void;
  onBrainClick: (id: string, type: string, metrics: any) => void;
  onProbeClick: (panel: string, metrics: any) => void;
  onRefresh: () => void;
  processingId?: string;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  mode, session, stats, onHandshake, onDisconnect, onLog, onBrainClick, onProbeClick, onRefresh, processingId 
}) => {
  const [ipInput, setIpInput] = useState('10.121.41.108'); // Direct target per user requirement
  const [user, setUser] = useState('kali');
  const [pass, setPass] = useState('');
  const [port, setPort] = useState(22);
  
  const defaultInterfaces = ['eth0', 'wlan0', 'wlan1'];

  useEffect(() => {
    if (session.targetIp) {
      setIpInput(session.targetIp);
    }
  }, [session.targetIp]);

  const getInterfaceData = (name: string) => {
    if (mode === OperationalMode.SIMULATED) {
      return { 
        up: name === 'wlan0' || name === 'eth0', 
        ip: name === 'eth0' ? '10.0.5.12' : (name === 'wlan0' ? '192.168.1.104' : 'OFFLINE') 
      };
    }
    
    // Improved logic: even if stats are null, if we have a target IP and it's wlan0 or eth0, assume connected status
    const realData = stats?.network?.interfaces?.[name];
    const isSessionActive = !!session.targetIp;
    const isLikelyUp = name === 'wlan0' && isSessionActive; // Common case for Pi Kali
    
    return { 
      up: realData?.up || isLikelyUp, 
      ip: realData?.ip || (isSessionActive ? 'SYNC_HUB...' : 'OFFLINE') 
    };
  };

  const isConnected = !!session.targetIp;
  const sourceState = mode as string;

  return (
    <div className="space-y-8 animate-in slide-in-from-left-4 h-full no-scroll">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
        
        <Card 
          title="HANDSHAKE_NODE" 
          titleTooltip="Establishes a secure SSH telemetry tunnel between the console and the target node."
          variant={mode === OperationalMode.REAL ? 'real' : 'sim'}
          onProbe={() => onProbeClick('HANDSHAKE_CORE', { ipInput, user, port, session })}
          onBrain={() => onBrainClick('handshake_panel', 'Connection Link', { ipInput, user, status: session.status })}
          isProcessing={processingId === 'HANDSHAKE_CORE' || processingId === 'handshake_panel'}
          className="flex-1"
        >
          <div className="flex flex-col h-full justify-between gap-6">
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <Tooltip name="LINK_IDENTIFIER_LABEL" source={sourceState} desc="Specifies the target IPv4 logical endpoint.">
                  <label className="text-[10px] font-black text-zinc-700 uppercase tracking-widest">Link_Identifier</label>
                </Tooltip>
                <input 
                  value={ipInput}
                  onChange={e => setIpInput(e.target.value)}
                  disabled={isConnected}
                  className={`w-full bg-black/50 border border-zinc-900 p-3 text-[11px] font-mono outline-none focus:border-teal-500/40 transition-colors shadow-inner ${isConnected ? 'text-teal-500/50 cursor-not-allowed opacity-50' : 'text-white'}`}
                  placeholder="0.0.0.0"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[9px] font-black text-zinc-800 uppercase">User</label>
                  <input 
                    value={user}
                    onChange={e => setUser(e.target.value)}
                    disabled={isConnected}
                    className={`bg-black/50 border border-zinc-900 p-2 text-[10px] font-mono outline-none focus:border-teal-500/20 ${isConnected ? 'text-zinc-700 cursor-not-allowed' : 'text-zinc-400'}`}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[9px] font-black text-zinc-800 uppercase">Pass</label>
                  <input 
                    type="password"
                    value={pass}
                    onChange={e => setPass(e.target.value)}
                    disabled={isConnected}
                    className={`bg-black/50 border border-zinc-900 p-2 text-[10px] font-mono outline-none focus:border-teal-500/20 ${isConnected ? 'text-zinc-700 cursor-not-allowed' : 'text-zinc-400'}`}
                    placeholder="••••"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[9px] font-black text-zinc-800 uppercase">Port</label>
                  <input 
                    type="number"
                    value={port}
                    onChange={e => setPort(Number(e.target.value))}
                    disabled={isConnected}
                    className={`bg-black/50 border border-zinc-900 p-2 text-[10px] font-mono outline-none focus:border-teal-500/20 ${isConnected ? 'text-zinc-700 cursor-not-allowed' : 'text-zinc-400'}`}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              {isConnected ? (
                <button 
                  onClick={onDisconnect}
                  className="w-full py-4 text-[10px] font-black border border-red-900/40 text-red-500/60 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/50 transition-all uppercase tracking-[0.3em] shadow-[0_0_10px_rgba(0,0,0,0.5)]"
                >
                  TERMINATE_SESSION
                </button>
              ) : (
                <button 
                  onClick={() => onHandshake(ipInput, user, pass, port)}
                  className="w-full py-4 text-[10px] font-black border border-zinc-800 text-zinc-700 hover:text-white hover:border-zinc-500 hover:bg-zinc-900/40 transition-all uppercase tracking-[0.3em] shadow-[0_0_15px_rgba(0,0,0,0.5)]"
                >
                  INITIALIZE_HANDSHAKE
                </button>
              )}
            </div>
          </div>
        </Card>

        <Card 
          title="ADAPTER_MATRIX" 
          titleTooltip="Real-time monitoring of network interfaces on the target node. GREEN dot indicates adapter is up or session link is established."
          variant={mode === OperationalMode.REAL ? 'real' : 'sim'}
          onProbe={() => onProbeClick('ADAPTER_HUB', { interfaces: defaultInterfaces.map(getInterfaceData) })}
          onBrain={() => onBrainClick('adapter_hub', 'Network Matrix', { interfaces: defaultInterfaces.map(getInterfaceData) })}
          isProcessing={processingId === 'ADAPTER_HUB' || processingId === 'adapter_hub'}
          className="flex-1"
        >
          <div className="flex flex-col justify-between h-full">
            <div className="flex flex-col gap-3">
              {defaultInterfaces.map(name => {
                const data = getInterfaceData(name);
                const isUp = data.up;
                const intSourceState = !isUp && mode === OperationalMode.REAL ? 'OFFLINE' : mode as string;
                
                return (
                  <div key={name} className={`px-5 py-3 border border-zinc-900/40 bg-black/20 flex justify-between items-center transition-all ${!isUp ? 'opacity-20 grayscale' : 'hover:bg-teal-500/5'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-1.5 h-1.5 rounded-full ${isUp ? 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]' : 'bg-red-500'}`}></div>
                      <Tooltip name={`ADAPTER_LABEL_${name}`} source={intSourceState} desc={`Primary hardware/software interface descriptor for ${name}.`}>
                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{name}</span>
                      </Tooltip>
                    </div>
                    <div className="flex items-center gap-6">
                      <Tooltip name={`INTERFACE_${name.toUpperCase()}_IP`} unit="IPv4 Address" source={intSourceState} desc="Current logical address.">
                        <span className="text-[11px] font-mono text-zinc-500 tracking-tighter">{data.ip}</span>
                      </Tooltip>
                      <span className={`text-[8px] font-black px-2 py-0.5 border ${isUp ? 'border-green-900/40 text-green-700' : 'border-red-900/40 text-red-900'} uppercase`}>
                        {isUp ? 'CONNECTED' : 'VOID'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-6 pt-4 border-t border-zinc-900/40 flex justify-between items-center">
              <div className="flex flex-col">
                <span className="text-[8px] font-black uppercase text-zinc-800 tracking-[0.2em]">MATRIX_STATUS: {isConnected ? 'LINK_ACTIVE' : 'IDLE'}</span>
                <span className="text-[7px] text-zinc-900 uppercase">Sync: 0x8F2A</span>
              </div>
              <button 
                onClick={onRefresh}
                disabled={!isConnected}
                className="text-[9px] font-black text-zinc-700 hover:text-teal-400 disabled:opacity-20 disabled:hover:text-zinc-700 transition-colors uppercase tracking-widest"
              >
                [ REFRESH_MATRIX ]
              </button>
            </div>
          </div>
        </Card>
      </div>

      <Card 
        title="NEURAL_SPECTRUM_MONITOR" 
        titleTooltip="Displays spectrum analysis of neural signals over time. Useful for detecting anomalies and trends in neural activity."
        variant="purple"
        onProbe={() => onProbeClick('SPECTRUM_CORE', { stats })}
        onBrain={() => onBrainClick('spectrum_panel', 'Spectral Engine', { active: true })}
        isProcessing={processingId === 'SPECTRUM_CORE' || processingId === 'spectrum_panel'}
      >
        <div className="h-40 border border-zinc-900 bg-black/40 flex flex-col items-center justify-center relative overflow-hidden group">
           <div className="absolute inset-0 bg-gradient-to-t from-purple-900/10 to-transparent opacity-50"></div>
           <div className="relative z-10 flex flex-col items-center gap-4">
              <div className="w-10 h-10 border border-purple-900/40 rounded-full flex items-center justify-center animate-pulse">
                 <div className="w-5 h-5 bg-purple-900/20 rounded-full"></div>
              </div>
              <Tooltip name="NEURAL_BRIDGE_STATE" source={sourceState} desc="Displays spectrum analysis of neural signals over time. Useful for detecting anomalies and trends in neural activity.">
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-700">Neural_Bridge_Standby_Ready</span>
              </Tooltip>
           </div>
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;
