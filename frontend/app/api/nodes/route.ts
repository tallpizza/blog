import { NextResponse } from 'next/server';
import { getNeo4jDriver } from '@/lib/neo4j';
import { Integer } from 'neo4j-driver';

function toNativeTypes(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (Integer.isInteger(obj)) return obj.toNumber();
  if (Array.isArray(obj)) return obj.map(toNativeTypes);
  if (typeof obj === 'object') {
    const result: any = {};
    for (const key in obj) {
      result[key] = toNativeTypes(obj[key]);
    }
    return result;
  }
  return obj;
}

export async function POST(request: Request) {
  const driver = getNeo4jDriver();
  const session = driver.session();

  try {
    const body = await request.json();
    const { type, ...data } = body;

    const properties = Object.entries(data)
      .filter(([_, value]) => value !== undefined && value !== null)
      .map(([key, _]) => `${key}: $${key}`)
      .join(', ');

    const propsClause = properties ? `{${properties}}` : '';
    const labelClause = type ? `:${type}` : '';

    const cypher = `
      CREATE (n${labelClause} ${propsClause})
      RETURN n, elementId(n) as nodeId, labels(n) as labels
    `;

    const result = await session.run(cypher, data);
    
    if (result.records.length === 0) {
      return NextResponse.json(
        { error: 'Failed to create node' },
        { status: 500 }
      );
    }

    const record = result.records[0];
    const node = record.get('n');
    
    const response = {
      id: record.get('nodeId'),
      labels: record.get('labels'),
      properties: toNativeTypes(node.properties)
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error: any) {
    console.error('Error creating node:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create node' },
      { status: 500 }
    );
  } finally {
    await session.close();
  }
}
