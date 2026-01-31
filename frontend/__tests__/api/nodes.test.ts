import { describe, it, expect, afterAll } from 'vitest';
import { getNeo4jDriver } from '@/lib/neo4j';

let testNodeIds: string[] = [];

describe('POST /api/nodes', () => {
  afterAll(async () => {
    if (testNodeIds.length > 0) {
      const driver = getNeo4jDriver();
      const session = driver.session();
      try {
        await session.run(
          'MATCH (n) WHERE elementId(n) IN $ids DETACH DELETE n',
          { ids: testNodeIds }
        );
      } finally {
        await session.close();
      }
    }
  });

  it('creates a node without label', async () => {
    const res = await fetch('http://localhost:3000/api/nodes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test Node' }),
    });
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data).toHaveProperty('id');
    expect(data.labels).toEqual([]);
    expect(data.properties.name).toBe('Test Node');
    testNodeIds.push(data.id);
  });

  it('creates a Product node with label', async () => {
    const res = await fetch('http://localhost:3000/api/nodes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'Product',
        name: 'API Test Product',
        price: 99.99,
      }),
    });
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data).toHaveProperty('id');
    expect(data.labels).toContain('Product');
    expect(data.properties.name).toBe('API Test Product');
    testNodeIds.push(data.id);
  });

  it('creates a Category node successfully', async () => {
    const res = await fetch('http://localhost:3000/api/nodes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'Category',
        name: 'Test Category ' + Date.now(),
        description: 'Test description',
      }),
    });
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data).toHaveProperty('id');
    expect(data.labels).toContain('Category');
    expect(data.properties.description).toBe('Test description');
    testNodeIds.push(data.id);
  });

  it('creates a Customer node successfully', async () => {
    const email = `test${Date.now()}@example.com`;
    const res = await fetch('http://localhost:3000/api/nodes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'Customer',
        name: 'Test Customer',
        email,
      }),
    });
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data).toHaveProperty('id');
    expect(data.labels).toContain('Customer');
    expect(data.properties.email).toBe(email);
    testNodeIds.push(data.id);
  });
});
