import React from 'react';

interface TacticalButtonProps {
  label: string;
  onClick: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  disabled?: boolean;
  color?: string; // hex
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  hasTopPins?: boolean;
}

const TacticalButton: React.FC<TacticalButtonProps> = ({ 
  label, onClick, onContextMenu, disabled, color = '#00ffd5', size = 'md', className = '', hasTopPins = false 
}) => {
  const isSm = size === 'sm';
  
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
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        onContextMenu={(e) => {
          if (onContextMenu) {
            e.preventDefault();
            e.stopPropagation();
            onContextMenu(e);
          }
        }}
        disabled={disabled}
        className={`relative bg-[#050608] border-x border-b shadow-lg flex items-center justify-center transition-all disabled:opacity-30 overflow-hidden cursor-pointer active:scale-95 group-hover:bg-zinc-900/40`}
        style={{ 
          borderColor: `${color}44`,
          width: isSm ? '60px' : '80px',
          height: isSm ? '20px' : '28px',
          boxShadow: `0 4px 10px rgba(0,0,0,0.5), inset 0 0 0px ${color}00`
        }}
      >
        {/* Glow effect on hover */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity" style={{ backgroundColor: color }}></div>
        
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
};

export default TacticalButton;