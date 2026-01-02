
import React from 'react';
import BrainIcon from './BrainIcon';
import Tooltip from './Tooltip';

interface CardProps {
  title?: string;
  titleTooltip?: string;
  children: React.ReactNode;
  className?: string;
  onProbe?: () => void;
  onBrain?: () => void;
  isProcessing?: boolean;
  variant?: 'real' | 'sim' | 'default' | 'blue' | 'purple' | 'green';
}

const Card: React.FC<CardProps> = ({ 
  title, titleTooltip, children, className = '', onProbe, onBrain, isProcessing, variant = 'default' 
}) => {
  const getAccentColor = () => {
    switch (variant) {
      case 'real': return 'border-t-[#22c55e]';
      case 'sim': return 'border-t-[#00f2ff]';
      case 'purple': return 'border-t-[#bd00ff]';
      case 'green': return 'border-t-[#22c55e]';
      case 'blue': return 'border-t-[#00f2ff]';
      default: return 'border-t-[#1a1e24]';
    }
  };

  const headerContent = (
    <div className="px-5 py-3 border-b border-[#11181a] flex justify-between items-center bg-[#0d0f14]">
      <div className="flex items-center gap-2">
        <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-[#4a5568]">
          {title}
        </h3>
      </div>
      <div className="flex items-center gap-4">
        {onProbe && (
          <button 
            onClick={onProbe}
            disabled={isProcessing}
            className="text-[10px] font-black text-[#00ffd5] hover:text-white transition-all bg-teal-950/20 px-3 py-1.5 border border-teal-500/30 hover:border-teal-400 disabled:opacity-30 uppercase tracking-widest"
          >
            {isProcessing ? 'SYNC...' : 'PROBE'}
          </button>
        )}
        {onBrain && <BrainIcon onClick={onBrain} isProcessing={isProcessing} />}
      </div>
    </div>
  );

  return (
    <div className={`cyber-border bg-[#0a0c0f]/95 border-t-2 ${getAccentColor()} flex flex-col ${className}`}>
      {title && (
        titleTooltip ? (
          <Tooltip name={title} source="SYSTEM" desc={titleTooltip}>
            {headerContent}
          </Tooltip>
        ) : headerContent
      )}
      <div className="flex-1 p-6">
        {children}
      </div>
    </div>
  );
};

export default Card;
