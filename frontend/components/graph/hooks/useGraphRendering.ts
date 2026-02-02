import { useCallback, useMemo } from 'react';
import { DragLink, ForceGraphLink, ForceGraphNode, Node } from '../types';
import { NODE_RADIUS } from '../constants';

export interface ParsedLabel {
  text: string;
  fontWeight: string;
  fontStyle: string;
  sizeMultiplier: number;
}

export function parseMarkdownLabel(label: string): ParsedLabel {
  let text = label;
  let fontWeight = 'normal';
  let fontStyle = 'normal';
  let sizeMultiplier = 1;

  if (text.startsWith('### ')) {
    text = text.slice(4);
    fontWeight = 'bold';
    sizeMultiplier = 1.1;
  } else if (text.startsWith('## ')) {
    text = text.slice(3);
    fontWeight = 'bold';
    sizeMultiplier = 1.3;
  } else if (text.startsWith('# ')) {
    text = text.slice(2);
    fontWeight = 'bold';
    sizeMultiplier = 1.5;
  }

  if (text.startsWith('**') && text.endsWith('**') && text.length > 4) {
    text = text.slice(2, -2);
    fontWeight = 'bold';
  } else if (text.startsWith('*') && text.endsWith('*') && text.length > 2 && !text.startsWith('**')) {
    text = text.slice(1, -1);
    fontStyle = 'italic';
  }

  return { text, fontWeight, fontStyle, sizeMultiplier };
}

interface UseGraphRenderingProps {
  hoveredNode: any;
  hoveredLink: any;
  selectedNode: Node | null;
  dragLink: DragLink | null;
  dragTargetNode: ForceGraphNode | null;
  ringHovered: boolean;
  links: ForceGraphLink[];
  highlightedNodeIds?: Set<string>;
  nodeRadius?: number;
}

