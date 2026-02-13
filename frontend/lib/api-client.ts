import type { QueryId } from './cypher-registry';

const API_URL = '/api/cypher';

interface CypherResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

async function executeQuery<T>(
  queryId: QueryId,
  params?: Record<string, unknown>
): Promise<T> {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ queryId, params }),
  });

  const result: CypherResponse<T> = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Query execution failed');
  }

  return result.data as T;
}

export interface GraphNode {
  id: string;
  labels: string[];
  properties: Record<string, unknown>;
}

export interface GraphRelationship {
  id: string;
  type: string;
  startNode: string;
  endNode: string;
  properties: Record<string, unknown>;
}

export interface GraphData {
  nodes: GraphNode[];
  relationships: GraphRelationship[];
}

export type LabelColors = Record<string, string>;

export interface GraphSettings {
  nodeRadius: number;
  chargeStrength: number;
  linkDistance: number;
  linkStrength: number;
  velocityDecay: number;
}

export const DEFAULT_GRAPH_SETTINGS: GraphSettings = {
  nodeRadius: 20,
  chargeStrength: -200,
  linkDistance: 150,
  linkStrength: 1,
  velocityDecay: 0.4,
};

export const api = {
  getGraph: () => executeQuery<GraphData>('getGraph'),

  getAllLabels: () => executeQuery<string[]>('getAllLabels'),

  getLabelColors: () => executeQuery<LabelColors>('getLabelColors'),

  setLabelColors: (labelColors: LabelColors) =>
    executeQuery<LabelColors>('setLabelColors', { labelColors: JSON.stringify(labelColors) }),

  getGraphSettings: () => executeQuery<GraphSettings | null>('getGraphSettings'),

  setGraphSettings: (settings: GraphSettings) =>
    executeQuery<GraphSettings>('setGraphSettings', { graphSettings: JSON.stringify(settings) }),

  createNode: (params: { type?: string; [key: string]: unknown }) =>
    executeQuery<GraphNode>('createNode', params),

  getNode: (nodeId: string) => executeQuery<GraphNode | null>('getNode', { nodeId }),

  updateNode: (nodeId: string, data: { addLabel?: string; [key: string]: unknown }) =>
    executeQuery<GraphNode>('updateNode', { nodeId, ...data }),

  removeLabel: (nodeId: string, label: string) =>
    executeQuery<GraphNode>('removeLabel', { nodeId, label }),

  deleteNode: (nodeId: string) =>
    executeQuery<{ deleted: number }>('deleteNode', { nodeId }),

  createRelationship: (params: {
    startNodeId: string;
    endNodeId: string;
    type: string;
    properties?: Record<string, unknown>;
  }) => executeQuery<GraphRelationship>('createRelationship', params),

  getRelationship: (relId: string) =>
    executeQuery<GraphRelationship | null>('getRelationship', { relId }),

  updateRelationship: (relId: string, properties: Record<string, unknown>) =>
    executeQuery<GraphRelationship>('updateRelationship', { relId, properties }),

  deleteRelationship: (relId: string) =>
    executeQuery<{ deleted: number }>('deleteRelationship', { relId }),
};
