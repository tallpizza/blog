'use client';

import { useState, useCallback, useEffect } from 'react';

export type CommandType = 
  | 'CREATE_NODE'
  | 'DELETE_NODE'
  | 'UPDATE_NODE'
  | 'CREATE_RELATIONSHIP'
  | 'DELETE_RELATIONSHIP'
  | 'UPDATE_RELATIONSHIP';

export interface Command {
  type: CommandType;
  timestamp: number;
  data: Record<string, unknown>;
  reverseData: Record<string, unknown>;
}

interface UseUndoRedoReturn {
  canUndo: boolean;
  canRedo: boolean;
  pushCommand: (command: Omit<Command, 'timestamp'>) => void;
  undo: () => Promise<Command | null>;
  redo: () => Promise<Command | null>;
  clear: () => void;
}

const MAX_HISTORY = 50;

export function useUndoRedo(): UseUndoRedoReturn {
  const [undoStack, setUndoStack] = useState<Command[]>([]);
  const [redoStack, setRedoStack] = useState<Command[]>([]);

  const pushCommand = useCallback((command: Omit<Command, 'timestamp'>) => {
    const fullCommand: Command = {
      ...command,
      timestamp: Date.now(),
    };
    
    setUndoStack(prev => {
      const newStack = [...prev, fullCommand];
      if (newStack.length > MAX_HISTORY) {
        return newStack.slice(-MAX_HISTORY);
      }
      return newStack;
    });
    setRedoStack([]);
  }, []);

  const executeReverse = useCallback(async (command: Command): Promise<boolean> => {
    const { type, data, reverseData } = command;

    try {
      switch (type) {
        case 'CREATE_NODE': {
          const res = await fetch(`/api/nodes/${encodeURIComponent(data.nodeId as string)}`, {
            method: 'DELETE',
          });
          return res.ok || res.status === 204;
        }
        
        case 'DELETE_NODE': {
          const res = await fetch('/api/nodes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reverseData),
          });
          return res.ok;
        }
        
        case 'UPDATE_NODE': {
          const res = await fetch(`/api/nodes/${encodeURIComponent(data.nodeId as string)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reverseData.properties),
          });
          return res.ok;
        }
        
        case 'CREATE_RELATIONSHIP': {
          const res = await fetch(`/api/relationships/${encodeURIComponent(data.relId as string)}`, {
            method: 'DELETE',
          });
          return res.ok || res.status === 204;
        }
        
        case 'DELETE_RELATIONSHIP': {
          const res = await fetch('/api/relationships', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reverseData),
          });
          return res.ok;
        }
        
        case 'UPDATE_RELATIONSHIP': {
          const res = await fetch(`/api/relationships/${encodeURIComponent(data.relId as string)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ properties: reverseData.properties }),
          });
          return res.ok;
        }
        
        default:
          return false;
      }
    } catch {
      return false;
    }
  }, []);

  const executeForward = useCallback(async (command: Command): Promise<boolean> => {
    const { type, data } = command;

    try {
      switch (type) {
        case 'CREATE_NODE': {
          const res = await fetch('/api/nodes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data.nodeData),
          });
          return res.ok;
        }
        
        case 'DELETE_NODE': {
          const res = await fetch(`/api/nodes/${encodeURIComponent(data.nodeId as string)}`, {
            method: 'DELETE',
          });
          return res.ok || res.status === 204;
        }
        
        case 'UPDATE_NODE': {
          const res = await fetch(`/api/nodes/${encodeURIComponent(data.nodeId as string)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data.properties),
          });
          return res.ok;
        }
        
        case 'CREATE_RELATIONSHIP': {
          const res = await fetch('/api/relationships', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data.relData),
          });
          return res.ok;
        }
        
        case 'DELETE_RELATIONSHIP': {
          const res = await fetch(`/api/relationships/${encodeURIComponent(data.relId as string)}`, {
            method: 'DELETE',
          });
          return res.ok || res.status === 204;
        }
        
        case 'UPDATE_RELATIONSHIP': {
          const res = await fetch(`/api/relationships/${encodeURIComponent(data.relId as string)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ properties: data.properties }),
          });
          return res.ok;
        }
        
        default:
          return false;
      }
    } catch {
      return false;
    }
  }, []);

  const undo = useCallback(async (): Promise<Command | null> => {
    if (undoStack.length === 0) return null;
    
    const command = undoStack[undoStack.length - 1];
    const success = await executeReverse(command);
    
    if (success) {
      setUndoStack(prev => prev.slice(0, -1));
      setRedoStack(prev => [...prev, command]);
      return command;
    }
    
    return null;
  }, [undoStack, executeReverse]);

  const redo = useCallback(async (): Promise<Command | null> => {
    if (redoStack.length === 0) return null;
    
    const command = redoStack[redoStack.length - 1];
    const success = await executeForward(command);
    
    if (success) {
      setRedoStack(prev => prev.slice(0, -1));
      setUndoStack(prev => [...prev, command]);
      return command;
    }
    
    return null;
  }, [redoStack, executeForward]);

  const clear = useCallback(() => {
    setUndoStack([]);
    setRedoStack([]);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  return {
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0,
    pushCommand,
    undo,
    redo,
    clear,
  };
}
