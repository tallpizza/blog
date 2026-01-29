import { describe, it, expect, beforeAll } from 'vitest';
import { getPostgresPool } from '@/lib/postgres';

describe('DELETE /api/relationships/:id', () => {
  let deleteTestId: number;

  beforeAll(async () => {
    const pool = getPostgresPool();
    const result = await pool.query(
      'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4) RETURNING id',
      [1, 1, 1, 10.00]
    );
    deleteTestId = result.rows[0].id;
  });

  it('deletes an order_item relationship successfully', async () => {
    const res = await fetch(`http://localhost:3000/api/relationships/${deleteTestId}`, {
      method: 'DELETE',
    });
    expect(res.status).toBe(204);

    const pool = getPostgresPool();
    const result = await pool.query('SELECT * FROM order_items WHERE id = $1', [deleteTestId]);
    expect(result.rows.length).toBe(0);
  });

  it('returns 404 when relationship does not exist', async () => {
    const res = await fetch('http://localhost:3000/api/relationships/999999', {
      method: 'DELETE',
    });
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data).toHaveProperty('error');
  });
});
