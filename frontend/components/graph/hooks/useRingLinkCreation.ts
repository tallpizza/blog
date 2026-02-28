import { useEffect, useRef, useState, RefObject } from 'react';
import { DragLink, PendingLink, ForceGraphNode } from '../types';
import { NODE_RADIUS } from '../constants';

interface UseRingLinkCreationProps {
  containerRef: RefObject<HTMLDivElement | null>;
  fgRef: RefObject<any>;
  nodes: ForceGraphNode[];
  is3D: boolean;
  onPendingLink: (link: PendingLink) => void;
  onPendingLinkToNewNode?: (payload: {
    fromNodeId: string;
    x: number;
    y: number;
  }) => void;
  nodeRadius?: number;
}

interface UseRingLinkCreationReturn {
  dragLink: DragLink | null;
  dragTargetNode: ForceGraphNode | null;
  ringHovered: boolean;
  isDraggingLinkRef: RefObject<boolean>;
  clearDragLink: () => void;
}

export function useRingLinkCreation({
  containerRef,
  fgRef,
  nodes,
  is3D,
  onPendingLink,
  onPendingLinkToNewNode,
  nodeRadius: nodeRadiusProp,
}: UseRingLinkCreationProps): UseRingLinkCreationReturn {
  const [dragLink, setDragLink] = useState<DragLink | null>(null);
  const [dragTargetNode, setDragTargetNode] = useState<ForceGraphNode | null>(null);
  const [ringHovered, setRingHovered] = useState(false);
  const isDraggingLinkRef = useRef(false);
  const dragSourceNodeIdRef = useRef<string | null>(null);

  const nodeRadius = nodeRadiusProp ?? NODE_RADIUS;
  const ringInner = nodeRadius + 4;
  const ringOuter = nodeRadius + 12;

  const resolveDropAction = (
    sourceNodeId: string,
    foundNodeId: string | null
  ) => resolveRingDropAction({ sourceNodeId, foundNodeId });

  useEffect(() => {
    if (is3D) return;
    
    const container = containerRef.current;
    if (!container) return;

    const getGraphCoords = (clientX: number, clientY: number) => {
      const canvas = container.querySelector('canvas');
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      const canvasX = clientX - rect.left;
      const canvasY = clientY - rect.top;
      return fgRef.current?.screen2GraphCoords(canvasX, canvasY) || { x: 0, y: 0 };
    };

    const findNodeAt = (graphX: number, graphY: number, maxRadius?: number) => {
      const searchRadius = maxRadius ?? nodeRadius;
      for (const node of nodes) {
        const n = node as any;
        if (n.x === undefined) continue;
        const dx = n.x - graphX;
        const dy = n.y - graphY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < searchRadius) return { node, dist };
      }
      return null;
    };

    const isInRing = (node: any, clientX: number, clientY: number) => {
      const canvas = container.querySelector('canvas');
      if (!canvas || !node.x || !node.y) return false;
      
      const nodeScreenCoords = fgRef.current?.graph2ScreenCoords(node.x, node.y);
      if (!nodeScreenCoords) return false;
      
      const rect = canvas.getBoundingClientRect();
      const nodeScreenX = rect.left + nodeScreenCoords.x;
      const nodeScreenY = rect.top + nodeScreenCoords.y;
      
      const dx = clientX - nodeScreenX;
      const dy = clientY - nodeScreenY;
      const screenDist = Math.sqrt(dx * dx + dy * dy);
      
      return screenDist >= ringInner && screenDist <= ringOuter;
    };

    const handlePointerDown = (clientX: number, clientY: number, e: Event) => {
      if (!fgRef.current) return;
      
      const canvas = container.querySelector('canvas');
      if (!canvas) return;
      
      const rect = canvas.getBoundingClientRect();
      
      // Find node whose ring area contains the click (using screen coordinates)
      for (const node of nodes) {
        const n = node as any;
        if (n.x === undefined || n.y === undefined) continue;
        
        const nodeScreenCoords = fgRef.current?.graph2ScreenCoords(n.x, n.y);
        if (!nodeScreenCoords) continue;
        
        const nodeScreenX = rect.left + nodeScreenCoords.x;
        const nodeScreenY = rect.top + nodeScreenCoords.y;
        
        const dx = clientX - nodeScreenX;
        const dy = clientY - nodeScreenY;
        const screenDist = Math.sqrt(dx * dx + dy * dy);
        
        // Check if click is in the ring area (between ringInner and ringOuter)
        if (screenDist >= ringInner && screenDist <= ringOuter) {
          e.stopPropagation();
          e.preventDefault();
          isDraggingLinkRef.current = true;
          dragSourceNodeIdRef.current = node.id;
          const { x: graphX, y: graphY } = getGraphCoords(clientX, clientY);
          setDragLink({
            sourceNode: node,
            mouseX: graphX,
            mouseY: graphY,
          });
          return;
        }
      }
    };

    const handlePointerMove = (clientX: number, clientY: number) => {
      if (!isDraggingLinkRef.current || !fgRef.current) return;
      
      const { x: graphX, y: graphY } = getGraphCoords(clientX, clientY);
      setDragLink(prev => {
        if (!prev) return null;
        const found = findNodeAt(graphX, graphY);
        const targetNode = found && found.node.id !== prev.sourceNode.id ? found.node : null;
        setDragTargetNode(targetNode);
        return { ...prev, mouseX: graphX, mouseY: graphY };
      });
    };

    const handlePointerUp = (clientX: number, clientY: number) => {
      if (!isDraggingLinkRef.current || !fgRef.current) {
        isDraggingLinkRef.current = false;
        dragSourceNodeIdRef.current = null;
        return;
      }
      
      const { x: graphX, y: graphY } = getGraphCoords(clientX, clientY);
      const found = findNodeAt(graphX, graphY);
      const sourceNodeId = dragSourceNodeIdRef.current;
      
      setDragLink(null);

      if (sourceNodeId) {
        applyRingDropAction({
          sourceNodeId,
          foundNodeId: found ? found.node.id : null,
          graphX,
          graphY,
          onPendingLink,
          onPendingLinkToNewNode,
          resolveDropAction,
        });
      }

      setDragTargetNode(null);
      isDraggingLinkRef.current = false;
      dragSourceNodeIdRef.current = null;
    };

    const handleMouseDown = (e: MouseEvent) => handlePointerDown(e.clientX, e.clientY, e);
    const handleMouseMove = (e: MouseEvent) => handlePointerMove(e.clientX, e.clientY);
    const handleMouseUp = (e: MouseEvent) => handlePointerUp(e.clientX, e.clientY);

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const touch = e.touches[0];
      handlePointerDown(touch.clientX, touch.clientY, e);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const touch = e.touches[0];
      handlePointerMove(touch.clientX, touch.clientY);
      if (isDraggingLinkRef.current) {
        e.preventDefault();
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const touch = e.changedTouches[0];
      handlePointerUp(touch.clientX, touch.clientY);
    };

    const handleTouchCancel = () => {
      isDraggingLinkRef.current = false;
      dragSourceNodeIdRef.current = null;
      setDragLink(null);
      setDragTargetNode(null);
    };

    const handleMouseMoveForRing = (e: MouseEvent) => {
      if (isDraggingLinkRef.current || !fgRef.current) return;
      
      const canvas = container.querySelector('canvas');
      if (!canvas) {
        setRingHovered(false);
        return;
      }
      
      const rect = canvas.getBoundingClientRect();
      
      // Find nearest node using screen coordinates
      let nearestNode: any = null;
      let nearestScreenDist = Infinity;
      
      for (const node of nodes) {
        const n = node as any;
        if (n.x === undefined || n.y === undefined) continue;
        
        const nodeScreenCoords = fgRef.current?.graph2ScreenCoords(n.x, n.y);
        if (!nodeScreenCoords) continue;
        
        const nodeScreenX = rect.left + nodeScreenCoords.x;
        const nodeScreenY = rect.top + nodeScreenCoords.y;
        
        const dx = e.clientX - nodeScreenX;
        const dy = e.clientY - nodeScreenY;
        const screenDist = Math.sqrt(dx * dx + dy * dy);
        
        // Check if cursor is within ring's outer radius (in screen pixels)
        if (screenDist <= ringOuter && screenDist < nearestScreenDist) {
          nearestScreenDist = screenDist;
          nearestNode = n;
        }
      }
      
      if (nearestNode && nearestScreenDist >= ringInner && nearestScreenDist <= ringOuter) {
        setRingHovered(true);
      } else {
        setRingHovered(false);
      }
    };

    container.addEventListener('mousedown', handleMouseDown, true);
    container.addEventListener('mousemove', handleMouseMove, true);
    container.addEventListener('mouseup', handleMouseUp, true);
    container.addEventListener('mousemove', handleMouseMoveForRing);
    
    container.addEventListener('touchstart', handleTouchStart, { capture: true, passive: false });
    container.addEventListener('touchmove', handleTouchMove, { capture: true, passive: false });
    container.addEventListener('touchend', handleTouchEnd, true);
    container.addEventListener('touchcancel', handleTouchCancel, true);
    
    return () => {
      container.removeEventListener('mousedown', handleMouseDown, true);
      container.removeEventListener('mousemove', handleMouseMove, true);
      container.removeEventListener('mouseup', handleMouseUp, true);
      container.removeEventListener('mousemove', handleMouseMoveForRing);
      
      container.removeEventListener('touchstart', handleTouchStart, true);
      container.removeEventListener('touchmove', handleTouchMove, true);
      container.removeEventListener('touchend', handleTouchEnd, true);
      container.removeEventListener('touchcancel', handleTouchCancel, true);
    };
  }, [is3D, nodes, containerRef, fgRef, onPendingLink, onPendingLinkToNewNode, nodeRadius, ringInner, ringOuter]);

  const clearDragLink = () => {
    setDragLink(null);
    setDragTargetNode(null);
    isDraggingLinkRef.current = false;
    dragSourceNodeIdRef.current = null;
  };

  return {
    dragLink,
    dragTargetNode,
    ringHovered,
    isDraggingLinkRef,
    clearDragLink,
  };
}

