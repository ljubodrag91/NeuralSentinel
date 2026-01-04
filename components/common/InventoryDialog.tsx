
import React, { useState, useEffect, useMemo } from 'react';
import Modal from './Modal';
import { launcherSystem, PROBE_AMMUNITION, PANELS_SUPPORTING_HISTORY } from '../../services/launcherService';
import { serverService } from '../../services/serverService';
import { PROBE_CONTRACTS } from '../../services/probeContracts';
import { PanelSlotConfig, SlotConfig, Consumable, OperationalMode, Platform } from '../../types';
import Tooltip from './Tooltip';

interface InventoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  panelId: string;
  initialSlotType: 'low' | 'probe' | 'sensor' | 'buffer' | 'main';
  fullConfig: PanelSlotConfig;
  onEquip: (panelId: string, slotType: 'low' | 'probe' | 'sensor' | 'buffer' | 'main', launcherId: string, ammoId: string) => void;
  onRemove?: (panelId: string, slotType: 'low' | 'probe' | 'sensor' | 'buffer' | 'main') => void;
  onClear?: (panelId: string, slotType: 'low' | 'probe' | 'sensor' | 'buffer' | 'main') => void;
  globalLowSlot?: SlotConfig;
  globalBufferSlot?: SlotConfig;
  mode?: OperationalMode;
  platform?: Platform;
  serviceStatus?: 'ACTIVE' | 'OFFLINE';
}

const SyntaxHighlighter: React.FC<{ json: any }> = ({ json }) => {
  const formatValue = (val: any) => {
    if (typeof val === 'string') return <span className="text-[#28a745]">"{val}"</span>;
    if (typeof val === 'number') return <span className="text-[#f97316]">{val}</span>;
    if (typeof val === 'boolean') return <span className="text-[#bd00ff]">{String(val)}</span>;
    if (val === null) return <span className="text-[#bd00ff]">null</span>;
    return String(val);
  };

  const renderJson = (obj: any, depth = 0): React.ReactNode => {
    const indent = '  '.repeat(depth);
    if (Array.isArray(obj)) {
      if (obj.length === 0) return '[]';
      return (
        <>
          [
          {obj.map((item, i) => (
            <div key={i} className="pl-4">
              {renderJson(item, depth + 1)}{i < obj.length - 1 ? ',' : ''}
            </div>
          ))}
          {indent}]
        </>
      );
    }
    if (typeof obj === 'object' && obj !== null) {
      const keys = Object.keys(obj);
      if (keys.length === 0) return '{}';
      return (
        <>
          {"{"}
          {keys.map((key, i) => (
            <div key={key} className="pl-4">
              <span className="text-[#00ffd5]">"{key}"</span>: {renderJson(obj[key], depth + 1)}
              {i < keys.length - 1 ? ',' : ''}
            </div>
          ))}
          {indent}{"}"}
        </>
      );
    }
    return formatValue(obj);
  };

  return (
    <div className="font-mono text-[9px] leading-tight whitespace-pre-wrap break-all selection:bg-teal-500/20">
      {renderJson(json)}
    </div>
  );
};

