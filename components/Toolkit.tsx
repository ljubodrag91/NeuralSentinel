
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

  // Wizard State (shared across guided tools)
  const [wizardStep, setWizardStep] = useState<WizardStep>('PREPARE');
  const [wizardData, setWizardData] = useState<any[]>([]);
  const [selectedTarget, setSelectedTarget] = useState<any | null>(null);
  const [intensity, setIntensity] = useState<string>('Standard');
  const [isProcessing, setIsProcessing] = useState(false);

  const categories = Array.from(new Set(TOOLS.map(t => t.category)));

  const toggleCategory = (cat: string) => {
    const next = new Set(expandedCats);
    if (next.has(cat)) next.delete(cat);
    else next.add(cat);
    setExpandedCats(next);
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
    
    // Guided Command Construction
    if (selectedTool.id === 'guided-deauth') {
      if (!selectedTarget) return 'aireplay-ng --deauth [COUNT] -a [BSSID] wlan1mon';
      const count = intensity === 'Quick' ? 5 : intensity === 'Heavy' ? 50 : intensity === 'Continuous' ? 0 : 10;
      return `aireplay-ng --deauth ${count} -a ${selectedTarget.bssid} wlan1mon`;
    }

    if (selectedTool.id === 'nmap-guided') {
      if (!selectedTarget) return 'nmap -sV -O [TARGET]';
      const flags = intensity === 'Quick' ? '-F' : intensity === 'Heavy' ? '-p- -A' : intensity === 'Continuous' ? '-T5 --top-ports 1000' : '-sV -O';
      return `nmap ${flags} ${selectedTarget.ip}`;
    }

    // Regular Command Construction
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
      if (selectedTool?.id === 'guided-deauth') {
        const results = [
          { essid: 'Neural_Labs_Core', bssid: '00:11:22:33:44:55', channel: 6, signal: -42 },
          { essid: 'Guest_Node_Secure', bssid: 'AA:BB:CC:DD:EE:FF', channel: 11, signal: -68 },
          { essid: 'IOT_Legacy_Grid', bssid: '12:34:56:78:90:AB', channel: 1, signal: -55 },
        ];
        // In REAL mode, append prefix for visual feedback of "live" data
        setWizardData(mode === OperationalMode.REAL ? results.map(r => ({ ...r, essid: `REAL_${r.essid}` })) : results);
      } else {
        const results = [
          { label: 'Gateway Node', ip: '192.168.1.1', status: 'Active', ports: '80, 443' },
          { label: 'Neural Server', ip: '192.168.1.104', status: 'Filtered', ports: '22, 5050' },
          { label: 'Operator Workstation', ip: '192.168.1.120', status: 'Vulnerable', ports: '139, 445' },
        ];
        setWizardData(mode === OperationalMode.REAL ? results.map(r => ({ ...r, label: `REAL_${r.label}` })) : results);
      }
      setIsProcessing(false);
    }, APP_CONFIG.SIMULATION.DISCOVERY_LATENCY);
  };

  const renderGuidedWizard = () => {
    const isDeauth = selectedTool?.id === 'guided-deauth';
    
    switch (wizardStep) {
      case 'PREPARE':
        return (
          <div className="space-y-6 py-4 animate-in fade-in zoom-in-95 duration-300">
            <div className="p-8 bg-zinc-950/40 border border-zinc-900/60 rounded-sm">
              <h4 className="text-[10px] font-black text-teal-400 uppercase tracking-widest mb-4">Tactical_Preflight</h4>
              <p className="text-[12px] text-zinc-500 mb-6 italic leading-relaxed">
                {isDeauth 
                  ? "Initializing monitor-mode on secondary RF carrier. Synchronizing management frame injection buffer..."
                  : "Checking local network routing table and validating target resolution binary..."
                }
              </p>
              <div className="flex items-center gap-4 bg-black p-4 border border-zinc-900">
                <div className={`w-2.5 h-2.5 rounded-full ${mode === OperationalMode.REAL ? 'bg-green-500 glow-green' : 'bg-blue-500 glow-blue'} animate-pulse`}></div>
                <span className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">MODE: {mode} (ACTIVE)</span>
              </div>
            </div>
            <button 
              onClick={startDiscovery}
              className="w-full py-5 bg-teal-500/10 border border-teal-500/30 text-teal-400 text-[11px] font-black uppercase tracking-[0.5em] hover:bg-teal-500/20 transition-all shadow-[0_0_20px_rgba(20,184,166,0.1)]"
            >
              INITIALIZE_DISCOVERY
            </button>
          </div>
        );
      case 'DISCOVER':
        return (
          <div className="space-y-6 py-4 animate-in fade-in duration-300">
            <div className="flex justify-between items-center mb-2 px-2">
              <h4 className="text-[10px] font-black text-zinc-700 uppercase tracking-widest">Node_Enumeration_Results</h4>
              {isProcessing && <div className="text-[9px] text-teal-500 animate-pulse uppercase font-black tracking-widest">[Scanning...]</div>}
            </div>
            <div className="grid grid-cols-1 gap-3 max-h-80 overflow-y-auto no-scroll">
              {wizardData.map((item, idx) => (
                <div 
                  key={idx}
                  onClick={() => { setSelectedTarget(item); setWizardStep('SELECT'); }}
                  className="p-5 bg-[#050608] border border-zinc-900 hover:border-teal-500/40 cursor-pointer flex justify-between items-center group transition-all relative overflow-hidden"
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-zinc-900 group-hover:bg-teal-400 transition-colors"></div>
                  <div className="flex flex-col">
                    <span className="text-[11px] font-black text-zinc-400 group-hover:text-white uppercase tracking-wider">{isDeauth ? item.essid : item.label}</span>
                    <span className="text-[9px] font-mono text-zinc-700 tracking-tighter">{isDeauth ? item.bssid : item.ip}</span>
                  </div>
                  <div className="flex gap-8 items-center">
                    <div className="flex flex-col items-center">
                      <span className="text-[8px] text-zinc-800 font-black uppercase">{isDeauth ? 'CH' : 'STATE'}</span>
                      <span className="text-[10px] text-zinc-500 font-mono font-bold uppercase">{isDeauth ? item.channel : item.status}</span>
                    </div>
                    <div className="flex flex-col items-end w-16">
                      <span className="text-[8px] text-zinc-800 font-black uppercase">{isDeauth ? 'POWER' : 'VECTOR'}</span>
                      <span className={`text-[10px] font-mono font-bold ${isDeauth ? (item.signal > -50 ? 'text-green-500' : 'text-yellow-500') : 'text-teal-600'}`}>
                        {isDeauth ? `${item.signal}dBm` : item.ports}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'SELECT':
        return (
          <div className="space-y-6 py-4 animate-in slide-in-from-bottom-6 duration-400">
             <div className="p-8 bg-zinc-950/80 border border-zinc-900 rounded-sm shadow-2xl">
                <h4 className="text-[10px] font-black text-teal-400 uppercase tracking-widest mb-6 border-b border-zinc-900 pb-4">Target_Lock_Confirmation</h4>
                <div className="grid grid-cols-2 gap-8">
                  <div className="flex flex-col gap-1">
                    <span className="text-[8px] text-zinc-800 uppercase font-black">ID_DESCRIPTOR</span>
                    <span className="text-[14px] text-zinc-200 font-black uppercase tracking-widest">{isDeauth ? selectedTarget?.essid : selectedTarget?.label}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[8px] text-zinc-800 uppercase font-black">PHYSICAL_ADDR</span>
                    <span className="text-[14px] text-zinc-400 font-mono">{isDeauth ? selectedTarget?.bssid : selectedTarget?.ip}</span>
                  </div>
                </div>
                <div className="mt-8 pt-6 border-t border-zinc-900 flex justify-between items-center">
                   <div className="flex items-center gap-3">
                     <div className="w-2 h-2 rounded-full bg-green-500 glow-green"></div>
                     <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Link: Persistence Verified</span>
                   </div>
                   <span className="text-[10px] text-zinc-700 italic">Phase 3: Armed.</span>
                </div>
             </div>
             <div className="flex gap-4">
                <button 
                  onClick={() => setWizardStep('DISCOVER')}
                  className="flex-1 py-4 bg-zinc-950 border border-zinc-900 text-zinc-600 text-[10px] font-black uppercase tracking-widest hover:text-white transition-all"
                >
                  RESCAN
                </button>
                <button 
                  onClick={() => setWizardStep('INTENSITY')}
                  className="flex-[2] py-4 bg-teal-500/10 border border-teal-500/30 text-teal-400 text-[10px] font-black uppercase tracking-[0.4em] hover:bg-teal-500/20 transition-all"
                >
                  SET_INTENSITY
                </button>
             </div>
          </div>
        );
      case 'INTENSITY':
        return (
          <div className="space-y-8 py-4 animate-in slide-in-from-bottom-4 duration-300">
             <div className="grid grid-cols-2 gap-4">
                {[
                  { id: 'Quick', desc: isDeauth ? '5 packets (Low Impact)' : 'Fast (1-1000 Ports)' },
                  { id: 'Standard', desc: isDeauth ? '10 packets (Nominal)' : 'Full (Default)' },
                  { id: 'Heavy', desc: isDeauth ? '50 packets (Forceful)' : 'Deep (All Ports)' },
                  { id: 'Continuous', desc: isDeauth ? 'Saturation (Infinite)' : 'Stealth (Delayed)' }
                ].map((lvl) => (
                  <div 
                    key={lvl.id}
                    onClick={() => setIntensity(lvl.id)}
                    className={`p-6 border cursor-pointer transition-all flex flex-col items-center gap-3 ${intensity === lvl.id ? 'bg-teal-950/20 border-teal-500 shadow-[0_0_20px_rgba(20,184,166,0.15)]' : 'bg-black border-zinc-900 hover:border-zinc-800'}`}
                  >
                    <span className={`text-[12px] font-black uppercase tracking-[0.2em] ${intensity === lvl.id ? 'text-teal-400' : 'text-zinc-700'}`}>{lvl.id}</span>
                    <p className="text-[8px] text-zinc-600 text-center uppercase leading-tight">{lvl.desc}</p>
                  </div>
                ))}
             </div>
             <button 
              onClick={() => setWizardStep('CONFIRM')}
              className="w-full py-5 bg-teal-500/10 border border-teal-500/30 text-teal-400 text-[11px] font-black uppercase tracking-[0.5em] hover:bg-teal-500/20 transition-all shadow-[0_0_20px_rgba(20,184,166,0.1)]"
             >
              GENERATE_MISSION_PLAN
             </button>
          </div>
        );
      case 'CONFIRM':
        return (
          <div className="space-y-8 py-4 animate-in zoom-in-95 duration-300">
             <div className="p-8 bg-[#0a0a0c] border border-red-900/30 rounded-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 text-[9px] text-red-900 font-black uppercase tracking-[0.4em] bg-red-950/10 border-l border-b border-red-950/20">PRE_EXECUTION_REPORT</div>
                <h4 className="text-[13px] font-black text-white uppercase tracking-[0.4em] mb-8 border-b border-zinc-900/60 pb-4">TACTICAL_CONFIRMATION</h4>
                <div className="space-y-6">
                  <div className="flex justify-between items-baseline">
                    <span className="text-[10px] text-zinc-700 font-black uppercase tracking-widest">Selected_Module</span>
                    <span className="text-[13px] text-zinc-400 font-black uppercase">{selectedTool?.name}</span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-[10px] text-zinc-700 font-black uppercase tracking-widest">Primary_Target</span>
                    <span className="text-[13px] text-teal-400 font-black uppercase">{isDeauth ? selectedTarget?.essid : selectedTarget?.ip}</span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-[10px] text-zinc-700 font-black uppercase tracking-widest">Operational_Mode</span>
                    <span className={`text-[13px] font-black uppercase ${mode === OperationalMode.REAL ? 'text-red-500' : 'text-blue-500'}`}>{mode}</span>
                  </div>
                </div>
                <div className="mt-10 p-4 border border-dashed border-red-900/40 bg-red-950/5 text-center">
                   <p className="text-[9px] text-red-500/80 font-black uppercase tracking-widest leading-relaxed">Caution: Payload will be transmitted to linked node for immediate execution.</p>
                </div>
             </div>
             <div className="flex gap-6">
                <button 
                  onClick={() => setWizardStep('PREPARE')}
                  className="flex-1 py-5 bg-zinc-950 border border-zinc-900 text-zinc-600 text-[11px] font-black uppercase tracking-[0.4em] hover:text-white hover:border-zinc-700 transition-all"
                >
                  ABORT
                </button>
                <button 
                  onClick={() => { onRunCommand(buildCommand()); setWizardStep('EXECUTE'); }}
                  className="flex-[2] py-5 bg-teal-500/20 border border-teal-500 text-teal-400 text-[11px] font-black uppercase tracking-[0.5em] hover:bg-teal-500/30 transition-all glow-teal"
                >
                  CONFIRM_EXECUTION
                </button>
             </div>
          </div>
        );
      case 'EXECUTE':
        return (
          <div className="h-80 flex flex-col items-center justify-center bg-black/40 rounded-sm border border-zinc-900">
             <div className="relative w-24 h-24 mb-10">
                <div className="absolute inset-0 border-4 border-teal-500/20 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-teal-500 rounded-full border-t-transparent animate-spin"></div>
                <div className="absolute inset-4 bg-teal-500/5 rounded-full flex items-center justify-center">
                   <div className="w-2 h-2 bg-teal-400 rounded-full animate-ping"></div>
                </div>
             </div>
             <span className="text-[14px] font-black text-teal-400 uppercase tracking-[0.5em] animate-pulse">Neural_Stream_Active</span>
             <p className="text-[9px] text-zinc-700 mt-4 font-mono uppercase tracking-[0.2em]">{buildCommand()}</p>
             <button 
              onClick={() => setWizardStep('PREPARE')}
              className="mt-12 text-[10px] text-zinc-500 hover:text-red-500 uppercase font-black tracking-widest transition-colors border-b border-transparent hover:border-red-950 pb-1"
             >
              [ TERMINATE_PAYLOAD ]
             </button>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500 bg-[#050608]/40 p-4 rounded-lg border border-zinc-900/40 overflow-hidden">
      <header className="flex justify-between items-center mb-6 px-4 border-b border-zinc-900 pb-4">
        <div className="flex flex-col">
          <span className="text-[11px] font-black text-zinc-700 uppercase tracking-widest">Neural_Toolkit_Interface</span>
          <span className={`text-[12px] font-black uppercase ${mode === OperationalMode.REAL ? 'text-green-500' : 'text-blue-500'}`}>Protocol: {mode}</span>
        </div>
        <div className="flex items-center gap-4">
           <div className="text-[9px] text-zinc-800 font-mono text-right uppercase">
             Version: {APP_CONFIG.VERSION}<br/>
             Hash: 0xA1B2C
           </div>
        </div>
      </header>

      <div className="flex gap-10 flex-1 overflow-hidden">
        <div className="w-80 border-r border-zinc-900/60 pr-6 overflow-y-auto toolkit-tree no-scroll">
          <Tooltip name="MODULE_TREE" source="LOCAL" desc="Directory of tactical modules. Guided versions automate complex workflows.">
            <h4 className="text-[11px] font-black text-zinc-600 uppercase mb-6 tracking-[0.2em] px-2 flex items-center gap-3">
              <div className="w-2 h-2 bg-zinc-700"></div> MODULE_DIRECTORY
            </h4>
          </Tooltip>
          {categories.map(cat => (
            <div key={cat} className="mb-4">
              <div 
                onClick={() => toggleCategory(cat)}
                className="flex items-center gap-3 px-3 py-2.5 hover:bg-zinc-900/50 rounded-sm cursor-pointer group transition-colors"
              >
                <span className={`text-[9px] transition-transform duration-300 ${expandedCats.has(cat) ? 'rotate-90' : ''} text-zinc-600`}>▶</span>
                <span className="text-[12px] font-black text-zinc-500 group-hover:text-teal-400 tracking-widest uppercase">[{cat}]</span>
              </div>
              {expandedCats.has(cat) && (
                <div className="ml-5 border-l border-zinc-900 mt-2 space-y-1">
                  {TOOLS.filter(t => t.category === cat).map(tool => (
                    <div 
                      key={tool.id}
                      onClick={() => handleToolSelect(tool)}
                      className={`pl-5 pr-3 py-2 text-[11px] font-mono cursor-pointer transition-all border-l-2 ${selectedTool?.id === tool.id ? 'border-teal-400 bg-teal-500/5 text-teal-400 font-black' : 'border-transparent text-zinc-600 hover:text-zinc-400 hover:border-zinc-800'}`}
                    >
                      {tool.name.toUpperCase()}
                      {tool.id.includes('guided') && <span className="ml-2 text-[8px] bg-teal-900/20 text-teal-500 px-1 border border-teal-500/20">WIZARD</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto no-scroll pr-2">
          {selectedTool ? (
            <div className="space-y-8 animate-in slide-in-from-right-6 duration-400">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-black text-white tracking-widest uppercase mb-2">{selectedTool.name}</h2>
                  <p className="text-[11px] font-mono text-zinc-500 uppercase tracking-tighter italic">{selectedTool.description}</p>
                </div>
                <button 
                  onClick={() => onBreakdown(selectedTool.name, selectedTool.id.includes('guided') ? `Analyze guided module ${selectedTool.name} in ${mode} mode.` : `Breakdown raw module ${selectedTool.name}`)}
                  className="text-[10px] bg-zinc-900/80 px-4 py-1.5 border border-zinc-700 hover:border-[#bd00ff] text-zinc-400 font-black tracking-widest uppercase transition-all shadow-[0_0_10px_rgba(189,0,255,0.1)]"
                >
                  Neural_Insight
                </button>
              </div>
              
              {selectedTool.id.includes('guided') ? renderGuidedWizard() : (
                <>
                  <div className="grid grid-cols-2 gap-x-10 gap-y-6 bg-black/40 p-8 border border-zinc-900/60 rounded-sm shadow-inner">
                    {selectedTool.parameters.map(p => (
                      <div key={p.name} className="flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] uppercase font-black text-zinc-500 tracking-widest">{p.name}</label>
                          <span className="text-[9px] font-mono text-zinc-700 bg-zinc-950 px-2 py-0.5 border border-zinc-900 rounded-sm">{p.flag || 'POSITIONAL'}</span>
                        </div>
                        {p.type === 'toggle' ? (
                          <div className="flex items-center gap-4 mt-1">
                            <div 
                              onClick={() => setParams(prev => ({ ...prev, [p.name]: !prev[p.name] }))}
                              className={`w-12 h-5 rounded-sm border transition-all cursor-pointer flex items-center px-1.5 ${params[p.name] ? 'border-teal-400 bg-teal-500/20' : 'border-zinc-800 bg-zinc-950'}`}
                            >
                              <div className={`w-3 h-3 transition-all ${params[p.name] ? 'translate-x-6 bg-teal-400' : 'translate-x-0 bg-zinc-700'}`}></div>
                            </div>
                            <span className={`text-[10px] font-black uppercase ${params[p.name] ? 'text-teal-400' : 'text-zinc-700'}`}>{params[p.name] ? 'Enabled' : 'Disabled'}</span>
                          </div>
                        ) : (
                          <input 
                            type={p.type === 'number' ? 'number' : 'text'}
                            value={params[p.name] as string | number}
                            onChange={(e) => setParams(prev => ({ ...prev, [p.name]: e.target.value }))}
                            className="bg-zinc-950 border border-zinc-900 rounded-sm px-4 py-2.5 text-xs text-zinc-300 font-mono focus:border-teal-500/20 outline-none transition-colors"
                            placeholder="Awaiting input..."
                          />
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="mt-10 space-y-4">
                    <div className="bg-black/95 p-6 rounded-sm font-mono text-[13px] text-teal-400 border border-zinc-900 shadow-2xl relative group overflow-hidden">
                      <div className="absolute top-0 right-0 p-2 text-[8px] text-zinc-800 font-mono uppercase tracking-[0.3em]">Command_Payload_Preview</div>
                      <span className="text-zinc-700 font-black mr-4">$</span> {buildCommand()}
                    </div>
                    <button 
                      onClick={() => onRunCommand(buildCommand())} 
                      className="w-full bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 font-black py-4 px-8 rounded-sm text-[12px] uppercase tracking-[0.5em] transition-all border border-teal-500/30 hover:border-teal-400 shadow-[0_0_20px_rgba(20,184,166,0.1)]"
                    >
                      ARM_AND_TRANSMIT
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center opacity-30 select-none bg-zinc-950/20 rounded-lg border border-dashed border-zinc-900">
              <div className="w-24 h-24 border-2 border-dashed border-zinc-800 rounded-full flex items-center justify-center mb-10 animate-spin-slow">
                <svg className="w-12 h-12 text-zinc-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
              </div>
              <p className="text-[12px] font-black uppercase tracking-[0.6em] text-zinc-700 animate-pulse">Select Module to ARM</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Toolkit;
