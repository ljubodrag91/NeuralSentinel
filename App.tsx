
import React, { useState, useEffect, useCallback } from 'react';
import { 
  OperationalMode, 
  SessionInfo, 
  LogEntry, 
  LogLevel, 
  LogType, 
  PiStats, 
  NeuralNetworkProvider, 
  NeuralNetworkConfig, 
  AppSettings, 
  Launcher
} from './types';
import Dashboard from './Dashboard';
import PiStatsView from './components/PiStatsView';
import TelemetryGraphs from './components/TelemetryGraphs';
import Toolkit from './components/Toolkit';
import History from './components/History';
import AdminPanel from './components/AdminPanel';
import NeuralCore from './components/NeuralCore';
import Modal from './components/common/Modal';
import Tooltip from './components/common/Tooltip';
import InventoryDialog from './components/common/InventoryDialog';
import TacticalButton from './components/common/TacticalButton';
import BrainIcon from './components/common/BrainIcon';
import { aiTransport } from './services/aiTransport';
import { launcherSystem } from './services/launcherService';
import { serverService } from './services/serverService';
import { PROBE_CONTRACTS } from './services/probeContracts';
import { HistoryStorage } from './services/historyStorage';

const SETTINGS_KEY = 'neural_sentinel_app_settings';

const FROG_ASCII = `⠀⠀⠀⢀⣠⠤⠶⠖⠒⠒⠶⠦⠤⣄⠀⠀⠀⣀⡤⠤⠤⠤⠤⣄⡀
⠀⣴⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠙⣦⠞⠁⠀⠀⠀⠀⠀⠀⠉⠳⡄
⡾⠁⠀⠀⠀⠀⠀⠀⣀⣀⣀⣀⣀⣀⣘⡆⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⣆
⠀⠀⠀⠀⢀⡴⠚⠉⠁⠀⠀⠀⠀⠈⠉⠙⠲⣄⣤⠤⠶⠒⠒⠲⠦⢤⣜⣧
⠀⠀⠀⠀⠉⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠳⡄⠀⠀⠀⠀⠀⠀⠀⠉⠳⢄⡀
⠀⠀⠀⠀⠀⠀⠀⣀⣀⣀⣀⣀⣀⣀⣀⣀⣀⣀⣀⠹⣆⠀⠀⠀⠀⠀⠀⣀⣀⣀⣹⣄
⠀⠀⠀⠀⣠⠞⣉⣡⠤⠴⠿⠗⠳⠶⣬⣙⠓⢦⡈⠙⢿⡀⠀⠀⢀⣼⣿⣿⣿⣿⣿⡿⣷⣤⡀
⠀⠀⠀⣾⣡⠞⣉⣀⣀⣀⣠⣤⣤⣤⣄⣭⣷⣦⣽⣦⡀⢻⡄⠰⢟⣥⣾⣿⣏⣉⡙⠓⢦⣻⠃
⠀⠀⠀⠉⠉⠙⠻⢤⣄⣼⣿⣽⣿⠟⠻⣿⠄⠀⠀⢻⡝⢿⡇⣠⣿⣿⣻⣿⠿⣿⡉⠓⠮⣿
⠀⠀⠀⠀⠀⠀⠙⢦⡈⠛⠿⣾⣿⣶⣾⡿⠀⠀⠀⢀⣳⣘⢻⣇⣿⣿⣽⣿⣶⾾⠃⣀⡴⣿
⠀⠀⠀⠀⠀⠀⠀⠀⠙⠲⠤⢄⣈⣉⣙⣓⣒⣒⣚⣉⣥⠟⠀⢯⣉⡉⠉⠉⠛⢉⣉⣡⡾⠁
⠀⠀⣠⣤⡤⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢈⡿⠋⠀⠀⠀⠀⠈⠻⣍⠉⠀⠺⠿⠋⠙⣦
⠀⣀⣥⣤⠴⠆⠀⠀⠀⠀⠀⠀⠀⣀⣠⠤⠖⠋⠀⠀⠀⠀⠀⠀⠀⠀⠈⠳⠀⠀⠀⠀⠀⢸⣧
⠸⢫⡟⠙⣛⠲⠤⣄⣀⣀⠀⠈⠋⠉⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣠⠏⣨⠇
⠀⠀⠻⢦⣈⠓⠶⠤⣄⣉⠉⠉⠛⠒⠲⠦⠤⠤⣤⣀⣀⣀⣀⣀⣀⣀⣀⣀⣀⣀⣠⠴⢋⡴⠋
⠀⠀⠀⠀⠉⠓⠦⣄⡀⠈⠙⠓⠒⠶⠶⠶⠶⠤⣤⣀⣀⣀⣀⣀⣉⣉⣉⣉⣉⣀⣠⠴⠋⣿
⠀⠀⠀⠀⠀⠀⠀⠀⠉⠓⠦⣄⣀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⡼⠁
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⠉⠙⠛⠒⠒⠒⠒⠒⠤⠤⠤⠒⠒⠒⠒⠒⠒⠚⢉⡇
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣠⠴⠚⠛⠳⣤⠞⠁
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣤⠚⠁⠀⠀⠀⠀⠘⠲⣄⡀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣴⠋⠙⢷⡋⢙⡇⢀⡴⢒⡿⢶⣄⡴⠀⠙⣳⣄
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⢦⡀⠈⠛⢻⠛⢉⡴⣋⡴⠟⠁⠀⠀⠀⠀⠈⢧⡀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢻⡄⠀⠘⣶⢋⡞⠁⠀⠀⢀⡴⠂⠀⠀⠀⠀⠹⣄
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡇⠀⠀⠈⠻⢦⡀⠀⣰⠏⠀⠀⢀⡴⠂⠀⠀⠀⠀⠹⣄
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢠⡾⢷⡄⠀⠀⠀⠀⠉⠙⠯⠀⠀⡴⠋⠀⢠⠟⠀⠀⢹⡄`;

