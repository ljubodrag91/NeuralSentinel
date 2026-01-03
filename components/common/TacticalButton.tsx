
import React, { memo } from 'react';

interface TacticalButtonProps {
  label: string;
  onClick: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  disabled?: boolean;
  color?: string; // hex
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  hasTopPins?: boolean;
  cooldown?: number; // ms remaining
}

const TacticalButton: React.FC<TacticalButtonProps> = memo(({ 
  label, onClick, onContextMenu, disabled, color = '#00ffd5', size = 'md', className = '', hasTopPins = false, cooldown = 0 
}) => {
  const isSm = size === 'sm';
  const isCooldown = cooldown > 0;
  
  return (
    <div className={`relative flex flex-col items-center group ${className}`}>
      {/* Tiny leads top */}
      {hasTopPins && (
        <div className="flex gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
          <div className="w-[1px] h-2" style={{ backgroundColor: color }}></div>
          <div className="w-[1px] h-3" style={{ backgroundColor: color }}></div>
          <div className="w-[1px] h-2" style={{ backgroundColor: color }}></div>
        </div>
      )}
      
      {/* Transistor Body */}
      <button 
        onClick={(e) => { e.stopPropagation(); if (!isCooldown) onClick(); }}
        onContextMenu={(e) => {
          if (onContextMenu) {
            e.preventDefault();
            e.stopPropagation();
            onContextMenu(e);
          }
        }}
        disabled={disabled || isCooldown}
        className={`relative bg-[#050608] border-x border-b shadow-lg flex items-center justify-center transition-all disabled:opacity-30 overflow-hidden cursor-pointer active:scale-95 group-hover:bg-zinc-900/40`}
        style={{ 
          borderColor: isCooldown ? '#3f3f46' : `${color}44`, // zinc-700 when cooldown
          width: isSm ? '60px' : '80px',
          height: isSm ? '20px' : '28px',
          boxShadow: `0 4px 10px rgba(0,0,0,0.5), inset 0 0 0px ${color}00`,
          cursor: isCooldown ? 'not-allowed' : 'pointer'
        }}
      >
        {/* Glow effect on hover */}
        {!isCooldown && <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity" style={{ backgroundColor: color }}></div>}
        
        {/* Cooldown Overlay */}
        {isCooldown && (
           <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-20">
              <span className="text-[8px] font-black text-zinc-500 animate-pulse">{(cooldown / 1000).toFixed(1)}s</span>
              <div className="absolute bottom-0 left-0 h-[2px] bg-red-500 transition-all duration-100 w-full animate-pulse"></div>
           </div>
        )}

        <div className="absolute top-0.5 left-1 text-[4px] text-zinc-800 font-mono tracking-tighter uppercase opacity-30 group-hover:opacity-50 transition-opacity">NPN_STNL</div>
        
        <span className={`font-black uppercase tracking-widest text-center transition-all group-hover:brightness-125`} style={{ 
          color: color, 
          fontSize: isSm ? '7px' : '9px',
          textShadow: `0 0 8px ${color}44`
        }}>
          {label}
        </span>

        {/* Highlight line */}
        <div className="absolute bottom-0 left-0 right-0 h-[1px] opacity-20 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: color }}></div>
      </button>

      {/* Tiny leads bottom */}
      <div className="flex gap-3 mt-[-1px] opacity-20 group-hover:opacity-60 transition-opacity">
        <div className="w-[0.5px] h-2" style={{ backgroundColor: color }}></div>
        <div className="w-[0.5px] h-3" style={{ backgroundColor: color }}></div>
        <div className="w-[0.5px] h-2" style={{ backgroundColor: color }}></div>
      </div>
    </div>
  );
});

export default TacticalButton;
