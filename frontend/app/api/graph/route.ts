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

export async function GET() {
  const driver = getNeo4jDriver();
  const session = driver.session();

  try {
    const result = await session.run(`
      MATCH (n)
      OPTIONAL MATCH (n)-[r]->(m)
      RETURN 
        collect(DISTINCT {
          id: elementId(n),
          labels: labels(n),
          properties: properties(n)
        }) as nodes,
        collect(DISTINCT {
          id: elementId(r),
          type: type(r),
          startNode: elementId(startNode(r)),
          endNode: elementId(endNode(r)),
          properties: properties(r)
        }) as relationships
    `);

    const record = result.records[0];
    const rawNodes = record.get('nodes').filter((n: any) => n.id !== null);
    const rawRelationships = record.get('relationships').filter((r: any) => r.id !== null);

    const nodes = toNativeTypes(rawNodes);
    const relationships = toNativeTypes(rawRelationships);

    return NextResponse.json({ nodes, relationships });
  } catch (error) {
    console.error('Error fetching graph data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch graph data' },
      { status: 500 }
    );
  } finally {
    await session.close();
  }
}
