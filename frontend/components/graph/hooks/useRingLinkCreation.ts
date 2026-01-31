import { useEffect, useRef, useState, RefObject } from 'react';
import { DragLink, PendingLink, ForceGraphNode } from '../types';
import { RING_INNER, RING_OUTER } from '../constants';

interface UseRingLinkCreationProps {
  containerRef: RefObject<HTMLDivElement | null>;
  fgRef: RefObject<any>;
  nodes: ForceGraphNode[];
  is3D: boolean;
  onPendingLink: (link: PendingLink) => void;
}

interface UseRingLinkCreationReturn {
  dragLink: DragLink | null;
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
}: UseRingLinkCreationProps): UseRingLinkCreationReturn {
  const [dragLink, setDragLink] = useState<DragLink | null>(null);
  const [ringHovered, setRingHovered] = useState(false);
  const isDraggingLinkRef = useRef(false);

  useEffect(() => {
    if (is3D) return;
    
    const container = containerRef.current;
    if (!container) return;

    const getGraphCoords = (clientX: number, clientY: number) => {
      const rect = container.getBoundingClientRect();
      const screenX = clientX - rect.left;
      const screenY = clientY - rect.top;
      return fgRef.current?.screen2GraphCoords(screenX, screenY) || { x: 0, y: 0 };
    };

    const findNodeAt = (graphX: number, graphY: number) => {
      for (const node of nodes) {
        const n = node as any;
        if (n.x === undefined) continue;
        const dx = n.x - graphX;
        const dy = n.y - graphY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < RING_OUTER) return { node, dist };
      }
      return null;
    };

    const isInRing = (dist: number) => {
      const scale = fgRef.current?.zoom?.() || 1;
      const scaledRingInner = RING_INNER / scale;
      const scaledRingOuter = RING_OUTER / scale;
      return dist >= scaledRingInner && dist <= scaledRingOuter;
    };

    const handlePointerDown = (clientX: number, clientY: number, e: Event) => {
      if (!fgRef.current) return;
      
      const { x: graphX, y: graphY } = getGraphCoords(clientX, clientY);
      const found = findNodeAt(graphX, graphY);
      
      if (!found) return;
      
      if (isInRing(found.dist)) {
        e.stopPropagation();
        e.preventDefault();
        isDraggingLinkRef.current = true;
        setDragLink({
          sourceNode: found.node,
          mouseX: graphX,
          mouseY: graphY,
        });
      }
    };

    const handlePointerMove = (clientX: number, clientY: number) => {
      if (!isDraggingLinkRef.current || !fgRef.current) return;
      
      const { x: graphX, y: graphY } = getGraphCoords(clientX, clientY);
      setDragLink(prev => prev ? { ...prev, mouseX: graphX, mouseY: graphY } : null);
    };

    const handlePointerUp = (clientX: number, clientY: number) => {
      if (!isDraggingLinkRef.current || !fgRef.current) {
        isDraggingLinkRef.current = false;
        return;
      }
      
      const { x: graphX, y: graphY } = getGraphCoords(clientX, clientY);
      const found = findNodeAt(graphX, graphY);
      
      setDragLink(prev => {
        if (prev && found && found.node.id !== prev.sourceNode.id) {
          onPendingLink({
            fromNodeId: prev.sourceNode.id,
            toNodeId: found.node.id,
          });
        }
        return null;
      });
      
      isDraggingLinkRef.current = false;
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
      setDragLink(null);
    };

    const handleMouseMoveForRing = (e: MouseEvent) => {
      if (isDraggingLinkRef.current || !fgRef.current) return;
      
      const { x: graphX, y: graphY } = getGraphCoords(e.clientX, e.clientY);
      const found = findNodeAt(graphX, graphY);
      
      if (found) {
        setRingHovered(isInRing(found.dist));
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
  }, [is3D, nodes, containerRef, fgRef, onPendingLink]);

  const clearDragLink = () => {
    setDragLink(null);
    isDraggingLinkRef.current = false;
  };

  return {
    dragLink,
    ringHovered,
    isDraggingLinkRef,
    clearDragLink,
  };
}
