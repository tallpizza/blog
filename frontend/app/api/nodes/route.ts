import { NextResponse } from 'next/server';
import { getPostgresPool } from '@/lib/postgres';

export async function POST(request: Request) {
  const pool = getPostgresPool();

  try {
    const body = await request.json();
    const { type, ...data } = body;

    if (!type) {
      return NextResponse.json(
        { error: 'Node type is required' },
        { status: 400 }
      );
    }

    let result;
    switch (type) {
      case 'Category':
        if (!data.name) {
          return NextResponse.json(
            { error: 'Category name is required' },
            { status: 400 }
          );
        }
        result = await pool.query(
          'INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING *',
          [data.name, data.description || null]
        );
        break;

      case 'Product':
        if (!data.name || !data.price || !data.category_id) {
          return NextResponse.json(
            { error: 'Product name, price, and category_id are required' },
            { status: 400 }
          );
        }
        result = await pool.query(
          'INSERT INTO products (name, price, category_id) VALUES ($1, $2, $3) RETURNING *',
          [data.name, data.price, data.category_id]
        );
        break;

      case 'Customer':
        if (!data.name || !data.email) {
          return NextResponse.json(
            { error: 'Customer name and email are required' },
            { status: 400 }
          );
        }
        result = await pool.query(
          'INSERT INTO customers (name, email) VALUES ($1, $2) RETURNING *',
          [data.name, data.email]
        );
        break;

      case 'Order':
        if (!data.customer_id || !data.total) {
          return NextResponse.json(
            { error: 'Order customer_id and total are required' },
            { status: 400 }
          );
        }
        result = await pool.query(
          'INSERT INTO orders (customer_id, total) VALUES ($1, $2) RETURNING *',
          [data.customer_id, data.total]
        );
        break;

      default:
        return NextResponse.json(
          { error: `Unknown node type: ${type}` },
          { status: 400 }
        );
    }

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error: any) {
    console.error('Error creating node:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create node' },
      { status: 500 }
    );
  }
}
