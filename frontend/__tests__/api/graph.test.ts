import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getNeo4jDriver } from '@/lib/neo4j';

let testNodeIds: string[] = [];

describe('GET /api/graph', () => {
  beforeAll(async () => {
    const driver = getNeo4jDriver();
    const session = driver.session();
    try {
      const result = await session.run(`
        CREATE (c:Category {name: 'Test Category'})
        CREATE (p1:Product {name: 'Product 1', price: 100})
        CREATE (p2:Product {name: 'Product 2', price: 200})
        CREATE (p1)-[:BELONGS_TO]->(c)
        CREATE (p2)-[:BELONGS_TO]->(c)
        RETURN elementId(c) as cId, elementId(p1) as p1Id, elementId(p2) as p2Id
      `);
      testNodeIds.push(result.records[0].get('cId'));
      testNodeIds.push(result.records[0].get('p1Id'));
      testNodeIds.push(result.records[0].get('p2Id'));
    } finally {
      await session.close();
    }
  });

  afterAll(async () => {
    const driver = getNeo4jDriver();
    const session = driver.session();
    try {
      await session.run('MATCH (n) WHERE elementId(n) IN $ids DETACH DELETE n', { ids: testNodeIds });
    } finally {
      await session.close();
    }
  });

  it('returns 200 with nodes and relationships', async () => {
    const res = await fetch('http://localhost:3000/api/graph');
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty('nodes');
    expect(data).toHaveProperty('relationships');
    expect(Array.isArray(data.nodes)).toBe(true);
    expect(Array.isArray(data.relationships)).toBe(true);
  });

  it('returns at least 3 nodes from test data', async () => {
    const res = await fetch('http://localhost:3000/api/graph');
    const data = await res.json();
    expect(data.nodes.length).toBeGreaterThanOrEqual(3);
  });

  it('nodes have required properties (id, labels, properties)', async () => {
    const res = await fetch('http://localhost:3000/api/graph');
    const data = await res.json();
    const node = data.nodes[0];
    expect(node).toHaveProperty('id');
    expect(node).toHaveProperty('labels');
    expect(node).toHaveProperty('properties');
    expect(Array.isArray(node.labels)).toBe(true);
  });

  it('relationships have required properties (id, type, startNode, endNode)', async () => {
    const res = await fetch('http://localhost:3000/api/graph');
    const data = await res.json();
    expect(data.relationships.length).toBeGreaterThan(0);
    const rel = data.relationships[0];
    expect(rel).toHaveProperty('id');
    expect(rel).toHaveProperty('type');
    expect(rel).toHaveProperty('startNode');
    expect(rel).toHaveProperty('endNode');
  });
});
