import { Integer } from 'neo4j-driver';

// ============================================================================
// Types
// ============================================================================

export interface QueryDefinition<TParams = Record<string, unknown>, TResult = unknown> {
  /** Cypher query template - use $param for parameters */
  cypher: string | ((params: TParams) => string);
  /** Validate input parameters */
  validate: (params: unknown) => params is TParams;
  /** Transform Neo4j result to API response */
  transform: (records: unknown[]) => TResult;
  /** Human-readable description */
  description: string;
}

export type QueryId = keyof typeof QUERY_REGISTRY;

export interface ExecuteQueryRequest {
  queryId: QueryId;
  params?: Record<string, unknown>;
}

export interface ExecuteQueryResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Convert Neo4j Integer types to native JavaScript numbers
 */
export function toNativeTypes(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (Integer.isInteger(obj)) return (obj as typeof Integer.prototype).toNumber();
  if (Array.isArray(obj)) return obj.map(toNativeTypes);
  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const key in obj) {
      result[key] = toNativeTypes((obj as Record<string, unknown>)[key]);
    }
    return result;
  }
  return obj;
}

/**
 * Build dynamic property clause for SET operations
 */
function buildSetClause(data: Record<string, unknown>, prefix: string = 'n'): string {
  const entries = Object.entries(data).filter(
    ([, value]) => value !== undefined && value !== null
  );
  if (entries.length === 0) return '';
  return entries.map(([key]) => `${prefix}.${key} = $${key}`).join(', ');
}

/**
 * Build dynamic property clause for CREATE operations
 */
function buildPropsClause(data: Record<string, unknown>): string {
  const entries = Object.entries(data).filter(
    ([, value]) => value !== undefined && value !== null
  );
  if (entries.length === 0) return '';
  return `{${entries.map(([key]) => `${key}: $${key}`).join(', ')}}`;
}

// ============================================================================
// Type Guards
// ============================================================================

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isOptionalString(value: unknown): value is string | undefined {
  return value === undefined || typeof value === 'string';
}

// ============================================================================
// Query Registry
// ============================================================================

