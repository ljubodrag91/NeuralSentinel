
import React, { useEffect, useRef } from 'react';

interface TooltipProps {
  name: string;
  unit?: string;
  desc?: string;
  source: string; // REAL, SIMULATED, OFFLINE
  rate?: string;
  children: React.ReactNode;
  className?: string;
  variant?: 'purple' | 'teal' | 'default';
}

const Tooltip: React.FC<TooltipProps> = ({ name, unit, desc, source, rate, children, className = '', variant = 'default' }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    const tooltip = document.getElementById('cursor-tooltip');
    if (!el || !tooltip) return;

    const handleMouseMove = (e: MouseEvent) => {
      const tooltipRect = tooltip.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      let left = e.clientX + 15;
      let top = e.clientY + 15;

      if (left + tooltipRect.width > viewportWidth) {
        left = e.clientX - tooltipRect.width - 15;
      }
      if (top + tooltipRect.height > viewportHeight) {
        top = e.clientY - tooltipRect.height - 15;
      }

      tooltip.style.left = `${Math.max(10, left)}px`;
      tooltip.style.top = `${Math.max(10, top)}px`;
    };

    const handleMouseEnter = () => {
      const stateColor = source === 'REAL' ? 'text-[#22c55e]' : source === 'SIMULATED' ? 'text-[#0088ff]' : 'text-[#ff3e3e]';
      const isOffline = source === 'OFFLINE';
      
      // Theme colors
      const accentColor = variant === 'purple' ? '#bd00ff' : variant === 'teal' ? '#00ffd5' : '#52525b';
      const accentClass = variant === 'purple' ? 'text-purple-500' : variant === 'teal' ? 'text-teal-400' : 'text-zinc-400';
      
      tooltip.style.borderColor = `${accentColor}44`;
      tooltip.style.boxShadow = `0 10px 30px rgba(0,0,0,0.9), inset 0 0 10px ${accentColor}11`;
      
      tooltip.innerHTML = `
        <div class="flex justify-between items-center mb-2 border-b border-zinc-900 pb-2">
          <div class="${accentClass} font-black text-[10px] tracking-[0.2em] uppercase">${name}</div>
          <div class="text-[7px] text-zinc-800 font-mono font-bold uppercase tracking-widest">${variant === 'default' ? 'SYSTEM_METRIC' : 'NEURAL_NETWORK_PROBE'}</div>
        </div>
        <div class="flex flex-col gap-1.5 font-mono text-[10px]">
          ${unit ? `<div class="flex justify-between gap-6"><span class="text-zinc-600">UNIT:</span><span class="text-zinc-300">${unit}</span></div>` : ''}
          <div class="flex justify-between gap-6"><span class="text-zinc-600">SOURCE:</span><span class="${stateColor} font-bold">${source}</span></div>
          ${!isOffline && rate ? `<div class="flex justify-between gap-6"><span class="text-zinc-600">INTERVAL:</span><span class="text-zinc-400">${rate}</span></div>` : ''}
          <div class="mt-2 text-[9px] text-zinc-500 leading-tight border-t border-zinc-900/40 pt-2 italic">
            ${isOffline ? '[WARNING]: Node unreachable. Metric data stale or unavailable.' : (desc || 'Awaiting further neural telemetry analysis...')}
          </div>
        </div>
      `;
      tooltip.style.opacity = '1';
    };

    const handleMouseLeave = () => {
      tooltip.style.opacity = '0';
    };

    el.addEventListener('mousemove', handleMouseMove);
    el.addEventListener('mouseenter', handleMouseEnter);
    el.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      el.removeEventListener('mousemove', handleMouseMove);
      el.removeEventListener('mouseenter', handleMouseEnter);
      el.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [name, unit, desc, source, rate, variant]);

  return <div ref={containerRef} className={`block cursor-help ${className}`}>{children}</div>;
};

export default Tooltip;
