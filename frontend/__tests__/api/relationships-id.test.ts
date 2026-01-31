import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getNeo4jDriver } from '@/lib/neo4j';

let testNodeIds: string[] = [];
let deleteTestId: string;

describe('DELETE /api/relationships/:id', () => {
  beforeAll(async () => {
    const driver = getNeo4jDriver();
    const session = driver.session();
    try {
      const result = await session.run(`
        CREATE (a:Order {name: 'Test Order for Delete'})
        CREATE (b:Product {name: 'Test Product for Delete'})
        CREATE (a)-[r:CONTAINS {quantity: 1}]->(b)
        RETURN elementId(a) as orderId, elementId(b) as productId, elementId(r) as relId
      `);
      testNodeIds.push(result.records[0].get('orderId'));
      testNodeIds.push(result.records[0].get('productId'));
      deleteTestId = result.records[0].get('relId');
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

  it('deletes a relationship successfully', async () => {
    const res = await fetch(`http://localhost:3000/api/relationships/${encodeURIComponent(deleteTestId)}`, {
      method: 'DELETE',
    });
    expect(res.status).toBe(204);

    const driver = getNeo4jDriver();
    const session = driver.session();
    try {
      const result = await session.run('MATCH ()-[r]->() WHERE elementId(r) = $id RETURN r', { id: deleteTestId });
      expect(result.records.length).toBe(0);
    } finally {
      await session.close();
    }
  });

  it('returns 404 when relationship does not exist', async () => {
    const fakeId = '5:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx:999999999';
    const res = await fetch(`http://localhost:3000/api/relationships/${encodeURIComponent(fakeId)}`, {
      method: 'DELETE',
    });
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data).toHaveProperty('error');
  });
});
