'use client';

import { useEffect, useState, useCallback, useRef, useMemo, Component, ReactNode } from 'react';
import dynamic from 'next/dynamic';

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false });
const ForceGraph3D = dynamic(() => import('react-force-graph-3d'), { ssr: false });

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
  onError?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class Graph3DErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch() {
    this.props.onError?.();
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

interface Node {
  id: number;
  labels: string[];
  properties: Record<string, unknown>;
}

interface Relationship {
  id: number;
  type: string;
  startNode: number;
  endNode: number;
  properties: Record<string, unknown>;
}

interface GraphData {
  nodes: Node[];
  relationships: Relationship[];
}

interface PendingLink {
  fromNodeId: string;
  toNodeId: string;
}

interface DragLink {
  sourceNode: any;
  mouseX: number;
  mouseY: number;
}

const LABEL_COLORS: Record<string, string> = {
  Category: '#3B82F6',
  Product: '#10B981',
  Customer: '#8B5CF6',
  Order: '#F59E0B',
};

const NODE_RADIUS = 20;
const RING_INNER = 24;
const RING_OUTER = 32;

function getNodeCaption(node: Node): string {
  const props = node.properties;
  return (props.name as string) || (props.title as string) || (props.email as string) || `${node.labels[0]} ${props.id || node.id}`;
}

export default function GraphViewer() {
  const fgRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [selectedRel, setSelectedRel] = useState<Relationship | null>(null);
  const [pendingLink, setPendingLink] = useState<PendingLink | null>(null);
  const [hoveredNode, setHoveredNode] = useState<any>(null);
  const [ringHovered, setRingHovered] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [creating, setCreating] = useState(false);
  const [is3D, setIs3D] = useState(false);
  const [is3DSupported, setIs3DSupported] = useState(true);
  const [dragLink, setDragLink] = useState<DragLink | null>(null);

  const fetchGraphData = useCallback(async () => {
    try {
      const response = await fetch('/api/graph');
      if (!response.ok) throw new Error('Failed to fetch graph data');
      const data = await response.json();
      setGraphData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGraphData();
  }, [fetchGraphData]);

  const forceGraphData = useMemo(() => {
    if (!graphData) return { nodes: [], links: [] };
    
    return {
      nodes: graphData.nodes.map(node => ({
        id: String(node.id),
        label: getNodeCaption(node),
        labels: node.labels,
        color: LABEL_COLORS[node.labels[0]] || '#6B7280',
        originalNode: node,
      })),
      links: graphData.relationships.map((rel, idx) => ({
        id: `rel-${idx}`,
        source: String(rel.startNode),
        target: String(rel.endNode),
        type: rel.type,
        originalRel: rel,
      })),
    };
  }, [graphData]);

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
      for (const node of forceGraphData.nodes) {
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
          setPendingLink({
            fromNodeId: prev.sourceNode.id,
            toNodeId: (found.node as any).id,
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
    container.addEventListener('touchcancel', () => {
      isDraggingLinkRef.current = false;
      setDragLink(null);
    }, true);
    
    return () => {
      container.removeEventListener('mousedown', handleMouseDown, true);
      container.removeEventListener('mousemove', handleMouseMove, true);
      container.removeEventListener('mouseup', handleMouseUp, true);
      container.removeEventListener('mousemove', handleMouseMoveForRing);
      
      container.removeEventListener('touchstart', handleTouchStart, true);
      container.removeEventListener('touchmove', handleTouchMove, true);
      container.removeEventListener('touchend', handleTouchEnd, true);
      container.removeEventListener('touchcancel', () => {}, true);
    };
  }, [is3D, forceGraphData.nodes]);

  const handleNodeClick = useCallback((node: any) => {
    if (dragLink) return;
    setSelectedRel(null);
    setPendingLink(null);
    setSelectedNode(node.originalNode);
  }, [dragLink]);

  const handleLinkClick = useCallback((link: any) => {
    if (dragLink) return;
    setSelectedNode(null);
    setPendingLink(null);
    setSelectedRel(link.originalRel);
  }, [dragLink]);



  const handleCreateLink = useCallback(async () => {
    if (!pendingLink || !graphData) return;
    
    const fromNode = graphData.nodes.find(n => String(n.id) === pendingLink.fromNodeId);
    const toNode = graphData.nodes.find(n => String(n.id) === pendingLink.toNodeId);
    
    if (!fromNode || !toNode) return;

    const fromLabel = fromNode.labels[0];
    const toLabel = toNode.labels[0];
    
    setCreating(true);
    try {
      if (fromLabel === 'Order' && toLabel === 'Product') {
        await fetch('/api/relationships', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            order_id: fromNode.properties.id,
            product_id: toNode.properties.id,
            quantity: 1,
            price: (toNode.properties.price as number) || 10,
          }),
        });
      } else if (fromLabel === 'Product' && toLabel === 'Order') {
        await fetch('/api/relationships', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            order_id: toNode.properties.id,
            product_id: fromNode.properties.id,
            quantity: 1,
            price: (fromNode.properties.price as number) || 10,
          }),
        });
      }
      setPendingLink(null);
      await fetchGraphData();
    } finally {
      setCreating(false);
    }
  }, [pendingLink, graphData, fetchGraphData]);

  const handleDeleteRel = useCallback(async () => {
    if (!selectedRel) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/relationships/${selectedRel.id}`, { method: 'DELETE' });
      if (res.ok) {
        setSelectedRel(null);
        await fetchGraphData();
      }
    } finally {
      setDeleting(false);
    }
  }, [selectedRel, fetchGraphData]);

  const getNodeLabel = (nodeId: string) => {
    const node = graphData?.nodes.find(n => String(n.id) === nodeId);
    return node ? `${node.labels[0]} (${getNodeCaption(node)})` : nodeId;
  };

  const connectedNodeIds = useMemo(() => {
    if (!hoveredNode) return new Set<string>();
    
    const connected = new Set<string>([hoveredNode.id]);
    forceGraphData.links.forEach(link => {
      const sourceId = typeof link.source === 'string' ? link.source : (link.source as any).id;
      const targetId = typeof link.target === 'string' ? link.target : (link.target as any).id;
      if (sourceId === hoveredNode.id) connected.add(targetId);
      if (targetId === hoveredNode.id) connected.add(sourceId);
    });
    return connected;
  }, [hoveredNode, forceGraphData.links]);

  const nodeCanvasObject = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const label = node.label;
    const fontSize = 12 / globalScale;
    ctx.font = `${fontSize}px Sans-Serif`;
    const nodeRadius = NODE_RADIUS / globalScale;
    const ringInner = RING_INNER / globalScale;
    const ringOuter = RING_OUTER / globalScale;
    
    const isConnected = connectedNodeIds.has(node.id);
    const isHovered = hoveredNode?.id === node.id;
    const isDragSource = dragLink?.sourceNode?.id === node.id;
    const isSelected = selectedNode?.id === Number(node.id);
    
    if (isHovered && !isDragSource) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, ringOuter, 0, 2 * Math.PI);
      ctx.arc(node.x, node.y, ringInner, 0, 2 * Math.PI, true);
      ctx.fillStyle = ringHovered ? 'rgba(34, 197, 94, 0.6)' : 'rgba(255, 255, 255, 0.3)';
      ctx.fill();
    }
    
    if (isDragSource) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, ringOuter, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(34, 197, 94, 0.4)';
      ctx.fill();
    }
    
    ctx.beginPath();
    ctx.arc(node.x, node.y, nodeRadius, 0, 2 * Math.PI);
    ctx.fillStyle = isDragSource ? '#22c55e' : 
                    isHovered || isSelected ? '#ffffff' : 
                    isConnected ? node.color : node.color;
    ctx.fill();
    
    if (isSelected) {
      ctx.strokeStyle = '#3B82F6';
      ctx.lineWidth = 3 / globalScale;
      ctx.stroke();
    }
    
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = isHovered || isSelected || isDragSource ? '#000' : '#fff';
    ctx.fillText(label, node.x, node.y);
  }, [connectedNodeIds, hoveredNode, dragLink, selectedNode, ringHovered]);

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
    const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
    const targetId = typeof link.target === 'string' ? link.target : link.target.id;
    
    if (connectedNodeIds.has(sourceId) && connectedNodeIds.has(targetId)) {
      return '#60a5fa';
    }
    return '#64748B';
  }, [connectedNodeIds]);

  const linkWidth = useCallback((link: any) => {
    const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
    const targetId = typeof link.target === 'string' ? link.target : link.target.id;
    
    if (connectedNodeIds.has(sourceId) && connectedNodeIds.has(targetId)) {
      return 3;
    }
    return 1.5;
  }, [connectedNodeIds]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-950">
        <div className="text-lg text-gray-400">Loading graph...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-950">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  if (!graphData || graphData.nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-950">
        <div className="text-gray-400">No graph data available</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-950">
      <div 
        ref={containerRef}
        className="flex-1 relative"
        onMouseLeave={() => { setDragLink(null); isDraggingLinkRef.current = false; }}
        style={{ 
          cursor: dragLink ? 'crosshair' : ringHovered ? 'crosshair' : 'default',
          touchAction: 'none',
        }}
      >
        <div className="absolute top-4 left-4 z-10 flex gap-2">
          <button
            onClick={() => is3DSupported && setIs3D(!is3D)}
            disabled={!is3DSupported}
            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
              !is3DSupported 
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                : is3D 
                  ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                  : 'bg-gray-800 hover:bg-gray-700 text-gray-200'
            }`}
            title={!is3DSupported ? '3D not supported on this browser' : ''}
          >
            {is3D ? '3D' : '2D'}{!is3DSupported && ' (N/A)'}
          </button>
        </div>

        {dragLink && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 px-4 py-2 bg-green-900/90 rounded text-sm text-white">
            Drag to another node to create link
          </div>
        )}

        <div className="absolute bottom-4 left-4 z-10 p-3 bg-gray-900/90 rounded text-xs text-gray-300 max-w-xs">
          <div className="font-semibold mb-1">Controls</div>
          <div>Click node: View details</div>
          <div>Drag node center: Move node</div>
          {!is3D && <div className="text-green-400">Drag from ring: Create link</div>}
          {is3D && <div className="text-yellow-400 mt-1">Drag to rotate, scroll to zoom</div>}
        </div>

        {is3D ? (
          <Graph3DErrorBoundary
            fallback={
              <div className="flex items-center justify-center h-full">
                <div className="text-center p-4">
                  <div className="text-red-400 mb-2">3D mode not supported on this browser</div>
                  <button
                    onClick={() => setIs3D(false)}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white text-sm"
                  >
                    Switch to 2D
                  </button>
                </div>
              </div>
            }
            onError={() => {
              setIs3DSupported(false);
              setIs3D(false);
            }}
          >
            <ForceGraph3D
              ref={fgRef}
              graphData={forceGraphData}
              nodeLabel="label"
              nodeColor={nodeColor}
              linkColor={linkColor}
              linkWidth={linkWidth}
              linkDirectionalParticles={2}
              linkDirectionalParticleWidth={2}
              onNodeClick={handleNodeClick}
              onNodeHover={(node: any) => setHoveredNode(node)}
              onLinkClick={handleLinkClick}
              backgroundColor="#030712"
              showNavInfo={false}
            />
          </Graph3DErrorBoundary>
        ) : (
          <ForceGraph2D
            ref={fgRef}
            graphData={forceGraphData}
            nodeCanvasObject={nodeCanvasObject}
            nodePointerAreaPaint={(node: any, color: string, ctx: CanvasRenderingContext2D) => {
              ctx.beginPath();
              ctx.arc(node.x, node.y, NODE_RADIUS, 0, 2 * Math.PI);
              ctx.fillStyle = color;
              ctx.fill();
            }}
            enableNodeDrag={!dragLink}
            linkColor={linkColor}
            linkWidth={linkWidth}
            linkDirectionalParticles={2}
            linkDirectionalParticleWidth={2}
            onNodeClick={handleNodeClick}
            onNodeHover={(node: any) => setHoveredNode(node)}
            onLinkClick={handleLinkClick}
            onRenderFramePost={onRenderFramePost}
            d3AlphaDecay={0.02}
            d3VelocityDecay={0.3}
            cooldownTicks={100}
            backgroundColor="#030712"
          />
        )}
      </div>

      {pendingLink && (
        <div className="w-80 bg-gray-900 border-l border-gray-800 p-4 overflow-y-auto">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-bold text-white">Create Link</h2>
            <button onClick={() => setPendingLink(null)} className="text-gray-400 hover:text-white">✕</button>
          </div>

          <div className="space-y-4">
            <div className="p-3 bg-gray-800 rounded-lg">
              <div className="text-sm text-blue-400 font-medium">From</div>
              <div className="text-white">{getNodeLabel(pendingLink.fromNodeId)}</div>
            </div>
            
            <div className="flex justify-center">
              <span className="text-gray-500">↓</span>
            </div>
            
            <div className="p-3 bg-gray-800 rounded-lg">
              <div className="text-sm text-green-400 font-medium">To</div>
              <div className="text-white">{getNodeLabel(pendingLink.toNodeId)}</div>
            </div>

            <button
              data-testid="confirm-link-btn"
              onClick={handleCreateLink}
              disabled={creating}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-600"
            >
              {creating ? 'Creating...' : 'Create Link'}
            </button>
            
            <button
              onClick={() => setPendingLink(null)}
              className="w-full px-4 py-2 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-800"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {selectedNode && !pendingLink && (
        <div className="w-80 bg-gray-900 border-l border-gray-800 p-4 overflow-y-auto">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-bold text-white">Node Details</h2>
            <button onClick={() => setSelectedNode(null)} className="text-gray-400 hover:text-white">✕</button>
          </div>

          <div className="space-y-3">
            <div>
              <div className="text-sm font-medium text-gray-400">ID</div>
              <div className="text-lg text-white">{selectedNode.id}</div>
            </div>

            <div>
              <div className="text-sm font-medium text-gray-400">Labels</div>
              <div className="flex gap-2 mt-1">
                {selectedNode.labels.map((label) => (
                  <span
                    key={label}
                    className="px-2 py-1 rounded text-sm text-white"
                    style={{ backgroundColor: LABEL_COLORS[label] || '#6B7280' }}
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <div className="text-sm font-medium text-gray-400 mb-2">Properties</div>
              <div className="space-y-2">
                {Object.entries(selectedNode.properties).map(([key, value]) => (
                  <div key={key} className="border-b border-gray-800 pb-2">
                    <div className="text-xs text-gray-500">{key}</div>
                    <div className="text-sm text-gray-200">{String(value)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedRel && !pendingLink && (
        <div className="w-80 bg-gray-900 border-l border-gray-800 p-4 overflow-y-auto">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-bold text-white">Relationship</h2>
            <button onClick={() => setSelectedRel(null)} className="text-gray-400 hover:text-white">✕</button>
          </div>

          <div className="space-y-3">
            <div>
              <div className="text-sm font-medium text-gray-400">Type</div>
              <div className="text-lg text-white">{selectedRel.type}</div>
            </div>

            <div>
              <div className="text-sm font-medium text-gray-400">From Node</div>
              <div className="text-gray-200">{selectedRel.startNode}</div>
            </div>

            <div>
              <div className="text-sm font-medium text-gray-400">To Node</div>
              <div className="text-gray-200">{selectedRel.endNode}</div>
            </div>

            {Object.keys(selectedRel.properties).length > 0 && (
              <div>
                <div className="text-sm font-medium text-gray-400 mb-2">Properties</div>
                <div className="space-y-2">
                  {Object.entries(selectedRel.properties).map(([key, value]) => (
                    <div key={key} className="border-b border-gray-800 pb-2">
                      <div className="text-xs text-gray-500">{key}</div>
                      <div className="text-sm text-gray-200">{String(value)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              data-testid="delete-rel-btn"
              onClick={handleDeleteRel}
              disabled={deleting}
              className="w-full mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-600"
            >
              {deleting ? 'Deleting...' : 'Delete Relationship'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
