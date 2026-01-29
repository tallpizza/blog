import { NextResponse } from 'next/server';
import { getPostgresPool } from '@/lib/postgres';

type Params = Promise<{ id: string }>;

export async function DELETE(_request: Request, { params }: { params: Params }) {
  const pool = getPostgresPool();
  const { id } = await params;

  try {
    const result = await pool.query(
      'DELETE FROM order_items WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Relationship not found' },
        { status: 404 }
      );
    }

    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    console.error('Error deleting relationship:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete relationship' },
      { status: 500 }
    );
  }
}
