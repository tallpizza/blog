import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getPostgresPool } from '@/lib/postgres';

let testProductId: number;

describe('PUT /api/nodes/:id', () => {
  beforeAll(async () => {
    const pool = getPostgresPool();
    const result = await pool.query(
      'INSERT INTO products (name, price, category_id) VALUES ($1, $2, $3) RETURNING id',
      ['Test Product for Update', 50.00, 1]
    );
    testProductId = result.rows[0].id;
  });

  afterAll(async () => {
    if (testProductId) {
      const pool = getPostgresPool();
      await pool.query('DELETE FROM products WHERE id = $1', [testProductId]);
    }
  });

  it('returns 400 when type is missing', async () => {
    const res = await fetch(`http://localhost:3000/api/nodes/${testProductId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Updated' }),
    });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data).toHaveProperty('error');
  });

  it('updates a Product node successfully', async () => {
    const res = await fetch(`http://localhost:3000/api/nodes/${testProductId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'Product',
        name: 'Updated Product Name',
        price: 75.50,
      }),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.name).toBe('Updated Product Name');
    expect(data.price).toBe('75.50');
  });

  it('returns 404 when node does not exist', async () => {
    const res = await fetch('http://localhost:3000/api/nodes/999999', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'Product',
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
  let deleteTestId: number;

  beforeAll(async () => {
    const pool = getPostgresPool();
    const result = await pool.query(
      'INSERT INTO products (name, price, category_id) VALUES ($1, $2, $3) RETURNING id',
      ['Test Product for Delete', 25.00, 1]
    );
    deleteTestId = result.rows[0].id;
  });

  it('returns 400 when type is missing', async () => {
    const res = await fetch(`http://localhost:3000/api/nodes/${deleteTestId}`, {
      method: 'DELETE',
    });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data).toHaveProperty('error');
  });

  it('deletes a Product node successfully', async () => {
    const res = await fetch(`http://localhost:3000/api/nodes/${deleteTestId}?type=Product`, {
      method: 'DELETE',
    });
    expect(res.status).toBe(204);

    const pool = getPostgresPool();
    const result = await pool.query('SELECT * FROM products WHERE id = $1', [deleteTestId]);
    expect(result.rows.length).toBe(0);
  });

  it('returns 404 when node does not exist', async () => {
    const res = await fetch('http://localhost:3000/api/nodes/999999?type=Product', {
      method: 'DELETE',
    });
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data).toHaveProperty('error');
  });
});
