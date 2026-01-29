import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getPostgresPool } from '@/lib/postgres';

let testOrderItemId: number;

describe('POST /api/relationships', () => {
  afterAll(async () => {
    if (testOrderItemId) {
      const pool = getPostgresPool();
      await pool.query('DELETE FROM order_items WHERE id = $1', [testOrderItemId]);
    }
  });

  it('returns 400 when required fields are missing', async () => {
    const res = await fetch('http://localhost:3000/api/relationships', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_id: 1 }),
    });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data).toHaveProperty('error');
  });

  it('creates an order_item relationship successfully', async () => {
    const res = await fetch('http://localhost:3000/api/relationships', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order_id: 1,
        product_id: 1,
        quantity: 2,
        price: 49.99,
      }),
    });
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data).toHaveProperty('id');
    expect(data.order_id).toBe(1);
    expect(data.product_id).toBe(1);
    expect(data.quantity).toBe(2);
    expect(data.price).toBe('49.99');
    testOrderItemId = data.id;
  });

  it('returns 500 when foreign key constraint fails', async () => {
    const res = await fetch('http://localhost:3000/api/relationships', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order_id: 999999,
        product_id: 1,
        quantity: 1,
        price: 10.00,
      }),
    });
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data).toHaveProperty('error');
  });
});
