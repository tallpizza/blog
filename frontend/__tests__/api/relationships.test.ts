import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getNeo4jDriver } from '@/lib/neo4j';

let testNodeIds: string[] = [];
let testRelId: string;

describe('POST /api/relationships', () => {
  beforeAll(async () => {
    const driver = getNeo4jDriver();
    const session = driver.session();
    try {
      const result = await session.run(`
        CREATE (a:Order {name: 'Test Order'})
        CREATE (b:Product {name: 'Test Product'})
        RETURN elementId(a) as orderId, elementId(b) as productId
      `);
      testNodeIds.push(result.records[0].get('orderId'));
      testNodeIds.push(result.records[0].get('productId'));
    } finally {
      await session.close();
    }
  });

  afterAll(async () => {
    const driver = getNeo4jDriver();
    const session = driver.session();
    try {
      if (testRelId) {
        await session.run('MATCH ()-[r]->() WHERE elementId(r) = $id DELETE r', { id: testRelId });
      }
      if (testNodeIds.length > 0) {
        await session.run('MATCH (n) WHERE elementId(n) IN $ids DETACH DELETE n', { ids: testNodeIds });
      }
    } finally {
      await session.close();
    }
  });

  it('returns 400 when required fields are missing', async () => {
    const res = await fetch('http://localhost:3000/api/relationships', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ startNodeId: testNodeIds[0] }),
    });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data).toHaveProperty('error');
  });

  it('creates a relationship successfully', async () => {
    const res = await fetch('http://localhost:3000/api/relationships', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        startNodeId: testNodeIds[0],
        endNodeId: testNodeIds[1],
        type: 'CONTAINS',
        properties: {
          quantity: 2,
          price: 49.99,
        },
      }),
    });
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data).toHaveProperty('id');
    expect(data.type).toBe('CONTAINS');
    expect(data.startNode).toBe(testNodeIds[0]);
    expect(data.endNode).toBe(testNodeIds[1]);
    testRelId = data.id;
  });

  it('returns 404 when nodes do not exist', async () => {
    const fakeId1 = '4:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx:999999999';
    const fakeId2 = '4:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx:999999998';
    const res = await fetch('http://localhost:3000/api/relationships', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        startNodeId: fakeId1,
        endNodeId: fakeId2,
        type: 'CONTAINS',
      }),
    });
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data).toHaveProperty('error');
  });
});

describe('PUT /api/relationships/:id', () => {
  let testNodeIds: string[] = [];
  let testRelId: string;

  beforeAll(async () => {
    const driver = getNeo4jDriver();
    const session = driver.session();
    try {
      const result = await session.run(`
        CREATE (a:Order {name: 'Test Order PUT'})
        CREATE (b:Product {name: 'Test Product PUT'})
        CREATE (a)-[r:CONTAINS {quantity: 1, note: 'initial'}]->(b)
        RETURN elementId(a) as orderId, elementId(b) as productId, elementId(r) as relId
      `);
      testNodeIds.push(result.records[0].get('orderId'));
      testNodeIds.push(result.records[0].get('productId'));
      testRelId = result.records[0].get('relId');
    } finally {
      await session.close();
    }
  });

  afterAll(async () => {
    const driver = getNeo4jDriver();
    const session = driver.session();
    try {
      if (testNodeIds.length > 0) {
        await session.run('MATCH (n) WHERE elementId(n) IN $ids DETACH DELETE n', { ids: testNodeIds });
      }
    } finally {
      await session.close();
    }
  });

  it('updates relationship properties', async () => {
    const res = await fetch(`http://localhost:3000/api/relationships/${encodeURIComponent(testRelId)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        properties: {
          quantity: 5,
          note: 'updated',
          newProp: 'added',
        },
      }),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.properties.quantity).toBe(5);
    expect(data.properties.note).toBe('updated');
    expect(data.properties.newProp).toBe('added');
  });

  it('returns 404 for non-existent relationship', async () => {
    const fakeId = '5:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx:999999999';
    const res = await fetch(`http://localhost:3000/api/relationships/${encodeURIComponent(fakeId)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        properties: { test: 'value' },
      }),
    });
    expect(res.status).toBe(404);
  });

  it('returns 400 when no valid properties provided', async () => {
    const res = await fetch(`http://localhost:3000/api/relationships/${encodeURIComponent(testRelId)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        properties: {},
      }),
    });
    expect(res.status).toBe(400);
  });
});
