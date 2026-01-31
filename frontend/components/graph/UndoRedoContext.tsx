'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useUndoRedo, Command } from './hooks';

interface UndoRedoContextValue {
  canUndo: boolean;
  canRedo: boolean;
  pushCommand: (command: Omit<Command, 'timestamp'>) => void;
  undo: () => Promise<Command | null>;
  redo: () => Promise<Command | null>;
  clear: () => void;
}

const UndoRedoContext = createContext<UndoRedoContextValue | null>(null);

export function UndoRedoProvider({ children }: { children: ReactNode }) {
  const undoRedoState = useUndoRedo();
  
  return (
    <UndoRedoContext.Provider value={undoRedoState}>
      {children}
    </UndoRedoContext.Provider>
  );
}

export function useUndoRedoContext(): UndoRedoContextValue {
  const context = useContext(UndoRedoContext);
  if (!context) {
    throw new Error('useUndoRedoContext must be used within UndoRedoProvider');
  }
  return context;
}
