
import React, { useState, useMemo } from 'react';
import { Launcher, AppSettings, SlotPermissions, Consumable } from '../types';
import { launcherSystem, PROBE_AMMUNITION } from '../services/launcherService';
import { serverService } from '../services/serverService';
import Card from './common/Card';
import Tooltip from './common/Tooltip';

interface AdminPanelProps {
  allowDistortion?: boolean;
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
}

const SYSTEM_PANELS = [
  'GLOBAL_SYSTEM_PROBE',
  'HANDSHAKE_CORE',
  'ADAPTER_HUB',
  'CONSOLE_DATA_PROBE',
  'NODE_DIAGNOSTICS',
  'PROCESS_PROBE',
  'RSSI_REPORT',
  'SESSION_ARCHIVE',
  'LOG_AUDIT',
  'SENSOR_PANEL'
];

const ITEMS_PER_PAGE = 6;

const AdminPanel: React.FC<AdminPanelProps> = ({ allowDistortion, settings, setSettings }) => {
  const [activeTab, setActiveTab] = useState<'PANELS' | 'LAUNCHERS' | 'CONSUMABLES'>('PANELS');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pagination States
  const [panelPage, setPanelPage] = useState(0);
  const [launcherPage, setLauncherPage] = useState(0);
  const [consumablePage, setConsumablePage] = useState(0);

  const [launchers, setLaunchers] = useState<Launcher[]>(launcherSystem.getAll());
  const [consumables, setConsumables] = useState<Consumable[]>(launcherSystem.getAllConsumables());
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Launcher>>({
    id: '', name: '', type: 'core', description: '', maxCharges: 5, rechargeRate: 60, color: '#00ffd5', compatibleProbes: ['*'], tokens: 2000, baseCooldown: 60000
  });

  const [editingConsumableId, setEditingConsumableId] = useState<string | null>(null);
  const [consumableFormData, setConsumableFormData] = useState<Partial<Consumable>>({
    id: '', name: '', type: 'data', description: '', compatibleLaunchers: ['core'], cost: 1, features: [], unlimited: false, maxStack: 100
  });

  const filteredPanels = useMemo(() => {
    return SYSTEM_PANELS.filter(p => p.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [searchQuery]);

  const filteredLaunchers = useMemo(() => {
    return launchers.filter(l => 
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      l.id.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [launchers, searchQuery]);

  const filteredConsumables = useMemo(() => {
    return consumables.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.id.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [consumables, searchQuery]);

  const handleEdit = (l: Launcher) => {
    setEditingId(l.id);
    setFormData(l);
  };

  const handleSave = () => {
    if (!formData.id || !formData.name) return;
    const newLauncher = formData as Launcher;
    launcherSystem.upsert(newLauncher);
    serverService.initializeLauncher(newLauncher.id, newLauncher.maxCharges);
    setLaunchers(launcherSystem.getAll());
    setEditingId(null);
    setFormData({ id: '', name: '', type: 'core', description: '', maxCharges: 5, rechargeRate: 60, color: '#00ffd5', compatibleProbes: ['*'], tokens: 2000, baseCooldown: 60000 });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Permanently decommission this launcher module?')) {
      launcherSystem.delete(id);
      setLaunchers(launcherSystem.getAll());
    }
  };

  const handleEditConsumable = (c: Consumable) => {
    setEditingConsumableId(c.id);
    setConsumableFormData(c);
  };

  const handleSaveConsumable = () => {
    if (!consumableFormData.id || !consumableFormData.name) return;
    const newConsumable = consumableFormData as Consumable;
    launcherSystem.upsertConsumable(newConsumable);
    setConsumables(launcherSystem.getAllConsumables());
    setEditingConsumableId(null);
    setConsumableFormData({ id: '', name: '', type: 'data', description: '', compatibleLaunchers: ['core'], cost: 1, features: [], unlimited: false, maxStack: 100 });
  };

  const handleDeleteConsumable = (id: string) => {
    if (window.confirm('Permanently purge this consumable from manifest?')) {
      launcherSystem.deleteConsumable(id);
      setConsumables(launcherSystem.getAllConsumables());
    }
  };

  const togglePanelSlot = (panelId: string, slot: keyof SlotPermissions) => {
    setSettings(prev => {
      const current = prev.slotPermissions[panelId] || { low: true, probe: true, sensor: true };
      return {
        ...prev,
        slotPermissions: {
          ...prev.slotPermissions,
          [panelId]: { ...current, [slot]: !current[slot] }
        }
      };
    });
  };

  const renderPagination = (total: number, current: number, set: (n: number) => void) => {
    const pages = Math.ceil(total / ITEMS_PER_PAGE);
    if (pages <= 1) return null;
    return (
      <div className="flex items-center justify-center gap-2 mt-4 pb-2">
        <button 
          onClick={() => set(Math.max(0, current - 1))}
          disabled={current === 0}
          className="w-8 h-8 flex items-center justify-center border border-zinc-800 text-zinc-500 hover:text-white disabled:opacity-20 transition-all"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7"/></svg>
        </button>
        <span className="text-[10px] font-mono text-zinc-600 font-bold uppercase tracking-widest">Page {current + 1} / {pages}</span>
        <button 
          onClick={() => set(Math.min(pages - 1, current + 1))}
          disabled={current >= pages - 1}
          className="w-8 h-8 flex items-center justify-center border border-zinc-800 text-zinc-500 hover:text-white disabled:opacity-20 transition-all"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7"/></svg>
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in h-full flex flex-col overflow-hidden pb-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center px-2 gap-4 shrink-0">
        <h2 className="text-xl font-black text-white uppercase tracking-[0.3em] shrink-0">System_Administration</h2>
        <div className="flex flex-1 w-full md:w-auto items-center gap-4">
          <input 
            type="text" 
            placeholder={`FILTER_${activeTab}...`} 
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPanelPage(0); setLauncherPage(0); setConsumablePage(0);
            }}
            className="flex-1 max-w-xs bg-black border border-zinc-800 p-2 text-[10px] text-zinc-400 font-mono outline-none focus:border-teal-500/50"
          />
          <div className="flex border border-zinc-900 h-10 overflow-hidden shrink-0">
             {(['PANELS', 'LAUNCHERS', 'CONSUMABLES'] as const).map((t) => (
               <button 
                  key={t} onClick={() => { setActiveTab(t); setSearchQuery(''); }}
                  className={`px-4 text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === t ? 'bg-teal-500/20 text-teal-400' : 'text-zinc-600 hover:text-white'}`}
               >
                  {t}
               </button>
             ))}
          </div>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 overflow-hidden">
        
        {activeTab === 'PANELS' && (
            <div className="w-full flex flex-col overflow-hidden">
              <Card id="admin_slot_management" title="PANEL_INFRASTRUCTURE_CONTROL" variant="purple" allowDistortion={allowDistortion} className="flex-1 overflow-hidden">
                  <div className="flex flex-col h-full overflow-hidden">
                      <p className="text-[9px] text-zinc-500 italic mb-6 border-b border-zinc-900 pb-4 shrink-0">
                        Map hardware interfaces and review equipment status per tactical node. 
                        Toggling tiers here will immediately restrict or permit slot availability on the dashboard.
                      </p>
                      
                      <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {filteredPanels.slice(panelPage * ITEMS_PER_PAGE, (panelPage + 1) * ITEMS_PER_PAGE).map(panelId => {
                                const perms = settings.slotPermissions[panelId] || { low: true, probe: true, sensor: true };
                                const slotConfig = settings.panelSlots[panelId];
                                const hasSensorSupport = panelId === 'SENSOR_PANEL';
                                
                                return (
                                    <div key={panelId} className="p-4 border border-zinc-900 bg-black/40 flex flex-col gap-4 group hover:border-zinc-700 transition-all shadow-lg">
                                        <div className="flex justify-between items-start">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black text-zinc-400 group-hover:text-white transition-colors uppercase">{panelId}</span>
                                                <span className="text-[7px] text-zinc-700 font-mono mt-0.5">0x{panelId.length.toString(16).toUpperCase()}_NODE</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 px-2 py-0.5 border border-zinc-800 bg-zinc-900/50">
                                              <div className="w-1 h-1 bg-teal-500 rounded-full animate-pulse"></div>
                                              <span className="text-[7px] font-black text-zinc-500 uppercase">ACTIVE</span>
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-3">
                                            {(['low', 'probe', 'sensor'] as const).map(slot => {
                                                if (slot === 'sensor' && !hasSensorSupport) return null;
                                                const active = perms[slot];
                                                
                                                // Identify current equipment for the slot
                                                let equippedId = 'NONE';
                                                let equippedAmmo = '';
                                                if (slot === 'low') {
                                                  equippedId = settings.globalLowSlot.launcherId;
                                                  equippedAmmo = settings.globalLowSlot.ammoId;
                                                } else if (slot === 'probe' && slotConfig?.probeSlot) {
                                                  equippedId = slotConfig.probeSlot.launcherId;
                                                  equippedAmmo = slotConfig.probeSlot.ammoId;
                                                } else if (slot === 'sensor' && slotConfig?.sensorSlot) {
                                                  equippedId = slotConfig.sensorSlot.launcherId;
                                                  equippedAmmo = slotConfig.sensorSlot.ammoId;
                                                }

                                                return (
                                                    <div key={slot} className="flex flex-col gap-1.5">
                                                        <div className="flex justify-between items-center px-1">
                                                            <span className="text-[8px] font-black text-zinc-600 uppercase">{slot}_TIER</span>
                                                            <button 
                                                                onClick={() => togglePanelSlot(panelId, slot)}
                                                                className={`text-[7px] font-black px-1.5 py-0.5 border uppercase transition-all ${active ? 'border-teal-500/50 text-teal-400' : 'border-red-900/50 text-red-900'}`}
                                                            >
                                                                {active ? 'PERMITTED' : 'BLOCKED'}
                                                            </button>
                                                        </div>
                                                        <div className={`p-2 border bg-black/60 flex flex-col gap-1 ${active ? 'border-zinc-800' : 'border-red-950/20 opacity-30 grayscale'}`}>
                                                            <div className="flex justify-between items-center text-[8px] font-mono">
                                                                <span className="text-zinc-700">Launcher:</span>
                                                                <span className="text-zinc-400 font-bold">{equippedId || 'NULL'}</span>
                                                            </div>
                                                            <div className="flex justify-between items-center text-[8px] font-mono">
                                                                <span className="text-zinc-700">Script:</span>
                                                                <span className="text-zinc-500">{equippedAmmo || '—'}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                              })}
                          </div>
                      </div>
                      <div className="shrink-0">
                        {renderPagination(filteredPanels.length, panelPage, setPanelPage)}
                      </div>
                  </div>
              </Card>
            </div>
        )}

        {activeTab === 'LAUNCHERS' && (
            <>
            <div className="w-full lg:w-1/2 flex flex-col overflow-hidden">
                <Card id="admin_launcher_editor" title={editingId ? 'EDIT_LAUNCHER_MODULE' : 'NEW_LAUNCHER_MODULE'} variant="teal" allowDistortion={allowDistortion} className="flex-1 overflow-hidden">
                    <div className="space-y-4 overflow-y-auto pr-2 flex-1 scrollbar-thin">
                      <div className="grid grid-cols-2 gap-4">
                          <div className="flex flex-col gap-1">
                            <label className="text-[8px] text-zinc-700 uppercase font-black">ID_Vector</label>
                            <input value={formData.id} disabled={!!editingId} onChange={e => setFormData({...formData, id: e.target.value})} className="bg-black border border-zinc-900 p-2 text-[10px] text-zinc-400 font-mono outline-none focus:border-teal-500/30" placeholder="e.g. ultra-core" />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[8px] text-zinc-700 uppercase font-black">Module_Name</label>
                            <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="bg-black border border-zinc-900 p-2 text-[10px] text-zinc-400 font-mono outline-none focus:border-teal-500/30" placeholder="Display Name" />
                          </div>
                      </div>
                      <div className="flex flex-col gap-1">
                          <label className="text-[8px] text-zinc-700 uppercase font-black">Launcher_Type</label>
                          <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})} className="bg-black border border-zinc-900 p-2 text-[10px] text-zinc-400 font-mono outline-none">
                            <option value="core">CORE (Data)</option>
                            <option value="neural">NEURAL (Brain)</option>
                            <option value="sensor-module">SENSOR (Hardware)</option>
                          </select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                          <label className="text-[8px] text-zinc-700 uppercase font-black">Max_Charges</label>
                          <input type="number" value={formData.maxCharges} onChange={e => setFormData({...formData, maxCharges: Number(e.target.value)})} className="bg-black border border-zinc-900 p-2 text-[10px] text-zinc-400 font-mono outline-none" />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[8px] text-zinc-700 uppercase font-black">Recharge_Rate (sec)</label>
                          <input type="number" value={formData.rechargeRate} onChange={e => setFormData({...formData, rechargeRate: Number(e.target.value)})} className="bg-black border border-zinc-900 p-2 text-[10px] text-zinc-400 font-mono outline-none" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                          <label className="text-[8px] text-zinc-700 uppercase font-black">Capacity_Limit (Tokens)</label>
                          <input type="number" value={formData.tokens} onChange={e => setFormData({...formData, tokens: Number(e.target.value)})} className="bg-black border border-zinc-900 p-2 text-[10px] text-zinc-400 font-mono outline-none" />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[8px] text-zinc-700 uppercase font-black">Base_Cooldown (ms)</label>
                          <input type="number" value={formData.baseCooldown} onChange={e => setFormData({...formData, baseCooldown: Number(e.target.value)})} className="bg-black border border-zinc-900 p-2 text-[10px] text-zinc-400 font-mono outline-none" />
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[8px] text-zinc-700 uppercase font-black">Accent_Color (Hex)</label>
                        <input value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})} className="bg-black border border-zinc-900 p-2 text-[10px] text-zinc-400 font-mono outline-none" placeholder="#00ffd5" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[8px] text-zinc-700 uppercase font-black">Module_Description</label>
                        <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="bg-black border border-zinc-900 p-2 text-[10px] text-zinc-400 font-mono outline-none h-20 resize-none" placeholder="..." />
                      </div>
                    </div>
                    <div className="mt-4 space-y-2 shrink-0">
                      <button onClick={handleSave} className="w-full py-4 bg-teal-500/10 border border-teal-500/40 text-teal-400 text-[10px] font-black uppercase tracking-[0.4em] hover:bg-teal-500/20 transition-all shadow-[0_0_15px_rgba(0,255,213,0.1)]">
                          {editingId ? 'COMMIT_CHANGES' : 'INITIALIZE_MODULE'}
                      </button>
                      {editingId && <button onClick={() => setEditingId(null)} className="w-full py-2 text-zinc-700 text-[8px] uppercase font-black hover:text-white transition-colors">Cancel_Edit</button>}
                    </div>
                </Card>
            </div>
            <div className="w-full lg:w-1/2 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
                    <h4 className="text-[9px] font-black text-zinc-700 uppercase tracking-[0.2em] px-2 sticky top-0 bg-[#020406] py-1 z-10">Hardware_Manifest</h4>
                    {filteredLaunchers.slice(launcherPage * ITEMS_PER_PAGE, (launcherPage + 1) * ITEMS_PER_PAGE).map(l => (
                        <div key={l.id} className={`p-4 border bg-zinc-950/40 flex justify-between items-center group transition-all shadow-md ${editingId === l.id ? 'border-teal-500 bg-teal-500/5' : 'border-zinc-900'}`}>
                          <div className="flex flex-col">
                              <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: l.color }}>{l.name}</span>
                              <span className="text-[7px] text-zinc-800 font-mono uppercase">ID: {l.id} | TYPE: {l.type} | CTX: {l.tokens}</span>
                          </div>
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => handleEdit(l)} className="text-[8px] text-zinc-600 hover:text-teal-400 uppercase font-black border border-zinc-900 px-2 py-1 bg-black">Edit</button>
                              <button onClick={() => handleDelete(l.id)} className="text-[8px] text-zinc-600 hover:text-red-500 uppercase font-black border border-zinc-900 px-2 py-1 bg-black">Purge</button>
                          </div>
                        </div>
                    ))}
                    {filteredLaunchers.length === 0 && <div className="text-center py-20 text-zinc-800 font-black uppercase tracking-widest text-xs border border-dashed border-zinc-900">No matching items</div>}
                </div>
                <div className="shrink-0">
                  {renderPagination(filteredLaunchers.length, launcherPage, setLauncherPage)}
                </div>
            </div>
            </>
        )}

        {activeTab === 'CONSUMABLES' && (
            <>
            <div className="w-full lg:w-1/2 flex flex-col overflow-hidden">
                <Card id="admin_consumable_editor" title={editingConsumableId ? 'EDIT_CONSUMABLE' : 'NEW_CONSUMABLE'} variant="blue" allowDistortion={allowDistortion} className="flex-1 overflow-hidden">
                    <div className="space-y-4 overflow-y-auto pr-2 flex-1 scrollbar-thin">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1">
                                <label className="text-[8px] text-zinc-700 uppercase font-black">ID_Vector</label>
                                <input value={consumableFormData.id} disabled={!!editingConsumableId} onChange={e => setConsumableFormData({...consumableFormData, id: e.target.value})} className="bg-black border border-zinc-900 p-2 text-[10px] text-zinc-400 font-mono outline-none focus:border-teal-500/30" placeholder="e.g. ammo-x" />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-[8px] text-zinc-700 uppercase font-black">Consumable_Name</label>
                                <input value={consumableFormData.name} onChange={e => setConsumableFormData({...consumableFormData, name: e.target.value})} className="bg-black border border-zinc-900 p-2 text-[10px] text-zinc-400 font-mono outline-none focus:border-teal-500/30" placeholder="Display Name" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex flex-col gap-1">
                              <label className="text-[8px] text-zinc-700 uppercase font-black">Type</label>
                              <select value={consumableFormData.type} onChange={e => setConsumableFormData({...consumableFormData, type: e.target.value as any})} className="bg-black border border-zinc-900 p-2 text-[10px] text-zinc-400 font-mono outline-none">
                                  <option value="data">DATA (Standard)</option>
                                  <option value="neural">NEURAL (Inference)</option>
                                  <option value="booster">BOOSTER (Special)</option>
                                  <option value="module-core">MODULE CORE (Hardware)</option>
                              </select>
                          </div>
                          <div className="flex flex-col gap-1">
                              <label className="text-[8px] text-zinc-700 uppercase font-black">Slot_Charge_Cost</label>
                              <input type="number" value={consumableFormData.cost} onChange={e => setConsumableFormData({...consumableFormData, cost: Number(e.target.value)})} className="bg-black border border-zinc-900 p-2 text-[10px] text-zinc-400 font-mono outline-none" />
                          </div>
                        </div>
                        <div className="flex items-center gap-6 py-2">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={consumableFormData.unlimited} onChange={e => setConsumableFormData({...consumableFormData, unlimited: e.target.checked})} className="hidden" />
                            <div className={`w-4 h-4 border flex items-center justify-center ${consumableFormData.unlimited ? 'border-teal-500 bg-teal-500/20' : 'border-zinc-800 bg-black'}`}>
                              {consumableFormData.unlimited && <div className="w-2 h-2 bg-teal-400"></div>}
                            </div>
                            <span className="text-[10px] font-black uppercase text-zinc-500">Unlimited_Stock</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={consumableFormData.disabled} onChange={e => setConsumableFormData({...consumableFormData, disabled: e.target.checked})} className="hidden" />
                            <div className={`w-4 h-4 border flex items-center justify-center ${consumableFormData.disabled ? 'border-red-500 bg-red-500/20' : 'border-zinc-800 bg-black'}`}>
                              {consumableFormData.disabled && <div className="w-2 h-2 bg-red-400"></div>}
                            </div>
                            <span className="text-[10px] font-black uppercase text-zinc-500">Decommissioned</span>
                          </label>
                        </div>
                        {!consumableFormData.unlimited && (
                          <div className="flex flex-col gap-1">
                            <label className="text-[8px] text-zinc-700 uppercase font-black">Max_Stack</label>
                            <input type="number" value={consumableFormData.maxStack} onChange={e => setConsumableFormData({...consumableFormData, maxStack: Number(e.target.value)})} className="bg-black border border-zinc-900 p-2 text-[10px] text-zinc-400 font-mono outline-none" />
                          </div>
                        )}
                        <div className="flex flex-col gap-1">
                            <label className="text-[8px] text-zinc-700 uppercase font-black">Description</label>
                            <textarea value={consumableFormData.description} onChange={e => setConsumableFormData({...consumableFormData, description: e.target.value})} className="bg-black border border-zinc-900 p-2 text-[10px] text-zinc-400 font-mono outline-none h-20 resize-none" placeholder="..." />
                        </div>
                    </div>
                    <div className="mt-4 space-y-2 shrink-0">
                      <button onClick={handleSaveConsumable} className="w-full py-4 bg-blue-500/10 border border-blue-500/40 text-blue-400 text-[10px] font-black uppercase tracking-[0.4em] hover:bg-blue-500/20 transition-all shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                          {editingConsumableId ? 'COMMIT_CHANGES' : 'INITIALIZE_CONSUMABLE'}
                      </button>
                      {editingConsumableId && <button onClick={() => setEditingConsumableId(null)} className="w-full py-2 text-zinc-700 text-[8px] uppercase font-black hover:text-white transition-colors">Cancel_Edit</button>}
                    </div>
                </Card>
            </div>
            <div className="w-full lg:w-1/2 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
                    <h4 className="text-[9px] font-black text-zinc-700 uppercase tracking-[0.2em] px-2 sticky top-0 bg-[#020406] py-1 z-10">Consumable_Inventory</h4>
                    {filteredConsumables.slice(consumablePage * ITEMS_PER_PAGE, (consumablePage + 1) * ITEMS_PER_PAGE).map(c => (
                        <div key={c.id} className={`p-4 border bg-zinc-950/40 flex justify-between items-center group transition-all shadow-md ${editingConsumableId === c.id ? 'border-blue-500 bg-blue-500/5' : 'border-zinc-900'}`}>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-200">{c.name}</span>
                                <span className="text-[7px] text-zinc-800 font-mono uppercase">ID: {c.id} | TYPE: {c.type} | STOCK: {c.unlimited ? '∞' : 'LIMITED'}</span>
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleEditConsumable(c)} className="text-[8px] text-zinc-600 hover:text-teal-400 uppercase font-black border border-zinc-900 px-2 py-1 bg-black">Edit</button>
                                <button onClick={() => handleDeleteConsumable(c.id)} className="text-[8px] text-zinc-600 hover:text-red-500 uppercase font-black border border-zinc-900 px-2 py-1 bg-black">Purge</button>
                            </div>
                        </div>
                    ))}
                    {filteredConsumables.length === 0 && <div className="text-center py-20 text-zinc-800 font-black uppercase tracking-widest text-xs border border-dashed border-zinc-900">No matching items</div>}
                </div>
                <div className="shrink-0">
                  {renderPagination(filteredConsumables.length, consumablePage, setConsumablePage)}
                </div>
            </div>
            </>
        )}

      </div>
    </div>
  );
};

export default AdminPanel;
