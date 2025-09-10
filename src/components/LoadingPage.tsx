import React, { useState, useEffect, useRef } from 'react';

interface LoadingPageProps {
  onComplete?: () => void;
}

export const LoadingPage: React.FC<LoadingPageProps> = ({ onComplete }) => {
  const [showLogo, setShowLogo] = useState(false);
  const [showLayer1, setShowLayer1] = useState(false);
  const [showLayer2, setShowLayer2] = useState(false);
  const [showLayer3, setShowLayer3] = useState(false);
  const [isSliding, setIsSliding] = useState(false);
  const [hasSlid, setHasSlid] = useState(false);
  const [showMilo, setShowMilo] = useState(false);

  // Timers to clean up
  const timers = useRef<number[]>([]);

  // ===== Initial logo reveal sequence =====
  useEffect(() => {
    const t = (ms: number, f: () => void) => timers.current.push(window.setTimeout(f, ms));

    t(100,  () => setShowLogo(true));
    t(300,  () => setShowLayer1(true));
    t(500,  () => setShowLayer2(true));
    t(700,  () => setShowLayer3(true));

    const onKey = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        event.preventDefault();
        if (!hasSlid) {
          setIsSliding(true);
          t(800, () => setHasSlid(true));
        } else {
          onComplete?.();
        }
      }
    };

    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      timers.current.forEach(clearTimeout);
    };
  }, [hasSlid, onComplete]);

  // After slide: show MILO
  useEffect(() => {
    if (!hasSlid) return;
    
    // Show MILO after slide
    timers.current.push(
      window.setTimeout(() => {
        setShowMilo(true);
      }, 100)
    );
  }, [hasSlid]);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center relative overflow-hidden">
      {/* Logo stack - slides to top with more padding */}
      <div
        className={`absolute w-32 h-32 sm:w-40 sm:h-40 flex items-center justify-center ${
          isSliding ? 'animate-smooth-slide-up' : 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'
        }`}
        aria-hidden={!showLogo}
      >
        <div className="relative w-8 h-8 sm:w-10 sm:h-10">
          <div className={`absolute w-16 h-16 sm:w-20 sm:h-20 bg-red-900/20 transition-all duration-700 ${showLayer3 ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}
               style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
          <div className={`absolute w-12 h-12 sm:w-16 sm:h-16 bg-red-800/40 transition-all duration-700 ${showLayer2 ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}
               style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
          <div className={`absolute w-10 h-10 sm:w-12 sm:h-12 bg-red-700/60 transition-all duration-700 ${showLayer1 ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}
               style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
          <div className={`absolute w-8 h-8 sm:w-8 sm:h-8 bg-red-600 transition-all duration-700 flex items-center justify-center ${
            showLogo ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
          }`} style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
            <span className="text-white text-sm sm:text-base font-bold" aria-label="Milo logo">人</span>
          </div>
        </div>
      </div>

      {/* Milo text after slide */}
      {hasSlid && (
        <div className="absolute top-1/2 left-0 right-0 w-full flex flex-col items-center px-4 transform -translate-y-1/2">
          <div className={`flex items-center justify-center gap-3 mb-4 text-white transition-all duration-700 ${showMilo ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="w-8 h-8 bg-red-600 flex items-center justify-center text-white text-sm font-bold border border-red-700 rounded-sm">人</div>
            <span className="text-4xl font-bold tracking-tight">MILO</span>
          </div>
          <div className={`text-sm uppercase tracking-wider text-gray-400 transition-all duration-700 text-center ${showMilo ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ transitionDelay: '200ms' }}>
            AI career platform for real discovery
          </div>
        </div>
      )}

      {/* Skip instruction */}
      <div className={`absolute bottom-8 text-center transition-opacity duration-500 ${isSliding && !hasSlid ? 'opacity-0' : 'opacity-100'}`}>
        <div className="text-gray-400 text-sm tracking-wider">
          Press <span className="bg-gray-800 text-gray-300 px-2 py-0.5 rounded">space</span> {hasSlid && showMilo ? 'to continue' : 'to start'}
        </div>
      </div>
    </div>
  );
};