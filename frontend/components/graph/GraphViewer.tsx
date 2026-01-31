'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';

import { GraphData, Node, Relationship, PendingLink, ForceGraphData } from './types';
import { GRAPH_BACKGROUND } from './constants';
import { Graph3DErrorBoundary } from './Graph3DErrorBoundary';
import { NodeDetailPanel, RelationshipDetailPanel, SearchPanel, UndoRedoButtons } from './panels';
import { useRingLinkCreation, useGraphRendering, useUndoRedo } from './hooks';
import { getNodeCaption, getNodeColor } from './utils';
import NodePanel from '@/components/nodes/NodePanel';

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
  const [hoveredNode, setHoveredNode] = useState<any>(null);
  const [hoveredLink, setHoveredLink] = useState<any>(null);
  
  const [deleting, setDeleting] = useState(false);
  const [is3D, setIs3D] = useState(false);
  const [is3DSupported, setIs3DSupported] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [highlightedNodeIds, setHighlightedNodeIds] = useState<Set<string>>(new Set());
  const [isUndoRedoProcessing, setIsUndoRedoProcessing] = useState(false);
  
  const { canUndo, canRedo, pushCommand, undo, redo } = useUndoRedo();

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__FORCE_GRAPH_DATA__ = forceGraphData;
      (window as any).__FORCE_GRAPH_INSTANCE__ = fgRef.current;
    }
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).__FORCE_GRAPH_DATA__;
        delete (window as any).__FORCE_GRAPH_INSTANCE__;
      }
    };
  }, [forceGraphData]);

  useEffect(() => {
    if (fgRef.current) {
      fgRef.current.d3Force('charge')?.strength(-100);
      fgRef.current.d3Force('link')?.distance(80);
    }
  }, [forceGraphData]);

  const handleInstantLinkCreate = useCallback(async (link: PendingLink) => {
    try {
      const res = await fetch('/api/relationships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startNodeId: link.fromNodeId,
          endNodeId: link.toNodeId,
          type: 'RELATES_TO',
        }),
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create relationship');
      }
      
      const relData = await res.json();
      
      pushCommand({
        type: 'CREATE_RELATIONSHIP',
        data: { 
          relId: relData.id,
          relData: {
            startNodeId: link.fromNodeId,
            endNodeId: link.toNodeId,
            type: 'RELATES_TO',
          }
        },
        reverseData: {
          startNodeId: link.fromNodeId,
          endNodeId: link.toNodeId,
          type: 'RELATES_TO',
        },
      });
      
      await fetchGraphData();
      
      if (relData.id) {
        const newRel = {
          id: relData.id,
          type: 'RELATES_TO',
          startNode: link.fromNodeId,
          endNode: link.toNodeId,
          properties: {},
        };
        setSelectedRel(newRel);
      }
    } catch (err) {
      console.error('Error creating link:', err);
    }
  }, [fetchGraphData, pushCommand]);

  const { dragLink, dragTargetNode, ringHovered, clearDragLink } = useRingLinkCreation({
    containerRef,
    fgRef,
    nodes: forceGraphData.nodes,
    is3D,
    onPendingLink: handleInstantLinkCreate,
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
    hoveredLink,
    selectedNode,
    dragLink,
    dragTargetNode,
    ringHovered,
    links: forceGraphData.links,
    highlightedNodeIds,
  });

  const handleNodeClick = useCallback((node: any) => {
    if (dragLink) return;
    setSelectedRel(null);
    setSelectedNode(node.originalNode);
  }, [dragLink]);

  const handleLinkClick = useCallback((link: any) => {
    if (dragLink) return;
    setSelectedNode(null);
    setSelectedRel(link.originalRel);
  }, [dragLink]);

  const handleDeleteRel = useCallback(async () => {
    if (!selectedRel) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/relationships/${encodeURIComponent(selectedRel.id)}`, { method: 'DELETE' });
      if (res.ok || res.status === 204) {
        pushCommand({
          type: 'DELETE_RELATIONSHIP',
          data: { relId: selectedRel.id },
          reverseData: {
            startNodeId: selectedRel.startNode,
            endNodeId: selectedRel.endNode,
            type: selectedRel.type,
            properties: selectedRel.properties,
          },
        });
        setSelectedRel(null);
        await fetchGraphData();
      }
    } finally {
      setDeleting(false);
    }
  }, [selectedRel, fetchGraphData, pushCommand]);

  const handleNodeCreated = useCallback((nodeId: string) => {
    fetchGraphData().then(() => {
      const newNode = graphData?.nodes.find(n => n.id === nodeId);
      if (newNode) {
        setSelectedNode(newNode);
      }
    });
  }, [fetchGraphData, graphData]);

  const handleBackgroundClick = useCallback(() => {
    setSelectedNode(null);
    setSelectedRel(null);
  }, []);

  const handleSearchSelect = useCallback((nodeId: string) => {
    const node = graphData?.nodes.find(n => n.id === nodeId);
    if (node) {
      setSelectedNode(node);
      setSelectedRel(null);
      
      const graphNode = forceGraphData.nodes.find(n => n.id === nodeId);
      if (graphNode && graphNode.x !== undefined && graphNode.y !== undefined && fgRef.current) {
        fgRef.current.centerAt(graphNode.x, graphNode.y, 500);
        fgRef.current.zoom(2, 500);
      }
    }
  }, [graphData, forceGraphData.nodes]);

  const handleHighlightChange = useCallback((nodeIds: Set<string>) => {
    setHighlightedNodeIds(nodeIds);
  }, []);

  const handleUndo = useCallback(async () => {
    setIsUndoRedoProcessing(true);
    try {
      await undo();
      await fetchGraphData();
      setSelectedNode(null);
      setSelectedRel(null);
    } finally {
      setIsUndoRedoProcessing(false);
    }
  }, [undo, fetchGraphData]);

  const handleRedo = useCallback(async () => {
    setIsUndoRedoProcessing(true);
    try {
      await redo();
      await fetchGraphData();
      setSelectedNode(null);
      setSelectedRel(null);
    } finally {
      setIsUndoRedoProcessing(false);
    }
  }, [redo, fetchGraphData]);

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

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-950">
      <div 
        ref={containerRef}
        className="flex-1 relative"
        onMouseLeave={clearDragLink}
        style={{ 
          cursor: dragLink ? 'crosshair' : ringHovered ? 'crosshair' : 'default',
          touchAction: 'none',
        }}
      >
        <div className="absolute top-4 left-4 z-10 flex gap-2 items-center">
          <NodePanel onNodeCreated={handleNodeCreated} />
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
          <UndoRedoButtons
            canUndo={canUndo}
            canRedo={canRedo}
            onUndo={handleUndo}
            onRedo={handleRedo}
            isProcessing={isUndoRedoProcessing}
          />
        </div>

        {!isMobile && (
          <SearchPanel
            nodes={forceGraphData.nodes}
            onNodeSelect={handleSearchSelect}
            onHighlightChange={handleHighlightChange}
          />
        )}

        {dragLink && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 px-4 py-2 bg-green-900/90 rounded text-sm text-white">
            Drag to another node to create link
          </div>
        )}

        {!isMobile && (
          <div className="absolute bottom-4 left-4 z-10 p-3 bg-gray-900/90 rounded text-xs text-gray-300 max-w-xs">
            <div className="font-semibold mb-1">Controls</div>
            <div>Click node: View details</div>
            <div>Drag node center: Move node</div>
            {!is3D && <div className="text-green-400">Drag from ring: Create link</div>}
            {is3D && <div className="text-yellow-400 mt-1">Drag to rotate, scroll to zoom</div>}
          </div>
        )}

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
              onLinkHover={(link: any) => setHoveredLink(link)}
              onBackgroundClick={handleBackgroundClick}
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
            onLinkHover={(link: any) => setHoveredLink(link)}
            onBackgroundClick={handleBackgroundClick}
            onRenderFramePost={onRenderFramePost}
            d3AlphaDecay={0.05}
            d3VelocityDecay={0.4}
            cooldownTicks={100}
            backgroundColor={GRAPH_BACKGROUND}
          />
        )}
      </div>

      {selectedNode && (
        <NodeDetailPanel
          node={selectedNode}
          onClose={() => setSelectedNode(null)}
          onUpdate={() => fetchGraphData()}
          onDelete={() => {
            setSelectedNode(null);
            fetchGraphData();
          }}
          isMobile={isMobile}
        />
      )}

      {selectedRel && (
        <RelationshipDetailPanel
          relationship={selectedRel}
          onClose={() => setSelectedRel(null)}
          onDelete={handleDeleteRel}
          onUpdate={() => fetchGraphData()}
          deleting={deleting}
          isMobile={isMobile}
        />
      )}
    </div>
  );
}
