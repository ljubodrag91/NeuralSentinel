
import React, { useEffect, useRef } from 'react';

interface TooltipProps {
  name: string;
  unit?: string;
  desc?: string;
  source: string; // REAL, SIMULATED, OFFLINE
  rate?: string;
  children: React.ReactNode;
}

const Tooltip: React.FC<TooltipProps> = ({ name, unit, desc, source, rate, children }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    const tooltip = document.getElementById('cursor-tooltip');
    if (!el || !tooltip) return;

    const handleMouseMove = (e: MouseEvent) => {
      tooltip.style.left = `${e.clientX + 15}px`;
      tooltip.style.top = `${e.clientY + 15}px`;
    };

    const handleMouseEnter = () => {
      const stateColor = source === 'REAL' ? 'text-[#22c55e]' : source === 'SIMULATED' ? 'text-[#0088ff]' : 'text-[#ff3e3e]';
      const isOffline = source === 'OFFLINE';
      
      tooltip.innerHTML = `
        <div class="text-[#00ffd5] font-black text-[10px] mb-2 border-b border-zinc-900 pb-2 tracking-[0.2em] uppercase">${name}</div>
        <div class="flex flex-col gap-1.5 font-mono text-[10px]">
          ${unit ? `<div class="flex justify-between gap-6"><span class="text-zinc-600">UNIT:</span><span class="text-zinc-300">${unit}</span></div>` : ''}
          <div class="flex justify-between gap-6"><span class="text-zinc-600">SOURCE:</span><span class="${stateColor} font-bold">${source}</span></div>
          ${!isOffline && rate ? `<div class="flex justify-between gap-6"><span class="text-zinc-600">INTERVAL:</span><span class="text-zinc-400">${rate}</span></div>` : ''}
          <div class="mt-2 text-[9px] text-zinc-500 leading-tight border-t border-zinc-900/40 pt-2 italic">
            ${isOffline ? '[WARNING]: Node unreachable. Metric data stale or unavailable.' : (desc || 'Awaiting further telemetry analysis...')}
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
  }, [name, unit, desc, source, rate]);

  return <div ref={containerRef} className="inline-block h-fit cursor-help">{children}</div>;
};

export default Tooltip;
