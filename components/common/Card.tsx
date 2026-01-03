
import React from 'react';
import BrainIcon from './BrainIcon';
import Tooltip from './Tooltip';
import TacticalButton from './TacticalButton';

interface CardProps {
  id: string;
  title?: string;
  titleTooltip?: string;
  children: React.ReactNode;
  className?: string;
  onProbe?: () => void;
  onProbeInfo?: () => void;
  onBrain?: () => void;
  onLauncherSelect?: (type: 'core' | 'neural') => void;
  isProcessing?: boolean;
  variant?: 'real' | 'sim' | 'default' | 'blue' | 'purple' | 'green' | 'offline' | 'teal';
  probeColor?: string;
}

const Card: React.FC<CardProps> = ({ 
  id, title, titleTooltip, children, className = '', onProbe, onProbeInfo, onBrain, onLauncherSelect, isProcessing, variant = 'default', probeColor
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

  return (
    <div className={`cyber-border bg-[#0a0c0f]/95 border-t-2 ${accent.border} ${accent.shadow} flex flex-col ${className}`}>
      {title && (
        <div className="px-4 py-1.5 border-b border-[#11181a] flex justify-between items-center bg-[#0d0f14]">
          <div className="flex items-center gap-2">
            {titleTooltip ? (
              <Tooltip name={title} source="SYSTEM" desc={titleTooltip}>
                <h3 className={`text-[10px] font-black uppercase tracking-[0.3em] ${variant === 'offline' ? 'text-red-900' : 'text-[#4a5568]'}`}>
                  {title}
                </h3>
              </Tooltip>
            ) : (
              <h3 className={`text-[10px] font-black uppercase tracking-[0.3em] ${variant === 'offline' ? 'text-red-900' : 'text-[#4a5568]'}`}>
                {title}
              </h3>
            )}
          </div>
          <div className="flex items-center gap-3">
            {onProbe && (
              <div className="flex items-center gap-1.5">
                <Tooltip name="LAUNCHER_CONFIG" source="SYSTEM" desc="Select a specific Core Launcher for this probe.">
                  <button 
                    type="button"
                    onClick={() => onLauncherSelect?.('core')}
                    className="w-3.5 h-3.5 border border-zinc-700 hover:border-zinc-400 bg-zinc-950 flex items-center justify-center transition-all group"
                  >
                    <div className="w-1.5 h-1.5" style={{ backgroundColor: probeColor }} />
                  </button>
                </Tooltip>
                <Tooltip name="PACKET_AUDIT" source="NEURAL_NETWORK" variant="purple" desc="Inspect raw JSON data packet for this neural probe.">
                  <button 
                    type="button"
                    onClick={(e) => { e.stopPropagation(); if (onProbeInfo) onProbeInfo(); }}
                    className="w-3.5 h-3.5 rounded-full bg-purple-500/40 hover:bg-purple-400 transition-all cursor-help border border-purple-900 active:scale-75 shadow-sm"
                  />
                </Tooltip>
                <Tooltip name="CORE_PROBE_LAUNCHER" source="NEURAL_NETWORK" variant="purple" desc="Engage high-fidelity neural analysis. Consumes 1 CHARGE from selected launcher.">
                  <TacticalButton 
                    label={isProcessing ? 'SYNC' : 'PROBE'}
                    onClick={onProbe}
                    onContextMenu={(e) => { if (onProbeInfo) onProbeInfo(); }}
                    disabled={isProcessing}
                    color={getEffectiveProbeColor()}
                    size="sm"
                    hasTopPins={false}
                  />
                </Tooltip>
              </div>
            )}
            {onBrain && (
              <div className="flex items-center gap-1.5">
                <Tooltip name="LAUNCHER_CONFIG" source="SYSTEM" desc="Select a specific Neural Launcher for synaptic inference.">
                  <button 
                    type="button"
                    onClick={() => onLauncherSelect?.('neural')}
                    className="w-3.5 h-3.5 border border-zinc-700 hover:border-zinc-400 bg-zinc-950 flex items-center justify-center transition-all group"
                  >
                    <div className="w-1.5 h-1.5 bg-[#00ffd5]" />
                  </button>
                </Tooltip>
                <Tooltip name="BRAIN_PROBE" source="NEURAL_NETWORK" variant="teal" desc="Invoke smart inference. Consumes 1 CHARGE from selected launcher.">
                  <BrainIcon onClick={onBrain} isProcessing={isProcessing} color="#00ffd5" className="!p-1 !w-6 !h-6" />
                </Tooltip>
              </div>
            )}
          </div>
        </div>
      )}
      <div className="flex-1 p-4 overflow-hidden flex flex-col">
        {children}
      </div>
    </div>
  );
};

export default Card;
