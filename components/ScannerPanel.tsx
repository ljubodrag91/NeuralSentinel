
import React, { useState, useEffect } from 'react';
import { CoreStats, Platform, SensorArrayConfig, SensorNodeConfig } from '../types';
import Tooltip from './common/Tooltip';
import { HistoryStorage } from '../services/historyStorage';
import Modal from './common/Modal';
import { sensorService } from '../services/sensorService';

interface ScannerPanelProps {
  stats: CoreStats | null;
  platform: Platform;
  allowDistortion?: boolean;
}

type AnomalyStatus = 'POSITIVE' | 'MINOR' | 'NO_DATA' | 'UNKNOWN' | 'RARE' | 'ERROR';

interface ScanResult {
  sensorId: string;
  status: AnomalyStatus;
  description: string;
  details: string;
  timestamp: string;
  x: number; // Calculated display X
  y: number; // Calculated display Y
  sourceSystem: string;
  rawData?: any;
}

const ScannerPanel: React.FC<ScannerPanelProps> = ({ stats, platform, allowDistortion }) => {
  // --- STATE ---
  const [availableArrays, setAvailableArrays] = useState<SensorArrayConfig[]>([]);
  const [activeArrayId, setActiveArrayId] = useState<string>('STD_SYS_SCANNER');
  
  // Safe accessor for active array
  const activeArray = availableArrays.find(a => a.id === activeArrayId) || availableArrays[0];

  const [results, setResults] = useState<Record<string, ScanResult>>({});
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0); 
  const [completedNodes, setCompletedNodes] = useState(0);
  
  // Modals
  const [showConfigModal, setShowConfigModal] = useState(false); 
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedResult, setSelectedResult] = useState<ScanResult | null>(null);
  const [historyEntries, setHistoryEntries] = useState<{timestamp: number, values: string[]}[]>([]);

  // Derived state to fix missing variables
  const isOffline = !stats;
  const hudColor = isScanning ? '#14b8a6' : (stats ? '#00ffd5' : '#52525b');

  // -- Initialization --
  useEffect(() => {
    const arrays = sensorService.getAvailableArrays();
    setAvailableArrays(arrays);
    // Default to Standard Scanner if current selection invalid
    if (!arrays.find(a => a.id === activeArrayId)) {
        setActiveArrayId('STD_SYS_SCANNER');
    }
  }, []);

  // -- Persistence --
  const refreshHistory = () => {
    setHistoryEntries(HistoryStorage.getEntries('SCANNER_HISTORY'));
  };

  useEffect(() => {
    refreshHistory();
  }, []);

  // -- LOGIC --

  const analyzeSensor = async (sensor: SensorNodeConfig): Promise<Omit<ScanResult, 'x' | 'y'>> => {
    const latency = Math.max(200, sensor.timeout * 0.5 + (Math.random() * 500)); 
    await new Promise(r => setTimeout(r, latency));

    const ts = new Date().toLocaleTimeString();
    const sourceSystem = `${platform} (${stats?.source || 'UNKNOWN'})`;
    
    if (!stats) {
      // Basic Node handles offline differently
      if (sensor.id === 'BASIC_NODE') {
          return { sensorId: sensor.id, status: 'NO_DATA', description: 'Ping Failed', details: 'Target Unreachable', timestamp: ts, sourceSystem };
      }
      return { sensorId: sensor.id, status: 'ERROR', description: 'Source Offline', details: sensor.noDataDefinition, timestamp: ts, sourceSystem };
    }

    // Dynamic Logic for Modular Nodes
    // Basic Node Check
    if (sensor.id === 'BASIC_NODE') {
        return { sensorId: sensor.id, status: 'MINOR', description: 'Ping Success', details: 'Latency < 1ms', timestamp: ts, sourceSystem };
    }

    // Logic for other types
    if (sensor.type === 'NETWORK') {
        const netLoad = (stats.network?.inRateKB || 0) + (stats.network?.outRateKB || 0);
        const ifaces = Object.keys(stats.network?.interfaces || {}).length;
        if (sensor.id === 'NET_IFACE' && ifaces > 3) return { sensorId: sensor.id, status: 'POSITIVE', description: 'Multi-Homed', details: `${ifaces} active interfaces`, timestamp: ts, sourceSystem };
        if (netLoad > sensor.sensitivity * 10) return { sensorId: sensor.id, status: 'POSITIVE', description: 'Traffic Surge', details: `Net load > ${sensor.sensitivity}`, timestamp: ts, sourceSystem };
        return { sensorId: sensor.id, status: 'MINOR', description: 'Network Stable', details: 'Traffic within bounds.', timestamp: ts, sourceSystem };
    }
    
    if (sensor.type === 'SYSTEM') {
        const load = stats.cpu?.usage || 0;
        const temp = stats.sensors?.cpu_thermal_temp1 || 0;
        if (sensor.id === 'THERMAL_EVT' && temp > 80) return { sensorId: sensor.id, status: 'POSITIVE', description: 'Thermal Spike', details: `${temp}°C`, timestamp: ts, sourceSystem };
        if (load > sensor.sensitivity) return { sensorId: sensor.id, status: 'POSITIVE', description: 'System Stress', details: `Load > ${sensor.sensitivity}%`, timestamp: ts, sourceSystem };
        return { sensorId: sensor.id, status: 'MINOR', description: 'System Nominal', details: 'Load within bounds.', timestamp: ts, sourceSystem };
    }

    // Fallback
    return { sensorId: sensor.id, status: 'UNKNOWN', description: 'Generic Node', details: 'No specific heuristics.', timestamp: ts, sourceSystem };
  };

  const handleScan = async () => {
    if (isScanning || !activeArray) return;
    
    setIsScanning(true);
    setResults({});
    setScanProgress(0);
    setCompletedNodes(0);
    
    const enabledSensors = activeArray.nodes.filter(s => s.enabled);
    const total = enabledSensors.length;
    
    const isParallel = activeArray.settings.executionMode === 'PARALLEL';
    const sessionResults: string[] = [];

    if (isParallel) {
       await Promise.all(enabledSensors.map(async (sensor) => {
          const res = await analyzeSensor(sensor);
          finalizeNodeResult(sensor, res);
          sessionResults.push(`${sensor.name}: ${res.status}`);
          setCompletedNodes(prev => { const next = prev + 1; setScanProgress((next / total) * 100); return next; });
       }));
    } else {
       for (const sensor of enabledSensors) {
          const res = await analyzeSensor(sensor);
          finalizeNodeResult(sensor, res);
          sessionResults.push(`${sensor.name}: ${res.status}`);
          setCompletedNodes(prev => { const next = prev + 1; setScanProgress((next / total) * 100); return next; });
       }
    }

    const summary = sessionResults.length > 0 ? sessionResults.join(' | ') : 'ALL_SYSTEMS_NOMINAL';
    HistoryStorage.append('SCANNER_HISTORY', 'TIMESTAMP,SENSORS,SUMMARY', [new Date().toLocaleTimeString(), `${enabledSensors.length} Nodes`, summary]);
    refreshHistory();
    setIsScanning(false);
  };

  const finalizeNodeResult = (sensor: SensorNodeConfig, res: Omit<ScanResult, 'x' | 'y'>) => {
      const jitterX = (Math.random() - 0.5) * 12; 
      const jitterY = (Math.random() - 0.5) * 12;
      const finalX = Math.max(10, Math.min(90, sensor.x + jitterX));
      const finalY = Math.max(10, Math.min(90, sensor.y + jitterY));

      setResults(prev => ({ ...prev, [sensor.id]: { ...res, x: finalX, y: finalY } }));
  };

  const handleClear = () => {
    setResults({});
    setScanProgress(0);
    setCompletedNodes(0);
  };

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

  // Safe render if arrays not loaded yet
  if (!activeArray) return <div className="p-10 text-center text-zinc-500">LOADING_SENSOR_MODULES...</div>;

  return (
    <div className={`flex flex-col-reverse md:flex-row h-full w-full bg-[#020406] overflow-hidden ${allowDistortion ? 'core-distortion' : ''}`}>
      
      {/* --- LEFT: RADAR VISUALIZATION (Flex Grow) --- */}
      {/* On mobile: this is bottom (flex-col-reverse) */}
      <div className="relative flex-1 h-full md:h-auto flex flex-col items-center justify-center overflow-hidden bg-black/20 shrink-0">
         
         <div className="absolute top-0 left-0 w-full p-4 z-20 flex justify-between items-center bg-gradient-to-b from-black/90 to-transparent pointer-events-auto">
            <div className="flex items-center gap-3">
               <div className={`w-2 h-2 rounded-full shadow-lg ${isScanning ? 'bg-teal-500 animate-pulse shadow-teal-500/50' : 'bg-zinc-800'}`}></div>
               <div className="flex flex-col">
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] shadow-black drop-shadow-md">EM_FIELD_INTERCEPT</span>
                  <span className="text-[8px] font-mono text-teal-600 uppercase tracking-widest">{activeArray.name}</span>
               </div>
            </div>
            <div className="flex gap-2">
                <button onClick={handleClear} className="px-4 py-1.5 border border-zinc-800 bg-black/60 text-[9px] font-black text-zinc-400 hover:text-red-400 hover:border-red-500/50 hover:bg-red-500/10 transition-all uppercase tracking-widest backdrop-blur-md">CLEAR</button>
                <button onClick={() => setShowHistoryModal(true)} className="px-4 py-1.5 border border-zinc-800 bg-black/60 text-[9px] font-black text-zinc-400 hover:text-blue-400 hover:border-blue-500/50 hover:bg-blue-500/10 transition-all uppercase tracking-widest backdrop-blur-md">HISTORY</button>
            </div>
         </div>

         {/* Radar Visuals */}
         <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,rgba(0,255,213,0.05),transparent_70%)]"></div>
            <div className="w-[65%] aspect-square rounded-full border border-teal-900/20 opacity-30"></div>
            <div className="w-[45%] aspect-square rounded-full border border-teal-900/20 opacity-30"></div>
            <div className="w-[25%] aspect-square rounded-full border border-teal-900/20 opacity-30"></div>
            <div className="absolute w-full h-[1px] bg-teal-900/10"></div>
            <div className="absolute h-full w-[1px] bg-teal-900/10"></div>
            {!isOffline && <div className="absolute w-[80%] aspect-square rounded-full animate-[spin_8s_linear_infinite] opacity-5" style={{ background: `conic-gradient(from 0deg, transparent 0deg, transparent 270deg, ${hudColor} 360deg)` }}></div>}
         </div>

         {/* Central Button */}
         <div className="relative z-10 pointer-events-auto">
            <button
              onClick={handleScan}
              disabled={isScanning || !stats}
              className={`w-28 h-28 rounded-full border-2 flex flex-col items-center justify-center transition-all duration-500 ${isScanning ? 'scale-95 opacity-90 border-teal-500/50' : 'hover:scale-105 active:scale-95 hover:border-teal-500/50'} ${!stats ? 'grayscale cursor-not-allowed opacity-30' : 'cursor-pointer'} bg-black/80 backdrop-blur-sm`}
              style={{ borderColor: isScanning ? hudColor : '#27272a', boxShadow: isScanning ? `0 0 30px ${hudColor}22` : 'none' }}
            >
              <div className="text-[9px] font-black uppercase tracking-widest mb-1 transition-colors" style={{ color: isScanning ? hudColor : '#71717a' }}>{isScanning ? 'SCANNING' : (!stats ? 'OFFLINE' : 'INIT_SCAN')}</div>
              <div className="text-[8px] text-zinc-600 font-mono uppercase">{isScanning ? `${Math.round(scanProgress)}%` : 'READY'}</div>
              {isScanning && <div className="absolute inset-[-4px] border-t-2 border-b-2 rounded-full animate-spin opacity-50" style={{ borderColor: hudColor }}></div>}
            </button>
         </div>

         {/* Results Overlay */}
         <div className="absolute inset-0 z-10 pointer-events-none">
            {(Object.values(results) as ScanResult[]).map((res) => {
              const color = getStatusColor(res.status);
              const sensorName = activeArray.nodes.find(s => s.id === res.sensorId)?.name || res.sensorId;
              return (
                <React.Fragment key={res.sensorId}>
                    <div 
                      className="absolute pointer-events-auto flex flex-col items-center justify-center group transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                      style={{ left: `${res.x}%`, top: `${res.y}%` }}
                      onClick={() => setSelectedResult(res)}
                    >
                      <Tooltip name={sensorName} source="SENSOR_GRID" desc={`${res.description}\n${res.details}`} variant={res.status === 'POSITIVE' ? 'green' : 'default'}>
                        <div className="relative">
                           <div className={`w-3 h-3 rounded-full border shadow-sm transition-all duration-500 group-hover:scale-150 ${res.status === 'POSITIVE' ? 'animate-pulse' : ''}`} style={{ backgroundColor: color, borderColor: color, boxShadow: `0 0 10px ${color}66` }}></div>
                           {(res.status === 'POSITIVE' || res.status === 'RARE') && <div className="absolute inset-[-8px] rounded-full border opacity-50 animate-ping" style={{ borderColor: color }}></div>}
                        </div>
                      </Tooltip>
                    </div>
                </React.Fragment>
              );
            })}
         </div>
      </div>

      {/* --- RIGHT: SENSOR ARRAY PANEL --- */}
      {/* On mobile: this is top (flex-col-reverse) */}
      <div className="w-full md:w-80 h-auto md:h-full bg-[#050608] border-b md:border-b-0 md:border-l border-zinc-900 flex flex-col z-30 shadow-[shadow:-10px_0_30px_rgba(0,0,0,0.5)] overflow-hidden shrink-0">
         <div className="p-4 border-b border-zinc-900 bg-zinc-950/80 flex flex-col gap-3 shrink-0">
            <div className="flex justify-between items-center">
                <h3 className="text-[10px] font-black text-teal-500 uppercase tracking-widest">Active_Sensor_Array</h3>
                <div className="w-1.5 h-1.5 bg-teal-500/50 rounded-full animate-pulse"></div>
            </div>
            <select value={activeArrayId} onChange={(e) => setActiveArrayId(e.target.value)} className="bg-black border border-zinc-800 text-[10px] text-zinc-300 font-mono p-1 uppercase outline-none focus:border-teal-500/50 w-full min-h-[44px]">
               {availableArrays.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            <div className="text-[8px] text-zinc-600 font-mono italic px-1">{activeArray.description}</div>
         </div>
         
         <div className="flex-1 overflow-y-auto p-0 space-y-0.5 no-scroll max-h-[30vh] md:max-h-full">
            {activeArray.nodes.map(s => {
               const res = results[s.id];
               const color = res ? getStatusColor(res.status) : (s.enabled ? '#3f3f46' : '#18181b'); 
               return (
                 <div key={s.id} className="p-3 border-b border-zinc-900/50 bg-black/40 hover:bg-zinc-900/30 transition-colors flex flex-col gap-2 group relative">
                    <div className="flex justify-between items-center">
                        <div className="flex flex-col">
                           <span className={`text-[9px] font-black uppercase tracking-wider ${s.enabled ? 'text-zinc-300' : 'text-zinc-700 line-through'}`}>{s.name}</span>
                           <span className="text-[7px] font-mono text-zinc-600 uppercase mt-0.5">{s.type} | {s.timeout}ms</span>
                        </div>
                        <div className="flex items-center gap-2">
                           {res && <div className="text-[8px] font-black uppercase tracking-wider" style={{ color: color }}>{res.status === 'POSITIVE' ? 'ALERT' : 'OK'}</div>}
                           <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.enabled ? (res ? color : '#3f3f46') : '#18181b' }}></div>
                        </div>
                    </div>
                 </div>
               );
            })}
         </div>
         
         <div className="p-3 border-t border-zinc-900 bg-zinc-950/50 text-[8px] font-mono text-zinc-600 flex justify-between shrink-0">
            <span>NODES: {activeArray.nodes.filter(s => s.enabled).length}/{activeArray.nodes.length}</span>
            <span>ALERTS: {Object.values(results).filter(r => r.status === 'POSITIVE').length}</span>
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
                        <p className="text-[11px] text-zinc-200 font-mono leading-relaxed">{selectedResult.description}</p>
                    </div>
                    <div className="space-y-1">
                        <span className="text-[9px] text-zinc-600 uppercase font-black">Technical_Details</span>
                        <p className="text-[11px] text-teal-500 font-mono leading-relaxed">{selectedResult.details}</p>
                    </div>
                </div>
                <div className="flex justify-between items-center text-[8px] text-zinc-600 font-mono pt-2 border-t border-zinc-900">
                    <span>SOURCE_SYSTEM: {selectedResult.sourceSystem}</span>
                    <span>SENSOR_ID: {selectedResult.sensorId}</span>
                </div>
            </div>
         )}
      </Modal>
      
      <Modal isOpen={showHistoryModal} onClose={() => setShowHistoryModal(false)} title="SCANNER_HISTORY_LOG" variant="blue">
         <div className="space-y-4">
            <div className="overflow-y-auto max-h-[60vh] space-y-2">
               {historyEntries.length > 0 ? historyEntries.map((entry, i) => (
                  <div key={i} className="p-3 border border-zinc-900 bg-black/40 flex flex-col gap-1">
                     <div className="flex justify-between items-center text-[9px]">
                        <span className="text-zinc-400 font-mono">{new Date(entry.timestamp).toLocaleString()}</span>
                        <span className="text-zinc-600">{entry.values[0]}</span>
                     </div>
                     <div className="text-[10px] font-black text-blue-400 uppercase tracking-wide">{entry.values[1]}</div>
                  </div>
               )) : <div className="text-center py-8 text-zinc-700 italic text-[10px]">NO_HISTORY_AVAILABLE</div>}
            </div>
         </div>
      </Modal>
    </div>
  );
};

export default ScannerPanel;
