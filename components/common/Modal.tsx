
import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  variant?: 'blue' | 'purple' | 'green';
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, variant = 'blue' }) => {
  if (!isOpen) return null;

  const colorClass = variant === 'green' ? 'border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.3)]' :
                     variant === 'purple' ? 'border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.3)]' :
                     'border-[#00ffd5] shadow-[0_0_20px_rgba(0,255,213,0.3)]';

  const textClass = variant === 'green' ? 'text-green-500' :
                    variant === 'purple' ? 'text-purple-500' :
                    'text-[#00ffd5]';

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className={`w-full max-w-2xl bg-[#080c0d] border ${colorClass} relative flex flex-col max-h-[80vh] overflow-hidden local-scanline-container`}>
        {/* Decorative scanline - inside overflow-hidden parent */}
        <div className="animate-scanline z-50"></div>
        
        <div className="flex justify-between items-center p-4 border-b border-zinc-900 bg-zinc-950/40 relative z-10">
          <h2 className={`text-xs font-black uppercase tracking-[0.3em] font-mono ${textClass}`}>
            NEURAL_BREAKDOWN: {title}
          </h2>
          <button onClick={onClose} className="text-zinc-600 hover:text-white transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6 font-mono text-[11px] leading-relaxed text-zinc-300 selection:bg-blue-500/30 relative z-10">
          {children}
        </div>

        <div className="p-4 border-t border-zinc-900 bg-zinc-950/20 flex justify-end relative z-10">
          <button 
            onClick={onClose}
            className={`px-6 py-2 border text-[10px] font-black uppercase tracking-widest transition-all ${
              variant === 'green' ? 'border-green-500/30 text-green-500 hover:bg-green-500/10' :
              variant === 'purple' ? 'border-purple-500/30 text-purple-500 hover:bg-purple-500/10' :
              'border-[#00ffd5]/30 text-[#00ffd5] hover:bg-[#00ffd5]/10'
            }`}
          >
            DISMISS_INTELLIGENCE
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
