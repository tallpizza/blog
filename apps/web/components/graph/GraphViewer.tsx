'use client';

import { useEffect, useState } from 'react';
import { InteractiveNvlWrapper } from '@neo4j-nvl/react';

interface Node {
  id: number;
  labels: string[];
  properties: Record<string, any>;
}

interface Relationship {
  id: number;
  type: string;
  startNode: number;
  endNode: number;
  properties: Record<string, any>;
}

interface GraphData {
  nodes: Node[];
  relationships: Relationship[];
}

const LABEL_COLORS: Record<string, string> = {
  Category: '#3B82F6',   // Blue
  Product: '#10B981',    // Green
  Customer: '#8B5CF6',   // Purple
  Order: '#F59E0B',      // Orange
};

export default function GraphViewer() {
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  useEffect(() => {
    async function fetchGraphData() {
      try {
        const response = await fetch('/api/graph');
        if (!response.ok) {
          throw new Error('Failed to fetch graph data');
        }
        const data = await response.json();
        setGraphData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchGraphData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading graph...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  if (!graphData || graphData.nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">No graph data available</div>
      </div>
    );
  }

  // Transform data for NVL
  const nvlNodes = graphData.nodes.map((node) => ({
    id: String(node.id),
    labels: node.labels,
    properties: node.properties,
    size: 20,
    color: LABEL_COLORS[node.labels[0]] || '#6B7280', // Gray fallback
  }));

  const nvlRelationships = graphData.relationships.map((rel) => ({
    id: String(rel.id),
    from: String(rel.startNode),
    to: String(rel.endNode),
    type: rel.type,
    properties: rel.properties,
  }));

  return (
    <div className="flex h-screen">
      <div className="flex-1 relative">
        <InteractiveNvlWrapper
          nodes={nvlNodes}
          rels={nvlRelationships}
          nvlOptions={{
            layout: 'forceDirected',
            allowDynamicMinZoom: true,
            disableWebGL: false,
            instanceId: 'graph-viewer',
          }}
          mouseEventCallbacks={{
            onNodeClick: (node: any) => {
              const originalNode = graphData.nodes.find(
                (n) => String(n.id) === node.id
              );
              if (originalNode) {
                setSelectedNode(originalNode);
              }
            },
          }}
        />
      </div>

      {selectedNode && (
        <div className="w-80 bg-white border-l border-gray-200 p-4 overflow-y-auto">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-bold">Node Details</h2>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <div className="text-sm font-semibold text-gray-600">ID</div>
              <div className="text-lg">{selectedNode.id}</div>
            </div>

            <div>
              <div className="text-sm font-semibold text-gray-600">Labels</div>
              <div className="flex gap-2">
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
              <div className="text-sm font-semibold text-gray-600 mb-2">
                Properties
              </div>
              <div className="space-y-2">
                {Object.entries(selectedNode.properties).map(([key, value]) => (
                  <div key={key} className="border-b border-gray-100 pb-2">
                    <div className="text-xs text-gray-500">{key}</div>
                    <div className="text-sm">{String(value)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
