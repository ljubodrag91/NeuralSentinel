import React, { useState, useMemo } from 'react';
import { Launcher, AppSettings, SlotPermissions, Consumable, SlotConfig } from '../types';
import { launcherSystem, PROBE_AMMUNITION } from '../services/launcherService';
import { serverService } from '../services/serverService';
import Card from './common/Card';
import Tooltip from './common/Tooltip';

interface AdminPanelProps {
  allowDistortion?: boolean;
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  onProbe: (panel: string, data: any) => void;
  onBrain: (id: string, type: string, metrics: any) => void;
  onLauncherSelect: (id: string, type: 'low' | 'probe') => void;
  processingId?: string;
}

const PANEL_GROUPS: Record<string, string[]> = {
  'DASHBOARD': ['GLOBAL_SYSTEM_PROBE', 'HANDSHAKE_CORE', 'ADAPTER_HUB', 'CONSOLE_DATA_PROBE'],
  'TELEMETRY': ['RSSI_REPORT'],
  'CORE_STATS': ['NODE_DIAGNOSTICS', 'PROCESS_PROBE'],
  'SCANNER': ['SENSOR_PANEL'],
  'HISTORY': ['SESSION_ARCHIVE'],
  'SYSTEM': ['LOG_AUDIT', 'ADMIN_PANEL']
};

const ITEMS_PER_PAGE = 6;

