
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { OperationalMode, SessionInfo, LogEntry, LogLevel, LogType, PiStats, AIProvider, AIConfig, AppSettings, SmartTooltipData, Timeframe } from './types';
import Dashboard from './components/Dashboard';
import PiStatsView from './components/PiStatsView';
import TelemetryGraphs from './components/TelemetryGraphs';
import Toolkit from './components/Toolkit';
import History from './components/History';
import NeuralCore from './components/NeuralCore';
import Modal from './components/common/Modal';
import Tooltip from './components/common/Tooltip';
import { fetchSmartTooltip, performNeuralProbe, testAiAvailability } from './services/aiService';
import { APP_CONFIG } from './services/config';

const ASCII_FROG = `
⠀⠀⢀⣠⠤⠶⠖⠒⠒⠶⠦⠤⣄⠀⠀⠀⣀⡤⠤⠤⠤⠤⣄⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⣴⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠙⣦⠞⠁⠀⠀⠀⠀⠀⠀⠉⠳⡄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⡾⠁⠀⠀⠀⠀⠀⠀⣀⣀⣀⣀⣀⣀⣘⡆⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⣆⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⢀⡴⠚⠉⠁⠀⠀⠀⠀⠈⠉⠙⠲⣄⣤⠤⠶⠒⠒⠲⠦⢤⣜⣧⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠉⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠳⡄⠀⠀⠀⠀⠀⠀⠀⠉⠳⢄⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⣀⣀⣀⣀⣀⣀⣀⣀⣀⣀⣀⣀⠹⣆⠀⠀⠀⠀⠀⠀⣀⣀⣀⣹⣄⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⣠⠞⣉⣡⠤⠴⠿⠗⠳⠶⣬⣙⠓⢦⡈⠙⢿⡀⠀⠀⢀⣼⣿⣿⣿⣿⣿⡿⣷⣤⡀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⣾⣡⠞⣁⣀⣀⣀⣠⣤⣤⣤⣄⣭⣷⣦⣽⣦⡀⢻⡄⠰⢟⣥⣾⣿⣏⣉⡙⠓⢦⣻⠃⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠉⠉⠙⠻⢤⣄⣼⣿⣽⣿⠟⠻⣿⠄⠀⠀⢻⡝⢿⡇⣠⣿⣿⣻⣿⠿⣿⡉⠓⠮⣿⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠙⢦⡈⠛⠿⣾⣿⣶⣾⡿⠀⠀⠀⢀⣳⣘⢻⣇⣿⣿⣽⣿⣶⣾⠃⣀⡴⣿⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠙⠲⠤⢄⣈⣉⣙⣓⣒⣒⣚⣉⣥⠟⠀⢯⣉⡉⠉⠉⠛⢉⣉⣡⡾⠁⠀⠀⠀⠀⠀⠀⠀
⠀⠀⣠⣤⡤⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢈⡿⠋⠀⠀⠀⠀⠈⠻⣍⠉⠀⠺⠿⠋⠙⣦⠀⠀⠀⠀⠀⠀⠀
⠀⣀⣥⣤⠴⠆⠀⠀⠀⠀⠀⠀⠀⣀⣠⠤⠖⠋⠀⠀⠀⠀⠀⠀⠀⠀⠈⠳⠀⠀⠀⠀⠀⢸⣧⠀⠀⠀⠀⠀⠀
⠸⢫⡟⠙⣛⠲⠤⣄⣀⣀⠀⠈⠋⠉⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣠⠏⣨⠇⠀⠀⠀⠀⠀
⠀⠀⠻⢦⣈⠓⠶⠤⣄⣉⠉⠉⠛⠒⠲⠦⠤⠤⣤⣀⣀⣀⣀⣀⣀⣀⣀⣀⣀⣀⣠⠴⢋⡴⠋⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠉⠓⠦⣄⡀⠈⠙⠓⠒⠶⠶⠶⠶⠤⣤⣀⣀⣀⣀⣀⣉⣉⣉⣉⣉⣀⣠⠴⠋⣿⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠉⠓⠦⣄⣀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⡼⠁⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⠉⠙⠛⠒⠒⠒⠒⠒⠤⠤⠤⠒⠒⠒⠒⠒⠒⠚⢉⡇⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣠⠴⠚⠛⠳⣤⠞⠁⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣤⠚⠁⠀⠀⠀⠀⠘⠲⣄⡀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣴⠋⠙⢷⡋⢙⡇⢀⡴⢒⡿⢶⣄⡴⠀⠙⠳⣄⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⢦⡀⠈⠛⢻⠛⢉⡴⣋⡴⠟⠁⠀⠀⠀⠀⠈⢧⡀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢻⡄⠀⠘⣶⢋⡞⠁⠀⠀⢀⡴⠂⠀⠀⠀⠀⠹⣄⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡇⠀⠀⠈⠻⢦⡀⠀⣰⠏⠀⠀⢀⡴⠃⢀⡄⠙⣆⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢠⡾⢷⡄⠀⠀⠀⠀⠉⠙⠯⠀⠀⡴⠋⠀⢠⠟⠀⠀⢹⡄
`.trim();

