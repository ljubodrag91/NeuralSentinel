
import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { launcherSystem, PROBE_AMMUNITION, PANELS_SUPPORTING_HISTORY } from '../../services/launcherService';
import { PanelSlotConfig } from '../../types';

interface InventoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  panelId: string;
  initialSlotType: 'data' | 'neural';
  fullConfig: PanelSlotConfig;
  onEquip: (panelId: string, slotType: 'data' | 'neural', launcherId: string, ammoId: string) => void;
}

const InventoryDialog: React.FC<InventoryDialogProps> = ({ isOpen, onClose, panelId, initialSlotType, fullConfig, onEquip }) => {
  // State for the active slot being edited (Unified Config)
  const [activeSlot, setActiveSlot] = useState<'data' | 'neural'>(initialSlotType);
  
  // Resolve the specific config for the active slot
  const activeConfig = activeSlot === 'data' ? fullConfig.dataSlot : fullConfig.neuralSlot;
  
  const [selectedLauncher, setSelectedLauncher] = useState<string | null>(activeConfig.launcherId);

  // Update selection when switching slots
  useEffect(() => {
    const config = activeSlot === 'data' ? fullConfig.dataSlot : fullConfig.neuralSlot;
    setSelectedLauncher(config.launcherId);
  }, [activeSlot, fullConfig]);

  // Filter launchers that match the active slot type
  const requiredLauncherType = activeSlot === 'data' ? 'core' : 'neural';
  const compatibleLaunchers = launcherSystem.getCompatible(requiredLauncherType);
  
  // Get current inventory state
  const ownedAmmoList = launcherSystem.getOwnedConsumablesList();
  const ammoCounts: Record<string, number> = {};
  ownedAmmoList.forEach(a => {
    ammoCounts[a.id] = a.unlimited ? 9999 : a.count;
  });

  const handleLauncherClick = (launcherId: string) => {
    if (selectedLauncher !== launcherId) {
      setSelectedLauncher(launcherId);
    }
  };

  const handleEquip = (ammoId: string) => {
    if (!selectedLauncher) return;
    onEquip(panelId, activeSlot, selectedLauncher, ammoId);
    onClose();
  };

  const isHistoricalSupported = PANELS_SUPPORTING_HISTORY.includes(panelId);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`UNIFIED_SLOT_CONFIG: ${panelId}`} variant={activeSlot === 'data' ? 'purple' : 'teal'}>
      <div className="flex flex-col h-[550px] overflow-hidden">
        <div className="flex flex-1 gap-6 overflow-hidden">
          
          {/* LEFT: Unified Launcher Configuration Tree */}
          <div className="w-1/2 border-r border-zinc-900 pr-4 overflow-y-auto no-scroll relative flex flex-col">
            
            {/* SLOT SELECTOR (Top Node) */}
            <div className="mb-6 shrink-0">
               <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-zinc-700 rounded-sm"></div>
                  System_Bus_Selection
               </h4>
               <div className="flex flex-col gap-2">
                  {/* DATA SLOT NODE */}
                  <div 
                    onClick={() => setActiveSlot('data')}
                    className={`relative p-3 border transition-all cursor-pointer flex items-center justify-between group
                      ${activeSlot === 'data' ? 'bg-purple-900/10 border-purple-500 shadow-[inset_0_0_10px_rgba(168,85,247,0.1)]' : 'bg-black border-zinc-800 hover:border-zinc-600'}
                    `}
                  >
                    <div className="flex items-center gap-3">
                       <div className={`w-8 h-8 flex items-center justify-center border border-zinc-800 bg-zinc-950 ${activeSlot === 'data' ? 'text-purple-500' : 'text-zinc-600'}`}>
                          <span className="font-black text-xs">D</span>
                       </div>
                       <div className="flex flex-col">
                          <span className={`text-[10px] font-black uppercase tracking-widest ${activeSlot === 'data' ? 'text-purple-400' : 'text-zinc-500'}`}>Core_Data_Bus</span>
                          <span className="text-[8px] font-mono text-zinc-600">Primary Telemetry Stream</span>
                       </div>
                    </div>
                    {activeSlot === 'data' && <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse"></div>}
                  </div>

                  {/* NEURAL SLOT NODE */}
                  <div 
                    onClick={() => setActiveSlot('neural')}
                    className={`relative p-3 border transition-all cursor-pointer flex items-center justify-between group
                      ${activeSlot === 'neural' ? 'bg-teal-900/10 border-teal-500 shadow-[inset_0_0_10px_rgba(20,184,166,0.1)]' : 'bg-black border-zinc-800 hover:border-zinc-600'}
                    `}
                  >
                    <div className="flex items-center gap-3">
                       <div className={`w-8 h-8 flex items-center justify-center border border-zinc-800 bg-zinc-950 ${activeSlot === 'neural' ? 'text-teal-500' : 'text-zinc-600'}`}>
                          <span className="font-black text-xs">N</span>
                       </div>
                       <div className="flex flex-col">
                          <span className={`text-[10px] font-black uppercase tracking-widest ${activeSlot === 'neural' ? 'text-teal-400' : 'text-zinc-500'}`}>Neural_Uplink</span>
                          <span className="text-[8px] font-mono text-zinc-600">Inference & Context Engine</span>
                       </div>
                    </div>
                    {activeSlot === 'neural' && <div className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-pulse"></div>}
                  </div>
               </div>
            </div>

            {/* HARDWARE TREE (Children) */}
            <div className="flex-1 overflow-y-auto no-scroll relative">
               <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4 sticky top-0 bg-[#080c0d] py-2 z-20 flex justify-between items-center border-b border-zinc-900/50">
                 <span>Available_Hardware</span>
                 <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded-sm ${activeSlot === 'data' ? 'bg-purple-900/20 text-purple-500' : 'bg-teal-900/20 text-teal-500'}`}>
                    [{activeSlot === 'data' ? 'CORE_TYPE' : 'NEURAL_TYPE'}]
                 </span>
               </h4>
               
               <div className="space-y-4 pl-2 pb-4">
                 {compatibleLaunchers.map(l => (
                   <div key={l.id} className="flex flex-col relative group animate-in slide-in-from-left-2 duration-300">
                     {/* Tree Guide Line (Vertical) */}
                     <div className={`absolute left-[11px] top-8 bottom-0 w-[1px] bg-zinc-800 transition-opacity ${selectedLauncher === l.id ? 'opacity-100' : 'opacity-0'}`}></div>

                     <div 
                       onClick={() => handleLauncherClick(l.id)}
                       className={`p-4 border cursor-pointer transition-all flex justify-between items-center relative z-10 ${selectedLauncher === l.id ? 'bg-zinc-900 border-white shadow-lg' : 'bg-black border-zinc-800 hover:border-zinc-600'}`}
                     >
                       <div>
                         <div className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                           <span style={{ color: l.color }}>{l.name}</span>
                           {activeConfig.launcherId === l.id && (
                              <span className="text-[7px] bg-zinc-800 text-zinc-400 px-1 rounded-sm border border-zinc-700">EQUIPPED</span>
                           )}
                         </div>
                         <div className="text-[8px] text-zinc-600 mt-1 font-mono">
                           CHARGES: {l.maxCharges} | RATE: {l.rechargeRate}s | TOKENS: <span className="text-zinc-400">{l.tokens}</span>
                         </div>
                       </div>
                       {/* Selection Indicator */}
                       <div className={`w-2 h-2 border ${selectedLauncher === l.id ? 'bg-white border-white' : 'border-zinc-700 bg-black'}`}></div>
                     </div>
                     
                     {/* Expanded Ammunition List (Tree Branches) */}
                     {selectedLauncher === l.id && (
                       <div className="ml-6 pt-2 space-y-2 animate-in slide-in-from-top-2">
                         {Object.values(PROBE_AMMUNITION)
                           .filter(a => a.compatibleLaunchers.includes(l.type))
                           .filter(a => {
                               // Strict Requirement: Only list Historical Probes for panels that support historical data
                               if (a.features.includes('HISTORY_CSV') && !isHistoricalSupported) return false;
                               return true;
                           })
                           .map(ammo => {
                             const count = ammoCounts[ammo.id] || 0;
                             const isOutOfStock = !ammo.unlimited && count <= 0;
                             const isDisabled = ammo.disabled || isOutOfStock; 
                             const isEquipped = activeConfig.ammoId === ammo.id && activeConfig.launcherId === l.id;
                             
                             return (
                               <div 
                                 key={ammo.id} 
                                 className={`relative p-3 border text-[9px] flex flex-col gap-1 transition-all ml-4 
                                   ${isDisabled 
                                       ? 'opacity-60 bg-zinc-950/50 border-zinc-900 cursor-not-allowed grayscale' 
                                       : 'cursor-pointer hover:bg-zinc-900 bg-black/60 border-zinc-800'} 
                                   ${isEquipped ? (activeSlot === 'data' ? 'border-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.1)]' : 'border-teal-500 shadow-[0_0_10px_rgba(20,184,166,0.1)]') : ''}
                                 `}
                                 onClick={() => !isDisabled && handleEquip(ammo.id)}
                               >
                                 {/* Tree Guide Line (Horizontal) */}
                                 <div className="absolute -left-4 top-1/2 w-4 h-[1px] bg-zinc-800"></div>

                                 <div className="flex justify-between items-center">
                                   <span className={`font-black uppercase tracking-wider ${isDisabled ? 'text-zinc-600' : 'text-zinc-300'}`}>
                                     {ammo.name}
                                   </span>
                                   <div className="flex items-center gap-2">
                                     {ammo.disabled ? (
                                       <span className="text-[7px] text-red-500 border border-red-900/50 px-1 bg-red-950/20">LOCKED</span>
                                     ) : isOutOfStock ? (
                                       <span className="text-[7px] text-yellow-600 border border-yellow-900/50 px-1 bg-yellow-950/20">EMPTY</span>
                                     ) : (
                                       <span className={`text-[8px] font-mono ${ammo.unlimited ? (activeSlot === 'data' ? 'text-purple-500' : 'text-teal-500') : 'text-zinc-400'}`}>
                                         {ammo.unlimited ? '∞' : `x${count}`}
                                       </span>
                                     )}
                                     
                                     {isEquipped && (
                                       <span className={`text-[7px] text-black px-1 font-bold ${activeSlot === 'data' ? 'bg-purple-500' : 'bg-teal-500'}`}>ACTIVE</span>
                                     )}
                                   </div>
                                 </div>
                                 <span className="text-zinc-600 italic leading-tight text-[8px]">{ammo.description}</span>
                                 <div className="flex gap-1 mt-1">
                                     {ammo.features.map(f => (
                                         <span key={f} className={`text-[7px] px-1 border ${isDisabled ? 'border-zinc-900 text-zinc-700' : 'border-zinc-800 bg-zinc-950 text-zinc-500'}`}>{f}</span>
                                     ))}
                                 </div>
                               </div>
                             );
                           })}
                       </div>
                     )}
                   </div>
                 ))}
               </div>
            </div>
          </div>

          {/* RIGHT: Slot Info / Preview */}
          <div className="w-1/2 pl-2 flex flex-col justify-center items-center text-center p-8 bg-zinc-950/30 transition-colors duration-500"
               style={{ borderColor: activeSlot === 'data' ? 'rgba(168,85,247,0.1)' : 'rgba(20,184,166,0.1)', borderWidth: '1px', borderStyle: 'solid' }}>
             
             <div className="mb-6 animate-in fade-in zoom-in-95 duration-300 key={activeSlot}">
                <div className={`w-20 h-20 rounded-full border-2 flex items-center justify-center mb-6 mx-auto transition-all ${activeSlot === 'data' ? 'border-purple-500 text-purple-500 shadow-[0_0_30px_rgba(168,85,247,0.2)] bg-purple-900/10' : 'border-teal-500 text-teal-500 shadow-[0_0_30px_rgba(0,255,213,0.2)] bg-teal-900/10'}`}>
                   <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      {activeSlot === 'data' 
                        ? <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/> 
                        : <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>}
                   </svg>
                </div>
                
                <h3 className={`text-sm font-black uppercase tracking-[0.3em] ${activeSlot === 'data' ? 'text-purple-400' : 'text-teal-400'}`}>
                  {activeSlot === 'data' ? 'CORE_DATA_PROBE' : 'NEURAL_INFERENCE'}
                </h3>
                <span className="text-[9px] font-mono text-zinc-600 block mt-1 uppercase tracking-widest">Slot_Configuration_Matrix</span>
                
                <div className="w-12 h-0.5 bg-zinc-800 mx-auto my-6"></div>
                
                <p className="text-[10px] text-zinc-400 mt-2 max-w-xs mx-auto leading-relaxed border-l-2 border-zinc-800 pl-3 text-left">
                  {activeSlot === 'data' 
                    ? "Configures heavy-lift core probes. Determines payload depth, historical CSV aggregation, and token consumption for deep analysis." 
                    : "Configures the fast-twitch Neural Inference engine. Optimized for lightweight, context-aware tooltips and rapid anomaly scanning."}
                </p>
             </div>

             <div className="w-full border-t border-zinc-900 pt-6 space-y-3">
               <div className="flex justify-between items-center text-[10px] text-zinc-500 mb-2 font-mono uppercase bg-black/40 p-3 border border-zinc-900/50">
                 <span>Active Launcher</span>
                 <span className={`${activeSlot === 'data' ? 'text-purple-400' : 'text-teal-400'} font-black`}>
                    {launcherSystem.getById(activeConfig.launcherId)?.name || 'UNKNOWN'}
                 </span>
               </div>
               <div className="flex justify-between items-center text-[10px] text-zinc-500 font-mono uppercase bg-black/40 p-3 border border-zinc-900/50">
                 <span>Loaded Payload</span>
                 <span className="text-white font-black">{PROBE_AMMUNITION[activeConfig.ammoId]?.name || 'STANDARD'}</span>
               </div>
               {isHistoricalSupported && activeSlot === 'data' && (
                   <div className="text-[9px] text-teal-600 uppercase font-black tracking-widest mt-4 border border-teal-900/30 bg-teal-950/10 p-2 flex items-center justify-center gap-2">
                       <div className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-pulse"></div>
                       [ PANEL_HISTORY_CAPABLE ]
                   </div>
               )}
             </div>
          </div>

        </div>
      </div>
    </Modal>
  );
};

export default InventoryDialog;
