
import React, { useState } from 'react';
import Modal from './Modal';
import { launcherSystem, PROBE_AMMUNITION, PANELS_SUPPORTING_HISTORY } from '../../services/launcherService';
import { Launcher, ProbeAmmunition } from '../../types';

interface InventoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  panelId: string;
  slotType: 'data' | 'neural';
  currentConfig: { launcherId: string, ammoId: string };
  onEquip: (panelId: string, slotType: 'data' | 'neural', launcherId: string, ammoId: string) => void;
}

const InventoryDialog: React.FC<InventoryDialogProps> = ({ isOpen, onClose, panelId, slotType, currentConfig, onEquip }) => {
  const [selectedLauncher, setSelectedLauncher] = useState<string | null>(currentConfig.launcherId);

  // Filter launchers that match the slot type (Core -> Data Slot, Neural -> Neural Slot)
  const requiredLauncherType = slotType === 'data' ? 'core' : 'neural';
  
  const compatibleLaunchers = launcherSystem.getCompatible(requiredLauncherType);
  
  // Get current inventory state
  const ownedAmmoList = launcherSystem.getOwnedAmmoList();
  // Create a map for quick lookup of counts
  const ammoCounts: Record<string, number> = {};
  ownedAmmoList.forEach(a => {
    ammoCounts[a.id] = a.unlimited ? 9999 : a.count;
  });

  const handleLauncherClick = (launcherId: string) => {
    if (selectedLauncher === launcherId) {
      // Toggle off only if we want to allow deselecting (optional)
      // setSelectedLauncher(null); 
    } else {
      setSelectedLauncher(launcherId);
    }
  };

  const handleEquip = (ammoId: string) => {
    if (!selectedLauncher) return;
    onEquip(panelId, slotType, selectedLauncher, ammoId);
    onClose();
  };

  const isHistoricalSupported = PANELS_SUPPORTING_HISTORY.includes(panelId);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`SLOT_CONFIG: ${panelId} [${slotType.toUpperCase()}]`} variant={slotType === 'data' ? 'purple' : 'teal'}>
      <div className="flex flex-col h-[500px] overflow-hidden">
        <div className="flex flex-1 gap-6 overflow-hidden">
          
          {/* LEFT: Unified Launcher Configuration Tree */}
          <div className="w-1/2 border-r border-zinc-900 pr-4 overflow-y-auto no-scroll relative">
            <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4 sticky top-0 bg-[#080c0d] py-2 z-20 flex justify-between items-center">
              <span>Select_Launcher_Platform</span>
              <span className="text-[8px] text-zinc-700 font-mono">[{slotType === 'data' ? 'CORE' : 'NEURAL'}]</span>
            </h4>
            
            <div className="space-y-4 pl-2">
              {compatibleLaunchers.map(l => (
                <div key={l.id} className="flex flex-col relative group">
                  {/* Tree Guide Line (Vertical) */}
                  <div className={`absolute left-[11px] top-8 bottom-0 w-[1px] bg-zinc-800 transition-opacity ${selectedLauncher === l.id ? 'opacity-100' : 'opacity-0'}`}></div>

                  <div 
                    onClick={() => handleLauncherClick(l.id)}
                    className={`p-4 border cursor-pointer transition-all flex justify-between items-center relative z-10 ${selectedLauncher === l.id ? 'bg-zinc-900 border-white shadow-lg' : 'bg-black border-zinc-800 hover:border-zinc-600'}`}
                  >
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                        <span style={{ color: l.color }}>{l.name}</span>
                        {currentConfig.launcherId === l.id && (
                           <span className="text-[7px] bg-zinc-800 text-zinc-400 px-1 rounded-sm">ACTIVE</span>
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
                          const isDisabled = ammo.disabled || isOutOfStock; // Disabled if explicitly disabled (Thermal) or empty
                          const isEquipped = currentConfig.ammoId === ammo.id && currentConfig.launcherId === l.id;
                          
                          return (
                            <div 
                              key={ammo.id} 
                              className={`relative p-3 border text-[9px] flex flex-col gap-1 transition-all ml-4 
                                ${isDisabled 
                                    ? 'opacity-60 bg-zinc-950/50 border-zinc-900 cursor-not-allowed grayscale' 
                                    : 'cursor-pointer hover:bg-zinc-900 bg-black/60 border-zinc-800'} 
                                ${isEquipped ? 'border-teal-500 shadow-[0_0_10px_rgba(20,184,166,0.1)]' : ''}
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
                                    <span className={`text-[8px] font-mono ${ammo.unlimited ? 'text-teal-500' : 'text-zinc-400'}`}>
                                      {ammo.unlimited ? '∞' : `x${count}`}
                                    </span>
                                  )}
                                  
                                  {isEquipped && (
                                    <span className="text-[7px] text-black bg-teal-500 px-1 font-bold">EQUIPPED</span>
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

          {/* RIGHT: Slot Info / Preview */}
          <div className="w-1/2 pl-2 flex flex-col justify-center items-center text-center p-8 bg-zinc-950/30">
             <div className="mb-6">
                <div className={`w-16 h-16 rounded-full border-2 flex items-center justify-center mb-4 mx-auto transition-all ${slotType === 'data' ? 'border-purple-500 text-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.2)]' : 'border-teal-500 text-teal-500 shadow-[0_0_20px_rgba(0,255,213,0.2)]'}`}>
                   <span className="text-2xl font-black">{slotType === 'data' ? 'D' : 'N'}</span>
                </div>
                <h3 className="text-xs font-black text-white uppercase tracking-[0.3em]">{slotType}_SLOT_CONFIGURATION</h3>
                <div className="w-8 h-0.5 bg-zinc-800 mx-auto my-3"></div>
                <p className="text-[9px] text-zinc-500 mt-2 max-w-xs mx-auto leading-relaxed">
                  {slotType === 'data' 
                    ? "Configures the heavy-lift Data Probe mechanism. Determines payload size, history depth, and analysis cost." 
                    : "Configures the Neural Inference engine. Optimized for lightweight, context-aware tooltips and quick scans."}
                </p>
             </div>

             <div className="w-full border-t border-zinc-900 pt-6 space-y-2">
               <div className="flex justify-between items-center text-[9px] text-zinc-600 mb-2 font-mono uppercase bg-black/40 p-2 border border-zinc-900/50">
                 <span>Active Launcher</span>
                 <span className="text-white font-black">{launcherSystem.getById(currentConfig.launcherId)?.name || 'UNKNOWN'}</span>
               </div>
               <div className="flex justify-between items-center text-[9px] text-zinc-600 font-mono uppercase bg-black/40 p-2 border border-zinc-900/50">
                 <span>Loaded Ammunition</span>
                 <span className="text-white font-black">{PROBE_AMMUNITION[currentConfig.ammoId]?.name || 'STANDARD'}</span>
               </div>
               {isHistoricalSupported && slotType === 'data' && (
                   <div className="text-[8px] text-teal-600 uppercase font-black tracking-widest mt-2 border border-teal-900/30 bg-teal-950/10 p-1">
                       [ PANEL_HISTORY_ENABLED ]
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
