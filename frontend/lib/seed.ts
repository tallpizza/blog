import { getNeo4jDriver } from './neo4j';

const DEFAULT_LABEL_COLORS = {
  Problem: '#EF4444',
  Idea: '#F59E0B',
  Solution: '#10B981',
};

const SAMPLE_NODES = [
  { label: 'Problem', text: '# 사용자 인증이 너무 복잡함\n\n현재 로그인 프로세스가 5단계나 필요함' },
  { label: 'Idea', text: '# OAuth 소셜 로그인 도입\n\n구글, 카카오 로그인으로 간소화' },
  { label: 'Solution', text: '# NextAuth.js 적용\n\n소셜 로그인 + 세션 관리 통합' },
];

export async function seedDatabase() {
  const driver = getNeo4jDriver();
  const session = driver.session();

  try {
    const configResult = await session.run('MATCH (c:Config) RETURN c LIMIT 1');
    if (configResult.records.length > 0) {
      console.log('[Seed] Database already seeded, skipping...');
      return;
    }

    console.log('[Seed] Seeding database...');

    await session.run(
      'MERGE (c:Config) SET c.labelColors = $colors RETURN c',
      { colors: JSON.stringify(DEFAULT_LABEL_COLORS) }
    );

    for (const node of SAMPLE_NODES) {
      await session.run(
        `MERGE (n:${node.label} {text: $text}) RETURN n`,
        { text: node.text }
      );
    }

    await session.run(`
      MATCH (p:Problem {text: $pText})
      MATCH (i:Idea {text: $iText})
      MATCH (s:Solution {text: $sText})
      MERGE (p)-[:INSPIRES]->(i)
      MERGE (i)-[:LEADS_TO]->(s)
      MERGE (s)-[:SOLVES]->(p)
    `, {
      pText: SAMPLE_NODES[0].text,
      iText: SAMPLE_NODES[1].text,
      sText: SAMPLE_NODES[2].text,
    });

    console.log('[Seed] Database seeded successfully');
  } catch (error) {
    console.error('[Seed] Failed to seed database:', error);
  } finally {
    await session.close();
  }
}
