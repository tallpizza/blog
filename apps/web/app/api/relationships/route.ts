import { NextResponse } from 'next/server';
import { getPostgresPool } from '@/lib/postgres';

export async function POST(request: Request) {
  const pool = getPostgresPool();

  try {
    const body = await request.json();
    const { order_id, product_id, quantity, price } = body;

    if (!order_id || !product_id || !quantity || !price) {
      return NextResponse.json(
        { error: 'order_id, product_id, quantity, and price are required' },
        { status: 400 }
      );
    }

    const result = await pool.query(
      'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4) RETURNING *',
      [order_id, product_id, quantity, price]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error: any) {
    console.error('Error creating relationship:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create relationship' },
      { status: 500 }
    );
  }
}
