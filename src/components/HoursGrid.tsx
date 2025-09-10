import React, { useState, useEffect } from 'react';

interface HoursGridProps {
  onComplete?: () => void;
}

export const HoursGrid: React.FC<HoursGridProps> = ({ onComplete }) => {
  const [showSleepText, setShowSleepText] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [showSleepBlocks, setShowSleepBlocks] = useState(false);
  const [showEatingText, setShowEatingText] = useState(false);
  const [showEatingBlocks, setShowEatingBlocks] = useState(false);
  const [showWorkText, setShowWorkText] = useState(false);
  const [showWorkBlocks, setShowWorkBlocks] = useState(false);
  const [showPunchline, setShowPunchline] = useState(false);
  const [showCTA, setShowCTA] = useState(false);

  const TOTAL_BLOCKS = 1000;
  const SLEEP_BLOCKS = 333; // 33.3% for sleep
  const EATING_BLOCKS = 50; // ~5% for eating/meals
  const WORK_BLOCKS = 193; // 19.3% of 1000 blocks
  const GRID_COLS = 50;
  const GRID_ROWS = 20;

  useEffect(() => {
    const timeline = [
      { delay: 0, action: () => setShowGrid(true) },
      { delay: 1000, action: () => setShowSleepText(true) },
      { delay: 2000, action: () => setShowSleepBlocks(true) },
      { delay: 3500, action: () => setShowEatingText(true) },
      { delay: 4500, action: () => setShowEatingBlocks(true) },
      { delay: 6000, action: () => setShowWorkText(true) },
      { delay: 7000, action: () => {
        setShowWorkBlocks(true);
      }},
      { delay: 8500, action: () => setShowPunchline(true) },
      { delay: 10000, action: () => setShowCTA(true) },
      { delay: 12000, action: () => onComplete?.() }
    ];

    const timeouts = timeline.map(({ delay, action }) => 
      setTimeout(action, delay)
    );

    return () => timeouts.forEach(clearTimeout);
  }, [onComplete]);

  const blocks = Array.from({ length: TOTAL_BLOCKS }, (_, i) => ({
    id: i,
    isSleep: i < SLEEP_BLOCKS,
    isEating: i >= SLEEP_BLOCKS && i < SLEEP_BLOCKS + EATING_BLOCKS,
    isWork: i >= SLEEP_BLOCKS + EATING_BLOCKS && i < SLEEP_BLOCKS + EATING_BLOCKS + WORK_BLOCKS
  }));

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-8">
      {/* Grid */}
      <div className="relative mb-8">
        <div className={`grid gap-0.5 transition-opacity duration-1000 ${
          showGrid ? 'opacity-100' : 'opacity-20'
        }`} style={{
          gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`,
          gridTemplateRows: `repeat(${GRID_ROWS}, 1fr)`
        }}>
          {blocks.map((block, index) => (
            <div
              key={block.id}
              className={`w-2 h-2 transition-all duration-300 border ${
                showSleepBlocks && block.isSleep
                  ? 'bg-gray-600 border-gray-500'
                  : showEatingBlocks && block.isEating
                  ? 'bg-yellow-600 border-yellow-500'
                  : showWorkBlocks && block.isWork
                  ? 'bg-red-600 border border-red-500'
                  : 'bg-gray-800 border-gray-700'
              }`}
              style={{
                transitionDelay: 
                  (showSleepBlocks && block.isSleep) ? `${index * 4}ms` :
                  (showEatingBlocks && block.isEating) ? `${(index - SLEEP_BLOCKS) * 8}ms` :
                  (showWorkBlocks && block.isWork) ? `${(index - SLEEP_BLOCKS - EATING_BLOCKS) * 8}ms` :
                  '0ms'
              }}
            />
          ))}
        </div>
      </div>

      {/* Progressive Text */}
      <div className="text-center mb-6 space-y-4">
        <div className={`text-lg font-mono transition-opacity duration-1000 ${
          showSleepText ? 'opacity-100' : 'opacity-0'
        }`}>
          This is sleep.
        </div>
        
        <div className={`text-lg font-mono transition-opacity duration-1000 ${
          showEatingText ? 'opacity-100' : 'opacity-0'
        }`}>
          Eating, meals, basic needs.
        </div>
        
        <div className={`text-lg font-mono transition-opacity duration-1000 ${
          showWorkText ? 'opacity-100' : 'opacity-0'
        }`}>
          This is work. You spend ~90,000 hours here.
        </div>
      </div>

      {/* Labels */}
      <div className={`flex items-center gap-6 mb-8 transition-opacity duration-1000 ${
        showWorkBlocks ? 'opacity-100' : 'opacity-0'
      }`}>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-600 border border-gray-500"></div>
          <span className="text-sm font-mono">Sleep</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-600 border border-yellow-500"></div>
          <span className="text-sm font-mono">Eating</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-600 border border-red-500"></div>
          <span className="text-sm font-mono">Work</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-800 border border-gray-700"></div>
          <span className="text-sm font-mono">Everything else</span>
        </div>
      </div>

      {/* Punchline */}
      <div className={`text-center mb-8 transition-opacity duration-1000 ${
        showPunchline ? 'opacity-100' : 'opacity-0'
      }`}>
        <div className="text-2xl font-sans font-medium mb-2">
          ~1 in 5 of your waking hours will be work.
        </div>
        <div className="text-lg text-gray-300 font-sans">
          Make them count.
        </div>
      </div>

      {/* CTA */}
      <div className={`transition-all duration-1000 ${
        showCTA ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}>
        <button 
          onClick={onComplete}
          className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center gap-2"
        >
          Find work that fits →
        </button>
      </div>

      {/* Skip instruction */}
      <div className="absolute bottom-8 text-center">
        <div className="text-gray-400 text-sm font-mono tracking-wider">
          Press <span className="bg-gray-800 text-gray-300 px-2 py-0.5 rounded">space</span> to skip
        </div>
      </div>
    </div>
  );
};