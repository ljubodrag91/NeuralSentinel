import React, { useState } from 'react';
import { TOOLS } from '../constants';
import { ToolDefinition, OperationalMode } from '../types';
import { APP_CONFIG } from '../services/config';
import Tooltip from './common/Tooltip';

interface ToolkitProps {
  onRunCommand: (command: string) => void;
  onBreakdown: (topic: string, query?: string) => void;
  mode: OperationalMode;
}

type WizardStep = 'PREPARE' | 'DISCOVER' | 'SELECT' | 'INTENSITY' | 'CONFIRM' | 'EXECUTE';

const Toolkit: React.FC<ToolkitProps> = ({ onRunCommand, onBreakdown, mode }) => {
  const [selectedTool, setSelectedTool] = useState<ToolDefinition | null>(null);
  const [params, setParams] = useState<Record<string, string | number | boolean>>({});
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set(['Reconnaissance', 'Wireless Attacks']));

  // Wizard States
  const [wizardStep, setWizardStep] = useState<WizardStep>('PREPARE');
  const [wizardData, setWizardData] = useState<any[]>([]);
  const [selectedTarget, setSelectedTarget] = useState<any | null>(null);
  const [intensity, setIntensity] = useState<string>('Standard');
  const [isProcessing, setIsProcessing] = useState(false);

  const categories = Array.from(new Set(TOOLS.map(t => t.category)));

  // Fix: Added missing toggleCategory function to manage UI state of category expansion
  const toggleCategory = (cat: string) => {
    setExpandedCats(prev => {
      const next = new Set(prev);
      if (next.has(cat)) {
        next.delete(cat);
      } else {
        next.add(cat);
      }
      return next;
    });
  };

  const handleToolSelect = (tool: ToolDefinition) => {
    setSelectedTool(tool);
    setWizardStep('PREPARE');
    setSelectedTarget(null);
    setWizardData([]);
    
    const initialParams: Record<string, string | number | boolean> = {};
    tool.parameters.forEach(p => {
      initialParams[p.name] = p.value;
    });
    setParams(initialParams);
  };

  const buildCommand = () => {
    if (!selectedTool) return '';
    
    // Guided Logic
    if (selectedTool.id.includes('guided')) {
      const isDeauth = selectedTool.id === 'guided-deauth';
      if (!selectedTarget) return `${selectedTool.baseCommand} --[GUIDED_WAITING]`;
      
      if (isDeauth) {
        const count = intensity === 'Quick' ? 5 : intensity === 'Heavy' ? 100 : intensity === 'Continuous' ? 0 : 20;
        return `aireplay-ng --deauth ${count} -a ${selectedTarget.bssid} wlan1mon`;
      }
      
      const nmapFlags = intensity === 'Quick' ? '-T4 -F' : intensity === 'Heavy' ? '-p- -A -sV' : '-sV -O';
      return `nmap ${nmapFlags} ${selectedTarget.ip}`;
    }

    // Regular Logic (Flag Builder)
    let cmd = selectedTool.baseCommand;
    selectedTool.parameters.forEach(p => {
      const val = params[p.name];
      if (p.type === 'toggle') {
        if (val) cmd += ` ${p.flag}`;
      } else {
        if (p.flag) cmd += ` ${p.flag} ${val}`;
        else cmd += ` ${val}`;
      }
    });
    return cmd;
  };

  const startDiscovery = () => {
    setIsProcessing(true);
    setWizardStep('DISCOVER');
    
    setTimeout(() => {
      const isDeauth = selectedTool?.id === 'guided-deauth';
      const results = isDeauth ? [
        { essid: 'NET_OMEGA', bssid: '00:DE:AD:BE:EF:01', channel: 6, signal: -35 },
        { essid: 'CORP_SECURE_WPA3', bssid: 'AA:11:22:33:44:55', channel: 11, signal: -72 },
        { essid: 'GUEST_IOT', bssid: 'FF:EE:DD:CC:BB:AA', channel: 1, signal: -58 }
      ] : [
        { label: 'Primary Gateway', ip: '192.168.1.1', status: 'Online', ports: '80, 443' },
        { label: 'Kali Node (Local)', ip: '192.168.1.104', status: 'Active', ports: '22, 5050' },
        { label: 'Hidden_Terminal_X', ip: '192.168.1.135', status: 'Vulnerable', ports: '445, 139' }
      ];

      setWizardData(mode === OperationalMode.REAL 
        ? results.map(r => ({ 
            ...r, 
            [isDeauth ? 'essid' : 'label']: `REAL_${(r as any).essid || (r as any).label}` 
          })) 
        : results
      );
      setIsProcessing(false);
    }, APP_CONFIG.SIMULATION.DISCOVERY_LATENCY);
  };

  const renderWizard = () => {
    const isDeauth = selectedTool?.id === 'guided-deauth';
    
    switch (wizardStep) {
      case 'PREPARE':
        return (
          <div className="space-y-6 py-4 animate-in fade-in zoom-in-95">
            <div className="p-8 bg-zinc-950/60 border border-zinc-900 rounded-sm">
              <h4 className="text-[10px] font-black text-teal-400 uppercase tracking-widest mb-4">Module_Calibration</h4>
              <p className="text-[12px] text-zinc-500 mb-6 italic">{isDeauth ? 'Engaging monitor-mode injection carrier...' : 'Pre-scanning network route for optimal latency...'}</p>
              <div className={`p-4 border ${mode === OperationalMode.REAL ? 'border-green-900/40 bg-green-950/10' : 'border-blue-900/40 bg-blue-950/10'} flex items-center gap-4`}>
                 <div className={`w-2 h-2 rounded-full animate-ping ${mode === OperationalMode.REAL ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                 <span className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">Protocol: {mode}_MODE_STABLE</span>
              </div>
            </div>
            <button onClick={startDiscovery} className="w-full py-5 bg-teal-500/10 border border-teal-500/30 text-teal-400 text-[11px] font-black uppercase tracking-[0.4em] hover:bg-teal-500/20 transition-all">INITIALIZE_DISCOVERY</button>
          </div>
        );
      case 'DISCOVER':
        return (
          <div className="space-y-4 py-4 animate-in fade-in">
             <div className="flex justify-between items-center px-2">
               <h4 className="text-[10px] font-black text-zinc-700 uppercase tracking-widest">Discovery_Results</h4>
               {isProcessing && <span className="text-[9px] text-teal-500 animate-pulse font-black uppercase">[Scanning...]</span>}
             </div>
             <div className="grid grid-cols-1 gap-2 max-h-80 overflow-y-auto no-scroll">
               {wizardData.map((item, idx) => (
                 <div 
                  key={idx} 
                  onClick={() => { setSelectedTarget(item); setWizardStep('SELECT'); }}
                  className="p-4 bg-black border border-zinc-900 hover:border-teal-500/50 cursor-pointer flex justify-between items-center group transition-colors"
                 >
                   <div className="flex flex-col">
                     <span className="text-[11px] font-black text-zinc-400 group-hover:text-white uppercase">{isDeauth ? item.essid : item.label}</span>
                     <span className="text-[9px] font-mono text-zinc-700">{isDeauth ? item.bssid : item.ip}</span>
                   </div>
                   <div className="text-[10px] font-mono text-teal-600 font-black uppercase">
                     {isDeauth ? `${item.signal}dBm` : `PORTS: ${item.ports}`}
                   </div>
                 </div>
               ))}
             </div>
          </div>
        );
      case 'SELECT':
        return (
          <div className="space-y-6 py-4 animate-in slide-in-from-bottom-4">
            <div className="p-8 bg-[#0a0c0f] border border-zinc-900 shadow-inner">
               <h4 className="text-[10px] font-black text-teal-400 uppercase tracking-widest mb-6 border-b border-zinc-900 pb-2">Target_Confirmation</h4>
               <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col"><span className="text-[8px] text-zinc-800 font-black uppercase">Descriptor</span><span className="text-zinc-200 text-xs font-black uppercase">{isDeauth ? selectedTarget?.essid : selectedTarget?.label}</span></div>
                  <div className="flex flex-col"><span className="text-[8px] text-zinc-800 font-black uppercase">Address</span><span className="text-zinc-500 font-mono text-xs">{isDeauth ? selectedTarget?.bssid : selectedTarget?.ip}</span></div>
               </div>
            </div>
            <div className="flex gap-4">
               <button onClick={() => setWizardStep('DISCOVER')} className="flex-1 py-4 border border-zinc-900 text-zinc-600 text-[10px] font-black uppercase tracking-widest hover:text-white transition-all">BACK</button>
               <button onClick={() => setWizardStep('INTENSITY')} className="flex-[2] py-4 bg-teal-500/10 border border-teal-500/30 text-teal-400 text-[10px] font-black uppercase tracking-widest hover:bg-teal-500/20 transition-all">SET_INTENSITY</button>
            </div>
          </div>
        );
      case 'INTENSITY':
        return (
          <div className="space-y-6 py-4 animate-in slide-in-from-bottom-2">
            <div className="grid grid-cols-2 gap-4">
              {['Quick', 'Standard', 'Heavy', 'Continuous'].map(lvl => (
                <div 
                  key={lvl} onClick={() => setIntensity(lvl)}
                  className={`p-6 border cursor-pointer flex flex-col items-center gap-2 transition-all ${intensity === lvl ? 'bg-teal-950/20 border-teal-500' : 'bg-black border-zinc-900'}`}
                >
                  <span className={`text-[11px] font-black uppercase tracking-widest ${intensity === lvl ? 'text-teal-400' : 'text-zinc-700'}`}>{lvl}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setWizardStep('CONFIRM')} className="w-full py-5 bg-teal-500/20 border border-teal-500 text-teal-400 text-[11px] font-black uppercase tracking-widest">GENERATE_PLAN</button>
          </div>
        );
      case 'CONFIRM':
        return (
          <div className="space-y-8 py-4 animate-in zoom-in-95">
             <div className="p-8 bg-red-950/5 border border-red-900/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 text-[8px] text-red-900 font-black uppercase tracking-widest border-l border-b border-red-900/20">Awaiting_Arm</div>
                <h4 className="text-[13px] font-black text-white uppercase tracking-[0.4em] mb-8 border-b border-zinc-900/40 pb-4">Mission_Parameters</h4>
                <div className="space-y-4">
                  <div className="flex justify-between"><span className="text-[10px] text-zinc-700 font-black uppercase">Module</span><span className="text-[10px] text-zinc-400 uppercase">{selectedTool?.name}</span></div>
                  <div className="flex justify-between"><span className="text-[10px] text-zinc-700 font-black uppercase">Target</span><span className="text-[10px] text-teal-500 uppercase">{isDeauth ? selectedTarget?.essid : selectedTarget?.ip}</span></div>
                  <div className="flex justify-between"><span className="text-[10px] text-zinc-700 font-black uppercase">Intensity</span><span className="text-[10px] text-teal-500 uppercase">{intensity}</span></div>
                </div>
             </div>
             <div className="flex gap-4">
                <button onClick={() => setWizardStep('PREPARE')} className="flex-1 py-5 bg-zinc-950 border border-zinc-900 text-zinc-700 text-[11px] font-black uppercase tracking-widest hover:text-white transition-all">ABORT</button>
                <button onClick={() => { onRunCommand(buildCommand()); setWizardStep('EXECUTE'); }} className="flex-[2] py-5 bg-teal-500/20 border border-teal-500 text-teal-400 text-[11px] font-black uppercase tracking-[0.5em] hover:bg-teal-500/30 transition-all glow-teal">CONFIRM_EXECUTION</button>
             </div>
          </div>
        );
      case 'EXECUTE':
        return (
          <div className="h-80 flex flex-col items-center justify-center bg-black/40 rounded-sm border border-zinc-900">
             <div className="relative w-24 h-24 mb-8">
                <div className="absolute inset-0 border-4 border-teal-500/20 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-teal-500 rounded-full border-t-transparent animate-spin"></div>
             </div>
             <span className="text-[12px] font-black text-teal-400 uppercase tracking-[0.4em] animate-pulse">Neural_Carrier_Active</span>
             <p className="text-[9px] text-zinc-700 mt-4 font-mono uppercase truncate max-w-xs px-10">{buildCommand()}</p>
             <button onClick={() => setWizardStep('PREPARE')} className="mt-12 text-[9px] text-zinc-600 hover:text-red-500 uppercase font-black transition-colors">[ STOP_PAYLOAD ]</button>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500 bg-[#050608]/20 p-4 rounded-sm border border-zinc-900/60 overflow-hidden">
      <header className="flex justify-between items-center mb-6 px-4 border-b border-zinc-900/40 pb-4">
        <div className="flex flex-col">
          <span className="text-[11px] font-black text-zinc-700 uppercase tracking-widest">Module_Interface</span>
          <span className={`text-[12px] font-black uppercase ${mode === OperationalMode.REAL ? 'text-green-500' : 'text-blue-500'}`}>{mode}_Active</span>
        </div>
        <div className="text-[9px] text-zinc-800 font-mono text-right uppercase">v.{APP_CONFIG.VERSION}<br/>Hash: 0x2A9B</div>
      </header>

      <div className="flex gap-10 flex-1 overflow-hidden">
        <div className="w-80 border-r border-zinc-900/40 pr-6 overflow-y-auto no-scroll">
          <h4 className="text-[10px] font-black text-zinc-700 uppercase mb-6 tracking-widest flex items-center gap-2"><div className="w-1.5 h-1.5 bg-zinc-800"></div> Module_Directory</h4>
          {categories.map(cat => (
            <div key={cat} className="mb-4">
              <div onClick={() => toggleCategory(cat)} className="flex items-center gap-2 px-2 py-2 hover:bg-zinc-900/40 rounded-sm cursor-pointer group transition-colors">
                <span className={`text-[8px] transition-transform ${expandedCats.has(cat) ? 'rotate-90' : ''} text-zinc-700`}>▶</span>
                <span className="text-[11px] font-black text-zinc-600 group-hover:text-teal-400 tracking-widest uppercase">[{cat}]</span>
              </div>
              {expandedCats.has(cat) && (
                <div className="ml-4 border-l border-zinc-900 mt-2 space-y-1">
                  {TOOLS.filter(t => t.category === cat).map(tool => (
                    <div 
                      key={tool.id} onClick={() => handleToolSelect(tool)}
                      className={`pl-4 py-2 text-[10px] font-mono cursor-pointer transition-all border-l ${selectedTool?.id === tool.id ? 'border-teal-400 bg-teal-500/5 text-teal-400 font-black' : 'border-transparent text-zinc-600 hover:text-zinc-400'}`}
                    >
                      {tool.name.toUpperCase()} {tool.id.includes('guided') && <span className="ml-1 text-[7px] text-teal-500/50">[WIZARD]</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto no-scroll pr-2">
          {selectedTool ? (
            <div className="space-y-8 animate-in slide-in-from-right-4">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-lg font-black text-white tracking-widest uppercase mb-1">{selectedTool.name}</h2>
                  <p className="text-[10px] font-mono text-zinc-500 italic">{selectedTool.description}</p>
                </div>
                <button 
                  onClick={() => onBreakdown(selectedTool.name, selectedTool.id.includes('guided') ? `Deep analyze tactical wizard for ${selectedTool.name} in ${mode} environment.` : `Breakdown raw flags for module ${selectedTool.name}`)}
                  className="text-[9px] bg-zinc-950 px-4 py-2 border border-zinc-900 hover:border-purple-500/50 text-zinc-600 font-black tracking-widest uppercase transition-all shadow-xl"
                >
                  Neural_Insight
                </button>
              </div>
              
              {selectedTool.id.includes('guided') ? renderWizard() : (
                <>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-6 bg-black/60 p-8 border border-zinc-900/60 rounded-sm shadow-inner">
                    {selectedTool.parameters.map(p => (
                      <div key={p.name} className="flex flex-col gap-2">
                        <div className="flex justify-between items-center"><label className="text-[9px] uppercase font-black text-zinc-700 tracking-widest">{p.name}</label><span className="text-[8px] font-mono text-zinc-800">{p.flag || 'POSITIONAL'}</span></div>
                        {p.type === 'toggle' ? (
                          <div className="flex items-center gap-4">
                            <div onClick={() => setParams(prev => ({ ...prev, [p.name]: !prev[p.name] }))} className={`w-10 h-4 rounded-sm border transition-all cursor-pointer flex items-center px-1 ${params[p.name] ? 'border-teal-400 bg-teal-500/20' : 'border-zinc-800 bg-zinc-950'}`}>
                              <div className={`w-2.5 h-2.5 transition-all ${params[p.name] ? 'translate-x-5 bg-teal-400' : 'translate-x-0 bg-zinc-700'}`}></div>
                            </div>
                            <span className={`text-[9px] font-black uppercase ${params[p.name] ? 'text-teal-400' : 'text-zinc-800'}`}>{params[p.name] ? 'ON' : 'OFF'}</span>
                          </div>
                        ) : (
                          <input type={p.type === 'number' ? 'number' : 'text'} value={params[p.name] as any} onChange={(e) => setParams(prev => ({ ...prev, [p.name]: e.target.value }))} className="bg-zinc-950 border border-zinc-900 px-4 py-2 text-[11px] text-zinc-400 font-mono outline-none focus:border-teal-500/20 transition-colors" placeholder="Input..." />
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 space-y-4">
                    <div className="bg-black/95 p-6 font-mono text-[12px] text-teal-400 border border-zinc-900 shadow-2xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-1 text-[7px] text-zinc-900 font-mono uppercase">Payload_Preview</div>
                      <span className="text-zinc-800 font-black mr-4">$</span> {buildCommand()}
                    </div>
                    <button onClick={() => onRunCommand(buildCommand())} className="w-full bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 font-black py-4 text-[11px] uppercase tracking-[0.4em] transition-all border border-teal-500/30 shadow-[0_0_15px_rgba(20,184,166,0.1)]">ARM_AND_TRANSMIT</button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center opacity-20 bg-zinc-950/20 border border-dashed border-zinc-900/40 rounded-sm">
              <svg className="w-12 h-12 text-zinc-800 mb-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
              <p className="text-[11px] font-black uppercase tracking-[0.4em] text-zinc-800 animate-pulse">Select Tactical Module</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Toolkit;