
import React, { useState, useEffect } from 'react';
import Tooltip from './Tooltip';
import TacticalButton from './TacticalButton';
import { Platform, SlotPermissions, PanelSlotConfig, SlotConfig } from '../../types';
import { launcherSystem } from '../../services/launcherService';
import { serverService } from '../../services/serverService';

interface CardProps {
  id: string;
  title?: string;
  titleTooltip?: string;
  children: React.ReactNode;
  className?: string;
  onProbe?: () => void;
  onProbeInfo?: () => void;
  onBrain?: () => void;
  onLauncherSelect?: (panelId: string, type: 'low' | 'probe') => void;
  onHistory?: () => void;
  isProcessing?: boolean;
  variant?: 'real' | 'sim' | 'default' | 'blue' | 'purple' | 'green' | 'offline' | 'teal';
  probeColor?: string;
  allowDistortion?: boolean;
  platform?: Platform;
  cooldown?: number; // ms
  permissions?: SlotPermissions;
  slotConfig?: PanelSlotConfig; // Actual equipped launchers
  globalLowSlot?: SlotConfig; // Centered low slot
}

const Card: React.FC<CardProps> = ({ 
  id, title, titleTooltip, children, className = '', onProbe, onProbeInfo, onBrain, onLauncherSelect, onHistory, isProcessing, variant = 'default', probeColor, allowDistortion = false, platform, cooldown = 0, permissions = { low: true, probe: true, sensor: false }, slotConfig, globalLowSlot
}) => {
  const [isGlitching, setIsGlitching] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

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
      case 'green': return { border: 'border-t-[#22c55e]', shadow: 'shadow-[inset_0_0_20px_rgba(34,197,94,0.05)]' };
      case 'sim':
      case 'blue': return { border: 'border-t-[#00f2ff]', shadow: 'shadow-[inset_0_0_20px_rgba(0,242,255,0.05)]' };
      case 'offline': return { border: 'border-t-[#ff3e3e]', shadow: 'shadow-[inset_0_0_20px_rgba(255,62,62,0.05)]' };
      case 'purple': return { border: 'border-t-[#bd00ff]', shadow: 'shadow-[inset_0_0_20px_rgba(189,0,255,0.05)]' };
      case 'teal':
      case 'default': return { border: 'border-t-[#00ffd5]', shadow: 'shadow-[inset_0_0_20px_rgba(0,255,213,0.05)]' };
      default: return { border: 'border-t-[#1a1e24]', shadow: '' };
    }
  };

  const getTitleColor = () => {
    if (platform === Platform.LINUX) return 'text-yellow-500';
    if (platform === Platform.WINDOWS) return 'text-blue-400';
    if (variant === 'offline') return 'text-red-900';
    return 'text-white';
  };

  const hudAccentColor = platform === Platform.LINUX ? 'var(--accent-gold)' : 'var(--accent-blue)';
  const accent = getAccentStyles();
  const titleColorClass = getTitleColor();

  const renderSlotIcon = (type: 'low' | 'probe') => {
    const equipped = type === 'low' ? globalLowSlot : slotConfig?.probeSlot;
    const isEquipped = !!equipped?.launcherId;
    const isAdminEnabled = permissions[type];
    
    // Interaction is disabled for low slots as they are now globally managed.
    const isInteractive = isAdminEnabled && !isProcessing && type === 'probe';
    const targetPanelId = id;
    
    let label = type === 'low' ? 'LOW' : 'PROBE';
    let colorHex = isEquipped ? (type === 'low' ? '#00ffd5' : '#bd00ff') : '#52525b';
    let charges = 0;
    let maxCharges = 1;
    let cooldownValue = 0;
    let moduleName = 'EMPTY';

    if (isEquipped) {
      const launcher = launcherSystem.getById(equipped!.launcherId);
      moduleName = launcher?.name || equipped!.launcherId;
      charges = serverService.getCharges(equipped!.launcherId);
      maxCharges = launcher?.maxCharges || 1;
      cooldownValue = serverService.getCooldown(equipped!.launcherId);
    }

    const icon = type === 'low' ? (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.79-2.74 2.5 2.5 0 0 1-2-2.53 2.5 2.5 0 0 1 2.5-2.5h.75a.5.5 0 0 0 .5-.5v-4.73a2.5 2.5 0 0 1 2.5-2.5h1z" /></svg>
    ) : (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
    );

    if (!isAdminEnabled) colorHex = '#450a0a';

    let tooltipFullDesc = isAdminEnabled 
      ? `Slot: ${label}\nModule: ${moduleName}\nCharges: ${charges}/${maxCharges}\nCooldown: ${(cooldownValue/1000).toFixed(1)}s\n\n${type === 'low' ? 'GLOBAL Master Config. Shared across all panels. Edit via header timers.' : 'Local panel-specific probe manifold.'}`
      : 'DISABLED_BY_ADMIN';

    return (
      <Tooltip key={type} name={`${label}_SLOT`} source="SYSTEM" desc={tooltipFullDesc} variant={isEquipped ? (type === 'low' ? 'teal' : 'purple') : 'default'}>
        <div 
          onClick={() => isInteractive && onLauncherSelect?.(targetPanelId, type)}
          className={`group relative flex flex-col items-center justify-center w-10 h-12 border transition-all ${isInteractive ? 'bg-black/60 border-zinc-800 hover:border-zinc-500 cursor-pointer' : 'bg-red-950/10 border-red-900/20 opacity-40 cursor-default'}`}
          style={{ color: colorHex }}
        >
           <div className="relative">
              {icon}
              {isEquipped && charges > 0 && (
                <div className="absolute -top-1.5 -right-1.5 flex items-center justify-center bg-black border border-current rounded-full w-4 h-4 shadow-xl z-10">
                   <span className="text-[7px] font-black leading-none">{charges}</span>
                </div>
              )}
           </div>
           
           <span className="text-[6px] font-black mt-1.5 uppercase tracking-tighter opacity-70 group-hover:opacity-100">{label}</span>
           
           {isEquipped && cooldownValue > 0 && (
              <div className="absolute -bottom-1 left-0 right-0 h-1 bg-zinc-950 overflow-hidden border-x border-b border-zinc-900">
                 <div className="h-full bg-current transition-all duration-1000 shadow-[0_0:5px_currentColor]" style={{ width: `${serverService.getCooldownProgress(equipped!.launcherId) * 100}%` }}></div>
              </div>
           )}
        </div>
      </Tooltip>
    );
  };

  return (
    <div 
      className={`cyber-border circuit-board-pattern border-t-2 ${accent.border} ${accent.shadow} flex flex-col ${className} ${isGlitching ? 'core-distortion' : ''}`}
      style={{ '--hud-accent': hudAccentColor } as any}
    >
      {title && (
        <div className="px-4 py-2 border-b border-[#11181a] flex justify-between items-center bg-[#0d0f14]/80 backdrop-blur-md relative z-10">
          <div className="flex items-center gap-4">
            <h3 className={`text-[10px] font-black uppercase tracking-[0.3em] ${titleColorClass}`}>
              {title}
            </h3>
            
            <div className="flex items-center gap-1 border-l border-zinc-800/50 pl-4 ml-2">
              {/* Individual Low Slot rendering removed as per architectural update */}
              {renderSlotIcon('probe')}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {onHistory && (
              <Tooltip name="HISTORICAL_LOGS" source="SYSTEM" desc="Access locally cached historical telemetry data.">
                <button 
                  type="button" onClick={(e) => { e.stopPropagation(); onHistory(); }}
                  className="w-5 h-5 border border-zinc-700 bg-zinc-950 flex items-center justify-center hover:border-zinc-400 transition-all text-zinc-500 hover:text-zinc-300"
                >
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 8v4l3 3m6-3a9 9 0 1 1-12.73 0 9 9 0 0118 0z" /></svg>
                </button>
              </Tooltip>
            )}
            
            {onProbe && (
              <Tooltip name="CORE_DATA_PROBE" source="NEURAL_NETWORK" variant="purple" desc="Initiate a Deep-Dive Core Data Probe.">
                <TacticalButton 
                  label={isProcessing ? 'SYNC' : 'PROBE'} 
                  onClick={onProbe} 
                  disabled={isProcessing || !permissions.probe} 
                  color={probeColor || '#bd00ff'} 
                  size="sm" cooldown={cooldown} 
                />
              </Tooltip>
            )}

            {onBrain && (
              <Tooltip name="NEURAL_INFERENCE" source="NEURAL_NETWORK" variant="purple" desc="Initiate a Contextual Neural Inference using GLOBAL LOW slot.">
                <button 
                  onClick={onBrain} disabled={isProcessing || !permissions.low}
                  className={`p-1.5 border border-zinc-800 bg-zinc-950 flex items-center justify-center transition-all ${isProcessing ? 'animate-pulse text-purple-400' : 'text-teal-600 hover:text-teal-400'} ${!permissions.low ? 'opacity-20 cursor-not-allowed' : 'active:scale-90'}`}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.79-2.74 2.5 2.5 0 0 1-2-2.53 2.5 2.5 0 0 1 2.5-2.5h.75a.5.5 0 0 0 .5-.5v-4.73a2.5 2.5 0 0 1 2.5-2.5h1zM14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.79-2.74 2.5 2.5 0 0 0 2-2.53 2.5 2.5 0 0 0-2.5-2.5h-.75a.5.5 0 0 1-.5-.5v-4.73a2.5 2.5 0 0 0-2.5-2.5h-1z"/></svg>
                </button>
              </Tooltip>
            )}
          </div>
        </div>
      )}
      <div className="flex-1 p-4 overflow-hidden flex flex-col relative z-10">
        {children}
      </div>
    </div>
  );
};

export default Card;