const App: React.FC = () => {
  // Persistence Loading
  const loadSettings = (): AppSettings => {
    const saved = localStorage.getItem('neural_sentinel_settings');
    if (saved) return JSON.parse(saved);
    return {
      showAsciiBg: true,
      globalDistortion: true,
      panelDistortion: true,
      pollInterval: 3000,
      timeframe: '1m'
    };
  };

  const [mode, setMode] = useState<OperationalMode>(OperationalMode.SIMULATED);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'telemetry' | 'toolkit' | 'pi_stats' | 'history'>('dashboard');
  const [activeLogTab, setActiveLogTab] = useState<LogType>('neural');
  const [settings, setSettings] = useState<AppSettings>(loadSettings());
  
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

  const [aiLinkStable, setAiLinkStable] = useState<boolean>(false);
  const [isTestingLink, setIsTestingLink] = useState(false);
  const [piStats, setPiStats] = useState<PiStats | null>(null);

  // Multi-Log State
  const [neuralLogs, setNeuralLogs] = useState<LogEntry[]>([]);
  const [consoleLogs, setConsoleLogs] = useState<LogEntry[]>([]);
  const [kernelLogs, setKernelLogs] = useState<LogEntry[]>([]);
  const [systemLogs, setSystemLogs] = useState<LogEntry[]>([]);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [tooltipData, setTooltipData] = useState<SmartTooltipData | null>(null);
  const [neuralProbeResult, setNeuralProbeResult] = useState<{title: string, data: any} | null>(null);
  const [processingId, setProcessingId] = useState<string | undefined>(undefined);

  // Persistence Saving
  useEffect(() => {
    localStorage.setItem('neural_sentinel_settings', JSON.stringify(settings));
  }, [settings]);

  const addLog = useCallback((msg: string, level: LogLevel = LogLevel.INFO, type: LogType = 'neural', metadata?: any) => {
    const entry = {
      id: Math.random().toString(36),
      timestamp: new Date().toLocaleTimeString(),
      level,
      message: msg,
      source: mode,
      metadata
    };

    if (type === 'neural') setNeuralLogs(prev => [entry, ...prev].slice(0, 100));
    else if (type === 'console') setConsoleLogs(prev => [entry, ...prev].slice(0, 100));
    else if (type === 'kernel') setKernelLogs(prev => [entry, ...prev].slice(0, 100));
    else if (type === 'system') setSystemLogs(prev => [entry, ...prev].slice(0, 100));
  }, [mode]);

  const runCommand = useCallback((cmd: string) => {
    addLog(`$ ${cmd}`, LogLevel.COMMAND, 'console');
    setTimeout(() => {
      if (cmd.includes('ip a')) {
        const iface = cmd.split(' ').pop();
        addLog(`[OK] Executed query for interface: ${iface}`, LogLevel.SUCCESS, 'console');
        addLog(`1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000\n    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00\n    inet 127.0.0.1/8 scope host lo`, LogLevel.INFO, 'console');
      } else {
        addLog(`[OK] Task transmitted. Waiting for buffer...`, LogLevel.SUCCESS, 'console');
      }
    }, 400);
  }, [addLog]);

  const clearActiveLog = () => {
    if (activeLogTab === 'neural') setNeuralLogs([]);
    else if (activeLogTab === 'console') setConsoleLogs([]);
    else if (activeLogTab === 'kernel') setKernelLogs([]);
    else if (activeLogTab === 'system') setSystemLogs([]);
    addLog(`${activeLogTab.toUpperCase()} stream buffer reset.`, LogLevel.SYSTEM);
  };

  const getActiveLogs = () => {
    switch(activeLogTab) {
      case 'console': return consoleLogs;
      case 'kernel': return kernelLogs;
      case 'system': return systemLogs;
      default: return neuralLogs;
    }
  };

  const toggleMode = () => {
    const nextMode = mode === OperationalMode.SIMULATED ? OperationalMode.REAL : OperationalMode.SIMULATED;
    setPiStats(null);
    setNeuralLogs([]);
    setConsoleLogs([]);
    setKernelLogs([]);
    setSystemLogs([]);
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

  const testLink = async () => {
    setIsTestingLink(true);
    const available = await testAiAvailability(aiConfig);
    setAiLinkStable(available);
    setIsTestingLink(false);
  };

  useEffect(() => {
    testLink();
    const linkInterval = setInterval(testLink, 60000);
    return () => clearInterval(linkInterval);
  }, [aiConfig.provider, aiConfig.endpoint, aiConfig.model]);

  const fetchStats = useCallback(async (ip: string) => {
    try {
      const res = await fetch(`http://${ip}:5050/stats`);
      if (res.ok) {
        const data = await res.json();
        setPiStats({
          cpu: { usage: data.cpu?.usage || 0, temp: data.cpu?.temperature || 0, load: [data.cpu?.cpuLoad1 || 0, data.cpu?.cpuLoad5 || 0, data.cpu?.cpuLoad15 || 0] },
          memory: { usage: data.memory?.usage || 0, used: data.memory?.ramUsed || 0, total: data.memory?.ramTotal || 0 },
          disk: { rootUsage: data.disk?.rootUsage || 0, readRate: data.disk?.readRateKB || 0, writeRate: data.disk?.writeRateKB || 0 },
          network: { inRate: data.network?.inRateKB || 0, outRate: data.network?.outRateKB || 0, interfaces: data.network?.interfaces || {} },
          processes: { topByCpu: data.processes?.topByCpu || [], topByMemory: data.processes?.topByMemory || [], total: data.processes?.totalProcesses || 0 },
          sensors: { throttled: data.sensors?.throttled, throttledInfo: data.sensors?.throttled_info },
          system: { hostname: data.system?.hostname || 'unknown', uptime: data.system?.uptime || 0, osName: data.system?.osName || 'unknown' }
        });
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    if (mode === OperationalMode.SIMULATED) {
      const simInterval = setInterval(() => {
        setPiStats({
          cpu: { usage: 5 + Math.random() * 20, temp: 38 + Math.random() * 10, load: [0.5, 0.4, 0.3], cores: 4, freqCurrent: 600 },
          memory: { total: 4.0, used: 1.2 + Math.random(), usage: 30 + Math.random() * 5 },
          network: { inRate: Math.random() * 10, outRate: Math.random() * 5, interfaces: { wlan0: { up: true, ip: '10.121.41.108', rx: 1240, tx: 512 }, eth0: { up: true, ip: '10.0.5.2', rx: 4500, tx: 1200 } } },
          disk: { rootUsage: 45, readRate: 1.2, writeRate: 0.5 },
          system: { hostname: 'SIM-SENTINEL', uptime: 3600, osName: 'Kali GNU/Linux' }
        });
      }, settings.pollInterval);
      return () => clearInterval(simInterval);
    }
    if (mode === OperationalMode.REAL && session.targetIp) {
      const interval = setInterval(() => fetchStats(session.targetIp!), settings.pollInterval);
      return () => clearInterval(interval);
    }
  }, [mode, session.targetIp, settings.pollInterval, fetchStats]);

  const handleHandshake = (ip: string, user: string, pass: string, port: number) => {
    addLog(`SSH: Handshake attempt -> ${ip}:${port}`, LogLevel.SYSTEM);
    setProcessingId('HANDSHAKE_CORE');
    setTimeout(() => {
      setSession(s => ({ ...s, targetIp: ip, status: 'ACTIVE' }));
      addLog(`SSH: Handshake verified. Bridge established.`, LogLevel.SUCCESS);
      setProcessingId(undefined);
    }, 1200);
  };

  const handleNeuralProbe = async (panelName: string, metrics: any) => {
    setProcessingId(panelName);
    setIsAnalyzing(true);
    addLog(`Neural probe initiated: ${panelName}`, LogLevel.NEURAL);
    try {
      const result = await performNeuralProbe(aiConfig, panelName, metrics, { sessionId: session.id, mode });
      setNeuralProbeResult({ title: panelName, data: result });
      addLog(`Probe response received: ${panelName}`, LogLevel.SUCCESS, 'neural', { type: 'PROBE_RESULT', title: panelName, data: result });
    } catch (e) {
      addLog(`Probe failed: ${panelName}`, LogLevel.ERROR);
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
    } catch (e) {} finally {
      setProcessingId(undefined);
    }
  };

  const handleLogAction = (log: LogEntry) => {
    if (!log.metadata) return;
    if (log.metadata.type === 'PROBE_RESULT') {
      setNeuralProbeResult({ title: log.metadata.title, data: log.metadata.data });
    }
  };

  const probeActiveLog = () => {
    const logsToAnalyze = getActiveLogs();
    const metrics = {
      type: activeLogTab,
      count: logsToAnalyze.length,
      sample: logsToAnalyze.slice(0, 10).map(l => ({ msg: l.message, lvl: l.level }))
    };
    handleNeuralProbe(`${activeLogTab.toUpperCase()}_LOG_ANALYSIS`, metrics);
  };

  const getTabTooltip = (tab: string) => {
    switch(tab) {
      case 'dashboard': return "Mission Control: Primary node connectivity and tactical intelligence gateway.";
      case 'telemetry': return "Signal Spectrum: Real-time RF analysis and signal integrity metrics.";
      case 'pi_stats': return "Node Health: Granular hardware telemetry and process-level auditing.";
      case 'toolkit': return "Module Arsenal: Payload construction and automated tactical wizards.";
      case 'history': return "Operation Archive: Persistent record of tactical events.";
      default: return "";
    }
  };

  const currentAccent = mode === OperationalMode.REAL ? '#22c55e' : mode === OperationalMode.SIMULATED ? '#00f2ff' : '#ff3e3e';

  return (
    <div className={`flex flex-col h-screen overflow-hidden ${mode === OperationalMode.REAL ? 'mode-real' : 'mode-sim'} ${settings.globalDistortion ? 'crt-flicker-slow' : ''}`}>
      <header className="h-24 border-b border-[#1a1e24] bg-[#050608] px-8 flex items-center justify-between z-50 shrink-0">
        <div className="flex items-center gap-10">
          <div className="scale-75 origin-left">
             <NeuralCore state={mode === OperationalMode.REAL ? (session.targetIp ? 'connected' : 'disconnected') : 'simulated'} />
          </div>
          <div className="border-l border-zinc-900 pl-8 h-12 flex flex-col justify-center">
            <h1 className="text-2xl font-black tracking-[0.6em] text-white uppercase chromatic-aberration">Neural Sentinel</h1>
            <div className="flex gap-6 mt-1 items-center">
              <span className="text-[10px] font-black text-zinc-700 uppercase tracking-widest">Protocol:</span>
              <span className={`text-[10px] font-black uppercase tracking-widest`} style={{ color: currentAccent }}>{mode}</span>
              {piStats?.system?.hostname && (
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 border-l border-zinc-900 pl-4">
                  NODE: {piStats.system.hostname} <span className="text-zinc-700">|</span> {piStats.system.osName}
                </span>
              )}
              <div className="flex gap-6 ml-4 items-center border-l border-zinc-900 pl-6">
                <Tooltip name="NODE_LINK" source={mode} desc="Pi Target availability.">
                  <div className={`w-3 h-3 rounded-full ${session.targetIp ? 'bg-[#22c55e] glow-green' : 'bg-red-500 glow-red'}`}></div>
                </Tooltip>
                <Tooltip name="NEURAL_CORE" source={mode} desc="AI Intelligence status. PURPLE indicates stable link.">
                  <div className={`w-3 h-3 rounded-full ${aiLinkStable ? 'bg-[#bd00ff] glow-purple' : 'bg-zinc-800'}`}></div>
                </Tooltip>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-10">
          <button onClick={() => setShowConfig(true)} className={`p-3 transition-all hover:scale-110 ${showConfig ? 'text-[#bd00ff] glow-purple' : 'text-zinc-600 hover:text-white'}`}>
             <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          </button>
          <div onClick={toggleMode} className={`w-20 h-9 border border-zinc-900 bg-black cursor-pointer p-1.5 flex items-center shadow-inner relative`}>
              <div className={`w-6 h-6 transition-all shadow-md z-10`} style={{ transform: mode === OperationalMode.REAL ? 'translateX(2.6rem)' : 'translateX(0)', backgroundColor: currentAccent }}></div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        <div className="w-[70%] flex flex-col border-r border-[#1a1e24] overflow-hidden bg-[#020406]">
          <nav className="h-14 border-b border-[#1a1e24] flex items-center px-10 bg-[#0a0c0f] shrink-0">
            <div className="flex items-center h-full gap-12">
              {['dashboard', 'telemetry', 'pi_stats', 'toolkit', 'history'].map(tab => (
                <Tooltip key={tab} name={tab.toUpperCase()} source="SYSTEM" desc={getTabTooltip(tab)}>
                  <button onClick={() => setActiveTab(tab as any)} className={`text-[12px] font-black uppercase tracking-[0.4em] relative h-full flex items-center transition-all hover:text-white ${activeTab === tab ? 'text-white' : 'text-[#334155]'}`}>
                    {tab === 'pi_stats' ? 'SYSTEM_STATS' : tab.toUpperCase()}
                    {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-teal-400"></div>}
                  </button>
                </Tooltip>
              ))}
            </div>
          </nav>
          <div className="flex-1 overflow-y-auto p-10 relative scroll-smooth no-scroll">
               {activeTab === 'dashboard' && <Dashboard stats={piStats} mode={mode} session={session} onHandshake={handleHandshake} onDisconnect={() => setSession(s => ({...s, targetIp: null}))} onLog={addLog} onBrainClick={handleBrainRequest} onProbeClick={handleNeuralProbe} onAdapterCommand={runCommand} onRefresh={() => session.targetIp && fetchStats(session.targetIp)} processingId={processingId} />}
               {activeTab === 'pi_stats' && <PiStatsView stats={piStats} mode={mode} timeframe={settings.timeframe} onProbeClick={handleNeuralProbe} onBrainClick={handleBrainRequest} processingId={processingId} />}
               {activeTab === 'telemetry' && <TelemetryGraphs isSimulated={mode === OperationalMode.SIMULATED} isConnected={!!session.targetIp} timeframe={settings.timeframe} onProbe={handleNeuralProbe} onBrainClick={handleBrainRequest} processingId={processingId} />}
               {activeTab === 'toolkit' && <Toolkit mode={mode} onRunCommand={(cmd) => runCommand(cmd)} onBreakdown={(t, q) => handleNeuralProbe(t, { query: q })} />}
               {activeTab === 'history' && <History data={[]} onProbe={handleNeuralProbe} onBrainClick={handleBrainRequest} processingId={processingId} />}
          </div>
        </div>

        <div className="w-[30%] flex flex-col bg-[#020406] border-l border-[#1a1e24] relative overflow-hidden">
          <div className="h-14 border-b border-zinc-900 px-4 flex items-center bg-[#0a0c0f] shrink-0 justify-between">
             <div className="flex h-full">
               {(['neural', 'console', 'kernel', 'system'] as LogType[]).map(lt => (
                 <button key={lt} onClick={() => setActiveLogTab(lt)} className={`px-4 text-[10px] font-black uppercase tracking-widest relative h-full transition-colors ${activeLogTab === lt ? 'text-white' : 'text-zinc-600 hover:text-zinc-400'}`}>
                   {lt}
                   {activeLogTab === lt && <div className="absolute bottom-0 left-2 right-2 h-[2px] bg-purple-500"></div>}
                 </button>
               ))}
             </div>
             <div className="flex gap-4">
               <button onClick={clearActiveLog} className="text-[9px] font-black text-zinc-700 hover:text-red-500 transition-colors uppercase tracking-widest">CLEAR</button>
               <button onClick={probeActiveLog} className="text-[10px] font-black text-purple-400 hover:text-white transition-colors uppercase tracking-widest" disabled={isAnalyzing}>PROBE</button>
             </div>
          </div>
          
          <div className="relative flex-1 overflow-hidden">
            {settings.showAsciiBg && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                  <div className="whitespace-pre font-mono text-[6px] leading-[1] text-[#22c55e] opacity-[0.05] neural-bg-flash">
                      {ASCII_FROG}
                  </div>
              </div>
            )}

            <div className="absolute inset-0 overflow-y-auto p-6 space-y-4 bg-transparent no-scroll z-10 flex flex-col">
               {getActiveLogs().map(log => (
                 <div key={log.id} onClick={() => handleLogAction(log)} className={`border-l-2 pl-4 py-2 border-zinc-800 bg-black/40 backdrop-blur-[2px] group transition-all ${log.metadata ? 'cursor-help border-purple-500/40 hover:bg-purple-500/5' : ''}`}>
                   <div className="flex items-center gap-3 mb-1">
                     <span className="text-[10px] text-zinc-600 font-mono">{log.timestamp}</span>
                     <span className={`text-[8px] font-black px-1.5 py-0.5 border border-current uppercase ${log.level === LogLevel.SUCCESS ? 'text-green-500' : log.level === LogLevel.ERROR ? 'text-red-500' : log.level === LogLevel.COMMAND ? 'text-blue-500' : 'text-teal-600'}`}>[{log.level}]</span>
                   </div>
                   <p className="font-mono text-[12px] text-zinc-500 whitespace-pre-wrap">{log.message}</p>
                 </div>
               ))}
            </div>
          </div>
        </div>
      </main>

      {/* Persistence Config Modal */}
      <Modal isOpen={showConfig} onClose={() => setShowConfig(false)} title="SENTINEL_ENVIRONMENT_CONFIG" variant="purple">
         <div className="space-y-8">
            <div className="grid grid-cols-2 gap-8">
               <div className="space-y-4">
                  <label className="text-[11px] font-black text-zinc-700 uppercase">Provider_Core</label>
                  <div className="flex gap-2">
                    {Object.values(AIProvider).map(p => (
                      <button key={p} onClick={() => setAiConfig(prev => ({ ...prev, provider: p }))} className={`flex-1 py-3 text-[10px] font-black border transition-all ${aiConfig.provider === p ? 'bg-purple-500/10 border-purple-500 text-purple-400' : 'border-zinc-900 text-zinc-700'}`}>
                        {p}
                      </button>
                    ))}
                  </div>
               </div>
               <div className="space-y-4">
                  <label className="text-[11px] font-black text-zinc-700 uppercase">Sync_Interval (ms)</label>
                  <input type="number" step={500} value={settings.pollInterval} onChange={e => setSettings(s => ({...s, pollInterval: Number(e.target.value)}))} className="w-full bg-black border border-zinc-900 p-3 text-[12px] text-white font-mono" />
               </div>
            </div>

            <div className="space-y-4">
              <label className="text-[11px] font-black text-zinc-700 uppercase">Neural_Signal_History (Timeframe)</label>
              <div className="grid grid-cols-4 gap-2">
                {['1m', '5m', '15m', '30m', '1h', '6h', '12h', '24h'].map(t => (
                  <button key={t} onClick={() => setSettings(s => ({...s, timeframe: t as Timeframe}))} className={`py-2 text-[9px] font-black border transition-all ${settings.timeframe === t ? 'bg-teal-500/10 border-teal-500 text-teal-400' : 'border-zinc-900 text-zinc-700'}`}>
                    {t.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4 border-t border-zinc-900 pt-6">
              <label className="text-[11px] font-black text-zinc-700 uppercase">Tactical_Visual_Overrides</label>
              <div className="space-y-3">
                 <div className="flex justify-between items-center bg-black/40 p-3 border border-zinc-900">
                    <span className="text-[10px] text-zinc-400 font-black uppercase">Ominous_ASCII_Sentinel</span>
                    <button onClick={() => setSettings(s => ({...s, showAsciiBg: !s.showAsciiBg}))} className={`w-12 h-6 border p-1 flex items-center transition-all ${settings.showAsciiBg ? 'border-teal-500' : 'border-zinc-800'}`}>
                       <div className={`w-3 h-3 ${settings.showAsciiBg ? 'translate-x-6 bg-teal-500' : 'translate-x-0 bg-zinc-800'}`}></div>
                    </button>
                 </div>
                 <div className="flex justify-between items-center bg-black/40 p-3 border border-zinc-900">
                    <span className="text-[10px] text-zinc-400 font-black uppercase">Global_CRT_Distortion</span>
                    <button onClick={() => setSettings(s => ({...s, globalDistortion: !s.globalDistortion}))} className={`w-12 h-6 border p-1 flex items-center transition-all ${settings.globalDistortion ? 'border-teal-500' : 'border-zinc-800'}`}>
                       <div className={`w-3 h-3 ${settings.globalDistortion ? 'translate-x-6 bg-teal-500' : 'translate-x-0 bg-zinc-800'}`}></div>
                    </button>
                 </div>
              </div>
            </div>
         </div>
      </Modal>

      <Modal isOpen={!!tooltipData} onClose={() => setTooltipData(null)} title={tooltipData?.elementId || 'BRAIN'} variant="purple">
         {tooltipData && <div className="space-y-4 text-[12px]"><p className="text-zinc-300 italic">{tooltipData.description}</p><div className="p-4 bg-purple-950/20 border border-purple-500/30 text-zinc-100">{tooltipData.recommendation}</div></div>}
      </Modal>

      <Modal isOpen={!!neuralProbeResult} onClose={() => setNeuralProbeResult(null)} title={`DIAGNOSTIC: ${neuralProbeResult?.title}`} variant="blue">
         {neuralProbeResult?.data && (
           <div className="space-y-4 text-[12px]">
             <p className="text-zinc-300 pl-4 border-l-2 border-teal-500">{neuralProbeResult.data.description}</p>
             <div className="font-black text-teal-400 bg-teal-950/10 p-4 border border-teal-500/20">{neuralProbeResult.data.recommendation}</div>
           </div>
         )}
      </Modal>

      <footer className="h-10 border-t border-[#1a1e24] bg-[#020406] px-10 flex items-center justify-between text-[11px] font-bold text-[#20272f] uppercase tracking-[0.2em] shrink-0">
        <div className="flex gap-10">
          <span>SID: {session.id}</span>
          {piStats?.system?.hostname && <span>UPTIME: {Math.floor(piStats.system.uptime / 60)}m</span>}
        </div>
        <div style={{ color: currentAccent }}>LINK STABLE {mode}</div>
      </footer>
    </div>
  );
};

export default App;
