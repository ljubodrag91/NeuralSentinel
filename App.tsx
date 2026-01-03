
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
import Modal from './components/common/Modal';
import Tooltip from './components/common/Tooltip';
import InventoryDialog from './components/common/InventoryDialog';
import InventoryList from './components/InventoryList';
import HistoryViewer from './components/HistoryViewer';
import TacticalButton from './components/common/TacticalButton';
import BrainIcon from './components/common/BrainIcon';
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
  const [showConfig, setShowConfig] = useState(false);
  const [showInventory, setShowInventory] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
  // Historical Data Modal State
  const [historyModal, setHistoryModal] = useState<{isOpen: boolean, panelId: string, title: string, headers: string[]} | null>(null);

  // SEPARATED DATA STATES
  const [systemData, setSystemData] = useState<CoreStats | null>(null); // Direct System Data (Local/SSH)
  const [telemetryData, setTelemetryData] = useState<CoreStats | null>(null); // 5050 Service Data (Telemetry Only)
  
  const [activeTelemetry, setActiveTelemetry] = useState<Set<string>>(new Set(['cpu']));
  
  const [uplinkStatus, setUplinkStatus] = useState({ neural: false, service: false });
  // To prevent spamming connection refused errors
  const [serviceConnectionLocked, setServiceConnectionLocked] = useState(false);

  const [terminalHistory, setTerminalHistory] = useState<string[]>([]);
  // Updated state for Inventory Dialog
  const [inventoryContext, setInventoryContext] = useState<{panelId: string, type: 'data' | 'neural'} | null>(null);

  // Ping System State
  const [showPingModal, setShowPingModal] = useState(false);
  const [pingState, setPingState] = useState<{ val: number | string, status: 'success' | 'warning' | 'error', time: string } | null>(null);

  // Dynamic Models State
  const [dynamicLocalModels, setDynamicLocalModels] = useState<string[]>([]);
  const [localFetchError, setLocalFetchError] = useState(false);

  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem(SETTINGS_KEY);
    const defaults: AppSettings = {
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
      // Default Slot Config
      panelSlots: DEFAULT_PANEL_CONFIG,
      telemetryEnabled: true,
      neuralUplinkEnabled: true,
      platform: Platform.WINDOWS, // Default initial placeholder
      dataSourceMode: 'LOCAL' as DataSourceMode 
    };

    if (saved) {
      const parsed = JSON.parse(saved);
      // Enforce auto-detection if coming back to LOCAL mode
      if (parsed.dataSourceMode === 'LOCAL') {
        parsed.platform = platformService.detectLocalPlatform();
      }
      // Migrate old probeLaunchers to panelSlots if missing
      if (!parsed.panelSlots) {
        parsed.panelSlots = DEFAULT_PANEL_CONFIG;
        // Logic to migrate existing could go here, but default is safer for structure change
      }
      return parsed;
    }
    
    // Initial load auto-detection
    defaults.platform = platformService.detectLocalPlatform();
    return defaults;
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

  // Calculate visual state
  const isRemote = settings.dataSourceMode === 'REMOTE';
  const isLocal = settings.dataSourceMode === 'LOCAL';
  
  // Blue/Cyan for Local, Green for Remote, Red for Disconnected/Offline
  const currentAccent = session.status === 'ACTIVE' 
    ? (isRemote ? '#22c55e' : '#00f2ff') 
    : '#ff3e3e';

  // State mapping for NeuralCore: disconnected, simulated (local), connected (remote)
  const coreState = session.status !== 'ACTIVE'
    ? 'disconnected' 
    : (isLocal ? 'simulated' : 'connected');

  // Dynamic Model Fetching Effect
  useEffect(() => {
    let mounted = true;
    if (showConfig && neuralConfig.provider === 'LOCAL') {
      setLocalFetchError(false);
      fetchLocalModels(neuralConfig.endpoint).then(models => {
        if (!mounted) return;
        if (models.length > 0) {
          setDynamicLocalModels(models);
        } else {
          setLocalFetchError(true);
        }
      });
    }
    return () => { mounted = false; };
  }, [showConfig, neuralConfig.provider, neuralConfig.endpoint]);

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

  // Initial Load - Clear history on startup as requested, and load persistent session actions
  useEffect(() => {
    // Requirements: "Cleared automatically on application startup".
    // We clear the history storage for probe data but might want to keep the session log visually.
    // However, to be strict with the prompt "Data retention... Cleared automatically on application startup",
    // we should wipe it.
    HistoryStorage.clear();
    setHistoryData([]); // Clear visual history state
  }, []);

  // Helper to persist actions to HistoryStorage and update State
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

  // Historical Data Recording Logic - Per Panel Independent Storage
  useEffect(() => {
    if (session.status !== 'ACTIVE') return;

    // 1. GLOBAL_SYSTEM_PROBE / Core Stats
    if (systemData) {
        HistoryStorage.append('HISTORY_CORE_STATS', 'CPU,RAM,DISK', [
            systemData.cpu.usage.toFixed(1),
            systemData.memory.usage.toFixed(1),
            systemData.disk.rootUsage.toFixed(1)
        ]);
        
        // 2. NODE_DIAGNOSTICS
        HistoryStorage.append('HISTORY_NODE_DIAGNOSTICS', 'TEMP,LOAD,UPTIME', [
            (systemData.sensors.cpu_thermal_temp1 || 0).toFixed(1),
            systemData.cpu.cpuLoad1.toFixed(2),
            systemData.system.uptime.toString()
        ]);

        // 3. PROCESS_PROBE (Top Process Snapshots)
        if (systemData.processes && systemData.processes.topByCpu.length > 0) {
           const topProc = systemData.processes.topByCpu[0];
           HistoryStorage.append('HISTORY_PROCESS_PROBE', 'PID,NAME,CPU,MEM', [
              topProc.pid.toString(),
              topProc.name,
              topProc.cpu_percent.toFixed(1),
              topProc.memory_percent.toFixed(1)
           ]);
        }

        // 4. ADAPTER_HUB (Net Connections count)
        HistoryStorage.append('HISTORY_ADAPTER_HUB', 'CONNECTIONS,RX,TX', [
            (systemData.network.connections || 0).toString(),
            (systemData.network.inRateKB || 0).toFixed(1),
            (systemData.network.outRateKB || 0).toFixed(1)
        ]);
    }

    // 5. RSSI_REPORT (Telemetry Service)
    if (telemetryData) {
        HistoryStorage.append('HISTORY_RSSI_REPORT', 'SIGNAL,NOISE', [
            // Mocking fields since telemetryData structure is same as CoreStats but derived
            '-65', '-90' 
        ]);
    }

  }, [systemData, telemetryData, session.status]);

  // Handle Mode Switch Logic
  useEffect(() => {
    if (settings.dataSourceMode === 'LOCAL') {
      // Ensure we are in REAL mode and ACTIVE when LOCAL is selected.
      if (session.status !== 'ACTIVE' || session.authHash !== 'LOCAL_BYPASS') {
        setMode(OperationalMode.REAL);
        setSession(s => ({ ...s, status: 'ACTIVE', authHash: 'LOCAL_BYPASS', targetIp: '127.0.0.1' }));
        addLog('LOCAL_SOURCE_ACTIVE: Listening on 127.0.0.1 (Windows Default)', LogLevel.SYSTEM, 'system');
      }
    } else {
        // REMOTE MODE
        // If we were previously in LOCAL mode (or any active state that shouldn't auto-carry over), reset to IDLE.
        // We enforce manual connection for Remote mode.
        if (session.status === 'ACTIVE' && session.authHash === 'LOCAL_BYPASS') {
            setSession(s => ({ ...s, targetIp: null, status: 'IDLE', authHash: undefined }));
            setSystemData(null);
            setTelemetryData(null);
            setMode(OperationalMode.OFFLINE);
            // Optionally clear persisted session if it exists to be safe
            sessionManager.clearSession();
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

      // 1. CORE STATS: Direct System Data Acquisition (Simulated Local/SSH)
      // Independent of 5050 service status.
      if (isActive) {
        try {
          // This simulates "Running commands directly on the host or via SSH"
          // We pass settings.platform to prompt the simulator to generate correct OS-style fields
          const sysStats = platformService.generateSystemStats(settings.platform);
          sysStats.source = settings.dataSourceMode;
          setSystemData(sysStats);
        } catch (e) {
          console.error("System Data Acquisition Failed", e);
          // Don't kill session, just might show stale data
        }
      } else {
        setSystemData(null);
      }

      // 2. TELEMETRY SERVICE: Poll 5050 for specific telemetry stream
      // Added serviceConnectionLocked check to prevent console spam
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
           setServiceConnectionLocked(true); // Stop polling until manual retry
        }
      } else if (!settings.telemetryEnabled || serviceConnectionLocked) {
        setTelemetryData(null);
        setUplinkStatus(prev => ({ ...prev, service: false }));
      }

      // 3. Neural Uplink Check
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
        const id = setTimeout(() => controller.abort(), 2000); // 2s timeout
        
        // Use a simple fetch to the telemetry port to measure RTT
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

  // UPDATED: Handle Neural Probe with Slots and Historical Data
  const handleNeuralProbe = async (panelName: string, metrics: any) => {
    if (processingId) return;
    
    const isMainProbe = panelName === 'GLOBAL_SYSTEM_PROBE';
    
    if (!settings.neuralUplinkEnabled && !isMainProbe) { 
        addLog(`PROBE_ABORTED: Neural Uplink is disabled.`, LogLevel.WARNING, 'neural');
        return;
    }

    // RESOLVE LAUNCHER & AMMO FROM DATA SLOT
    const slotConfig = settings.panelSlots[panelName]?.dataSlot || DEFAULT_PANEL_CONFIG[panelName]?.dataSlot;
    const launcherId = slotConfig?.launcherId || 'std-core';
    const ammoId = slotConfig?.ammoId || 'std-data-ammo';
    const ammo = PROBE_AMMUNITION[ammoId];

    // Check Probe Stack Limit / Ammunition
    if (!launcherSystem.hasAmmo(ammoId)) {
        addLog(`PROBE_ABORTED: Insufficient ${ammo?.name || 'Ammunition'}.`, LogLevel.ERROR, 'neural');
        return;
    }

    if (!serverService.validateProbe(launcherId)) {
      addLog(`PROBE_REJECTED: Insufficient charges in [${launcherId}]`, LogLevel.ERROR, 'neural');
      return;
    }
    setProcessingId(panelName);

    // Get Token Limit from Launcher
    const launcher = launcherSystem.getById(launcherId);
    const tokenLimit = launcher ? launcher.tokens : 4000;

    // Check for Historical Data Requirement (Per-Panel Storage)
    let historyCSV = undefined;
    if (ammo?.features.includes('HISTORY_CSV')) {
       // Map panel names to specific history storage keys to ensure isolation
       // Default fallback convention is HISTORY_ + panelName
       let historyKey = `HISTORY_${panelName}`;
       
       if (panelName === 'SESSION_ARCHIVE') historyKey = 'SESSION_ACTIONS';
       // Map GLOBAL_SYSTEM_PROBE to HISTORY_CORE_STATS
       if (panelName === 'GLOBAL_SYSTEM_PROBE') historyKey = 'HISTORY_CORE_STATS';
       
       // For "Standard" Data Probes, we DO NOT send history.
       // This block only executes if the ammo has the 'HISTORY_CSV' feature (e.g. Historical Probe).
       historyCSV = HistoryStorage.getCSV(historyKey, "METRIC_A,METRIC_B,METRIC_C"); 
    }

    // Inject backend context and history into metrics payload
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
      // Decrement Probe Stack on Successful Execution
      launcherSystem.deductAmmo(ammoId);

      if (panelName === 'GLOBAL_SYSTEM_PROBE') setLatestCoreProbeResult(result);
      addLog(`Probe executed: ${panelName}`, LogLevel.SUCCESS, 'neural', { 
        type: 'PROBE_RESULT', 
        title: panelName, 
        data: result, 
        requestBody: result._sentPayload, // Use the actual payload captured in aiService
        launcherId,
        contract: {
            description: contract?.description || "Generic Probe",
            expectation: contract?.expectedResponse || "Standard JSON Analysis"
        }
      });
      // Persist successful probe
      addToHistory('NEURAL_PROBE', panelName, 'SUCCESS_ANALYSIS_COMPLETE');
    } else {
      addLog(`Probe failure: Invalid response`, LogLevel.ERROR, 'neural');
      addToHistory('NEURAL_PROBE', panelName, 'FAILURE_INVALID_RESPONSE');
    }
    setProcessingId(undefined);
  };

  // UPDATED: Handle Neural Tooltips (Brain Request) with Neural Slot
  const handleBrainRequest = async (id: string, type: string, metrics: any) => {
    if (processingId) return;
    if (!settings.neuralUplinkEnabled) {
      addLog(`NEURAL_ABORTED: Neural Uplink disabled.`, LogLevel.WARNING, 'neural');
      return;
    }

    // RESOLVE LAUNCHER FROM NEURAL SLOT
    // Use 'id' as panelId if it exists in configuration, otherwise fallback to GLOBAL_SYSTEM_PROBE
    const targetPanelId = settings.panelSlots[id] ? id : 'GLOBAL_SYSTEM_PROBE';
    const slotConfig = settings.panelSlots[targetPanelId]?.neuralSlot || DEFAULT_PANEL_CONFIG['GLOBAL_SYSTEM_PROBE']?.neuralSlot;
    const launcherId = slotConfig?.launcherId || 'std-neural';
    const ammoId = slotConfig?.ammoId || 'std-neural-ammo';

    // Check Neural Ammo Stack
    if (!launcherSystem.hasAmmo(ammoId)) {
        addLog(`NEURAL_ABORTED: Insufficient Neural Inference charges.`, LogLevel.ERROR, 'neural');
        return;
    }

    if (!serverService.validateProbe(launcherId)) {
      addLog(`NEURAL_REJECTED: ${launcherId} empty.`, LogLevel.ERROR, 'neural');
      return;
    }
    setProcessingId(id);

    // Get Token Limit from Launcher
    const launcher = launcherSystem.getById(launcherId);
    const tokenLimit = launcher ? launcher.tokens : 400;

    const systemInstruction = `Inference engine. Provide concise security insight for ${settings.platform} running on ${settings.dataSourceMode} source. JSON: {"description": "...", "recommendation": "..."}`;
    
    if (!uplinkStatus.neural) {
       addLog(`NEURAL_OFFLINE: Uplink unreachable.`, LogLevel.ERROR, 'neural');
       setProcessingId(undefined);
       return;
    }

    // Construct precise audit payload for logging and modal
    const brainPayload = {
        id, 
        type,
        metrics, 
        platform: settings.platform, 
        source: settings.dataSourceMode,
        token_limit: tokenLimit,
        timestamp: new Date().toISOString()
    };

    // Updated to pass tokenLimit
    const response = await aiTransport.fetch(neuralConfig, systemInstruction, JSON.stringify(brainPayload), false, tokenLimit);
    if (response.success) {
      // Deduct Ammo
      launcherSystem.deductAmmo(ammoId);

      addLog(`Inference Sync: ${id}`, LogLevel.NEURAL, 'neural', {
        type: 'PROBE_RESULT', title: `Neural Insight: ${id}`, data: response.data, 
        requestBody: brainPayload, // Log actual structured payload
        launcherId
      });
      // Ensure context modal also receives full request payload
      setProbeContextModal({ title: `NEURAL_INSIGHT: ${id}`, payload: { REQUEST: brainPayload, RESPONSE: response.data } });
    } else {
      addLog(`NEURAL_FAILURE: ${response.error || 'Unknown Error'}`, LogLevel.ERROR, 'neural');
    }
    setProcessingId(undefined);
  };

  const handleHandshake = (ip: string, user: string, pass: string, port: number) => {
    try {
      addLog(`INITIATING HANDSHAKE: ${user}@${ip}:${port}`, LogLevel.SYSTEM, 'system');
      // Log Attempt to History
      HistoryStorage.append('HISTORY_HANDSHAKE_CORE', 'IP,USER,PORT,STATUS', [ip, user, port.toString(), 'INITIATED']);
      
      setSession(s => ({ ...s, targetIp: ip, status: 'IDLE' }));
      
      const token = btoa(`${user}:${Date.now()}`);
      // REMOVED sessionManager.saveSession to prevent caching connection state
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

  const activeLaunchersList = Array.from(new Set(
    Object.values(settings.panelSlots).flatMap((s: any) => [s.dataSlot?.launcherId, s.neuralSlot?.launcherId])
  ))
    .filter(id => id !== undefined)
    .map(id => launcherSystem.getById(id!))
    .filter((l): l is Launcher => l !== undefined);

  // Helper to render structured probe content in Modal
  const renderProbeContent = (payload: any) => {
    if (!payload) return null;
    
    // Determine context (Interaction vs Raw Snapshot)
    const isInteraction = payload.REQUEST && payload.RESPONSE;
    
    // Extract Metadata candidates
    const dataRef = isInteraction ? payload.RESPONSE : payload;
    const reqRef = isInteraction ? payload.REQUEST : payload; // specific request context

    const timestamp = payload.timestamp || new Date().toLocaleTimeString();
    
    // Determine Status
    let status = "INFO";
    let statusColor = "text-blue-400";
    let statusBg = "bg-blue-500/10";
    let statusBorder = "border-blue-500/20";
    let statusIcon = "ℹ";

    // Logic to detect status from Response or Payload
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

    // Attempt to extract platform/source from request if available
    const platform = dataRef?.platform || reqRef?.platform || "UNKNOWN";
    const elementType = dataRef?.elementType || reqRef?.context || "SYSTEM_NODE";

    const json = (data: any) => JSON.stringify(data, null, 2);

    return (
      <div className="flex flex-col gap-4 font-mono text-[10px] md:text-[11px]">
        
        {/* HEADER BLOCK */}
        <div className={`flex flex-col border ${statusBorder} ${statusBg} p-3 rounded-sm`}>
            <div className="flex justify-between items-start mb-2 border-b border-zinc-800/50 pb-2">
                <div className="flex flex-col">
                     <span className="text-[8px] text-zinc-500 uppercase font-black tracking-widest">PROBE_TARGET</span>
                     <span className="text-[11px] font-black text-zinc-200 uppercase tracking-wider">
                        {elementType}
                     </span>
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

        {/* INTERACTION CONTENT */}
        {isInteraction ? (
          <div className="flex flex-col gap-4">
            
            {/* RESPONSE SECTION (Priority) */}
            <div className="space-y-1 animate-in slide-in-from-right-4 duration-500">
               <div className="flex items-center gap-2 mb-1">
                  <div className="w-1.5 h-1.5 bg-teal-500 rounded-full"></div>
                  <h4 className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em]">NEURAL_RESPONSE_VECTOR</h4>
               </div>
               
               {/* Formatted Response Summary if available */}
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
                   <pre className="p-3 bg-black/60 border border-zinc-900 text-teal-500/80 text-[10px] overflow-auto max-h-60 whitespace-pre-wrap scrollbar-thin scrollbar-thumb-zinc-800 font-mono shadow-inner">
                        {json(payload.RESPONSE)}
                   </pre>
               </div>
            </div>

            {/* REQUEST SECTION */}
            <div className="space-y-1 opacity-80 hover:opacity-100 transition-opacity">
               <div className="flex items-center gap-2 mb-1">
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                  <h4 className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em]">REQUEST_PAYLOAD</h4>
               </div>
               <pre className="p-3 bg-black/40 border border-zinc-900 text-zinc-500 text-[9px] overflow-auto max-h-32 whitespace-pre-wrap scrollbar-thin scrollbar-thumb-zinc-800 font-mono">
                  {json(payload.REQUEST)}
               </pre>
            </div>

          </div>
        ) : (
          /* SNAPSHOT CONTENT */
          <div className="space-y-2 animate-in fade-in zoom-in-95 duration-300">
             <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                <h4 className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em]">DATA_SNAPSHOT</h4>
             </div>
             <pre className="p-3 bg-black/40 border border-zinc-900 text-blue-400/90 text-[10px] overflow-auto max-h-[500px] whitespace-pre-wrap scrollbar-thin scrollbar-thumb-zinc-800">
                {json(payload)}
             </pre>
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
        // Enforce auto-detection for Local mode
        nextPlatform = platformService.detectLocalPlatform();
      } else {
        // Default to Linux for Remote mode as per requirements
        nextPlatform = Platform.LINUX;
      }

      return {
        ...s,
        dataSourceMode: nextMode,
        platform: nextPlatform
      };
    });
  };

  const getLogAuditPayload = () => {
     const logs = activeLogTab === 'neural' ? neuralLogs : activeLogTab === 'console' ? consoleLogs : activeLogTab === 'kernel' ? kernelLogsState : systemLogs;
     return PROBE_CONTRACTS['LOG_AUDIT'].buildPayload({ logs });
  };

  return (
    <div className={`flex flex-col h-screen overflow-hidden ${mode === OperationalMode.REAL ? 'mode-real' : 'mode-sim'}`}>
      <header className="h-24 border-b border-[#1a1e24] bg-[#050608] px-4 md:px-8 flex items-center justify-between z-50 shrink-0">
        <div className="flex items-center gap-4 md:gap-10">
          <div className="hidden md:block">
            <NeuralCore state={coreState} onClick={handleSystemPing} />
          </div>
          {/* Mobile Neural Core Replacement */}
          <div className="md:hidden">
             <div onClick={handleSystemPing} className={`w-8 h-8 rounded-full cursor-pointer ${session.status === 'ACTIVE' ? (isLocal ? 'bg-[#00f2ff] animate-pulse' : 'bg-green-500 animate-pulse') : 'bg-red-500'}`}></div>
          </div>

          <div className="flex flex-col justify-center">
            <h1 className="text-lg md:text-2xl font-black tracking-[0.4em] md:tracking-[0.6em] text-white uppercase chromatic-aberration ml-2 md:ml-4">Sentinel</h1>
            {/* STATUS DIV WITH INTERACTIVE LINKS */}
            <div className="flex gap-4 md:gap-6 mt-1 items-center ml-2 md:ml-4">
              
              {/* SOURCE TOGGLE */}
              <div 
                onClick={toggleSourceMode}
                className="flex items-center gap-2 cursor-pointer group"
              >
                <div className={`w-8 h-4 rounded-full border border-zinc-800 flex items-center p-0.5 transition-all ${isRemote ? 'justify-end bg-green-900/30 border-green-500/50' : 'justify-start bg-blue-900/30 border-blue-500/50'}`}>
                  <div className={`w-2.5 h-2.5 rounded-full shadow-md transition-all ${isRemote ? 'bg-green-500' : 'bg-blue-400'}`}></div>
                </div>
                <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest hidden md:block group-hover:text-white transition-colors" style={{ color: currentAccent }}>
                  {settings.dataSourceMode} SOURCE
                </span>
              </div>

              {/* HUD PLATFORM TOGGLE - REMOTE ONLY */}
              {settings.dataSourceMode === 'REMOTE' && (
                <div 
                  onClick={() => setSettings(s => ({...s, platform: s.platform === Platform.LINUX ? Platform.WINDOWS : Platform.LINUX}))}
                  className="flex items-center gap-2 cursor-pointer group ml-4 border-l border-zinc-800 pl-4"
                >
                  <span className="text-[8px] md:text-[10px] text-zinc-600 font-black uppercase tracking-widest group-hover:text-zinc-400">HUD_OPTICS:</span>
                  <span className={`text-[8px] md:text-[10px] font-black uppercase tracking-widest transition-colors ${settings.platform === Platform.LINUX ? 'text-orange-400' : 'text-blue-400'}`}>
                    {settings.platform}
                  </span>
                </div>
              )}

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
                        ? (uplinkStatus.service ? 'bg-purple-500 glow-purple' : 'bg-zinc-900')
                        : 'bg-zinc-800'
                    }`}></div>
                    {!settings.telemetryEnabled && (
                       <div className="absolute -inset-1 border border-transparent border-t-zinc-600 rounded-full opacity-50"></div>
                    )}
                  </div>
                </Tooltip>

              </div>
              <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-zinc-500 border-l border-zinc-900 pl-4 hidden md:block">
                {systemData?.system?.hostname ? `HOST@${systemData.system.hostname}` : 'HOST@VOID'}
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
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 15a3 3 0 100-6 3 3 0 000 6z"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
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
             <button onClick={() => { setShowInventory(true); setShowMobileMenu(false); }} className="text-left text-[12px] font-black uppercase tracking-[0.2em] py-2 border-b border-zinc-900 text-purple-500">INVENTORY</button>
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
            {activeTab === 'dashboard' && <Dashboard stats={systemData} mode={mode} session={session} settings={settings} terminalHistory={terminalHistory} onHandshake={handleHandshake} onDisconnect={handleDisconnect} onLog={addLog} onBrainClick={handleBrainRequest} onProbeClick={handleNeuralProbe} onProbeInfo={(title, payload) => setProbeContextModal({title, payload})} onLauncherSelect={(panelId, type) => setInventoryContext({panelId, type})} onAdapterCommand={handleCommand} onRefresh={() => {}} processingId={processingId} latestCoreProbeResult={latestCoreProbeResult} activeTelemetry={activeTelemetry} onHistoryShow={(panelId, title, headers) => setHistoryModal({isOpen: true, panelId, title, headers})} />}
            {activeTab === 'core_stats' && <CoreStatsView stats={systemData} mode={mode} timeframe="1m" settings={settings} onProbeClick={handleNeuralProbe} onBrainClick={handleBrainRequest} onProbeInfo={(title, payload) => setProbeContextModal({title, payload})} onLauncherSelect={(panelId, type) => setInventoryContext({panelId, type})} onCommand={handleCommand} activeTelemetry={activeTelemetry} setActiveTelemetry={setActiveTelemetry} onHistoryShow={(panelId, title, headers) => setHistoryModal({isOpen: true, panelId, title, headers})} />}
            {activeTab === 'telemetry' && <TelemetryGraphs stats={telemetryData} timeframe="1m" isSimulated={mode === OperationalMode.SIMULATED} isConnected={uplinkStatus.service} onProbe={handleNeuralProbe} onProbeInfo={(title, payload) => setProbeContextModal({title, payload})} onBrainClick={handleBrainRequest} onLauncherSelect={(panelId, type) => setInventoryContext({panelId, type})} allowDistortion={settings.panelDistortion} serviceStatus={serviceConnectionLocked ? 'LOCKED' : (uplinkStatus.service ? 'ONLINE' : 'OFFLINE')} onRetryConnection={() => setServiceConnectionLocked(false)} onHistoryShow={(panelId, title, headers) => setHistoryModal({isOpen: true, panelId, title, headers})} />}
            {activeTab === 'history' && <History data={historyData} onProbe={handleNeuralProbe} onProbeInfo={(title, payload) => setProbeContextModal({title, payload})} onBrainClick={handleBrainRequest} onLauncherSelect={(panelId, type) => setInventoryContext({panelId, type})} allowDistortion={settings.panelDistortion} />}
            {activeTab === 'toolkit' && <Toolkit onRunCommand={handleCommand} onBreakdown={(t, q) => handleBrainRequest('TOOLKIT_BREAKDOWN', t, { query: q })} mode={mode} allowDistortion={settings.panelDistortion} />}
            {activeTab === 'admin' && <AdminPanel allowDistortion={settings.panelDistortion} />}
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
                   <button onClick={() => setInventoryContext({panelId: 'LOG_AUDIT', type: 'data'})} className="w-3.5 h-3.5 border border-zinc-700 bg-black flex items-center justify-center">
                     <div className="w-1.5 h-1.5" style={{ backgroundColor: launcherSystem.getById(settings.panelSlots['LOG_AUDIT']?.dataSlot.launcherId || 'std-core')?.color || '#bd00ff' }} />
                   </button>
                   <button 
                      onClick={() => setProbeContextModal({ 
                        title: `FULL_NEURAL_AUDIT: LOG_AUDIT`, 
                        payload: getLogAuditPayload() 
                      })}
                      className="w-3.5 h-3.5 rounded-full bg-purple-500/40 hover:bg-purple-400 transition-all cursor-help border border-purple-900 active:scale-75 shadow-sm"
                   />
                   <TacticalButton label="PROBE" size="sm" onClick={() => handleNeuralProbe('LOG_AUDIT', { logs: activeLogTab === 'neural' ? neuralLogs : activeLogTab === 'console' ? consoleLogs : activeLogTab === 'kernel' ? kernelLogsState : systemLogs })} color={launcherSystem.getById(settings.panelSlots['LOG_AUDIT']?.dataSlot.launcherId || 'std-core')?.color || '#bd00ff'} />
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
                       if (log.metadata?.title?.includes('Neural')) lId = settings.panelSlots['GLOBAL_SYSTEM_PROBE']?.neuralSlot?.launcherId || 'std-neural';
                       else lId = settings.panelSlots[log.metadata?.title || '']?.dataSlot?.launcherId || 'std-core';
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
                        {/* NEURAL PROBE FOR LOG PANEL ENTRIES */}
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
      </Modal>

      {/* Ping Modal */}
      <Modal isOpen={showPingModal} onClose={() => setShowPingModal(false)} title="SYSTEM_LATENCY_CHECK" variant={pingState?.status === 'success' ? 'green' : pingState?.status === 'warning' ? 'blue' : 'purple'}>
         <div className="flex flex-col items-center justify-center p-8 gap-6">
            <div className="flex flex-col items-center gap-2">
               <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Target_Node</span>
               <span className="text-xl font-mono text-white">{getEffectiveTarget() || 'UNKNOWN_HOST'}</span>
               <span className="text-[9px] text-zinc-600 font-mono">Service Port: 5050</span>
            </div>
            
            <div className="w-full h-[1px] bg-zinc-900"></div>

            {!pingState ? (
                <div className="flex flex-col items-center gap-4 py-8">
                   <div className="w-12 h-12 border-4 border-zinc-800 border-t-teal-500 rounded-full animate-spin"></div>
                   <span className="text-[10px] text-teal-500 font-black uppercase tracking-[0.2em] animate-pulse">CALCULATING_RTT...</span>
                </div>
            ) : (
                <div className="flex flex-col items-center gap-4 animate-in zoom-in-95 duration-300">
                    <span className={`text-6xl font-black tracking-tighter ${
                        pingState.status === 'success' ? 'text-green-500' : 
                        pingState.status === 'warning' ? 'text-yellow-500' : 'text-red-500'
                    }`}>
                        {typeof pingState.val === 'number' ? `${pingState.val}ms` : pingState.val}
                    </span>
                    <div className={`px-4 py-1 rounded-full border flex items-center gap-2 ${
                         pingState.status === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-400' : 
                         pingState.status === 'warning' ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400' : 'bg-red-500/10 border-red-500/30 text-red-500'
                    }`}>
                        <div className={`w-2 h-2 rounded-full ${
                            pingState.status === 'success' ? 'bg-green-500' : 
                            pingState.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                        }`}></div>
                        <span className="text-[10px] font-black uppercase tracking-widest">
                            {pingState.status === 'success' ? 'LINK_STABLE' : 
                             pingState.status === 'warning' ? 'HIGH_LATENCY' : 'CONNECTION_FAILURE'}
                        </span>
                    </div>
                    <span className="text-[9px] text-zinc-600 font-mono mt-4">Measurement Time: {pingState.time}</span>
                </div>
            )}
         </div>
      </Modal>

      {/* Settings Modal (Fixed: Added to App.tsx) */}
      <Modal isOpen={showConfig} onClose={() => setShowConfig(false)} title="GLOBAL_CONFIGURATION_MATRIX" variant="blue">
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase text-zinc-600">Ascii_Background</label>
              <button 
                onClick={() => setSettings(s => ({...s, showAsciiBg: !s.showAsciiBg}))} 
                className={`w-full py-2 border text-[10px] font-mono ${settings.showAsciiBg ? 'bg-teal-500/20 border-teal-500 text-teal-400' : 'border-zinc-800 text-zinc-600'}`}
              >
                {settings.showAsciiBg ? 'ENABLED' : 'DISABLED'}
              </button>
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase text-zinc-600">Visual_Distortion</label>
              <button 
                onClick={() => setSettings(s => ({...s, globalDistortion: !s.globalDistortion}))} 
                className={`w-full py-2 border text-[10px] font-mono ${settings.globalDistortion ? 'bg-purple-500/20 border-purple-500 text-purple-400' : 'border-zinc-800 text-zinc-600'}`}
              >
                {settings.globalDistortion ? 'ENABLED' : 'DISABLED'}
              </button>
            </div>
          </div>
          
          <div className="space-y-2">
             <label className="text-[9px] font-black uppercase text-zinc-600">Telemetry_Poll_Rate (seconds)</label>
             <input 
               type="range" min="1" max="60" value={settings.pollInterval} 
               onChange={(e) => setSettings(s => ({...s, pollInterval: parseInt(e.target.value)}))}
               className="w-full accent-teal-500"
             />
             <div className="flex justify-between text-[8px] font-mono text-zinc-500">
               <span>1s (Realtime)</span>
               <span className="text-white">{settings.pollInterval}s</span>
               <span>60s (Passive)</span>
             </div>
          </div>

          <div className="space-y-2">
             <label className="text-[9px] font-black uppercase text-zinc-600">Neural_Provider</label>
             <select 
               value={neuralConfig.provider} 
               onChange={(e) => setNeuralConfig(prev => ({...prev, provider: e.target.value as any}))}
               className="w-full bg-black border border-zinc-800 p-2 text-[10px] text-zinc-300 outline-none focus:border-teal-500"
             >
               <option value="GEMINI">Google Gemini Cloud</option>
               <option value="LOCAL">Local LLM (OpenAI Compatible)</option>
             </select>
          </div>

          {neuralConfig.provider === 'LOCAL' && (
             <>
               <div className="space-y-2 animate-in fade-in">
                 <label className="text-[9px] font-black uppercase text-zinc-600">Local_Endpoint</label>
                 <input 
                   value={neuralConfig.endpoint} 
                   onChange={(e) => setNeuralConfig(prev => ({...prev, endpoint: e.target.value}))}
                   className={`w-full bg-black border p-2 text-[10px] text-zinc-300 font-mono outline-none focus:border-teal-500 ${localFetchError ? 'border-red-900 focus:border-red-500' : 'border-zinc-800'}`}
                   placeholder="http://127.0.0.1:1234/v1"
                 />
                 {localFetchError && <div className="text-[8px] text-red-500 font-mono">CONNECTION_REFUSED: Check local server</div>}
               </div>
               <div className="space-y-2 animate-in fade-in">
                  <label className="text-[9px] font-black uppercase text-zinc-600">Target_Model (Dynamic Fetch)</label>
                  <select
                      value={neuralConfig.model}
                      onChange={(e) => setNeuralConfig(prev => ({...prev, model: e.target.value}))}
                      className="w-full bg-black border border-zinc-800 p-2 text-[10px] text-zinc-300 outline-none focus:border-teal-500"
                  >
                      {dynamicLocalModels.length > 0 ? (
                        dynamicLocalModels.map(m => <option key={m} value={m}>{m}</option>)
                      ) : (
                        LOCAL_MODELS.map(m => <option key={m} value={m}>{m}</option>)
                      )}
                  </select>
               </div>
             </>
          )}
        </div>
      </Modal>

      {/* UPDATED: Inventory Dialog using Panel Slot Config */}
      {inventoryContext && inventoryContext.type && (
        <InventoryDialog 
          isOpen={!!inventoryContext} 
          onClose={() => setInventoryContext(null)} 
          panelId={inventoryContext.panelId}
          slotType={inventoryContext.type}
          currentConfig={(() => {
            const targetId = inventoryContext.panelId;
            const pConfig = settings.panelSlots[targetId] || DEFAULT_PANEL_CONFIG[targetId] || FALLBACK_PANEL_CONFIG;
            // Cast to any to avoid TS unknown type error
            const typedConfig = pConfig as any;
            return inventoryContext.type === 'data' ? typedConfig.dataSlot : typedConfig.neuralSlot;
          })()}
          onEquip={(panelId, slotType, launcherId, ammoId) => {
             setSettings(s => {
                // Safe update logic
                const pConfig = s.panelSlots[panelId] || DEFAULT_PANEL_CONFIG[panelId] || FALLBACK_PANEL_CONFIG;
                const currentConfig = pConfig as any;
                
                return {
                    ...s,
                    panelSlots: {
                       ...s.panelSlots,
                       [panelId]: {
                          ...currentConfig,
                          [slotType === 'data' ? 'dataSlot' : 'neuralSlot']: { launcherId, ammoId }
                       }
                    }
                };
             });
          }}
        />
      )}

      {/* Main Inventory Viewer - Now passing panelSlots for assignment context */}
      <Modal isOpen={showInventory} onClose={() => setShowInventory(false)} title="TACTICAL_INVENTORY_MANIFEST" variant="purple">
         <InventoryList panelSlots={settings.panelSlots} />
      </Modal>
      
      {/* Historical Data Viewer */}
      <Modal 
        isOpen={!!historyModal?.isOpen} 
        onClose={() => setHistoryModal(null)} 
        title={`HISTORICAL_DATA: ${historyModal?.title || 'UNKNOWN'}`}
        variant="teal"
      >
         {historyModal && <HistoryViewer panelId={historyModal.panelId} headers={historyModal.headers} />}
      </Modal>

      <Modal isOpen={!!probeContextModal} onClose={() => setProbeContextModal(null)} title={`${probeContextModal?.title}`} variant="purple">
         {probeContextModal && renderProbeContent(probeContextModal.payload)}
      </Modal>
    </div>
  );
};

export default App;