const App: React.FC = () => {
  const [mode, setMode] = useState<OperationalMode>(OperationalMode.SIMULATED);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'telemetry' | 'toolkit' | 'pi_stats' | 'history' | 'admin'>('dashboard');
  const [activeLogTab, setActiveLogTab] = useState<LogType>('neural');
  const [unreadLogs, setUnreadLogs] = useState<Record<LogType, boolean>>({ neural: false, console: false, kernel: false, system: false });
  const [showInventory, setShowInventory] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [piStats, setPiStats] = useState<PiStats | null>(null);
  const [activeTelemetry, setActiveTelemetry] = useState<Set<string>>(new Set(['cpu']));
  
  const [terminalHistory, setTerminalHistory] = useState<string[]>([]);
  const [launcherPickerModal, setLauncherPickerModal] = useState<{panelId: string, type: 'core' | 'neural'} | null>(null);

  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem(SETTINGS_KEY);
    return saved ? JSON.parse(saved) : {
      showAsciiBg: true,
      globalDistortion: true,
      panelDistortion: true,
      pollInterval: 5,
      timeframe: '1m',
      frogInterval: 30,
      frogColor: '#00ffd5',
      frogIntensity: 0.3,
      coreRechargeRate: 60,
      neuralRechargeRate: 30,
      maxCoreCharges: 5,
      maxNeuralCharges: 5,
      probeLaunchers: {
        'GLOBAL_SYSTEM_AUDIT': 'std-core',
        'HANDSHAKE_CORE': 'std-core',
        'ADAPTER_HUB': 'std-core',
        'TERMINAL_COMMAND_AUDIT': 'std-core',
        'NODE_DIAGNOSTICS': 'std-core',
        'PROCESS_AUDIT': 'std-core',
        'RSSI_REPORT': 'std-core',
        'SESSION_ARCHIVE': 'std-core',
        'LOG_AUDIT': 'std-core',
        'brain_tooltip': 'std-neural'
      }
    };
  });

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  const [chargesState, setChargesState] = useState<Record<string, { current: number, progress: number }>>({});
  const [neuralLogs, setNeuralLogs] = useState<LogEntry[]>([]);
  const [consoleLogs, setConsoleLogs] = useState<LogEntry[]>([]);
  const [kernelLogsState, setKernelLogs] = useState<LogEntry[]>([]);
  const [systemLogs, setSystemLogs] = useState<LogEntry[]>([]);

  const [latestCoreProbeResult, setLatestCoreProbeResult] = useState<any>(null);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [processingId, setProcessingId] = useState<string | undefined>(undefined);
  const [probeContextModal, setProbeContextModal] = useState<{title: string, payload: any} | null>(null);

  const [neuralConfig, setNeuralConfig] = useState<NeuralNetworkConfig>({
    provider: NeuralNetworkProvider.GEMINI,
    endpoint: 'http://localhost:1234/v1',
    model: 'gemini-3-flash-preview',
    fallbackToLocal: false
  });

  const [session, setSession] = useState<SessionInfo>({
    id: Math.random().toString(36).substring(7).toUpperCase(),
    startTime: new Date().toISOString(),
    mode: OperationalMode.SIMULATED,
    targetIp: null,
    status: 'IDLE'
  });

  const currentAccent = mode === OperationalMode.REAL ? (session.status === 'ACTIVE' ? '#22c55e' : '#ff3e3e') : '#00f2ff';

  const addLog = useCallback((msg: string, level: LogLevel = LogLevel.INFO, type: LogType = 'neural', metadata?: any) => {
    const entry: LogEntry = {
      id: Math.random().toString(36),
      timestamp: new Date().toLocaleTimeString(),
      level,
      message: msg,
      source: mode,
      metadata
    };
    const setLog = type === 'neural' ? setNeuralLogs : type === 'console' ? setConsoleLogs : type === 'kernel' ? setKernelLogs : setSystemLogs;
    setLog(prev => [entry, ...prev].slice(0, 100));
    if (activeLogTab !== type) setUnreadLogs(prev => ({ ...prev, [type]: true }));
  }, [mode, activeLogTab]);

  useEffect(() => {
    const heartbeat = setInterval(async () => {
      if (mode === OperationalMode.REAL && session.targetIp) {
        try {
          const res = await fetch(`http://${session.targetIp}:5050/stats`, { signal: AbortSignal.timeout(3000) });
          const stats = await res.json();
          setPiStats(stats);
          setSession(s => ({ ...s, status: 'ACTIVE' }));
        } catch {
          setSession(s => ({ ...s, status: 'TERMINATED' }));
          setPiStats(null);
        }
      } else if (mode === OperationalMode.SIMULATED) {
        setPiStats({
          cpu: { usage: 10 + Math.random() * 20, temp: 40 + Math.random() * 10, load: [0.5, 0.3, 0.1], cores: 4 },
          memory: { usage: 40 + Math.random() * 5, used: 1.5, total: 4.0 },
          system: { hostname: 'kali-sim-node', uptime: 3600, osName: 'Kali Linux' },
          network: { inRate: 12, outRate: 5, interfaces: {} },
          processes: { total: 120, topByCpu: [] }
        });
      }
    }, settings.pollInterval * 1000);
    return () => clearInterval(heartbeat);
  }, [mode, session.targetIp, settings.pollInterval]);

  const handleNeuralProbe = async (panelName: string, metrics: any) => {
    if (processingId) return;
    const contract = PROBE_CONTRACTS[panelName] || PROBE_CONTRACTS['LOG_AUDIT'];
    const launcherId = settings.probeLaunchers[panelName] || 'std-core';
    if (!serverService.validateProbe(launcherId)) {
      addLog(`PROBE_REJECTED: Insufficient charges in [${launcherId}]`, LogLevel.ERROR, 'neural');
      return;
    }
    setProcessingId(panelName);

    const history = contract?.isDataProbe ? HistoryStorage.getCSV('stats', 'CPU,MEM,TEMP') : '';
    // Reinforced instruction to ensure valid JSON with required fields for Dashboard status
    const systemInstruction = `You are a professional Kali Linux SOC analyst. Analyze the provided telemetry data.
RESPONSE FORMAT:
You must return a single valid JSON object. Do not include any markdown formatting.
The JSON object must have exactly these fields:
{
  "status": "A short status string (e.g., SYSTEMS NOMINAL, THREAT DETECTED)",
  "description": "A detailed technical breakdown of the system state, mentioning specific metrics.",
  "recommendation": "A clear, actionable next step for the operator.",
  "threatLevel": "LOW", "MEDIUM", "HIGH", or "CRITICAL"
}`;
    const response = await aiTransport.fetch(neuralConfig, systemInstruction, JSON.stringify(contract.buildPayload(metrics, history)), !!contract?.isDataProbe);
    
    if (response.success) {
      if (panelName === 'GLOBAL_SYSTEM_AUDIT') setLatestCoreProbeResult(response.data);
      addLog(`Probe executed: ${panelName}`, LogLevel.SUCCESS, 'neural', { 
        type: 'PROBE_RESULT', title: panelName, data: response.data, requestBody: response.requestBody, launcherId 
      });
    } else {
      addLog(`Probe failure: ${response.error}`, LogLevel.ERROR, 'neural');
    }
    setProcessingId(undefined);
  };

  const handleBrainRequest = async (id: string, type: string, metrics: any) => {
    if (processingId) return;
    const launcherId = settings.probeLaunchers['brain_tooltip'] || 'std-neural';
    if (!serverService.validateProbe(launcherId)) {
      addLog(`NEURAL_REJECTED: ${launcherId} empty.`, LogLevel.ERROR, 'neural');
      return;
    }
    setProcessingId(id);
    const systemInstruction = `Inference engine. Provide concise security insight. JSON: {"description": "...", "recommendation": "..."}`;
    const response = await aiTransport.fetch(neuralConfig, systemInstruction, JSON.stringify({id, metrics}), false);
    if (response.success) {
      addLog(`Inference Sync: ${id}`, LogLevel.NEURAL, 'neural', {
        type: 'PROBE_RESULT', title: `Brain: ${id}`, data: response.data, requestBody: response.requestBody, launcherId
      });
      setProbeContextModal({ title: `BRAIN_INSIGHT: ${id}`, payload: response.data });
    }
    setProcessingId(undefined);
  };

  const handleHandshake = (ip: string, user: string, pass: string, port: number) => {
    addLog(`INITIATING HANDSHAKE: ${user}@${ip}:${port}`, LogLevel.SYSTEM, 'system');
    setSession(s => ({ ...s, targetIp: ip, status: 'IDLE' }));
    
    if (mode === OperationalMode.SIMULATED) {
      setTimeout(() => {
        setSession(s => ({ ...s, status: 'ACTIVE' }));
        addLog(`HANDSHAKE ESTABLISHED: Link stable.`, LogLevel.SUCCESS, 'system');
      }, 1200);
    }
  };

  const handleCommand = async (cmd: string) => {
    addLog(`$ ${cmd}`, LogLevel.COMMAND, 'console');
    setTerminalHistory(prev => [...prev, `root@kali:~# ${cmd}`]);
    if (mode === OperationalMode.SIMULATED) {
      setTerminalHistory(prev => [...prev, `[*] Identifying execution vector...`, `[+] Task transmitted to node buffer.`]);
    } else if (session.targetIp) {
      try {
        const res = await fetch(`http://${session.targetIp}:5050/exec`, {
          method: 'POST',
          body: JSON.stringify({ command: cmd }),
          headers: { 'Content-Type': 'application/json' }
        });
        const data = await res.json();
        setTerminalHistory(prev => [...prev, data.output || "Execution completed."]);
      } catch (e: any) {
        setTerminalHistory(prev => [...prev, `[ERROR] COMMS_ERR: ${e.message}`]);
      }
    }
  };

  useEffect(() => {
    const tick = 1000;
    const interval = setInterval(() => {
      setChargesState(prev => {
        const next = { ...prev };
        launcherSystem.getAll().forEach(l => {
          const current = serverService.getCharges(l.id);
          const state = next[l.id] || { current, progress: 0 };
          if (current < l.maxCharges) {
            let nextProgress = state.progress + (100 / l.rechargeRate);
            if (nextProgress >= 100) {
              serverService.recharge(l.id);
              nextProgress = 0;
            }
            next[l.id] = { current: serverService.getCharges(l.id), progress: nextProgress };
          } else {
            next[l.id] = { current, progress: 0 };
          }
        });
        return next;
      });
    }, tick);
    return () => clearInterval(interval);
  }, []);

  const activeLaunchersList = Array.from(new Set(Object.values(settings.probeLaunchers) as string[]))
    .map(id => launcherSystem.getById(id))
    .filter((l): l is Launcher => l !== undefined);

  return (
    <div className={`flex flex-col h-screen overflow-hidden ${mode === OperationalMode.REAL ? 'mode-real' : 'mode-sim'}`}>
      <header className="h-24 border-b border-[#1a1e24] bg-[#050608] px-8 flex items-center justify-between z-50 shrink-0">
        <div className="flex items-center gap-10">
          <NeuralCore state={mode === OperationalMode.REAL ? (session.status === 'ACTIVE' ? 'connected' : 'disconnected') : 'simulated'} />
          <div className="flex flex-col justify-center">
            <h1 className="text-2xl font-black tracking-[0.6em] text-white uppercase chromatic-aberration ml-4">Neural Sentinel</h1>
            {/* RESTORED STATUS DIV */}
            <div className="flex gap-6 mt-1 items-center ml-4">
              <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: currentAccent }}>{mode} PROTOCOL</span>
              <div className="flex gap-4 ml-4">
                <Tooltip name="NEURAL_UPLINK" source="AI" desc="Active synaptic link to the Neural Engine. Click to toggle visual distortion effects.">
                  <div onClick={() => setSettings(s => ({...s, globalDistortion: !s.globalDistortion}))} className="block cursor-help">
                    <div className={`w-4 h-4 rounded-full border border-black cursor-pointer transition-all ${settings.globalDistortion ? 'bg-purple-500 glow-purple' : 'bg-zinc-800'}`}></div>
                  </div>
                </Tooltip>
                <Tooltip name="SERVICE_LINK" source="SYSTEM" desc="Telemetry Daemon heartbeat status. Click to toggle background ASCII Watcher visibility.">
                  <div onClick={() => setSettings(s => ({...s, showAsciiBg: !s.showAsciiBg}))} className="block cursor-help">
                    <div className={`w-4 h-4 rounded-full border border-black cursor-pointer transition-all ${session.status === 'ACTIVE' || mode === OperationalMode.SIMULATED ? 'bg-teal-500 glow-teal' : 'bg-red-500'}`}></div>
                  </div>
                </Tooltip>
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 border-l border-zinc-900 pl-4">
                {piStats?.system?.hostname ? `KALI@${piStats.system.hostname}` : 'KALI@OFFLINE-SENTINEL'}
              </span>
            </div>
          </div>
        </div>
        
        {/* LAUNCHERS HEADER */}
        <div className="flex items-center gap-6 flex-1 justify-center px-10">
          {activeLaunchersList.map(l => {
            const state = chargesState[l.id] || { current: serverService.getCharges(l.id), progress: 0 };
            return (
              <Tooltip key={l.id} name={l.name.toUpperCase()} source="SYSTEM" desc={l.description}>
                <div onClick={() => setShowInventory(true)} className="cursor-pointer flex flex-col items-center gap-1.5 bg-black/30 p-2 border border-zinc-900/50 rounded-sm hover:border-zinc-700 transition-all min-w-[120px] group">
                  
                   <div className="flex gap-1.5">
                    {[...Array(l.maxCharges)].map((_, i) => (
                      <div 
                        key={i} 
                        className={`w-2 h-7 border transition-all duration-500`} 
                        style={{ 
                           backgroundColor: i < state.current ? l.color : 'transparent', 
                           borderColor: i < state.current ? l.color : '#333',
                           boxShadow: i < state.current ? `0 0 10px ${l.color}` : 'none',
                           clipPath: 'polygon(0% 0%, 100% 0%, 100% 75%, 50% 100%, 0% 75%)',
                           opacity: i < state.current ? 1 : 0.3
                        }}
                      ></div>
                    ))}
                  </div>

                  <div className="w-full h-[1px] bg-zinc-900 relative overflow-hidden">
                    <div className="absolute h-full transition-all duration-500" style={{ width: `${state.progress}%`, backgroundColor: l.color }}></div>
                  </div>

                  <span className="text-[9px] font-black uppercase tracking-[0.1em] group-hover:text-white transition-colors" style={{ color: l.color }}>
                    {l.name}: {state.current}/{l.maxCharges}
                  </span>
                </div>
              </Tooltip>
            );
          })}
        </div>

        <div className="flex items-center gap-8">
           <button onClick={() => setShowInventory(true)} className="p-2 text-zinc-600 hover:text-white transition-colors">
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
           </button>
           <button onClick={() => setShowConfig(true)} className="p-2 text-zinc-600 hover:text-white transition-colors">
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 15a3 3 0 100-6 3 3 0 000 6z"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
           </button>
           <button onClick={() => setMode(m => m === OperationalMode.REAL ? OperationalMode.SIMULATED : OperationalMode.REAL)} className="w-16 h-8 border border-zinc-900 bg-black p-1 flex items-center">
              <div className={`w-6 h-6 transition-all ${mode === OperationalMode.REAL ? 'translate-x-8' : ''}`} style={{ backgroundColor: currentAccent }}></div>
           </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        <div className="w-[70%] flex flex-col border-r border-[#1a1e24] bg-[#020406]">
          <nav className="h-14 border-b border-[#1a1e24] flex items-center justify-center gap-12 bg-[#0a0c0f]">
            {['dashboard', 'telemetry', 'pi_stats', 'toolkit', 'history', 'admin'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab as any)} className={`text-[13px] font-black uppercase tracking-[0.2em] relative h-full flex items-center ${activeTab === tab ? 'text-white' : 'text-zinc-600'}`}>
                {tab.replace('_', ' ')}
                {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-1 bg-teal-500"></div>}
              </button>
            ))}
          </nav>
          <div className="flex-1 overflow-y-auto p-10 no-scroll">
            {activeTab === 'dashboard' && <Dashboard stats={piStats} mode={mode} session={session} settings={settings} terminalHistory={terminalHistory} onHandshake={handleHandshake} onDisconnect={() => setSession(s => ({...s, targetIp: null, status: 'IDLE'}))} onLog={addLog} onBrainClick={handleBrainRequest} onProbeClick={handleNeuralProbe} onProbeInfo={(title, payload) => setProbeContextModal({title, payload})} onLauncherSelect={(id, type) => setLauncherPickerModal({panelId: id, type})} onAdapterCommand={handleCommand} onRefresh={() => {}} processingId={processingId} latestCoreProbeResult={latestCoreProbeResult} activeTelemetry={activeTelemetry} />}
            {activeTab === 'pi_stats' && <PiStatsView stats={piStats} mode={mode} timeframe="1m" settings={settings} onProbeClick={handleNeuralProbe} onBrainClick={handleBrainRequest} onProbeInfo={(title, payload) => setProbeContextModal({title, payload})} onLauncherSelect={(id, type) => setLauncherPickerModal({panelId: id, type})} activeTelemetry={activeTelemetry} setActiveTelemetry={setActiveTelemetry} />}
            {activeTab === 'telemetry' && <TelemetryGraphs timeframe="1m" isSimulated={mode === OperationalMode.SIMULATED} isConnected={!!session.targetIp} onProbe={handleNeuralProbe} onProbeInfo={(title, payload) => setProbeContextModal({title, payload})} onBrainClick={handleBrainRequest} />}
            {activeTab === 'history' && <History data={historyData} onProbe={handleNeuralProbe} onProbeInfo={(title, payload) => setProbeContextModal({title, payload})} onBrainClick={handleBrainRequest} />}
            {activeTab === 'admin' && <AdminPanel />}
          </div>
        </div>
        
        {/* LOG PANEL WITH WATCHER AND PROBES */}
        <div className="w-[30%] flex flex-col bg-[#020406] border-l border-[#1a1e24] overflow-hidden relative">
          <div className="h-14 border-b border-zinc-900 px-4 flex items-center justify-between bg-[#0a0c0f] z-10">
             <div className="flex h-full">
               {(['neural', 'console', 'kernel', 'system'] as LogType[]).map(lt => (
                 <button key={lt} onClick={() => { setActiveLogTab(lt); setUnreadLogs(v => ({...v, [lt]: false})); }} className={`px-4 text-[10px] font-black uppercase tracking-widest relative h-full ${activeLogTab === lt ? 'text-white' : 'text-zinc-700'} ${unreadLogs[lt] ? 'animate-pulse text-teal-400' : ''}`}>
                   {lt}
                   {activeLogTab === lt && <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-purple-500"></div>}
                 </button>
               ))}
             </div>
             
             {/* DATA PROBE FOR LOGS HEADER */}
             <div className="flex items-center gap-2">
               <Tooltip name="LOG_AUDIT" source="NEURAL_NETWORK" variant="purple" desc="Perform a deep audit on the current log stream.">
                 <div className="flex items-center gap-1.5">
                   <button onClick={() => setLauncherPickerModal({panelId: 'LOG_AUDIT', type: 'core'})} className="w-3.5 h-3.5 border border-zinc-700 bg-black flex items-center justify-center">
                     <div className="w-1.5 h-1.5" style={{ backgroundColor: launcherSystem.getById(settings.probeLaunchers['LOG_AUDIT'])?.color || '#bd00ff' }} />
                   </button>
                   <TacticalButton label="AUDIT" size="sm" onClick={() => handleNeuralProbe('LOG_AUDIT', { logs: activeLogTab === 'neural' ? neuralLogs : activeLogTab === 'console' ? consoleLogs : activeLogTab === 'kernel' ? kernelLogsState : systemLogs })} color={launcherSystem.getById(settings.probeLaunchers['LOG_AUDIT'])?.color || '#bd00ff'} />
                 </div>
               </Tooltip>
             </div>
          </div>

          <div className="relative flex-1 overflow-hidden flex flex-col">
             {/* WATCHER BACKGROUND FLASH - Only shows when processing OR toggled via settings.showAsciiBg AND neural tab */}
             {(processingId || (settings.showAsciiBg && !processingId)) && activeLogTab === 'neural' && (
                <div className={`absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden ${!processingId ? 'opacity-20' : ''}`}>
                  <pre className="text-[6px] leading-[1] font-bold select-none neural-bg-flash whitespace-pre text-center" style={{ color: settings.frogColor, opacity: settings.frogIntensity }}>
                      {FROG_ASCII}
                  </pre>
                </div>
             )}

             <div className="relative z-10 flex-1 overflow-y-auto p-6 space-y-4 no-scroll font-mono text-[11px]">
               {(activeLogTab === 'neural' ? neuralLogs : activeLogTab === 'console' ? consoleLogs : activeLogTab === 'kernel' ? kernelLogsState : systemLogs).map(log => {
                 const isAiLog = log.metadata?.type === 'PROBE_RESULT';
                 const isWatcher = log.metadata?.type === 'WATCHER_SYNC';
                 
                 // DYNAMIC COLOR RESOLUTION
                 let accentColor = '#a1a1aa'; // Default zinc-400
                 let borderColor = '#27272a'; // Default zinc-800

                 if (log.level === LogLevel.ERROR) {
                    accentColor = '#f87171'; // red-400
                    borderColor = '#7f1d1d'; // red-900
                 } else if (isWatcher) {
                    accentColor = settings.frogColor;
                    borderColor = settings.frogColor; 
                 } else if (isAiLog) {
                    let lId = log.metadata?.launcherId;
                    if (!lId) {
                       // Fallback heuristic if launcherId missing
                       if (log.metadata?.title?.includes('Brain')) lId = settings.probeLaunchers['brain_tooltip'] || 'std-neural';
                       else lId = settings.probeLaunchers[log.metadata?.title || ''] || 'std-core';
                    }
                    const launcher = launcherSystem.getById(lId);
                    if (launcher) {
                       accentColor = launcher.color;
                       borderColor = launcher.color;
                    } else {
                       accentColor = '#bd00ff'; 
                       borderColor = '#bd00ff';
                    }
                 }

                 return (
                    <div key={log.id} 
                         className="border-l-2 pl-4 py-2 bg-black/40 relative group mb-2 transition-all"
                         style={{ borderColor: isAiLog || isWatcher ? borderColor : undefined }}
                    >
                      <div className="absolute top-2 right-2 flex gap-2">
                        {/* BRAIN PROBE FOR LOG PANEL ENTRIES */}
                        <Tooltip name="SYNAPTIC_INFERENCE" source="AI" variant="teal" desc="Run neural inference on this specific log entry.">
                          <BrainIcon onClick={() => handleBrainRequest(log.id, 'Log Entry', { message: log.message, timestamp: log.timestamp })} className="!p-0 !w-4 !h-4" />
                        </Tooltip>
                        
                        {isAiLog && log.metadata?.requestBody && (
                          <button 
                            onClick={() => setProbeContextModal({ 
                              title: `FULL_NEURAL_AUDIT: ${log.metadata?.title}`, 
                              payload: { REQUEST: log.metadata.requestBody, RESPONSE: log.metadata.data } 
                            })}
                            className="px-2 py-0.5 bg-purple-500/20 hover:bg-purple-500 border border-purple-500/50 rounded-[1px] text-[7px] font-black text-purple-400 transition-all uppercase"
                          >
                            Audit
                          </button>
                        )}
                      </div>
                      <div className="flex justify-between items-start mb-1 text-[9px] text-zinc-600">
                        <span>{log.timestamp}</span> 
                      </div>
                      <pre 
                         className="whitespace-pre-wrap text-[11px]"
                         style={{ 
                           color: isWatcher ? settings.frogColor : (isAiLog ? accentColor : undefined),
                           opacity: isWatcher ? settings.frogIntensity : 1,
                           textShadow: isAiLog ? `0 0 10px ${accentColor}33` : 'none'
                         }}
                      >
                        <span className={!isAiLog && !isWatcher && log.level !== LogLevel.ERROR ? 'text-zinc-400' : ''}>
                          {log.message}
                        </span>
                      </pre>
                    </div>
                 );
               })}
             </div>
          </div>
        </div>
      </main>

      <Modal isOpen={showConfig} onClose={() => setShowConfig(false)} title="NEURAL_NETWORK_MATRIX" variant="teal">
        <div className="space-y-8">
           <div className="grid grid-cols-2 gap-4">
             <button onClick={() => setNeuralConfig(c => ({...c, provider: NeuralNetworkProvider.GEMINI}))} className={`p-4 border ${neuralConfig.provider === 'GEMINI' ? 'border-teal-500 text-teal-400 bg-teal-500/10' : 'border-zinc-900 text-zinc-700'} font-black text-[10px]`}>GOOGLE_GEMINI</button>
             <button onClick={() => setNeuralConfig(c => ({...c, provider: NeuralNetworkProvider.LOCAL}))} className={`p-4 border ${neuralConfig.provider === 'LOCAL' ? 'border-teal-500 text-teal-400 bg-teal-500/10' : 'border-zinc-900 text-zinc-700'} font-black text-[10px]`}>LOCAL_ENDPOINT</button>
           </div>
           
           <div className="space-y-4 p-6 border border-zinc-900 bg-black/40">
              <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest border-b border-zinc-900 pb-2 mb-4">Watcher_Subsystem_Configuration</h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                   <label className="text-[8px] text-zinc-700 font-black uppercase">Presence_Hue</label>
                   <input type="color" value={settings.frogColor} onChange={e => setSettings(s => ({...s, frogColor: e.target.value}))} className="w-full h-8 bg-transparent border border-zinc-900 cursor-pointer" />
                </div>
                <div className="space-y-2">
                   <label className="text-[8px] text-zinc-700 font-black uppercase">Luminosity_Gain</label>
                   <input type="range" min="0.1" max="1.0" step="0.1" value={settings.frogIntensity} onChange={e => setSettings(s => ({...s, frogIntensity: parseFloat(e.target.value)}))} className="w-full accent-teal-500" />
                </div>
              </div>
           </div>

           <div className="space-y-4">
             <label className="text-[9px] text-zinc-700 uppercase font-black tracking-widest">Model_Vector</label>
             <input value={neuralConfig.model} onChange={e => setNeuralConfig(c => ({...c, model: e.target.value}))} className="w-full bg-black border border-zinc-900 p-3 text-[11px] font-mono text-white outline-none focus:border-teal-500/30" />
           </div>
        </div>
      </Modal>

      {launcherPickerModal && (
        <Modal isOpen={!!launcherPickerModal} onClose={() => setLauncherPickerModal(null)} title={`CONFIGURE_LAUNCHER: ${launcherPickerModal.panelId}`} variant="teal">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {launcherSystem.getCompatible(launcherPickerModal.type).map(l => (
              <div key={l.id} onClick={() => { setSettings(s => ({ ...s, probeLaunchers: { ...s.probeLaunchers, [launcherPickerModal.panelId]: l.id } })); setLauncherPickerModal(null); }} className={`p-4 border cursor-pointer transition-all ${settings.probeLaunchers[launcherPickerModal.panelId] === l.id ? 'bg-teal-500/10 border-teal-500' : 'bg-black border-zinc-900'} hover:border-teal-500`} style={{ borderColor: settings.probeLaunchers[launcherPickerModal.panelId] === l.id ? l.color : undefined }}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: l.color }}>{l.name}</span>
                  {settings.probeLaunchers[launcherPickerModal.panelId] === l.id && <div className="w-1.5 h-1.5 rounded-full bg-teal-500"></div>}
                </div>
                <p className="text-[9px] text-zinc-600 mb-4 italic leading-tight">"{l.description}"</p>
                <div className="flex justify-between text-[8px] font-mono text-zinc-800 uppercase">
                  <span>Charges: {l.maxCharges}</span>
                  <span>Rate: {l.rechargeRate}s</span>
                </div>
              </div>
            ))}
          </div>
        </Modal>
      )}

      <InventoryDialog isOpen={showInventory} onClose={() => setShowInventory(false)} onSwap={() => {}} />
      <Modal isOpen={!!probeContextModal} onClose={() => setProbeContextModal(null)} title={`${probeContextModal?.title}`} variant="purple">
         {probeContextModal && <pre className="p-6 bg-black border border-zinc-900 text-purple-400 overflow-auto text-[10px] whitespace-pre-wrap">{JSON.stringify(probeContextModal.payload, null, 2)}</pre>}
      </Modal>
    </div>
  );
};

export default App;
