'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';

import { GraphData, Node, Relationship, PendingLink, ForceGraphData } from './types';
import { Graph3DErrorBoundary } from './Graph3DErrorBoundary';
import { NodeDetailPanel, RelationshipDetailPanel, SearchPanel, UndoRedoButtons, SettingsPanel } from './panels';
import { useRingLinkCreation, useGraphRendering, useUndoRedo, parseMarkdownLabel } from './hooks';
import { getNodeCaption } from './utils';
import { applyGraphForces } from './physics/applyGraphForces';
import { pinNodesInPlace, unpinNodes, repinNode } from './physics/dragPinning';
import SpriteText from 'three-spritetext';
import NodePanel from '@/components/nodes/NodePanel';
import { api } from '@/lib/api-client';
import { useLabelColors } from '@/components/providers/LabelColorProvider';
import { useGraphSettings } from '@/components/providers/GraphSettingsProvider';

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false });
const ForceGraph3D = dynamic(() => import('react-force-graph-3d'), { ssr: false });

export default function GraphViewer() {
  const fgRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { getColor, colors } = useLabelColors();
  const { settings: graphSettings } = useGraphSettings();
  
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);
  const [selectedRel, setSelectedRel] = useState<Relationship | null>(null);
  const [hoveredNode, setHoveredNode] = useState<any>(null);
  const [hoveredLink, setHoveredLink] = useState<any>(null);
  
  const [deleting, setDeleting] = useState(false);
  const [is3D, setIs3D] = useState(false);
  const [is3DSupported, setIs3DSupported] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [highlightedNodeIds, setHighlightedNodeIds] = useState<Set<string>>(new Set());
  const [isUndoRedoProcessing, setIsUndoRedoProcessing] = useState(false);
  const [graphBgColor, setGraphBgColor] = useState('#030712');
  
  const { canUndo, canRedo, pushCommand, undo, redo } = useUndoRedo();

  useEffect(() => {
    const computedStyle = getComputedStyle(document.documentElement);
    const bgColor = computedStyle.getPropertyValue('--graph-bg').trim();
    if (bgColor) setGraphBgColor(bgColor);
  }, []);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const fetchGraphData = useCallback(async () => {
    try {
      const data = await api.getGraph();
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

  const forceGraphDataRef = useRef<ForceGraphData>({ nodes: [], links: [] });
  const prevNodeCountRef = useRef(0);
  const prevRelCountRef = useRef(0);

  type ForceGraphDragNode = Record<string, unknown> & {
    id?: string | number;
    x?: number;
    y?: number;
    z?: number;
    fx?: number;
    fy?: number;
    fz?: number;
  };

  type DragTranslate = { x: number; y: number };

  const dragPinStateRef = useRef<{ draggingNodeId: string | null; pinnedOthers: boolean }>({
    draggingNodeId: null,
    pinnedOthers: false,
  });

  const updateNodeInPlace = useCallback((updatedNode: Node) => {
    const nodes = forceGraphDataRef.current.nodes;
    const nodeToUpdate = nodes.find(n => n.id === String(updatedNode.id));

    if (nodeToUpdate) {
      nodeToUpdate.label = getNodeCaption(updatedNode);
      nodeToUpdate.labels = updatedNode.labels;
      nodeToUpdate.color = getColor(updatedNode.labels[0]);
      nodeToUpdate.originalNode = updatedNode;
    }
  }, [getColor]);

  const updateRelInPlace = useCallback((updatedRel: Relationship) => {
    const links = forceGraphDataRef.current.links;
    const linkToUpdate = links.find(l => l.originalRel?.id === updatedRel.id);
    if (linkToUpdate) {
      linkToUpdate.originalRel = updatedRel;
    }
  }, []);

  const forceGraphData: ForceGraphData = useMemo(() => {
    if (!graphData) return forceGraphDataRef.current;
    
    const nodeCount = graphData.nodes.length;
    const relCount = graphData.relationships.length;
    const structureChanged = nodeCount !== prevNodeCountRef.current || relCount !== prevRelCountRef.current;
    
    if (!structureChanged && forceGraphDataRef.current.nodes.length > 0) {
      return forceGraphDataRef.current;
    }
    
    prevNodeCountRef.current = nodeCount;
    prevRelCountRef.current = relCount;

    const existingNodesMap = new Map(
      forceGraphDataRef.current.nodes.map(n => [n.id, n])
    );
    
    const nodes = graphData.nodes.map(node => {
      const nodeId = String(node.id);
      const existing = existingNodesMap.get(nodeId);
      if (existing) {
        existing.label = getNodeCaption(node);
        existing.labels = node.labels;
        existing.color = getColor(node.labels[0]);
        existing.originalNode = node;
        return existing;
      }
      return {
        id: nodeId,
        label: getNodeCaption(node),
        labels: node.labels,
        color: getColor(node.labels[0]),
        originalNode: node,
      };
    });

    const links = graphData.relationships.map((rel, idx) => ({
      id: `rel-${idx}`,
      source: String(rel.startNode),
      target: String(rel.endNode),
      type: rel.type,
      originalRel: rel,
    }));

    forceGraphDataRef.current = { nodes, links };
    return forceGraphDataRef.current;
  }, [graphData, getColor]);

  useEffect(() => {
    forceGraphDataRef.current.nodes.forEach(node => {
      node.color = getColor(node.labels[0]);
    });
  }, [colors, getColor]);

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
    if (fgRef.current && forceGraphData.nodes.length > 0) {
      applyGraphForces({
        fg: fgRef.current,
        settings: graphSettings,
        is3D,
      });
    }
  }, [forceGraphData.nodes.length, graphSettings.chargeStrength, graphSettings.linkDistance, graphSettings.linkStrength, graphSettings.centerStrength, graphSettings.nodeRadius, is3D]);

  const handleInstantLinkCreate = useCallback(async (link: PendingLink) => {
    try {
      const relData = await api.createRelationship({
        startNodeId: link.fromNodeId,
        endNodeId: link.toNodeId,
        type: 'RELATES_TO',
      });
      
      const newRel: Relationship = {
        id: relData.id,
        type: 'RELATES_TO',
        startNode: link.fromNodeId,
        endNode: link.toNodeId,
        properties: {},
      };
      
      setGraphData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          relationships: [...prev.relationships, newRel],
        };
      });
      
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
      
      setSelectedRel(newRel);
    } catch (err) {
      console.error('Error creating link:', err);
    }
  }, [pushCommand]);

  const { dragLink, dragTargetNode, ringHovered, clearDragLink } = useRingLinkCreation({
    containerRef,
    fgRef,
    nodes: forceGraphData.nodes,
    is3D,
    onPendingLink: handleInstantLinkCreate,
    nodeRadius: graphSettings.nodeRadius,
  });

  const {
    nodeCanvasObject,
    nodeColor,
    onRenderFramePost,
    linkColor,
    linkWidth,
    linkCanvasObject,
    nodePointerAreaPaint,
  } = useGraphRendering({
    hoveredNode,
    hoveredLink,
    selectedNode,
    focusedNodeId,
    dragLink,
    dragTargetNode,
    ringHovered,
    links: forceGraphData.links,
    highlightedNodeIds,
    nodeRadius: graphSettings.nodeRadius,
  });

  const nodeThreeObject = useCallback((node: any) => {
    const parsed = parseMarkdownLabel(node.label);
    const sprite = new SpriteText(parsed.text);
    sprite.color = '#ffffff';
    sprite.textHeight = 4 * parsed.sizeMultiplier;
    sprite.fontWeight = parsed.fontWeight;
    sprite.backgroundColor = 'rgba(0,0,0,0.6)';
    sprite.padding = 2;
    sprite.borderRadius = 3;
    return sprite;
  }, []);

  const handleNodeClick = useCallback((node: any) => {
    if (dragLink) return;
    const nodeId = String(node.id);
    setSelectedRel(null);
    
    if (focusedNodeId === nodeId) {
      // 2nd click on focused node → open detail panel
      setSelectedNode(node.originalNode);
    } else {
      // 1st click → focus (ring only), close any open panel
      setSelectedNode(null);
      setFocusedNodeId(nodeId);
    }
  }, [dragLink, focusedNodeId]);

  const handleLinkClick = useCallback((link: any) => {
    if (dragLink) return;
    setSelectedNode(null);
    setFocusedNodeId(null);
    setSelectedRel(link.originalRel);
  }, [dragLink]);

  const handleDeleteRel = useCallback(async () => {
    if (!selectedRel) return;
    setDeleting(true);
    try {
      await api.deleteRelationship(selectedRel.id);
      setGraphData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          relationships: prev.relationships.filter(r => r.id !== selectedRel.id),
        };
      });
      
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
    } finally {
      setDeleting(false);
    }
  }, [selectedRel, pushCommand]);

  const handleNodeCreated = useCallback((node: Node) => {
    setGraphData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        nodes: [...prev.nodes, node],
      };
    });
    setSelectedNode(node);
    setFocusedNodeId(node.id);
  }, []);

  const handleBackgroundClick = useCallback((event?: any) => {
    if (isMobile && event && forceGraphData.links.length > 0 && fgRef.current && containerRef.current) {
      const canvas = containerRef.current.querySelector('canvas');
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const clientX = event.clientX ?? event.pageX;
        const clientY = event.clientY ?? event.pageY;
        if (clientX != null && clientY != null) {
          const screenCoords = { x: clientX - rect.left, y: clientY - rect.top };

          let nearestLink: any = null;
          let minDist = 30;

          for (const link of forceGraphData.links) {
            const source = link.source as any;
            const target = link.target as any;
            if (source.x === undefined || target.x === undefined) continue;

            const srcScreen = fgRef.current.graph2ScreenCoords(source.x, source.y);
            const tgtScreen = fgRef.current.graph2ScreenCoords(target.x, target.y);

            const dx = tgtScreen.x - srcScreen.x;
            const dy = tgtScreen.y - srcScreen.y;
            const lenSq = dx * dx + dy * dy;
            let dist: number;
            if (lenSq === 0) {
              dist = Math.sqrt((screenCoords.x - srcScreen.x) ** 2 + (screenCoords.y - srcScreen.y) ** 2);
            } else {
              let t = ((screenCoords.x - srcScreen.x) * dx + (screenCoords.y - srcScreen.y) * dy) / lenSq;
              t = Math.max(0, Math.min(1, t));
              const projX = srcScreen.x + t * dx;
              const projY = srcScreen.y + t * dy;
              dist = Math.sqrt((screenCoords.x - projX) ** 2 + (screenCoords.y - projY) ** 2);
            }

            if (dist < minDist) {
              minDist = dist;
              nearestLink = link;
            }
          }

          if (nearestLink) {
            setSelectedNode(null);
            setSelectedRel(nearestLink.originalRel);
            return;
          }
        }
      }
    }

    setSelectedNode(null);
    setSelectedRel(null);
    setFocusedNodeId(null);
  }, [isMobile, forceGraphData.links]);

  const handleSearchSelect = useCallback((nodeId: string) => {
    const node = graphData?.nodes.find(n => n.id === nodeId);
    if (node) {
      setSelectedNode(node);
      setFocusedNodeId(nodeId);
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

  const handleNodeDrag = useCallback((node: ForceGraphDragNode, _translate: DragTranslate) => {
    const nodeId = node.id == null ? null : String(node.id);
    if (!nodeId) return;

    const state = dragPinStateRef.current;
    if (!state.pinnedOthers || state.draggingNodeId !== nodeId) {
      pinNodesInPlace(forceGraphDataRef.current.nodes);
      unpinNodes(forceGraphDataRef.current.nodes, nodeId);
      state.pinnedOthers = true;
      state.draggingNodeId = nodeId;
    }
  }, []);

  const handleNodeDragEnd = useCallback((node: ForceGraphDragNode, _translate: DragTranslate) => {
    const nodeId = node.id == null ? null : String(node.id);
    if (!nodeId) return;

    repinNode(forceGraphDataRef.current.nodes, nodeId);
    unpinNodes(forceGraphDataRef.current.nodes, nodeId);
    dragPinStateRef.current = { draggingNodeId: null, pinnedOthers: false };
  }, []);

  const handleUndo = useCallback(async () => {
    setIsUndoRedoProcessing(true);
    try {
      await undo();
      await fetchGraphData();
      setSelectedNode(null);
      setSelectedRel(null);
      setFocusedNodeId(null);
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
      setFocusedNodeId(null);
    } finally {
      setIsUndoRedoProcessing(false);
    }
  }, [redo, fetchGraphData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-lg text-muted-foreground">Loading graph...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
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
                ? 'bg-muted text-muted-foreground cursor-not-allowed' 
                : is3D 
                  ? 'bg-foreground text-background hover:bg-foreground/90' 
                  : 'bg-card hover:bg-accent text-card-foreground'
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

        <div className="absolute top-4 right-4 z-20 flex items-start gap-2">
          {!isMobile && (
            <SearchPanel
              nodes={forceGraphData.nodes}
              onNodeSelect={handleSearchSelect}
              onHighlightChange={handleHighlightChange}
            />
          )}
          <SettingsPanel />
        </div>

        {dragLink && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 px-4 py-2 bg-card/90 rounded text-sm text-foreground border border-border">
            Drag to another node to create link
          </div>
        )}

        {!isMobile && (
          <div className="absolute bottom-4 left-4 z-10 p-3 bg-panel/90 rounded text-xs text-muted-foreground max-w-xs">
            <div className="font-semibold mb-1 text-foreground">Controls</div>
            <div>Click node: Select → Click again: Details</div>
            <div>Drag node center: Move node</div>
            {!is3D && <div className="text-foreground">Drag from ring: Create link</div>}
            {is3D && <div className="text-foreground mt-1">Drag to rotate, scroll to zoom</div>}
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
                    className="px-4 py-2 bg-card hover:bg-accent rounded text-foreground text-sm"
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
              nodeThreeObject={nodeThreeObject}
              nodeThreeObjectExtend={true}
              linkColor={linkColor}
              linkWidth={linkWidth}
              linkDirectionalParticles={2}
              linkDirectionalParticleWidth={2}
              onNodeClick={handleNodeClick}
              onNodeDrag={handleNodeDrag}
              onNodeDragEnd={handleNodeDragEnd}
              onNodeHover={(node: any) => setHoveredNode(node)}
              onLinkClick={handleLinkClick}
              onLinkHover={(link: any) => setHoveredLink(link)}
              onBackgroundClick={handleBackgroundClick}
              d3AlphaDecay={0.05}
              d3VelocityDecay={graphSettings.velocityDecay}
              cooldownTicks={100}
              backgroundColor={graphBgColor}
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
            linkCanvasObject={linkCanvasObject}
            linkCanvasObjectMode={() => 'after'}
            linkDirectionalParticles={2}
            linkDirectionalParticleWidth={2}
            onNodeClick={handleNodeClick}
            onNodeDrag={handleNodeDrag}
            onNodeDragEnd={handleNodeDragEnd}
            onNodeHover={(node: any) => setHoveredNode(node)}
            onLinkClick={handleLinkClick}
            onLinkHover={(link: any) => setHoveredLink(link)}
            onBackgroundClick={handleBackgroundClick}
            onRenderFramePost={onRenderFramePost}
            d3AlphaDecay={0.05}
            d3VelocityDecay={graphSettings.velocityDecay}
            cooldownTicks={100}
            backgroundColor={graphBgColor}
          />
        )}
      </div>

      {selectedNode && (
        <NodeDetailPanel
          node={selectedNode}
          onClose={() => {
            setSelectedNode(null);
            setFocusedNodeId(null);
          }}
          onUpdate={(updatedNode?: Node) => {
            if (updatedNode) {
              updateNodeInPlace(updatedNode);
              setSelectedNode(updatedNode);
              setGraphData(prev => {
                if (!prev) return prev;
                return {
                  ...prev,
                  nodes: prev.nodes.map(n => n.id === updatedNode.id ? updatedNode : n),
                };
              });
            }
          }}
          onDelete={() => {
            const nodeId = selectedNode.id;
            setGraphData(prev => {
              if (!prev) return prev;
              return {
                nodes: prev.nodes.filter(n => n.id !== nodeId),
                relationships: prev.relationships.filter(
                  r => r.startNode !== nodeId && r.endNode !== nodeId
                ),
              };
            });
            setSelectedNode(null);
            setFocusedNodeId(null);
          }}
          isMobile={isMobile}
        />
      )}

      {selectedRel && (
        <RelationshipDetailPanel
          relationship={selectedRel}
          onClose={() => setSelectedRel(null)}
          onDelete={handleDeleteRel}
          onUpdate={(updatedRel?: Relationship) => {
            if (updatedRel) {
              updateRelInPlace(updatedRel);
              setSelectedRel(updatedRel);
              setGraphData(prev => {
                if (!prev) return prev;
                return {
                  ...prev,
                  relationships: prev.relationships.map(r => r.id === updatedRel.id ? updatedRel : r),
                };
              });
            }
          }}
          deleting={deleting}
          isMobile={isMobile}
        />
      )}
    </div>
  );
}
