
import React, { useState, useEffect } from 'react';
import { TOOLS } from '../constants';
import { ToolDefinition, OperationalMode } from '../types';
import { APP_CONFIG } from '../services/config';
import Tooltip from './common/Tooltip';
import Card from './common/Card';

interface ToolkitProps {
  onRunCommand: (command: string) => void;
  onBreakdown: (topic: string, query?: string) => void;
  mode: OperationalMode;
  allowDistortion?: boolean;
}

type WizardStep = 'PREPARE' | 'DISCOVER' | 'SELECT' | 'INTENSITY' | 'CONFIRM' | 'EXECUTE';

const Toolkit: React.FC<ToolkitProps> = ({ onRunCommand, onBreakdown, mode, allowDistortion }) => {
  const [selectedTool, setSelectedTool] = useState<ToolDefinition | null>(null);
  const [params, setParams] = useState<Record<string, string | number | boolean>>({});
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set(['Reconnaissance', 'Wireless Attacks', 'Network Scanning']));

  // Wizard States
  const [wizardStep, setWizardStep] = useState<WizardStep>('PREPARE');
  const [wizardData, setWizardData] = useState<any[]>([]);
  const [selectedTarget, setSelectedTarget] = useState<any | null>(null);
  const [intensity, setIntensity] = useState<string>('Standard');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGlitching, setIsGlitching] = useState(false);

  useEffect(() => {
    if (!allowDistortion) return;
    
    let timeoutId: ReturnType<typeof setTimeout>;
    
    const triggerGlitch = () => {
      setIsGlitching(true);
      setTimeout(() => setIsGlitching(false), 150 + Math.random() * 150);
      // Sync with Card timing: 2s - 8s
      const nextDelay = Math.random() * 6000 + 2000;
      timeoutId = setTimeout(triggerGlitch, nextDelay);
    };

    timeoutId = setTimeout(triggerGlitch, Math.random() * 2000 + 1000);
    return () => clearTimeout(timeoutId);
  }, [allowDistortion]);

  const categories = Array.from(new Set(TOOLS.map(t => t.category)));

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
          <div className="space-y-4 py-2 animate-in fade-in zoom-in-95">
            <div className="p-6 bg-zinc-950/80 border border-zinc-900 rounded-sm">
              <Tooltip name="MODULE_CALIBRATION" source="SYSTEM" desc="Initial module sync and injection carrier engagement.">
                <h4 className="text-[10px] font-black text-teal-400 uppercase tracking-widest mb-2 cursor-help">Module_Calibration</h4>
              </Tooltip>
              <p className="text-[10px] text-zinc-500 mb-4 italic leading-relaxed">{isDeauth ? 'Engaging monitor-mode injection carrier...' : 'Pre-scanning network route for optimal latency...'}</p>
              <div className={`p-3 border ${mode === OperationalMode.REAL ? 'border-green-900/40 bg-green-950/10' : 'border-blue-900/40 bg-blue-950/10'} flex items-center gap-3`}>
                 <div className={`w-1.5 h-1.5 rounded-full animate-ping ${mode === OperationalMode.REAL ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                 <span className="text-[9px] font-black text-zinc-300 uppercase tracking-widest">Protocol: {mode}_MODE_STABLE</span>
              </div>
            </div>
            <button onClick={startDiscovery} className="w-full py-4 bg-teal-500/10 border border-teal-500/30 text-teal-400 text-[10px] font-black uppercase tracking-[0.4em] hover:bg-teal-500/20 transition-all min-h-[44px]">INITIALIZE_DISCOVERY</button>
          </div>
        );
      case 'DISCOVER':
        return (
          <div className="space-y-3 py-2 animate-in fade-in">
             <div className="flex justify-between items-center px-1">
               <Tooltip name="DISCOVERY_RESULTS" source="REAL" desc="Detected target entities within the reachable network scope.">
                 <h4 className="text-[10px] font-black text-zinc-700 uppercase tracking-widest cursor-help">Discovery_Results</h4>
               </Tooltip>
               {isProcessing && <span className="text-[9px] text-teal-500 animate-pulse font-black uppercase">[Scanning...]</span>}
             </div>
             <div className="grid grid-cols-1 gap-2 max-h-72 overflow-y-auto no-scroll">
               {wizardData.map((item, idx) => (
                 <div 
                  key={idx} 
                  onClick={() => { setSelectedTarget(item); setWizardStep('SELECT'); }}
                  className="p-3 bg-black/90 border border-zinc-900 hover:border-teal-500/50 cursor-pointer flex justify-between items-center group transition-colors shadow-sm"
                 >
                   <div className="flex flex-col">
                     <span className="text-[10px] font-black text-zinc-400 group-hover:text-white uppercase">{isDeauth ? item.essid : item.label}</span>
                     <span className="text-[8px] font-mono text-zinc-700">{isDeauth ? item.bssid : item.ip}</span>
                   </div>
                   <div className="text-[9px] font-mono text-teal-600 font-black uppercase border border-zinc-900/50 px-2 py-0.5 bg-zinc-950">
                     {isDeauth ? `${item.signal}dBm` : `PORTS: ${item.ports}`}
                   </div>
                 </div>
               ))}
             </div>
          </div>
        );
      case 'SELECT':
        return (
          <div className="space-y-4 py-2 animate-in slide-in-from-bottom-4">
            <div className="p-6 bg-[#0a0c0f] border border-zinc-900 shadow-inner">
               <Tooltip name="TARGET_CONFIRMATION" source="SYSTEM" desc="Verify selected target parameters before setting intensity.">
                 <h4 className="text-[10px] font-black text-teal-400 uppercase tracking-widest mb-4 border-b border-zinc-900 pb-2 cursor-help">Target_Confirmation</h4>
               </Tooltip>
               <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col"><span className="text-[8px] text-zinc-800 font-black uppercase">Descriptor</span><span className="text-zinc-200 text-[10px] font-black uppercase">{isDeauth ? selectedTarget?.essid : selectedTarget?.label}</span></div>
                  <div className="flex flex-col"><span className="text-[8px] text-zinc-800 font-black uppercase">Address</span><span className="text-zinc-500 font-mono text-[10px]">{isDeauth ? selectedTarget?.bssid : selectedTarget?.ip}</span></div>
               </div>
            </div>
            <div className="flex gap-3">
               <button onClick={() => setWizardStep('DISCOVER')} className="flex-1 py-3 border border-zinc-900 text-zinc-600 text-[9px] font-black uppercase tracking-widest hover:text-white transition-all min-h-[44px]">BACK</button>
               <button onClick={() => setWizardStep('INTENSITY')} className="flex-[2] py-3 bg-teal-500/10 border border-teal-500/30 text-teal-400 text-[9px] font-black uppercase tracking-widest hover:bg-teal-500/20 transition-all min-h-[44px]">SET_INTENSITY</button>
            </div>
          </div>
        );
      case 'INTENSITY':
        return (
          <div className="space-y-4 py-2 animate-in slide-in-from-bottom-2">
            <div className="grid grid-cols-2 gap-3">
              {['Quick', 'Standard', 'Heavy', 'Continuous'].map(lvl => (
                <Tooltip key={lvl} name="LOAD_INTENSITY" source="SYSTEM" desc={`Set execution weight to ${lvl}. Influences packet count and timing templates.`}>
                  <div 
                    onClick={() => setIntensity(lvl)}
                    className={`p-4 border cursor-pointer flex flex-col items-center gap-1 transition-all ${intensity === lvl ? 'bg-teal-950/20 border-teal-500' : 'bg-black border-zinc-900 hover:border-zinc-700'}`}
                  >
                    <span className={`text-[10px] font-black uppercase tracking-widest ${intensity === lvl ? 'text-teal-400' : 'text-zinc-700'}`}>{lvl}</span>
                  </div>
                </Tooltip>
              ))}
            </div>
            <button onClick={() => setWizardStep('CONFIRM')} className="w-full py-4 bg-teal-500/20 border border-teal-500 text-teal-400 text-[10px] font-black uppercase tracking-widest hover:bg-teal-500/30 transition-all min-h-[44px]">GENERATE_PLAN</button>
          </div>
        );
      case 'CONFIRM':
        return (
          <div className="space-y-6 py-2 animate-in zoom-in-95">
             <div className="p-6 bg-red-950/10 border border-red-900/30 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-1.5 text-[7px] text-red-900 font-black uppercase tracking-widest border-l border-b border-red-900/20 bg-red-950/20">Awaiting_Arm</div>
                <Tooltip name="MISSION_PARAMETERS" source="SYSTEM" desc="Final review of the arming sequence and target vector.">
                  <h4 className="text-[11px] font-black text-white uppercase tracking-[0.3em] mb-6 border-b border-zinc-900/40 pb-3 cursor-help">Mission_Parameters</h4>
                </Tooltip>
                <div className="space-y-3">
                  <div className="flex justify-between"><span className="text-[9px] text-zinc-700 font-black uppercase">Module</span><span className="text-[9px] text-zinc-400 uppercase">{selectedTool?.name}</span></div>
                  <div className="flex justify-between"><span className="text-[9px] text-zinc-700 font-black uppercase">Target</span><span className="text-[9px] text-teal-500 uppercase">{isDeauth ? selectedTarget?.essid : selectedTarget?.ip}</span></div>
                  <div className="flex justify-between"><span className="text-[9px] text-zinc-700 font-black uppercase">Intensity</span><span className="text-[9px] text-teal-500 uppercase">{intensity}</span></div>
                </div>
             </div>
             <div className="flex gap-3">
                <button onClick={() => setWizardStep('PREPARE')} className="flex-1 py-4 bg-zinc-950 border border-zinc-900 text-zinc-700 text-[10px] font-black uppercase tracking-widest hover:text-white transition-all min-h-[44px]">ABORT</button>
                <button onClick={() => { onRunCommand(buildCommand()); setWizardStep('EXECUTE'); }} className="flex-[2] py-4 bg-teal-500/20 border border-teal-500 text-teal-400 text-[10px] font-black uppercase tracking-[0.4em] hover:bg-teal-500/30 transition-all glow-teal min-h-[44px]">CONFIRM_EXECUTION</button>
             </div>
          </div>
        );
      case 'EXECUTE':
        return (
          <div className="h-72 flex flex-col items-center justify-center bg-black/40 rounded-sm border border-zinc-900">
             <div className="relative w-20 h-20 mb-6">
                <div className="absolute inset-0 border-4 border-teal-500/20 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-teal-500 rounded-full border-t-transparent animate-spin"></div>
             </div>
             <span className="text-[10px] font-black text-teal-400 uppercase tracking-[0.3em] animate-pulse">Neural_Carrier_Active</span>
             <p className="text-[8px] text-zinc-700 mt-3 font-mono uppercase truncate max-w-xs px-8 text-center">{buildCommand()}</p>
             <button onClick={() => setWizardStep('PREPARE')} className="mt-8 text-[8px] text-zinc-600 hover:text-red-500 uppercase font-black transition-colors border border-transparent hover:border-red-900/30 px-3 py-1">[ STOP_PAYLOAD ]</button>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className={`flex flex-col h-full animate-in fade-in duration-500 bg-[#050608]/20 p-2 rounded-sm border border-zinc-900/60 overflow-hidden ${isGlitching ? 'core-distortion' : ''}`}>
      <header className="flex justify-between items-center mb-4 px-2 border-b border-zinc-900/40 pb-2">
        <div className="flex flex-col">
          <Tooltip name="TOOLKIT_STATUS" source="SYSTEM" desc="Interface status for the arming and deployment of tactical modules.">
            <span className="text-[10px] font-black text-zinc-700 uppercase tracking-widest cursor-help">Module_Interface</span>
          </Tooltip>
          <span className={`text-[10px] font-black uppercase ${mode === OperationalMode.REAL ? 'text-green-500' : 'text-blue-500'}`}>{mode}_Active</span>
        </div>
        <div className="text-[8px] text-zinc-800 font-mono text-right uppercase">v.{APP_CONFIG.VERSION}<br/>Hash: 0x2A9B</div>
      </header>

      <div className="flex flex-col md:flex-row gap-6 flex-1 overflow-hidden">
        {/* Module Directory: Top on Mobile, Left on Desktop */}
        <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-zinc-900/40 pb-4 md:pb-0 md:pr-4 overflow-y-auto no-scroll max-h-[30vh] md:max-h-full">
          <Tooltip name="MODULE_DIRECTORY" source="SYSTEM" desc="Tree-structured catalog of available penetration testing tools.">
            <h4 className="text-[9px] font-black text-zinc-700 uppercase mb-4 tracking-widest flex items-center gap-2 cursor-help"><div className="w-1 h-1 bg-zinc-800"></div> Module_Directory</h4>
          </Tooltip>
          {categories.map(cat => (
            <div key={cat} className="mb-2">
              <div onClick={() => toggleCategory(cat)} className="flex items-center gap-2 px-2 py-3 md:py-1.5 hover:bg-zinc-900/40 rounded-sm cursor-pointer group transition-colors">
                <span className={`text-[7px] transition-transform ${expandedCats.has(cat) ? 'rotate-90' : ''} text-zinc-700`}>▶</span>
                <span className="text-[9px] font-black text-zinc-600 group-hover:text-teal-400 tracking-widest uppercase">[{cat}]</span>
              </div>
              {expandedCats.has(cat) && (
                <div className="ml-3 border-l border-zinc-900 mt-1 space-y-0.5">
                  {TOOLS.filter(t => t.category === cat).map(tool => (
                    <div 
                      key={tool.id} onClick={() => handleToolSelect(tool)}
                      className={`pl-3 py-3 md:py-1.5 text-[9px] font-mono cursor-pointer transition-all border-l ${selectedTool?.id === tool.id ? 'border-teal-400 bg-teal-500/5 text-teal-400 font-black' : 'border-transparent text-zinc-600 hover:text-zinc-400'}`}
                    >
                      {tool.name.toUpperCase()} {tool.id.includes('guided') && <span className="ml-1 text-[6px] text-teal-500/50">[WIZARD]</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto no-scroll md:pr-2">
          {selectedTool ? (
            <div className="space-y-6 animate-in slide-in-from-right-4">
              <div className="flex justify-between items-start border-b border-zinc-900/30 pb-3">
                <div>
                  <h2 className="text-sm font-black text-white tracking-widest uppercase mb-1">{selectedTool.name}</h2>
                  <p className="text-[9px] font-mono text-zinc-500 italic max-w-md">{selectedTool.description}</p>
                </div>
                <Tooltip name="NEURAL_INSIGHT" source="AI" desc="Invoke neural reasoning to explain module parameters and risks.">
                  <button 
                    onClick={() => onBreakdown(selectedTool.name, selectedTool.id.includes('guided') ? `Deep analyze tactical wizard for ${selectedTool.name} in ${mode} environment.` : `Breakdown raw flags for module ${selectedTool.name}`)}
                    className="text-[8px] bg-zinc-950 px-3 py-1.5 border border-zinc-900 hover:border-purple-500/50 text-zinc-600 font-black tracking-widest uppercase transition-all shadow-md hover:text-purple-400"
                  >
                    Neural_Insight
                  </button>
                </Tooltip>
              </div>
              
              {selectedTool.id.includes('guided') ? renderWizard() : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 bg-black/60 p-6 border border-zinc-900/60 rounded-sm shadow-inner">
                    {selectedTool.parameters.map(p => (
                      <div key={p.name} className="flex flex-col gap-1.5">
                        <div className="flex justify-between items-center">
                          <Tooltip name={p.name.toUpperCase()} source="CONFIG" desc={p.description}>
                            <label className="text-[8px] uppercase font-black text-zinc-700 tracking-widest cursor-help">{p.name}</label>
                          </Tooltip>
                          <span className="text-[7px] font-mono text-zinc-800">{p.flag || 'POSITIONAL'}</span>
                        </div>
                        {p.type === 'toggle' ? (
                          <div className="flex items-center gap-3 bg-zinc-950 border border-zinc-900 p-1 min-h-[44px]">
                            <div onClick={() => setParams(prev => ({ ...prev, [p.name]: !prev[p.name] }))} className={`w-8 h-3 rounded-sm border transition-all cursor-pointer flex items-center px-0.5 ${params[p.name] ? 'border-teal-400 bg-teal-500/20' : 'border-zinc-800 bg-zinc-950'}`}>
                              <div className={`w-2 h-2 transition-all ${params[p.name] ? 'translate-x-4 bg-teal-400' : 'translate-x-0 bg-zinc-700'}`}></div>
                            </div>
                            <span className={`text-[8px] font-black uppercase ${params[p.name] ? 'text-teal-400' : 'text-zinc-800'}`}>{params[p.name] ? 'ON' : 'OFF'}</span>
                          </div>
                        ) : p.type === 'select' ? (
                          <select 
                            value={(params[p.name] ?? "") as any} 
                            onChange={(e) => setParams(prev => ({ ...prev, [p.name]: e.target.value }))}
                            className="bg-zinc-950 border border-zinc-900 px-3 py-1.5 text-[10px] md:text-[14px] lg:text-[10px] text-zinc-400 font-mono outline-none focus:border-teal-500/20 transition-colors w-full appearance-none min-h-[44px]"
                          >
                            {p.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                          </select>
                        ) : (
                          <input type={p.type === 'number' ? 'number' : 'text'} value={(params[p.name] ?? "") as any} onChange={(e) => setParams(prev => ({ ...prev, [p.name]: e.target.value }))} className="bg-zinc-950 border border-zinc-900 px-3 py-1.5 text-[10px] md:text-[16px] lg:text-[10px] text-zinc-400 font-mono outline-none focus:border-teal-500/20 transition-colors min-h-[44px]" placeholder="Input..." />
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 space-y-3">
                    <Tooltip name="PAYLOAD_PREVIEW" source="SYSTEM" desc="Final command string generated from toolkit parameters.">
                      <div className="bg-black/95 p-4 font-mono text-[10px] text-teal-400 border border-zinc-900 shadow-xl relative overflow-hidden cursor-help flex items-center">
                        <div className="absolute top-0 right-0 p-1 text-[6px] text-zinc-900 font-mono uppercase bg-zinc-950 border-l border-b border-zinc-900">Payload_Preview</div>
                        <span className="text-zinc-800 font-black mr-3 select-none">$</span> {buildCommand()}
                      </div>
                    </Tooltip>
                    <button onClick={() => onRunCommand(buildCommand())} className="w-full bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 font-black py-4 text-[10px] uppercase tracking-[0.4em] transition-all border border-teal-500/30 shadow-[0_0_15px_rgba(20,184,166,0.1)] hover:shadow-[0_0_20px_rgba(20,184,166,0.2)] min-h-[44px]">ARM_AND_TRANSMIT</button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center opacity-30 bg-zinc-950/20 border border-dashed border-zinc-900/40 rounded-sm">
              <svg className="w-10 h-10 text-zinc-800 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-700 animate-pulse">Select Tactical Module</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Toolkit;
