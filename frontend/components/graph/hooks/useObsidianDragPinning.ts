import { useCallback, useRef } from 'react';

import type { ForceGraphData } from '../types';
import { pinNodesInPlace, repinNode, unpinNodes } from '../physics/dragPinning';

type ForceGraphDragNode = Record<string, unknown> & {
  id?: string | number;
};

type DragTranslate = { x: number; y: number };

interface UseObsidianDragPinningArgs {
  forceGraphDataRef: React.RefObject<ForceGraphData>;
}

export function useObsidianDragPinning({ forceGraphDataRef }: UseObsidianDragPinningArgs) {
  const dragPinStateRef = useRef<{ draggingNodeId: string | null; pinnedOthers: boolean }>({
    draggingNodeId: null,
    pinnedOthers: false,
  });

  const onNodeDrag = useCallback((node: ForceGraphDragNode, _translate: DragTranslate) => {
    const nodeId = node.id == null ? null : String(node.id);
    if (!nodeId) return;

    const state = dragPinStateRef.current;
    if (!state.pinnedOthers || state.draggingNodeId !== nodeId) {
      pinNodesInPlace(forceGraphDataRef.current.nodes);
      unpinNodes(forceGraphDataRef.current.nodes, nodeId);
      state.pinnedOthers = true;
      state.draggingNodeId = nodeId;
    }
  }, [forceGraphDataRef]);

  const onNodeDragEnd = useCallback((node: ForceGraphDragNode, _translate: DragTranslate) => {
    const nodeId = node.id == null ? null : String(node.id);
    if (!nodeId) return;

    repinNode(forceGraphDataRef.current.nodes, nodeId);
    unpinNodes(forceGraphDataRef.current.nodes, nodeId);
    dragPinStateRef.current = { draggingNodeId: null, pinnedOthers: false };
  }, [forceGraphDataRef]);

  return {
    onNodeDrag,
    onNodeDragEnd,
  };
}
