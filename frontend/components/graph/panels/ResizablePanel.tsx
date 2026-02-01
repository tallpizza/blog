'use client';

import { ReactNode } from 'react';
import { useResizableSidebar } from '../hooks';

interface ResizablePanelProps {
  children: ReactNode;
  storageKey: string;
  defaultWidth: number;
  minWidth?: number;
  maxWidth?: number;
  className?: string;
  'data-testid'?: string;
}

export function ResizablePanel({
  children,
  storageKey,
  defaultWidth,
  minWidth = 280,
  maxWidth = 600,
  className = '',
  'data-testid': testId,
}: ResizablePanelProps) {
  const { width, isResizing, handleMouseDown } = useResizableSidebar({
    storageKey,
    defaultWidth,
    minWidth,
    maxWidth,
  });

  return (
    <div
      data-testid={testId}
      className={`fixed top-0 right-0 h-full bg-panel border-l border-border overflow-y-auto z-40 ${className}`}
      style={{ width: `${width}px`, maxWidth: '90vw' }}
    >
      <div
        onMouseDown={handleMouseDown}
        className={`absolute left-0 top-0 h-full w-1 cursor-ew-resize hover:bg-foreground/20 transition-colors ${
          isResizing ? 'bg-foreground/30' : ''
        }`}
      />
      <div className="p-4 h-full">
        {children}
      </div>
    </div>
  );
}
