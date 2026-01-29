import { NextResponse } from 'next/server';
import { getPostgresPool } from '@/lib/postgres';

type Params = Promise<{ id: string }>;

export async function PUT(request: Request, { params }: { params: Params }) {
  const pool = getPostgresPool();
  const { id } = await params;

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
        const categoryFields = [];
        const categoryValues = [];
        let categoryIndex = 1;

        if (data.name !== undefined) {
          categoryFields.push(`name = $${categoryIndex++}`);
          categoryValues.push(data.name);
        }
        if (data.description !== undefined) {
          categoryFields.push(`description = $${categoryIndex++}`);
          categoryValues.push(data.description);
        }

        if (categoryFields.length === 0) {
          return NextResponse.json(
            { error: 'No fields to update' },
            { status: 400 }
          );
        }

        categoryValues.push(id);
        result = await pool.query(
          `UPDATE categories SET ${categoryFields.join(', ')} WHERE id = $${categoryIndex} RETURNING *`,
          categoryValues
        );
        break;

      case 'Product':
        const productFields = [];
        const productValues = [];
        let productIndex = 1;

        if (data.name !== undefined) {
          productFields.push(`name = $${productIndex++}`);
          productValues.push(data.name);
        }
        if (data.price !== undefined) {
          productFields.push(`price = $${productIndex++}`);
          productValues.push(data.price);
        }
        if (data.category_id !== undefined) {
          productFields.push(`category_id = $${productIndex++}`);
          productValues.push(data.category_id);
        }

        if (productFields.length === 0) {
          return NextResponse.json(
            { error: 'No fields to update' },
            { status: 400 }
          );
        }

        productValues.push(id);
        result = await pool.query(
          `UPDATE products SET ${productFields.join(', ')} WHERE id = $${productIndex} RETURNING *`,
          productValues
        );
        break;

      case 'Customer':
        const customerFields = [];
        const customerValues = [];
        let customerIndex = 1;

        if (data.name !== undefined) {
          customerFields.push(`name = $${customerIndex++}`);
          customerValues.push(data.name);
        }
        if (data.email !== undefined) {
          customerFields.push(`email = $${customerIndex++}`);
          customerValues.push(data.email);
        }

        if (customerFields.length === 0) {
          return NextResponse.json(
            { error: 'No fields to update' },
            { status: 400 }
          );
        }

        customerValues.push(id);
        result = await pool.query(
          `UPDATE customers SET ${customerFields.join(', ')} WHERE id = $${customerIndex} RETURNING *`,
          customerValues
        );
        break;

      case 'Order':
        const orderFields = [];
        const orderValues = [];
        let orderIndex = 1;

        if (data.customer_id !== undefined) {
          orderFields.push(`customer_id = $${orderIndex++}`);
          orderValues.push(data.customer_id);
        }
        if (data.total !== undefined) {
          orderFields.push(`total = $${orderIndex++}`);
          orderValues.push(data.total);
        }

        if (orderFields.length === 0) {
          return NextResponse.json(
            { error: 'No fields to update' },
            { status: 400 }
          );
        }

        orderValues.push(id);
        result = await pool.query(
          `UPDATE orders SET ${orderFields.join(', ')} WHERE id = $${orderIndex} RETURNING *`,
          orderValues
        );
        break;

      default:
        return NextResponse.json(
          { error: `Unknown node type: ${type}` },
          { status: 400 }
        );
    }

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Node not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error updating node:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update node' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: { params: Params }) {
  const pool = getPostgresPool();
  const { id } = await params;

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (!type) {
      return NextResponse.json(
        { error: 'Node type is required (query parameter: type)' },
        { status: 400 }
      );
    }

    let result;
    switch (type) {
      case 'Category':
        result = await pool.query('DELETE FROM categories WHERE id = $1 RETURNING id', [id]);
        break;
      case 'Product':
        result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING id', [id]);
        break;
      case 'Customer':
        result = await pool.query('DELETE FROM customers WHERE id = $1 RETURNING id', [id]);
        break;
      case 'Order':
        result = await pool.query('DELETE FROM orders WHERE id = $1 RETURNING id', [id]);
        break;
      default:
        return NextResponse.json(
          { error: `Unknown node type: ${type}` },
          { status: 400 }
        );
    }

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Node not found' },
        { status: 404 }
      );
    }

    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    console.error('Error deleting node:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete node' },
      { status: 500 }
    );
  }
}
