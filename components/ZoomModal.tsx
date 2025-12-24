
import React, { useState, useEffect, useCallback } from 'react';

interface ZoomModalProps {
  imageUrl: string | null;
  onClose: () => void;
}

const ZoomModal: React.FC<ZoomModalProps> = ({ imageUrl, onClose }) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (imageUrl) {
      // Reset state when new image opens
      setScale(1);
      setPosition({ x: 0, y: 0 });
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [imageUrl]);

  const handleZoomIn = useCallback(() => {
    setScale(prev => Math.min(prev + 0.5, 5));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale(prev => {
      const newScale = Math.max(prev - 0.5, 1);
      if (newScale === 1) setPosition({ x: 0, y: 0 });
      return newScale;
    });
  }, []);

  const handleReset = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY * -0.001;
    setScale(prev => {
      const next = Math.min(Math.max(1, prev + delta * prev), 5);
      if (next === 1) setPosition({ x: 0, y: 0 });
      return next;
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  if (!imageUrl) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm animate-in fade-in duration-300"
      onWheel={handleWheel}
    >
      {/* Close button */}
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 text-white/70 hover:text-white p-2 z-[110] transition-all hover:rotate-90"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Image Container */}
      <div 
        className={`relative w-full h-full flex items-center justify-center overflow-hidden ${scale > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div 
          className="transition-transform duration-200 ease-out"
          style={{ 
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transformOrigin: 'center'
          }}
        >
          <img 
            src={imageUrl} 
            alt="Generated Banner Detail" 
            className="max-h-[85vh] max-w-[90vw] object-contain select-none pointer-events-none shadow-2xl"
          />
        </div>
      </div>

      {/* Modern Floating Controls */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-gray-900/80 backdrop-blur-xl px-4 py-3 rounded-2xl border border-white/10 shadow-2xl text-white">
        <button 
          onClick={handleZoomOut}
          className="p-2 hover:bg-white/10 rounded-xl transition-colors disabled:opacity-30"
          disabled={scale <= 1}
          title="Zoom Out"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
        
        <div className="px-3 min-w-[60px] text-center font-mono font-bold text-primary-400">
          {Math.round(scale * 100)}%
        </div>

        <button 
          onClick={handleZoomIn}
          className="p-2 hover:bg-white/10 rounded-xl transition-colors disabled:opacity-30"
          disabled={scale >= 5}
          title="Zoom In"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>

        <div className="w-px h-6 bg-white/10 mx-1"></div>

        <button 
          onClick={handleReset}
          className="px-4 py-2 hover:bg-primary-500 bg-white/5 rounded-xl transition-all text-sm font-semibold"
        >
          RESET
        </button>
      </div>

      {/* Helpful Hint */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 text-white/40 text-[10px] uppercase tracking-widest pointer-events-none">
        {scale > 1 ? 'Drag to explore details • Scroll to zoom' : 'Use controls or scroll to zoom'}
      </div>
    </div>
  );
};

export default ZoomModal;
