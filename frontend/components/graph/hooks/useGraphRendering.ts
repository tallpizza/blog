import { useCallback, useMemo } from 'react';
import { DragLink, ForceGraphLink, ForceGraphNode, Node } from '../types';
import { NODE_RADIUS } from '../constants';

export interface ParsedLabel {
  text: string;
  fontWeight: string;
  fontStyle: string;
  sizeMultiplier: number;
}

function getEndpointId(endpoint: string | ForceGraphNode): string {
  return typeof endpoint === 'string' ? endpoint : endpoint.id;
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
  hoveredNode: ForceGraphNode | null;
  hoveredLink: ForceGraphLink | null;
  selectedNode: Node | null;
  focusedNodeId: string | null;
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
  focusedNodeId,
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
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
      const targetId = typeof link.target === 'string' ? link.target : link.target.id;
      if (sourceId === hoveredNode.id) connected.add(targetId);
      if (targetId === hoveredNode.id) connected.add(sourceId);
    });
    return connected;
  }, [hoveredNode, links]);

  const nodeCanvasObject = useCallback((rawNode: unknown, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const node = rawNode as ForceGraphNode;
    const nodeX = node.x;
    const nodeY = node.y;
    if (nodeX === undefined || nodeY === undefined) return;

    const parsed = parseMarkdownLabel(typeof node.label === 'string' ? node.label : '');
    const baseFontSize = 12 / globalScale;
    const fontSize = baseFontSize * parsed.sizeMultiplier;
    ctx.font = `${parsed.fontStyle} ${parsed.fontWeight} ${fontSize}px Sans-Serif`;
    const nodeRadiusScaled = nodeRadius / globalScale;
    const ringInnerScaled = ringInner / globalScale;
    const ringOuterScaled = ringOuter / globalScale;
    
    const isHovered = hoveredNode?.id === node.id;
    const isDragSource = dragLink?.sourceNode?.id === node.id;
    const isDragTarget = dragTargetNode?.id === node.id;
    const isSelected = selectedNode?.id === node.id;
    const isFocused = focusedNodeId === node.id;
    const isHighlighted = highlightedNodeIds.size > 0 && highlightedNodeIds.has(node.id);
    const isDimmed = highlightedNodeIds.size > 0 && !highlightedNodeIds.has(node.id);
    
    if (isDragTarget) {
      ctx.beginPath();
      ctx.arc(nodeX, nodeY, ringOuterScaled, 0, 2 * Math.PI);
      ctx.arc(nodeX, nodeY, ringInnerScaled, 0, 2 * Math.PI, true);
      ctx.fillStyle = 'rgba(34, 197, 94, 0.7)';
      ctx.fill();
    }
    
    if (isFocused && !isHovered && !isDragSource && !isDragTarget) {
      ctx.beginPath();
      ctx.arc(nodeX, nodeY, ringOuterScaled, 0, 2 * Math.PI);
      ctx.arc(nodeX, nodeY, ringInnerScaled, 0, 2 * Math.PI, true);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.fill();
    }
    
    if (isHovered && !isDragSource && !isDragTarget) {
      ctx.beginPath();
      ctx.arc(nodeX, nodeY, ringOuterScaled, 0, 2 * Math.PI);
      ctx.arc(nodeX, nodeY, ringInnerScaled, 0, 2 * Math.PI, true);
      ctx.fillStyle = ringHovered ? 'rgba(34, 197, 94, 0.6)' : 'rgba(255, 255, 255, 0.3)';
      ctx.fill();
    }
    
    if (isDragSource) {
      ctx.beginPath();
      ctx.arc(nodeX, nodeY, ringOuterScaled, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(34, 197, 94, 0.4)';
      ctx.fill();
    }
    
    ctx.beginPath();
    ctx.arc(nodeX, nodeY, nodeRadiusScaled, 0, 2 * Math.PI);
    
    let fillColor = typeof node.color === 'string' ? node.color : '#64748B';
    let nodeAlpha = 1;
    if (isDragSource) fillColor = '#22c55e';
    else if (isHovered || isSelected || isFocused) nodeAlpha = 0.6;
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
    ctx.fillStyle = isDragSource ? '#000' : (isHovered || isSelected || isFocused) ? '#9ca3af' : '#fff';
    ctx.fillText(parsed.text, nodeX, nodeY);
    ctx.globalAlpha = 1;
  }, [connectedNodeIds, hoveredNode, dragLink, dragTargetNode, selectedNode, focusedNodeId, ringHovered, highlightedNodeIds, nodeRadius, ringInner, ringOuter]);

  const nodeColor = useCallback((rawNode: unknown) => {
    const node = rawNode as ForceGraphNode;
    const isDragSource = dragLink?.sourceNode?.id === node.id;
    if (isDragSource) return '#22c55e';
    return typeof node.color === 'string' ? node.color : '#64748B';
  }, [dragLink]);

  const onRenderFramePost = useCallback((ctx: CanvasRenderingContext2D, globalScale: number) => {
    if (!dragLink) return;
    
    const { sourceNode, mouseX, mouseY } = dragLink;
    const sourceX = sourceNode.x;
    const sourceY = sourceNode.y;
    if (sourceX === undefined || sourceY === undefined) return;

    const endpointStyle = getDragEndpointStyle({
      hasDragTarget: Boolean(dragTargetNode),
      nodeRadius,
      globalScale,
    });
    
    ctx.beginPath();
    ctx.moveTo(sourceX, sourceY);
    ctx.lineTo(mouseX, mouseY);
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 3 / globalScale;
    ctx.stroke();
    
    ctx.beginPath();
    ctx.arc(mouseX, mouseY, endpointStyle.radius, 0, 2 * Math.PI);
    ctx.fillStyle = endpointStyle.fillStyle;
    ctx.fill();

    if (endpointStyle.strokeStyle && endpointStyle.lineWidth) {
      ctx.beginPath();
      ctx.arc(mouseX, mouseY, endpointStyle.radius, 0, 2 * Math.PI);
      ctx.strokeStyle = endpointStyle.strokeStyle;
      ctx.lineWidth = endpointStyle.lineWidth;
      ctx.stroke();
    }
  }, [dragLink, dragTargetNode, nodeRadius]);

  const linkCanvasObject = useCallback((rawLink: unknown, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const link = rawLink as ForceGraphLink;
    const source = typeof link.source === 'string' ? null : link.source;
    const target = typeof link.target === 'string' ? null : link.target;
    if (!source || !target || source.x === undefined || source.y === undefined || target.x === undefined || target.y === undefined) return;

    const text = link.originalRel?.properties?.text;
    if (!text) return;

    const firstLine = String(text).split('\n')[0].trim();
    if (!firstLine) return;

    const parsed = parseMarkdownLabel(firstLine);
    const midX = (source.x + target.x) / 2;
    const midY = (source.y + target.y) / 2;

    const fontSize = (10 / globalScale) * parsed.sizeMultiplier;
    ctx.font = `${parsed.fontWeight} ${fontSize}px Sans-Serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const textWidth = ctx.measureText(parsed.text).width;
    const padding = 3 / globalScale;
    ctx.fillStyle = 'rgba(3, 7, 18, 0.8)';
    ctx.beginPath();
    const r = 3 / globalScale;
    const x = midX - textWidth / 2 - padding;
    const y = midY - fontSize / 2 - padding;
    const w = textWidth + padding * 2;
    const h = fontSize + padding * 2;
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.fill();

    ctx.fillStyle = '#d1d5db';
    ctx.fillText(parsed.text, midX, midY);
  }, []);

  const linkColor = useCallback((rawLink: unknown) => {
    const link = rawLink as ForceGraphLink;
    const linkId = link.id || `${getEndpointId(link.source)}-${getEndpointId(link.target)}`;
    const hoveredLinkId = hoveredLink
      ? hoveredLink.id || `${getEndpointId(hoveredLink.source)}-${getEndpointId(hoveredLink.target)}`
      : null;
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

  const linkWidth = useCallback((rawLink: unknown) => {
    const link = rawLink as ForceGraphLink;
    const linkId = link.id || `${getEndpointId(link.source)}-${getEndpointId(link.target)}`;
    const hoveredLinkId = hoveredLink
      ? hoveredLink.id || `${getEndpointId(hoveredLink.source)}-${getEndpointId(hoveredLink.target)}`
      : null;
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

  const nodePointerAreaPaint = useCallback((rawNode: unknown, color: string, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const node = rawNode as ForceGraphNode;
    const nodeX = node.x;
    const nodeY = node.y;
    if (nodeX === undefined || nodeY === undefined) return;
    // Extend hit area to include the ring (ringOuter = nodeRadius + 12)
    const scaledRadius = ringOuter / globalScale;
    ctx.beginPath();
    ctx.arc(nodeX, nodeY, scaledRadius, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
  }, [ringOuter]);

  return {
    nodeCanvasObject,
    nodeColor,
    onRenderFramePost,
    linkColor,
    linkWidth,
    linkCanvasObject,
    nodePointerAreaPaint,
  };
}

interface DragEndpointStyleParams {
  hasDragTarget: boolean;
  nodeRadius: number;
  globalScale: number;
}

interface DragEndpointStyle {
  radius: number;
  fillStyle: string;
  strokeStyle: string | null;
  lineWidth: number | null;
}

export function getDragEndpointStyle({
  hasDragTarget,
  nodeRadius,
  globalScale,
}: DragEndpointStyleParams): DragEndpointStyle {
  if (hasDragTarget) {
    return {
      radius: 6 / globalScale,
      fillStyle: '#22c55e',
      strokeStyle: null,
      lineWidth: null,
    };
  }

  return {
    radius: nodeRadius / globalScale,
    fillStyle: 'rgba(34, 197, 94, 0.22)',
    strokeStyle: '#22c55e',
    lineWidth: 2 / globalScale,
  };
}
