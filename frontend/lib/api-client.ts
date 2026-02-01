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

export const api = {
  getGraph: () => executeQuery<GraphData>('getGraph'),

  getLabelColors: () => executeQuery<LabelColors>('getLabelColors'),

  setLabelColors: (labelColors: LabelColors) =>
    executeQuery<LabelColors>('setLabelColors', { labelColors: JSON.stringify(labelColors) }),

  createNode: (params: { type?: string; [key: string]: unknown }) =>
    executeQuery<GraphNode>('createNode', params),

  getNode: (nodeId: string) => executeQuery<GraphNode | null>('getNode', { nodeId }),

  updateNode: (nodeId: string, data: { addLabel?: string; [key: string]: unknown }) =>
    executeQuery<GraphNode>('updateNode', { nodeId, ...data }),

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
