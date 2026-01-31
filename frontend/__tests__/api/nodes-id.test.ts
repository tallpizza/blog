import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getNeo4jDriver } from '@/lib/neo4j';

let testProductId: string;

describe('PUT /api/nodes/:id', () => {
  beforeAll(async () => {
    const driver = getNeo4jDriver();
    const session = driver.session();
    try {
      const result = await session.run(
        'CREATE (p:Product {name: $name, price: $price}) RETURN elementId(p) as id',
        { name: 'Test Product for Update', price: 50.00 }
      );
      testProductId = result.records[0].get('id');
    } finally {
      await session.close();
    }
  });

  afterAll(async () => {
    if (testProductId) {
      const driver = getNeo4jDriver();
      const session = driver.session();
      try {
        await session.run('MATCH (n) WHERE elementId(n) = $id DETACH DELETE n', { id: testProductId });
      } finally {
        await session.close();
      }
    }
  });

  it('returns 400 when no fields to update', async () => {
    const res = await fetch(`http://localhost:3000/api/nodes/${encodeURIComponent(testProductId)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data).toHaveProperty('error');
  });

  it('updates a node successfully', async () => {
    const res = await fetch(`http://localhost:3000/api/nodes/${encodeURIComponent(testProductId)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Updated Product Name',
        price: 75.50,
      }),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.properties.name).toBe('Updated Product Name');
    expect(data.properties.price).toBe(75.50);
  });

  it('adds a label to node', async () => {
    const res = await fetch(`http://localhost:3000/api/nodes/${encodeURIComponent(testProductId)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        addLabel: 'Featured',
      }),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.labels).toContain('Featured');
  });

  it('returns 404 when node does not exist', async () => {
    const fakeId = '4:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx:999999999';
    const res = await fetch(`http://localhost:3000/api/nodes/${encodeURIComponent(fakeId)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Non-existent',
        price: 100,
      }),
    });
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data).toHaveProperty('error');
  });
});

describe('DELETE /api/nodes/:id', () => {
  let deleteTestId: string;

  beforeAll(async () => {
    const driver = getNeo4jDriver();
    const session = driver.session();
    try {
      const result = await session.run(
        'CREATE (p:Product {name: $name, price: $price}) RETURN elementId(p) as id',
        { name: 'Test Product for Delete', price: 25.00 }
      );
      deleteTestId = result.records[0].get('id');
    } finally {
      await session.close();
    }
  });

  it('deletes a node successfully', async () => {
    const res = await fetch(`http://localhost:3000/api/nodes/${encodeURIComponent(deleteTestId)}`, {
      method: 'DELETE',
    });
    expect(res.status).toBe(204);

    const driver = getNeo4jDriver();
    const session = driver.session();
    try {
      const result = await session.run('MATCH (n) WHERE elementId(n) = $id RETURN n', { id: deleteTestId });
      expect(result.records.length).toBe(0);
    } finally {
      await session.close();
    }
  });

  it('returns 404 when node does not exist', async () => {
    const fakeId = '4:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx:999999999';
    const res = await fetch(`http://localhost:3000/api/nodes/${encodeURIComponent(fakeId)}`, {
      method: 'DELETE',
    });
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data).toHaveProperty('error');
  });
});
