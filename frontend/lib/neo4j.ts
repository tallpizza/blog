import neo4j, { Driver } from 'neo4j-driver';

let driver: Driver | null = null;

export function getNeo4jDriver(): Driver {
  if (!driver) {
    const uri = process.env.NEO4J_URI || 'bolt://localhost:7688';
    const user = process.env.NEO4J_USER || 'neo4j';
    const password = process.env.NEO4J_PASSWORD || 'neo4j_password';

    driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
  }

  return driver;
}

export async function closeNeo4jDriver(): Promise<void> {
  if (driver) {
    await driver.close();
    driver = null;
  }
}
