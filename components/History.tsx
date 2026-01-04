
import React, { useState } from 'react';
import Card from './common/Card';
import { PanelSlotConfig, SlotConfig } from '../types';

interface HistoryProps {
  data: any[];
  onProbe: (panel: string, data: any) => void;
  onProbeInfo: (panel: string, data: any) => void;
  onBrainClick: (id: string, type: string, metrics: any) => void;
  onLauncherSelect: (id: string, type: 'low' | 'probe') => void;
  processingId?: string;
  allowDistortion?: boolean;
  slotConfig?: PanelSlotConfig;
  globalLowSlot?: SlotConfig;
}

const History: React.FC<HistoryProps> = ({ data, onProbe, onProbeInfo, onBrainClick, onLauncherSelect, processingId, allowDistortion, slotConfig, globalLowSlot }) => {
  const getArchivePayload = () => {
    const csvHeaders = "TIMESTAMP,ACTION,TARGET,RESULT";
    const csvRows = data.map(h => `${h.timestamp},${h.action},${h.target},${h.result}`).join("\n");
    return { csv: `${csvHeaders}\n${csvRows}` };
  };

  const handleProbe = () => {
    onProbe('SESSION_ARCHIVE', getArchivePayload());
  };

  const handleProbeInfo = () => {
    onProbeInfo('SESSION_ARCHIVE', getArchivePayload());
  };

  return (
    <div className="animate-in fade-in duration-600">
      <Card 
        id="SESSION_ARCHIVE"
        title="SESSION_ARCHIVE_PERSISTENCE" 
        titleTooltip="Encrypted persistence log of all tactical session actions. Holistic session probe for long-term tactical persistence and operational pattern detection."
        variant="default" 
        onProbe={handleProbe}
        onProbeInfo={handleProbeInfo}
        onBrain={() => onBrainClick('SESSION_ARCHIVE', 'Probe Database', { logCount: data.length })}
        onLauncherSelect={(_, type) => onLauncherSelect('SESSION_ARCHIVE', type)}
        isProcessing={processingId === 'SESSION_ARCHIVE' || processingId === 'history_archive'}
        allowDistortion={allowDistortion}
        slotConfig={slotConfig}
        globalLowSlot={globalLowSlot}
      >
        <div className="overflow-x-auto p-2">
          <table className="w-full font-mono text-[11px] text-[#4a726f] border-collapse">
            <thead className="border-b-2 border-zinc-900 bg-zinc-950/60 text-teal-700 font-black uppercase tracking-widest">
              <tr>
                <th className="text-left py-4 px-4">TIMESTAMP</th>
                <th className="text-left py-4 px-4">ACTION_TYPE</th>
                <th className="text-left py-4 px-4">VECTOR_TARGET</th>
                <th className="text-left py-4 px-4">FINAL_OUTCOME</th>
              </tr>
            </thead>
            <tbody>
              {data.map(item => (
                <tr key={item.id} className="border-b border-zinc-900/40 hover:bg-teal-500/5 transition-colors group">
                  <td className="py-4 px-4 text-zinc-500 font-bold">{item.timestamp}</td>
                  <td className="py-4 px-4 text-teal-400 font-black tracking-tighter uppercase">{item.action}</td>
                  <td className="py-4 px-4 text-zinc-300 font-mono tracking-tight">{item.target}</td>
                  <td className="py-4 px-4 text-green-500 font-black uppercase tracking-widest group-hover:text-teal-300">{item.result}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.length === 0 && (
            <div className="py-20 text-center text-teal-900/30 text-xs font-black tracking-[0.5em] uppercase opacity-20">
              [ NO_SESSION_DATA_AVAILABLE ]
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default History;
