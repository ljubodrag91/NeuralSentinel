
import React, { useRef, useEffect } from 'react';

interface TerminalOutputProps {
  output: string[];
}

const TerminalOutput: React.FC<TerminalOutputProps> = ({ output }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [output]);

  return (
    <div 
      ref={scrollRef}
      className="bg-black/80 w-full h-full p-4 font-mono text-sm overflow-auto text-zinc-300 selection:bg-blue-500 selection:text-white"
    >
      {output.length === 0 ? (
        <div className="text-zinc-700 italic">No output received. Waiting for execution...</div>
      ) : (
        output.map((line, i) => (
          <div key={i} className="mb-0.5 animate-in fade-in duration-300">
            {line.startsWith('root@kali') ? (
              <span className="text-green-500 font-bold">{line}</span>
            ) : line.includes('ERROR') ? (
              <span className="text-red-400">{line}</span>
            ) : line.includes('SUCCESS') ? (
              <span className="text-green-400">{line}</span>
            ) : line.startsWith('[*]') ? (
              <span className="text-blue-400">{line}</span>
            ) : (
              <span>{line}</span>
            )}
          </div>
        ))
      )}
      <div className="h-4"></div>
    </div>
  );
};

export default TerminalOutput;
