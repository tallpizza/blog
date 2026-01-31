import { describe, it, expect, afterAll } from 'vitest';
import { getNeo4jDriver } from '@/lib/neo4j';

const API_URL = 'http://localhost:3000/api/cypher';
const testNodeIds: string[] = [];
const testRelIds: string[] = [];

async function cleanup() {
  const driver = getNeo4jDriver();
  const session = driver.session();
  try {
    if (testRelIds.length > 0) {
      await session.run(
        'MATCH ()-[r]->() WHERE elementId(r) IN $ids DELETE r',
        { ids: testRelIds }
      );
    }
    if (testNodeIds.length > 0) {
      await session.run(
        'MATCH (n) WHERE elementId(n) IN $ids DETACH DELETE n',
        { ids: testNodeIds }
      );
    }
  } finally {
    await session.close();
  }
}

afterAll(cleanup);

describe('GET /api/cypher', () => {
  it('returns list of available queries', async () => {
    const res = await fetch(API_URL);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.queries).toBeInstanceOf(Array);
    expect(data.queries.length).toBeGreaterThan(0);
    expect(data.queries[0]).toHaveProperty('id');
    expect(data.queries[0]).toHaveProperty('description');
  });
});

describe('POST /api/cypher - validation', () => {
  it('returns 400 when queryId is missing', async () => {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ params: {} }),
    });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error).toContain('queryId');
  });

  it('returns 400 for unknown queryId', async () => {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ queryId: 'nonExistentQuery' }),
    });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error).toContain('Unknown queryId');
  });

  it('returns 400 for invalid params', async () => {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ queryId: 'deleteNode', params: { nodeId: 123 } }),
    });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error).toContain('Invalid parameters');
  });
});

describe('POST /api/cypher - getGraph', () => {
  it('returns graph data', async () => {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ queryId: 'getGraph' }),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('nodes');
    expect(data.data).toHaveProperty('relationships');
  });
});

describe('POST /api/cypher - Node CRUD', () => {
  it('creates a node without label', async () => {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        queryId: 'createNode',
        params: { name: 'Test Cypher Node' },
      }),
    });
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.id).toBeDefined();
    expect(data.data.labels).toEqual([]);
    expect(data.data.properties.name).toBe('Test Cypher Node');
    testNodeIds.push(data.data.id);
  });

  it('creates a node with label', async () => {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        queryId: 'createNode',
        params: { type: 'Product', name: 'Cypher Product', price: 199.99 },
      }),
    });
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.labels).toContain('Product');
    expect(data.data.properties.price).toBe(199.99);
    testNodeIds.push(data.data.id);
  });

  it('gets a node by ID', async () => {
    const nodeId = testNodeIds[0];
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        queryId: 'getNode',
        params: { nodeId },
      }),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.id).toBe(nodeId);
  });

  it('returns 404 for non-existent node', async () => {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        queryId: 'getNode',
        params: { nodeId: '4:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx:999999' },
      }),
    });
    expect(res.status).toBe(404);
  });

  it('updates a node', async () => {
    const nodeId = testNodeIds[0];
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        queryId: 'updateNode',
        params: { nodeId, name: 'Updated Cypher Node' },
      }),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.properties.name).toBe('Updated Cypher Node');
  });

  it('deletes a node', async () => {
    const createRes = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        queryId: 'createNode',
        params: { type: 'Temp', name: 'To Delete' },
      }),
    });
    const created = await createRes.json();
    const nodeId = created.data.id;

    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        queryId: 'deleteNode',
        params: { nodeId },
      }),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });
});

describe('POST /api/cypher - Relationship CRUD', () => {
  let startNodeId: string;
  let endNodeId: string;

  it('creates two nodes for relationship tests', async () => {
    const res1 = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        queryId: 'createNode',
        params: { type: 'Category', name: 'Electronics' },
      }),
    });
    const data1 = await res1.json();
    startNodeId = data1.data.id;
    testNodeIds.push(startNodeId);

    const res2 = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        queryId: 'createNode',
        params: { type: 'Product', name: 'Laptop' },
      }),
    });
    const data2 = await res2.json();
    endNodeId = data2.data.id;
    testNodeIds.push(endNodeId);
  });

  it('creates a relationship', async () => {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        queryId: 'createRelationship',
        params: {
          startNodeId: endNodeId,
          endNodeId: startNodeId,
          type: 'BELONGS_TO',
          properties: { since: '2024-01-01' },
        },
      }),
    });
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.type).toBe('BELONGS_TO');
    expect(data.data.properties.since).toBe('2024-01-01');
    testRelIds.push(data.data.id);
  });

  it('gets a relationship by ID', async () => {
    const relId = testRelIds[0];
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        queryId: 'getRelationship',
        params: { relId },
      }),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.id).toBe(relId);
  });

  it('updates a relationship', async () => {
    const relId = testRelIds[0];
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        queryId: 'updateRelationship',
        params: {
          relId,
          properties: { since: '2025-01-01', priority: 'high' },
        },
      }),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.properties.since).toBe('2025-01-01');
    expect(data.data.properties.priority).toBe('high');
  });

  it('deletes a relationship', async () => {
    const createRelRes = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        queryId: 'createRelationship',
        params: {
          startNodeId: endNodeId,
          endNodeId: startNodeId,
          type: 'TEMP_REL',
        },
      }),
    });
    const created = await createRelRes.json();
    const relId = created.data.id;

    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        queryId: 'deleteRelationship',
        params: { relId },
      }),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });
});
