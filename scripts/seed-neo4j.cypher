MERGE (c:Config)
SET c.labelColors = '{"Problem":"#EF4444","Idea":"#F59E0B","Solution":"#10B981"}'
RETURN c;

MERGE (p:Problem {text: '# 사용자 인증이 너무 복잡함\n\n현재 로그인 프로세스가 5단계나 필요함'})
MERGE (i:Idea {text: '# OAuth 소셜 로그인 도입\n\n구글, 카카오 로그인으로 간소화'})
MERGE (s:Solution {text: '# NextAuth.js 적용\n\n소셜 로그인 + 세션 관리 통합'})
RETURN p, i, s;

MATCH (p:Problem), (i:Idea), (s:Solution)
WHERE p.text STARTS WITH '# 사용자' AND i.text STARTS WITH '# OAuth' AND s.text STARTS WITH '# NextAuth'
MERGE (p)-[:INSPIRES]->(i)
MERGE (i)-[:LEADS_TO]->(s)
MERGE (s)-[:SOLVES]->(p)
RETURN p, i, s;