interface ResolveRingDropActionParams {
  sourceNodeId: string;
  foundNodeId: string | null;
}

type RingDropAction =
  | { type: 'link'; toNodeId: string }
  | { type: 'create-node' }
  | { type: 'none' };

export function resolveRingDropAction({
  sourceNodeId,
  foundNodeId,
}: ResolveRingDropActionParams): RingDropAction {
  if (!foundNodeId) {
    return { type: 'create-node' };
  }

  if (foundNodeId === sourceNodeId) {
    return { type: 'none' };
  }

  return { type: 'link', toNodeId: foundNodeId };
}

interface ApplyRingDropActionParams {
  sourceNodeId: string;
  foundNodeId: string | null;
  graphX: number;
  graphY: number;
  onPendingLink: (link: PendingLink) => void;
  onPendingLinkToNewNode?: (payload: {
    fromNodeId: string;
    x: number;
    y: number;
  }) => void;
  resolveDropAction?: (sourceNodeId: string, foundNodeId: string | null) => RingDropAction;
}

export function applyRingDropAction({
  sourceNodeId,
  foundNodeId,
  graphX,
  graphY,
  onPendingLink,
  onPendingLinkToNewNode,
  resolveDropAction = (sourceId, foundId) => resolveRingDropAction({ sourceNodeId: sourceId, foundNodeId: foundId }),
}: ApplyRingDropActionParams): void {
  const action = resolveDropAction(sourceNodeId, foundNodeId);

  if (action.type === 'link') {
    onPendingLink({
      fromNodeId: sourceNodeId,
      toNodeId: action.toNodeId,
    });
    return;
  }

  if (action.type === 'create-node' && onPendingLinkToNewNode) {
    onPendingLinkToNewNode({
      fromNodeId: sourceNodeId,
      x: graphX,
      y: graphY,
    });
  }
}
