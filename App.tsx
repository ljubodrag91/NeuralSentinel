
import React, { useState, useEffect, useCallback } from 'react';
import { 
  OperationalMode, 
  SessionInfo, 
  LogEntry, 
  LogLevel, 
  LogType, 
  CoreStats, 
  NeuralNetworkProvider, 
  NeuralNetworkConfig, 
  AppSettings, 
  Launcher,
  Platform,
  DataSourceMode
} from './types';
import Dashboard from './components/Dashboard';
import CoreStatsView from './components/CoreStatsView';
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
import { sessionManager } from './services/sessionManager';
import { LOCAL_MODELS } from './services/config';
import { testAiAvailability } from './services/aiService';

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
  const [mode, setMode] = useState<OperationalMode>(OperationalMode.OFFLINE);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'telemetry' | 'toolkit' | 'core_stats' | 'history' | 'admin'>('dashboard');
  const [activeLogTab, setActiveLogTab] = useState<LogType>('neural');
  const [unreadLogs, setUnreadLogs] = useState<Record<LogType, boolean>>({ neural: false, console: false, kernel: false, system: false });
  const [showInventory, setShowInventory] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [coreStats, setCoreStats] = useState<CoreStats | null>(null);
  const [activeTelemetry, setActiveTelemetry] = useState<Set<string>>(new Set(['cpu']));
  
  const [uplinkStatus, setUplinkStatus] = useState({ neural: false, service: false });

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
        'GLOBAL_SYSTEM_PROBE': 'std-core',
        'HANDSHAKE_CORE': 'std-core',
        'ADAPTER_HUB': 'std-core',
        'CONSOLE_DATA_PROBE': 'std-core',
        'NODE_DIAGNOSTICS': 'std-core',
        'PROCESS_PROBE': 'std-core',
        'RSSI_REPORT': 'std-core',
        'SESSION_ARCHIVE': 'std-core',
        'LOG_AUDIT': 'std-core',
        'brain_tooltip': 'std-neural'
      },
      telemetryEnabled: true,
      neuralUplinkEnabled: true,
      platform: Platform.WINDOWS, // Default to Windows
      dataSourceMode: 'LOCAL' as DataSourceMode // Default to Local
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
    mode: OperationalMode.OFFLINE,
    targetIp: null,
    status: 'IDLE'
  });

  const currentAccent = mode === OperationalMode.REAL ? (session.status === 'ACTIVE' ? '#22c55e' : '#ff3e3e') : '#52525b';

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

  // Initial Load - Check for persisted session
  useEffect(() => {
    const persisted = sessionManager.loadSession();
    if (persisted) {
      setSession(s => ({
        ...s,
        targetIp: persisted.ip,
        authHash: persisted.authHash,
        status: 'ACTIVE' // Optimistically set active to start polling
      }));
      setMode(OperationalMode.REAL);
      addLog(`SESSION RESTORED: ${persisted.user}@${persisted.ip}`, LogLevel.SYSTEM, 'system');
    }
  }, [addLog]);

  // Handle Mode Switch Logic
  useEffect(() => {
    if (settings.dataSourceMode === 'LOCAL') {
      // Ensure we are in REAL mode and ACTIVE when LOCAL is selected.
      // We do NOT overwrite targetIp to preserve remote config.
      if (session.status !== 'ACTIVE') {
        setMode(OperationalMode.REAL);
        setSession(s => ({ ...s, status: 'ACTIVE', authHash: 'LOCAL_BYPASS' }));
        addLog('LOCAL_SOURCE_ACTIVE: Listening on 127.0.0.1 (Windows Default)', LogLevel.SYSTEM, 'system');
      }
    }
  }, [settings.dataSourceMode]);

  // Core Backend Redesign: Determine effective target IP based on Data Source Mode
  const getEffectiveTarget = useCallback(() => {
    if (settings.dataSourceMode === 'LOCAL') return '127.0.0.1';
    // REMOTE mode: Return configured IP or null if not set
    return session.targetIp;
  }, [settings.dataSourceMode, session.targetIp]);

  // Unified Heartbeat & Real-State Detection
  useEffect(() => {
    // Initial check on mount or config change
    const checkNeuralStatus = async () => {
      if (settings.neuralUplinkEnabled) {
        const isUp = await testAiAvailability(neuralConfig);
        setUplinkStatus(prev => ({ ...prev, neural: isUp }));
      } else {
        setUplinkStatus(prev => ({ ...prev, neural: false }));
      }
    };
    checkNeuralStatus();

    const heartbeat = setInterval(async () => {
      // 1. Service Uplink Check (Telemetry)
      if (settings.telemetryEnabled) {
        const target = getEffectiveTarget();
        
        // We only fetch if we have a target (Local always returns 127.0.0.1, Remote returns null if no session)
        if (target) {
          try {
            const res = await fetch(`http://${target}:5050/stats`, { signal: AbortSignal.timeout(3000) });
            if (res.ok) {
              const stats = await res.json();
              
              // Backend Redesign: Inject Platform and Source Context if missing
              // This ensures frontend components always know the true origin of data
              stats.platform = settings.platform; 
              stats.source = settings.dataSourceMode;

              setCoreStats(stats);
              setSession(s => ({ ...s, status: 'ACTIVE' }));
              setUplinkStatus(prev => ({ ...prev, service: true }));
            } else {
              throw new Error('Non-200');
            }
          } catch {
             // Only terminate session if we expected a connection but failed (e.g. Remote Drop)
             // In Local mode, we might just mark service offline but keep UI active
             if (settings.dataSourceMode === 'REMOTE') {
               setSession(s => ({ ...s, status: 'TERMINATED' }));
             }
             setCoreStats(null);
             setUplinkStatus(prev => ({ ...prev, service: false }));
          }
        } else {
          // No target defined in REMOTE mode
          setUplinkStatus(prev => ({ ...prev, service: false }));
        }
      } else {
        setUplinkStatus(prev => ({ ...prev, service: false }));
      }

      // 2. Neural Uplink Check (Periodically ping)
      if (settings.neuralUplinkEnabled) {
         const isUp = await testAiAvailability(neuralConfig);
         setUplinkStatus(prev => ({ ...prev, neural: isUp }));
      }

    }, settings.pollInterval * 1000);
    return () => clearInterval(heartbeat);
  }, [mode, getEffectiveTarget, settings.pollInterval, settings.telemetryEnabled, settings.neuralUplinkEnabled, settings.platform, settings.dataSourceMode, neuralConfig]);

  const handleNeuralProbe = async (panelName: string, metrics: any) => {
    if (processingId) return;
    
    const isMainProbe = panelName === 'GLOBAL_SYSTEM_PROBE';
    
    if (isMainProbe && !settings.telemetryEnabled) {
      addLog(`PROBE_ABORTED: Service Link (Telemetry) is disabled.`, LogLevel.WARNING, 'neural');
      return;
    }

    if (!settings.neuralUplinkEnabled && !isMainProbe) { 
        addLog(`PROBE_ABORTED: Neural Uplink is disabled.`, LogLevel.WARNING, 'neural');
        return;
    }

    const contract = PROBE_CONTRACTS[panelName] || PROBE_CONTRACTS['LOG_AUDIT'];
    const launcherId = settings.probeLaunchers[panelName] || 'std-core';
    if (!serverService.validateProbe(launcherId)) {
      addLog(`PROBE_REJECTED: Insufficient charges in [${launcherId}]`, LogLevel.ERROR, 'neural');
      return;
    }
    setProcessingId(panelName);

    const history = contract?.isDataProbe ? HistoryStorage.getCSV('stats', 'CPU,MEM,TEMP') : '';
    
    // Inject backend context into metrics payload
    const platformMetrics = { 
        ...metrics, 
        platform: settings.platform, 
        source: settings.dataSourceMode, // Explicit source injection
        uplink_status: uplinkStatus 
    };
    
    const serviceStatus = uplinkStatus.service ? 'ONLINE' : 'OFFLINE';

    // Import aiService dynamically to avoid circular dependencies
    const { performNeuralProbe } = await import('./services/aiService');

    const result = await performNeuralProbe(neuralConfig, panelName, platformMetrics, { 
      sessionId: session.id, 
      mode, 
      serviceStatus 
    });
    
    if (result && result.description) {
      if (panelName === 'GLOBAL_SYSTEM_PROBE') setLatestCoreProbeResult(result);
      addLog(`Probe executed: ${panelName}`, LogLevel.SUCCESS, 'neural', { 
        type: 'PROBE_RESULT', title: panelName, data: result, requestBody: { /* abbreviated */ }, launcherId 
      });
    } else {
      addLog(`Probe failure: Invalid response`, LogLevel.ERROR, 'neural');
    }
    setProcessingId(undefined);
  };

  const handleBrainRequest = async (id: string, type: string, metrics: any) => {
    if (processingId) return;
    if (!settings.neuralUplinkEnabled) {
      addLog(`NEURAL_ABORTED: Neural Uplink disabled.`, LogLevel.WARNING, 'neural');
      return;
    }

    const launcherId = settings.probeLaunchers['brain_tooltip'] || 'std-neural';
    if (!serverService.validateProbe(launcherId)) {
      addLog(`NEURAL_REJECTED: ${launcherId} empty.`, LogLevel.ERROR, 'neural');
      return;
    }
    setProcessingId(id);
    const systemInstruction = `Inference engine. Provide concise security insight for ${settings.platform} running on ${settings.dataSourceMode} source. JSON: {"description": "...", "recommendation": "..."}`;
    
    if (!uplinkStatus.neural) {
       addLog(`NEURAL_OFFLINE: Uplink unreachable.`, LogLevel.ERROR, 'neural');
       setProcessingId(undefined);
       return;
    }

    const response = await aiTransport.fetch(neuralConfig, systemInstruction, JSON.stringify({id, metrics, platform: settings.platform, source: settings.dataSourceMode}), false);
    if (response.success) {
      addLog(`Inference Sync: ${id}`, LogLevel.NEURAL, 'neural', {
        type: 'PROBE_RESULT', title: `Brain: ${id}`, data: response.data, requestBody: response.requestBody, launcherId
      });
      setProbeContextModal({ title: `BRAIN_INSIGHT: ${id}`, payload: response.data });
    } else {
      addLog(`NEURAL_FAILURE: ${response.error || 'Unknown Error'}`, LogLevel.ERROR, 'neural');
    }
    setProcessingId(undefined);
  };

  const handleHandshake = (ip: string, user: string, pass: string, port: number) => {
    addLog(`INITIATING HANDSHAKE: ${user}@${ip}:${port}`, LogLevel.SYSTEM, 'system');
    setSession(s => ({ ...s, targetIp: ip, status: 'IDLE' }));
    
    const token = btoa(`${user}:${Date.now()}`);
    sessionManager.saveSession(ip, user, token, port);
    setMode(OperationalMode.REAL);
    
    setSession(s => ({ ...s, status: 'ACTIVE', authHash: token }));
    addLog(`HANDSHAKE ESTABLISHED: Link stable.`, LogLevel.SUCCESS, 'system');
  };

  const handleDisconnect = () => {
    setSession(s => ({ ...s, targetIp: null, status: 'IDLE', authHash: undefined }));
    setCoreStats(null);
    // If in LOCAL mode, disconnecting switches mode back to OFFLINE unless auto-reconnect logic exists
    // But conceptually, LOCAL "Disconnect" stops the stream.
    setMode(OperationalMode.OFFLINE);
    sessionManager.clearSession();
    addLog(`SESSION TERMINATED: Handshake dissolved.`, LogLevel.WARNING, 'system');
  };

  const handleCommand = async (cmd: string) => {
    addLog(`$ ${cmd}`, LogLevel.COMMAND, 'console');
    const prompt = settings.platform === Platform.WINDOWS ? 'PS C:\\Users\\Admin>' : 'root@kali:~#';
    setTerminalHistory(prev => [...prev, `${prompt} ${cmd}`]);
    
    const target = getEffectiveTarget();
    if (target) {
      try {
        const res = await fetch(`http://${target}:5050/exec`, {
          method: 'POST',
          body: JSON.stringify({ command: cmd, platform: settings.platform }),
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (!res.ok) throw new Error(`Status ${res.status}`);
        
        const data = await res.json();
        setTerminalHistory(prev => [...prev, data.output || "Execution completed."]);
      } catch (e: any) {
        addLog(`COMMAND_FAILED: ${e.message}`, LogLevel.ERROR, 'console');
        setTerminalHistory(prev => [...prev, `[ERROR] COMMS_ERR: ${e.message}`]);
      }
    } else {
       addLog(`COMMAND_ABORTED: No active target.`, LogLevel.ERROR, 'console');
       setTerminalHistory(prev => [...prev, `[ERROR] NO_LINK: Target unreachable.`]);
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

  // Helper to render structured probe content in Modal
  const renderProbeContent = (payload: any) => {
    if (!payload) return null;
    
    const isInteraction = payload.REQUEST && payload.RESPONSE;
    const timestamp = payload.timestamp || new Date().toLocaleTimeString();
    
    // Determine status and style based on payload data
    let status = "INFO";
    let statusColor = "text-blue-400";
    let statusIcon = "ℹ";
    
    const dataToCheck = isInteraction ? payload.RESPONSE : payload;
    
    if (dataToCheck?.status === 'OFFLINE' || dataToCheck?.error) {
      status = "FAILURE";
      statusColor = "text-red-500";
      statusIcon = "❌";
    } else if (dataToCheck?.threatLevel === 'HIGH' || dataToCheck?.threatLevel === 'CRITICAL' || dataToCheck?.threatLevel === 'ELEVATED') {
      status = "WARNING";
      statusColor = "text-yellow-500";
      statusIcon = "⚠️";
    } else if (dataToCheck?.status === 'REAL' || dataToCheck?.success === true || dataToCheck?.status === 'ONLINE' || dataToCheck?.status === 'ACTIVE') {
      status = "SUCCESS";
      statusColor = "text-green-500";
      statusIcon = "✅";
    }

    const json = (data: any) => JSON.stringify(data, null, 2);

    return (
      <div className="flex flex-col gap-4 font-mono">
        <div className="flex justify-between items-start border-b border-zinc-800 pb-3 bg-zinc-900/20 p-2 rounded-sm">
          <div className="flex flex-col gap-1">
            <span className="text-[8px] text-zinc-500 uppercase font-black tracking-[0.2em]">Timestamp</span>
            <span className="text-[11px] text-zinc-300">{timestamp}</span>
          </div>
          <div className="flex flex-col gap-1 items-end">
            <span className="text-[8px] text-zinc-500 uppercase font-black tracking-[0.2em]">Result_Status</span>
            <span className={`text-[11px] font-black uppercase ${statusColor} flex items-center gap-2`}>
              {statusIcon} {status}
            </span>
          </div>
        </div>

        {isInteraction ? (
          <>
            <div className="space-y-2 animate-in fade-in slide-in-from-left-2 duration-300">
              <div className="flex items-center gap-2">
                <div className="w-1 h-3 bg-purple-500"></div>
                <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Neural_Request_Vector</h4>
              </div>
              <pre className="p-3 bg-black/40 border border-zinc-900 text-zinc-400 text-[10px] overflow-auto max-h-32 whitespace-pre-wrap scrollbar-thin scrollbar-thumb-zinc-800">
                {json(payload.REQUEST)}
              </pre>
            </div>
            <div className="space-y-2 animate-in fade-in slide-in-from-left-2 duration-500 delay-75">
              <div className="flex items-center gap-2">
                <div className="w-1 h-3 bg-teal-500"></div>
                <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Neural_Response_Core</h4>
              </div>
              <pre className="p-3 bg-black/40 border border-zinc-900 text-teal-400/90 text-[10px] overflow-auto max-h-96 whitespace-pre-wrap scrollbar-thin scrollbar-thumb-zinc-800 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
                {json(payload.RESPONSE)}
              </pre>
            </div>
          </>
        ) : (
          <div className="space-y-2 animate-in fade-in zoom-in-95 duration-300">
             <div className="flex items-center gap-2">
                <div className="w-1 h-3 bg-blue-500"></div>
                <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Payload_Data_Snapshot</h4>
             </div>
             <pre className="p-3 bg-black/40 border border-zinc-900 text-blue-400/90 text-[10px] overflow-auto max-h-[500px] whitespace-pre-wrap scrollbar-thin scrollbar-thumb-zinc-800">
                {json(payload)}
             </pre>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-dashed border-zinc-800 text-center">
          <p className="text-[9px] text-zinc-600 italic">"Click Payload Audit dot on modules to inspect raw JSON structure"</p>
        </div>
      </div>
    );
  };

  return (
    <div className={`flex flex-col h-screen overflow-hidden ${mode === OperationalMode.REAL ? 'mode-real' : 'mode-sim'}`}>
      <header className="h-24 border-b border-[#1a1e24] bg-[#050608] px-4 md:px-8 flex items-center justify-between z-50 shrink-0">
        <div className="flex items-center gap-4 md:gap-10">
          <div className="hidden md:block">
            <NeuralCore state={session.status === 'ACTIVE' ? 'connected' : 'disconnected'} />
          </div>
          {/* Mobile Neural Core Replacement */}
          <div className="md:hidden">
             <div className={`w-8 h-8 rounded-full ${session.status === 'ACTIVE' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
          </div>

          <div className="flex flex-col justify-center">
            <h1 className="text-lg md:text-2xl font-black tracking-[0.4em] md:tracking-[0.6em] text-white uppercase chromatic-aberration ml-2 md:ml-4">Sentinel</h1>
            {/* STATUS DIV WITH INTERACTIVE LINKS */}
            <div className="flex gap-4 md:gap-6 mt-1 items-center ml-2 md:ml-4">
              <span 
                onClick={() => setSettings(s => ({
                  ...s, 
                  dataSourceMode: s.dataSourceMode === 'LOCAL' ? 'REMOTE' : 'LOCAL',
                  platform: s.dataSourceMode === 'LOCAL' ? Platform.LINUX : Platform.WINDOWS
                }))}
                className="text-[8px] md:text-[10px] font-black uppercase tracking-widest hidden md:block cursor-pointer hover:underline" 
                style={{ color: currentAccent }}
              >
                {settings.dataSourceMode} SOURCE
              </span>
              <div className="flex gap-4 ml-0 md:ml-4">
                
                {/* Neural Uplink */}
                <Tooltip 
                  name="NEURAL_UPLINK" 
                  source={settings.dataSourceMode} 
                  desc={`STATUS: ${settings.neuralUplinkEnabled ? (uplinkStatus.neural ? 'ONLINE' : 'OFFLINE') : 'DISABLED'}\nPROVIDER: ${neuralConfig.provider}\nMODEL: ${neuralConfig.model}`}
                >
                  <div onClick={() => setSettings(s => ({...s, neuralUplinkEnabled: !s.neuralUplinkEnabled, globalDistortion: !s.neuralUplinkEnabled}))} className="block cursor-pointer relative group">
                    <div className={`w-4 h-4 rounded-full border border-black transition-all ${
                      settings.neuralUplinkEnabled 
                        ? (uplinkStatus.neural ? 'bg-teal-500 glow-teal' : 'bg-red-500') 
                        : 'bg-zinc-800'
                    }`}></div>
                    {!settings.neuralUplinkEnabled && (
                       <div className="absolute -inset-1 border border-transparent border-t-zinc-600 rounded-full opacity-50"></div>
                    )}
                  </div>
                </Tooltip>

                {/* Service Link */}
                <Tooltip 
                  name="SERVICE_LINK" 
                  source={settings.dataSourceMode} 
                  desc={`STATUS: ${settings.telemetryEnabled ? (uplinkStatus.service ? 'ONLINE' : 'OFFLINE') : 'DISABLED'}\nTARGET: ${getEffectiveTarget() || 'DISCONNECTED'}\nPLATFORM: ${settings.platform}`}
                >
                  <div onClick={() => setSettings(s => ({...s, telemetryEnabled: !s.telemetryEnabled}))} className="block cursor-pointer relative group">
                    <div className={`w-4 h-4 rounded-full border border-black transition-all ${
                      settings.telemetryEnabled
                        ? (uplinkStatus.service ? 'bg-purple-500 glow-purple' : 'bg-red-500')
                        : 'bg-zinc-800'
                    }`}></div>
                    {!settings.telemetryEnabled && (
                       <div className="absolute -inset-1 border border-transparent border-t-zinc-600 rounded-full opacity-50"></div>
                    )}
                  </div>
                </Tooltip>

              </div>
              <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-zinc-500 border-l border-zinc-900 pl-4 hidden md:block">
                {coreStats?.system?.hostname ? `HOST@${coreStats.system.hostname}` : 'HOST@VOID'}
              </span>
            </div>
          </div>
        </div>
        
        {/* LAUNCHERS HEADER - Hidden on mobile */}
        <div className="hidden md:flex items-center gap-6 flex-1 justify-center px-10">
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

        <div className="flex items-center gap-4 md:gap-8">
           <button onClick={() => setShowMobileMenu(!showMobileMenu)} className="md:hidden p-2 text-zinc-600 hover:text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
           </button>
           <button onClick={() => setShowInventory(true)} className="hidden md:block p-2 text-zinc-600 hover:text-white transition-colors">
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
           </button>
           <button onClick={() => setShowConfig(true)} className="p-2 text-zinc-600 hover:text-white transition-colors">
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 15a3 3 0 100-6 3 3 0 000 6z"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
           </button>
           <button onClick={() => setMode(m => m === OperationalMode.REAL ? OperationalMode.OFFLINE : OperationalMode.REAL)} className="hidden md:flex w-16 h-8 border border-zinc-900 bg-black p-1 items-center">
              <div className={`w-6 h-6 transition-all ${mode === OperationalMode.REAL ? 'translate-x-8' : ''}`} style={{ backgroundColor: currentAccent }}></div>
           </button>
        </div>
      </header>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div className="md:hidden absolute top-24 left-0 w-full bg-[#0a0c0f] border-b border-zinc-900 z-40 p-4 animate-in slide-in-from-top-10">
           <div className="flex flex-col gap-4">
             {['dashboard', 'telemetry', 'core_stats', 'toolkit', 'history', 'admin'].map(tab => (
               <button 
                 key={tab} 
                 onClick={() => { setActiveTab(tab as any); setShowMobileMenu(false); }}
                 className={`text-left text-[12px] font-black uppercase tracking-[0.2em] py-2 border-b border-zinc-900 ${activeTab === tab ? 'text-teal-500' : 'text-zinc-600'}`}
               >
                 {tab.replace('_', ' ')}
               </button>
             ))}
             <button onClick={() => setShowInventory(true)} className="text-left text-[12px] font-black uppercase tracking-[0.2em] py-2 border-b border-zinc-900 text-purple-500">INVENTORY</button>
           </div>
        </div>
      )}

      <main className="flex-1 flex overflow-hidden flex-col md:flex-row">
        <div className={`w-full md:w-[70%] flex flex-col border-r border-[#1a1e24] bg-[#020406] ${showMobileMenu ? 'opacity-50' : 'opacity-100'} transition-opacity`}>
          <nav className="hidden md:flex h-14 border-b border-[#1a1e24] items-center justify-center gap-12 bg-[#0a0c0f]">
            {['dashboard', 'telemetry', 'core_stats', 'toolkit', 'history', 'admin'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab as any)} className={`text-[13px] font-black uppercase tracking-[0.2em] relative h-full flex items-center ${activeTab === tab ? 'text-white' : 'text-zinc-600'}`}>
                {tab.replace('_', ' ')}
                {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-1 bg-teal-500"></div>}
              </button>
            ))}
          </nav>
          <div className="flex-1 overflow-y-auto p-4 md:p-10 no-scroll">
            {activeTab === 'dashboard' && <Dashboard stats={coreStats} mode={mode} session={session} settings={settings} terminalHistory={terminalHistory} onHandshake={handleHandshake} onDisconnect={handleDisconnect} onLog={addLog} onBrainClick={handleBrainRequest} onProbeClick={handleNeuralProbe} onProbeInfo={(title, payload) => setProbeContextModal({title, payload})} onLauncherSelect={(id, type) => setLauncherPickerModal({panelId: id, type})} onAdapterCommand={handleCommand} onRefresh={() => {}} processingId={processingId} latestCoreProbeResult={latestCoreProbeResult} activeTelemetry={activeTelemetry} uplinkStatus={uplinkStatus} />}
            {activeTab === 'core_stats' && <CoreStatsView stats={coreStats} mode={mode} timeframe="1m" settings={settings} onProbeClick={handleNeuralProbe} onBrainClick={handleBrainRequest} onProbeInfo={(title, payload) => setProbeContextModal({title, payload})} onLauncherSelect={(id, type) => setLauncherPickerModal({panelId: id, type})} onCommand={handleCommand} activeTelemetry={activeTelemetry} setActiveTelemetry={setActiveTelemetry} />}
            {activeTab === 'telemetry' && <TelemetryGraphs timeframe="1m" isSimulated={mode === OperationalMode.SIMULATED} isConnected={!!session.targetIp} onProbe={handleNeuralProbe} onProbeInfo={(title, payload) => setProbeContextModal({title, payload})} onBrainClick={handleBrainRequest} />}
            {activeTab === 'history' && <History data={historyData} onProbe={handleNeuralProbe} onProbeInfo={(title, payload) => setProbeContextModal({title, payload})} onBrainClick={handleBrainRequest} />}
            {activeTab === 'admin' && <AdminPanel />}
          </div>
        </div>
        
        {/* LOG PANEL */}
        <div className="w-full md:w-[30%] flex flex-col bg-[#020406] border-t md:border-t-0 md:border-l border-[#1a1e24] overflow-hidden relative h-[300px] md:h-auto">
          <div className="h-10 md:h-14 border-b border-zinc-900 px-4 flex items-center justify-between bg-[#0a0c0f] z-10">
             <div className="flex h-full overflow-x-auto no-scroll">
               {(['neural', 'console', 'kernel', 'system'] as LogType[]).map(lt => (
                 <button key={lt} onClick={() => { setActiveLogTab(lt); setUnreadLogs(v => ({...v, [lt]: false})); }} className={`px-2 md:px-4 text-[9px] md:text-[10px] font-black uppercase tracking-widest relative h-full whitespace-nowrap ${activeLogTab === lt ? 'text-white' : 'text-zinc-700'} ${unreadLogs[lt] ? 'tab-flash' : ''}`}>
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
             {/* WATCHER BACKGROUND FLASH */}
             {(processingId || (settings.showAsciiBg && !processingId)) && activeLogTab === 'neural' && (
                <div className={`absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden ${!processingId ? 'opacity-20' : ''}`}>
                  <pre className="text-[4px] md:text-[6px] leading-[1] font-bold select-none neural-bg-flash whitespace-pre text-center" style={{ color: settings.frogColor, opacity: settings.frogIntensity }}>
                      {FROG_ASCII}
                  </pre>
                </div>
             )}

             <div className="relative z-10 flex-1 overflow-y-auto p-4 md:p-6 space-y-4 no-scroll font-mono text-[10px] md:text-[11px]">
               {(activeLogTab === 'neural' ? neuralLogs : activeLogTab === 'console' ? consoleLogs : activeLogTab === 'kernel' ? kernelLogsState : systemLogs).map(log => {
                 const isAiLog = log.metadata?.type === 'PROBE_RESULT';
                 const isWatcher = log.metadata?.type === 'WATCHER_SYNC';
                 
                 let accentColor = '#a1a1aa'; 
                 let borderColor = '#27272a'; 

                 if (log.level === LogLevel.ERROR) {
                    accentColor = '#f87171'; 
                    borderColor = '#7f1d1d'; 
                 } else if (isWatcher) {
                    accentColor = settings.frogColor;
                    borderColor = settings.frogColor; 
                 } else if (isAiLog) {
                    let lId = log.metadata?.launcherId;
                    if (!lId) {
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
                              title: `FULL_NEURAL_PROBE: ${log.metadata?.title}`, 
                              payload: { REQUEST: log.metadata.requestBody, RESPONSE: log.metadata.data } 
                            })}
                            className="px-2 py-0.5 bg-purple-500/20 hover:bg-purple-500 border border-purple-500/50 rounded-[1px] text-[7px] font-black text-purple-400 transition-all uppercase"
                          >
                            Probe
                          </button>
                        )}
                      </div>
                      <div className="flex justify-between items-start mb-1 text-[9px] text-zinc-600">
                        <span>{log.timestamp}</span> 
                      </div>
                      <pre 
                         className="whitespace-pre-wrap"
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
           
           {/* DATA SOURCE CONFIGURATION */}
           <div className="space-y-4 p-6 border border-zinc-900 bg-black/40">
              <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest border-b border-zinc-900 pb-2 mb-4">Telemetry_Source_Config</h3>
              <div className="grid grid-cols-2 gap-4">
                 <button onClick={() => setSettings(s => ({...s, dataSourceMode: 'LOCAL'}))} className={`p-4 border ${settings.dataSourceMode === 'LOCAL' ? 'border-teal-500 text-teal-400 bg-teal-500/10' : 'border-zinc-900 text-zinc-700'} font-black text-[10px] uppercase`}>SOURCE: LOCAL (127.0.0.1)</button>
                 <button onClick={() => setSettings(s => ({...s, dataSourceMode: 'REMOTE'}))} className={`p-4 border ${settings.dataSourceMode === 'REMOTE' ? 'border-teal-500 text-teal-400 bg-teal-500/10' : 'border-zinc-900 text-zinc-700'} font-black text-[10px] uppercase`}>SOURCE: REMOTE NODE</button>
              </div>
              <p className="text-[9px] text-zinc-600 italic">
                {settings.dataSourceMode === 'LOCAL' 
                  ? "Direct localhost telemetry pipe. Suitable for local Windows/Linux deployments or SSH tunnels mapped to port 5050."
                  : "Remote network retrieval. Requires Handshake authentication for secure session establishment."}
              </p>
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
             {neuralConfig.provider === NeuralNetworkProvider.LOCAL ? (
               <select 
                 value={neuralConfig.model} 
                 onChange={e => setNeuralConfig(c => ({...c, model: e.target.value}))}
                 className="w-full bg-black border border-zinc-900 p-3 text-[11px] font-mono text-white outline-none focus:border-teal-500/30"
               >
                 {LOCAL_MODELS.map(model => (
                   <option key={model} value={model}>{model}</option>
                 ))}
               </select>
             ) : (
               <input value={neuralConfig.model} onChange={e => setNeuralConfig(c => ({...c, model: e.target.value}))} className="w-full bg-black border border-zinc-900 p-3 text-[11px] font-mono text-white outline-none focus:border-teal-500/30" />
             )}
           </div>

           {neuralConfig.provider === NeuralNetworkProvider.LOCAL && (
            <div className="space-y-4">
               <label className="text-[9px] text-zinc-700 uppercase font-black tracking-widest">Local_Endpoint</label>
               <input 
                 value={neuralConfig.endpoint} 
                 onChange={e => setNeuralConfig(c => ({...c, endpoint: e.target.value}))} 
                 className="w-full bg-black border border-zinc-900 p-3 text-[11px] font-mono text-white outline-none focus:border-teal-500/30" 
                 placeholder="http://localhost:1234/v1"
               />
            </div>
           )}

           <div className="space-y-4 p-6 border border-zinc-900 bg-black/40">
              <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest border-b border-zinc-900 pb-2 mb-4">Platform_Target_Config</h3>
              <div className="grid grid-cols-2 gap-4">
                 <button onClick={() => setSettings(s => ({...s, platform: Platform.LINUX}))} className={`p-4 border ${settings.platform === Platform.LINUX ? 'border-teal-500 text-teal-400 bg-teal-500/10' : 'border-zinc-900 text-zinc-700'} font-black text-[10px] uppercase`}>TARGET: KALI_LINUX</button>
                 <button onClick={() => setSettings(s => ({...s, platform: Platform.WINDOWS}))} className={`p-4 border ${settings.platform === Platform.WINDOWS ? 'border-teal-500 text-teal-400 bg-teal-500/10' : 'border-zinc-900 text-zinc-700'} font-black text-[10px] uppercase`}>TARGET: WINDOWS_NT</button>
              </div>
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
         {probeContextModal && renderProbeContent(probeContextModal.payload)}
      </Modal>
    </div>
  );
};

export default App;
