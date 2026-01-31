export async function setup() {
  await cleanupTestData()
}

export async function teardown() {
  await cleanupTestData()
}

async function cleanupTestData() {
  const neo4jModule = await import('./lib/neo4j').catch(() => null)
  if (!neo4jModule) return
  
  const driver = neo4jModule.getNeo4jDriver()
  const session = driver.session()
  
  try {
    await session.run(`
      MATCH (n)
      WHERE n.name STARTS WITH 'Test ' OR n.name = 'New Node'
      DETACH DELETE n
    `)
  } finally {
    await session.close()
  }
}
