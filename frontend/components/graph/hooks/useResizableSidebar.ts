'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

const STORAGE_KEY_PREFIX = 'sidebar-width-';

interface UseResizableSidebarOptions {
  storageKey: string;
  defaultWidth: number;
  minWidth?: number;
  maxWidth?: number;
}

interface UseResizableSidebarReturn {
  width: number;
  isResizing: boolean;
  handleMouseDown: (e: React.MouseEvent) => void;
}

function getInitialWidth(
  storageKey: string,
  defaultWidth: number,
  minWidth: number,
  maxWidth: number
): number {
  if (typeof window === 'undefined') return defaultWidth;
  
  const savedWidth = localStorage.getItem(STORAGE_KEY_PREFIX + storageKey);
  if (savedWidth) {
    const parsed = parseInt(savedWidth, 10);
    if (!isNaN(parsed) && parsed >= minWidth && parsed <= maxWidth) {
      return parsed;
    }
  }
  return defaultWidth;
}

export function useResizableSidebar({
  storageKey,
  defaultWidth,
  minWidth = 280,
  maxWidth = 600,
}: UseResizableSidebarOptions): UseResizableSidebarReturn {
  const [width, setWidth] = useState(() => 
    getInitialWidth(storageKey, defaultWidth, minWidth, maxWidth)
  );
  const [isResizing, setIsResizing] = useState(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);
  const handlersRef = useRef<{
    handleMouseMove: (e: MouseEvent) => void;
    handleMouseUp: () => void;
  } | null>(null);

  useEffect(() => {
    if (!isResizing) {
      localStorage.setItem(STORAGE_KEY_PREFIX + storageKey, String(width));
    }
  }, [width, isResizing, storageKey]);

  useEffect(() => {
    handlersRef.current = {
      handleMouseMove: (e: MouseEvent) => {
        const delta = startXRef.current - e.clientX;
        const newWidth = Math.min(maxWidth, Math.max(minWidth, startWidthRef.current + delta));
        setWidth(newWidth);
      },
      handleMouseUp: () => {
        setIsResizing(false);
        if (handlersRef.current) {
          document.removeEventListener('mousemove', handlersRef.current.handleMouseMove);
          document.removeEventListener('mouseup', handlersRef.current.handleMouseUp);
        }
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      },
    };
  }, [minWidth, maxWidth]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    startXRef.current = e.clientX;
    startWidthRef.current = width;
    setIsResizing(true);
    if (handlersRef.current) {
      document.addEventListener('mousemove', handlersRef.current.handleMouseMove);
      document.addEventListener('mouseup', handlersRef.current.handleMouseUp);
    }
    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';
  }, [width]);

  useEffect(() => {
    return () => {
      if (handlersRef.current) {
        document.removeEventListener('mousemove', handlersRef.current.handleMouseMove);
        document.removeEventListener('mouseup', handlersRef.current.handleMouseUp);
      }
    };
  }, []);

  return {
    width,
    isResizing,
    handleMouseDown,
  };
}
