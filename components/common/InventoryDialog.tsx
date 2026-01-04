
import React, { useState, useEffect, useMemo } from 'react';
import Modal from './Modal';
import { launcherSystem, PROBE_AMMUNITION, PANELS_SUPPORTING_HISTORY } from '../../services/launcherService';
import { PROBE_CONTRACTS } from '../../services/probeContracts';
import { PanelSlotConfig, SlotConfig, Consumable } from '../../types';
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
}

const InventoryDialog: React.FC<InventoryDialogProps> = ({ isOpen, onClose, panelId, initialSlotType, fullConfig, onEquip, onRemove, onClear, globalLowSlot, globalBufferSlot }) => {
  const [navLevel, setNavLevel] = useState<'ROOT' | 'SLOT_SELECTED'>('ROOT');
  const [activeSlot, setActiveSlot] = useState<'low' | 'probe' | 'sensor' | 'buffer' | 'main'>(initialSlotType || 'low');
  
  const [stagedLauncher, setStagedLauncher] = useState<string | null>(null);
  const [stagedAmmoId, setStagedAmmoId] = useState<string | null>(null);

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
          const current = initialSlotType === 'probe' ? fullConfig.probeSlot : (initialSlotType === 'sensor' ? fullConfig.sensorSlot : fullConfig.bufferSlot);
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
    const current = type === 'main' 
      ? { launcherId: 'MAIN_SYSTEM_BUS', ammoId: launcherSystem.getInstalledBoosterId() || '' }
      : (type === 'low' ? globalLowSlot : (type === 'probe' ? fullConfig.probeSlot : (type === 'sensor' ? fullConfig.sensorSlot : fullConfig.bufferSlot)));
    setStagedLauncher(current?.launcherId || null);
    setStagedAmmoId(current?.ammoId || null);
  };

  const handleLauncherClick = (launcherId: string) => {
    setStagedLauncher(launcherId);
    const ammo = Object.values(PROBE_AMMUNITION).find(a => a.compatibleLaunchers.includes(launcherSystem.getById(launcherId)?.type as any));
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

  const handleDecommissionSlot = () => {
    if (onRemove) {
      onRemove(panelId, activeSlot);
      onClose();
    }
  };

  const hasChanges = useMemo(() => {
    const original = activeSlot === 'main'
      ? { launcherId: 'MAIN_SYSTEM_BUS', ammoId: launcherSystem.getInstalledBoosterId() || '' }
      : (activeSlot === 'low' ? globalLowSlot : (activeSlot === 'probe' ? fullConfig.probeSlot : (activeSlot === 'sensor' ? fullConfig.sensorSlot : fullConfig.bufferSlot)));
    
    const launcherChanged = stagedLauncher !== (original?.launcherId || null);
    const ammoChanged = stagedAmmoId !== (original?.ammoId || null);
    
    return launcherChanged || ammoChanged;
  }, [activeSlot, fullConfig, globalLowSlot, stagedLauncher, stagedAmmoId]);

  const payloadPreview = useMemo(() => {
    if (activeSlot === 'main') return { type: 'BOOSTER_MODULE', feature: 'COOLDOWN_BYPASS', status: 'READY_FOR_ENGAGEMENT' };
    
    const contract = PROBE_CONTRACTS[panelId] || PROBE_CONTRACTS['GLOBAL_SYSTEM_PROBE'];
    const launcher = launcherSystem.getById(stagedLauncher || '');
    const ammo = PROBE_AMMUNITION[stagedAmmoId || ''];

    return {
      protocol: activeSlot === 'low' ? 'GLOBAL_NEURO_DATA_INFERENCE' : (activeSlot === 'probe' ? 'CORE_DATA_PROBE' : (activeSlot === 'sensor' ? 'SENSOR_MODULE_EXECUTION' : 'AUGMENTED_BUFFER_MAINTENANCE')),
      panel_context: panelId,
      tier: activeSlot.toUpperCase(),
      launcher_node: launcher?.name || 'NULL',
      capacity_limit: launcher?.tokens || 0,
      contract_id: contract.id,
      ammunition: ammo?.name || 'NULL',
      mock_payload_structure: contract.buildPayload({ 
        status: 'REAL_TIME_STREAM_SNAPSHOT',
        latency_ms: 12,
        active_traces: 4,
        entropy: 0.82
      })
    };
  }, [panelId, activeSlot, stagedLauncher, stagedAmmoId]);

  const isHistoricalSupported = PANELS_SUPPORTING_HISTORY.includes(panelId);
  const requiredLauncherType = activeSlot === 'low' ? 'neural' : (activeSlot === 'probe' ? 'core' : (activeSlot === 'sensor' ? 'sensor-module' : 'buffer-module'));
  const compatibleLaunchers = useMemo(() => {
    if (activeSlot === 'main') {
        return [{ id: 'MAIN_SYSTEM_BUS', name: 'MAIN SYSTEM BUS', color: '#eab308', type: 'main' as any, tier: 1 as any, description: 'Primary tactical backbone. Accepts Booster Modules.', maxCharges: 1, rechargeRate: 0, tokens: 0, compatibleProbes: [] }];
    }
    // Filter and then Sort by Tier
    return launcherSystem.getCompatible(requiredLauncherType as any)
      .sort((a, b) => (a.tier || 1) - (b.tier || 1));
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

  const footerActions = (
    <>
      {hasChanges && stagedLauncher && (
        <>
          <button 
            onClick={handleApply}
            className="px-6 py-2 bg-teal-500/10 border border-teal-500/40 text-teal-400 text-[10px] font-black uppercase tracking-widest hover:bg-teal-500/20 transition-all"
          >
            {activeSlot === 'main' ? 'FIRE' : 'APPLY'}
          </button>
          <button 
            onClick={handleConfirm}
            className="px-6 py-2 bg-teal-500/20 border border-teal-500 text-teal-400 text-[10px] font-black uppercase tracking-widest hover:bg-teal-500/30 transition-all shadow-[0_0_10px_rgba(20,184,166,0.2)]"
          >
            {activeSlot === 'main' ? 'ACTIVATE' : 'CONFIRM'}
          </button>
        </>
      )}
    </>
  );

  const rootOptions = [
    { id: 'low', name: isGlobalMode ? 'MASTER_LOW_CONFIGURATION' : 'GLOBAL_LOW_SLOT', desc: 'Neural labels & inference. (Globally Managed)', color: getTierColor('low'), visible: isGlobalMode },
    { id: 'probe', name: isGlobalMode ? 'MASTER_PROBE_CONFIGURATION' : 'PROBE_TIER_SLOT', desc: isGlobalMode ? 'Updates all equipped med-tier slots.' : 'Deep-dive panel telemetry auditing.', color: getTierColor('probe'), disabled: (!isGlobalMode && panelId === 'GLOBAL_SYSTEM_PROBE') || !fullConfig.probeSlot, visible: true },
    { id: 'sensor', name: 'SENSOR_PORT_SLOT', desc: 'Hardware sensor nodes.', color: getTierColor('sensor'), disabled: panelId !== 'SENSOR_PANEL', visible: !isGlobalMode },
    { id: 'buffer', name: isGlobalMode ? 'MASTER_BUFFER_CONFIGURATION' : 'BUFFER_PORT_SLOT', desc: isGlobalMode ? 'Updates all equipped augmented slots.' : 'Maintain system buffs and script optimization.', color: getTierColor('buffer'), disabled: panelId !== 'SENSOR_PANEL' && !isGlobalMode, visible: true },
    { id: 'main', name: 'BOOSTER_TIER_SLOT', desc: 'Global Neural Override.', color: getTierColor('main'), visible: true }
  ];

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={isGlobalMode ? 'MASTER_MATRIX_CONFIG' : `PANEL_CONFIG: ${panelId}`} 
      variant={activeSlot === 'sensor' ? 'green' : (activeSlot === 'buffer' ? 'blue' : 'purple')}
      footerActions={footerActions}
    >
      <div className="flex flex-col h-[620px] overflow-hidden">
        
        <div className="flex items-center gap-2 mb-6 px-1 shrink-0">
           <button 
             onClick={() => setNavLevel('ROOT')}
             className={`text-[10px] font-black uppercase tracking-widest ${navLevel === 'ROOT' ? 'text-zinc-300' : 'text-zinc-600 hover:text-zinc-400'}`}
           >
             SYSTEM_SLOTS
           </button>
           {navLevel === 'SLOT_SELECTED' && (
             <>
               <span className="text-zinc-800">/</span>
               <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                 {activeSlot.toUpperCase()}_TIER
               </span>
             </>
           )}
        </div>

        <div className="flex flex-1 gap-6 overflow-hidden min-h-0">
          <div className="w-1/2 border-r border-zinc-900 pr-4 overflow-y-auto no-scroll relative flex flex-col">
            {navLevel === 'ROOT' ? (
              <div className="space-y-2 animate-in fade-in slide-in-from-left-2">
                 <h4 className="text-[9px] font-black text-zinc-700 uppercase tracking-[0.2em] mb-4">Select_Tier_Slot</h4>
                 {rootOptions.filter(o => o.visible).map(slot => (
                   <div 
                      key={slot.id} 
                      onClick={() => !slot.disabled && handleSlotSelect(slot.id as any)} 
                      className={`p-4 border border-zinc-900 bg-black/40 flex justify-between items-center transition-all ${slot.disabled ? 'opacity-20 cursor-not-allowed' : 'hover:border-zinc-700 cursor-pointer group'}`}
                   >
                     <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: slot.color }}>{slot.name}</span>
                        <p className="text-[8px] text-zinc-600 italic">{slot.desc}</p>
                     </div>
                     <div className="w-1.5 h-1.5 rounded-full bg-zinc-800 group-hover:bg-white"></div>
                   </div>
                 ))}
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto no-scroll animate-in fade-in slide-in-from-left-2">
                 <h4 className="text-[9px] font-black text-zinc-700 uppercase tracking-[0.2em] mb-4">Hardware_Nodes</h4>
                 <div className="space-y-4 pl-2 pb-10">
                   {compatibleLaunchers.map(l => {
                     const isTierAllowed = isGlobalMode || launcherSystem.isLauncherAllowed(panelId, l.id);
                     
                     return (
                       <div key={l.id} className={`flex flex-col relative group ${!isTierAllowed ? 'opacity-40 grayscale' : ''}`}>
                        <div 
                           onClick={() => isTierAllowed && handleLauncherClick(l.id)} 
                           className={`p-4 border transition-all flex justify-between items-center z-10 ${!isTierAllowed ? 'cursor-not-allowed border-zinc-900' : (stagedLauncher === l.id ? 'bg-zinc-900 border-white shadow-lg cursor-pointer' : 'bg-black border-zinc-900 hover:border-zinc-600 cursor-pointer')}`}
                        >
                         <div>
                           <div className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                             {l.tier && <span className="text-[7px] border border-zinc-700 px-1 text-zinc-500 font-mono">T{l.tier}</span>}
                             <span style={{ color: stagedLauncher === l.id ? l.color : '#71717a' }}>{l.name}</span>
                             {stagedLauncher === l.id && <span className="text-[7px] bg-teal-900/40 text-teal-400 px-1 rounded-sm border border-teal-500/20">STAGED</span>}
                           </div>
                           <div className="text-[8px] text-zinc-600 mt-1 font-mono uppercase">Capacity: {l.maxCharges} | Tokens: {l.tokens}</div>
                           {!isTierAllowed && <div className="text-[6px] text-red-500 font-black uppercase tracking-tighter mt-1">[INCOMPATIBLE_PANEL_RESOURCES]</div>}
                         </div>
                         <div className={`w-2 h-2 border ${stagedLauncher === l.id ? 'bg-white border-white' : 'border-zinc-700 bg-black'}`}></div>
                       </div>
                       {stagedLauncher === l.id && (
                         <div className="ml-6 pt-2 space-y-2 animate-in slide-in-from-top-2">
                           {Object.values(PROBE_AMMUNITION).filter(a => a.compatibleLaunchers.includes(l.type as any)).filter(a => !(a.features.includes('HISTORY_CSV') && !isHistoricalSupported)).map(ammo => {
                               const isPending = stagedAmmoId === ammo.id;
                               const count = launcherSystem.getAmmoCount(ammo.id);
                               const tierInfo = getAmmoTierInfo(ammo);
                               
                               return (
                                 <div key={ammo.id} className={`relative p-3 border text-[9px] flex flex-col gap-1 transition-all ml-4 ${ammo.disabled ? 'opacity-40 grayscale cursor-not-allowed' : 'cursor-pointer hover:bg-zinc-900 bg-black/60 border-zinc-800'} ${isPending ? 'border-white shadow-[0_0_10px_rgba(255,255,255,0.1)]' : ''}`} onClick={() => !ammo.disabled && handleAmmoSelect(ammo.id)}>
                                   <div className="absolute -left-4 top-1/2 w-4 h-[1px] bg-zinc-800"></div>
                                   <div className="flex justify-between items-center">
                                     <div className="flex items-center gap-2">
                                        <span className={`font-black uppercase tracking-wider ${tierInfo.class}`}>{ammo.name}</span>
                                        <span className="text-[6px] font-mono px-1 border border-zinc-800 text-zinc-600 uppercase">{tierInfo.label}</span>
                                     </div>
                                     {isPending && <span className="text-[7px] text-black px-1 font-bold bg-white uppercase">SELECTED</span>}
                                   </div>
                                   <span className="text-zinc-600 italic text-[8px] leading-tight">{ammo.description}</span>
                                   {!ammo.unlimited && (
                                     <span className="text-[7px] font-mono text-zinc-500 mt-1">STOCK: {count} units</span>
                                   )}
                                 </div>
                               );
                           })}
                         </div>
                       )}
                     </div>
                   );
                   })}
                   
                   {activeSlot !== 'main' && (
                      <div className="mt-8 border-t border-zinc-900 pt-4 flex flex-col gap-2">
                          <button 
                              onClick={handleClearSlot}
                              className="w-full py-2 border border-zinc-800 text-zinc-400 text-[9px] font-black uppercase tracking-widest hover:bg-white/5 hover:text-white transition-all"
                          >
                              {activeSlot === 'probe' ? 'REVERT_TO_STANDARD' : 'CLEAR_SLOT_CONTENTS'}
                          </button>
                          
                          {activeSlot !== 'low' && activeSlot !== 'probe' && (
                            <button 
                                onClick={handleDecommissionSlot}
                                className="w-full py-2 border border-red-900/40 text-red-500 text-[9px] font-black uppercase tracking-widest hover:bg-red-500/10 transition-all"
                            >
                                DECOMMISSION_SLOT_MODULE
                            </button>
                          )}
                      </div>
                   )}
                 </div>
              </div>
            )}
          </div>

          <div className="w-1/2 flex flex-col overflow-hidden bg-zinc-950/30 border border-zinc-900/50 rounded-sm">
             <div className="flex-none p-6 text-center border-b border-zinc-900 bg-zinc-950/50">
                <div className={`w-12 h-12 rounded-full border flex items-center justify-center mb-3 mx-auto transition-all`} style={{ borderColor: getTierColor(activeSlot), color: getTierColor(activeSlot), boxShadow: `0 0 15px ${getTierColor(activeSlot)}33` }}>
                   <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      {activeSlot === 'low' ? <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/> : <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>}
                   </svg>
                </div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white">
                  {activeSlot === 'low' ? 'GLOBAL_NEURO_INFERENCE' : (activeSlot === 'buffer' ? 'AUGMENTED_BUFFER_MAINTENANCE' : `${activeSlot.toUpperCase()}_TIER_INFERENCE`)}
                </h3>
                {isGlobalMode && <span className="text-[7px] text-teal-400 font-black uppercase tracking-widest animate-pulse">[MASTER_OVERRIDE_ACTIVE]</span>}
             </div>
             
             <div className="flex-1 flex flex-col p-4 overflow-hidden">
                <div className="flex justify-between items-center mb-2 px-1">
                   <span className="text-[8px] font-black text-zinc-700 uppercase tracking-widest">Neural_Packet_Preview</span>
                   <span className={`text-[7px] font-mono uppercase ${hasChanges ? 'text-teal-400 animate-pulse' : 'text-zinc-600'}`}>{hasChanges ? 'STAGED_READY' : 'SYNC_PENDING'}</span>
                </div>
                <div className="flex-1 bg-black/80 border border-zinc-900 p-4 font-mono text-[9px] text-teal-600 overflow-y-auto no-scroll selection:bg-teal-500/20 shadow-inner">
                   <pre className="whitespace-pre-wrap">{JSON.stringify(payloadPreview, null, 2)}</pre>
                </div>
                <div className="mt-4 pt-4 border-t border-zinc-900 space-y-2 shrink-0">
                   <div className="flex justify-between text-[8px] uppercase tracking-tighter"><span className="text-zinc-700">Launcher Node</span><span className="text-zinc-400 font-black">{launcherSystem.getById(stagedLauncher || '')?.name || 'NONE'}</span></div>
                   <div className="flex justify-between text-[8px] uppercase tracking-tighter"><span className="text-zinc-700">Active Script</span><span className="text-zinc-400 font-black">{PROBE_AMMUNITION[stagedAmmoId || '']?.name || 'NULL'}</span></div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default InventoryDialog;
