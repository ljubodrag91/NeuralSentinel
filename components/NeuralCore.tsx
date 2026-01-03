import React from 'react';

export type CoreState = 'disconnected' | 'simulated' | 'connected';

interface NeuralCoreProps { state: CoreState; }

const NeuralCore: React.FC<NeuralCoreProps> = ({ state }) => {
  const getTheme = () => {
    switch (state) {
      case 'connected': return { color: '#22c55e', glow: 'glow-green', accent: '#4ade80' };
      case 'simulated': return { color: '#0088ff', glow: 'glow-blue', accent: '#60a5fa' };
      case 'disconnected': return { color: '#ff3e3e', glow: 'glow-red', accent: '#f87171' };
      default: return { color: '#333', glow: '', accent: '#555' };
    }
  };

  const { color, glow, accent } = getTheme();

  return (
    <div className={`relative w-40 h-16 flex items-center justify-center transition-all duration-700 cursor-pointer group`}>
      {/* HUD Background elements */}
      <div 
        className="absolute inset-0 opacity-10 group-hover:opacity-30 transition-opacity duration-1000 blur-xl pointer-events-none"
        style={{ background: `radial-gradient(circle, ${color} 0%, transparent 80%)` }}
      ></div>

      <svg width="150" height="60" viewBox="0 0 100 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10">
        <defs>
          <filter id="hudGlow">
            <feGaussianBlur in="SourceGraphic" stdDeviation="0.4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          
          <linearGradient id="traceGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: color, stopOpacity: 0.2 }} />
            <stop offset="50%" style={{ stopColor: color, stopOpacity: 0.8 }} />
            <stop offset="100%" style={{ stopColor: color, stopOpacity: 0.2 }} />
          </linearGradient>
        </defs>

        {/* Outer Frame - Schematic style */}
        <rect x="35" y="5" width="30" height="30" rx="1" stroke={color} strokeWidth="0.5" strokeDasharray="2 1" opacity="0.3" />
        
        {/* Perimeter Leads (Transistor pins) */}
        {[0, 1, 2].map(i => (
          <React.Fragment key={i}>
            <rect x={42 + i * 7} y="2" width="1" height="4" fill={color} opacity="0.4" />
            <rect x={42 + i * 7} y="34" width="1" height="4" fill={color} opacity="0.4" />
            <rect x="32" y={12 + i * 7} width="4" height="1" fill={color} opacity="0.4" />
            <rect x="64" y={12 + i * 7} width="4" height="1" fill={color} opacity="0.4" />
          </React.Fragment>
        ))}

        {/* Central Package */}
        <rect x="42" y="12" width="16" height="16" rx="0.5" fill="#05080a" stroke={color} strokeWidth="0.8" opacity="0.9" filter="url(#hudGlow)" />
        
        {/* Internal Trace Current */}
        <path d="M44 20 H56 M50 14 V26" stroke={color} strokeWidth="0.4" opacity="0.5" strokeDasharray="1 2">
          <animate attributeName="strokeDashoffset" from="3" to="0" dur="1s" repeatCount="indefinite" />
        </path>

        {/* Energy Core Die */}
        <rect x="47" y="17" width="6" height="6" fill={color} className="animate-pulse" opacity="0.2" />
        <circle cx="50" cy="20" r="1.5" fill={accent} filter="url(#hudGlow)">
          <animate attributeName="r" values="1;2.5;1" dur="1.5s" repeatCount="indefinite" />
        </circle>

        {/* Spark Arcs (Electrical Discharge) */}
        <g filter="url(#hudGlow)" className="transition-opacity duration-300">
           {/* Top-Left Spark */}
           <path d="M38 8 L42 12" stroke={accent} strokeWidth="0.4" opacity="0.8">
              <animate attributeName="opacity" values="0;1;0" dur="0.08s" repeatCount="indefinite" />
              <animate attributeName="d" values="M38 8 L42 12; M37 7 L43 13; M38 8 L42 12" dur="0.1s" repeatCount="indefinite" />
           </path>
           {/* Bottom-Right Spark */}
           <path d="M62 32 L58 28" stroke={accent} strokeWidth="0.4" opacity="0.8">
              <animate attributeName="opacity" values="0;1;0" dur="0.12s" repeatCount="indefinite" />
              <animate attributeName="d" values="M62 32 L58 28; M63 33 L57 27; M62 32 L58 28" dur="0.09s" repeatCount="indefinite" />
           </path>
           {/* Center Horizontal Pulse Spark */}
           <line x1="45" y1="20" x2="55" y2="20" stroke="white" strokeWidth="0.2" opacity="0.4">
              <animate attributeName="opacity" values="0;0.5;0" dur="0.05s" repeatCount="indefinite" />
           </line>
        </g>

        {/* Technical Labels */}
        <text x="50" y="38" fill={color} fontSize="2.5" fontWeight="900" textAnchor="middle" opacity="0.6" letterSpacing="1">STN_CORE</text>
        <path d="M35 10 L35 5 L40 5" stroke={color} strokeWidth="1" opacity="0.8" />
      </svg>
      
      {/* HUD Interference Lines */}
      <div className="absolute inset-0 pointer-events-none opacity-5 group-hover:opacity-10 transition-opacity">
        <div className="w-full h-[1px] bg-white absolute top-1/4 animate-[scan_3s_infinite]"></div>
        <div className="w-[1px] h-full bg-white absolute left-1/4 animate-[scanV_4s_infinite]"></div>
      </div>

      <style>{`
        @keyframes scan { 0% { top: 0%; } 100% { top: 100%; } }
        @keyframes scanV { 0% { left: 0%; } 100% { left: 100%; } }
      `}</style>
    </div>
  );
};

export default NeuralCore;