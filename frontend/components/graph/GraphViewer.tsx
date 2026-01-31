'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';

import { GraphData, Node, Relationship, PendingLink, ForceGraphData } from './types';
import { GRAPH_BACKGROUND, NODE_RADIUS } from './constants';
import { Graph3DErrorBoundary } from './Graph3DErrorBoundary';
import { NodeDetailPanel, RelationshipDetailPanel, CreateLinkPanel } from './panels';
import { useRingLinkCreation, useGraphRendering } from './hooks';
import { getNodeCaption, getNodeLabel, getNodeColor } from './utils';

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false });
const ForceGraph3D = dynamic(() => import('react-force-graph-3d'), { ssr: false });

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
  
  const [deleting, setDeleting] = useState(false);
  const [creating, setCreating] = useState(false);
  const [is3D, setIs3D] = useState(false);
  const [is3DSupported, setIs3DSupported] = useState(true);

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

  const forceGraphData: ForceGraphData = useMemo(() => {
    if (!graphData) return { nodes: [], links: [] };
    
    return {
      nodes: graphData.nodes.map(node => ({
        id: String(node.id),
        label: getNodeCaption(node),
        labels: node.labels,
        color: getNodeColor(node.labels[0]),
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

  const { dragLink, ringHovered, isDraggingLinkRef, clearDragLink } = useRingLinkCreation({
    containerRef,
    fgRef,
    nodes: forceGraphData.nodes,
    is3D,
    onPendingLink: setPendingLink,
  });

  const {
    nodeCanvasObject,
    nodeColor,
    onRenderFramePost,
    linkColor,
    linkWidth,
    nodePointerAreaPaint,
  } = useGraphRendering({
    hoveredNode,
    selectedNode,
    dragLink,
    ringHovered,
    links: forceGraphData.links,
  });

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
        onMouseLeave={clearDragLink}
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
              backgroundColor={GRAPH_BACKGROUND}
              showNavInfo={false}
            />
          </Graph3DErrorBoundary>
        ) : (
          <ForceGraph2D
            ref={fgRef}
            graphData={forceGraphData}
            nodeCanvasObject={nodeCanvasObject}
            nodePointerAreaPaint={nodePointerAreaPaint}
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
            backgroundColor={GRAPH_BACKGROUND}
          />
        )}
      </div>

      {pendingLink && (
        <CreateLinkPanel
          fromLabel={getNodeLabel(graphData.nodes, pendingLink.fromNodeId)}
          toLabel={getNodeLabel(graphData.nodes, pendingLink.toNodeId)}
          onConfirm={handleCreateLink}
          onCancel={() => setPendingLink(null)}
          creating={creating}
        />
      )}

      {selectedNode && !pendingLink && (
        <NodeDetailPanel
          node={selectedNode}
          onClose={() => setSelectedNode(null)}
        />
      )}

      {selectedRel && !pendingLink && (
        <RelationshipDetailPanel
          relationship={selectedRel}
          onClose={() => setSelectedRel(null)}
          onDelete={handleDeleteRel}
          deleting={deleting}
        />
      )}
    </div>
  );
}
