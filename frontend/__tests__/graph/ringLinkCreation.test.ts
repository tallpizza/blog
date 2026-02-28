import { describe, expect, it, vi } from 'vitest';

import { applyRingDropAction, resolveRingDropAction } from '@/components/graph/hooks/useRingLinkCreation';
import { getDragEndpointStyle } from '@/components/graph/hooks/useGraphRendering';

describe('resolveRingDropAction', () => {
  it('returns link when dropped on another node', () => {
    const action = resolveRingDropAction({
      sourceNodeId: '1',
      foundNodeId: '2',
    });

    expect(action).toEqual({ type: 'link', toNodeId: '2' });
  });

  it('returns create-node when dropped on empty space', () => {
    const action = resolveRingDropAction({
      sourceNodeId: '1',
      foundNodeId: null,
    });

    expect(action).toEqual({ type: 'create-node' });
  });

  it('returns none when dropped back on source node', () => {
    const action = resolveRingDropAction({
      sourceNodeId: '1',
      foundNodeId: '1',
    });

    expect(action).toEqual({ type: 'none' });
  });
});

describe('getDragEndpointStyle', () => {
  it('returns ghost-node style when no target node is hovered', () => {
    const style = getDragEndpointStyle({
      hasDragTarget: false,
      nodeRadius: 20,
      globalScale: 2,
    });

    expect(style.radius).toBe(10);
    expect(style.fillStyle).toBe('rgba(34, 197, 94, 0.22)');
    expect(style.strokeStyle).toBe('#22c55e');
  });

  it('returns small endpoint style when target node is hovered', () => {
    const style = getDragEndpointStyle({
      hasDragTarget: true,
      nodeRadius: 20,
      globalScale: 2,
    });

    expect(style.radius).toBe(3);
    expect(style.fillStyle).toBe('#22c55e');
    expect(style.strokeStyle).toBeNull();
  });
});

describe('applyRingDropAction', () => {
  it('calls link callback exactly once for link action', () => {
    const onPendingLink = vi.fn();
    const onPendingLinkToNewNode = vi.fn();

    applyRingDropAction({
      sourceNodeId: '1',
      foundNodeId: '2',
      graphX: 100,
      graphY: 200,
      onPendingLink,
      onPendingLinkToNewNode,
    });

    expect(onPendingLink).toHaveBeenCalledTimes(1);
    expect(onPendingLink).toHaveBeenCalledWith({ fromNodeId: '1', toNodeId: '2' });
    expect(onPendingLinkToNewNode).not.toHaveBeenCalled();
  });

  it('calls create-node callback exactly once for empty-space action', () => {
    const onPendingLink = vi.fn();
    const onPendingLinkToNewNode = vi.fn();

    applyRingDropAction({
      sourceNodeId: '1',
      foundNodeId: null,
      graphX: 10,
      graphY: 20,
      onPendingLink,
      onPendingLinkToNewNode,
    });

    expect(onPendingLink).not.toHaveBeenCalled();
    expect(onPendingLinkToNewNode).toHaveBeenCalledTimes(1);
    expect(onPendingLinkToNewNode).toHaveBeenCalledWith({
      fromNodeId: '1',
      x: 10,
      y: 20,
    });
  });
});
