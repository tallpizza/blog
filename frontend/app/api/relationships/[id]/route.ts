import { NextResponse } from 'next/server';
import { getNeo4jDriver } from '@/lib/neo4j';
import { Integer } from 'neo4j-driver';

type Params = Promise<{ id: string }>;

function toNativeTypes(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (Integer.isInteger(obj)) return (obj as typeof Integer.prototype).toNumber();
  if (Array.isArray(obj)) return obj.map(toNativeTypes);
  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const key in obj) {
      result[key] = toNativeTypes((obj as Record<string, unknown>)[key]);
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
    const { properties = {} } = body;

    const checkCypher = `
      MATCH ()-[r]->()
      WHERE elementId(r) = $relId
      RETURN r
    `;
    
    const checkResult = await session.run(checkCypher, { relId: id });
    
    if (checkResult.records.length === 0) {
      return NextResponse.json(
        { error: 'Relationship not found' },
        { status: 404 }
      );
    }

    const propEntries = Object.entries(properties)
      .filter(([key]) => key !== 'id' && key !== 'type')
      .map(([key]) => `r.${key} = $props.${key}`)
      .join(', ');

    if (!propEntries) {
      return NextResponse.json(
        { error: 'No valid properties to update' },
        { status: 400 }
      );
    }

    const updateCypher = `
      MATCH ()-[r]->()
      WHERE elementId(r) = $relId
      SET ${propEntries}
      RETURN r, elementId(r) as relId, type(r) as relType, 
             elementId(startNode(r)) as startNode, elementId(endNode(r)) as endNode
    `;

    const result = await session.run(updateCypher, {
      relId: id,
      props: properties
    });

    const record = result.records[0];
    const rel = record.get('r');

    const response = {
      id: record.get('relId'),
      type: record.get('relType'),
      startNode: record.get('startNode'),
      endNode: record.get('endNode'),
      properties: toNativeTypes(rel.properties)
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating relationship:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update relationship' },
      { status: 500 }
    );
  } finally {
    await session.close();
  }
}

export async function DELETE(_request: Request, { params }: { params: Params }) {
  const driver = getNeo4jDriver();
  const session = driver.session();
  const { id } = await params;

  try {
    const checkCypher = `
      MATCH ()-[r]->()
      WHERE elementId(r) = $relId
      RETURN r
    `;
    
    const checkResult = await session.run(checkCypher, { relId: id });
    
    if (checkResult.records.length === 0) {
      return NextResponse.json(
        { error: 'Relationship not found' },
        { status: 404 }
      );
    }

    const deleteCypher = `
      MATCH ()-[r]->()
      WHERE elementId(r) = $relId
      DELETE r
    `;
    
    await session.run(deleteCypher, { relId: id });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting relationship:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete relationship' },
      { status: 500 }
    );
  } finally {
    await session.close();
  }
}
