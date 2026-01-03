
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
  DataSourceMode,
  PanelSlotConfig
} from './types';
import Dashboard from './components/Dashboard';
import CoreStatsView from './components/CoreStatsView';
import TelemetryGraphs from './components/TelemetryGraphs';
import Toolkit from './components/Toolkit';
import History from './components/History';
import AdminPanel from './components/AdminPanel';
import NeuralCore from './components/NeuralCore';
import ScannerPanel from './components/ScannerPanel';
import Modal from './components/common/Modal';
import Tooltip from './components/common/Tooltip';
import InventoryDialog from './components/common/InventoryDialog';
import InventoryList from './components/InventoryList';
import HistoryViewer from './components/HistoryViewer';
import TacticalButton from './components/common/TacticalButton';
import BrainIcon from './components/common/BrainIcon';
import { CoreSelectorDialog } from './components/common/CoreSelectorDialog';
import { aiTransport } from './services/aiTransport';
import { launcherSystem, PROBE_AMMUNITION, DEFAULT_PANEL_CONFIG, FALLBACK_PANEL_CONFIG } from './services/launcherService';
import { serverService } from './services/serverService';
import { PROBE_CONTRACTS } from './services/probeContracts';
import { HistoryStorage } from './services/historyStorage';
import { sessionManager } from './services/sessionManager';
import { LOCAL_MODELS } from './services/config';
import { testAiAvailability, fetchLocalModels } from './services/aiService';
import { platformService } from './services/platformService';

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
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠴⠚⠛⠳⣤⠞⠁
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣤⠚⠁⠀⠀⠀⠀⠘⠲⣄⡀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣴⠋⠙⢷⡋⢙⡇⢀⡴⢒⡿⢶⣄⡴⠀⠙⣳⣄
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⢦⡀⠈⠛⢻⠛⢉⡴⣋⡴⠟⠁⠀⠀⠀⠀⠈⢧⡀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢻⡄⠀⠘⣶⢋⡞⠁⠀⠀⢀⡴⠂⠀⠀⠀⠀⠹⣄
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡇⠀⠀⠈⠻⢦⡀⠀⣰⠏⠀⠀⢀⡴⠂⠀⠀⠀⠀⠹⣄
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢠⡾⢷⡄⠀⠀⠀⠀⠉⠙⠯⠀⠀⡴⠋⠀⢠⠟⠀⠀⢹⡄`;

const App: React.FC = () => {
  const [mode, setMode] = useState<OperationalMode>(OperationalMode.OFFLINE);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'telemetry' | 'toolkit' | 'core_stats' | 'history' | 'admin' | 'scanner'>('dashboard');
  const [activeLogTab, setActiveLogTab] = useState<LogType>('neural');
  const [unreadLogs, setUnreadLogs] = useState<Record<LogType, boolean>>({ neural: false, console: false, kernel: false, system: false });
  const [showConfig, setShowConfig] = useState(false);
  const [showInventory, setShowInventory] = useState(false);
  const [showCoreSelector, setShowCoreSelector] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
  // Historical Data Modal State
  const [historyModal, setHistoryModal] = useState<{isOpen: boolean, panelId: string, title: string, headers: string[]} | null>(null);

  // SEPARATED DATA STATES
  const [systemData, setSystemData] = useState<CoreStats | null>(null); 
  const [telemetryData, setTelemetryData] = useState<CoreStats | null>(null); 
  
  const [activeTelemetry, setActiveTelemetry] = useState<Set<string>>(new Set(['cpu']));
  
  const [uplinkStatus, setUplinkStatus] = useState({ neural: false, service: false });
  const [serviceConnectionLocked, setServiceConnectionLocked] = useState(false);

  const [terminalHistory, setTerminalHistory] = useState<string[]>([]);
  const [inventoryContext, setInventoryContext] = useState<{panelId: string, type?: 'data' | 'neural'} | null>(null);

  // Ping System State
  const [showPingModal, setShowPingModal] = useState(false);
  const [pingState, setPingState] = useState<{ val: number | string, status: 'success' | 'warning' | 'error', time: string } | null>(null);

  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem(SETTINGS_KEY);
    const defaults: AppSettings = {
      showAsciiBg: true,
      globalDistortion: true,
      panelDistortion: true,
      pollInterval: 30, // Updated Default to 30s
      timeframe: '1m',
      frogInterval: 30,
      frogColor: '#00ffd5',
      frogIntensity: 0.3,
      coreRechargeRate: 60,
      neuralRechargeRate: 30,
      maxCoreCharges: 5,
      maxNeuralCharges: 5,
      panelSlots: DEFAULT_PANEL_CONFIG,
      telemetryEnabled: true,
      neuralUplinkEnabled: true,
      platform: Platform.WINDOWS, 
      dataSourceMode: 'LOCAL' as DataSourceMode 
    };

    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.dataSourceMode === 'LOCAL') {
        parsed.platform = platformService.detectLocalPlatform();
      }
      if (!parsed.panelSlots) {
        parsed.panelSlots = DEFAULT_PANEL_CONFIG;
      }
      return parsed;
    }
    
    defaults.platform = platformService.detectLocalPlatform();
    return defaults;
  });

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  // Combined Launcher State: Charges + Cooldowns
  const [launcherState, setLauncherState] = useState<Record<string, { current: number, progress: number, cooldown: number }>>({});
  
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

  // Calculate visual state
  const isRemote = settings.dataSourceMode === 'REMOTE';
  const isLocal = settings.dataSourceMode === 'LOCAL';
  
  const currentAccent = session.status === 'ACTIVE' 
    ? (isRemote ? '#22c55e' : '#00f2ff') 
    : '#ff3e3e';

  const coreState = session.status !== 'ACTIVE'
    ? 'disconnected' 
    : (isLocal ? 'simulated' : 'connected');

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
    HistoryStorage.clear();
    setHistoryData([]); 
  }, []);

  const addToHistory = (action: string, target: string, result: string) => {
    const time = new Date().toLocaleTimeString();
    HistoryStorage.append('SESSION_ACTIONS', 'TIMESTAMP,ACTION,TARGET,RESULT', [
      time,
      action,
      target,
      result
    ]);
    const entries = HistoryStorage.getParsed('SESSION_ACTIONS');
    setHistoryData(entries);
  };

  useEffect(() => {
    if (session.status !== 'ACTIVE') return;

    if (systemData) {
        HistoryStorage.append('HISTORY_CORE_STATS', 'CPU,RAM,DISK', [
            systemData.cpu.usage.toFixed(1),
            systemData.memory.usage.toFixed(1),
            systemData.disk.rootUsage.toFixed(1)
        ]);
        
        HistoryStorage.append('HISTORY_NODE_DIAGNOSTICS', 'TEMP,LOAD,UPTIME', [
            (systemData.sensors.cpu_thermal_temp1 || 0).toFixed(1),
            systemData.cpu.cpuLoad1.toFixed(2),
            systemData.system.uptime.toString()
        ]);

        if (systemData.processes && systemData.processes.topByCpu.length > 0) {
           const topProc = systemData.processes.topByCpu[0];
           HistoryStorage.append('HISTORY_PROCESS_PROBE', 'PID,NAME,CPU,MEM', [
              topProc.pid.toString(),
              topProc.name,
              topProc.cpu_percent.toFixed(1),
              topProc.memory_percent.toFixed(1)
           ]);
        }

        HistoryStorage.append('HISTORY_ADAPTER_HUB', 'CONNECTIONS,RX,TX', [
            (systemData.network.connections || 0).toString(),
            (systemData.network.inRateKB || 0).toFixed(1),
            (systemData.network.outRateKB || 0).toFixed(1)
        ]);
    }

    if (telemetryData) {
        HistoryStorage.append('HISTORY_RSSI_REPORT', 'SIGNAL,NOISE', [
            '-65', '-90' 
        ]);
    }

  }, [systemData, telemetryData, session.status]);

  useEffect(() => {
    if (settings.dataSourceMode === 'LOCAL') {
      if (session.status !== 'ACTIVE' || session.authHash !== 'LOCAL_BYPASS') {
        setMode(OperationalMode.REAL);
        setSession(s => ({ ...s, status: 'ACTIVE', authHash: 'LOCAL_BYPASS', targetIp: '127.0.0.1' }));
        addLog('LOCAL_SOURCE_ACTIVE: Listening on 127.0.0.1 (Windows Default)', LogLevel.SYSTEM, 'system');
      }
    } else {
        if (session.status === 'ACTIVE' && session.authHash === 'LOCAL_BYPASS') {
            setSession(s => ({ ...s, targetIp: null, status: 'IDLE', authHash: undefined }));
            setSystemData(null);
            setTelemetryData(null);
            setMode(OperationalMode.OFFLINE);
            sessionManager.clearSession();
        }
    }
  }, [settings.dataSourceMode]);

  const getEffectiveTarget = useCallback(() => {
    if (settings.dataSourceMode === 'LOCAL') return '127.0.0.1';
    return session.targetIp;
  }, [settings.dataSourceMode, session.targetIp]);

  useEffect(() => {
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
      const target = getEffectiveTarget();
      const isActive = session.status === 'ACTIVE';

      if (isActive) {
        try {
          const sysStats = platformService.generateSystemStats(settings.platform);
          sysStats.source = settings.dataSourceMode;
          setSystemData(sysStats);
        } catch (e) {
          console.error("System Data Acquisition Failed", e);
        }
      } else {
        setSystemData(null);
      }

      if (settings.telemetryEnabled && target && isActive && !serviceConnectionLocked) {
        try {
          const res = await fetch(`http://${target}:5050/stats`, { signal: AbortSignal.timeout(3000) });
          if (res.ok) {
            const stats = await res.json();
            stats.platform = settings.platform; 
            stats.source = settings.dataSourceMode;
            setTelemetryData(stats);
            setUplinkStatus(prev => ({ ...prev, service: true }));
          } else {
            throw new Error('Non-200');
          }
        } catch {
           setTelemetryData(null);
           setUplinkStatus(prev => ({ ...prev, service: false }));
           setServiceConnectionLocked(true); 
        }
      } else if (!settings.telemetryEnabled || serviceConnectionLocked) {
        setTelemetryData(null);
        setUplinkStatus(prev => ({ ...prev, service: false }));
      }

      if (settings.neuralUplinkEnabled) {
         const isUp = await testAiAvailability(neuralConfig);
         setUplinkStatus(prev => ({ ...prev, neural: isUp }));
      }

    }, settings.pollInterval * 1000);
    return () => clearInterval(heartbeat);
  }, [mode, getEffectiveTarget, settings.pollInterval, settings.telemetryEnabled, settings.neuralUplinkEnabled, settings.platform, settings.dataSourceMode, neuralConfig, session.status, serviceConnectionLocked]);

  const handleSystemPing = async () => {
    setShowPingModal(true);
    setPingState(null);
    const target = getEffectiveTarget();
    
    if (!target) {
        setPingState({ val: 'N/A', status: 'error', time: new Date().toLocaleTimeString() });
        return;
    }

    const start = performance.now();
    try {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), 2000); 
        
        await fetch(`http://${target}:5050/stats`, { 
            method: 'GET', 
            signal: controller.signal
        });
        clearTimeout(id);
        const diff = Math.round(performance.now() - start);
        
        let status: 'success' | 'warning' | 'error' = 'success';
        if (diff > 100) status = 'warning';
        if (diff > 300) status = 'error';
        
        setPingState({ val: diff, status, time: new Date().toLocaleTimeString() });
    } catch (e) {
        setPingState({ val: 'ERR', status: 'error', time: new Date().toLocaleTimeString() });
    }
  };

  const handleNeuralProbe = async (panelName: string, metrics: any) => {
    if (processingId) return;
    
    const isMainProbe = panelName === 'GLOBAL_SYSTEM_PROBE';
    
    if (!settings.neuralUplinkEnabled && !isMainProbe) { 
        addLog(`PROBE_ABORTED: Neural Uplink is disabled.`, LogLevel.WARNING, 'neural');
        return;
    }

    const slotConfig = settings.panelSlots[panelName]?.dataSlot || DEFAULT_PANEL_CONFIG[panelName]?.dataSlot;
    const launcherId = slotConfig?.launcherId || 'std-core';
    const ammoId = slotConfig?.ammoId || 'std-data-ammo';
    const ammo = PROBE_AMMUNITION[ammoId];

    if (!launcherSystem.hasAmmo(ammoId)) {
        addLog(`PROBE_ABORTED: Insufficient ${ammo?.name || 'Ammunition'}.`, LogLevel.ERROR, 'neural');
        return;
    }

    if (!serverService.validateProbe(launcherId)) {
      if (serverService.getCooldown(launcherId) > 0) {
         addLog(`PROBE_REJECTED: Launcher [${launcherId}] is cooling down.`, LogLevel.WARNING, 'neural');
      } else {
         addLog(`PROBE_REJECTED: Insufficient charges in [${launcherId}]`, LogLevel.ERROR, 'neural');
      }
      return;
    }
    
    // Trigger Global Cooldown for this Launcher
    serverService.triggerCooldown(launcherId, 5000); // 5s Cooldown
    setProcessingId(panelName);

    const launcher = launcherSystem.getById(launcherId);
    const tokenLimit = launcher ? launcher.tokens : 4000;

    let historyCSV = undefined;
    if (ammo?.features.includes('HISTORY_CSV')) {
       let historyKey = `HISTORY_${panelName}`;
       
       if (panelName === 'SESSION_ARCHIVE') historyKey = 'SESSION_ACTIONS';
       if (panelName === 'GLOBAL_SYSTEM_PROBE') historyKey = 'HISTORY_CORE_STATS';
       
       historyCSV = HistoryStorage.getCSV(historyKey, "METRIC_A,METRIC_B,METRIC_C"); 
    }

    const platformMetrics = { 
        ...metrics, 
        platform: settings.platform, 
        source: settings.dataSourceMode, 
        uplink_status: uplinkStatus,
        history: historyCSV
    };
    
    const serviceStatus = uplinkStatus.service ? 'ONLINE' : 'OFFLINE';
    const contract = PROBE_CONTRACTS[panelName] || PROBE_CONTRACTS['LOG_AUDIT'];

    const { performNeuralProbe } = await import('./services/aiService');

    const result = await performNeuralProbe(neuralConfig, panelName, platformMetrics, { 
      sessionId: session.id, 
      mode, 
      serviceStatus,
      tokenLimit
    });
    
    if (result && result.description) {
      launcherSystem.deductAmmo(ammoId);

      if (panelName === 'GLOBAL_SYSTEM_PROBE') setLatestCoreProbeResult(result);
      addLog(`Probe executed: ${panelName}`, LogLevel.SUCCESS, 'neural', { 
        type: 'PROBE_RESULT', 
        title: panelName, 
        data: result, 
        requestBody: result._sentPayload, 
        launcherId,
        contract: {
            description: contract?.description || "Generic Probe",
            expectation: contract?.expectedResponse || "Standard JSON Analysis"
        }
      });
      addToHistory('NEURAL_PROBE', panelName, 'SUCCESS_ANALYSIS_COMPLETE');
    } else {
      addLog(`Probe failure: Invalid response`, LogLevel.ERROR, 'neural');
      addToHistory('NEURAL_PROBE', panelName, 'FAILURE_INVALID_RESPONSE');
    }
    setProcessingId(undefined);
  };

  const handleBrainRequest = async (id: string, type: string, metrics: any) => {
    if (processingId) return;
    if (!settings.neuralUplinkEnabled) {
      addLog(`NEURAL_ABORTED: Neural Uplink disabled.`, LogLevel.WARNING, 'neural');
      return;
    }

    const targetPanelId = settings.panelSlots[id] ? id : 'GLOBAL_SYSTEM_PROBE';
    const slotConfig = settings.panelSlots[targetPanelId]?.neuralSlot || DEFAULT_PANEL_CONFIG['GLOBAL_SYSTEM_PROBE']?.neuralSlot;
    const launcherId = slotConfig?.launcherId || 'std-neural';
    const ammoId = slotConfig?.ammoId || 'std-neural-ammo';

    if (!launcherSystem.hasAmmo(ammoId)) {
        addLog(`NEURAL_ABORTED: Insufficient Neural Inference charges.`, LogLevel.ERROR, 'neural');
        return;
    }

    if (!serverService.validateProbe(launcherId)) {
      if (serverService.getCooldown(launcherId) > 0) {
         addLog(`NEURAL_REJECTED: Launcher [${launcherId}] is cooling down.`, LogLevel.WARNING, 'neural');
      } else {
         addLog(`NEURAL_REJECTED: ${launcherId} empty.`, LogLevel.ERROR, 'neural');
      }
      return;
    }
    
    // Trigger Global Cooldown for this Launcher
    serverService.triggerCooldown(launcherId, 3000); // 3s Cooldown for Neural
    setProcessingId(id);

    const launcher = launcherSystem.getById(launcherId);
    const tokenLimit = launcher ? launcher.tokens : 400;

    const systemInstruction = `Inference engine. Provide concise security insight for ${settings.platform} running on ${settings.dataSourceMode} source. JSON: {"description": "...", "recommendation": "..."}`;
    
    if (!uplinkStatus.neural) {
       addLog(`NEURAL_OFFLINE: Uplink unreachable.`, LogLevel.ERROR, 'neural');
       setProcessingId(undefined);
       return;
    }

    const brainPayload = {
        id, 
        type,
        metrics, 
        platform: settings.platform, 
        source: settings.dataSourceMode, 
        token_limit: tokenLimit,
        timestamp: new Date().toISOString()
    };

    const response = await aiTransport.fetch(neuralConfig, systemInstruction, JSON.stringify(brainPayload), false, tokenLimit);
    if (response.success) {
      launcherSystem.deductAmmo(ammoId);

      addLog(`Inference Sync: ${id}`, LogLevel.NEURAL, 'neural', {
        type: 'PROBE_RESULT', title: `Neural Insight: ${id}`, data: response.data, 
        requestBody: brainPayload, 
        launcherId
      });
      setProbeContextModal({ title: `NEURAL_INSIGHT: ${id}`, payload: { REQUEST: brainPayload, RESPONSE: response.data } });
    } else {
      addLog(`NEURAL_FAILURE: ${response.error || 'Unknown Error'}`, LogLevel.ERROR, 'neural');
    }
    setProcessingId(undefined);
  };

  const handleHandshake = (ip: string, user: string, pass: string, port: number) => {
    try {
      addLog(`INITIATING HANDSHAKE: ${user}@${ip}:${port}`, LogLevel.SYSTEM, 'system');
      HistoryStorage.append('HISTORY_HANDSHAKE_CORE', 'IP,USER,PORT,STATUS', [ip, user, port.toString(), 'INITIATED']);
      
      setSession(s => ({ ...s, targetIp: ip, status: 'IDLE' }));
      
      const token = btoa(`${user}:${Date.now()}`);
      setMode(OperationalMode.REAL);
      
      setSession(s => ({ ...s, status: 'ACTIVE', authHash: token }));
      addLog(`HANDSHAKE ESTABLISHED: Link stable.`, LogLevel.SUCCESS, 'system');
      addToHistory('HANDSHAKE_INIT', ip, 'CONNECTION_ESTABLISHED');
      
      HistoryStorage.append('HISTORY_HANDSHAKE_CORE', 'IP,USER,PORT,STATUS', [ip, user, port.toString(), 'SUCCESS']);
    } catch (e: any) {
      addLog(`HANDSHAKE ERROR: ${e.message}`, LogLevel.ERROR, 'system');
      addToHistory('HANDSHAKE_INIT', ip, 'CONNECTION_FAILED');
      HistoryStorage.append('HISTORY_HANDSHAKE_CORE', 'IP,USER,PORT,STATUS', [ip, user, port.toString(), 'FAILED']);
    }
  };

  const handleDisconnect = () => {
    addToHistory('SESSION_TERM', session.targetIp || 'UNKNOWN', 'DISCONNECTED_BY_USER');
    setSession(s => ({ ...s, targetIp: null, status: 'IDLE', authHash: undefined }));
    setSystemData(null);
    setTelemetryData(null);
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
        
        if (!res.ok) throw new Error(`Status ${res.status} - ${res.statusText}`);
        
        const data = await res.json();
        setTerminalHistory(prev => [...prev, data.output || "Execution completed."]);
        addToHistory('SHELL_EXEC', cmd, 'EXECUTION_SUCCESS');
      } catch (e: any) {
        const errorMsg = e.name === 'AbortError' ? 'TIMEOUT_EXCEEDED' : e.message;
        addLog(`COMMAND_FAILED: ${errorMsg}`, LogLevel.ERROR, 'console');
        setTerminalHistory(prev => [...prev, `[ERROR] COMMS_ERR: ${errorMsg}`]);
        addToHistory('SHELL_EXEC', cmd, `ERROR: ${errorMsg}`);
      }
    } else {
       addLog(`COMMAND_ABORTED: No active target.`, LogLevel.ERROR, 'console');
       setTerminalHistory(prev => [...prev, `[ERROR] NO_LINK: Target unreachable.`]);
    }
  };

  useEffect(() => {
    const tick = 250; // Faster tick for cooldown updates
    const interval = setInterval(() => {
      setLauncherState(prev => {
        const next = { ...prev };
        launcherSystem.getAll().forEach(l => {
          const current = serverService.getCharges(l.id);
          const cooldown = serverService.getCooldown(l.id);
          const prevEntry = next[l.id] || { current, progress: 0, cooldown: 0 };
          
          let nextProgress = prevEntry.progress;
          
          // Charge recharge logic (using simulated tick)
          if (current < l.maxCharges) {
             nextProgress = prevEntry.progress + (25 / l.rechargeRate); // adjust for 250ms tick
             if (nextProgress >= 100) {
               serverService.recharge(l.id);
               nextProgress = 0;
             }
          } else {
             nextProgress = 0;
          }
          
          next[l.id] = { current: serverService.getCharges(l.id), progress: nextProgress, cooldown };
        });
        return next;
      });
    }, tick);
    return () => clearInterval(interval);
  }, []);

  const activeLaunchersList = Array.from(new Set(
    Object.values(settings.panelSlots).flatMap((s: any) => [s.dataSlot?.launcherId, s.neuralSlot?.launcherId])
  ))
    .filter(id => id !== undefined)
    .map(id => launcherSystem.getById(id!))
    .filter((l): l is Launcher => l !== undefined)
    .slice(0, 8); // LIMIT TO 8 (Supported Max)

  const renderProbeContent = (payload: any) => {
    if (!payload) return null;
    const isInteraction = payload.REQUEST && payload.RESPONSE;
    const dataRef = isInteraction ? payload.RESPONSE : payload;
    const reqRef = isInteraction ? payload.REQUEST : payload;
    const timestamp = payload.timestamp || new Date().toLocaleTimeString();
    
    let status = "INFO";
    let statusColor = "text-blue-400";
    let statusBg = "bg-blue-500/10";
    let statusBorder = "border-blue-500/20";
    let statusIcon = "ℹ";

    if (dataRef?.status === 'OFFLINE' || dataRef?.error) {
      status = "FAILURE";
      statusColor = "text-red-500";
      statusBg = "bg-red-500/10";
      statusBorder = "border-red-500/20";
      statusIcon = "❌";
    } else if (dataRef?.threatLevel === 'HIGH' || dataRef?.threatLevel === 'CRITICAL' || dataRef?.threatLevel === 'ELEVATED') {
      status = "WARNING";
      statusColor = "text-yellow-500";
      statusBg = "bg-yellow-500/10";
      statusBorder = "border-yellow-500/20";
      statusIcon = "⚠️";
    } else if (dataRef?.status === 'REAL' || dataRef?.success === true || dataRef?.status === 'ONLINE' || dataRef?.status === 'ACTIVE' || (isInteraction && !dataRef.error)) {
      status = "SUCCESS";
      statusColor = "text-green-500";
      statusBg = "bg-green-500/10";
      statusBorder = "border-green-500/20";
      statusIcon = "✅";
    }

    const platform = dataRef?.platform || reqRef?.platform || "UNKNOWN";
    const elementType = dataRef?.elementType || reqRef?.context || "SYSTEM_NODE";
    const json = (data: any) => JSON.stringify(data, null, 2);

    return (
      <div className="flex flex-col gap-4 font-mono text-[10px] md:text-[11px]">
        <div className={`flex flex-col border ${statusBorder} ${statusBg} p-3 rounded-sm`}>
            <div className="flex justify-between items-start mb-2 border-b border-zinc-800/50 pb-2">
                <div className="flex flex-col">
                     <span className="text-[8px] text-zinc-500 uppercase font-black tracking-widest">PROBE_TARGET</span>
                     <span className="text-[11px] font-black text-zinc-200 uppercase tracking-wider">{elementType}</span>
                </div>
                <div className="flex flex-col items-end">
                     <span className="text-[8px] text-zinc-500 uppercase font-black tracking-widest">TIMESTAMP</span>
                     <span className="text-[11px] text-zinc-300 font-mono">{timestamp}</span>
                </div>
            </div>
            <div className="flex justify-between items-center">
                 <div className="flex gap-6">
                     <div className="flex flex-col">
                        <span className="text-[8px] text-zinc-600 uppercase font-black">PLATFORM</span>
                        <span className="text-zinc-400 font-bold">{platform}</span>
                     </div>
                 </div>
                 <div className={`px-3 py-1 border ${statusBorder} bg-black/40 flex items-center gap-2 rounded-sm`}>
                    <span className="text-[10px]">{statusIcon}</span>
                    <span className={`font-black tracking-[0.1em] ${statusColor}`}>{status}</span>
                 </div>
            </div>
        </div>
        {isInteraction ? (
          <div className="flex flex-col gap-4">
            <div className="space-y-1 animate-in slide-in-from-right-4 duration-500">
               <div className="flex items-center gap-2 mb-1">
                  <div className="w-1.5 h-1.5 bg-teal-500 rounded-full"></div>
                  <h4 className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em]">NEURAL_RESPONSE_VECTOR</h4>
               </div>
               {dataRef?.description && (
                   <div className="p-3 bg-teal-950/10 border border-teal-900/30 mb-2 rounded-sm">
                       <div className="mb-3">
                           <span className="text-teal-600 font-black uppercase text-[8px] block mb-1">ANALYSIS</span>
                           <p className="text-zinc-300 leading-relaxed border-l-2 border-teal-500/30 pl-2">{dataRef.description}</p>
                       </div>
                       {dataRef.recommendation && (
                           <div className="mt-2 pt-2 border-t border-teal-900/20">
                               <span className="text-teal-600 font-black uppercase text-[8px] block mb-1">RECOMMENDATION</span>
                               <p className="text-teal-400 leading-relaxed border-l-2 border-teal-500/30 pl-2">{dataRef.recommendation}</p>
                           </div>
                       )}
                   </div>
               )}
               <div className="relative group">
                   <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-zinc-800 text-[8px] text-zinc-500 uppercase font-black rounded-sm pointer-events-none opacity-50">RAW_JSON</div>
                   <pre className="p-3 bg-black/60 border border-zinc-900 text-teal-500/80 text-[10px] overflow-auto max-h-60 whitespace-pre-wrap scrollbar-thin scrollbar-thumb-zinc-800 font-mono shadow-inner">{json(payload.RESPONSE)}</pre>
               </div>
            </div>
            <div className="space-y-1 opacity-80 hover:opacity-100 transition-opacity">
               <div className="flex items-center gap-2 mb-1">
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                  <h4 className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em]">REQUEST_PAYLOAD</h4>
               </div>
               <pre className="p-3 bg-black/40 border border-zinc-900 text-zinc-500 text-[9px] overflow-auto max-h-32 whitespace-pre-wrap scrollbar-thin scrollbar-thumb-zinc-800 font-mono">{json(payload.REQUEST)}</pre>
            </div>
          </div>
        ) : (
          <div className="space-y-2 animate-in fade-in zoom-in-95 duration-300">
             <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                <h4 className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em]">DATA_SNAPSHOT</h4>
             </div>
             <pre className="p-3 bg-black/40 border border-zinc-900 text-blue-400/90 text-[10px] overflow-auto max-h-[500px] whitespace-pre-wrap scrollbar-thin scrollbar-thumb-zinc-800">{json(payload)}</pre>
          </div>
        )}
        <div className="mt-2 pt-3 border-t border-dashed border-zinc-900 text-center">
          <p className="text-[8px] text-zinc-700 uppercase tracking-widest">"CONFIDENTIAL // NEURAL SENTINEL LOGS"</p>
        </div>
      </div>
    );
  };

  const toggleSourceMode = () => {
    setSettings(s => {
      const nextMode = s.dataSourceMode === 'LOCAL' ? 'REMOTE' : 'LOCAL';
      let nextPlatform = s.platform;
      if (nextMode === 'LOCAL') {
        nextPlatform = platformService.detectLocalPlatform();
      } else {
        nextPlatform = Platform.LINUX;
      }
      return { ...s, dataSourceMode: nextMode, platform: nextPlatform };
    });
  };

  const getLogAuditPayload = () => {
     const logs = activeLogTab === 'neural' ? neuralLogs : activeLogTab === 'console' ? consoleLogs : activeLogTab === 'kernel' ? kernelLogsState : systemLogs;
     return PROBE_CONTRACTS['LOG_AUDIT'].buildPayload({ logs });
  };

  // Helper for Core Button Glow and Sunburst Effect
  const getCoreTheme = () => {
    if (neuralConfig.provider === NeuralNetworkProvider.GEMINI) {
      return {
        glow: 'shadow-[0_0_30px_rgba(234,179,8,0.4)]',
        text: 'text-yellow-500',
        border: 'border-yellow-500/50',
        bg: 'bg-yellow-950/20',
        sunburst: 'bg-[conic-gradient(from_0deg,transparent_0deg,rgba(234,179,8,0.2)_20deg,transparent_40deg)]'
      };
    }
    return {
      glow: 'shadow-[0_0_30px_rgba(45,212,191,0.4)]',
      text: 'text-teal-400',
      border: 'border-teal-400/50',
      bg: 'bg-teal-950/20',
      sunburst: 'bg-[conic-gradient(from_0deg,transparent_0deg,rgba(45,212,191,0.2)_20deg,transparent_40deg)]'
    };
  };

  const coreTheme = getCoreTheme();

  return (
    <div className={`flex flex-col h-screen overflow-hidden ${mode === OperationalMode.REAL ? 'mode-real' : 'mode-sim'}`}>
      <header className="h-24 border-b border-[#1a1e24] bg-[#050608] flex items-center z-50 shrink-0 w-full overflow-hidden">
        
        {/* --- LEFT SECTION (33%) --- */}
        <div className="w-1/2 md:w-1/3 h-full flex items-center px-6 border-r border-[#1a1e24] overflow-hidden">
          <div className="flex items-center gap-6 min-w-0">
            <div className="md:hidden shrink-0">
               <div onClick={handleSystemPing} className={`w-8 h-8 rounded-full cursor-pointer ${session.status === 'ACTIVE' ? (isLocal ? 'bg-[#00f2ff] animate-pulse' : 'bg-green-500 animate-pulse') : 'bg-red-500'}`}></div>
            </div>
            <div className="flex items-center gap-4 min-w-0">
              {/* RESTORED MAIN LOGO ICON */}
              <div className="relative flex items-center justify-center w-12 h-12 shrink-0">
                 <svg className="w-full h-full text-zinc-800" viewBox="0 0 100 100" fill="none">
                    <path d="M50 10 L90 30 L90 70 L50 90 L10 70 L10 30 Z" stroke="currentColor" strokeWidth="2" fill="#080a0c" />
                    <circle cx="50" cy="50" r="15" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
                    <path d="M50 25 L50 35 M50 65 L50 75 M25 50 L35 50 M65 50 L75 50" stroke="currentColor" strokeWidth="2" />
                 </svg>
                 {/* Main System Slot (Booster Slot) Placeholder */}
                 <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-4 h-4 border border-dashed border-zinc-700 rounded-sm opacity-50"></div>
                 </div>
              </div>

              <div className="flex flex-col justify-center min-w-0">
                <h1 className="text-lg md:text-2xl font-black tracking-[0.4em] md:tracking-[0.6em] text-white uppercase chromatic-aberration truncate">Sentinel</h1>
                
                {/* Desktop Controls (Hidden on Mobile) */}
                <div className="hidden md:flex gap-4 mt-1 items-center overflow-x-auto no-scroll">
                  <div onClick={toggleSourceMode} className="flex items-center gap-2 cursor-pointer group shrink-0">
                    <div className={`w-8 h-4 rounded-full border border-zinc-800 flex items-center p-0.5 transition-all ${isRemote ? 'justify-end bg-green-900/30 border-green-500/50' : 'justify-start bg-blue-900/30 border-blue-500/50'}`}>
                      <div className={`w-2.5 h-2.5 rounded-full shadow-md transition-all ${isRemote ? 'bg-green-500' : 'bg-blue-400'}`}></div>
                    </div>
                    <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest hidden md:block group-hover:text-white transition-colors" style={{ color: currentAccent }}>{settings.dataSourceMode}</span>
                  </div>
                  <div 
                    onClick={() => { if (settings.dataSourceMode === 'REMOTE') setSettings(s => ({...s, platform: s.platform === Platform.LINUX ? Platform.WINDOWS : Platform.LINUX})); }}
                    className={`flex items-center gap-2 group border-l border-zinc-800 pl-4 transition-all shrink-0 ${settings.dataSourceMode === 'REMOTE' ? 'cursor-pointer opacity-100 hover:opacity-100' : 'cursor-not-allowed opacity-40'}`}
                  >
                    <span className={`text-[8px] md:text-[10px] text-zinc-600 font-black uppercase tracking-widest ${settings.dataSourceMode === 'REMOTE' ? 'group-hover:text-zinc-400' : ''}`}>HUD:</span>
                    <span className={`text-[8px] md:text-[10px] font-black uppercase tracking-widest transition-colors ${settings.platform === Platform.LINUX ? 'text-orange-400' : 'text-blue-400'}`}>{settings.platform}</span>
                  </div>
                  <div className="flex gap-3 ml-2 shrink-0">
                    <Tooltip name="NEURAL_UPLINK" source={settings.dataSourceMode} desc={`STATUS: ${settings.neuralUplinkEnabled ? (uplinkStatus.neural ? 'ONLINE' : 'OFFLINE') : 'DISABLED'}\nPROVIDER: ${neuralConfig.provider}`}>
                      <div onClick={() => setSettings(s => ({...s, neuralUplinkEnabled: !s.neuralUplinkEnabled}))} className="cursor-pointer relative group">
                        <div className={`w-3 h-3 rounded-full border border-black transition-all ${settings.neuralUplinkEnabled ? (uplinkStatus.neural ? 'bg-teal-500 glow-teal' : 'bg-red-500') : 'bg-zinc-800'}`}></div>
                      </div>
                    </Tooltip>
                    <Tooltip name="SERVICE_LINK" source={settings.dataSourceMode} desc={`STATUS: ${settings.telemetryEnabled ? (uplinkStatus.service ? 'ONLINE' : 'OFFLINE') : 'DISABLED'}\nTARGET: ${getEffectiveTarget() || 'DISCONNECTED'}`}>
                      <div onClick={() => setSettings(s => ({...s, telemetryEnabled: !s.telemetryEnabled}))} className="cursor-pointer relative group">
                        <div className={`w-3 h-3 rounded-full border border-black transition-all ${settings.telemetryEnabled ? (uplinkStatus.service ? 'bg-purple-500 glow-purple' : 'bg-zinc-900') : 'bg-zinc-800'}`}></div>
                      </div>
                    </Tooltip>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* --- MIDDLE SECTION (33%) - LAUNCHER GRID (Hidden on Mobile) --- */}
        <div className="w-1/3 h-full border-r border-[#1a1e24] px-4 hidden md:flex items-center justify-center bg-black/20">
           <div className={`grid gap-x-4 gap-y-2 w-full max-w-md ${activeLaunchersList.length > 4 ? 'grid-cols-4' : activeLaunchersList.length === 4 ? 'grid-cols-4' : 'grid-flow-col auto-cols-max justify-center'}`}>
              {activeLaunchersList.map(l => {
                  const state = launcherState[l.id] || { current: serverService.getCharges(l.id), progress: 0, cooldown: 0 };
                  const isCooldown = state.cooldown > 0;
                  // Scaling Logic: If fewer than 4 items, make them larger (Hero style)
                  const scaleClass = activeLaunchersList.length < 4 ? 'scale-110 mx-2' : '';
                  
                  return (
                    <Tooltip key={l.id} name={l.name.toUpperCase()} source="SYSTEM" desc={l.description}>
                      <div onClick={() => setShowInventory(true)} className={`cursor-pointer flex flex-col items-center gap-1 bg-black/30 p-1.5 border border-zinc-900/50 rounded-sm hover:border-zinc-700 transition-all min-w-[70px] group relative overflow-hidden h-[34px] ${scaleClass}`}>
                         {isCooldown && (
                            <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-10">
                               <div className="text-[7px] font-black text-red-500 animate-pulse">{(state.cooldown / 1000).toFixed(0)}s</div>
                            </div>
                         )}
                         <div className="flex gap-[1px] w-full justify-center">
                          {[...Array(l.maxCharges)].map((_, i) => (
                            <div key={i} className="w-1 h-2 transition-all duration-300" style={{ backgroundColor: i < state.current ? l.color : '#1a1e24', opacity: i < state.current ? 1 : 0.3 }}></div>
                          ))}
                        </div>
                        <div className="w-full relative h-[6px] mt-0.5">
                           <div className="absolute inset-0 flex items-center justify-center z-10">
                              <span className="text-[6px] font-black uppercase tracking-wider text-zinc-500 group-hover:text-white transition-colors">{l.name.split(' ')[0]}</span>
                           </div>
                           <div className="absolute bottom-0 left-0 h-[1px] bg-zinc-800 w-full">
                              <div className="h-full transition-all duration-500" style={{ width: `${state.progress}%`, backgroundColor: l.color }}></div>
                           </div>
                        </div>
                      </div>
                    </Tooltip>
                  );
                })}
           </div>
        </div>

        {/* --- RIGHT SECTION (33%) - CORE, STORE, CONFIG --- */}
        <div className="w-1/2 md:w-1/3 md:flex-none h-full flex items-center justify-end md:justify-center gap-6 px-6">
           {/* Desktop Core Button */}
           <div className="hidden md:block scale-90 lg:scale-100">
             <Tooltip name="AI_CORE_MATRIX" source="SYSTEM" desc={`Active Model: ${neuralConfig.model}\nProvider: ${neuralConfig.provider}`}>
               <button onClick={() => setShowCoreSelector(true)} className={`relative group w-14 h-14 flex items-center justify-center rounded-full border transition-all duration-500 ${coreTheme.border} ${coreTheme.bg} ${coreTheme.glow}`}>
                  <div className={`absolute inset-[-50%] rounded-full animate-[spin_10s_linear_infinite] opacity-50 pointer-events-none ${coreTheme.sunburst}`}></div>
                  <div className="relative z-10">
                     <svg className={`w-8 h-8 transition-colors ${coreTheme.text}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
                        <path d="M12 8v-6M12 22v-6M4.93 4.93l4.24 4.24M14.83 14.83l4.24 4.24M2 12h6M16 12h6M4.93 19.07l4.24-4.24M14.83 9.17l4.24-4.24" />
                     </svg>
                  </div>
                  <div className={`absolute inset-0 rounded-full border opacity-20 animate-ping pointer-events-none ${coreTheme.border}`}></div>
               </button>
             </Tooltip>
           </div>
           
           <div className="hidden md:block h-8 w-[1px] bg-gradient-to-b from-transparent via-zinc-800 to-transparent"></div>
           
           {/* Desktop Action Buttons */}
           <div className="hidden md:flex items-center gap-3">
              <Tooltip name="TACTICAL_INVENTORY" source="SYSTEM" desc="Manage Probe Launchers and Ammunition Types.">
                <button onClick={() => setShowInventory(true)} className="hidden md:block p-2 text-zinc-600 hover:text-white transition-colors group">
                   <svg className="w-8 h-8 group-hover:drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                </button>
              </Tooltip>
              <Tooltip name="GLOBAL_CONFIG" source="SYSTEM" desc="System-wide settings including Visualization, Polling Rates, and Defaults.">
                <button onClick={() => setShowConfig(true)} className="p-2 text-zinc-600 hover:text-white transition-colors group">
                   <svg className="w-7 h-7 group-hover:drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 15a3 3 0 100-6 3 3 0 000 6z"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
                </button>
              </Tooltip>
           </div>

           {/* Mobile Hamburger Trigger */}
           <button onClick={() => setShowMobileMenu(!showMobileMenu)} className="md:hidden p-3 text-zinc-600 hover:text-white border border-zinc-800 bg-zinc-950 rounded-sm">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
           </button>
        </div>
      </header>

      {/* --- MOBILE MENU OVERLAY --- */}
      {showMobileMenu && (
        <div className="md:hidden absolute top-24 left-0 w-full bg-[#0a0c0f] border-b border-zinc-900 z-[60] p-6 animate-in slide-in-from-top-10 shadow-2xl flex flex-col gap-6 overflow-y-auto max-h-[80vh]">
           {/* Navigation */}
           <div className="flex flex-col gap-2">
             <h4 className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-2 border-b border-zinc-900 pb-1">NAVIGATION</h4>
             {['dashboard', 'telemetry', 'core_stats', 'scanner', 'toolkit', 'history', 'admin'].map(tab => (
               <button key={tab} onClick={() => { setActiveTab(tab as any); setShowMobileMenu(false); }} className={`text-left text-[14px] p-3 border border-zinc-900 bg-zinc-950/50 font-black uppercase tracking-[0.2em] ${activeTab === tab ? 'text-teal-500 border-teal-500/50' : 'text-zinc-400'}`}>{tab.replace('_', ' ')}</button>
             ))}
           </div>

           {/* Core Controls (Moved from Header) */}
           <div className="flex flex-col gap-2">
             <h4 className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-2 border-b border-zinc-900 pb-1">SYSTEM_CONTROLS</h4>
             
             <div className="flex items-center justify-between p-3 border border-zinc-900 bg-black">
                <span className="text-[10px] font-black text-zinc-500 uppercase">SOURCE_MODE</span>
                <div onClick={toggleSourceMode} className="flex items-center gap-2 cursor-pointer">
                    <span className="text-[10px] font-black uppercase" style={{ color: currentAccent }}>{settings.dataSourceMode}</span>
                    <div className={`w-8 h-4 rounded-full border border-zinc-800 flex items-center p-0.5 ${isRemote ? 'justify-end bg-green-900/30' : 'justify-start bg-blue-900/30'}`}>
                      <div className={`w-2.5 h-2.5 rounded-full shadow-md ${isRemote ? 'bg-green-500' : 'bg-blue-400'}`}></div>
                    </div>
                </div>
             </div>

             <div className="flex items-center justify-between p-3 border border-zinc-900 bg-black">
                <span className="text-[10px] font-black text-zinc-500 uppercase">HUD_PLATFORM</span>
                <button onClick={() => setSettings(s => ({...s, platform: s.platform === Platform.LINUX ? Platform.WINDOWS : Platform.LINUX}))} className={`text-[10px] font-black uppercase ${settings.platform === Platform.LINUX ? 'text-orange-400' : 'text-blue-400'}`}>
                   {settings.platform}
                </button>
             </div>

             <div className="grid grid-cols-2 gap-4">
                <button onClick={() => setSettings(s => ({...s, neuralUplinkEnabled: !s.neuralUplinkEnabled}))} className={`p-3 border flex flex-col items-center gap-1 ${settings.neuralUplinkEnabled ? 'border-teal-500/50 bg-teal-900/10' : 'border-zinc-900 bg-zinc-950'}`}>
                   <span className="text-[9px] font-black text-zinc-500 uppercase">NEURAL_LINK</span>
                   <div className={`w-2 h-2 rounded-full ${settings.neuralUplinkEnabled ? (uplinkStatus.neural ? 'bg-teal-500' : 'bg-red-500') : 'bg-zinc-800'}`}></div>
                </button>
                <button onClick={() => setSettings(s => ({...s, telemetryEnabled: !s.telemetryEnabled}))} className={`p-3 border flex flex-col items-center gap-1 ${settings.telemetryEnabled ? 'border-purple-500/50 bg-purple-900/10' : 'border-zinc-900 bg-zinc-950'}`}>
                   <span className="text-[9px] font-black text-zinc-500 uppercase">TELEMETRY</span>
                   <div className={`w-2 h-2 rounded-full ${settings.telemetryEnabled ? (uplinkStatus.service ? 'bg-purple-500' : 'bg-zinc-900') : 'bg-zinc-800'}`}></div>
                </button>
             </div>
           </div>

           {/* Mobile Tools */}
           <div className="flex gap-4">
              <button onClick={() => { setShowCoreSelector(true); setShowMobileMenu(false); }} className="flex-1 p-3 border border-yellow-500/30 bg-yellow-950/10 text-yellow-500 font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2">
                 CORE_AI
              </button>
              <button onClick={() => { setShowInventory(true); setShowMobileMenu(false); }} className="flex-1 p-3 border border-purple-500/30 bg-purple-950/10 text-purple-500 font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2">
                 INVENTORY
              </button>
              <button onClick={() => { setShowConfig(true); setShowMobileMenu(false); }} className="flex-1 p-3 border border-zinc-800 bg-zinc-950 text-zinc-400 font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2">
                 CONFIG
              </button>
           </div>
        </div>
      )}

      <main className="flex-1 flex overflow-hidden flex-col md:flex-row">
        <div className={`w-full md:w-[70%] flex flex-col border-r border-[#1a1e24] bg-[#020406] ${showMobileMenu ? 'opacity-50' : 'opacity-100'} transition-opacity`}>
          <nav className="hidden md:flex h-14 border-b border-[#1a1e24] items-center justify-center gap-12 bg-[#0a0c0f]">
            {['dashboard', 'telemetry', 'core_stats', 'scanner', 'toolkit', 'history', 'admin'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab as any)} className={`text-[13px] font-black uppercase tracking-[0.2em] relative h-full flex items-center ${activeTab === tab ? 'text-white' : 'text-zinc-600'}`}>
                {tab.replace('_', ' ')}
                {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-1 bg-teal-500"></div>}
              </button>
            ))}
          </nav>
          <div className="flex-1 overflow-y-auto p-4 md:p-10 no-scroll">
            {activeTab === 'dashboard' && <Dashboard stats={systemData} mode={mode} session={session} settings={settings} terminalHistory={terminalHistory} onHandshake={handleHandshake} onDisconnect={handleDisconnect} onLog={addLog} onBrainClick={handleBrainRequest} onProbeClick={handleNeuralProbe} onProbeInfo={(title, payload) => setProbeContextModal({title, payload})} onLauncherSelect={(panelId, type) => setInventoryContext({panelId, type})} onAdapterCommand={handleCommand} onRefresh={() => {}} processingId={processingId} latestCoreProbeResult={latestCoreProbeResult} activeTelemetry={activeTelemetry} onHistoryShow={(panelId, title, headers) => setHistoryModal({isOpen: true, panelId, title, headers})} launcherState={launcherState} />}
            {activeTab === 'core_stats' && <CoreStatsView stats={systemData} mode={mode} timeframe="1m" settings={settings} onProbeClick={handleNeuralProbe} onBrainClick={handleBrainRequest} onProbeInfo={(title, payload) => setProbeContextModal({title, payload})} onLauncherSelect={(panelId, type) => setInventoryContext({panelId, type})} onCommand={handleCommand} activeTelemetry={activeTelemetry} setActiveTelemetry={setActiveTelemetry} onHistoryShow={(panelId, title, headers) => setHistoryModal({isOpen: true, panelId, title, headers})} launcherState={launcherState} />}
            {activeTab === 'telemetry' && <TelemetryGraphs stats={telemetryData} timeframe="1m" isSimulated={mode === OperationalMode.SIMULATED} isConnected={uplinkStatus.service} onProbe={handleNeuralProbe} onProbeInfo={(title, payload) => setProbeContextModal({title, payload})} onBrainClick={handleBrainRequest} onLauncherSelect={(panelId, type) => setInventoryContext({panelId, type})} allowDistortion={settings.panelDistortion} serviceStatus={serviceConnectionLocked ? 'LOCKED' : (uplinkStatus.service ? 'ONLINE' : 'OFFLINE')} onRetryConnection={() => setServiceConnectionLocked(false)} onHistoryShow={(panelId, title, headers) => setHistoryModal({isOpen: true, panelId, title, headers})} />}
            {activeTab === 'history' && <History data={historyData} onProbe={handleNeuralProbe} onProbeInfo={(title, payload) => setProbeContextModal({title, payload})} onBrainClick={handleBrainRequest} onLauncherSelect={(panelId, type) => setInventoryContext({panelId, type})} allowDistortion={settings.panelDistortion} />}
            {activeTab === 'toolkit' && <Toolkit onRunCommand={handleCommand} onBreakdown={(t, q) => handleBrainRequest('TOOLKIT_BREAKDOWN', t, { query: q })} mode={mode} allowDistortion={settings.panelDistortion} />}
            {activeTab === 'admin' && <AdminPanel allowDistortion={settings.panelDistortion} />}
            {activeTab === 'scanner' && <ScannerPanel stats={systemData} platform={settings.platform} allowDistortion={settings.panelDistortion} />}
          </div>
        </div>
        
        <div className="w-full md:w-[30%] flex flex-col bg-[#020406] border-t md:border-t-0 md:border-l border-[#1a1e24] overflow-hidden relative h-[300px] md:h-auto">
          {/* Logs panel code remains same */}
          <div className="h-10 md:h-14 border-b border-zinc-900 px-4 flex items-center justify-between bg-[#0a0c0f] z-10">
             <div className="flex h-full overflow-x-auto no-scroll">
               {(['neural', 'console', 'kernel', 'system'] as LogType[]).map(lt => (
                 <button key={lt} onClick={() => { setActiveLogTab(lt); setUnreadLogs(v => ({...v, [lt]: false})); }} className={`px-2 md:px-4 text-[9px] md:text-[10px] font-black uppercase tracking-widest relative h-full whitespace-nowrap ${activeLogTab === lt ? 'text-white' : 'text-zinc-700'} ${unreadLogs[lt] ? 'tab-flash' : ''}`}>{lt}{activeLogTab === lt && <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-purple-500"></div>}</button>
               ))}
             </div>
             <div className="flex items-center gap-2">
               <Tooltip name="LOG_AUDIT" source="NEURAL_NETWORK" variant="purple" desc="Perform a deep audit on the current log stream.">
                 <div className="flex items-center gap-1.5">
                   <button onClick={() => setInventoryContext({panelId: 'LOG_AUDIT', type: 'data'})} className="w-3.5 h-3.5 border border-zinc-700 bg-black flex items-center justify-center"><div className="w-1.5 h-1.5" style={{ backgroundColor: launcherSystem.getById(settings.panelSlots['LOG_AUDIT']?.dataSlot.launcherId || 'std-core')?.color || '#bd00ff' }} /></button>
                   <button onClick={() => setProbeContextModal({ title: `FULL_NEURAL_AUDIT: LOG_AUDIT`, payload: getLogAuditPayload() })} className="w-3.5 h-3.5 rounded-full bg-purple-500/40 hover:bg-purple-400 transition-all cursor-help border border-purple-900 active:scale-75 shadow-sm"/>
                   <TacticalButton label="PROBE" size="sm" onClick={() => handleNeuralProbe('LOG_AUDIT', { logs: activeLogTab === 'neural' ? neuralLogs : activeLogTab === 'console' ? consoleLogs : activeLogTab === 'kernel' ? kernelLogsState : systemLogs })} color={launcherSystem.getById(settings.panelSlots['LOG_AUDIT']?.dataSlot.launcherId || 'std-core')?.color || '#bd00ff'} cooldown={launcherState[settings.panelSlots['LOG_AUDIT']?.dataSlot.launcherId || 'std-core']?.cooldown} />
                 </div>
               </Tooltip>
             </div>
          </div>
          <div className="relative flex-1 overflow-hidden flex flex-col">
             {(processingId || (settings.showAsciiBg && !processingId)) && activeLogTab === 'neural' && (
                <div className={`absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden ${!processingId ? 'opacity-20' : ''}`}>
                  <pre className="text-[4px] md:text-[6px] leading-[1] font-bold select-none neural-bg-flash whitespace-pre text-center" style={{ color: settings.frogColor, opacity: settings.frogIntensity }}>{FROG_ASCII}</pre>
                </div>
             )}
             <div className="relative z-10 flex-1 overflow-y-auto p-4 md:p-6 space-y-4 no-scroll font-mono text-[10px] md:text-[11px]">
               {(activeLogTab === 'neural' ? neuralLogs : activeLogTab === 'console' ? consoleLogs : activeLogTab === 'kernel' ? kernelLogsState : systemLogs).map(log => {
                 const isAiLog = log.metadata?.type === 'PROBE_RESULT';
                 const isWatcher = log.metadata?.type === 'WATCHER_SYNC';
                 let accentColor = '#a1a1aa'; 
                 let borderColor = '#27272a'; 
                 if (log.level === LogLevel.ERROR) { accentColor = '#f87171'; borderColor = '#7f1d1d'; } else if (isWatcher) { accentColor = settings.frogColor; borderColor = settings.frogColor; } else if (isAiLog) { let lId = log.metadata?.launcherId; if (!lId) { if (log.metadata?.title?.includes('Neural')) lId = settings.panelSlots['GLOBAL_SYSTEM_PROBE']?.neuralSlot?.launcherId || 'std-neural'; else lId = settings.panelSlots[log.metadata?.title || '']?.dataSlot?.launcherId || 'std-core'; } const launcher = launcherSystem.getById(lId); if (launcher) { accentColor = launcher.color; borderColor = launcher.color; } else { accentColor = '#bd00ff'; borderColor = '#bd00ff'; } }
                 return (
                    <div key={log.id} className="border-l-2 pl-4 py-2 bg-black/40 relative group mb-2 transition-all" style={{ borderColor: isAiLog || isWatcher ? borderColor : undefined }}>
                      <div className="absolute top-2 right-2 flex gap-2">
                        <Tooltip name="SYNAPTIC_INFERENCE" source="AI" variant="teal" desc="Run neural inference on this specific log entry."><BrainIcon onClick={() => handleBrainRequest(log.id, 'Log Entry', { message: log.message, timestamp: log.timestamp })} className="!p-0 !w-4 !h-4" /></Tooltip>
                        {isAiLog && log.metadata?.requestBody && <button onClick={() => setProbeContextModal({ title: `FULL_NEURAL_AUDIT: ${log.metadata?.title}`, payload: { REQUEST: log.metadata.requestBody, RESPONSE: log.metadata.data } })} className="px-2 py-0.5 bg-purple-500/20 hover:bg-purple-500 border border-purple-500/50 rounded-[1px] text-[7px] font-black text-purple-400 transition-all uppercase">Audit</button>}
                      </div>
                      <div className="flex justify-between items-start mb-1 text-[9px] text-zinc-600"><span>{log.timestamp}</span></div>
                      <pre className="whitespace-pre-wrap" style={{ color: isWatcher ? settings.frogColor : (isAiLog ? accentColor : undefined), opacity: isWatcher ? settings.frogIntensity : 1, textShadow: isAiLog ? `0 0 10px ${accentColor}33` : 'none' }}><span className={!isAiLog && !isWatcher && log.level !== LogLevel.ERROR ? 'text-zinc-400' : ''}>{log.message}</span></pre>
                    </div>
                 );
               })}
             </div>
          </div>
        </div>
      </main>

      <Modal isOpen={showPingModal} onClose={() => setShowPingModal(false)} title="SYSTEM_LATENCY_CHECK" variant={pingState?.status === 'success' ? 'green' : pingState?.status === 'warning' ? 'blue' : 'purple'}>
         <div className="flex flex-col items-center justify-center p-8 gap-6">
            <div className="flex flex-col items-center gap-2"><span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Target_Node</span><span className="text-xl font-mono text-white">{getEffectiveTarget() || 'UNKNOWN_HOST'}</span><span className="text-[9px] text-zinc-600 font-mono">Service Port: 5050</span></div>
            <div className="w-full h-[1px] bg-zinc-900"></div>
            {!pingState ? <div className="flex flex-col items-center gap-4 py-8"><div className="w-12 h-12 border-4 border-zinc-800 border-t-teal-500 rounded-full animate-spin"></div><span className="text-[10px] text-teal-500 font-black uppercase tracking-[0.2em] animate-pulse">CALCULATING_RTT...</span></div> : <div className="flex flex-col items-center gap-4 animate-in zoom-in-95 duration-300"><span className={`text-6xl font-black tracking-tighter ${pingState.status === 'success' ? 'text-green-500' : pingState.status === 'warning' ? 'text-yellow-500' : 'text-red-500'}`}>{typeof pingState.val === 'number' ? `${pingState.val}ms` : pingState.val}</span><div className={`px-4 py-1 rounded-full border flex items-center gap-2 ${pingState.status === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-400' : pingState.status === 'warning' ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400' : 'bg-red-500/10 border-red-500/30 text-red-500'}`}><div className={`w-2 h-2 rounded-full ${pingState.status === 'success' ? 'bg-green-500' : pingState.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'}`}></div><span className="text-[10px] font-black uppercase tracking-widest">{pingState.status === 'success' ? 'LINK_STABLE' : pingState.status === 'warning' ? 'HIGH_LATENCY' : 'CONNECTION_FAILURE'}</span></div><span className="text-[9px] text-zinc-600 font-mono mt-4">Measurement Time: {pingState.time}</span></div>}
         </div>
      </Modal>

      <Modal isOpen={showConfig} onClose={() => setShowConfig(false)} title="GLOBAL_CONFIGURATION_MATRIX" variant="blue">
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><label className="text-[9px] font-black uppercase text-zinc-600">Ascii_Background</label><button onClick={() => setSettings(s => ({...s, showAsciiBg: !s.showAsciiBg}))} className={`w-full py-2 border text-[10px] font-mono ${settings.showAsciiBg ? 'bg-teal-500/20 border-teal-500 text-teal-400' : 'border-zinc-800 text-zinc-600'}`}>{settings.showAsciiBg ? 'ENABLED' : 'DISABLED'}</button></div>
            <div className="space-y-2"><label className="text-[9px] font-black uppercase text-zinc-600">Visual_Distortion</label><button onClick={() => setSettings(s => ({...s, globalDistortion: !s.globalDistortion}))} className={`w-full py-2 border text-[10px] font-mono ${settings.globalDistortion ? 'bg-purple-500/20 border-purple-500 text-purple-400' : 'border-zinc-800 text-zinc-600'}`}>{settings.globalDistortion ? 'ENABLED' : 'DISABLED'}</button></div>
          </div>
          <div className="space-y-2"><label className="text-[9px] font-black uppercase text-zinc-600">Telemetry_Poll_Rate (seconds)</label><input type="range" min="1" max="60" value={settings.pollInterval} onChange={(e) => setSettings(s => ({...s, pollInterval: parseInt(e.target.value)}))} className="w-full accent-teal-500" /><div className="flex justify-between text-[8px] font-mono text-zinc-500"><span>1s (Realtime)</span><span className="text-white">{settings.pollInterval}s</span><span>60s (Passive)</span></div></div>
        </div>
      </Modal>

      {inventoryContext && <InventoryDialog isOpen={!!inventoryContext} onClose={() => setInventoryContext(null)} panelId={inventoryContext.panelId} initialSlotType={inventoryContext.type || 'data'} fullConfig={settings.panelSlots[inventoryContext.panelId] || DEFAULT_PANEL_CONFIG[inventoryContext.panelId] || FALLBACK_PANEL_CONFIG} onEquip={(panelId, slotType, launcherId, ammoId) => { setSettings(s => { const pConfig = s.panelSlots[panelId] || DEFAULT_PANEL_CONFIG[panelId] || FALLBACK_PANEL_CONFIG; return { ...s, panelSlots: { ...s.panelSlots, [panelId]: { ...pConfig, [slotType === 'data' ? 'dataSlot' : 'neuralSlot']: { launcherId, ammoId } } } }; }); }} />}
      <Modal isOpen={showInventory} onClose={() => setShowInventory(false)} title="TACTICAL_INVENTORY_MANIFEST" variant="purple"><InventoryList panelSlots={settings.panelSlots} /></Modal>
      <Modal isOpen={!!historyModal?.isOpen} onClose={() => setHistoryModal(null)} title={`HISTORICAL_DATA: ${historyModal?.title || 'UNKNOWN'}`} variant="teal">{historyModal && <HistoryViewer panelId={historyModal.panelId} headers={historyModal.headers} />}</Modal>
      <Modal isOpen={!!probeContextModal} onClose={() => setProbeContextModal(null)} title={`${probeContextModal?.title}`} variant="purple">{probeContextModal && renderProbeContent(probeContextModal.payload)}</Modal>
      <CoreSelectorDialog isOpen={showCoreSelector} onClose={() => setShowCoreSelector(false)} config={neuralConfig} setConfig={setNeuralConfig} />
    </div>
  );
};

export default App;
