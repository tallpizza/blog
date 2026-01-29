import { describe, it, expect } from 'vitest';

describe('GET /api/graph', () => {
  it('returns 200 with nodes and relationships', async () => {
    const res = await fetch('http://localhost:3000/api/graph');
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty('nodes');
    expect(data).toHaveProperty('relationships');
    expect(Array.isArray(data.nodes)).toBe(true);
    expect(Array.isArray(data.relationships)).toBe(true);
  });

  it('returns at least 3 nodes from sample data', async () => {
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
    if (data.relationships.length > 0) {
      const rel = data.relationships[0];
      expect(rel).toHaveProperty('id');
      expect(rel).toHaveProperty('type');
      expect(rel).toHaveProperty('startNode');
      expect(rel).toHaveProperty('endNode');
    }
  });
});