const InventoryDialog: React.FC<InventoryDialogProps> = ({ 
  isOpen, onClose, panelId, initialSlotType, fullConfig, onEquip, onRemove, onClear, globalLowSlot, globalBufferSlot,
  mode = OperationalMode.OFFLINE, platform = Platform.LINUX, serviceStatus = 'OFFLINE'
}) => {
  const [navLevel, setNavLevel] = useState<'ROOT' | 'SLOT_SELECTED'>('ROOT');
  const [activeSlot, setActiveSlot] = useState<'low' | 'probe' | 'sensor' | 'buffer' | 'main'>(initialSlotType || 'low');
  
  const [stagedLauncher, setStagedLauncher] = useState<string | null>(null);
  const [stagedAmmoId, setStagedAmmoId] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const isGlobalMode = panelId === 'GLOBAL_SYSTEM';

  useEffect(() => {
    if (isOpen) {
      if (initialSlotType) {
        setActiveSlot(initialSlotType);
        setNavLevel('SLOT_SELECTED');
        if (initialSlotType === 'main') {
          setStagedLauncher('MAIN_SYSTEM_BUS');
          setStagedAmmoId(launcherSystem.getInstalledBoosterId() || '');
        } else if (initialSlotType === 'low') {
          setStagedLauncher(globalLowSlot?.launcherId || null);
          setStagedAmmoId(globalLowSlot?.ammoId || null);
        } else if (initialSlotType === 'buffer' && isGlobalMode) {
          setStagedLauncher(globalBufferSlot?.launcherId || null);
          setStagedAmmoId(globalBufferSlot?.ammoId || null);
        } else {
          const config = fullConfig || {};
          const current = initialSlotType === 'probe' ? config.probeSlot : (initialSlotType === 'sensor' ? config.sensorSlot : config.bufferSlot);
          setStagedLauncher(current?.launcherId || null);
          setStagedAmmoId(current?.ammoId || null);
        }
      } else {
        setNavLevel('ROOT');
        setStagedLauncher(null);
        setStagedAmmoId(null);
        setActiveSlot('low');
      }
    }
  }, [isOpen, initialSlotType, fullConfig, globalLowSlot, globalBufferSlot, isGlobalMode]);

  const handleSlotSelect = (type: 'low' | 'probe' | 'sensor' | 'buffer' | 'main') => {
    setActiveSlot(type);
    setNavLevel('SLOT_SELECTED');
    const config = fullConfig || {};
    const current = type === 'main' 
      ? { launcherId: 'MAIN_SYSTEM_BUS', ammoId: launcherSystem.getInstalledBoosterId() || '' }
      : (type === 'low' ? globalLowSlot : (type === 'probe' ? config.probeSlot : (type === 'sensor' ? config.sensorSlot : config.bufferSlot)));
    setStagedLauncher(current?.launcherId || null);
    setStagedAmmoId(current?.ammoId || null);
  };

  const handleLauncherClick = (launcherId: string) => {
    setStagedLauncher(launcherId);
    const lDef = launcherSystem.getById(launcherId);
    const ammo = Object.values(PROBE_AMMUNITION).find(a => lDef && a.compatibleLaunchers.includes(lDef.type as any));
    if (ammo) setStagedAmmoId(ammo.id);
  };

  const handleAmmoSelect = (ammoId: string) => {
    setStagedAmmoId(ammoId);
  };

  const handleConfirm = () => {
    if (stagedLauncher && stagedAmmoId !== null) {
      onEquip(panelId, activeSlot, stagedLauncher, stagedAmmoId);
      onClose();
    }
  };

  const handleApply = () => {
    if (stagedLauncher && stagedAmmoId !== null) {
      onEquip(panelId, activeSlot, stagedLauncher, stagedAmmoId);
    }
  };

  const handleClearSlot = () => {
    if (onClear) {
      onClear(panelId, activeSlot);
      onClose();
    }
  };

  const handlePurgeFault = (launcherId: string) => {
    serverService.clearFault(launcherId);
    setTick(t => t + 1);
  };

  const hasChanges = useMemo(() => {
    const config = fullConfig || {};
    const original = activeSlot === 'main'
      ? { launcherId: 'MAIN_SYSTEM_BUS', ammoId: launcherSystem.getInstalledBoosterId() || '' }
      : (activeSlot === 'low' ? globalLowSlot : (activeSlot === 'probe' ? config.probeSlot : (activeSlot === 'sensor' ? config.sensorSlot : config.bufferSlot)));
    
    const launcherChanged = stagedLauncher !== (original?.launcherId || null);
    const ammoChanged = stagedAmmoId !== (original?.ammoId || null);
    
    return launcherChanged || ammoChanged;
  }, [activeSlot, fullConfig, globalLowSlot, stagedLauncher, stagedAmmoId]);

  const fullPayloadPreview = useMemo(() => {
    if (activeSlot === 'main') return { envelope_type: 'OVERRIDE_PACKET', system_state: 'BOOSTER_READY' };
    
    const contract = PROBE_CONTRACTS[panelId] || PROBE_CONTRACTS['GLOBAL_SYSTEM_PROBE'];
    const launcher = launcherSystem.getById(stagedLauncher || '');
    const ammo = PROBE_AMMUNITION[stagedAmmoId || ''];

    const mockData = contract.buildPayload({ 
      status: 'PREVIEW_MODE',
      timestamp: new Date().toISOString(),
      platform: platform,
      mode: mode
    });

    return {
      panel: panelId,
      operational_mode: mode,
      platform: platform,
      payload: mockData,
      meta: {
        token_limit: launcher?.tokens || 2000,
        probe_type: contract.isDataProbe ? 'DATA_PROBE' : 'NEURAL_LOGIC',
        tier: activeSlot.toUpperCase(),
        ammunition: ammo?.name || 'NULL',
        timestamp: new Date().toISOString()
      }
    };
  }, [panelId, activeSlot, stagedLauncher, stagedAmmoId, mode, platform]);

  const isHistoricalSupported = PANELS_SUPPORTING_HISTORY.includes(panelId);
  const requiredLauncherType = activeSlot === 'low' ? 'neural' : (activeSlot === 'probe' ? 'core' : (activeSlot === 'sensor' ? 'sensor-module' : 'buffer-module'));
  
  const compatibleLaunchers = useMemo(() => {
    if (activeSlot === 'main') {
        return [{ id: 'MAIN_SYSTEM_BUS', name: 'MAIN SYSTEM BUS', color: '#eab308', type: 'main' as any, tier: 1 as any, description: 'Primary tactical backbone. Accepts Booster Modules.', maxCharges: 1, rechargeRate: 0, tokens: 0, compatibleProbes: [] }];
    }
    const comps = launcherSystem.getCompatible(requiredLauncherType as any);
    return (comps || []).sort((a, b) => (a.tier || 1) - (b.tier || 1));
  }, [activeSlot, requiredLauncherType]);

  const getTierColor = (slot: string) => {
    if (slot === 'low') return '#00ffd5'; 
    if (slot === 'probe') return '#bd00ff'; 
    if (slot === 'sensor') return '#f97316'; 
    if (slot === 'buffer') return '#3b82f6';
    return '#eab308';
  };

  const getAmmoTierInfo = (ammo: Consumable) => {
    if (ammo.isNeuralIntegration || ammo.autoInterval) return { label: 'Automatic', color: '#22c55e', class: 'glimmer-automatic' };
    if (ammo.type === 'booster' || activeSlot === 'buffer') return { label: 'Augmented', color: '#3b82f6', class: 'glimmer-augmented' };
    return { label: 'Standard', color: '#eab308', class: 'glimmer-standard' };
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={isGlobalMode ? 'MASTER_MATRIX_CONFIG' : `PANEL_CONFIG: ${panelId}`} 
      variant={activeSlot === 'sensor' ? 'green' : (activeSlot === 'buffer' ? 'blue' : 'purple')}
      footerActions={(
        <>
          {hasChanges && stagedLauncher && (
            <>
              <button onClick={handleApply} className="px-6 py-2 bg-teal-500/10 border border-teal-500/40 text-teal-400 text-[10px] font-black uppercase tracking-widest hover:bg-teal-500/20 transition-all">{activeSlot === 'main' ? 'FIRE' : 'APPLY'}</button>
              <button onClick={handleConfirm} className="px-6 py-2 bg-teal-500/20 border border-teal-500 text-teal-400 text-[10px] font-black uppercase tracking-widest hover:bg-teal-500/30 transition-all">CONFIRM</button>
            </>
          )}
        </>
      )}
    >
      <div className="flex flex-col h-[620px] overflow-hidden">
        <div className="flex items-center gap-2 mb-6 px-1 shrink-0">
           <button onClick={() => setNavLevel('ROOT')} className={`text-[10px] font-black uppercase tracking-widest ${navLevel === 'ROOT' ? 'text-zinc-300' : 'text-zinc-600 hover:text-zinc-400'}`}>SYSTEM_SLOTS</button>
           {navLevel === 'SLOT_SELECTED' && (
             <><span className="text-zinc-800">/</span><span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{activeSlot.toUpperCase()}_TIER</span></>
           )}
        </div>

        <div className="flex flex-1 gap-6 overflow-hidden">
          <div className="w-1/2 border-r border-zinc-900 pr-4 overflow-y-auto no-scroll flex flex-col">
            {navLevel === 'ROOT' ? (
              <div className="space-y-2 animate-in fade-in slide-in-from-left-2">
                 <h4 className="text-[9px] font-black text-zinc-700 uppercase tracking-[0.2em] mb-4">Select_Tier_Slot</h4>
                 {[
                    { id: 'low', name: 'MASTER_LOW_CONFIG', desc: 'Neural labels & inference.', color: getTierColor('low'), visible: isGlobalMode, disabled: false },
                    { id: 'probe', name: 'PROBE_TIER_SLOT', desc: 'Deep-dive auditing.', color: getTierColor('probe'), visible: true, disabled: (!isGlobalMode && panelId === 'GLOBAL_SYSTEM_PROBE') || (fullConfig && !fullConfig.probeSlot) },
                    { id: 'sensor', name: 'SENSOR_PORT_SLOT', desc: 'Hardware sensors.', color: getTierColor('sensor'), visible: !isGlobalMode, disabled: panelId !== 'SENSOR_PANEL' },
                    { id: 'buffer', name: 'BUFFER_PORT_SLOT', desc: 'System buffs.', color: getTierColor('buffer'), visible: true, disabled: panelId !== 'SENSOR_PANEL' && !isGlobalMode },
                    { id: 'main', name: 'BOOSTER_TIER_SLOT', desc: 'Override carrier.', color: getTierColor('main'), visible: true, disabled: false }
                 ].filter(o => o.visible).map(slot => (
                   <div key={slot.id} onClick={() => !slot.disabled && handleSlotSelect(slot.id as any)} className={`p-4 border border-zinc-900 bg-black/40 flex justify-between items-center transition-all ${slot.disabled ? 'opacity-20 cursor-not-allowed' : 'hover:border-zinc-700 cursor-pointer group'}`}>
                     <div className="flex flex-col"><span className="text-[10px] font-black uppercase tracking-widest" style={{ color: slot.color }}>{slot.name}</span><p className="text-[8px] text-zinc-600 italic">{slot.desc}</p></div>
                     <div className="w-1.5 h-1.5 rounded-full bg-zinc-800 group-hover:bg-white"></div>
                   </div>
                 ))}
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto no-scroll animate-in fade-in slide-in-from-left-2">
                 <h4 className="text-[9px] font-black text-zinc-700 uppercase tracking-[0.2em] mb-4">Hardware_Nodes</h4>
                 <div className="space-y-4 pl-2 pb-10">
                   {compatibleLaunchers.map(l => {
                     const isTierAllowed = isGlobalMode || (l && launcherSystem.isLauncherAllowed(panelId, l.id));
                     const hasFault = serverService.getFault(l.id);
                     return (
                       <div key={l.id} className={`flex flex-col relative group ${!isTierAllowed ? 'opacity-40 grayscale' : ''}`}>
                        <div onClick={() => isTierAllowed && handleLauncherClick(l.id)} className={`p-4 border transition-all flex justify-between items-center ${!isTierAllowed ? 'cursor-not-allowed border-zinc-900' : (stagedLauncher === l.id ? 'bg-zinc-900 border-white shadow-lg cursor-pointer' : 'bg-black border-zinc-900 hover:border-zinc-600 cursor-pointer')} ${hasFault ? 'border-red-900/50' : ''}`}>
                         <div>
                           <div className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                             {l.tier && <span className="text-[7px] border border-zinc-700 px-1 text-zinc-500 font-mono">T{l.tier}</span>}
                             <span style={{ color: hasFault ? '#ff3e3e' : (stagedLauncher === l.id ? l.color : '#71717a') }}>{l.name}</span>
                             {hasFault && <span className="text-[7px] bg-red-600 text-white px-1 ml-2 animate-pulse font-black">FAULT</span>}
                           </div>
                           <div className="text-[8px] text-zinc-600 mt-1 font-mono uppercase">Capacity: {l.maxCharges} | Tokens: {l.tokens}</div>
                         </div>
                         <div className={`w-2 h-2 border ${stagedLauncher === l.id ? 'bg-white border-white' : 'border-zinc-700 bg-black'}`}></div>
                       </div>
                       
                       {hasFault && stagedLauncher === l.id && (
                          <div className="mt-2 ml-4 p-3 bg-red-950/20 border border-red-900/40 rounded-sm flex flex-col gap-2">
                             <span className="text-[8px] font-black text-red-400 uppercase">Fault_Intel: {hasFault}</span>
                             <button onClick={() => handlePurgeFault(l.id)} className="w-fit px-3 py-1 bg-red-600 text-white text-[7px] font-black uppercase hover:bg-red-500 transition-all">PURGE_FAULT</button>
                          </div>
                       )}

                       {stagedLauncher === l.id && (
                         <div className="ml-6 pt-2 space-y-2 animate-in slide-in-from-top-2">
                           {Object.values(PROBE_AMMUNITION).filter(a => l && a && a.compatibleLaunchers && a.compatibleLaunchers.includes(l.type as any)).filter(a => !(a.features.includes('HISTORY_CSV') && !isHistoricalSupported)).map(ammo => {
                               const isPending = stagedAmmoId === ammo.id;
                               const tierInfo = getAmmoTierInfo(ammo);
                               return (
                                 <div key={ammo.id} className={`relative p-3 border text-[9px] flex flex-col gap-1 transition-all ml-4 ${ammo.disabled ? 'opacity-40 grayscale cursor-not-allowed' : 'cursor-pointer hover:bg-zinc-900 bg-black/60 border-zinc-800'} ${isPending ? 'border-white shadow-sm' : ''}`} onClick={() => !ammo.disabled && handleAmmoSelect(ammo.id)}>
                                   <div className="absolute -left-4 top-1/2 w-4 h-[1px] bg-zinc-800"></div>
                                   <div className="flex justify-between items-center">
                                     <div className="flex items-center gap-2">
                                        <span className={`font-black uppercase tracking-wider ${tierInfo.class}`}>{ammo.name}</span>
                                        <span className="text-[6px] font-mono px-1 border border-zinc-800 text-zinc-600 uppercase">{tierInfo.label}</span>
                                     </div>
                                   </div>
                                   <span className="text-zinc-600 italic text-[8px] leading-tight">{ammo.description}</span>
                                 </div>
                               );
                           })}
                         </div>
                       )}
                     </div>
                   )})}
                   <button onClick={handleClearSlot} className="mt-8 w-full py-2 border border-zinc-800 text-zinc-400 text-[9px] font-black uppercase tracking-widest hover:bg-white/5 transition-all">CLEAR_SLOT</button>
                 </div>
              </div>
            )}
          </div>

          <div className="w-1/2 flex flex-col overflow-hidden bg-[#1e1e1e] border border-zinc-900/50 rounded-sm">
             <div className="flex-none p-6 text-center border-b border-zinc-900 bg-black/40">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Neural_Packet_Preview</h3>
                <p className="text-[7px] text-zinc-600 font-mono mt-1">Simulated prompt envelope contents</p>
             </div>
             <div className="flex-1 p-4 overflow-y-auto no-scroll">
                <SyntaxHighlighter json={fullPayloadPreview} />
             </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default InventoryDialog;
