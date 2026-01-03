import React from 'react';

interface BrainIconProps {
  onClick: () => void;
  className?: string;
  isProcessing?: boolean;
  color?: string;
}

const BrainIcon: React.FC<BrainIconProps> = ({ onClick, className = '', isProcessing = false, color = '#00ffd5' }) => {
  return (
    <button 
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`brain-icon-btn p-3 rounded-md transition-all flex items-center justify-center ${className} ${isProcessing ? 'animate-pulse' : ''}`}
      style={{ color: isProcessing ? color : '#52525b' }}
      onMouseEnter={(e) => e.currentTarget.style.color = color}
      onMouseLeave={(e) => !isProcessing && (e.currentTarget.style.color = '#52525b')}
      title="Neural Intelligence Brain Probe"
    >
      <svg className="w-9 h-9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="4" width="16" height="16" rx="2" />
        <rect x="9" y="9" width="6" height="6" strokeWidth="1" strokeOpacity="0.5" />
        <path d="M12 4V2M15 4V2M9 4V2" />
        <path d="M12 22v-2M15 22v-2M9 22v-2" />
        <path d="M4 12H2M4 15H2M4 9H2" />
        <path d="M22 12h-2M22 15h-2M22 9h-2" />
        <circle cx="12" cy="12" r="1.5" fill="currentColor" className={isProcessing ? 'animate-ping' : ''} />
      </svg>
    </button>
  );
};

export default BrainIcon;
