
import React, { useState, useEffect } from 'react';
import BrainIcon from './BrainIcon';
import Tooltip from './Tooltip';
import TacticalButton from './TacticalButton';
import { Platform } from '../../types';

interface CardProps {
  id: string;
  title?: string;
  titleTooltip?: string;
  children: React.ReactNode;
  className?: string;
  onProbe?: () => void;
  onProbeInfo?: () => void;
  onBrain?: () => void;
  onLauncherSelect?: (panelId: string, type: 'data' | 'neural') => void;
  onHistory?: () => void;
  isProcessing?: boolean;
  variant?: 'real' | 'sim' | 'default' | 'blue' | 'purple' | 'green' | 'offline' | 'teal';
  probeColor?: string;
  allowDistortion?: boolean;
  platform?: Platform;
  cooldown?: number; // ms
}

const Card: React.FC<CardProps> = ({ 
  id, title, titleTooltip, children, className = '', onProbe, onProbeInfo, onBrain, onLauncherSelect, onHistory, isProcessing, variant = 'default', probeColor, allowDistortion = false, platform, cooldown = 0
}) => {
  const [isGlitching, setIsGlitching] = useState(false);

  useEffect(() => {
    if (!allowDistortion) return;

    let timeoutId: ReturnType<typeof setTimeout>;

    const triggerGlitch = () => {
      setIsGlitching(true);
      setTimeout(() => setIsGlitching(false), 150 + Math.random() * 150);
      const nextDelay = Math.random() * 20000 + 50000;
      timeoutId = setTimeout(triggerGlitch, nextDelay);
    };

    timeoutId = setTimeout(triggerGlitch, Math.random() * 5000 + 1000);
    return () => clearTimeout(timeoutId);
  }, [allowDistortion]);

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

  const getTitleColor = () => {
    if (platform === Platform.LINUX) return 'text-yellow-500';
    if (platform === Platform.WINDOWS) return 'text-blue-400';
    if (variant === 'offline') return 'text-red-900';
    return 'text-white';
  };

  const accent = getAccentStyles();
  const titleColorClass = getTitleColor();

  return (
    <div className={`cyber-border bg-[#0a0c0f]/95 border-t-2 ${accent.border} ${accent.shadow} flex flex-col ${className} ${isGlitching ? 'core-distortion' : ''}`}>
      {title && (
        <div className="px-4 py-1.5 border-b border-[#11181a] flex justify-between items-center bg-[#0d0f14]">
          <div className="flex items-center gap-2">
            {titleTooltip ? (
              <Tooltip name={title} source="SYSTEM" desc={titleTooltip}>
                <h3 className={`text-[10px] font-black uppercase tracking-[0.3em] ${titleColorClass}`}>
                  {title}
                </h3>
              </Tooltip>
            ) : (
              <h3 className={`text-[10px] font-black uppercase tracking-[0.3em] ${titleColorClass}`}>
                {title}
              </h3>
            )}
          </div>
          <div className="flex items-center gap-3">
            {onHistory && (
              <Tooltip name="HISTORICAL_LOGS" source="SYSTEM" desc="Access locally cached historical data snapshots for this panel.">
                <button 
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onHistory(); }}
                  className="w-3.5 h-3.5 border border-zinc-700 bg-zinc-950 flex items-center justify-center hover:border-zinc-400 group transition-all"
                >
                  <svg className="w-2.5 h-2.5 text-zinc-500 group-hover:text-zinc-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 8v4l3 3m6-3a9 9 0 1 1-12.73 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              </Tooltip>
            )}
            {onProbe && (
              <div className="flex items-center gap-1.5">
                <Tooltip name="DATA_SLOT_CONFIG" source="SYSTEM" desc="Configure the Data Probe Launcher and Ammunition. Supports Extended and Historical payloads.">
                  <button 
                    type="button"
                    onClick={() => onLauncherSelect?.(id, 'data')}
                    className="w-3.5 h-3.5 border border-zinc-700 hover:border-zinc-400 bg-zinc-950 flex items-center justify-center transition-all group"
                  >
                    <div className="w-1.5 h-1.5" style={{ backgroundColor: probeColor }} />
                  </button>
                </Tooltip>
                <Tooltip name="PACKET_AUDIT" source="NEURAL_NETWORK" variant="purple" desc="Inspect the raw JSON payload being transmitted to the Neural Engine. Useful for verifying data sanitization and context.">
                  <button 
                    type="button"
                    onClick={(e) => { e.stopPropagation(); if (onProbeInfo) onProbeInfo(); }}
                    className="w-3.5 h-3.5 rounded-full bg-purple-500/40 hover:bg-purple-400 transition-all cursor-help border border-purple-900 active:scale-75 shadow-sm"
                  />
                </Tooltip>
                <Tooltip name="CORE_PROBE_LAUNCHER" source="NEURAL_NETWORK" variant="purple" desc="Initiate a Deep-Dive System Probe using the configured Data Slot launcher.">
                  <TacticalButton 
                    label={isProcessing ? 'SYNC' : 'PROBE'}
                    onClick={onProbe}
                    onContextMenu={(e) => { if (onProbeInfo) onProbeInfo(); }}
                    disabled={isProcessing}
                    color={getEffectiveProbeColor()}
                    size="sm"
                    hasTopPins={false}
                    cooldown={cooldown}
                  />
                </Tooltip>
              </div>
            )}
            {onBrain && (
              <div className="flex items-center gap-1.5">
                <Tooltip name="NEURAL_SLOT_CONFIG" source="SYSTEM" desc="Configure the Neural Slot launcher. Optimized for rapid inference and context awareness.">
                  <button 
                    type="button"
                    onClick={() => onLauncherSelect?.(id, 'neural')}
                    className="w-3.5 h-3.5 border border-zinc-700 hover:border-zinc-400 bg-zinc-950 flex items-center justify-center transition-all group"
                  >
                    <div className="w-1.5 h-1.5 bg-[#00ffd5]" />
                  </button>
                </Tooltip>
                <Tooltip name="NEURAL_PROBE" source="NEURAL_NETWORK" variant="teal" desc="Initiate a Contextual Neural Inference using the configured Neural Slot launcher.">
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
