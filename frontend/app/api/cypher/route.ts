import { NextResponse } from 'next/server';
import { getNeo4jDriver } from '@/lib/neo4j';
import { getQueryDefinition, listQueries } from '@/lib/cypher-registry';

export async function GET() {
  const queries = listQueries();
  return NextResponse.json({ queries });
}

export async function POST(request: Request) {
  const driver = getNeo4jDriver();
  const session = driver.session();

  try {
    const body = await request.json();
    const { queryId, params = {} } = body as { queryId: string; params?: Record<string, unknown> };

    if (!queryId) {
      return NextResponse.json(
        { success: false, error: 'queryId is required' },
        { status: 400 }
      );
    }

    const queryDef = getQueryDefinition(queryId);
    if (!queryDef) {
      return NextResponse.json(
        { success: false, error: `Unknown queryId: ${queryId}` },
        { status: 400 }
      );
    }

    if (!queryDef.validate(params)) {
      return NextResponse.json(
        { success: false, error: 'Invalid parameters for this query' },
        { status: 400 }
      );
    }

    const cypher = typeof queryDef.cypher === 'function' 
      ? queryDef.cypher(params) 
      : queryDef.cypher;

    const result = await session.run(cypher, params);
    
    const records = result.records.map(record => {
      const obj: Record<string, unknown> = {};
      for (const key of record.keys) {
        if (typeof key === 'string') {
          obj[key] = record.get(key);
        }
      }
      return obj;
    });

    const data = queryDef.transform(records);

    if (data === null && ['getNode', 'getRelationship'].includes(queryId)) {
      return NextResponse.json(
        { success: false, error: 'Not found' },
        { status: 404 }
      );
    }

    if (data === null && ['updateNode', 'updateRelationship'].includes(queryId)) {
      return NextResponse.json(
        { success: false, error: 'Not found' },
        { status: 404 }
      );
    }

    if (data === null && queryId === 'createRelationship') {
      return NextResponse.json(
        { success: false, error: 'Failed to create relationship - nodes not found' },
        { status: 404 }
      );
    }

    const status = queryId === 'createNode' || queryId === 'createRelationship' ? 201 : 200;

    return NextResponse.json({ success: true, data }, { status });
  } catch (error) {
    console.error('Error executing query:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Query execution failed' },
      { status: 500 }
    );
  } finally {
    await session.close();
  }
}
