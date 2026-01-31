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
    const { startNodeId, endNodeId, type, properties = {} } = body;

    if (!startNodeId || !endNodeId || !type) {
      return NextResponse.json(
        { error: 'startNodeId, endNodeId, and type are required' },
        { status: 400 }
      );
    }

    const propEntries = Object.entries(properties)
      .filter(([_, value]) => value !== undefined && value !== null)
      .map(([key, _]) => `${key}: $props.${key}`)
      .join(', ');

    const propString = propEntries ? `{${propEntries}}` : '';

    const cypher = `
      MATCH (start), (end)
      WHERE elementId(start) = $startNodeId AND elementId(end) = $endNodeId
      CREATE (start)-[r:${type} ${propString}]->(end)
      RETURN r, elementId(r) as relId, type(r) as relType, elementId(startNode(r)) as startNode, elementId(endNode(r)) as endNode
    `;

    const result = await session.run(cypher, {
      startNodeId: String(startNodeId),
      endNodeId: String(endNodeId),
      props: properties
    });

    if (result.records.length === 0) {
      return NextResponse.json(
        { error: 'Failed to create relationship - nodes not found' },
        { status: 404 }
      );
    }

    const record = result.records[0];
    const rel = record.get('r');

    const response = {
      id: record.get('relId'),
      type: record.get('relType'),
      startNode: record.get('startNode'),
      endNode: record.get('endNode'),
      properties: toNativeTypes(rel.properties)
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error: any) {
    console.error('Error creating relationship:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create relationship' },
      { status: 500 }
    );
  } finally {
    await session.close();
  }
}
