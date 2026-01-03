import React from 'react';

export type CoreState = 'disconnected' | 'simulated' | 'connected';

interface NeuralCoreProps { state: CoreState; }

const NeuralCore: React.FC<NeuralCoreProps> = ({ state }) => {
  const getTheme = () => {
    switch (state) {
      case 'connected': return { color: '#22c55e', glow: 'glow-green', accent: '#4ade80' };
      case 'simulated': return { color: '#00f2ff', glow: 'glow-blue', accent: '#60a5fa' };
      case 'disconnected': return { color: '#ff3e3e', glow: 'glow-red', accent: '#f87171' };
      default: return { color: '#333', glow: '', accent: '#555' };
    }
  };

  const { color, accent } = getTheme();

  return (
    <div className={`relative w-40 h-16 flex items-center justify-center transition-all duration-700 cursor-pointer group`}>
      {/* Schematic Background Glow */}
      <div 
        className="absolute inset-0 opacity-10 group-hover:opacity-25 transition-opacity duration-1000 blur-xl pointer-events-none"
        style={{ background: `radial-gradient(circle, ${color} 0%, transparent 80%)` }}
      ></div>

      <svg width="150" height="60" viewBox="0 0 100 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10">
        <defs>
          <filter id="hudCoreGlow">
            <feGaussianBlur in="SourceGraphic" stdDeviation="0.4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Outer Frame - Simplified Schematic style (User Requested) */}
        <rect 
          x="35" y="5" width="30" height="30" rx="1" 
          stroke={color} strokeWidth="0.5" strokeDasharray="2 1" opacity="0.3" 
        />
        
        {/* Perimeter Leads (Transistor Array) */}
        {[0, 1, 2].map(i => (
          <React.Fragment key={i}>
            <rect x={42 + i * 7} y="2" width="1" height="4" fill={color} opacity="0.4" />
            <rect x={42 + i * 7} y="34" width="1" height="4" fill={color} opacity="0.4" />
            <rect x="32" y={12 + i * 7} width="4" height="1" fill={color} opacity="0.4" />
            <rect x="64" y={12 + i * 7} width="4" height="1" fill={color} opacity="0.4" />
          </React.Fragment>
        ))}

        {/* Package Die */}
        <rect x="42" y="12" width="16" height="16" rx="0.5" fill="#020406" stroke={color} strokeWidth="0.8" opacity="0.9" filter="url(#hudCoreGlow)" />
        
        {/* Core Die Activity */}
        <rect x="47" y="17" width="6" height="6" fill={color} className="animate-pulse" opacity="0.2" />
        <circle cx="50" cy="20" r="1.5" fill={accent} filter="url(#hudCoreGlow)">
          <animate attributeName="r" values="1;2.2;1" dur="1.5s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.4;1;0.4" dur="1.5s" repeatCount="indefinite" />
        </circle>

        {/* Technical Label */}
        <text x="50" y="38" fill={color} fontSize="2.5" fontWeight="900" textAnchor="middle" opacity="0.6" letterSpacing="1.5">SENTINEL_CORE</text>
        <path d="M35 10 L35 5 L40 5" stroke={color} strokeWidth="0.8" opacity="0.8" />
      </svg>
      
      {/* HUD Interference Overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-5 group-hover:opacity-10 transition-opacity">
        <div className="w-full h-[1px] bg-white absolute top-1/4 animate-[scan_3s_infinite]"></div>
      </div>

      <style>{`
        @keyframes scan { 0% { top: 0%; } 100% { top: 100%; } }
      `}</style>
    </div>
  );
};

export default NeuralCore;