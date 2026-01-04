
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { CoreStats, Platform, SensorArrayConfig, SensorNodeConfig, AppSettings, ScriptState, ScanResult, AnomalyStatus, LogLevel, Consumable } from '../types';
import Tooltip from './common/Tooltip';
import { HistoryStorage } from '../services/historyStorage';
import Modal from './common/Modal';
import { sensorService } from '../services/sensorService';
import { launcherSystem } from '../services/launcherService';
import { serverService } from '../services/serverService';
import TacticalButton from './common/TacticalButton';

interface ScannerPanelProps {
  stats: CoreStats | null;
  platform: Platform;
  allowDistortion?: boolean;
  settings?: AppSettings;
  onLauncherSelect?: (panelId: string, type: 'low' | 'probe' | 'sensor' | 'buffer') => void;
  onNeuralProbe?: (panelId: string, data: any) => void;
  onBrainClick?: (id: string, type: string, metrics: any) => void;
  isProcessing?: boolean;
  externalTrigger?: number; 
}

const ScannerPanel: React.FC<ScannerPanelProps> = ({ 
  stats, platform, allowDistortion, settings, onLauncherSelect, onNeuralProbe, onBrainClick, isProcessing, externalTrigger 
}) => {
  const [availableArrays, setAvailableArrays] = useState<SensorArrayConfig[]>([]);
  const [results, setResults] = useState<Record<string, ScanResult>>({});
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0); 
  const [completedNodes, setCompletedNodes] = useState(0);
  const [repeatTimeRemaining, setRepeatTimeRemaining] = useState<number | null>(null);
  
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedResult, setSelectedResult] = useState<ScanResult | null>(null);
  const [historyEntries, setHistoryEntries] = useState<{timestamp: number, values: string[]}[]>([]);

  // Script Inspection States
  const [inspectedNode, setInspectedNode] = useState<SensorNodeConfig | null>(null);
  const [showScriptModal, setShowScriptModal] = useState(false);

  const isOffline = !stats;

  const panelSlots = settings?.panelSlots?.['SENSOR_PANEL'];
  const sensorSlotConfig = panelSlots?.sensorSlot;
  const sensorLauncherId = sensorSlotConfig?.launcherId;
  const sensorModule = sensorLauncherId ? launcherSystem.getById(sensorLauncherId) : null;
  const scannerCooldownRemaining = sensorLauncherId ? serverService.getCooldown(sensorLauncherId) : 0;

  const bufferSlotConfig = panelSlots?.bufferSlot;
  const bufferLauncherId = bufferSlotConfig?.launcherId;
  const bufferModule = bufferLauncherId ? launcherSystem.getById(bufferLauncherId) : null;
  const bufferCooldownRemaining = bufferLauncherId ? serverService.getCooldown(bufferLauncherId) : 0;

  const probeSlotConfig = panelSlots?.probeSlot;
  const probeLauncherId = probeSlotConfig?.launcherId;
  const probeCooldownRemaining = probeLauncherId ? serverService.getCooldown(probeLauncherId) : 0;

  const lowSlotConfig = settings?.globalLowSlot;
  const lowLauncherId = lowSlotConfig?.launcherId;
  const lowCooldownRemaining = lowLauncherId ? serverService.getCooldown(lowLauncherId) : 0;
  
  const activeAmmo = useMemo(() => {
    const ammoId = sensorSlotConfig?.ammoId;
    if (!ammoId) return null;
    const ammo = launcherSystem.getConsumableById(ammoId);
    if (ammo && ammo.compatibleLaunchers.includes('sensor-module')) {
      return ammo;
    }
    return null;
  }, [sensorSlotConfig?.ammoId]);

  const activeBufferAmmo = useMemo(() => {
    const ammoId = bufferSlotConfig?.ammoId;
    if (!ammoId) return null;
    const ammo = launcherSystem.getConsumableById(ammoId);
    if (ammo && ammo.compatibleLaunchers.includes('buffer-module')) {
        return ammo;
    }
    return null;
  }, [bufferSlotConfig?.ammoId]);

  const isSystemScript = activeAmmo?.type === 'module-core' && !activeAmmo?.isNeuralIntegration && !activeAmmo?.autoInterval;
  const isAutomaticScript = !!activeAmmo?.autoInterval;

  const activeArray = useMemo(() => {
    if (!availableArrays.length) return null;
    if (sensorModule && sensorModule.compatibleProbes[0]) {
        return availableArrays.find(a => a.id === sensorModule.compatibleProbes[0]) || availableArrays[0];
    }
    return availableArrays.find(a => a.id === 'STD_SYS_SCANNER') || availableArrays[0];
  }, [sensorModule, availableArrays]);

  const currentScriptState = useMemo(() => {
    if (!settings) return { state: ScriptState.DISABLED, reason: 'System link uninitialized.' };
    if (!sensorLauncherId) return { state: ScriptState.DISABLED, reason: 'Sensor Port Offline: Module required.' };
    if (!activeAmmo) return { state: ScriptState.DISABLED, reason: 'Awaiting Script: No valid sequence loaded.' };
    return serverService.getScriptState('SENSOR_PANEL', settings, 'sensor');
  }, [settings, sensorLauncherId, activeAmmo, scannerCooldownRemaining, serverService.isHalted(sensorLauncherId || '')]);

  const currentBufferState = useMemo(() => {
    if (!settings) return { state: ScriptState.DISABLED, reason: 'System link uninitialized.' };
    if (!bufferLauncherId) return { state: ScriptState.DISABLED, reason: 'Buffer Port Offline: Module required.' };
    if (!activeBufferAmmo) return { state: ScriptState.DISABLED, reason: 'Awaiting Buffer: No script loaded.' };
    return serverService.getScriptState('SENSOR_PANEL', settings, 'buffer');
  }, [settings, bufferLauncherId, activeBufferAmmo, bufferCooldownRemaining, serverService.isHalted(bufferLauncherId || '')]);

  useEffect(() => {
    const arrays = sensorService.getAvailableArrays();
    setAvailableArrays(arrays);
    refreshHistory();
  }, []);

  const refreshHistory = () => {
    setHistoryEntries(HistoryStorage.getEntries('SCANNER_HISTORY'));
  };

  const analyzeSensor = async (sensor: SensorNodeConfig): Promise<Omit<ScanResult, 'x' | 'y'>> => {
    const latency = Math.max(200, sensor.timeout * 0.4 + (Math.random() * 400)); 
    await new Promise(r => setTimeout(r, latency));

    const ts = new Date().toLocaleTimeString();
    const sourceSystem = `${platform} (${stats?.source || 'UNKNOWN'})`;
    
    if (!stats) {
      if (sensor.id === 'BASIC_NODE') {
          return { sensorId: sensor.id, status: 'NO_DATA', description: 'Ping Failed', details: 'Target Unreachable', timestamp: ts, sourceSystem, viewed: false };
      }
      return { sensorId: sensor.id, status: 'ERROR', description: 'Source Offline', details: sensor.noDataDefinition, timestamp: ts, sourceSystem, viewed: false };
    }

    if (sensor.id === 'BASIC_NODE') {
        return { sensorId: sensor.id, status: 'MINOR', description: 'Ping Success', details: 'Latency < 1ms', timestamp: ts, sourceSystem, viewed: false };
    }

    if (sensor.type === 'NETWORK') {
        const netLoad = (stats.network?.inRateKB || 0) + (stats.network?.outRateKB || 0);
        const ifaces = Object.keys(stats.network?.interfaces || {}).length;
        if (sensor.id === 'NET_IFACE' && ifaces > 3) return { sensorId: sensor.id, status: 'POSITIVE', description: 'Multi-Homed', details: `${ifaces} active interfaces`, timestamp: ts, sourceSystem, viewed: false };
        if (netLoad > sensor.sensitivity * 10) return { sensorId: sensor.id, status: 'POSITIVE', description: 'Traffic Surge', details: `Net load > ${sensor.sensitivity}`, timestamp: ts, sourceSystem, viewed: false };
        return { sensorId: sensor.id, status: 'MINOR', description: 'Network Stable', details: 'Traffic within bounds.', timestamp: ts, sourceSystem, viewed: false };
    }
    
    if (sensor.type === 'SYSTEM') {
        const load = stats.cpu?.usage || 0;
        const temp = stats.sensors?.cpu_thermal_temp1 || 0;
        if (sensor.id === 'THERMAL_EVT' && temp > 80) return { sensorId: sensor.id, status: 'POSITIVE', description: 'Thermal Spike', details: `${temp}°C`, timestamp: ts, sourceSystem, viewed: false };
        if (load > sensor.sensitivity) return { sensorId: sensor.id, status: 'POSITIVE', description: 'System Stress', details: `Load > ${sensor.sensitivity}%`, timestamp: ts, sourceSystem, viewed: false };
        return { sensorId: sensor.id, status: 'MINOR', description: 'System Nominal', details: 'Load within bounds.', timestamp: ts, sourceSystem, viewed: false };
    }

    return { sensorId: sensor.id, status: 'UNKNOWN', description: 'Generic Node', details: 'No specific heuristics.', timestamp: ts, sourceSystem, viewed: false };
  };

  const handleScan = useCallback(async (isAuto = false) => {
    if (isScanning || !activeArray || currentScriptState.state === ScriptState.DISABLED || currentScriptState.state === ScriptState.HALTED) return;

    setIsScanning(true);
    setScanProgress(0);
    setCompletedNodes(0);

    const isIncremental = activeAmmo?.repeatMode === 'INCREMENTAL';
    
    const allEnabledNodes = activeArray.nodes.filter(n => n.enabled);
    let targetNodes = allEnabledNodes;

    if (isAuto && isIncremental) {
        targetNodes = allEnabledNodes.filter(node => {
            const existing = results[node.id];
            return !existing || existing.viewed === false;
        });
    }

    if (targetNodes.length === 0) {
        setIsScanning(false);
        if (isAuto && activeAmmo?.autoInterval) {
            setRepeatTimeRemaining(activeAmmo.autoInterval);
        }
        return;
    }

    const total = targetNodes.length;
    const isParallel = activeArray.settings.executionMode === 'PARALLEL';
    const sessionSummaryResults: Record<string, any> = {};
    let wasStopped = false;

    const finalizeNodeResult = (sensor: SensorNodeConfig, res: Omit<ScanResult, 'x' | 'y'>) => {
        setResults(prev => ({ ...prev, [sensor.id]: { ...res, x: sensor.x, y: sensor.y } }));
    };

    if (isParallel) {
       await Promise.all(targetNodes.map(async (sensor) => {
          if (serverService.isHalted(sensorLauncherId || '')) { wasStopped = true; return; }
          const res = await analyzeSensor(sensor);
          finalizeNodeResult(sensor, res);
          sessionSummaryResults[sensor.name] = res.status;
          setCompletedNodes(prev => { const next = prev + 1; setScanProgress((next / total) * 100); return next; });
       }));
    } else {
       for (const sensor of targetNodes) {
          if (serverService.isHalted(sensorLauncherId || '')) {
              wasStopped = true;
              break;
          }
          const res = await analyzeSensor(sensor);
          finalizeNodeResult(sensor, res);
          sessionSummaryResults[sensor.name] = res.status;
          setCompletedNodes(prev => { const next = prev + 1; setScanProgress((next / total) * 100); return next; });
       }
    }

    if (wasStopped) {
        HistoryStorage.append('SCANNER_HISTORY', 'TIMESTAMP,SENSORS,SUMMARY', [new Date().toLocaleTimeString(), `ABORTED`, `EXECUTION_HALTED_BY_OPERATOR`]);
    } else {
        if ((sensorModule?.isExtended || activeAmmo?.isNeuralIntegration) && onNeuralProbe) {
            onNeuralProbe('SENSOR_PANEL', { results: sessionSummaryResults });
        }

        const logSummary = Object.entries(sessionSummaryResults).map(([k,v]) => `${k}: ${v}`).join(' | ');
        HistoryStorage.append('SCANNER_HISTORY', 'TIMESTAMP,SENSORS,SUMMARY', [new Date().toLocaleTimeString(), `${total} Nodes`, `SCAN_SEQ: ${logSummary || 'NOMINAL'}`]);
    }

    refreshHistory();
    setIsScanning(false);
    
    if (!serverService.isHalted(sensorLauncherId || '')) {
        if (isAuto && activeAmmo?.autoInterval) {
            setRepeatTimeRemaining(activeAmmo.autoInterval);
        }
    }

    if (sensorLauncherId && !isAuto && !wasStopped) {
        serverService.triggerCooldown(sensorLauncherId, sensorModule?.baseCooldown || 60000);
    }
  }, [isScanning, activeArray, activeAmmo, sensorModule, sensorLauncherId, currentScriptState, onNeuralProbe, platform, stats, results]);

  const toggleStop = () => {
    if (sensorLauncherId) {
        serverService.toggleHalt(sensorLauncherId);
        if (serverService.isHalted(sensorLauncherId)) {
            setRepeatTimeRemaining(null);
        }
    }
  };

  const handleTriggerClick = () => {
      const isHalted = serverService.isHalted(sensorLauncherId || '');
      if (isScanning || (isAutomaticScript && !isHalted && repeatTimeRemaining !== null)) {
          toggleStop();
      } else if (isHalted) {
          toggleStop(); 
      } else {
          handleScan();
      }
  };

  const markAllViewed = () => {
    setResults(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(k => { next[k] = { ...next[k], viewed: true }; });
        return next;
    });
  };

  const markViewed = (id: string) => {
    setResults(prev => {
        if (!prev[id]) return prev;
        return { ...prev, [id]: { ...prev[id], viewed: true } };
    });
  };

  const handleInspectNode = (e: React.MouseEvent, node: SensorNodeConfig) => {
    e.stopPropagation();
    setInspectedNode(node);
    setShowScriptModal(true);
  };

  useEffect(() => {
    if (repeatTimeRemaining === null || repeatTimeRemaining <= 0 || serverService.isHalted(sensorLauncherId || '')) return;
    const timer = setInterval(() => {
        setRepeatTimeRemaining(prev => {
            if (prev === null || prev <= 1000) return null;
            return prev - 1000;
        });
    }, 1000);
    return () => clearInterval(timer);
  }, [repeatTimeRemaining, sensorLauncherId]);

  useEffect(() => {
    if (isScanning || currentScriptState.state !== ScriptState.LOADED || !isAutomaticScript) return;
    if (repeatTimeRemaining === null && !serverService.isHalted(sensorLauncherId || '')) {
        handleScan(true);
    }
  }, [isScanning, currentScriptState.state, isAutomaticScript, repeatTimeRemaining, handleScan, sensorLauncherId]);

  useEffect(() => {
    if (externalTrigger && externalTrigger > 0) {
        handleScan(true);
    }
  }, [externalTrigger, handleScan]);

  const getStatusColor = (status: AnomalyStatus) => {
    switch (status) {
      case 'POSITIVE': return '#22c55e';
      case 'MINOR': return '#eab308';
      case 'NO_DATA': return '#52525b';
      case 'UNKNOWN': return '#3b82f6';
      case 'RARE': return '#a855f7';
      case 'ERROR': return '#ff3e3e';
      default: return '#52525b';
    }
  };

  const getScriptStateStyle = (state: ScriptState, type: 'sensor' | 'buffer') => {
    switch (state) {
      case ScriptState.LOADED: return type === 'sensor' ? 'border-orange-400/50 bg-orange-500/10' : 'border-blue-400/50 bg-blue-500/10';
      case ScriptState.DISABLED: return 'border-zinc-800 bg-black opacity-60';
      case ScriptState.REFRESHING: return type === 'sensor' ? 'border-orange-500/30 bg-orange-500/5' : 'border-blue-500/30 bg-blue-500/5';
      case ScriptState.BROKEN: return 'border-red-500/50 bg-red-950/20 animate-pulse';
      case ScriptState.HALTED: return 'border-zinc-700 bg-zinc-900/40 opacity-50 grayscale';
      default: return 'border-zinc-800 bg-black opacity-60';
    }
  };

  if (!activeArray) return <div className="p-10 text-center text-zinc-500 font-mono text-[10px] animate-pulse">AWAITING_SENSOR_MODULES...</div>;

  const canScan = !!stats && (currentScriptState.state === ScriptState.LOADED || currentScriptState.state === ScriptState.HALTED || isScanning);
  const globalLowSlot = settings?.globalLowSlot;
  const lowSlotLauncherId = globalLowSlot?.launcherId;
  const lowSlotCharges = lowSlotLauncherId ? serverService.getCharges(lowSlotLauncherId) : 0;
  const lowSlotPermissions = settings?.slotPermissions?.['SENSOR_PANEL']?.low !== false;
  const probePermissions = settings?.slotPermissions?.['SENSOR_PANEL']?.probe !== false;

  const hudColor = isScanning ? '#14b8a6' : (stats ? (currentScriptState.state === ScriptState.HALTED ? '#52525b' : '#00ffd5') : '#52525b');
  const isHalted = currentScriptState.state === ScriptState.HALTED;

  return (
    <div className="flex flex-col-reverse md:flex-row h-full w-full bg-[#020406] overflow-hidden relative">
      <div className="relative flex-1 h-full md:h-auto flex flex-col items-center justify-center overflow-hidden bg-black/20 shrink-0">
         <div className="absolute top-0 left-0 w-full p-4 z-20 flex justify-between items-center bg-gradient-to-b from-black/90 to-transparent pointer-events-auto">
            <div className="flex items-center gap-3">
               <div className={`w-2 h-2 rounded-full shadow-lg ${isScanning ? 'bg-teal-500 animate-pulse shadow-teal-500/50' : (isHalted ? 'bg-zinc-600' : 'bg-zinc-800')}`}></div>
               <div className="flex flex-col">
                  <span className="text-[10px] font-black text-zinc-700 uppercase tracking-widest shadow-black drop-shadow-md">EM_FIELD_INTERCEPT</span>
                  <span className={`text-[8px] font-mono uppercase tracking-widest ${sensorModule?.isExtended ? 'text-orange-500' : 'text-teal-600'}`}>
                    {activeArray.name} {sensorModule?.isExtended && '[EXTENDED_CORE]'}
                  </span>
               </div>
            </div>
            <div className="flex gap-2">
                <button onClick={() => setResults({})} className="px-4 py-1.5 border border-zinc-800 bg-black/60 text-[9px] font-black text-zinc-400 hover:text-red-400 hover:border-red-500/50 hover:bg-red-500/10 transition-all uppercase tracking-widest backdrop-blur-md">PURGE</button>
                <button onClick={markAllViewed} className="px-4 py-1.5 border border-zinc-800 bg-black/60 text-[9px] font-black text-zinc-400 hover:text-teal-400 hover:border-teal-500/50 hover:bg-teal-500/10 transition-all uppercase tracking-widest backdrop-blur-md">MARK_VIEWED</button>
            </div>
         </div>
         
         <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,rgba(0,255,213,0.05),transparent_70%)]"></div>
            <div className="w-[65%] aspect-square rounded-full border border-teal-900/20 opacity-30"></div>
            <div className="w-[45%] aspect-square rounded-full border border-teal-900/20 opacity-30"></div>
            <div className="w-[25%] aspect-square rounded-full border border-teal-900/20 opacity-30"></div>
            <div className="absolute w-full h-[1px] bg-teal-900/10"></div>
            <div className="absolute h-full w-[1px] bg-teal-900/10"></div>
            {!isOffline && !isHalted && <div className="absolute w-[80%] aspect-square rounded-full animate-[spin_8s_linear_infinite] opacity-5" style={{ background: `conic-gradient(from 0deg, transparent 0deg, transparent 270deg, ${hudColor} 360deg)` }}></div>}
         </div>

         <div className="relative z-10 pointer-events-auto">
            <Tooltip name="SCANNER_CORE" source="SYSTEM" desc={isScanning || (isAutomaticScript && !isHalted && repeatTimeRemaining !== null) ? "Click to stop this script execution." : (isHalted ? "Click to resume this script execution." : currentScriptState.reason || "Initiate manual sensor array intercept.")}>
                <button
                onClick={handleTriggerClick}
                disabled={!canScan && !isHalted}
                className={`w-28 h-28 rounded-full border-2 flex flex-col items-center justify-center transition-all duration-500 ${isScanning || isProcessing ? 'scale-95 opacity-90 border-teal-500/50' : 'hover:scale-105 active:scale-95 hover:border-teal-500/50'} ${!canScan && !isHalted ? 'grayscale cursor-not-allowed opacity-30' : 'cursor-pointer'} bg-black/80 backdrop-blur-sm ${isHalted ? 'border-zinc-700 opacity-60' : ''}`}
                style={{ borderColor: isScanning || isProcessing ? hudColor : (isHalted ? '#3f3f46' : '#27272a'), boxShadow: isScanning || isProcessing ? `0 0 30px ${hudColor}22` : 'none' }}
                >
                <div className="text-[9px] font-black uppercase tracking-widest mb-1 transition-colors" style={{ color: isScanning || isProcessing ? hudColor : (isHalted ? '#71717a' : '#71717a') }}>
                    {isProcessing ? 'NEURAL_SYNC' : (isScanning ? 'STOP' : (isHalted ? 'RESUME' : (scannerCooldownRemaining > 0 ? 'RELOADING' : (!stats ? 'OFFLINE' : (isAutomaticScript ? 'AUTO_SCAN' : 'MANUAL_INIT')))))}
                </div>
                <div className="text-[8px] text-zinc-600 font-mono uppercase">
                    {isScanning ? `${Math.round(scanProgress)}%` : (isHalted ? 'STOPPED' : (scannerCooldownRemaining > 0 ? `${(scannerCooldownRemaining/1000).toFixed(0)}s` : (isAutomaticScript && repeatTimeRemaining !== null ? `${(repeatTimeRemaining/1000).toFixed(0)}s` : 'READY')))}
                </div>
                {(isScanning || isProcessing) && <div className="absolute inset-[-4px] border-t-2 border-b-2 rounded-full animate-spin opacity-50" style={{ borderColor: hudColor }}></div>}
                </button>
            </Tooltip>
         </div>

         <div className="absolute inset-0 z-10 pointer-events-none">
            {(Object.values(results) as ScanResult[]).map((res) => {
              const color = getStatusColor(res.status);
              const sensorName = activeArray.nodes.find(s => s.id === res.sensorId)?.name || res.sensorId;
              return (
                <div 
                  key={res.sensorId}
                  className="absolute pointer-events-auto flex flex-col items-center justify-center group transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                  style={{ left: `${res.x}%`, top: `${res.y}%` }}
                  onClick={() => { setSelectedResult(res); markViewed(res.sensorId); }}
                >
                  <Tooltip name={sensorName} source="SENSOR_GRID" desc={`${res.description}\n${res.details}\n\n[STATUS]: ${res.viewed ? 'VIEWED' : 'UNREAD'}`} variant={res.status === 'POSITIVE' ? 'teal' : 'default'}>
                    <div className="relative">
                        <div className={`w-3 h-3 rounded-full border shadow-sm transition-all duration-500 group-hover:scale-150 ${res.status === 'POSITIVE' ? 'animate-pulse' : ''} ${!res.viewed ? 'border-white' : ''}`} style={{ backgroundColor: color, borderColor: res.viewed ? color : 'white', boxShadow: `0 0 10px ${color}66` }}></div>
                        {!res.viewed && (res.status === 'POSITIVE' || res.status === 'RARE') && <div className="absolute inset-[-8px] rounded-full border border-white opacity-50 animate-ping"></div>}
                    </div>
                  </Tooltip>
                </div>
              );
            })}
         </div>
      </div>

      <div className="w-full md:w-80 h-auto md:h-full bg-[#050608] border-b md:border-b-0 md:border-l border-zinc-900 flex flex-col z-30 shadow-2xl overflow-hidden shrink-0">
         <div className="p-4 border-b border-zinc-900 bg-zinc-950/40 flex flex-col gap-4">
            <div className="flex justify-between items-center px-1">
                <span className="text-[9px] font-black text-zinc-700 uppercase tracking-widest">Hardware_Manifold</span>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
                {/* Redesigned Ports - Low & Probe grouped together for cohesive look */}
                <div className="grid grid-cols-2 gap-3">
                   {/* Low Tier Port */}
                   <div className="flex flex-col gap-1.5 p-3 border border-zinc-900/50 bg-black/40 rounded-sm relative group transition-all hover:border-zinc-700">
                       <div className="flex justify-between items-start">
                          <Tooltip name="LOW_TIER_PORT" source="SYSTEM" desc="Global Neural Inference Interface." variant="teal">
                             <div 
                                className="w-8 h-8 border border-zinc-800 bg-zinc-950 flex items-center justify-center cursor-pointer transition-all hover:border-teal-500/40 group"
                                onClick={() => onLauncherSelect?.('SENSOR_PANEL', 'low')}
                             >
                                <div className={`w-1.5 h-1.5 rounded-full ${lowSlotPermissions ? 'bg-[#00ffd5] shadow-[0_0_8px_#00ffd5]' : 'bg-zinc-800'}`}></div>
                             </div>
                          </Tooltip>
                          <div className="flex flex-col items-end">
                             <span className="text-[8px] font-black text-zinc-500 uppercase tracking-tighter">PORT_L01</span>
                             {lowSlotPermissions && lowSlotLauncherId && <span className="text-[6px] font-mono text-zinc-700 uppercase">CHG: {lowSlotCharges}</span>}
                          </div>
                       </div>
                       <TacticalButton 
                           label="FIRE" 
                           size="sm" 
                           color="#00ffd5" 
                           onClick={() => onBrainClick?.('SENSOR_PANEL', 'Contextual Scan Audit', { activeArray: activeArray.name, results })}
                           disabled={!lowSlotPermissions || isProcessing || lowCooldownRemaining > 0}
                           cooldown={lowCooldownRemaining}
                           className="w-full mt-1"
                        />
                   </div>

                   {/* Probe Port */}
                   <div className="flex flex-col gap-1.5 p-3 border border-zinc-900/50 bg-black/40 rounded-sm relative group transition-all hover:border-zinc-700">
                       <div className="flex justify-between items-start">
                          <Tooltip name="PROBE_PORT" source="SYSTEM" desc="Data Core Probe Interface." variant="purple">
                             <div 
                                className="w-8 h-8 border border-zinc-800 bg-zinc-950 flex items-center justify-center cursor-pointer transition-all hover:border-purple-500/40 group"
                                onClick={() => !isProcessing && onLauncherSelect?.('SENSOR_PANEL', 'probe')}
                             >
                                <div className={`w-1.5 h-1.5 rounded-full bg-[#bd00ff] shadow-[0_0_8px_#bd00ff]`}></div>
                             </div>
                          </Tooltip>
                          <div className="flex flex-col items-end">
                             <span className="text-[8px] font-black text-zinc-500 uppercase tracking-tighter">PORT_P01</span>
                             <span className="text-[6px] font-mono text-zinc-700 uppercase">SYNC: RDY</span>
                          </div>
                       </div>
                       <TacticalButton 
                           label="PROBE" 
                           size="sm" 
                           color="#bd00ff" 
                           onClick={() => onNeuralProbe?.('SENSOR_PANEL', { results })}
                           disabled={!probePermissions || isProcessing || probeCooldownRemaining > 0}
                           cooldown={probeCooldownRemaining}
                           className="w-full mt-1"
                        />
                   </div>
                </div>

                {/* Hardware Scripts Ports - Sensor & Buffer */}
                <div className="grid grid-cols-2 gap-3">
                    {/* Sensor Port */}
                    <Tooltip name="SENSOR_PORT" source="SYSTEM" desc={currentScriptState.reason || (sensorModule ? `${sensorModule.name}` : "Sensor Port.")}>
                        <div 
                            onClick={() => !isProcessing && onLauncherSelect?.('SENSOR_PANEL', 'sensor')}
                            className={`h-14 border flex flex-col items-center justify-center transition-all cursor-pointer relative overflow-hidden p-2 rounded-sm ${getScriptStateStyle(currentScriptState.state, 'sensor')} ${isProcessing ? 'opacity-20 cursor-not-allowed' : ''}`}
                        >
                            <span className="text-[6px] font-black text-zinc-600 uppercase absolute top-1 left-2 tracking-tighter">HW_SENSOR</span>
                            {sensorModule ? (
                                <svg className={`w-5 h-5 ${currentScriptState.state === ScriptState.BROKEN ? 'text-red-500 animate-bounce' : (isHalted ? 'text-zinc-600' : 'text-[#f97316] animate-pulse')}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                            ) : (
                                <span className="text-[7px] font-black text-zinc-800 uppercase tracking-tighter leading-none text-center">OFFLINE</span>
                            )}
                        </div>
                    </Tooltip>
                    {/* Buffer Port */}
                    <Tooltip name="BUFFER_PORT" source="SYSTEM" desc={currentBufferState.reason || (bufferModule ? `${bufferModule.name}` : "Buffer Port.")}>
                        <div 
                            onClick={() => !isProcessing && onLauncherSelect?.('SENSOR_PANEL', 'buffer')}
                            className={`h-14 border flex flex-col items-center justify-center transition-all cursor-pointer relative overflow-hidden p-2 rounded-sm ${getScriptStateStyle(currentBufferState.state, 'buffer')} ${isProcessing ? 'opacity-20 cursor-not-allowed' : ''}`}
                        >
                            <span className="text-[6px] font-black text-zinc-600 uppercase absolute top-1 left-2 tracking-tighter">HW_BUFFER</span>
                            {bufferModule ? (
                                <svg className={`w-5 h-5 ${currentBufferState.state === ScriptState.BROKEN ? 'text-red-500 animate-bounce' : (serverService.isHalted(bufferLauncherId || '') ? 'text-zinc-600' : 'text-[#3b82f6] animate-pulse')}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                            ) : (
                                <span className="text-[7px] font-black text-zinc-800 uppercase tracking-tighter leading-none text-center">OFFLINE</span>
                            )}
                        </div>
                    </Tooltip>
                </div>
            </div>
         </div>

         <div className="p-4 border-b border-zinc-900 bg-zinc-950/80 flex flex-col gap-3 shrink-0">
            <div className="flex justify-between items-center">
                <h3 className="text-[10px] font-black text-teal-500 uppercase tracking-widest">Active_Profile</h3>
                <span className={`text-[7px] font-black px-1 border uppercase tracking-tighter ${isHalted ? 'text-zinc-500 border-zinc-800' : (isSystemScript ? 'text-yellow-400 border-yellow-900/50 bg-yellow-950/40' : (isAutomaticScript ? 'text-green-400 border-green-900/50 bg-green-950/40' : 'text-zinc-600 border-zinc-900'))}`}>
                   {isHalted ? 'HALTED_STATE' : (isSystemScript ? 'Manual_Execution' : (isAutomaticScript ? `${activeAmmo?.repeatMode}_Repeat` : 'Awaiting_Script'))}
                </span>
            </div>
            <div 
                className={`bg-black/60 border border-zinc-800 p-3 text-[10px] font-mono uppercase tracking-widest flex justify-between items-center transition-all group ${isProcessing ? 'opacity-20 cursor-not-allowed' : 'cursor-pointer hover:border-teal-500/50'}`}
                onClick={() => !isProcessing && onLauncherSelect?.('SENSOR_PANEL', 'sensor')}
            >
                <span className={`group-hover:text-white transition-colors ${isHalted ? 'text-zinc-600' : 'text-teal-400'}`}>{activeArray?.name || 'NULL_PROFILE'}</span>
                {isAutomaticScript && !isHalted && repeatTimeRemaining !== null && (
                    <span className="text-[8px] text-green-500 font-mono animate-pulse">{(repeatTimeRemaining/1000).toFixed(0)}s</span>
                )}
                {isHalted && (
                    <span className="text-[7px] text-zinc-600 font-black">STOPPED</span>
                )}
            </div>
         </div>

         <div className="flex-1 overflow-y-auto p-0 space-y-0.5 no-scroll max-h-[30vh] md:max-h-full bg-black/40">
            {activeArray?.nodes.map(s => {
               const res = results[s.id];
               const color = res ? getStatusColor(res.status) : (s.enabled ? '#3f3f46' : '#18181b'); 
               return (
                 <div key={s.id} onClick={() => res && markViewed(s.id)} className="p-3 border-b border-zinc-900/40 hover:bg-zinc-900/30 transition-all flex flex-col gap-2 group relative overflow-hidden cursor-pointer">
                    <div className="flex justify-between items-center z-10">
                        <div className="flex flex-col">
                           <span className={`text-[9px] font-black uppercase tracking-wider transition-colors ${s.enabled ? (isHalted ? 'text-zinc-600' : 'text-zinc-400 group-hover:text-zinc-200') : 'text-zinc-800'}`}>{s.name}</span>
                           <div className="flex items-center gap-2 mt-0.5">
                             <span className="text-[7px] font-mono text-zinc-700 uppercase">{s.type}</span>
                             {res && !res.viewed && <span className="text-[6px] font-black text-white px-1 bg-red-600 animate-pulse">UNREAD</span>}
                           </div>
                        </div>
                        <div className="flex items-center gap-3">
                           <Tooltip name="INSPECT_SCRIPT" source="SYSTEM" desc="View the script assigned to this node.">
                             <button 
                               onClick={(e) => handleInspectNode(e, s)}
                               className="p-1 border border-zinc-800 bg-zinc-950 text-zinc-600 hover:text-teal-400 hover:border-teal-900 transition-all opacity-0 group-hover:opacity-100"
                             >
                               <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                             </button>
                           </Tooltip>
                           <div className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${res?.status === 'POSITIVE' && !isHalted ? 'animate-pulse' : ''}`} style={{ backgroundColor: s.enabled ? (res ? color : '#3f3f46') : '#18181b', boxShadow: res && !isHalted ? `0 0 5px ${color}` : 'none' }}></div>
                        </div>
                    </div>
                 </div>
               );
            })}
         </div>

         <div className="p-3 border-t border-zinc-900 bg-zinc-950/50 text-[8px] font-mono text-zinc-600 flex justify-between shrink-0">
            <span className="tracking-tighter">GRID_NODES: {activeArray?.nodes.filter(s => s.enabled).length || 0}/{activeArray?.nodes.length || 0}</span>
            <span className="tracking-tighter font-bold">UNREAD: {(Object.values(results) as ScanResult[]).filter(r => !r.viewed && r.status === 'POSITIVE').length}</span>
         </div>
      </div>

      <Modal isOpen={!!selectedResult} onClose={() => setSelectedResult(null)} title={`ANOMALY_DETAIL: ${selectedResult?.sensorId || 'UNKNOWN'}`} variant={selectedResult?.status === 'POSITIVE' ? 'green' : 'blue'}>
         {selectedResult && (
            <div className="space-y-6">
                <div className="flex justify-between items-start border-b border-zinc-900 pb-4">
                    <div className="flex flex-col gap-1">
                        <span className="text-[9px] text-zinc-500 font-black uppercase tracking-widest">Status_Indicator</span>
                        <span className="text-lg font-black uppercase tracking-tighter" style={{ color: getStatusColor(selectedResult.status) }}>{selectedResult.status}</span>
                    </div>
                    <div className="flex flex-col gap-1 text-right">
                        <span className="text-[9px] text-zinc-500 font-black uppercase tracking-widest">Timestamp</span>
                        <span className="text-[11px] text-zinc-300 font-mono">{selectedResult.timestamp}</span>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                        <span className="text-[9px] text-zinc-600 uppercase font-black">Description</span>
                        <p className="text-[11px] text-zinc-200 font-mono leading-relaxed bg-black/40 p-3 border border-zinc-900">{selectedResult.description}</p>
                    </div>
                    <div className="space-y-1">
                        <span className="text-[9px] text-zinc-600 uppercase font-black">Technical_Details</span>
                        <p className="text-[11px] text-teal-500 font-mono leading-relaxed bg-black/40 p-3 border border-zinc-900">{selectedResult.details}</p>
                    </div>
                </div>
            </div>
         )}
      </Modal>

      <Modal 
        isOpen={showScriptModal} 
        onClose={() => setShowScriptModal(false)} 
        title={`NODE_SCRIPT_AUDIT: ${inspectedNode?.id || 'UNDEFINED'}`} 
        variant="teal"
      >
         {inspectedNode && (
            <div className="space-y-6">
                <div className="p-4 bg-black/40 border border-zinc-900 rounded-sm">
                   <div className="flex justify-between items-center mb-4 border-b border-zinc-900 pb-2">
                      <span className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">Assigned_Execution_Carrier</span>
                      <span className={`text-[8px] font-black px-2 py-0.5 border rounded-sm ${activeAmmo ? 'border-teal-500/30 text-teal-500 bg-teal-950/20' : 'border-red-900/30 text-red-700 bg-red-950/20'}`}>
                         {activeAmmo ? 'CARRIER_ACTIVE' : 'CARRIER_VOID'}
                      </span>
                   </div>
                   
                   {!activeAmmo ? (
                      <div className="py-8 text-center">
                         <span className="text-[11px] text-red-500 font-mono uppercase tracking-[0.2em]">No script assigned to this sensor node.</span>
                      </div>
                   ) : (
                      <div className="grid grid-cols-2 gap-y-4 gap-x-8 font-mono text-[11px]">
                         <div className="flex flex-col gap-1">
                            <span className="text-[8px] text-zinc-600 font-black uppercase">Script Name</span>
                            <span className="text-zinc-200 font-bold uppercase">{activeAmmo.name}</span>
                         </div>
                         <div className="flex flex-col gap-1">
                            <span className="text-[8px] text-zinc-600 font-black uppercase">Execution Mode</span>
                            <span className="text-teal-500 uppercase">{activeAmmo.autoInterval ? 'REPEATING' : 'ONCE_MANUAL'}</span>
                         </div>
                         <div className="flex flex-col gap-1">
                            <span className="text-[8px] text-zinc-600 font-black uppercase">Script Type</span>
                            <span className="text-zinc-400 uppercase">{activeAmmo.type.replace('-', '_')}</span>
                         </div>
                         <div className="flex flex-col gap-1">
                            <span className="text-[8px] text-zinc-600 font-black uppercase">Repeat Interval</span>
                            <span className="text-zinc-400">{activeAmmo.autoInterval ? `${activeAmmo.autoInterval / 1000}s` : 'N/A'}</span>
                         </div>
                         <div className="flex flex-col gap-1">
                            <span className="text-[8px] text-zinc-600 font-black uppercase">Base Cooldown</span>
                            <span className="text-zinc-400">{sensorModule?.baseCooldown ? `${sensorModule.baseCooldown / 1000}s` : '0s'}</span>
                         </div>
                         <div className="flex flex-col gap-1">
                            <span className="text-[8px] text-zinc-600 font-black uppercase">Target Node ID</span>
                            <span className="text-teal-600 font-bold">{inspectedNode.id}</span>
                         </div>
                         <div className="col-span-2 flex flex-col gap-1 pt-2 border-t border-zinc-900 mt-2">
                            <span className="text-[8px] text-zinc-600 font-black uppercase">Script Description</span>
                            <p className="text-zinc-500 italic leading-relaxed">{activeAmmo.description}</p>
                         </div>
                      </div>
                   )}
                </div>
                <div className="bg-red-950/5 border border-red-900/10 p-3 rounded-sm">
                   <div className="flex items-center gap-2">
                      <svg className="w-3 h-3 text-red-900" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      <span className="text-[8px] font-black text-red-900 uppercase tracking-widest">Read_Only_Interface</span>
                   </div>
                   <p className="text-[9px] text-red-950 mt-1">Direct script mutation is disabled during active sensor polling. Modify via Hardware_Manifold.</p>
                </div>
            </div>
         )}
      </OverlayModal>

      <Modal isOpen={showHistoryModal} onClose={() => setShowHistoryModal(false)} title="SCANNER_HISTORY_ARCHIVE" variant="blue">
         <div className="space-y-4">
            <div className="overflow-y-auto max-h-[60vh] space-y-2 pr-2 no-scroll">
               {historyEntries.length > 0 ? historyEntries.map((entry, i) => (
                  <div key={i} className="p-3 border border-zinc-900 bg-black/60 flex flex-col gap-1 hover:border-zinc-700 transition-colors">
                     <div className="flex justify-between items-center text-[9px]">
                        <span className="text-zinc-600 font-mono">{new Date(entry.timestamp).toLocaleString()}</span>
                        <span className="text-zinc-700 font-black uppercase tracking-tighter">{entry.values[0]}</span>
                     </div>
                     <div className="text-[10px] font-black text-blue-400 uppercase tracking-wide">{entry.values[1]}</div>
                     <div className="text-[8px] text-zinc-600 mt-1 truncate opacity-60">{entry.values[2]}</div>
                  </div>
               )) : (
                 <div className="h-48 flex items-center justify-center border border-dashed border-zinc-900 opacity-20">
                    <span className="text-[10px] font-black uppercase tracking-[0.5em]">NO_LOG_DATA</span>
                 </div>
               )}
            </div>
         </div>
      </Modal>
    </div>
  );
};

export default ScannerPanel;

// Internal utility to wrap Modal for secondary dialogs if needed, 
// using the existing Modal component is preferred for consistency.
const OverlayModal = Modal;
