
import React, { useState } from 'react';
import { Launcher } from '../types';
import { launcherSystem } from '../services/launcherService';
import { serverService } from '../services/serverService';
import Card from './common/Card';

interface AdminPanelProps {
  allowDistortion?: boolean;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ allowDistortion }) => {
  const [launchers, setLaunchers] = useState<Launcher[]>(launcherSystem.getAll());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Launcher>>({
    id: '',
    name: '',
    type: 'core',
    description: '',
    maxCharges: 5,
    rechargeRate: 60,
    color: '#00ffd5',
    compatibleProbes: ['*'],
    tokens: 2000
  });

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
    setFormData({
      id: '',
      name: '',
      type: 'core',
      description: '',
      maxCharges: 5,
      rechargeRate: 60,
      color: '#00ffd5',
      compatibleProbes: ['*'],
      tokens: 2000
    });
  };

  const handleDelete = (id: string) => {
    if (confirm('Permanently decommission this launcher module?')) {
      launcherSystem.delete(id);
      setLaunchers(launcherSystem.getAll());
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in h-full flex flex-col overflow-hidden">
      <header className="flex justify-between items-center px-2">
        <h2 className="text-lg font-black text-white uppercase tracking-widest">Neural_Admin_Panel</h2>
        <span className="text-[10px] text-zinc-700 font-mono">Module CRUD / Persistence Active</span>
      </header>

      <div className="flex gap-8 flex-1 overflow-hidden">
        {/* Editor */}
        <div className="w-1/3 border-r border-zinc-900 pr-8 overflow-y-auto no-scroll">
          <Card id="admin_editor" title={editingId ? 'EDIT_MODULE' : 'NEW_MODULE'} variant="teal" allowDistortion={allowDistortion}>
            <div className="space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-[8px] text-zinc-700 uppercase font-black">ID_Vector</label>
                <input 
                  value={formData.id} 
                  disabled={!!editingId}
                  onChange={e => setFormData({...formData, id: e.target.value})} 
                  className="bg-black border border-zinc-900 p-2 text-[10px] text-zinc-400 font-mono outline-none focus:border-teal-500/30" 
                  placeholder="e.g. ultra-core" 
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[8px] text-zinc-700 uppercase font-black">Module_Name</label>
                <input 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  className="bg-black border border-zinc-900 p-2 text-[10px] text-zinc-400 font-mono outline-none focus:border-teal-500/30" 
                  placeholder="Module Display Name" 
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[8px] text-zinc-700 uppercase font-black">Launcher_Type</label>
                <select 
                  value={formData.type} 
                  onChange={e => setFormData({...formData, type: e.target.value as 'core' | 'neural'})} 
                  className="bg-black border border-zinc-900 p-2 text-[10px] text-zinc-400 font-mono outline-none"
                >
                  <option value="core">CORE</option>
                  <option value="neural">NEURAL</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[8px] text-zinc-700 uppercase font-black">Primary_Hue</label>
                <input 
                  type="color" 
                  value={formData.color} 
                  onChange={e => setFormData({...formData, color: e.target.value})} 
                  className="bg-black border border-zinc-900 p-1 w-full h-8 cursor-pointer" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[8px] text-zinc-700 uppercase font-black">Max_Cap</label>
                  <input 
                    type="number" 
                    value={formData.maxCharges} 
                    onChange={e => setFormData({...formData, maxCharges: parseInt(e.target.value)})} 
                    className="bg-black border border-zinc-900 p-2 text-[10px] text-zinc-400 font-mono outline-none" 
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[8px] text-zinc-700 uppercase font-black">Reload_Rate (s)</label>
                  <input 
                    type="number" 
                    value={formData.rechargeRate} 
                    onChange={e => setFormData({...formData, rechargeRate: parseInt(e.target.value)})} 
                    className="bg-black border border-zinc-900 p-2 text-[10px] text-zinc-400 font-mono outline-none" 
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[8px] text-zinc-700 uppercase font-black">Token_Limit (Core: Chars, Neural: Tokens)</label>
                <input 
                  type="number" 
                  value={formData.tokens} 
                  onChange={e => setFormData({...formData, tokens: parseInt(e.target.value)})} 
                  className="bg-black border border-zinc-900 p-2 text-[10px] text-zinc-400 font-mono outline-none" 
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[8px] text-zinc-700 uppercase font-black">Tactical_Description</label>
                <textarea 
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})} 
                  className="bg-black border border-zinc-900 p-2 text-[10px] text-zinc-400 font-mono outline-none h-20" 
                  placeholder="Module summary..." 
                />
              </div>
              <button 
                onClick={handleSave}
                className="w-full py-3 bg-teal-500/10 border border-teal-500/40 text-teal-400 text-[10px] font-black uppercase tracking-widest hover:bg-teal-500/20"
              >
                {editingId ? 'COMMIT_CHANGES' : 'INITIALIZE_MODULE'}
              </button>
              {editingId && (
                <button onClick={() => setEditingId(null)} className="w-full py-2 text-zinc-700 text-[8px] uppercase font-black hover:text-white">Cancel</button>
              )}
            </div>
          </Card>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto no-scroll">
          <div className="grid grid-cols-2 gap-6 pb-20">
            {launchers.map(l => (
              <div key={l.id} className="p-5 border border-zinc-900 bg-zinc-950 relative group">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex flex-col">
                    <span className="text-[11px] font-black uppercase tracking-widest" style={{ color: l.color }}>{l.name}</span>
                    <span className="text-[7px] text-zinc-800 font-mono uppercase">ID: {l.id} | TYPE: {l.type}</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(l)} className="text-[8px] text-zinc-700 hover:text-teal-400 uppercase font-black">Edit</button>
                    <button onClick={() => handleDelete(l.id)} className="text-[8px] text-zinc-700 hover:text-red-500 uppercase font-black">Purge</button>
                  </div>
                </div>
                <div className="h-0.5 w-full bg-zinc-900 mb-4">
                  <div className="h-full" style={{ width: '40%', backgroundColor: l.color }}></div>
                </div>
                <p className="text-[9px] text-zinc-600 mb-4 italic leading-relaxed">"{l.description}"</p>
                <div className="flex gap-6 text-[8px] font-mono text-zinc-800">
                  <span>CAPACITY: {l.maxCharges}</span>
                  <span>SYNC_TIME: {l.rechargeRate}s</span>
                  <span>TOKENS: {l.tokens}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
