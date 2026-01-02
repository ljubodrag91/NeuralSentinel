
import React from 'react';

export type CoreState = 'disconnected' | 'simulated' | 'connected';

interface NeuralCoreProps {
  state: CoreState;
}

const NeuralCore: React.FC<NeuralCoreProps> = ({ state }) => {
  const getTheme = () => {
    switch (state) {
      case 'connected': return { color: '#22c55e', glow: 'glow-green' };
      case 'simulated': return { color: '#0088ff', glow: 'glow-blue' };
      case 'disconnected': return { color: '#ff3e3e', glow: 'glow-red' };
      default: return { color: '#333', glow: '' };
    }
  };

  const { color, glow } = getTheme();

  return (
    <div className={`relative w-28 h-28 flex items-center justify-center transition-all duration-500 ${glow} core-distortion`}>
      <svg width="100" height="100" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Substrate Pins */}
        {[...Array(8)].map((_, i) => (
          <React.Fragment key={i}>
            <rect x={6 + i * 4} y="2" width="2" height="3" fill={color} fillOpacity="0.6" />
            <rect x={6 + i * 4} y="35" width="2" height="3" fill={color} fillOpacity="0.6" />
            <rect x="2" y={6 + i * 4} width="3" height="2" fill={color} fillOpacity="0.6" />
            <rect x="35" y={6 + i * 4} width="3" height="2" fill={color} fillOpacity="0.6" />
          </React.Fragment>
        ))}

        {/* Main CPU Body */}
        <rect x="5" y="5" width="30" height="30" rx="1" fill="#05070a" stroke={color} strokeWidth="1" />
        
        {/* Heat Spreader / Die Shield */}
        <rect x="10" y="10" width="20" height="20" rx="2" fill="#080a0f" stroke={color} strokeWidth="1.5" className="animate-pulse" />
        
        {/* The Core Logic (Die) */}
        <rect x="15" y="15" width="10" height="10" fill="#000" stroke={color} strokeWidth="0.5" strokeDasharray="1 1" />
        
        {/* Neural Activity Points */}
        <circle cx="20" cy="20" r="3" fill={color} className="animate-ping opacity-40" />
        <circle cx="20" cy="20" r="1.5" fill={color} />
        
        {/* Circuit Traces */}
        <path d="M10 20H15M25 20H30M20 10V15M20 25V30" stroke={color} strokeWidth="0.8" strokeLinecap="round" />
        <path d="M13 13L16 16M27 27L24 24M27 13L24 16M13 27L16 24" stroke={color} strokeWidth="0.5" strokeOpacity="0.5" />
      </svg>
      
      {/* Scanning status ring */}
      <div className={`absolute inset-2 border border-dashed rounded-md opacity-20 animate-spin-slow`} style={{ borderColor: color, animationDuration: '8s' }}></div>
    </div>
  );
};

export default NeuralCore;
