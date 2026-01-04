import React, { useEffect, useState, useMemo, useCallback } from 'react';
import Modal from './Modal';
import { fetchLocalModels } from '../../services/aiService';
import { NeuralNetworkConfig, NeuralNetworkProvider } from '../../types';
import Tooltip from './Tooltip';

interface CoreSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  config: NeuralNetworkConfig;
  setConfig: React.Dispatch<React.SetStateAction<NeuralNetworkConfig>>;
}

const PUBLIC_MODELS = [
  { id: 'gemini-3-flash-preview', name: 'GEMINI 3 FLASH', type: 'PUBLIC_CLOUD', desc: 'High-speed reasoning engine optimized for rapid tactical responses. Ideal for real-time telemetry auditing.' },
  { id: 'gemini-3-pro-preview', name: 'GEMINI 3 PRO', type: 'PUBLIC_CLOUD', desc: 'Advanced cognitive model for complex heuristic analysis, code interpretation, and deep security probes.' },
  { id: 'gemini-2.5-flash-latest', name: 'GEMINI 2.5 FLASH', type: 'PUBLIC_CLOUD', desc: 'Balanced performance production model. Reliable baseline for general SOC operations.' }
];

const DEFAULT_LOCAL_ENDPOINT = 'http://127.0.0.1:1234/v1';
const ENDPOINTS_MAP_KEY = 'neural_sentinel_model_endpoints_v1';

