'use client';

import { useState, useRef, useEffect, ReactNode } from 'react';

interface Props {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export function BottomSheet({ title, onClose, children }: Props) {
  const [height, setHeight] = useState(40);
  const [isDragging, setIsDragging] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const startHeight = useRef(0);

  const handleDragStart = (clientY: number) => {
    setIsDragging(true);
    startY.current = clientY;
    startHeight.current = height;
  };

  const handleDrag = (clientY: number) => {
    if (!isDragging) return;
    
    const deltaY = startY.current - clientY;
    const deltaPercent = (deltaY / window.innerHeight) * 100;
    const newHeight = Math.min(90, Math.max(20, startHeight.current + deltaPercent));
    setHeight(newHeight);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    if (height < 25) {
      onClose();
    } else if (height < 50) {
      setHeight(40);
    } else {
      setHeight(80);
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => handleDrag(e.clientY);
    const handleMouseUp = () => handleDragEnd();
    const handleTouchMove = (e: TouchEvent) => handleDrag(e.touches[0].clientY);
    const handleTouchEnd = () => handleDragEnd();

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, height]);

  return (
    <div
      ref={sheetRef}
      className="fixed bottom-0 left-0 right-0 bg-gray-900 rounded-t-2xl shadow-2xl z-50 transition-all duration-150"
      style={{ height: `${height}vh` }}
    >
      <div
        className="flex flex-col items-center pt-2 pb-3 cursor-grab active:cursor-grabbing touch-none"
        onMouseDown={(e) => handleDragStart(e.clientY)}
        onTouchStart={(e) => handleDragStart(e.touches[0].clientY)}
      >
        <div className="w-12 h-1.5 bg-gray-600 rounded-full mb-2" />
        <div className="w-full px-4 flex justify-between items-center">
          <h2 className="text-lg font-bold text-white">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl p-1">✕</button>
        </div>
      </div>
      
      <div className="px-4 pb-4 overflow-y-auto" style={{ height: `calc(100% - 60px)` }}>
        {children}
      </div>
    </div>
  );
}
