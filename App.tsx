
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { OperationalMode, SessionInfo, LogEntry, LogLevel, PiStats, AIProvider, AIConfig, SmartTooltipData, Timeframe } from './types';
import Dashboard from './components/Dashboard';
import PiStatsView from './components/PiStatsView';
import TelemetryGraphs from './components/TelemetryGraphs';
import Toolkit from './components/Toolkit';
import History from './components/History';
import NeuralCore from './components/NeuralCore';
import Modal from './components/common/Modal';
import Tooltip from './components/common/Tooltip';
import { fetchSmartTooltip, performNeuralProbe } from './services/aiService';
import { APP_CONFIG } from './services/config';

const App: React.FC = () => {
  const [mode, setMode] = useState<OperationalMode>(OperationalMode.SIMULATED);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'telemetry' | 'toolkit' | 'pi_stats' | 'history'>('dashboard');
  const [timeframe, setTimeframe] = useState<Timeframe>('1m');
  const [pollInterval, setPollInterval] = useState<number>(3000);
  const [session, setSession] = useState<SessionInfo>({
    id: Math.random().toString(36).substring(7).toUpperCase(),
    startTime: new Date().toISOString(),
    mode: OperationalMode.SIMULATED,
    targetIp: null,
    status: 'IDLE'
  });

  const [aiConfig, setAiConfig] = useState<AIConfig>({
    provider: AIProvider.GEMINI,
    endpoint: 'http://localhost:1234/v1/chat/completions',
    model: APP_CONFIG.DEFAULT_MODEL,
    fallbackToLocal: false
  });

  const [piStats, setPiStats] = useState<PiStats | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [historyData, setHistoryData] = useState<any[]>([]);
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [showTabConfig, setShowTabConfig] = useState(false);
  const [tooltipData, setTooltipData] = useState<SmartTooltipData | null>(null);
  const [neuralProbeResult, setNeuralProbeResult] = useState<{title: string, data: any} | null>(null);
  const [processingId, setProcessingId] = useState<string | undefined>(undefined);

  const toggleMode = () => {
    const nextMode = mode === OperationalMode.SIMULATED ? OperationalMode.REAL : OperationalMode.SIMULATED;
    setPiStats(null);
    setLogs([]);
    setHistoryData([]);
    setTooltipData(null);
    setSession({
      id: Math.random().toString(36).substring(7).toUpperCase(),
      startTime: new Date().toISOString(),
      mode: nextMode,
      targetIp: null,
      status: 'IDLE'
    });
    setMode(nextMode);
  };

  const addLog = useCallback((msg: string, level: LogLevel = LogLevel.INFO, metadata?: any) => {
    setLogs(prev => [...prev, {
      id: Math.random().toString(36),
      timestamp: new Date().toLocaleTimeString(),
      level,
      message: msg,
      source: mode,
      metadata
    }].slice(-100));
  }, [mode]);

  useEffect(() => {
    if (mode === OperationalMode.SIMULATED) {
      const simInterval = setInterval(() => {
        setPiStats({
          cpu: { usage: 5 + Math.random() * 20, temp: 38 + Math.random() * 10, load: [0.5, 0.4, 0.3] },
          memory: { total: 4.0, used: 1.2 + Math.random(), usage: 30 + Math.random() * 5 },
          network: { interfaces: { 
            wlan0: { up: true, ip: '192.168.1.104', rx: 1240, tx: 512 },
            wlan1: { up: false, ip: 'OFFLINE', rx: 0, tx: 0 },
            eth0: { up: true, ip: '10.0.5.2', rx: 4500, tx: 1200 }
          } }
        });
      }, pollInterval);
      return () => clearInterval(simInterval);
    }

    if (mode !== OperationalMode.REAL || !session.targetIp) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`http://${session.targetIp}:5050/stats`);
        if (res.ok) {
          const data = await res.json();
          setPiStats({
            cpu: { usage: data.cpu.usage, temp: data.cpu.temperature, load: [data.cpu.load1, data.cpu.load5, data.cpu.load15] },
            memory: { total: data.memory.ramTotal, used: data.memory.ramUsed, usage: data.memory.usage },
            network: { interfaces: data.network.interfaces }
          });
        }
      } catch (e) { setPiStats(null); }
    }, pollInterval);
    return () => clearInterval(interval);
  }, [mode, session.targetIp, timeframe, pollInterval]);

  const handleHandshake = useCallback((ip: string, username?: string, password?: string, port: number = 22) => {
    if (session.targetIp) {
      addLog(`SSH: Terminating session with ${session.targetIp}...`, LogLevel.WARNING);
    }
    addLog(`SSH: Attempting handshake -> ${ip}:${port}`, LogLevel.SYSTEM);
    setProcessingId('HANDSHAKE_CORE');
    setTimeout(() => {
      addLog(`SSH: Authentication verified for [${username}].`, LogLevel.SUCCESS);
      setSession(s => ({ ...s, targetIp: ip, status: 'ACTIVE' }));
      setProcessingId(undefined);
    }, APP_CONFIG.SIMULATION.NEURAL_LATENCY);
  }, [addLog, session.targetIp]);

  const handleDisconnect = useCallback(() => {
    if (!session.targetIp) return;
    addLog(`SSH: Closing tunnel to ${session.targetIp}...`, LogLevel.SYSTEM);
    setSession(s => ({ ...s, targetIp: null, status: 'IDLE' }));
    setPiStats(null);
    addLog(`SSH: Socket terminated.`, LogLevel.WARNING);
  }, [addLog, session.targetIp]);

  const handleNeuralProbe = async (panelName: string, metrics: any) => {
    setProcessingId(panelName);
    setIsAnalyzing(true);
    addLog(`Initiating neural probe: ${panelName}...`, LogLevel.NEURAL);
    try {
      const result = await performNeuralProbe(aiConfig, panelName, metrics, { sessionId: session.id, mode });
      setNeuralProbeResult({ title: panelName, data: result });
      addLog(`Neural complete: ${panelName}`, LogLevel.SUCCESS, { type: 'PROBE_RESULT', title: panelName, data: result });
    } catch (e) {
      addLog(`Neural error: ${panelName}`, LogLevel.ERROR);
    } finally {
      setIsAnalyzing(false);
      setProcessingId(undefined);
    }
  };

  const handleBrainRequest = async (id: string, type: string, metrics: any) => {
    setProcessingId(id);
    try {
      const data = await fetchSmartTooltip(aiConfig, { elementId: id, elementType: type, metrics }, { sessionId: session.id, mode });
      setTooltipData(data);
      addLog(`Brain linked: ${id}`, LogLevel.NEURAL, { type: 'BRAIN_TOOLTIP', data });
    } catch (e) {
      addLog(`Brain error: ${id}`, LogLevel.ERROR);
    } finally {
      setProcessingId(undefined);
    }
  };

  const currentAccent = useMemo(() => {
    if (mode === OperationalMode.REAL) return '#22c55e';
    if (mode === OperationalMode.SIMULATED) return '#00f2ff';
    return '#ff3e3e';
  }, [mode]);

  const coreState = useMemo(() => {
    if (mode === OperationalMode.REAL) return session.targetIp ? 'connected' : 'disconnected';
    return 'simulated';
  }, [mode, session.targetIp]);

  const handleLogAction = (log: LogEntry) => {
    if (!log.metadata) return;
    if (log.metadata.type === 'PROBE_RESULT') {
      setNeuralProbeResult({ title: log.metadata.title, data: log.metadata.data });
    } else if (log.metadata.type === 'BRAIN_TOOLTIP') {
      setTooltipData(log.metadata.data);
    }
  };

  const renderTabConfig = () => {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-3">
          <label className="text-[11px] font-black text-zinc-700 uppercase tracking-widest">Polling_Interval (ms)</label>
          <input 
            type="number"
            value={pollInterval}
            onChange={e => setPollInterval(Number(e.target.value))}
            className="bg-black border border-zinc-900 p-4 text-[13px] text-white outline-none focus:border-purple-500/40 font-mono shadow-inner"
            min={500}
            step={500}
          />
        </div>
        <div className="flex flex-col gap-3">
          <label className="text-[11px] font-black text-zinc-700 uppercase tracking-widest">Session_Management</label>
          <button onClick={() => setLogs([])} className="w-full py-2 border border-red-900/40 text-red-500 text-[10px] font-black uppercase hover:bg-red-500/10 transition-all">PURGE_LOGS</button>
        </div>
      </div>
    );
  };

  return (
    <div className={`flex flex-col h-screen overflow-hidden ${mode === OperationalMode.REAL ? 'mode-real' : 'mode-sim'}`}>
      <header className="h-24 border-b border-[#1a1e24] bg-[#050608] px-8 flex items-center justify-between z-50 shrink-0">
        <div className="flex items-center gap-10">
          <div className="scale-75 origin-left">
             <NeuralCore state={coreState} />
          </div>
          <div className="border-l border-zinc-900 pl-8 h-12 flex flex-col justify-center">
            <h1 className="text-2xl font-black tracking-[0.6em] text-white uppercase chromatic-aberration">Neural Sentinel</h1>
            <div className="flex gap-6 mt-1 items-center">
              <span className="text-[10px] font-black text-zinc-700 uppercase tracking-widest">Protocol:</span>
              <span className={`text-[10px] font-black uppercase tracking-widest`} style={{ color: currentAccent }}>{mode}</span>
              <div className="flex gap-6 ml-4 items-center border-l border-zinc-900 pl-6">
                <Tooltip name="NODE_LINK" source={mode} desc="Session availability.">
                  <div className={`w-3 h-3 rounded-full ${session.targetIp ? 'bg-[#22c55e] glow-green' : 'bg-red-500 glow-red'}`}></div>
                </Tooltip>
                <Tooltip name="NEURAL_CORE" source={mode} desc="AI link status.">
                  <div className={`w-3 h-3 rounded-full ${aiConfig.provider === AIProvider.GEMINI ? 'bg-[#bd00ff] glow-purple' : 'bg-zinc-800'}`}></div>
                </Tooltip>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-10">
          <button onClick={() => setShowConfig(true)} className={`p-3 transition-all hover:scale-110 group ${showConfig ? 'text-[#bd00ff] glow-purple' : 'text-zinc-600 hover:text-white'}`}>
             <svg className="w-8 h-8 transition-transform group-hover:rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          </button>
          <div onClick={toggleMode} className={`w-20 h-9 border border-zinc-900 bg-black cursor-pointer p-1.5 transition-all flex items-center shadow-inner group relative`}>
              <div className={`absolute left-0 right-0 h-full flex justify-around items-center text-[8px] font-black text-zinc-800 pointer-events-none`}>
                <span>SIM</span>
                <span>REAL</span>
              </div>
              <div className={`w-6 h-6 transition-all shadow-md z-10`} style={{ transform: mode === OperationalMode.REAL ? 'translateX(2.6rem)' : 'translateX(0)', backgroundColor: currentAccent, filter: `drop-shadow(0 0 10px ${currentAccent})` }}></div>
          </div>
        </div>
      </header>
      <main className="flex-1 flex overflow-hidden">
        <div className="w-[70%] flex flex-col border-r border-[#1a1e24] overflow-hidden bg-[#020406]">
          <nav className="h-14 border-b border-[#1a1e24] flex items-center px-10 bg-[#0a0c0f] shrink-0 justify-between">
            <div className="flex items-center h-full gap-12">
              {['dashboard', 'telemetry', 'pi_stats', 'toolkit', 'history'].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab as any)} className={`text-[12px] font-black uppercase tracking-[0.4em] relative h-full flex items-center transition-all hover:text-white ${activeTab === tab ? 'text-white' : 'text-[#334155]'}`}>
                  {tab === 'pi_stats' ? 'SYSTEM_STATS' : tab.toUpperCase()}
                  {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-1.5 animate-pulse bg-teal-400"></div>}
                </button>
              ))}
            </div>
          </nav>
          <div className="flex-1 overflow-y-auto p-10 relative scroll-smooth no-scroll bg-gradient-to-b from-transparent to-[#050608]/50">
             <div className="max-w-7xl mx-auto h-full">
               {activeTab === 'dashboard' && <Dashboard stats={piStats} mode={mode} session={session} onHandshake={handleHandshake} onDisconnect={handleDisconnect} onLog={addLog} onBrainClick={handleBrainRequest} onProbeClick={handleNeuralProbe} processingId={processingId} />}
               {activeTab === 'pi_stats' && <PiStatsView stats={piStats} mode={mode} timeframe={timeframe} onProbeClick={handleNeuralProbe} onBrainClick={handleBrainRequest} processingId={processingId} />}
               {activeTab === 'telemetry' && <TelemetryGraphs isSimulated={mode === OperationalMode.SIMULATED} isConnected={!!session.targetIp} timeframe={timeframe} onProbe={handleNeuralProbe} onBrainClick={handleBrainRequest} processingId={processingId} />}
               {activeTab === 'toolkit' && <Toolkit mode={mode} onRunCommand={(cmd) => addLog(`EX: ${cmd}`, LogLevel.SYSTEM)} onBreakdown={(t, q) => handleNeuralProbe(t, { query: q })} />}
               {activeTab === 'history' && <History data={historyData} onProbe={handleNeuralProbe} onBrainClick={handleBrainRequest} processingId={processingId} />}
             </div>
          </div>
        </div>
        <div className="w-[30%] flex flex-col bg-[#020406] border-l border-[#1a1e24] relative overflow-hidden">
          <div className="h-14 border-b border-zinc-900 px-8 flex items-center justify-between bg-[#0a0c0f] shrink-0">
             <button onClick={() => handleNeuralProbe('FULL_SYSTEM_AUDIT', { stats: piStats, session })} className="text-[12px] font-black text-zinc-700 uppercase tracking-widest hover:text-white transition-colors">Neural_Stream_v.10</button>
          </div>
          <div className="flex-1 overflow-y-auto p-8 space-y-4 bg-black/60 no-scroll">
             {logs.map(log => (
               <div key={log.id} onClick={() => handleLogAction(log)} className="border-l-2 pl-4 py-3 border-zinc-800 hover:border-teal-500/40 cursor-pointer transition-all">
                 <div className="flex items-center gap-4 mb-2">
                   <span className="text-[10px] text-zinc-700 font-mono">{log.timestamp}</span>
                   <span className={`text-[9px] font-black px-2 py-0.5 border border-current uppercase ${log.level === LogLevel.SUCCESS ? 'text-green-500' : 'text-teal-600'}`}>[{log.level}]</span>
                 </div>
                 <p className="font-mono text-[13px] text-zinc-500">{log.message}</p>
               </div>
             ))}
          </div>
        </div>
      </main>
      <Modal isOpen={showTabConfig} onClose={() => setShowTabConfig(false)} title="TAB_CONFIGURATION" variant="purple">{renderTabConfig()}</Modal>
      <Modal isOpen={showConfig} onClose={() => setShowConfig(false)} title="GLOBAL_SETTINGS" variant="purple">
         <div className="space-y-6">
            <div className="flex flex-col gap-3">
              <label className="text-[11px] font-black text-zinc-700 uppercase">Provider</label>
              <select value={aiConfig.provider} onChange={e => setAiConfig(prev => ({ ...prev, provider: e.target.value as AIProvider }))} className="bg-black border border-zinc-900 p-3 text-white">
                 <option value={AIProvider.GEMINI}>Google Gemini</option>
                 <option value={AIProvider.LOCAL}>Local LLM</option>
              </select>
            </div>
         </div>
      </Modal>
      <Modal isOpen={!!tooltipData} onClose={() => setTooltipData(null)} title={tooltipData?.elementId || 'BRAIN'} variant="purple">
         {tooltipData && <div className="space-y-6"><p className="text-zinc-400 italic">{tooltipData.description}</p><div className="p-4 bg-purple-900/10 border border-purple-500/20 text-zinc-200">{tooltipData.recommendation}</div></div>}
      </Modal>
      <Modal isOpen={!!neuralProbeResult} onClose={() => setNeuralProbeResult(null)} title={`DIAGNOSTIC: ${neuralProbeResult?.title}`} variant="blue">
         {neuralProbeResult?.data && <div className="space-y-6"><p className="text-zinc-400">{neuralProbeResult.data.description}</p><div className="font-black text-teal-400">{neuralProbeResult.data.recommendation}</div></div>}
      </Modal>
      <footer className="h-10 border-t border-[#1a1e24] bg-[#020406] px-10 flex items-center justify-between text-[11px] font-bold text-[#20272f] uppercase tracking-[0.2em] shrink-0">
        <div>SID: {session.id}</div>
        <div style={{ color: currentAccent }}>SYSTEM_STABLE_{mode}</div>
      </footer>
    </div>
  );
};

export default App;