export function useGraphRendering({
  hoveredNode,
  hoveredLink,
  selectedNode,
  dragLink,
  dragTargetNode,
  ringHovered,
  links,
  highlightedNodeIds = new Set(),
  nodeRadius: nodeRadiusProp,
}: UseGraphRenderingProps) {
  const nodeRadius = nodeRadiusProp ?? NODE_RADIUS;
  const ringInner = nodeRadius + 4;
  const ringOuter = nodeRadius + 12;
  const connectedNodeIds = useMemo(() => {
    if (!hoveredNode) return new Set<string>();
    
    const connected = new Set<string>([hoveredNode.id]);
    links.forEach(link => {
      const sourceId = typeof link.source === 'string' ? link.source : (link.source as any).id;
      const targetId = typeof link.target === 'string' ? link.target : (link.target as any).id;
      if (sourceId === hoveredNode.id) connected.add(targetId);
      if (targetId === hoveredNode.id) connected.add(sourceId);
    });
    return connected;
  }, [hoveredNode, links]);

  const nodeCanvasObject = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const parsed = parseMarkdownLabel(node.label);
    const baseFontSize = 12 / globalScale;
    const fontSize = baseFontSize * parsed.sizeMultiplier;
    ctx.font = `${parsed.fontStyle} ${parsed.fontWeight} ${fontSize}px Sans-Serif`;
    const nodeRadiusScaled = nodeRadius / globalScale;
    const ringInnerScaled = ringInner / globalScale;
    const ringOuterScaled = ringOuter / globalScale;
    
    const isConnected = connectedNodeIds.has(node.id);
    const isHovered = hoveredNode?.id === node.id;
    const isDragSource = dragLink?.sourceNode?.id === node.id;
    const isDragTarget = dragTargetNode?.id === node.id;
    const isSelected = selectedNode?.id === node.id;
    const isHighlighted = highlightedNodeIds.size > 0 && highlightedNodeIds.has(node.id);
    const isDimmed = highlightedNodeIds.size > 0 && !highlightedNodeIds.has(node.id);
    
    if (isDragTarget) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, ringOuterScaled, 0, 2 * Math.PI);
      ctx.arc(node.x, node.y, ringInnerScaled, 0, 2 * Math.PI, true);
      ctx.fillStyle = 'rgba(34, 197, 94, 0.7)';
      ctx.fill();
    }
    
    if (isHovered && !isDragSource && !isDragTarget) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, ringOuterScaled, 0, 2 * Math.PI);
      ctx.arc(node.x, node.y, ringInnerScaled, 0, 2 * Math.PI, true);
      ctx.fillStyle = ringHovered ? 'rgba(34, 197, 94, 0.6)' : 'rgba(255, 255, 255, 0.3)';
      ctx.fill();
    }
    
    if (isDragSource) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, ringOuterScaled, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(34, 197, 94, 0.4)';
      ctx.fill();
    }
    
    ctx.beginPath();
    ctx.arc(node.x, node.y, nodeRadiusScaled, 0, 2 * Math.PI);
    
    let fillColor = node.color;
    let nodeAlpha = 1;
    if (isDragSource) fillColor = '#22c55e';
    else if (isHovered || isSelected) nodeAlpha = 0.6;
    else if (isDimmed) { fillColor = '#374151'; nodeAlpha = 0.4; }
    
    ctx.fillStyle = fillColor;
    ctx.globalAlpha = nodeAlpha;
    ctx.fill();
    ctx.globalAlpha = 1;
    
    if (isSelected) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1 / globalScale;
      ctx.stroke();
    }
    
    if (isHighlighted && !isHovered && !isSelected) {
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2 / globalScale;
      ctx.stroke();
    }
    
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.globalAlpha = isDimmed ? 0.4 : 1;
    ctx.fillStyle = isDragSource ? '#000' : (isHovered || isSelected) ? '#9ca3af' : '#fff';
    ctx.fillText(parsed.text, node.x, node.y);
    ctx.globalAlpha = 1;
  }, [connectedNodeIds, hoveredNode, dragLink, dragTargetNode, selectedNode, ringHovered, highlightedNodeIds, nodeRadius, ringInner, ringOuter]);

  const nodeColor = useCallback((node: any) => {
    const isDragSource = dragLink?.sourceNode?.id === node.id;
    if (isDragSource) return '#22c55e';
    return node.color;
  }, [dragLink]);

  const onRenderFramePost = useCallback((ctx: CanvasRenderingContext2D, globalScale: number) => {
    if (!dragLink) return;
    
    const { sourceNode, mouseX, mouseY } = dragLink;
    
    ctx.beginPath();
    ctx.moveTo(sourceNode.x, sourceNode.y);
    ctx.lineTo(mouseX, mouseY);
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 3 / globalScale;
    ctx.stroke();
    
    ctx.beginPath();
    ctx.arc(mouseX, mouseY, 6 / globalScale, 0, 2 * Math.PI);
    ctx.fillStyle = '#22c55e';
    ctx.fill();
  }, [dragLink]);

  const linkColor = useCallback((link: any) => {
    const linkId = link.id || `${link.source?.id || link.source}-${link.target?.id || link.target}`;
    const hoveredLinkId = hoveredLink?.id || (hoveredLink ? `${hoveredLink.source?.id || hoveredLink.source}-${hoveredLink.target?.id || hoveredLink.target}` : null);
    const isHovered = linkId === hoveredLinkId;
    
    if (isHovered) {
      return '#22c55e';
    }
    
    const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
    const targetId = typeof link.target === 'string' ? link.target : link.target.id;
    
    if (connectedNodeIds.has(sourceId) && connectedNodeIds.has(targetId)) {
      return '#60a5fa';
    }
    return '#64748B';
  }, [connectedNodeIds, hoveredLink]);

  const linkWidth = useCallback((link: any) => {
    const linkId = link.id || `${link.source?.id || link.source}-${link.target?.id || link.target}`;
    const hoveredLinkId = hoveredLink?.id || (hoveredLink ? `${hoveredLink.source?.id || hoveredLink.source}-${hoveredLink.target?.id || hoveredLink.target}` : null);
    const isHovered = linkId === hoveredLinkId;
    
    if (isHovered) {
      return 4;
    }
    
    const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
    const targetId = typeof link.target === 'string' ? link.target : link.target.id;
    
    if (connectedNodeIds.has(sourceId) && connectedNodeIds.has(targetId)) {
      return 3;
    }
    return 1.5;
  }, [connectedNodeIds, hoveredLink]);

  const nodePointerAreaPaint = useCallback((node: any, color: string, ctx: CanvasRenderingContext2D, globalScale: number) => {
    // Extend hit area to include the ring (ringOuter = nodeRadius + 12)
    const scaledRadius = ringOuter / globalScale;
    ctx.beginPath();
    ctx.arc(node.x, node.y, scaledRadius, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
  }, [ringOuter]);

  return {
    nodeCanvasObject,
    nodeColor,
    onRenderFramePost,
    linkColor,
    linkWidth,
    nodePointerAreaPaint,
  };
}
