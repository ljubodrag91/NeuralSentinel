
import React, { useEffect, useState } from 'react';
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

const LOCAL_ENDPOINT_DEFAULT = 'http://127.0.0.1:1234/v1';

export const CoreSelectorDialog: React.FC<CoreSelectorProps> = ({ isOpen, onClose, config, setConfig }) => {
  const [localModels, setLocalModels] = useState<{id: string, name: string}[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      fetchLocalModels(LOCAL_ENDPOINT_DEFAULT)
        .then(models => {
           setLocalModels(models.map(m => ({ id: m, name: m })));
           setIsLoading(false);
        })
        .catch(() => setIsLoading(false));
    }
  }, [isOpen]);

  const handleSelect = (modelId: string, provider: NeuralNetworkProvider) => {
     setConfig(prev => ({
         ...prev,
         provider,
         model: modelId,
         endpoint: provider === NeuralNetworkProvider.LOCAL ? LOCAL_ENDPOINT_DEFAULT : prev.endpoint
     }));
  };

  const renderCircularCard = (model: {id: string, name: string, type: string, desc?: string}, isPublic: boolean) => {
     const isSelected = config.model === model.id && 
        (isPublic ? config.provider === NeuralNetworkProvider.GEMINI : config.provider === NeuralNetworkProvider.LOCAL);
     
     const borderColor = isSelected 
        ? (isPublic ? 'border-yellow-500' : 'border-teal-400') 
        : 'border-zinc-800';
     
     const bgClass = isSelected 
        ? (isPublic ? 'bg-yellow-950/20' : 'bg-teal-950/20') 
        : 'bg-black/60 hover:bg-zinc-900';

     const textColor = isSelected ? (isPublic ? 'text-yellow-500' : 'text-teal-400') : 'text-zinc-500 group-hover:text-zinc-300';
     const glow = isSelected ? (isPublic ? 'shadow-[0_0_30px_rgba(234,179,8,0.3)]' : 'shadow-[0_0_30px_rgba(45,212,191,0.3)]') : '';
     const iconColor = isPublic ? 'bg-yellow-500' : 'bg-teal-500';

     return (
        <Tooltip key={model.id} name={model.name} source={isPublic ? 'GEMINI_NET' : 'LOCAL_HOST'} desc={model.desc || `Local inference model detected on ${LOCAL_ENDPOINT_DEFAULT}`}>
            <div 
              onClick={() => handleSelect(model.id, isPublic ? NeuralNetworkProvider.GEMINI : NeuralNetworkProvider.LOCAL)}
              className={`
                group relative w-36 h-36 rounded-full border-2 cursor-pointer transition-all duration-300 flex flex-col items-center justify-center text-center p-4
                ${borderColor} ${bgClass} ${glow} hover:scale-105 active:scale-95
              `}
            >
               {/* Selection Ring Animation */}
               {isSelected && (
                 <div className={`absolute inset-[-4px] rounded-full border border-dashed opacity-50 animate-[spin_10s_linear_infinite] pointer-events-none ${isPublic ? 'border-yellow-500' : 'border-teal-500'}`}></div>
               )}

               {isSelected && <div className={`absolute -top-2 px-2 py-0.5 rounded-sm text-[8px] font-black uppercase tracking-widest ${isPublic ? 'bg-yellow-500 text-black' : 'bg-teal-500 text-black'}`}>ACTIVE</div>}
               
               <div className={`w-2 h-2 rounded-full mb-2 ${iconColor} ${isSelected ? 'animate-pulse' : 'opacity-50'}`}></div>
               
               <span className={`text-[9px] font-black uppercase tracking-widest leading-tight ${textColor}`}>
                 {model.name.replace(/ /g, '\n')}
               </span>
               
               <span className="text-[7px] font-mono text-zinc-600 uppercase mt-1 max-w-full truncate px-2 opacity-70">
                 {model.type === 'PUBLIC_CLOUD' ? 'CLOUD' : 'LOCAL'}
               </span>
            </div>
        </Tooltip>
     );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="SELECT_AI_CORE_MATRIX" variant="purple">
       <div className="space-y-8 pb-6">
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
          <section>
             <h4 className="text-[10px] font-black text-teal-600 uppercase tracking-[0.2em] mb-6 border-b border-teal-900/30 pb-1 flex justify-between items-center">
                <span className="flex items-center gap-2">
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 17l6-6-6-6"></path><path d="M12 19h8"></path></svg>
                    Local_Inference_Nodes
                </span>
                <span className="text-zinc-600 font-mono text-[8px]">{LOCAL_ENDPOINT_DEFAULT}</span>
             </h4>
             {isLoading ? (
                <div className="p-12 border border-dashed border-zinc-800 text-center bg-black/40 rounded-full w-48 h-48 flex flex-col items-center justify-center mx-auto">
                    <div className="text-[10px] text-teal-500 animate-pulse font-black uppercase mb-2">SCANNING_PORTS...</div>
                    <div className="w-8 h-8 border-4 border-zinc-700 border-t-teal-500 rounded-full animate-spin"></div>
                </div>
             ) : localModels.length > 0 ? (
                <div className="flex flex-wrap justify-center gap-6">
                   {localModels.map(m => renderCircularCard({ ...m, type: 'LOCAL', desc: 'Hosted via LM Studio / LocalAI' }, false))}
                </div>
             ) : (
                <div className="p-6 border border-zinc-900 bg-zinc-950/50 text-center flex flex-col items-center rounded-sm">
                   <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center mb-2">
                       <svg className="w-4 h-4 text-zinc-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path><line x1="12" y1="2" x2="12" y2="12"></line></svg>
                   </div>
                   <span className="text-[9px] text-zinc-600 font-mono uppercase">NO_LOCAL_CORES_DETECTED</span>
                   <p className="text-[8px] text-zinc-700 mt-1 max-w-xs">Ensure local inference server is running on port 1234 with CORS enabled.</p>
                </div>
             )}
          </section>
       </div>
    </Modal>
  );
};
