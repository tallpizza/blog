import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getPostgresPool } from '@/lib/postgres';

let testProductId: number;

describe('POST /api/nodes', () => {
  afterAll(async () => {
    if (testProductId) {
      const pool = getPostgresPool();
      await pool.query('DELETE FROM products WHERE id = $1', [testProductId]);
    }
  });

  it('returns 400 when type is missing', async () => {
    const res = await fetch('http://localhost:3000/api/nodes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test' }),
    });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data).toHaveProperty('error');
  });

  it('returns 400 when required fields are missing', async () => {
    const res = await fetch('http://localhost:3000/api/nodes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'Product' }),
    });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data).toHaveProperty('error');
  });

  it('creates a Product node successfully', async () => {
    const res = await fetch('http://localhost:3000/api/nodes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'Product',
        name: 'API Test Product',
        price: 99.99,
        category_id: 1,
      }),
    });
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data).toHaveProperty('id');
    expect(data.name).toBe('API Test Product');
    expect(data.price).toBe('99.99');
    testProductId = data.id;
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
    expect(data.description).toBe('Test description');

    const pool = getPostgresPool();
    await pool.query('DELETE FROM categories WHERE id = $1', [data.id]);
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
    expect(data.email).toBe(email);

    const pool = getPostgresPool();
    await pool.query('DELETE FROM customers WHERE id = $1', [data.id]);
  });
});
