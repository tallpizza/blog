'use client';

import { useState, useCallback, useEffect } from 'react';
import { api } from '@/lib/api-client';

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
          await api.deleteNode(data.nodeId as string);
          return true;
        }
        
        case 'DELETE_NODE': {
          await api.createNode(reverseData as { type?: string; [key: string]: unknown });
          return true;
        }
        
        case 'UPDATE_NODE': {
          await api.updateNode(data.nodeId as string, reverseData.properties as Record<string, unknown>);
          return true;
        }
        
        case 'CREATE_RELATIONSHIP': {
          await api.deleteRelationship(data.relId as string);
          return true;
        }
        
        case 'DELETE_RELATIONSHIP': {
          await api.createRelationship(reverseData as {
            startNodeId: string;
            endNodeId: string;
            type: string;
            properties?: Record<string, unknown>;
          });
          return true;
        }
        
        case 'UPDATE_RELATIONSHIP': {
          await api.updateRelationship(data.relId as string, reverseData.properties as Record<string, unknown>);
          return true;
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
          await api.createNode(data.nodeData as { type?: string; [key: string]: unknown });
          return true;
        }
        
        case 'DELETE_NODE': {
          await api.deleteNode(data.nodeId as string);
          return true;
        }
        
        case 'UPDATE_NODE': {
          await api.updateNode(data.nodeId as string, data.properties as Record<string, unknown>);
          return true;
        }
        
        case 'CREATE_RELATIONSHIP': {
          await api.createRelationship(data.relData as {
            startNodeId: string;
            endNodeId: string;
            type: string;
            properties?: Record<string, unknown>;
          });
          return true;
        }
        
        case 'DELETE_RELATIONSHIP': {
          await api.deleteRelationship(data.relId as string);
          return true;
        }
        
        case 'UPDATE_RELATIONSHIP': {
          await api.updateRelationship(data.relId as string, data.properties as Record<string, unknown>);
          return true;
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
