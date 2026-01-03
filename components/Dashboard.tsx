
import React, { useState, useEffect } from 'react';
import { OperationalMode, SessionInfo, PiStats } from '../types';
import Card from './common/Card';
import Tooltip from './common/Tooltip';

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
}

const Dashboard: React.FC<DashboardProps> = ({ 
  mode, session, stats, onHandshake, onDisconnect, onLog, onBrainClick, onProbeClick, onAdapterCommand, onRefresh, processingId 
}) => {
  const [ipInput, setIpInput] = useState('10.121.41.108');
  const [user, setUser] = useState('kali');
  const [pass, setPass] = useState('');
  const [port, setPort] = useState(22);
  
  const defaultInterfaces = ['wlan0', 'eth0', 'lo'];

  useEffect(() => {
    if (session.targetIp) setIpInput(session.targetIp);
  }, [session.targetIp]);

  const getInterfaceData = (name: string) => {
    if (mode === OperationalMode.SIMULATED) {
      return { 
        up: name === 'wlan0' || name === 'eth0' || name === 'lo', 
        ip: name === 'wlan0' ? '10.121.41.108' : (name === 'eth0' ? '10.0.5.12' : '127.0.0.1') 
      };
    }
    const realData = stats?.network?.interfaces?.[name];
    const isUp = realData?.up || (!!session.targetIp && name === 'wlan0');
    const displayIp = realData?.ip || (!!session.targetIp && name === 'wlan0' ? session.targetIp : 'OFFLINE');
    return { up: isUp, ip: displayIp };
  };

  const handleAdapterClick = (name: string) => {
    onAdapterCommand(`ip a show ${name}`);
  };

  const handleMasterProbe = () => {
    onProbeClick('GLOBAL_SYSTEM_AUDIT', { session, stats, mode });
  };

  const isConnected = !!session.targetIp;
  const isProbeActive = processingId === 'GLOBAL_SYSTEM_AUDIT';

  return (
    <div className="space-y-6 h-full flex flex-col no-scroll overflow-hidden pb-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <Card 
          title="HANDSHAKE_NODE" 
          variant={mode === OperationalMode.REAL ? 'real' : 'sim'}
          onProbe={() => onProbeClick('HANDSHAKE_CORE', { ipInput, user, port })}
          onBrain={() => onBrainClick('handshake_panel', 'Connection Link', { ipInput, user, status: session.status })}
          isProcessing={processingId === 'HANDSHAKE_CORE'}
          className="flex-1"
        >
          <div className="space-y-4">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black text-zinc-700 uppercase tracking-widest">Target_Link</label>
              <input value={ipInput} onChange={e => setIpInput(e.target.value)} disabled={isConnected} className={`bg-black/50 border border-zinc-900 p-2 text-[11px] font-mono outline-none ${isConnected ? 'text-teal-500/50 cursor-not-allowed' : 'text-white'}`} placeholder="0.0.0.0" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <input value={user} onChange={e => setUser(e.target.value)} disabled={isConnected} className="bg-black/50 border border-zinc-900 p-1.5 text-[10px] font-mono" placeholder="user" />
              <input type="password" value={pass} onChange={e => setPass(e.target.value)} disabled={isConnected} className="bg-black/50 border border-zinc-900 p-1.5 text-[10px] font-mono" placeholder="pass" />
              <input type="number" value={port} onChange={e => setPort(Number(e.target.value))} disabled={isConnected} className="bg-black/50 border border-zinc-900 p-1.5 text-[10px] font-mono" />
            </div>
            <button onClick={isConnected ? onDisconnect : () => onHandshake(ipInput, user, pass, port)} className={`w-full py-3 text-[10px] font-black border transition-all uppercase tracking-widest ${isConnected ? 'border-red-900/40 text-red-500 hover:bg-red-500/10' : 'border-zinc-800 text-zinc-600 hover:text-white hover:border-zinc-500'}`}>
              {isConnected ? 'TERMINATE_SESSION' : 'INITIALIZE_HANDSHAKE'}
            </button>
          </div>
        </Card>

        <Card title="ADAPTER_MATRIX" variant={mode === OperationalMode.REAL ? 'real' : 'sim'} onProbe={() => onProbeClick('ADAPTER_HUB', { stats })} onBrain={() => onBrainClick('adapter_hub', 'Network Matrix', { stats })} className="flex-1">
          <div className="flex flex-col gap-2">
            {defaultInterfaces.map(name => {
              const data = getInterfaceData(name);
              return (
                <div key={name} onClick={() => handleAdapterClick(name)} className={`px-4 py-2 border border-zinc-900/40 bg-black/20 flex justify-between items-center transition-all cursor-pointer group hover:bg-teal-500/5 ${!data.up ? 'opacity-30' : ''}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-1.5 h-1.5 rounded-full ${data.up ? 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]' : 'bg-red-500'}`}></div>
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest group-hover:text-teal-400">{name}</span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-600">{data.ip}</span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <Card title="MASTER_INTELLIGENCE_LINK" variant="purple" className="relative overflow-hidden shrink-0">
        <div className="h-20 border border-zinc-900 bg-black/40 flex items-center justify-center relative group px-6">
           <div className="absolute inset-y-0 left-0 right-0 flex justify-around items-center pointer-events-none px-20">
              <div className={`w-12 h-12 border border-purple-500 rounded-full transition-all duration-700 ${isProbeActive ? 'animate-spin scale-110 opacity-100 glow-purple' : 'opacity-10 scale-90'}`}></div>
              <div className={`w-12 h-12 border border-purple-500 rounded-full transition-all duration-700 ${isProbeActive ? 'animate-spin scale-110 opacity-100 glow-purple' : 'opacity-10 scale-90'}`} style={{ animationDirection: 'reverse' }}></div>
           </div>

           <div className="relative z-10 flex flex-col items-center gap-2">
              <button onClick={handleMasterProbe} disabled={isProbeActive} className={`bg-purple-900/10 border border-purple-500/40 hover:bg-purple-500/20 hover:border-purple-400 px-10 py-2.5 text-[10px] font-black uppercase tracking-[0.6em] text-purple-400 hover:text-white transition-all shadow-[0_0_20px_rgba(189,0,255,0.15)] disabled:opacity-30 ${isProbeActive ? 'animate-pulse' : ''}`}>
                {isProbeActive ? 'AUDITING_TELEMETRY...' : 'INITIATE_GLOBAL_PROBE'}
              </button>
              <span className="text-[7px] font-black uppercase tracking-[0.3em] text-zinc-800">Neural_Bridge_Standby_Ready</span>
           </div>
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;
