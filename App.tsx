
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  PanelSlotConfig,
  ScriptState,
  SlotConfig
} from './types';
import Dashboard from './components/Dashboard';
import CoreStatsView from './components/CoreStatsView';
import TelemetryGraphs from './components/TelemetryGraphs';
import Toolkit from './components/Toolkit';
import History from './components/History';
import AdminPanel from './components/AdminPanel';
import ScannerPanel from './components/ScannerPanel';
import Card from './components/common/Card';
import Modal from './components/common/Modal';
import Tooltip from './components/common/Tooltip';
import InventoryDialog from './components/common/InventoryDialog';
import TacticalButton from './components/common/TacticalButton';
import ProbeAuditDialog from './components/common/ProbeAuditDialog';
import { CoreSelectorDialog } from './components/common/CoreSelectorDialog';
import { aiTransport } from './services/aiTransport';
import { launcherSystem, PROBE_AMMUNITION, DEFAULT_PANEL_CONFIG, FALLBACK_PANEL_CONFIG, DEFAULT_GLOBAL_LOW_SLOT, DEFAULT_GLOBAL_PROBE_SLOT, DEFAULT_GLOBAL_SENSOR_SLOT } from './services/launcherService';
import { serverService } from './services/serverService';
import { HistoryStorage } from './services/historyStorage';
import { testAiAvailability, performNeuralProbe } from './services/aiService';
import { platformService } from './services/platformService';
import { PROBE_CONTRACTS } from './services/probeContracts';

const SETTINGS_KEY = 'neural_sentinel_app_settings_v5';
const MASTER_PROBE_FIRE_KEY = 'master_probe_last_fire_ts';

const INITIAL_PERMISSIONS: Record<string, { low: boolean, probe: boolean, sensor: boolean }> = {
  'GLOBAL_SYSTEM_PROBE': { low: true, probe: true, sensor: false },
  'HANDSHAKE_CORE': { low: true, probe: true, sensor: false },
  'ADAPTER_HUB': { low: true, probe: true, sensor: false },
  'CONSOLE_DATA_PROBE': { low: true, probe: true, sensor: false },
  'NODE_DIAGNOSTICS': { low: true, probe: true, sensor: false },
  'PROCESS_PROBE': { low: true, probe: true, sensor: false },
  'RSSI_REPORT': { low: true, probe: true, sensor: false },
  'SESSION_ARCHIVE': { low: true, probe: true, sensor: false },
  'LOG_AUDIT': { low: true, probe: true, sensor: false },
  'SENSOR_PANEL': { low: true, probe: true, sensor: true }
};