export const CoreSelectorDialog: React.FC<CoreSelectorProps> = ({ isOpen, onClose, config, setConfig }) => {
  const [localModels, setLocalModels] = useState<{id: string, name: string}[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [stagedModel, setStagedModel] = useState<string>(config.model);
  const [stagedProvider, setStagedProvider] = useState<NeuralNetworkProvider>(config.provider);
  const [inputEndpoint, setInputEndpoint] = useState<string>(config.endpoint || DEFAULT_LOCAL_ENDPOINT);
  const [endpointError, setEndpointError] = useState<string | null>(null);

  // Per-model endpoint persistence map
  const [endpointsMap, setEndpointsMap] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem(ENDPOINTS_MAP_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });

  useEffect(() => {
    localStorage.setItem(ENDPOINTS_MAP_KEY, JSON.stringify(endpointsMap));
  }, [endpointsMap]);

  const validateEndpoint = (url: string) => {
    try {
        const parsed = new URL(url);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
        return false;
    }
  };

  const refreshLocalModels = useCallback(async (endpoint: string) => {
    if (!validateEndpoint(endpoint)) {
        setEndpointError("Invalid Endpoint URL (http://ip:port/v1)");
        return;
    }
    setEndpointError(null);
    setIsLoading(true);
    try {
        const models = await fetchLocalModels(endpoint);
        setLocalModels(models.map(m => ({ id: m, name: m })));
    } catch (e) {
        setLocalModels([]);
    } finally {
        setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setStagedModel(config.model);
      setStagedProvider(config.provider);
      
      const initialEndpoint = config.endpoint || DEFAULT_LOCAL_ENDPOINT;
      setInputEndpoint(initialEndpoint);
      refreshLocalModels(initialEndpoint);
    }
  }, [isOpen, config, refreshLocalModels]);

  const handleStageSelect = (modelId: string, provider: NeuralNetworkProvider) => {
     setStagedModel(modelId);
     setStagedProvider(provider);
     
     if (provider === NeuralNetworkProvider.LOCAL) {
        // If we have a saved endpoint for this specific model, use it.
        // Otherwise, stick with current inputEndpoint (likely the discovery URL).
        if (endpointsMap[modelId]) {
            setInputEndpoint(endpointsMap[modelId]);
        } else {
            // Save the current input as the default for this new model ID
            setEndpointsMap(prev => ({ ...prev, [modelId]: inputEndpoint }));
        }
     }
  };

  const handleEndpointChange = (val: string) => {
     setInputEndpoint(val);
     if (stagedProvider === NeuralNetworkProvider.LOCAL) {
         setEndpointsMap(prev => ({ ...prev, [stagedModel]: val }));
     }
  };

  const handleConfirm = () => {
    if (!validateEndpoint(inputEndpoint)) return;
    
    setConfig(prev => ({
        ...prev,
        provider: stagedProvider,
        model: stagedModel,
        endpoint: inputEndpoint
    }));
    onClose();
  };

  const hasChanges = useMemo(() => {
    return stagedModel !== config.model || stagedProvider !== config.provider || inputEndpoint !== config.endpoint;
  }, [stagedModel, stagedProvider, inputEndpoint, config]);

  const renderCircularCard = (model: {id: string, name: string, type: string, desc?: string}, isPublic: boolean) => {
     const provider = isPublic ? NeuralNetworkProvider.GEMINI : NeuralNetworkProvider.LOCAL;
     const isStaged = stagedModel === model.id && stagedProvider === provider;
     const isCurrentActive = config.model === model.id && config.provider === provider;
     
     const borderColor = isStaged 
        ? (isPublic ? 'border-yellow-500' : 'border-teal-400') 
        : 'border-zinc-800';
     
     const bgClass = isStaged 
        ? (isPublic ? 'bg-yellow-950/20' : 'bg-teal-950/20') 
        : 'bg-black/60 hover:bg-zinc-900';

     const textColor = isStaged ? (isPublic ? 'text-yellow-500' : 'text-teal-400') : 'text-zinc-500 group-hover:text-zinc-300';
     const glow = isStaged ? (isPublic ? 'shadow-[0_0_30px_rgba(234,179,8,0.3)]' : 'shadow-[0_0_30px_rgba(45,212,191,0.3)]') : '';
     const iconColor = isPublic ? 'bg-yellow-500' : 'bg-teal-500';

     const modelUrl = !isPublic ? (endpointsMap[model.id] || inputEndpoint) : null;

     return (
        <Tooltip key={model.id} name={model.name} source={isPublic ? 'GEMINI_NET' : 'LOCAL_HOST'} desc={model.desc || `Local inference model detected on ${modelUrl || 'discovery endpoint'}`}>
            <div 
              onClick={() => handleStageSelect(model.id, provider)}
              className={`
                group relative w-36 h-36 rounded-full border-2 cursor-pointer transition-all duration-300 flex flex-col items-center justify-center text-center p-4
                ${borderColor} ${bgClass} ${glow} hover:scale-105 active:scale-95
              `}
            >
               {isStaged && (
                 <div className={`absolute inset-[-4px] rounded-full border border-dashed opacity-50 animate-[spin_10s_linear_infinite] pointer-events-none ${isPublic ? 'border-yellow-500' : 'border-teal-400'}`}></div>
               )}

               {isStaged && <div className={`absolute -top-2 px-2 py-0.5 rounded-sm text-[8px] font-black uppercase tracking-widest ${isPublic ? 'bg-yellow-500 text-black' : 'bg-teal-500 text-black'}`}>STAGED</div>}
               {isCurrentActive && !isStaged && <div className="absolute -bottom-2 px-2 py-0.5 rounded-sm text-[6px] font-black uppercase border border-zinc-800 bg-black text-zinc-600">ACTIVE</div>}
               
               <div className={`w-2 h-2 rounded-full mb-2 ${iconColor} ${isStaged ? 'animate-pulse' : 'opacity-50'}`}></div>
               
               <span className={`text-[9px] font-black uppercase tracking-widest leading-tight ${textColor} truncate max-w-full`}>
                 {model.name.split('/').pop()?.replace(/[-_]/g, ' ') || model.name}
               </span>
               
               <span className="text-[7px] font-mono text-zinc-600 uppercase mt-1 max-w-full truncate px-2 opacity-70">
                 {model.type === 'PUBLIC_CLOUD' ? 'CLOUD' : 'LOCAL_NODE'}
               </span>
            </div>
        </Tooltip>
     );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="SELECT_AI_CORE_MATRIX" variant="purple">
       <div className="space-y-8 pb-6 h-full flex flex-col no-scroll">
          <div className="flex-1 overflow-y-auto no-scroll space-y-8 pr-2">
            {/* Public Models */}
            <section>
               <h4 className="text-[10px] font-black text-yellow-600 uppercase tracking-[0.2em] mb-6 border-b border-yellow-900/30 pb-1 flex items-center gap-2">
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"></path></svg>
                  Public_Cloud_Cores
               </h4>
               <div className="flex flex-wrap justify-center gap-6">
                  {PUBLIC_MODELS.map(m => renderCircularCard(m, true))}
               </div>
            </section>

            {/* Local Models */}
            <section className="space-y-6">
               <div className="flex flex-col gap-4">
                  <h4 className="text-[10px] font-black text-teal-600 uppercase tracking-[0.2em] border-b border-teal-900/30 pb-1 flex justify-between items-center">
                    <span className="flex items-center gap-2">
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 17l6-6-6-6"></path><path d="M12 19h8"></path></svg>
                        Local_Inference_Nodes
                    </span>
                  </h4>
                  
                  {/* Discovery / Selected Model Configuration */}
                  <div className="flex flex-col gap-2 bg-black/40 border border-zinc-900 p-4">
                      <div className="flex justify-between items-center">
                          <Tooltip name="CORE_ENDPOINT_CONFIG" source="CONFIG" desc="Configure the REST endpoint for the local model. Discovery typically targets port 1234. Per-model URLs are persisted.">
                             <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest cursor-help">
                               {stagedProvider === NeuralNetworkProvider.LOCAL ? `Configuring URL for: ${stagedModel}` : 'Discovery Endpoint URL'}
                             </label>
                          </Tooltip>
                          {endpointError && <span className="text-[8px] text-red-500 font-bold uppercase">{endpointError}</span>}
                      </div>
                      <div className="flex gap-2">
                          <input 
                              type="text" 
                              value={inputEndpoint} 
                              onChange={(e) => handleEndpointChange(e.target.value)}
                              placeholder="http://127.0.0.1:1234/v1"
                              className="flex-1 bg-zinc-950 border border-zinc-800 p-2 text-[10px] font-mono text-teal-400 outline-none focus:border-teal-500/50"
                          />
                          <button 
                             onClick={() => refreshLocalModels(inputEndpoint)}
                             className="px-4 py-2 border border-zinc-800 text-[9px] font-black uppercase text-zinc-600 hover:text-white hover:border-zinc-500 transition-all"
                          >
                             DISCOVER_MODELS
                          </button>
                      </div>
                  </div>
               </div>

               {isLoading ? (
                  <div className="p-12 border border-dashed border-zinc-800 text-center bg-black/40 rounded-full w-48 h-48 flex flex-col items-center justify-center mx-auto">
                      <div className="text-[10px] text-teal-500 animate-pulse font-black uppercase mb-2">SCANNING_PORTS...</div>
                      <div className="w-8 h-8 border-4 border-zinc-700 border-t-teal-500 rounded-full animate-spin"></div>
                  </div>
               ) : localModels.length > 0 ? (
                  <div className="flex flex-wrap justify-center gap-6">
                     {localModels.map(m => renderCircularCard({ ...m, type: 'LOCAL' }, false))}
                  </div>
               ) : (
                  <div className="p-6 border border-zinc-900 bg-zinc-950/50 text-center flex flex-col items-center rounded-sm">
                     <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center mb-2">
                         <svg className="w-4 h-4 text-zinc-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path><line x1="12" y1="2" x2="12" y2="12"></line></svg>
                     </div>
                     <span className="text-[9px] text-zinc-600 font-mono uppercase">NO_LOCAL_CORES_DETECTED</span>
                     <p className="text-[8px] text-zinc-700 mt-1 max-w-xs">Attempting discovery at {inputEndpoint}. Ensure your local inference engine is active.</p>
                  </div>
               )}
            </section>
          </div>

          <div className="pt-6 border-t border-zinc-900 shrink-0">
             <button 
               onClick={handleConfirm}
               disabled={!hasChanges || !!endpointError}
               className={`w-full py-4 text-[11px] font-black uppercase tracking-[0.4em] transition-all shadow-[0_0_20px_rgba(189,0,255,0.1)] ${hasChanges && !endpointError ? 'bg-purple-500/20 border border-purple-500 text-purple-400 hover:bg-purple-500/30' : 'bg-zinc-950 border border-zinc-800 text-zinc-700 cursor-not-allowed opacity-50'}`}
             >
               CONFIRM_CORE_SWAP
             </button>
          </div>
       </div>
    </Modal>
  );
};
