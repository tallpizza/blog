import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useUndoRedo } from '@/components/graph/hooks/useUndoRedo';

global.fetch = vi.fn();

describe('useUndoRedo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initializes with empty stacks', () => {
    const { result } = renderHook(() => useUndoRedo());
    
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });

  it('pushCommand enables undo', () => {
    const { result } = renderHook(() => useUndoRedo());
    
    act(() => {
      result.current.pushCommand({
        type: 'CREATE_NODE',
        data: { nodeId: '123' },
        reverseData: {},
      });
    });
    
    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(false);
  });

  it('pushCommand clears redo stack', () => {
    const { result } = renderHook(() => useUndoRedo());
    
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 204,
    });
    
    act(() => {
      result.current.pushCommand({
        type: 'CREATE_NODE',
        data: { nodeId: '123' },
        reverseData: {},
      });
    });

    act(() => {
      result.current.pushCommand({
        type: 'CREATE_NODE',
        data: { nodeId: '456' },
        reverseData: {},
      });
    });
    
    expect(result.current.canRedo).toBe(false);
  });

  it('clear resets both stacks', () => {
    const { result } = renderHook(() => useUndoRedo());
    
    act(() => {
      result.current.pushCommand({
        type: 'CREATE_NODE',
        data: { nodeId: '123' },
        reverseData: {},
      });
    });
    
    act(() => {
      result.current.clear();
    });
    
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });

  it('undo moves command to redo stack on success', async () => {
    const { result } = renderHook(() => useUndoRedo());
    
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 204,
    });
    
    act(() => {
      result.current.pushCommand({
        type: 'CREATE_NODE',
        data: { nodeId: '123' },
        reverseData: {},
      });
    });
    
    await act(async () => {
      await result.current.undo();
    });
    
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(true);
  });

  it('redo moves command back to undo stack on success', async () => {
    const { result } = renderHook(() => useUndoRedo());
    
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ id: '123' }),
    });
    
    act(() => {
      result.current.pushCommand({
        type: 'CREATE_NODE',
        data: { nodeId: '123', nodeData: { name: 'Test' } },
        reverseData: {},
      });
    });
    
    await act(async () => {
      await result.current.undo();
    });
    
    await act(async () => {
      await result.current.redo();
    });
    
    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(false);
  });
});