export const QUERY_REGISTRY = {
  // ---------------------------------------------------------------------------
  // Graph Queries
  // ---------------------------------------------------------------------------
  
  getAllLabels: {
    description: 'Get all labels in the database (excluding Config)',
    cypher: `
      CALL db.labels() YIELD label
      WHERE label <> 'Config'
      RETURN collect(label) as labels
    `,
    validate: (_params: unknown): _params is Record<string, never> => true,
    transform: (records: unknown[]) => {
      if (!records[0]) return [];
      const record = records[0] as { labels: string[] };
      return record.labels || [];
    },
  },

  getGraph: {
    description: 'Get all nodes and relationships in the graph (excluding Config nodes)',
    cypher: `
      MATCH (n)
      WHERE NOT 'Config' IN labels(n)
      OPTIONAL MATCH (n)-[r]->(m)
      WHERE NOT 'Config' IN labels(m)
      RETURN 
        collect(DISTINCT {
          id: elementId(n),
          labels: labels(n),
          properties: properties(n)
        }) as nodes,
        collect(DISTINCT {
          id: elementId(r),
          type: type(r),
          startNode: elementId(startNode(r)),
          endNode: elementId(endNode(r)),
          properties: properties(r)
        }) as relationships
    `,
    validate: (_params: unknown): _params is Record<string, never> => true,
    transform: (records: unknown[]) => {
      if (!records[0]) return { nodes: [], relationships: [] };
      const record = records[0] as { nodes: unknown[]; relationships: unknown[] };
      return {
        nodes: toNativeTypes(record.nodes.filter((n) => (n as { id?: unknown })?.id !== null)),
        relationships: toNativeTypes(record.relationships.filter((r) => (r as { id?: unknown })?.id !== null)),
      };
    },
  },

  // ---------------------------------------------------------------------------
  // Config Queries
  // ---------------------------------------------------------------------------

  getLabelColors: {
    description: 'Get label colors from Config node',
    cypher: `
      MATCH (c:Config)
      RETURN c.labelColors as labelColors
    `,
    validate: (_params: unknown): _params is Record<string, never> => true,
    transform: (records: unknown[]) => {
      if (!records[0]) return {};
      const record = records[0] as { labelColors?: string };
      if (!record.labelColors) return {};
      try {
        return JSON.parse(record.labelColors);
      } catch {
        return {};
      }
    },
  },

  setLabelColors: {
    description: 'Set all label colors in Config node (creates Config if not exists)',
    cypher: `
      MERGE (c:Config)
      SET c.labelColors = $labelColors
      RETURN c.labelColors as labelColors
    `,
    validate: (params: unknown): params is { labelColors: string } => {
      if (!isObject(params)) return false;
      if (!isString(params.labelColors)) return false;
      return true;
    },
    transform: (records: unknown[]) => {
      if (!records[0]) return {};
      const record = records[0] as { labelColors?: string };
      if (!record.labelColors) return {};
      try {
        return JSON.parse(record.labelColors);
      } catch {
        return {};
      }
    },
  },

  getGraphSettings: {
    description: 'Get graph settings from Config node',
    cypher: `
      MATCH (c:Config)
      RETURN c.graphSettings as graphSettings
    `,
    validate: (_params: unknown): _params is Record<string, never> => true,
    transform: (records: unknown[]) => {
      if (!records[0]) return null;
      const record = records[0] as { graphSettings?: string };
      if (!record.graphSettings) return null;
      try {
        return JSON.parse(record.graphSettings);
      } catch {
        return null;
      }
    },
  },

  setGraphSettings: {
    description: 'Set graph settings in Config node',
    cypher: `
      MERGE (c:Config)
      SET c.graphSettings = $graphSettings
      RETURN c.graphSettings as graphSettings
    `,
    validate: (params: unknown): params is { graphSettings: string } => {
      if (!isObject(params)) return false;
      if (!isString(params.graphSettings)) return false;
      return true;
    },
    transform: (records: unknown[]) => {
      if (!records[0]) return null;
      const record = records[0] as { graphSettings?: string };
      if (!record.graphSettings) return null;
      try {
        return JSON.parse(record.graphSettings);
      } catch {
        return null;
      }
    },
  },

  // ---------------------------------------------------------------------------
  // Node Queries
  // ---------------------------------------------------------------------------

  createNode: {
    description: 'Create a new node with optional label and properties',
    cypher: (params: { type?: string; [key: string]: unknown }) => {
      const { type, ...data } = params;
      const propsClause = buildPropsClause(data);
      const labelClause = type ? `:${type}` : '';
      return `
        CREATE (n${labelClause} ${propsClause})
        SET n.createdAt = datetime(), n.updatedAt = datetime()
        RETURN n, elementId(n) as nodeId, labels(n) as labels
      `;
    },
    validate: (params: unknown): params is { type?: string; [key: string]: unknown } => {
      if (!isObject(params)) return false;
      if (params.type !== undefined && !isString(params.type)) return false;
      return true;
    },
    transform: (records: unknown[]) => {
      if (!records[0]) return null;
      const record = records[0] as { n: { properties: unknown }; nodeId: string; labels: string[] };
      return {
        id: record.nodeId,
        labels: record.labels,
        properties: toNativeTypes(record.n.properties),
      };
    },
  },

  updateNode: {
    description: 'Update an existing node properties and/or add label',
    cypher: (params: { nodeId: string; addLabel?: string; [key: string]: unknown }) => {
      const { nodeId: _nodeId, addLabel, ...data } = params;
      void _nodeId;
      const setProps = buildSetClause(data);
      const setLabel = addLabel ? `SET n:\`${addLabel}\`` : '';
      const setClause = setProps ? `SET ${setProps}` : '';
      return `
        MATCH (n)
        WHERE elementId(n) = $nodeId
        ${setLabel}
        ${setClause}
        SET n.updatedAt = datetime()
        RETURN n, elementId(n) as nodeId, labels(n) as labels
      `;
    },
    validate: (params: unknown): params is { nodeId: string; addLabel?: string; [key: string]: unknown } => {
      if (!isObject(params)) return false;
      if (!isString(params.nodeId)) return false;
      if (!isOptionalString(params.addLabel)) return false;
      return true;
    },
    transform: (records: unknown[]) => {
      if (!records[0]) return null;
      const record = records[0] as { n: { properties: unknown }; nodeId: string; labels: string[] };
      return {
        id: record.nodeId,
        labels: record.labels,
        properties: toNativeTypes(record.n.properties),
      };
    },
  },

  deleteNode: {
    description: 'Delete a node and all its relationships',
    cypher: `
      MATCH (n)
      WHERE elementId(n) = $nodeId
      DETACH DELETE n
      RETURN count(n) as deleted
    `,
    validate: (params: unknown): params is { nodeId: string } => {
      return isObject(params) && isString(params.nodeId);
    },
    transform: (records: unknown[]) => {
      const record = records[0] as { deleted: number } | undefined;
      return { deleted: record?.deleted ?? 0 };
    },
  },

  removeLabel: {
    description: 'Remove a label from a node',
    cypher: (params: { nodeId: string; label: string }) => {
      return `
        MATCH (n)
        WHERE elementId(n) = $nodeId
        REMOVE n:\`${params.label}\`
        SET n.updatedAt = datetime()
        RETURN n, elementId(n) as nodeId, labels(n) as labels
      `;
    },
    validate: (params: unknown): params is { nodeId: string; label: string } => {
      return isObject(params) && isString(params.nodeId) && isString(params.label);
    },
    transform: (records: unknown[]) => {
      if (!records[0]) return null;
      const record = records[0] as { n: { properties: unknown }; nodeId: string; labels: string[] };
      return {
        id: record.nodeId,
        labels: record.labels,
        properties: toNativeTypes(record.n.properties),
      };
    },
  },

  getNode: {
    description: 'Get a single node by ID',
    cypher: `
      MATCH (n)
      WHERE elementId(n) = $nodeId
      RETURN n, elementId(n) as nodeId, labels(n) as labels
    `,
    validate: (params: unknown): params is { nodeId: string } => {
      return isObject(params) && isString(params.nodeId);
    },
    transform: (records: unknown[]) => {
      if (!records[0]) return null;
      const record = records[0] as { n: { properties: unknown }; nodeId: string; labels: string[] };
      return {
        id: record.nodeId,
        labels: record.labels,
        properties: toNativeTypes(record.n.properties),
      };
    },
  },

  // ---------------------------------------------------------------------------
  // Relationship Queries
  // ---------------------------------------------------------------------------

  createRelationship: {
    description: 'Create a relationship between two nodes',
    cypher: (params: { startNodeId: string; endNodeId: string; type: string; properties?: Record<string, unknown> }) => {
      const { properties = {} } = params;
      const propEntries = Object.entries(properties)
        .filter(([, value]) => value !== undefined && value !== null)
        .map(([key]) => `${key}: $properties.${key}`)
        .join(', ');
      const propString = propEntries ? `{${propEntries}}` : '';
      return `
        MATCH (start), (end)
        WHERE elementId(start) = $startNodeId AND elementId(end) = $endNodeId
        CREATE (start)-[r:${params.type} ${propString}]->(end)
        RETURN r, elementId(r) as relId, type(r) as relType, 
               elementId(startNode(r)) as startNode, elementId(endNode(r)) as endNode
      `;
    },
    validate: (params: unknown): params is { startNodeId: string; endNodeId: string; type: string; properties?: Record<string, unknown> } => {
      if (!isObject(params)) return false;
      if (!isString(params.startNodeId)) return false;
      if (!isString(params.endNodeId)) return false;
      if (!isString(params.type)) return false;
      if (params.properties !== undefined && !isObject(params.properties)) return false;
      return true;
    },
    transform: (records: unknown[]) => {
      if (!records[0]) return null;
      const record = records[0] as {
        r: { properties: unknown };
        relId: string;
        relType: string;
        startNode: string;
        endNode: string;
      };
      return {
        id: record.relId,
        type: record.relType,
        startNode: record.startNode,
        endNode: record.endNode,
        properties: toNativeTypes(record.r.properties),
      };
    },
  },

  updateRelationship: {
    description: 'Update relationship properties',
    cypher: (params: { relId: string; properties: Record<string, unknown> }) => {
      const propEntries = Object.entries(params.properties)
        .filter(([key]) => key !== 'id' && key !== 'type')
        .map(([key]) => `r.${key} = $properties.${key}`)
        .join(', ');
      return `
        MATCH ()-[r]->()
        WHERE elementId(r) = $relId
        SET ${propEntries}
        RETURN r, elementId(r) as relId, type(r) as relType,
               elementId(startNode(r)) as startNode, elementId(endNode(r)) as endNode
      `;
    },
    validate: (params: unknown): params is { relId: string; properties: Record<string, unknown> } => {
      if (!isObject(params)) return false;
      if (!isString(params.relId)) return false;
      if (!isObject(params.properties)) return false;
      // Must have at least one property to update (excluding id and type)
      const validProps = Object.keys(params.properties).filter(k => k !== 'id' && k !== 'type');
      return validProps.length > 0;
    },
    transform: (records: unknown[]) => {
      if (!records[0]) return null;
      const record = records[0] as {
        r: { properties: unknown };
        relId: string;
        relType: string;
        startNode: string;
        endNode: string;
      };
      return {
        id: record.relId,
        type: record.relType,
        startNode: record.startNode,
        endNode: record.endNode,
        properties: toNativeTypes(record.r.properties),
      };
    },
  },

  deleteRelationship: {
    description: 'Delete a relationship by ID',
    cypher: `
      MATCH ()-[r]->()
      WHERE elementId(r) = $relId
      DELETE r
      RETURN count(r) as deleted
    `,
    validate: (params: unknown): params is { relId: string } => {
      return isObject(params) && isString(params.relId);
    },
    transform: (records: unknown[]) => {
      const record = records[0] as { deleted: number } | undefined;
      return { deleted: record?.deleted ?? 0 };
    },
  },

  getRelationship: {
    description: 'Get a single relationship by ID',
    cypher: `
      MATCH ()-[r]->()
      WHERE elementId(r) = $relId
      RETURN r, elementId(r) as relId, type(r) as relType,
             elementId(startNode(r)) as startNode, elementId(endNode(r)) as endNode
    `,
    validate: (params: unknown): params is { relId: string } => {
      return isObject(params) && isString(params.relId);
    },
    transform: (records: unknown[]) => {
      if (!records[0]) return null;
      const record = records[0] as {
        r: { properties: unknown };
        relId: string;
        relType: string;
        startNode: string;
        endNode: string;
      };
      return {
        id: record.relId,
        type: record.relType,
        startNode: record.startNode,
        endNode: record.endNode,
        properties: toNativeTypes(record.r.properties),
      };
    },
  },
} as const;

// ============================================================================
// Query Executor
// ============================================================================

export function getQueryDefinition(queryId: string): QueryDefinition | null {
  return (QUERY_REGISTRY as unknown as Record<string, QueryDefinition>)[queryId] ?? null;
}

export function listQueries(): Array<{ id: string; description: string }> {
  return Object.entries(QUERY_REGISTRY).map(([id, def]) => ({
    id,
    description: def.description,
  }));
}
