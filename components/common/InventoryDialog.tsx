
import React, { useState } from 'react';
import Modal from './Modal';
import { launcherSystem, CORE_LAUNCHERS, NEURAL_LAUNCHERS } from '../../services/launcherService';
import { Launcher } from '../../types';

interface InventoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSwap: (type: 'core' | 'neural', id: string) => void;
}

const InventoryDialog: React.FC<InventoryDialogProps> = ({ isOpen, onClose, onSwap }) => {
  const [view, setView] = useState<'OWNED' | 'STORE'>('OWNED');

  const renderLauncher = (l: Launcher) => {
    const isOwned = launcherSystem.isOwned(l.id);
    const isActive = launcherSystem.getActive(l.id.includes('core') ? 'core' : 'neural') === l.id;
    
    return (
      <div key={l.id} className={`p-6 border bg-black/40 flex flex-col gap-4 group transition-all ${isActive ? 'border-teal-500 shadow-[0_0_15px_rgba(0,255,213,0.1)]' : 'border-zinc-900 hover:border-zinc-700'}`}>
        <div className="flex justify-between items-start">
          <div className="flex flex-col">
            <span className="text-[11px] font-black uppercase tracking-widest" style={{ color: l.color }}>{l.name}</span>
            <span className="text-[8px] text-zinc-600 font-mono">ID: {l.id}</span>
          </div>
          {isActive && <span className="text-[9px] bg-teal-500 text-black px-2 py-0.5 font-black uppercase">ACTIVE</span>}
        </div>
        <p className="text-[10px] text-zinc-400 italic">"{l.description}"</p>
        <div className="grid grid-cols-2 gap-4 border-t border-zinc-900 pt-4">
           <div className="flex flex-col"><span className="text-[8px] text-zinc-700 uppercase">Max Charges</span><span className="text-[10px] font-black text-white">{l.maxCharges}</span></div>
           <div className="flex flex-col"><span className="text-[8px] text-zinc-700 uppercase">Recharge Rate</span><span className="text-[10px] font-black text-white">{l.rechargeRate}s</span></div>
        </div>
        <div className="mt-2">
          {isOwned ? (
            !isActive && (
              <button 
                onClick={() => onSwap(l.id.includes('core') ? 'core' : 'neural', l.id)}
                className="w-full py-2 border border-zinc-800 text-zinc-500 text-[9px] font-black uppercase hover:bg-white/5 hover:text-white transition-all"
              >
                SWAP_LAUNCHER
              </button>
            )
          ) : (
            <button 
              onClick={() => { launcherSystem.unlock(l.id); setView('OWNED'); }}
              className="w-full py-2 bg-teal-500/10 border border-teal-500 text-teal-400 text-[9px] font-black uppercase hover:bg-teal-500/20 transition-all"
            >
              UNLOCK_MODULE_FREE
            </button>
          )}
        </div>
      </div>
    );
  };

  // Helper to get owned launchers as a flat array of Launcher objects to fix unknown type issues
  const getOwnedLaunchers = (): Launcher[] => {
    return Object.values({...CORE_LAUNCHERS, ...NEURAL_LAUNCHERS}).filter(l => launcherSystem.isOwned(l.id)) as Launcher[];
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="LAUNCHER_INVENTORY" variant="purple">
      <div className="flex flex-col gap-8 h-full">
        <nav className="flex gap-4 border-b border-zinc-900 pb-4">
          <button onClick={() => setView('OWNED')} className={`text-[10px] font-black uppercase tracking-widest px-4 py-1 transition-all ${view === 'OWNED' ? 'text-teal-400 border-b border-teal-400' : 'text-zinc-700'}`}>Owned_Assets</button>
          <button onClick={() => setView('STORE')} className={`text-[10px] font-black uppercase tracking-widest px-4 py-1 transition-all ${view === 'STORE' ? 'text-teal-400 border-b border-teal-400' : 'text-zinc-700'}`}>Neural_Store</button>
        </nav>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto no-scroll">
          {view === 'OWNED' 
            ? getOwnedLaunchers().map(renderLauncher)
            : launcherSystem.getStoreItems().map(renderLauncher)
          }
        </div>
      </div>
    </Modal>
  );
};

export default InventoryDialog;