const AdminPanel: React.FC<AdminPanelProps> = ({ allowDistortion, settings, setSettings, onProbe, onBrain, onLauncherSelect, processingId }) => {
  const [activeTab, setActiveTab] = useState<'PANELS' | 'LAUNCHERS' | 'CONSUMABLES'>('PANELS');
  const [launcherSubTab, setLauncherSubTab] = useState<'LAUNCHER' | 'SENSOR'>('LAUNCHER');
  const [consumableSubTab, setConsumableSubTab] = useState<'PROBE' | 'SCRIPT' | 'BOOSTER'>('PROBE');
  const [searchQuery, setSearchQuery] = useState('');
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

  const filteredLaunchers = useMemo(() => {
    return launchers.filter(l => {
      const matchesSearch = l.name.toLowerCase().includes(searchQuery.toLowerCase()) || l.id.toLowerCase().includes(searchQuery.toLowerCase());
      const isSensorType = l.type === 'sensor-module' || l.type === 'buffer-module';
      if (launcherSubTab === 'SENSOR') return matchesSearch && isSensorType;
      return matchesSearch && !isSensorType;
    });
  }, [launchers, searchQuery, launcherSubTab]);

  const filteredConsumables = useMemo(() => {
    return consumables.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.id.toLowerCase().includes(searchQuery.toLowerCase());
      if (consumableSubTab === 'PROBE') return matchesSearch && (c.type === 'data' || c.type === 'neural');
      if (consumableSubTab === 'SCRIPT') return matchesSearch && c.type === 'module-core';
      if (consumableSubTab === 'BOOSTER') return matchesSearch && c.type === 'booster';
      return matchesSearch;
    });
  }, [consumables, searchQuery, consumableSubTab]);

  const handleEdit = (l: Launcher) => { setEditingId(l.id); setFormData(l); };
  const handleEditConsumable = (c: Consumable) => { setEditingConsumableId(c.id); setConsumableFormData(c); };

  const handleSave = () => {
    if (!formData.id || !formData.name) return;
    launcherSystem.upsert(formData as Launcher);
    serverService.initializeLauncher(formData.id, formData.maxCharges!);
    setLaunchers(launcherSystem.getAll());
    setEditingId(null);
  };

  const handleSaveConsumable = () => {
    if (!consumableFormData.id || !consumableFormData.name) return;
    launcherSystem.upsertConsumable(consumableFormData as Consumable);
    setConsumables(launcherSystem.getAllConsumables());
    setEditingConsumableId(null);
  };

  const handleDelete = (id: string) => { if (window.confirm('Decommission?')) { launcherSystem.delete(id); setLaunchers(launcherSystem.getAll()); } };
  const handleDeleteConsumable = (id: string) => { if (window.confirm('Purge?')) { launcherSystem.deleteConsumable(id); setConsumables(launcherSystem.getAllConsumables()); } };

  const togglePanelSlot = (panelId: string, slot: keyof SlotPermissions) => {
    setSettings(prev => {
      const current = prev.slotPermissions[panelId] || { low: true, probe: true, sensor: true, buffer: true };
      return { ...prev, slotPermissions: { ...prev.slotPermissions, [panelId]: { ...current, [slot]: !current[slot] } } };
    });
  };

  const renderPagination = (total: number, current: number, set: (n: number) => void) => {
    const pages = Math.ceil(total / ITEMS_PER_PAGE);
    if (pages <= 1) return null;
    return (
      <div className="flex items-center justify-center gap-2 mt-4 pb-2">
        <button onClick={() => set(Math.max(0, current - 1))} disabled={current === 0} className="w-8 h-8 flex items-center justify-center border border-zinc-800 text-zinc-500 hover:text-white disabled:opacity-20 transition-all"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7"/></svg></button>
        <span className="text-[10px] font-mono text-zinc-600 font-bold uppercase tracking-widest">{current + 1} / {pages}</span>
        <button onClick={() => set(Math.min(pages - 1, current + 1))} disabled={current >= pages - 1} className="w-8 h-8 flex items-center justify-center border border-zinc-800 text-zinc-500 hover:text-white disabled:opacity-20 transition-all"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg></button>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in h-full flex flex-col overflow-hidden pb-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center px-2 gap-4 shrink-0">
        <h2 className="text-xl font-black text-white uppercase tracking-[0.3em] shrink-0">Admin_Terminal</h2>
        <div className="flex flex-1 w-full md:w-auto items-center gap-4">
          <input 
            type="text" placeholder={`FILTER_${activeTab}...`} value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setLauncherPage(0); setConsumablePage(0); }}
            className="flex-1 max-w-xs bg-black border border-zinc-800 p-2 text-[10px] text-zinc-400 font-mono outline-none focus:border-teal-500/50"
          />
          <div className="flex border border-zinc-900 h-10 overflow-hidden shrink-0">
             {(['PANELS', 'LAUNCHERS', 'CONSUMABLES'] as const).map((t) => (
               <button key={t} onClick={() => { setActiveTab(t); setSearchQuery(''); }} className={`px-4 text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === t ? 'bg-teal-500/20 text-teal-400' : 'text-zinc-600 hover:text-white'}`}>{t}</button>
             ))}
          </div>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 overflow-hidden">
        
        {activeTab === 'PANELS' && (
            <Card id="ADMIN_PANEL" title="PANEL_INFRASTRUCTURE" variant="purple" className="flex-1 overflow-hidden" permissions={{ low: false, probe: false, sensor: false, buffer: false }}>
              <div className="flex-1 overflow-y-auto pr-2 space-y-8 pb-10 no-scroll">
                  {Object.entries(PANEL_GROUPS).map(([groupName, panelIds]) => {
                     const visiblePanels = panelIds.filter(p => p.toLowerCase().includes(searchQuery.toLowerCase()));
                     if (visiblePanels.length === 0) return null;
                     return (
                       <div key={groupName} className="space-y-4">
                          <span className="text-[10px] font-black text-teal-600 uppercase tracking-[0.3em] border-b border-zinc-900 pb-1 block">{groupName}</span>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {visiblePanels.map(panelId => {
                                const perms = settings.slotPermissions[panelId] || { low: true, probe: true, sensor: true, buffer: true };
                                return (
                                    <div key={panelId} className="p-4 border border-zinc-900 bg-black/40 flex flex-col gap-4 group hover:border-zinc-700 transition-all shadow-lg">
                                        <span className="text-[10px] font-black text-zinc-400 group-hover:text-white uppercase truncate">{panelId}</span>
                                        <div className="space-y-2">
                                            <div onClick={() => togglePanelSlot(panelId, 'probe')} className={`flex items-center justify-between py-1.5 px-3 border border-zinc-900 cursor-pointer ${perms.probe ? 'bg-teal-950/10 border-teal-500/30' : 'bg-black opacity-50'}`}><span className="text-[8px] font-black uppercase">Probe Slot</span><div className={`w-2 h-2 rounded-full ${perms.probe ? 'bg-teal-500 shadow-[0_0_8px_#00ffd5]' : 'bg-zinc-800'}`}></div></div>
                                            {panelId === 'SENSOR_PANEL' && <div onClick={() => togglePanelSlot(panelId, 'sensor')} className={`flex items-center justify-between py-1.5 px-3 border border-zinc-900 cursor-pointer ${perms.sensor ? 'bg-orange-950/10 border-orange-500/30' : 'bg-black opacity-50'}`}><span className="text-[8px] font-black uppercase">Sensor Slot</span><div className={`w-2 h-2 rounded-full ${perms.sensor ? 'bg-orange-500 shadow-[0_0_8px_#f97316]' : 'bg-zinc-800'}`}></div></div>}
                                        </div>
                                    </div>
                                );
                              })}
                          </div>
                       </div>
                     );
                  })}
              </div>
            </Card>
        )}

        {(activeTab === 'LAUNCHERS' || activeTab === 'CONSUMABLES') && (
            <div className="w-full flex gap-6 overflow-hidden">
                <div className="w-1/2 flex flex-col overflow-hidden">
                    <div className="flex border border-zinc-900 mb-4 bg-black">
                        {activeTab === 'LAUNCHERS' ? (
                            <>
                                <button onClick={() => setLauncherSubTab('LAUNCHER')} className={`flex-1 py-3 text-[9px] font-black uppercase tracking-widest transition-all ${launcherSubTab === 'LAUNCHER' ? 'bg-teal-500/20 text-teal-400' : 'text-zinc-600'}`}>Launcher</button>
                                <button onClick={() => setLauncherSubTab('SENSOR')} className={`flex-1 py-3 text-[9px] font-black uppercase tracking-widest transition-all ${launcherSubTab === 'SENSOR' ? 'bg-orange-500/20 text-orange-400' : 'text-zinc-600'}`}>Sensor</button>
                            </>
                        ) : (
                            <>
                                <button onClick={() => setConsumableSubTab('PROBE')} className={`flex-1 py-3 text-[9px] font-black uppercase tracking-widest transition-all ${consumableSubTab === 'PROBE' ? 'bg-purple-500/20 text-purple-400' : 'text-zinc-600'}`}>Probe</button>
                                <button onClick={() => setConsumableSubTab('SCRIPT')} className={`flex-1 py-3 text-[9px] font-black uppercase tracking-widest transition-all ${consumableSubTab === 'SCRIPT' ? 'bg-teal-500/20 text-teal-400' : 'text-zinc-600'}`}>Script</button>
                                <button onClick={() => setConsumableSubTab('BOOSTER')} className={`flex-1 py-3 text-[9px] font-black uppercase tracking-widest transition-all ${consumableSubTab === 'BOOSTER' ? 'bg-blue-500/20 text-blue-400' : 'text-zinc-600'}`}>Booster</button>
                            </>
                        )}
                    </div>
                    
                    <Card id="admin_editor" title={activeTab === 'LAUNCHERS' ? (editingId ? 'EDIT_NODE' : 'NEW_NODE') : (editingConsumableId ? 'EDIT_ITEM' : 'NEW_ITEM')} variant="teal" className="flex-1 overflow-hidden" permissions={{ low: false, probe: false, sensor: false, buffer: false }}>
                         <div className="space-y-4 overflow-y-auto pr-2 flex-1 no-scroll pb-6">
                            {activeTab === 'LAUNCHERS' ? (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <input value={formData.id} disabled={!!editingId} onChange={e => setFormData({...formData, id: e.target.value})} className="bg-black border border-zinc-800 p-2 text-[10px] text-zinc-400 font-mono" placeholder="ID Vector" />
                                        <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="bg-black border border-zinc-800 p-2 text-[10px] text-zinc-400 font-mono" placeholder="Module Name" />
                                    </div>
                                    <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})} className="w-full bg-black border border-zinc-800 p-2 text-[10px] text-zinc-400 font-mono">
                                        <option value="core">CORE_DATA</option>
                                        <option value="neural">NEURAL_LINK</option>
                                        <option value="sensor-module">SENSOR_GRID</option>
                                        <option value="buffer-module">BUFFER_NODE</option>
                                    </select>
                                    <div className="grid grid-cols-2 gap-4">
                                        <input type="number" placeholder="Cap" value={formData.maxCharges} onChange={e => setFormData({...formData, maxCharges: Number(e.target.value)})} className="bg-black border border-zinc-800 p-2 text-[10px] text-zinc-400 font-mono" />
                                        <input type="number" placeholder="Tokens" value={formData.tokens} onChange={e => setFormData({...formData, tokens: Number(e.target.value)})} className="bg-black border border-zinc-800 p-2 text-[10px] text-zinc-400 font-mono" />
                                    </div>
                                    <button onClick={handleSave} className="w-full py-4 bg-teal-500/10 border border-teal-500/40 text-teal-400 text-[10px] font-black uppercase tracking-[0.4em]">APPLY_MANIFEST_ENTRY</button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <input value={consumableFormData.id} disabled={!!editingConsumableId} onChange={e => setConsumableFormData({...consumableFormData, id: e.target.value})} className="bg-black border border-zinc-800 p-2 text-[10px] text-zinc-400 font-mono" placeholder="ID Vector" />
                                        <input value={consumableFormData.name} onChange={e => setConsumableFormData({...consumableFormData, name: e.target.value})} className="bg-black border border-zinc-800 p-2 text-[10px] text-zinc-400 font-mono" placeholder="Item Name" />
                                    </div>
                                    <select value={consumableFormData.type} onChange={e => setConsumableFormData({...consumableFormData, type: e.target.value as any})} className="w-full bg-black border border-zinc-800 p-2 text-[10px] text-zinc-400 font-mono">
                                        <option value="data">PROBE_DATA</option>
                                        <option value="neural">PROBE_NEURAL</option>
                                        <option value="module-core">SCRIPT_CORE</option>
                                        <option value="booster">BOOSTER_OVERRIDE</option>
                                    </select>
                                    <textarea value={consumableFormData.description} onChange={e => setConsumableFormData({...consumableFormData, description: e.target.value})} className="w-full bg-black border border-zinc-800 p-2 text-[10px] text-zinc-400 font-mono h-20 resize-none" placeholder="Description..." />
                                    <button onClick={handleSaveConsumable} className="w-full py-4 bg-blue-500/10 border border-blue-500/40 text-blue-400 text-[10px] font-black uppercase tracking-[0.4em]">APPLY_ITEM_ENTRY</button>
                                </div>
                            )}
                         </div>
                    </Card>
                </div>
                <div className="w-1/2 flex flex-col overflow-hidden">
                    <div className="flex-1 overflow-y-auto space-y-3 pr-2 no-scroll">
                        <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest border-b border-zinc-900 pb-1 block">Active_Registry</span>
                        {(activeTab === 'LAUNCHERS' ? filteredLaunchers : filteredConsumables).map((item: any) => (
                            <div key={item.id} className="p-4 border border-zinc-900 bg-black/40 flex justify-between items-center group">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-300">{item.name}</span>
                                    <span className="text-[7px] text-zinc-700 font-mono">ID: {item.id} | TYPE: {item.type}</span>
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100">
                                    <button onClick={() => activeTab === 'LAUNCHERS' ? handleEdit(item) : handleEditConsumable(item)} className="text-[8px] font-black uppercase text-zinc-500 hover:text-white">Edit</button>
                                    <button onClick={() => activeTab === 'LAUNCHERS' ? handleDelete(item.id) : handleDeleteConsumable(item.id)} className="text-[8px] font-black uppercase text-red-900 hover:text-red-500">Purge</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;