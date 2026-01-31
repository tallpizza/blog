import { NextResponse } from 'next/server';
import { getNeo4jDriver } from '@/lib/neo4j';
import { Integer } from 'neo4j-driver';

type Params = Promise<{ id: string }>;

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

export async function PUT(request: Request, { params }: { params: Params }) {
  const driver = getNeo4jDriver();
  const session = driver.session();
  const { id } = await params;

  try {
    const body = await request.json();
    const { addLabel, ...data } = body;

    const updateFields = Object.entries(data)
      .filter(([_, value]) => value !== undefined)
      .map(([key, _]) => `n.${key} = $${key}`)
      .join(', ');

    const setProps = updateFields ? `SET ${updateFields}` : '';
    const setLabel = addLabel ? `SET n:\`${addLabel}\`` : '';

    if (!setProps && !setLabel) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    const cypher = `
      MATCH (n)
      WHERE elementId(n) = $nodeId
      ${setLabel}
      ${setProps}
      RETURN n, elementId(n) as nodeId, labels(n) as labels
    `;

    const result = await session.run(cypher, { ...data, nodeId: id });

    if (result.records.length === 0) {
      return NextResponse.json(
        { error: 'Node not found' },
        { status: 404 }
      );
    }

    const record = result.records[0];
    const node = record.get('n');

    const response = {
      id: record.get('nodeId'),
      labels: record.get('labels'),
      properties: toNativeTypes(node.properties)
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error updating node:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update node' },
      { status: 500 }
    );
  } finally {
    await session.close();
  }
}

export async function DELETE(request: Request, { params }: { params: Params }) {
  const driver = getNeo4jDriver();
  const session = driver.session();
  const { id } = await params;

  try {
    const checkCypher = `
      MATCH (n)
      WHERE elementId(n) = $nodeId
      RETURN n
    `;
    
    const checkResult = await session.run(checkCypher, { nodeId: id });
    
    if (checkResult.records.length === 0) {
      return NextResponse.json(
        { error: 'Node not found' },
        { status: 404 }
      );
    }

    const deleteCypher = `
      MATCH (n)
      WHERE elementId(n) = $nodeId
      DETACH DELETE n
    `;

    await session.run(deleteCypher, { nodeId: id });

    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    console.error('Error deleting node:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete node' },
      { status: 500 }
    );
  } finally {
    await session.close();
  }
}