const App: React.FC = () => {
  const [mode, setMode] = useState<OperationalMode>(OperationalMode.OFFLINE);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'telemetry' | 'toolkit' | 'core_stats' | 'history' | 'admin' | 'scanner'>('dashboard');
  const [activeLogTab, setActiveLogTab] = useState<LogType>('neural');
  const [unreadLogs, setUnreadLogs] = useState<Record<LogType, boolean>>({ neural: false, console: false, kernel: false, system: false });
  const [showCoreSelector, setShowCoreSelector] = useState(false);
  const [showProbeHistory, setShowProbeHistory] = useState(false);
  
  const [systemData, setSystemData] = useState<CoreStats | null>(null); 
  const [telemetryData, setTelemetryData] = useState<CoreStats | null>(null); 
  const [activeTelemetry, setActiveTelemetry] = useState<Set<string>>(new Set(['cpu']));
  const [uplinkStatus, setUplinkStatus] = useState({ neural: 'OFFLINE', service: 'OFFLINE' });
  const [serviceConnectionLocked, setServiceConnectionLocked] = useState(false);
  const [terminalHistory, setTerminalHistory] = useState<string[]>([]);
  const [inventoryContext, setInventoryContext] = useState<{panelId: string, type?: 'low' | 'probe' | 'sensor' | 'main'} | null>(null);
  const [showPingModal, setShowPingModal] = useState(false);
  const [highSlotScriptTriggerEvent, setHighSlotScriptTriggerEvent] = useState<number>(0);
  const [tick, setTick] = useState(0);

  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem(SETTINGS_KEY);
    const hostPlatform = platformService.detectLocalPlatform();
    const defaults: AppSettings = {
      showAsciiBg: true,
      globalDistortion: true,
      panelDistortion: true,
      pollInterval: 30,
      timeframe: '1m',
      frogInterval: 30,
      frogColor: '#22c55e', 
      frogIntensity: 0.3,
      coreRechargeRate: 60,
      neuralRechargeRate: 30,
      maxCoreCharges: 5,
      maxNeuralCharges: 5,
      panelSlots: DEFAULT_PANEL_CONFIG,
      globalLowSlot: DEFAULT_GLOBAL_LOW_SLOT,
      globalProbeSlot: DEFAULT_GLOBAL_PROBE_SLOT,
      globalSensorSlot: DEFAULT_GLOBAL_SENSOR_SLOT,
      slotPermissions: INITIAL_PERMISSIONS,
      telemetryEnabled: true,
      neuralUplinkEnabled: true,
      platform: hostPlatform, 
      dataSourceMode: 'LOCAL' as DataSourceMode,
      telemetryUrl: 'http://127.0.0.1:5050'
    };
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.dataSourceMode === 'LOCAL') parsed.platform = hostPlatform;
      return { ...defaults, ...parsed };
    }
    return defaults;
  });

  const [neuralConfig, setNeuralConfig] = useState<NeuralNetworkConfig>({
    provider: NeuralNetworkProvider.GEMINI,
    endpoint: 'http://localhost:1234/v1',
    model: 'gemini-3-flash-preview',
    fallbackToLocal: false
  });

  const session = useMemo<SessionInfo>(() => ({
    id: Math.random().toString(36).substring(7).toUpperCase(),
    startTime: new Date().toISOString(),
    mode: mode,
    targetIp: null,
    status: mode === OperationalMode.REAL ? 'ACTIVE' : 'IDLE'
  }), [mode]);

  const [neuralLogs, setNeuralLogs] = useState<LogEntry[]>([]);
  const [consoleLogs, setConsoleLogs] = useState<LogEntry[]>([]);
  const [kernelLogs, setKernelLogs] = useState<LogEntry[]>([]);
  const [systemLogs, setSystemLogs] = useState<LogEntry[]>([]);
  const [processingId, setProcessingId] = useState<string | undefined>(undefined);
  const [latestCoreProbeResult, setLatestCoreProbeResult] = useState<any>(null);

  const isRemote = settings.dataSourceMode === 'REMOTE';
  const isLocal = settings.dataSourceMode === 'LOCAL';
  const isConnected = mode === OperationalMode.REAL || isLocal;

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const addLog = useCallback((msg: string, level: LogLevel = LogLevel.INFO, type: LogType = 'neural', metadata?: any) => {
    const entry: LogEntry = {
      id: Math.random().toString(36),
      timestamp: new Date().toLocaleTimeString(),
      level,
      message: msg,
      source: mode,
      metadata
    };
    const setter = type === 'neural' ? setNeuralLogs : type === 'console' ? setConsoleLogs : type === 'kernel' ? setKernelLogs : setSystemLogs;
    setter(prev => [entry, ...prev].slice(0, 100));
    if (activeLogTab !== type) setUnreadLogs(prev => ({ ...prev, [type]: true }));
  }, [mode, activeLogTab]);

  useEffect(() => {
    const heartbeat = setInterval(async () => {
      if (isConnected) {
        setSystemData(platformService.generateSystemStats(settings.platform));
        const aiOk = await testAiAvailability(neuralConfig);
        setUplinkStatus(prev => ({ ...prev, neural: aiOk ? 'ACTIVE' : 'OFFLINE' }));
      } else {
        setSystemData(null);
        setUplinkStatus(prev => ({ ...prev, neural: 'OFFLINE', service: 'OFFLINE' }));
      }

      if (settings.telemetryEnabled && isConnected && !serviceConnectionLocked) {
        try {
          const res = await fetch(`${settings.telemetryUrl}/stats`, { signal: AbortSignal.timeout(2000) });
          if (res.ok) {
            const data = await res.json();
            setTelemetryData(data);
            setUplinkStatus(prev => ({ ...prev, service: 'ACTIVE' }));
            setServiceConnectionLocked(false);
          } else throw new Error();
        } catch {
          setUplinkStatus(prev => ({ ...prev, service: 'OFFLINE' }));
          setServiceConnectionLocked(true); // Stop indefinite polling on failure
        }
      } else if (!settings.telemetryEnabled) {
          setUplinkStatus(prev => ({ ...prev, service: 'OFFLINE' }));
      }
    }, 5000);
    return () => clearInterval(heartbeat);
  }, [settings, neuralConfig, isConnected, serviceConnectionLocked]);

  const handleHandshake = (ip: string, user: string, pass: string, port: number) => {
    setMode(OperationalMode.REAL);
    addLog(`HANDSHAKE ESTABLISHED: Link stable. Platform detected: ${settings.platform}`, LogLevel.SUCCESS, 'system');
  };

  const handleDisconnect = () => {
    setMode(OperationalMode.OFFLINE);
    addLog(`SESSION TERMINATED.`, LogLevel.WARNING, 'system');
  };

  const handleNeuralProbe = async (panelName: string, metrics: any) => {
    if (!settings.neuralUplinkEnabled) return;
    
    // UNIQUE MASTER CORE PROBE BEHAVIOR
    if (panelName === 'GLOBAL_SYSTEM_PROBE') {
        const now = Date.now();
        const lastFire = Number(localStorage.getItem(MASTER_PROBE_FIRE_KEY) || 0);
        const cooldownRemaining = Math.max(0, (lastFire + 300000) - now);
        
        if (cooldownRemaining > 0) {
            addLog(`MASTER_PROBE_BLOCKED: Neural sync buffer cooling. Wait ${Math.ceil(cooldownRemaining/1000)}s.`, LogLevel.ERROR, 'neural');
            return;
        }

        setProcessingId(panelName);
        
        // AGGREGATE ALL ACTIVE PANEL DATA
        const aggregatedProbes: any[] = [];
        (Object.entries(settings.panelSlots) as [string, PanelSlotConfig][]).forEach(([pid, pConfig]) => {
            if (pid === 'GLOBAL_SYSTEM_PROBE') return;
            // Only include panels that have a probe equipped
            if (pConfig.probeSlot?.launcherId) {
                const contract = PROBE_CONTRACTS[pid];
                if (contract) {
                    aggregatedProbes.push({
                        panel_id: pid,
                        payload: contract.buildPayload({
                            stats: systemData,
                            processes: systemData?.processes,
                            platform: settings.platform,
                            mode
                        })
                    });
                }
            }
        });
        
        const masterMetrics = {
            summary: "CONSOLIDATED_MASTER_PROBE_SNAPSHOT",
            platform: settings.platform,
            active_probes: aggregatedProbes,
            telemetry_context: telemetryData
        };

        const result = await performNeuralProbe(neuralConfig, panelName, masterMetrics, { 
          sessionId: session.id, mode, serviceStatus: uplinkStatus.service as any, tokenLimit: 4000
        });
        
        setLatestCoreProbeResult(result);
        const isError = result.elementId === 'TRANSPORT_ERROR' || result.elementId === 'ERROR';
        
        if (!isError) {
          localStorage.setItem(MASTER_PROBE_FIRE_KEY, now.toString());
          addLog(`MASTER_CORE_PROBE: Successful aggregation of ${aggregatedProbes.length} node vectors.`, LogLevel.SUCCESS, 'neural');
        } else {
          addLog(`MASTER_CORE_PROBE: Processing failure. [Code: ${result.errorCode || '500'}]`, LogLevel.ERROR, 'neural');
        }
        
        setProcessingId(undefined);
        return;
    }

    // STANDARD PROBE BEHAVIOR
    let slotType: 'LOW' | 'PROBE' | 'SENSOR' | 'MAIN' = 'PROBE';
    if (panelName === 'SENSOR_PANEL') slotType = 'SENSOR';

    const slot = settings.panelSlots[panelName]?.[slotType === 'SENSOR' ? 'sensorSlot' : 'probeSlot'] || settings.globalLowSlot;
    const launcherDef = slot?.launcherId ? launcherSystem.getById(slot.launcherId) : null;

    if (slot?.launcherId && !serverService.validateProbe(slot.launcherId, 1, slot.ammoId)) {
        addLog(`PROBE_FAILURE: Launcher ${slot.launcherId} exhausted or on cooldown.`, LogLevel.ERROR, 'neural');
        return;
    }

    setProcessingId(panelName);
    
    // Automated Token Usage Logic: launcher tokens are used for sensor panel ONLY if Neural Integration is equipped.
    const sensorAmmo = panelName === 'SENSOR_PANEL' && slot?.ammoId ? launcherSystem.getConsumableById(slot.ammoId) : null;
    const useLauncherTokens = panelName !== 'SENSOR_PANEL' || sensorAmmo?.isNeuralIntegration;
    const finalTokenLimit = useLauncherTokens ? (launcherDef?.tokens || 3000) : 3000;

    const result = await performNeuralProbe(neuralConfig, panelName, { ...metrics, platform: settings.platform }, { 
      sessionId: session.id, mode, serviceStatus: uplinkStatus.service as any, tokenLimit: finalTokenLimit
    });
    
    const isError = result.elementId === 'TRANSPORT_ERROR' || result.elementId === 'ERROR';
    const logLevel = isError ? LogLevel.ERROR : LogLevel.NEURAL;

    addLog(`Neural Probe Output: ${panelName}${isError ? ` [FAILURE]` : ''}`, logLevel, 'neural', { 
        type: 'PROBE_RESULT', panelId: panelName, slotType, probeType: 'CORE_DATA',
        probeStatus: isError ? 'ERROR' : 'COMPLETED', tokenLimit: finalTokenLimit,
        requestPayload: result._sentPayload, responsePayload: result, launcherId: slot?.launcherId
    });
    
    setProcessingId(undefined);
    if (slot?.launcherId && !isError) serverService.triggerCooldown(slot.launcherId, launcherDef?.baseCooldown || 60000);
  };

  const handleBrainRequest = async (id: string, type: string, metrics: any) => {
    // GLOBAL LOW SLOT CONSUMPTION
    const slot = settings.globalLowSlot;
    const launcherDef = launcherSystem.getById(slot.launcherId);

    if (slot?.launcherId && !serverService.validateProbe(slot.launcherId, 1, slot.ammoId)) {
        addLog(`NEURO_DATA_PROBE_FAILURE: Global Launcher ${slot.launcherId} exhausted or reloading.`, LogLevel.ERROR, 'neural');
        return;
    }

    setProcessingId(id);
    const contract = PROBE_CONTRACTS[id] || PROBE_CONTRACTS['GLOBAL_SYSTEM_PROBE'];
    const requestPayload = { ...(contract.buildNeuroPayload ? contract.buildNeuroPayload(metrics) : { labels: ["Metric", "Panel"] }), context: type, platform: settings.platform };
    const response = await aiTransport.fetch(neuralConfig, `Neuro Data Probe: Lightweight insight in JSON.`, JSON.stringify(requestPayload), false, 400);
    
    if (response.success) {
      addLog(`Neuro Data Probe: ${id}`, LogLevel.NEURAL, 'neural', { 
          type: 'PROBE_RESULT', panelId: id, slotType: 'LOW', probeType: 'NEURO_DATA', probeStatus: 'COMPLETED', tokenLimit: 400,
          requestPayload, responsePayload: response.data, launcherId: slot?.launcherId
      });
      // Trigger global low slot cooldown upon successful inference
      serverService.triggerCooldown(slot.launcherId, launcherDef?.baseCooldown || 30000);
    } else {
      addLog(`Neuro Data Probe Failure [${response.errorCode || '400'}]: ${response.error}`, LogLevel.ERROR, 'neural', {
          type: 'PROBE_RESULT', panelId: id, slotType: 'LOW', probeType: 'NEURO_DATA', probeStatus: 'ERROR', tokenLimit: 400,
          requestPayload, responsePayload: { error: response.error, code: response.errorCode }, launcherId: slot?.launcherId
      });
    }
    setProcessingId(undefined);
  };

  const updateSettings = useCallback((newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  const handleEquip = (pid: string, type: 'low' | 'probe' | 'sensor' | 'main', lid: string, aid: string) => {
    if (type === 'main') {
        launcherSystem.installBooster(aid);
        const success = launcherSystem.activateBooster();
        if (success) {
            addLog(`BOOSTER_ACTIVATED: ${PROBE_AMMUNITION[aid]?.name || aid}. All probe cooldowns bypassed.`, LogLevel.SUCCESS, 'system');
            setTick(t => t + 1); 
        } else {
            addLog(`BOOSTER_FAILURE: Resource exhausted or already engaged.`, LogLevel.ERROR, 'system');
        }
        return;
    }

    if (pid === 'GLOBAL_SYSTEM') {
        if (type === 'low') { updateSettings({ globalLowSlot: { launcherId: lid, ammoId: aid } }); return; }
        
        const nextSlots = { ...settings.panelSlots };
        const slotKey = type === 'probe' ? 'probeSlot' : (type === 'sensor' ? 'sensorSlot' : null);
        
        if (type === 'probe') updateSettings({ globalProbeSlot: { launcherId: lid, ammoId: aid } });
        if (type === 'sensor') updateSettings({ globalSensorSlot: { launcherId: lid, ammoId: aid } });

        if (slotKey) {
            Object.keys(nextSlots).forEach(key => {
                if (DEFAULT_PANEL_CONFIG[key] && (DEFAULT_PANEL_CONFIG[key] as any)[slotKey] !== undefined) {
                    const isAllowed = launcherSystem.isLauncherAllowed(key, lid);
                    if (isAllowed) {
                        const ammo = launcherSystem.getConsumableById(aid);
                        const ammoRequiresHistory = ammo?.features.includes('HISTORY_CSV');
                        const panelSupportsHistory = launcherSystem.isHistoricalSupported(key);
                        
                        if (ammoRequiresHistory && !panelSupportsHistory) {
                             nextSlots[key] = { ...nextSlots[key], [slotKey]: { launcherId: 'std-core', ammoId: 'std-data-ammo' } };
                        } else {
                             nextSlots[key] = { ...nextSlots[key], [slotKey]: { launcherId: lid, ammoId: aid } };
                        }
                    } else {
                        nextSlots[key] = { ...nextSlots[key], [slotKey]: { launcherId: 'std-core', ammoId: 'std-data-ammo' } };
                    }
                }
            });
        }
        updateSettings({ panelSlots: nextSlots });
    } else if (type === 'low') {
        updateSettings({ globalLowSlot: { launcherId: lid, ammoId: aid } });
    } else {
        const isAllowed = launcherSystem.isLauncherAllowed(pid, lid);
        const finalLid = isAllowed ? (lid || 'std-core') : 'std-core';
        
        const ammo = launcherSystem.getConsumableById(aid);
        const ammoRequiresHistory = ammo?.features.includes('HISTORY_CSV');
        const panelSupportsHistory = launcherSystem.isHistoricalSupported(pid);
        const finalAid = (ammoRequiresHistory && !panelSupportsHistory) ? 'std-data-ammo' : (aid || 'std-data-ammo');

        const slotKey = type === 'probe' ? 'probeSlot' : 'sensorSlot';
        updateSettings({ panelSlots: { ...settings.panelSlots, [pid]: { ...settings.panelSlots[pid], [slotKey]: { launcherId: finalLid, ammoId: finalAid } } } });
    }
  };

  const getSlotStats = useCallback((type: 'low' | 'probe') => {
    const launcherMappings: Array<{id: string, ammoId: string}> = [];
    if (type === 'low') { 
        if (settings.globalLowSlot.launcherId) launcherMappings.push({ id: settings.globalLowSlot.launcherId, ammoId: settings.globalLowSlot.ammoId }); 
    } else {
        (Object.values(settings.panelSlots) as PanelSlotConfig[]).forEach(slot => { 
            if (slot.probeSlot?.launcherId) launcherMappings.push({ id: slot.probeSlot.launcherId, ammoId: slot.probeSlot.ammoId }); 
        });
    }
    return serverService.getTierStats(type === 'low' ? 'neural' : 'core', launcherMappings);
  }, [settings.panelSlots, settings.globalLowSlot, tick]);

  const renderHeaderSlotSegment = (type: 'low' | 'probe') => {
    const stats = getSlotStats(type);
    const color = type === 'low' ? '#00ffd5' : '#bd00ff';
    const launcherId = type === 'low' ? settings.globalLowSlot.launcherId : settings.globalProbeSlot.launcherId;
    const progress = launcherId ? serverService.getCooldownProgress(launcherId) : 1;

    return (
      <Tooltip key={type} name={`${type.toUpperCase()}_LOAD`} source="SYSTEM" desc={`GLOBAL MASTER CONFIG: Click to adjust all ${type} tier slots simultaneously across all panels.`}>
          <div 
            onClick={() => setInventoryContext({ panelId: 'GLOBAL_SYSTEM', type: type })} 
            className="flex flex-col items-center gap-1 bg-black/30 p-2 border border-zinc-900/50 hover:border-zinc-700 rounded-sm min-w-[120px] transition-all cursor-pointer group relative overflow-hidden"
          >
              <div className="flex gap-1.5 items-center w-full justify-between px-1">
                  <div className="flex gap-0.5">{[...Array(stats.maxCharges)].map((_, i) => <div key={i} className={`w-1.5 h-6 border transition-all duration-500 ${i < stats.charges ? 'opacity-100 glow-segment' : 'opacity-10'}`} style={{ backgroundColor: color, borderColor: color, boxShadow: i < stats.charges ? `0 0 8px ${color}44` : 'none' }}></div>)}</div>
                  <div className={`text-[10px] font-black font-mono px-1.5 py-0.5 border border-zinc-800 bg-black/40 min-w-[32px] text-center group-hover:border-zinc-500 transition-colors`} style={{ color: stats.cooldown > 0 ? '#ff3e3e' : color }}>{stats.cooldown > 0 ? (stats.cooldown/1000).toFixed(0) + 's' : 'READY'}</div>
              </div>
              <div className="w-full h-[1px] bg-zinc-900 mt-1"></div>
              <span className="text-[8px] font-black uppercase text-zinc-600 tracking-[0.2em]">{type}_TIER_LOAD</span>
              
              {/* PROGRESS LINE FOR RELOAD */}
              {stats.cooldown > 0 && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-zinc-800/40">
                  <div className="h-full bg-current transition-all duration-1000 shadow-[0_0_5px_currentColor]" style={{ width: `${progress * 100}%`, color: color }}></div>
                </div>
              )}
          </div>
      </Tooltip>
    );
  };

  const sensorScriptState = useMemo(() => {
    return serverService.getScriptState('SENSOR_PANEL', settings);
  }, [settings, tick]);

  const sensorSlotLauncherId = settings.panelSlots['SENSOR_PANEL']?.sensorSlot?.launcherId;
  const sensorProgress = sensorSlotLauncherId ? serverService.getCooldownProgress(sensorSlotLauncherId) : 1;
  const sensorCd = sensorSlotLauncherId ? serverService.getCooldown(sensorSlotLauncherId) : 0;

  const handleHeaderSensorShortcut = async () => {
    const sensorSlot = settings.panelSlots['SENSOR_PANEL']?.sensorSlot;
    if (!sensorSlot?.launcherId) return;

    if (sensorCd > 0) {
      addLog("SCRIPT_ACTIVATION_BLOCKED: Module on persistent reload.", LogLevel.ERROR, "system");
      return;
    }

    const ammo = PROBE_AMMUNITION[sensorSlot.ammoId];
    const isDataAmmo = ammo?.type === 'module-core'; 
    
    addLog(`ACTIVATING SCRIPT: ${ammo?.name || 'Sensor Module'}`, LogLevel.NEURAL, "system");
    serverService.halveTierCooldowns();
    addLog("BUFF_APPLIED: Neural Manifold Synced. Tier cooldowns reduced by 50%.", LogLevel.SUCCESS, "neural");
    serverService.triggerCooldown(sensorSlot.launcherId, 3600000); 
    setActiveTab('scanner');
    setHighSlotScriptTriggerEvent(Date.now());

    if (isDataAmmo) {
        handleNeuralProbe('SENSOR_PANEL', { shortcut_action: 'HEADER_QUICK_FIRE' });
    }
  };

  const getScriptStateColor = (state: ScriptState) => {
    switch (state) {
      case ScriptState.LOADED: return 'text-orange-500';
      case ScriptState.DISABLED: return 'text-zinc-600';
      case ScriptState.REFRESHING: return 'text-orange-400';
      case ScriptState.BROKEN: return 'text-red-500';
      default: return 'text-zinc-600';
    }
  };

  const getSensorScriptName = () => {
    const scriptId = settings.panelSlots['SENSOR_PANEL']?.sensorSlot?.ammoId;
    if (!scriptId) return 'EMPTY_LINK';
    return PROBE_AMMUNITION[scriptId]?.name || 'UNKNOWN_SCRIPT';
  };

  const isGemini = neuralConfig.provider === NeuralNetworkProvider.GEMINI;
  const coreColor = isGemini ? '#eab308' : '#00ffd5';
  const coreGlowShadow = isGemini 
    ? '0 0 20px rgba(234, 179, 8, 0.4)' 
    : '0 0 20px rgba(0, 255, 213, 0.3), 0 0 35px rgba(189, 0, 255, 0.2)';

  const currentInventoryConfig = useMemo(() => {
    if (!inventoryContext) return FALLBACK_PANEL_CONFIG;
    if (inventoryContext.panelId === 'GLOBAL_SYSTEM') {
        return {
            probeSlot: settings.globalProbeSlot,
            sensorSlot: settings.globalSensorSlot
        };
    }
    return settings.panelSlots[inventoryContext.panelId] || FALLBACK_PANEL_CONFIG;
  }, [inventoryContext, settings.panelSlots, settings.globalProbeSlot, settings.globalSensorSlot]);

  const handleRetryTelemetry = useCallback(async () => {
    setUplinkStatus(prev => ({ ...prev, service: 'CONNECTING' as any }));
    try {
      const res = await fetch(`${settings.telemetryUrl}/stats`, { signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        const data = await res.json();
        setTelemetryData(data);
        setUplinkStatus(prev => ({ ...prev, service: 'ACTIVE' }));
        setServiceConnectionLocked(false);
      } else {
        throw new Error();
      }
    } catch {
      setUplinkStatus(prev => ({ ...prev, service: 'OFFLINE' }));
      setServiceConnectionLocked(true);
    }
  }, [settings.telemetryUrl]);

  const isBypasserActive = launcherSystem.isBoosterActive();
  const boosterId = launcherSystem.getInstalledBoosterId();
  const boosterCount = boosterId ? launcherSystem.getAmmoCount(boosterId) : 0;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#020406]">
      <header className="h-24 border-b border-[#1a1e24] bg-[#050608] flex items-center z-50 shrink-0 relative shadow-2xl">
        <div className="flex-none w-64 h-full flex items-center px-6">
            <div onClick={() => setShowPingModal(true)} className="relative w-40 h-16 flex items-center justify-center transition-all duration-700 cursor-pointer group">
              <div className="absolute inset-0 opacity-10 group-hover:opacity-25 transition-opacity duration-1000 blur-xl pointer-events-none" style={{ background: "radial-gradient(circle, rgb(0, 242, 255) 0%, transparent 80%)" }}></div>
              <svg width="150" height="60" viewBox="0 0 100 40" fill="none" className="relative z-10">
                <rect x="35" y="5" width="30" height="30" rx="1" stroke={isConnected ? "#00f2ff" : "#ff3e3e"} strokeWidth="0.5" strokeDasharray="2 1" opacity="0.3"></rect>
                <rect x="42" y="12" width="16" height="16" rx="0.5" fill="#020406" stroke={isConnected ? "#00f2ff" : "#ff3e3e"} strokeWidth="0.8" opacity="0.9"></rect>
                <circle cx="50" cy="20" r="1.5" fill={isConnected ? "#60a5fa" : "#ff3e3e"}><animate attributeName="r" values="1;2.2;1" dur="1.5s" repeatCount="indefinite"></animate></circle>
                <text x="50" y="38" fill={isConnected ? "#00f2ff" : "#ff3e3e"} fontSize="2.5" fontWeight="900" textAnchor="middle" opacity="0.6" letterSpacing="1.5">SENTINEL_CORE</text>
              </svg>
            </div>
            <div className="flex flex-col ml-4">
                <h1 className="text-xl font-black tracking-widest text-white uppercase leading-none">SENTINEL</h1>
                <div className="flex items-center gap-2 mt-1.5">
                    <button onClick={() => updateSettings({ dataSourceMode: isLocal ? 'REMOTE' : 'LOCAL' })} className={`w-10 h-5 rounded-full border border-zinc-800 flex items-center p-1 transition-all ${isRemote ? 'justify-end bg-green-950/20 border-green-500/50' : 'justify-start bg-blue-950/20 border-blue-500/50'}`}>
                        <div className={`w-2.5 h-2.5 rounded-full ${isRemote ? 'bg-green-500' : 'bg-blue-400'}`}></div>
                    </button>
                    <span className={`text-[9px] font-black uppercase tracking-widest ${isRemote ? 'text-green-500' : 'text-blue-400'}`}>{settings.dataSourceMode}</span>
                </div>
            </div>
        </div>

        <div className="flex items-center gap-6 flex-1 justify-center px-6 relative h-full">
          {renderHeaderSlotSegment('low')}
          {renderHeaderSlotSegment('probe')}
          
          <div className="flex flex-col items-start ml-6 border-l border-zinc-900 pl-6 shrink-0 min-w-[220px]">
            <span className={`text-[9px] font-black uppercase tracking-[0.1em] mb-1 transition-colors ${sensorScriptState.state === ScriptState.DISABLED ? 'text-zinc-600' : 'text-orange-600'}`}>
              Script Loaded
            </span>
            <div className="flex items-center gap-4">
               <Tooltip 
                 name="SENSOR_SCRIPT_SHORTCUT" 
                 source="SYSTEM" 
                 desc={sensorScriptState.reason || `Module: ${settings.panelSlots['SENSOR_PANEL']?.sensorSlot?.launcherId || 'EMPTY'}\nActive Script: ${getSensorScriptName()}\n\nClick to TRIGGER script payload and sync manifold.`}
               >
                 <div 
                   onClick={sensorScriptState.state === ScriptState.LOADED ? handleHeaderSensorShortcut : undefined}
                   className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${sensorScriptState.state === ScriptState.LOADED ? 'cursor-pointer hover:scale-110 active:scale-95 border-orange-500/60 bg-orange-500/10 glow-orange' : 'cursor-not-allowed border-zinc-800 bg-black opacity-30 grayscale'} ${sensorScriptState.state === ScriptState.BROKEN ? 'border-red-500 bg-red-950/20 shadow-[0_0_10px_red]' : ''}`}
                 >
                    <div className={`w-2.5 h-2.5 rounded-full ${settings.panelSlots['SENSOR_PANEL']?.sensorSlot?.ammoId ? (sensorScriptState.state === ScriptState.BROKEN ? 'bg-red-500 animate-ping' : (sensorScriptState.state === ScriptState.LOADED ? 'bg-orange-500 shadow-[0_0_8px_#f97316] animate-pulse' : 'bg-zinc-800')) : 'bg-zinc-800'}`}></div>
                 </div>
               </Tooltip>
               <div 
                  onClick={() => setInventoryContext({ panelId: 'SENSOR_PANEL', type: 'sensor' })}
                  className="flex flex-col cursor-pointer group"
               >
                  <span className={`text-[8px] font-mono uppercase tracking-widest font-black transition-all group-hover:text-white ${sensorScriptState.state === ScriptState.DISABLED ? 'text-zinc-600' : 'text-zinc-300'}`}>{getSensorScriptName()}</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[7px] text-zinc-600 font-black uppercase">STATUS:</span>
                    <span className={`text-[9px] font-mono font-bold ${getScriptStateColor(sensorScriptState.state)}`}>
                      {sensorScriptState.state === ScriptState.REFRESHING ? `${(sensorCd/1000).toFixed(0)}s` : sensorScriptState.state}
                    </span>
                  </div>
               </div>
            </div>
          </div>

          {(sensorScriptState.state === ScriptState.LOADED || sensorScriptState.state === ScriptState.REFRESHING) && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-900/30 overflow-hidden">
               <div 
                 className={`h-full transition-all duration-1000 ease-linear shadow-[0_0_8px_currentColor]`}
                 style={{ 
                   width: `${sensorProgress * 100}%`,
                   backgroundColor: sensorScriptState.state === ScriptState.REFRESHING ? '#f97316' : '#22c55e',
                   color: sensorScriptState.state === ScriptState.REFRESHING ? '#f97316' : '#22c55e'
                 }}
               ></div>
            </div>
          )}
        </div>

        <div className="flex-none w-auto h-full flex items-center justify-end px-8 gap-3">
              <Tooltip 
                name="BOOSTER_LAUNCHER" 
                source="BOOSTER" 
                desc={isBypasserActive ? "BYPASSER_ACTIVE: All probe cooldowns bypassed." : "STANDBY: Click to select and fire a booster consumable.\nRequires active inventory modules."}
                variant="teal"
              >
                <button 
                  onClick={() => setInventoryContext({ panelId: 'GLOBAL_SYSTEM', type: 'main' })}
                  className={`relative w-10 h-10 flex items-center justify-center rounded-sm border transition-all hover:scale-110 active:scale-95 ${isBypasserActive ? 'border-teal-400 bg-teal-500/20 glow-teal shadow-[0_0_15px_#00ffd5]' : 'border-zinc-800 bg-black opacity-40 hover:opacity-100'}`}
                >
                   <svg className={`w-5 h-5 ${isBypasserActive ? 'text-teal-400' : 'text-zinc-500'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                   {isBypasserActive && (
                      <div className="absolute -top-1 -right-1 flex gap-0.5">
                         <div className="w-1 h-1 bg-teal-400 animate-ping rounded-full"></div>
                      </div>
                   )}
                   {boosterId && !isBypasserActive && (
                      <div className="absolute -top-1.5 -right-1.5 bg-black border border-zinc-700 text-white text-[7px] px-1 font-black rounded-full min-w-[14px] h-3.5 flex items-center justify-center shadow-lg">
                        {boosterCount}
                      </div>
                   )}
                </button>
              </Tooltip>

              <div className="w-[1px] h-6 bg-zinc-900 mx-2"></div>

              <button 
                onClick={() => setShowCoreSelector(true)} 
                className="relative w-10 h-10 flex items-center justify-center rounded-full border transition-all group overflow-visible shimmer-glow"
                style={{ 
                  borderColor: `${coreColor}66`, 
                  backgroundColor: `${coreColor}11`,
                  color: coreColor,
                  boxShadow: coreGlowShadow
                } as any}
              >
                  <div className="absolute inset-0 pointer-events-none overflow-visible">
                      <div className="spark-particle s-1"></div>
                      <div className="spark-particle s-2"></div>
                      <div className="spark-particle s-3"></div>
                      <div className="spark-particle s-4"></div>
                  </div>

                  <svg className="w-5 h-5 group-hover:rotate-45 transition-transform relative z-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2"/></svg>
              </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden flex-col md:flex-row">
        <div className="w-full md:w-[70%] flex flex-col border-r border-[#1a1e24]">
          <nav className="h-14 border-b border-[#1a1e24] flex items-center justify-center gap-12 bg-[#0a0c0f]">
            {['dashboard', 'telemetry', 'core_stats', 'scanner', 'toolkit', 'history', 'admin'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab as any)} className={`text-[11px] font-black uppercase tracking-[0.2em] relative h-full transition-colors ${activeTab === tab ? 'text-white' : 'text-zinc-600 hover:text-zinc-400'}`}>
                {tab.replace('_', ' ')}{activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-1 bg-teal-500"></div>}
              </button>
            ))}
          </nav>
          <div className="flex-1 overflow-y-auto p-10 no-scroll">
            {activeTab === 'dashboard' && <Dashboard stats={systemData} mode={mode} session={session} settings={settings} setSettings={setSettings} terminalHistory={terminalHistory} onHandshake={handleHandshake} onDisconnect={handleDisconnect} onLog={addLog} onBrainClick={handleBrainRequest} onProbeClick={handleNeuralProbe} onProbeInfo={() => {}} onLauncherSelect={(id, type) => setInventoryContext({panelId: id, type: type as any})} onAdapterCommand={cmd => setTerminalHistory(p => [...p, cmd])} onRefresh={() => {}} processingId={processingId} latestCoreProbeResult={latestCoreProbeResult} activeTelemetry={activeTelemetry} tick={tick} />}
            {activeTab === 'core_stats' && <CoreStatsView stats={systemData} mode={mode} timeframe="1m" settings={settings} onProbeClick={handleNeuralProbe} onBrainClick={handleBrainRequest} onProbeInfo={() => {}} onLauncherSelect={(id, type) => setInventoryContext({panelId: id, type: type as any})} onCommand={cmd => setTerminalHistory(p => [...p, cmd])} activeTelemetry={activeTelemetry} setActiveTelemetry={setActiveTelemetry} />}
            {activeTab === 'telemetry' && <TelemetryGraphs stats={telemetryData} timeframe="1m" isSimulated={mode === OperationalMode.SIMULATED} isConnected={uplinkStatus.service === 'ACTIVE'} onProbe={handleNeuralProbe} onProbeInfo={() => {}} onBrainClick={handleBrainRequest} onLauncherSelect={(id, type) => setInventoryContext({panelId: id, type: type as any})} serviceStatus={(uplinkStatus.service === 'ACTIVE' ? 'ONLINE' : (serviceConnectionLocked ? 'LOCKED' : 'OFFLINE')) as any} onRetryConnection={handleRetryTelemetry} settings={settings} slotConfig={settings.panelSlots['RSSI_REPORT']} globalLowSlot={settings.globalLowSlot} permissions={settings.slotPermissions['RSSI_REPORT']} />}
            {activeTab === 'toolkit' && <Toolkit onRunCommand={cmd => setTerminalHistory(p => [...p, cmd])} onBreakdown={() => {}} mode={mode} />}
            {activeTab === 'history' && <History data={HistoryStorage.getParsed('HISTORY_SESSION_ARCHIVE')} onProbe={handleNeuralProbe} onProbeInfo={() => {}} onBrainClick={handleBrainRequest} onLauncherSelect={(id, type) => setInventoryContext({panelId: id, type: type as any})} slotConfig={settings.panelSlots['SESSION_ARCHIVE']} globalLowSlot={settings.globalLowSlot} permissions={settings.slotPermissions['SESSION_ARCHIVE']} />}
            {activeTab === 'admin' && <AdminPanel settings={settings} setSettings={setSettings} />}
            {activeTab === 'scanner' && <ScannerPanel stats={systemData} platform={settings.platform} settings={settings} onLauncherSelect={(id, type) => setInventoryContext({panelId: id, type: type as any})} onNeuralProbe={handleNeuralProbe} isProcessing={processingId === 'SENSOR_PANEL'} externalTrigger={highSlotScriptTriggerEvent} />}
          </div>
        </div>
        
        <div className="w-full md:w-[30%] flex flex-col bg-[#020406] border-t md:border-t-0 md:border-l border-[#1a1e24] overflow-hidden relative">
          <div className="h-14 border-b border-zinc-900 px-4 flex items-center justify-between bg-[#0a0c0f] z-10 shrink-0">
             <div className="flex h-full overflow-x-auto no-scroll">
               {(['neural', 'console', 'kernel', 'system'] as LogType[]).map(lt => (
                 <button key={lt} onClick={() => { setActiveLogTab(lt); setUnreadLogs(v => ({...v, [lt]: false})); }} className={`px-4 text-[10px] font-black uppercase tracking-widest relative h-full whitespace-nowrap transition-colors ${activeLogTab === lt ? 'text-white' : 'text-zinc-700 hover:text-zinc-500'} ${unreadLogs[lt] ? 'tab-flash' : ''}`}>{lt}{activeLogTab === lt && <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-purple-500"></div>}</button>
               ))}
             </div>
             <TacticalButton label="AUDIT" size="sm" onClick={() => setShowProbeHistory(true)} color="#bd00ff" />
          </div>

          <div className="flex-1 overflow-hidden p-2">
            <Card
              id="LOG_AUDIT"
              title="LIVE_LOG_STREAM"
              variant="purple"
              className="h-full"
              onProbe={() => handleNeuralProbe('LOG_AUDIT', { logs: activeLogTab === 'neural' ? neuralLogs : activeLogTab === 'console' ? consoleLogs : activeLogTab === 'kernel' ? kernelLogs : systemLogs })}
              onBrain={() => handleBrainRequest('LOG_AUDIT', 'Log Stream Analysis', { logType: activeLogTab })}
              onLauncherSelect={(pid, type) => setInventoryContext({panelId: pid, type: type as any})}
              slotConfig={settings.panelSlots['LOG_AUDIT']}
              globalLowSlot={settings.globalLowSlot}
              permissions={settings.slotPermissions['LOG_AUDIT']}
              isProcessing={processingId === 'LOG_AUDIT'}
            >
              <div className="flex-1 overflow-y-auto space-y-4 font-mono text-[11px] no-scroll z-10 relative">
                   {(activeLogTab === 'neural' ? neuralLogs : activeLogTab === 'console' ? consoleLogs : activeLogTab === 'kernel' ? kernelLogs : systemLogs).map(log => (
                        <div key={log.id} className="border-l-2 pl-4 py-2 bg-black/40 mb-2 group transition-colors relative" style={{ borderColor: log.level === LogLevel.ERROR ? '#f87171' : (log.level === LogLevel.NEURAL ? (log.metadata?.slotType === 'LOW' ? '#00ffd5' : log.metadata?.slotType === 'SENSOR' ? '#f97316' : '#bd00ff') : '#52525b') }}>
                          <div className="flex justify-between items-start mb-1 text-[9px] text-zinc-600">
                            <span>{log.timestamp}</span>
                            {(log.metadata?.type === 'PROBE_RESULT' || log.message.includes('Neural Probe Output')) && <button onClick={() => setShowProbeHistory(true)} className="text-[8px] font-black text-purple-500 opacity-0 group-hover:opacity-100 transition-opacity hover:underline">PACKET</button>}
                          </div>
                          <pre className="whitespace-pre-wrap text-zinc-400 group-hover:text-zinc-200 transition-colors">{log.message}</pre>
                        </div>
                   ))}
              </div>
            </Card>
          </div>
        </div>
      </main>

      <InventoryDialog 
        isOpen={!!inventoryContext} 
        onClose={() => setInventoryContext(null)} 
        panelId={inventoryContext?.panelId || ''} 
        initialSlotType={inventoryContext?.type as any || 'low'} 
        fullConfig={currentInventoryConfig} 
        globalLowSlot={settings.globalLowSlot}
        onEquip={handleEquip} 
        onClear={(pid, type) => handleEquip(pid, type, 'std-core', 'std-data-ammo')}
        onRemove={(pid, type) => handleEquip(pid, type, 'std-core', 'std-data-ammo')}
      />
      
      <CoreSelectorDialog isOpen={showCoreSelector} onClose={() => setShowCoreSelector(false)} config={neuralConfig} setConfig={setNeuralConfig} />
      <ProbeAuditDialog isOpen={showProbeHistory} onClose={() => setShowProbeHistory(false)} logs={neuralLogs} onClearFiltered={(ids) => setNeuralLogs(prev => prev.filter(l => !ids.includes(l.id)))} />

      <style>{`
        .glow-segment { filter: drop-shadow(0 0 5px currentColor); }
        .glow-orange { box-shadow: 0 0 10px rgba(249, 115, 22, 0.4); }

        .shimmer-glow {
          animation: core-shimmer 3s infinite alternate ease-in-out;
        }
        @keyframes core-shimmer {
          0% { filter: brightness(1) drop-shadow(0 0 5px currentColor); }
          100% { filter: brightness(1.3) drop-shadow(0 0 20px currentColor); }
        }

        .spark-particle {
          position: absolute;
          width: 3px;
          height: 3px;
          border-radius: 50%;
          background: currentColor;
          opacity: 0;
          top: 50%;
          left: 50%;
        }
        .s-1 { animation: spark-fly-1 2.5s infinite; }
        .s-2 { animation: spark-fly-2 3s infinite 0.7s; }
        .s-3 { animation: spark-fly-3 2s infinite 1.4s; }
        .s-4 { animation: spark-fly-4 2.8s infinite 0.3s; }

        @keyframes spark-fly-1 {
          0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
          20% { opacity: 1; }
          100% { transform: translate(15px, -25px) scale(0.5); opacity: 0; }
        }
        @keyframes spark-fly-2 {
          0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
          20% { opacity: 1; }
          100% { transform: translate(-20px, -20px) scale(0.5); opacity: 0; }
        }
        @keyframes spark-fly-3 {
          0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
          20% { opacity: 1; }
          100% { transform: translate(25px, 15px) scale(0.5); opacity: 0; }
        }
        @keyframes spark-fly-4 {
          0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
          20% { opacity: 1; }
          100% { transform: translate(-15px, 20px) scale(0.5); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default App;
