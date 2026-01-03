import React from 'react';
import BrainIcon from './BrainIcon';
import Tooltip from './Tooltip';
import TacticalButton from './TacticalButton';

interface CardProps {
  title?: string;
  titleTooltip?: string;
  children: React.ReactNode;
  className?: string;
  onProbe?: () => void;
  onBrain?: () => void;
  isProcessing?: boolean;
  variant?: 'real' | 'sim' | 'default' | 'blue' | 'purple' | 'green' | 'offline' | 'teal';
  probeColor?: string;
}

const Card: React.FC<CardProps> = ({ 
  title, titleTooltip, children, className = '', onProbe, onBrain, isProcessing, variant = 'default', probeColor
}) => {
  const getAccentStyles = () => {
    switch (variant) {
      case 'real':
      case 'green': 
        return { border: 'border-t-[#22c55e]', shadow: 'shadow-[inset_0_0_20px_rgba(34,197,94,0.05)]' };
      case 'sim':
      case 'blue': 
        return { border: 'border-t-[#00f2ff]', shadow: 'shadow-[inset_0_0_20px_rgba(0,242,255,0.05)]' };
      case 'offline':
        return { border: 'border-t-[#ff3e3e]', shadow: 'shadow-[inset_0_0_20px_rgba(255,62,62,0.05)]' };
      case 'purple': 
        return { border: 'border-t-[#bd00ff]', shadow: 'shadow-[inset_0_0_20px_rgba(189,0,255,0.05)]' };
      case 'teal':
      case 'default': 
        return { border: 'border-t-[#00ffd5]', shadow: 'shadow-[inset_0_0_20px_rgba(0,255,213,0.05)]' };
      default: 
        return { border: 'border-t-[#1a1e24]', shadow: '' };
    }
  };

  const getEffectiveProbeColor = () => {
    if (probeColor) return probeColor;
    return '#bd00ff';
  };

  const accent = getAccentStyles();

  const headerContent = (
    <div className="px-4 py-1.5 border-b border-[#11181a] flex justify-between items-center bg-[#0d0f14]">
      <div className="flex items-center gap-2">
        <h3 className={`text-[10px] font-black uppercase tracking-[0.3em] ${variant === 'offline' ? 'text-red-900' : 'text-[#4a5568]'}`}>
          {title}
        </h3>
      </div>
      <div className="flex items-center gap-3">
        {onProbe && (
          <Tooltip name="core_probe_launcher" source="AI" variant="purple" desc="Engage high-fidelity analysis payload. Consumes 1 CORE CHARGE.">
            <TacticalButton 
              label={isProcessing ? 'SYNC' : 'PROBE'}
              onClick={onProbe}
              disabled={isProcessing}
              color={getEffectiveProbeColor()}
              size="sm"
              hasTopPins={false}
            />
          </Tooltip>
        )}
        {onBrain && (
          <Tooltip name="NEURAL_BRAIN_PROBE" source="AI" variant="teal" desc="Invoke smart tooltip inference. Consumes 1 NEURAL CHARGE.">
            <BrainIcon onClick={onBrain} isProcessing={isProcessing} color="#00ffd5" className="!p-1 !w-6 !h-6" />
          </Tooltip>
        )}
      </div>
    </div>
  );

  return (
    <div className={`cyber-border bg-[#0a0c0f]/95 border-t-2 ${accent.border} ${accent.shadow} flex flex-col ${className}`}>
      {title && (
        titleTooltip ? (
          <Tooltip name={title} source="SYSTEM" desc={titleTooltip}>
            {headerContent}
          </Tooltip>
        ) : headerContent
      )}
      <div className="flex-1 p-4 overflow-hidden flex flex-col">
        {children}
      </div>
    </div>
  );
};

export default Card;