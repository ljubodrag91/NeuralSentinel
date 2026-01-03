import React, { useState } from 'react';
import { launcherSystem } from '../services/launcherService';
import Tooltip from './common/Tooltip';
import { PanelSlotConfig } from '../types';

interface InventoryListProps {
  panelSlots?: Record<string, PanelSlotConfig>;
}

type InventoryTab = 'AMMO' | 'MODULES' | 'OTHER';

const InventoryList: React.FC<InventoryListProps> = ({ panelSlots }) => {
  const [activeTab, setActiveTab] = useState<InventoryTab>('AMMO');
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  const ownedLaunchers = launcherSystem.getOwnedLaunchersList();
  const ownedAmmo = launcherSystem.getOwnedAmmoList();

  // Helper to calculate how many panels are using this item
  const getAssignmentCount = (id: string) => {
    if (!panelSlots) return 0;
    let count = 0;
    Object.values(panelSlots).forEach((slot: PanelSlotConfig) => {
      if (slot.dataSlot?.launcherId === id) count++;
      if (slot.dataSlot?.ammoId === id) count++;
      if (slot.neuralSlot?.launcherId === id) count++;
      if (slot.neuralSlot?.ammoId === id) count++;
    });
    return count;
  };

  const renderCard = (item: any, type: 'module' | 'ammo') => {
    const isSelected = selectedItem === item.id;
    const assignmentCount = getAssignmentCount(item.id);
    const isAssigned = assignmentCount > 0;
    
    // Aesthetic variables based on type
    const accentColor = type === 'module' ? item.color || '#bd00ff' : (item.unlimited ? '#00ffd5' : '#ffaa00');
    const borderColor = isSelected ? accentColor : '#27272a'; // zinc-800
    const glowClass = type === 'module' ? 'glow-purple' : 'glow-teal';

    return (
      <Tooltip 
        key={item.id} 
        name={item.name} 
        source="INVENTORY" 
        desc={`${item.description}\n\n[STATUS]: ${isAssigned ? `ACTIVE_ON_${assignmentCount}_PANELS` : 'READY_FOR_ASSIGNMENT'}`}
        variant={type === 'module' ? 'purple' : 'teal'}
      >
        <div 
          onClick={() => setSelectedItem(item.id)}
          className={`
            relative p-4 border bg-black/60 backdrop-blur-sm flex flex-col gap-3 transition-all duration-300 group cursor-pointer overflow-hidden
            ${isSelected ? 'shadow-[0_0_20px_rgba(0,0,0,0.5)]' : 'hover:border-zinc-600'}
          `}
          style={{ 
            borderColor: borderColor,
            boxShadow: isSelected ? `inset 0 0 20px ${accentColor}11` : 'none'
          }}
        >
          {/* Scanline Overlay */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-0"></div>
          
          {/* Header */}
          <div className="flex justify-between items-start relative z-10">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 flex items-center justify-center border border-zinc-800 bg-zinc-950 rounded-sm ${isSelected ? glowClass : ''}`}>
                 {type === 'module' ? (
                   <svg className="w-4 h-4" style={{ color: accentColor }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                 ) : (
                   <svg className="w-4 h-4" style={{ color: accentColor }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                 )}
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-200 group-hover:text-white transition-colors truncate max-w-[120px]">
                  {item.name}
                </span>
                <span className="text-[7px] font-mono text-zinc-600 uppercase">
                  {type === 'module' ? `ID: ${item.id}` : `TYPE: ${item.type}`}
                </span>
              </div>
            </div>
            
            {/* Assignment Badge */}
            {isAssigned && (
              <div className="flex items-center gap-1 px-1.5 py-0.5 bg-zinc-900 border border-zinc-800">
                <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-[7px] font-black text-zinc-500 uppercase tracking-wider">EQUIPPED</span>
              </div>
            )}
          </div>

          {/* Body Stats */}
          <div className="grid grid-cols-2 gap-2 relative z-10 mt-1">
             <div className="bg-zinc-950/50 p-2 border border-zinc-900 flex flex-col">
                <span className="text-[7px] text-zinc-600 font-black uppercase">Capacity</span>
                <span className="text-[9px] font-mono text-zinc-300">
                  {type === 'module' ? `${item.maxCharges} CHG` : (item.unlimited ? '∞' : `x${item.count}`)}
                </span>
             </div>
             <div className="bg-zinc-950/50 p-2 border border-zinc-900 flex flex-col">
                <span className="text-[7px] text-zinc-600 font-black uppercase">{type === 'module' ? 'Rate' : 'Cost'}</span>
                <span className="text-[9px] font-mono text-zinc-300">
                  {type === 'module' ? `${item.rechargeRate}s` : `${item.cost} CHG`}
                </span>
             </div>
          </div>

          {/* Footer Features */}
          {type === 'ammo' && item.features && (
            <div className="flex flex-wrap gap-1 mt-1 relative z-10">
              {item.features.map((f: string) => (
                <span key={f} className="text-[6px] font-black bg-zinc-900 text-zinc-500 px-1 py-0.5 border border-zinc-800 uppercase tracking-wider">
                  {f}
                </span>
              ))}
            </div>
          )}

          {/* Selection Highlight Bar */}
          {isSelected && (
            <div className="absolute bottom-0 left-0 w-full h-0.5" style={{ backgroundColor: accentColor }}></div>
          )}
        </div>
      </Tooltip>
    );
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Tab Header */}
      <div className="flex border-b border-zinc-900 mb-6 shrink-0">
        {(['AMMO', 'MODULES', 'OTHER'] as InventoryTab[]).map(tab => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setSelectedItem(null); }}
            className={`
              flex-1 py-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative
              ${activeTab === tab 
                ? 'text-teal-400 bg-teal-950/10' 
                : 'text-zinc-600 hover:text-zinc-300 hover:bg-zinc-900/40'}
            `}
          >
            {tab}
            {activeTab === tab && (
              <div className="absolute bottom-0 left-0 w-full h-[2px] bg-teal-500 shadow-[0_0_10px_#00ffd5]"></div>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto no-scroll pr-2 pb-4">
        
        {activeTab === 'MODULES' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-bottom-2 duration-300">
            {ownedLaunchers.map(l => renderCard(l, 'module'))}
          </div>
        )}

        {activeTab === 'AMMO' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-bottom-2 duration-300">
            {ownedAmmo.map(a => renderCard(a, 'ammo'))}
          </div>
        )}

        {activeTab === 'OTHER' && (
          <div className="flex flex-col items-center justify-center h-48 border border-dashed border-zinc-800 bg-zinc-950/30 rounded-sm animate-in fade-in zoom-in-95">
             <div className="w-12 h-12 mb-4 text-zinc-800 opacity-50">
               <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M20 7h-9m3 10H5m15-5h-5m3-8l3 3m0 0l-3 3m3-3H3"/></svg>
             </div>
             <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-700">Storage_Sector_Empty</span>
             <span className="text-[8px] font-mono text-zinc-600 mt-2">No miscellaneous artifacts or keycards found.</span>
          </div>
        )}

      </div>
      
      {/* Footer Info */}
      <div className="border-t border-zinc-900 pt-3 flex justify-between items-center text-[9px] font-mono text-zinc-600 shrink-0">
         <span>STORAGE_CAPACITY: 128TB</span>
         <span>SECURE_HASH: 0x99F2A1</span>
      </div>
    </div>
  );
};

export default InventoryList;