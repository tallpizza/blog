# Graph Admin with PostgreSQL/Neo4j CDC

## TL;DR

> **Quick Summary**: PostgreSQL을 SOT로 하여 CDC를 통해 Neo4j와 동기화하고, 비기술자 관리자가 GUI로 그래프 데이터를 관리할 수 있는 시스템 구축
> 
> **Deliverables**: 
> - Docker Compose 기반 인프라 (PostgreSQL, Neo4j 5.x, Redpanda, Kafka Connect)
> - PostgreSQL → Redpanda → Neo4j CDC 파이프라인
> - Neo4j → Redpanda CDC 파이프라인 (모니터링용)
> - Next.js Graph Admin UI (노드/관계 CRUD, 드래그-투-링크)
> - CDC 이벤트 뷰어 (Redpanda Console + 커스텀 페이지)
> 
> **Estimated Effort**: Large (2-3 weeks)
> **Parallel Execution**: YES - 3 waves
> **Critical Path**: Infrastructure → CDC Pipeline → UI

---

## Context

### Original Request
PostgreSQL CDC로 Neo4j 직접 업데이트 겸 Neo4j CDC 이벤트 확인하는 시스템 구축:
1. GUI에서 Cypher/APOC 없이 그래프 데이터 검색/수정
2. PostgreSQL이 SOT, CDC로 Neo4j 동기화
3. Neo4j Streams CDC 테스트
4. Redpanda로 양방향 CDC 이벤트 적재 및 뷰어 UI

### Interview Summary
**Key Discussions**:
- **Frontend**: Next.js + React
- **CDC Pipeline**: Debezium + Redpanda (Kafka Connect)
- **Graph Visualization**: NVL vs React Flow 평가 후 선택
- **Deployment**: Docker Compose (로컬/개발)
- **CRUD Scope**: 노드 + 관계 모두 (드래그-투-링크 포함)
- **Example Domain**: E-commerce (제품/카테고리/주문)
- **Auth**: 불필요 (내부 도구)
- **Test Strategy**: TDD
- **Consistency**: Eventual + Frontend Optimistic Update

**Research Findings**:
- @neo4j-nvl/react: InteractiveNvlWrapper + DrawInteraction으로 드래그-투-링크 가능
- Debezium + Redpanda: 완벽 호환 (Kafka API 100%)
- Neo4j Connector for Kafka: Source(CDC) + Sink 모두 지원
- APOC 플러그인: Delete 처리에 필요 (DETACH DELETE)
- Neo4j CDC: 5.x+ 필요, db.cdc.mode=FULL 설정

### Metis Review
**Identified Gaps** (addressed):
- PostgreSQL 스키마 정의 필요 → E-commerce 5개 테이블로 확정
- Graph 모델 매핑 전략 → 1:1 테이블-레이블 매핑
- 일관성 모델 → Eventual + Optimistic Update
- NVL vs React Flow 결정 시점 → Phase 2에서 spike 평가 후 결정

---

## Work Objectives

### Core Objective
비기술자 관리자가 Cypher 없이 GUI로 그래프 데이터를 CRUD하고, PostgreSQL(SOT) → Neo4j 동기화를 CDC로 자동화하며, 양방향 CDC 이벤트를 모니터링할 수 있는 시스템 구축

### Concrete Deliverables
- `docker-compose.yml`: PostgreSQL, Neo4j 5.x (APOC 포함), Redpanda, Kafka Connect
- `init.sql`: E-commerce 스키마 (products, categories, orders, order_items, customers)
- `connectors/`: Debezium PostgreSQL Source + Neo4j Sink + Neo4j Source 설정
- `apps/web/`: Next.js Graph Admin UI
- TDD 테스트 코드

### Definition of Done
- [ ] `docker compose up -d` 후 모든 서비스 healthy
- [ ] PostgreSQL INSERT → 5초 내 Neo4j에 반영
- [ ] Neo4j 변경 → Redpanda 토픽에 이벤트 발행
- [ ] UI에서 노드 생성/수정/삭제 가능
- [ ] UI에서 드래그-투-링크로 관계 생성 가능
- [ ] 모든 TDD 테스트 통과

### Must Have
- PostgreSQL logical replication 설정 (wal_level=logical)
- Neo4j 5.x + APOC 플러그인
- Redpanda Console 접근 가능
- 노드/관계 CRUD 기능
- CDC 이벤트 뷰어 (Redpanda Console + 커스텀 페이지)

### Must NOT Have (Guardrails)
- 프로덕션 배포 (K8s, 클라우드)
- 인증/권한 관리
- 복잡한 그래프 알고리즘 (최단 경로, 클러스터링)
- "Generic" 추상화 - E-commerce 도메인에 특화
- 캐싱 레이어, 재시도 메커니즘, Dead Letter Queue
- 고급 검색/필터 (기본 노드 목록 외)

---

## Verification Strategy (MANDATORY)

### Test Decision
- **Infrastructure exists**: NO (새 프로젝트)
- **User wants tests**: TDD
- **Framework**: Vitest (Next.js), Playwright (E2E)

### TDD Workflow
각 TODO는 RED-GREEN-REFACTOR 패턴 따름:
1. **RED**: 실패하는 테스트 먼저 작성
2. **GREEN**: 테스트 통과하는 최소 코드 구현
3. **REFACTOR**: 코드 정리하며 테스트 유지

### Test Setup Task (Phase 1)
- Install: `bun add -d vitest @testing-library/react playwright`
- Config: `vitest.config.ts`, `playwright.config.ts`
- Verify: `bun test` → 예제 테스트 통과

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately):
├── Task 1: Docker Compose 인프라 구성
├── Task 2: PostgreSQL 스키마 및 초기 데이터
└── Task 3: 테스트 인프라 설정

Wave 2 (After Wave 1):
├── Task 4: Debezium PostgreSQL Source 커넥터
├── Task 5: Neo4j Sink 커넥터
├── Task 6: Neo4j CDC Source 커넥터
└── Task 7: 그래프 라이브러리 평가 (Spike)

Wave 3 (After Wave 2):
├── Task 8: Next.js 프로젝트 및 API 설정
├── Task 9: 그래프 시각화 컴포넌트
├── Task 10: 노드 CRUD UI
├── Task 11: 관계 CRUD UI (드래그-투-링크)
└── Task 12: CDC 이벤트 뷰어

Wave 4 (Final):
└── Task 13: E2E 테스트 및 통합 검증

Critical Path: Task 1 → Task 4,5 → Task 8 → Task 9,10,11 → Task 13
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1 | None | 4, 5, 6, 7 | 2, 3 |
| 2 | None | 4, 5 | 1, 3 |
| 3 | None | 8 | 1, 2 |
| 4 | 1, 2 | 8, 13 | 5, 6, 7 |
| 5 | 1, 2 | 8, 13 | 4, 6, 7 |
| 6 | 1 | 12, 13 | 4, 5, 7 |
| 7 | 1 | 9 | 4, 5, 6 |
| 8 | 3, 4, 5 | 9, 10, 11, 12 | None |
| 9 | 7, 8 | 10, 11, 13 | None |
| 10 | 9 | 13 | 11 |
| 11 | 9 | 13 | 10 |
| 12 | 6, 8 | 13 | 10, 11 |
| 13 | 10, 11, 12 | None | None |

### Agent Dispatch Summary

| Wave | Tasks | Recommended Agents |
|------|-------|-------------------|
| 1 | 1, 2, 3 | category="quick" (1, 2), category="quick" (3) - parallel |
| 2 | 4, 5, 6, 7 | category="unspecified-low" - parallel |
| 3 | 8, 9, 10, 11, 12 | category="visual-engineering" (9, 10, 11), category="quick" (8, 12) |
| 4 | 13 | category="unspecified-high" |

---

## TODOs

### Phase 1: Infrastructure

- [x] 1. Docker Compose 인프라 구성

  **What to do**:
  - `docker-compose.yml` 생성
  - PostgreSQL 15+ (wal_level=logical 설정)
  - Neo4j 5.x (APOC 플러그인 포함, db.cdc.mode=FULL)
  - Redpanda (single node)
  - Kafka Connect (Debezium + Neo4j connectors)
  - Redpanda Console
  - 각 서비스 healthcheck 설정

  **Must NOT do**:
  - Multi-node 클러스터 구성
  - TLS/SSL 설정
  - 볼륨 백업 전략

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []
    - Docker Compose는 기본 인프라 작업

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 2, 3)
  - **Blocks**: Tasks 4, 5, 6, 7
  - **Blocked By**: None

  **References**:
  - Pattern: [Redpanda + Neo4j Docker 예시](https://redpanda.com/blog/event-driven-graph-analysis-redpanda-neo4j)
  - Neo4j CDC config: `dbms.cdc.enabled=true`, `db.cdc.mode=FULL`
  - PostgreSQL config: `wal_level=logical`, `max_wal_senders=4`
  - Neo4j APOC: `neo4j:5-enterprise` 이미지 + APOC 플러그인 마운트

  **Acceptance Criteria**:
  ```bash
  # 모든 서비스 시작
  docker compose up -d
  
  # 서비스 상태 확인
  docker compose ps --format json | jq '.[].Health'
  # Assert: 모든 서비스 "healthy"
  
  # PostgreSQL logical replication 확인
  docker exec postgres psql -U admin -c "SHOW wal_level"
  # Assert: "logical"
  
  # Neo4j 접근 확인
  curl -s http://localhost:7474/db/neo4j/tx/commit \
    -H "Content-Type: application/json" \
    -u neo4j:password \
    -d '{"statements":[{"statement":"RETURN 1 as test"}]}'
  # Assert: HTTP 200, results 포함
  
  # Redpanda 확인
  docker exec redpanda rpk cluster info
  # Assert: 1 broker 표시
  
  # Kafka Connect 확인
  curl -s http://localhost:8083/connectors
  # Assert: HTTP 200, [] 반환
  
  # Redpanda Console 확인
  curl -s http://localhost:8080
  # Assert: HTTP 200
  ```

  **Commit**: YES
  - Message: `feat(infra): add docker compose with postgres, neo4j, redpanda, kafka connect`
  - Files: `docker-compose.yml`, `.env.example`
  - Pre-commit: `docker compose config`

---

- [x] 2. PostgreSQL 스키마 및 초기 데이터

  **What to do**:
  - E-commerce 스키마 설계 (5개 테이블)
    - `categories`: id, name, description
    - `products`: id, name, price, category_id (FK)
    - `customers`: id, name, email
    - `orders`: id, customer_id (FK), created_at, total
    - `order_items`: id, order_id (FK), product_id (FK), quantity, price
  - 각 테이블 REPLICA IDENTITY FULL 설정
  - CDC Publication 생성
  - 샘플 데이터 INSERT

  **Must NOT do**:
  - 복잡한 인덱스 최적화
  - 트리거/프로시저 사용
  - Soft delete 패턴

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 3)
  - **Blocks**: Tasks 4, 5
  - **Blocked By**: None

  **References**:
  - Debezium requires: `ALTER TABLE x REPLICA IDENTITY FULL`
  - Publication: `CREATE PUBLICATION dbz_publication FOR ALL TABLES`

  **Acceptance Criteria**:
  ```bash
  # 테이블 존재 확인
  docker exec postgres psql -U admin -d ecommerce -c "\dt"
  # Assert: categories, products, customers, orders, order_items 표시
  
  # REPLICA IDENTITY 확인
  docker exec postgres psql -U admin -d ecommerce -c \
    "SELECT relname, relreplident FROM pg_class WHERE relname = 'products'"
  # Assert: relreplident = 'f' (FULL)
  
  # Publication 확인
  docker exec postgres psql -U admin -d ecommerce -c \
    "SELECT pubname FROM pg_publication"
  # Assert: dbz_publication 포함
  
  # 샘플 데이터 확인
  docker exec postgres psql -U admin -d ecommerce -c \
    "SELECT COUNT(*) FROM products"
  # Assert: >= 5
  ```

  **Commit**: YES
  - Message: `feat(db): add ecommerce schema and seed data`
  - Files: `db/init.sql`, `db/seed.sql`
  - Pre-commit: `docker exec postgres psql -U admin -d ecommerce -f /docker-entrypoint-initdb.d/init.sql`

---

- [x] 3. 테스트 인프라 설정

  **What to do**:
  - Next.js 프로젝트 초기화 (apps/web)
  - Vitest 설정 (단위 테스트)
  - Playwright 설정 (E2E 테스트)
  - 예제 테스트 작성하여 설정 검증
  - GitHub Actions CI 설정 (선택)

  **Must NOT do**:
  - Storybook 설정
  - 복잡한 테스트 유틸리티
  - Mutation testing

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2)
  - **Blocks**: Task 8
  - **Blocked By**: None

  **References**:
  - Vitest + Next.js: https://nextjs.org/docs/testing
  - Playwright: https://playwright.dev/docs/intro

  **Acceptance Criteria**:
  ```bash
  # Vitest 실행
  cd apps/web && bun test
  # Assert: 1 test passed
  
  # Playwright 설치 확인
  cd apps/web && bunx playwright --version
  # Assert: 버전 출력
  
  # 프로젝트 구조 확인
  ls apps/web/src
  # Assert: app/, components/, lib/ 등 존재
  ```

  **Commit**: YES
  - Message: `feat(test): setup vitest and playwright for tdd`
  - Files: `apps/web/`, `vitest.config.ts`, `playwright.config.ts`
  - Pre-commit: `bun test`

---

### Phase 2: CDC Pipeline

- [x] 4. Debezium PostgreSQL Source 커넥터

  **What to do**:
  - Debezium PostgreSQL Source Connector 설정
  - 토픽 네이밍: `pg-cdc.ecommerce.{table}`
  - Connector REST API로 등록
  - INSERT/UPDATE/DELETE 이벤트 캡처 테스트

  **Must NOT do**:
  - 스키마 레지스트리 연동 (JSON 사용)
  - 복잡한 SMT (Single Message Transform)
  - 토픽 파티셔닝 전략

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 5, 6, 7)
  - **Blocks**: Tasks 8, 13
  - **Blocked By**: Tasks 1, 2

  **References**:
  - Debezium PostgreSQL Connector: https://debezium.io/documentation/reference/stable/connectors/postgresql.html
  - Connector config pattern from research (JSON format)
  - `plugin.name: pgoutput` (PostgreSQL 10+ 내장)

  **Acceptance Criteria**:
  ```bash
  # 커넥터 등록
  curl -X POST http://localhost:8083/connectors \
    -H "Content-Type: application/json" \
    -d @connectors/postgres-source.json
  # Assert: HTTP 201
  
  # 커넥터 상태 확인
  curl -s http://localhost:8083/connectors/postgres-source/status | jq '.connector.state'
  # Assert: "RUNNING"
  
  # 토픽 생성 확인
  docker exec redpanda rpk topic list | grep pg-cdc
  # Assert: pg-cdc.ecommerce.products 등 5개 토픽
  
  # INSERT 이벤트 테스트
  docker exec postgres psql -U admin -d ecommerce -c \
    "INSERT INTO products (name, price, category_id) VALUES ('Test CDC', 99.99, 1)"
  sleep 3
  docker exec redpanda rpk topic consume pg-cdc.ecommerce.products --num 1 | jq '.payload.after.name'
  # Assert: "Test CDC"
  ```

  **Commit**: YES
  - Message: `feat(cdc): add debezium postgresql source connector`
  - Files: `connectors/postgres-source.json`
  - Pre-commit: `curl -s http://localhost:8083/connectors/postgres-source/status`

---

- [x] 5. Neo4j Sink 커넥터

  **What to do**:
  - Neo4j Kafka Connector (Sink) 설정
  - Cypher 전략으로 PostgreSQL 이벤트 → Neo4j 노드/관계 매핑
  - 각 테이블별 Cypher 쿼리 작성
    - products → MERGE (:Product)
    - categories → MERGE (:Category)
    - products.category_id → MERGE (:Product)-[:BELONGS_TO]->(:Category)
    - orders → MERGE (:Order)
    - order_items → MERGE (:Order)-[:CONTAINS]->(:Product)
  - DELETE 처리: `DETACH DELETE` 사용

  **Must NOT do**:
  - Pattern 전략 사용 (Cypher로 통일)
  - 복잡한 조건부 로직
  - 배치 사이즈 최적화

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 4, 6, 7)
  - **Blocks**: Tasks 8, 13
  - **Blocked By**: Tasks 1, 2

  **References**:
  - Neo4j Sink Connector: https://neo4j.com/docs/kafka/current/sink/
  - Cypher strategy: `neo4j.topic.cypher.{topic}` 설정
  - Delete handling: `MATCH (n:Label {id: event.before.id}) DETACH DELETE n`
  - Event binding: `__value.payload.after`, `__value.payload.before`, `__value.payload.op`

  **Acceptance Criteria**:
  ```bash
  # 커넥터 등록
  curl -X POST http://localhost:8083/connectors \
    -H "Content-Type: application/json" \
    -d @connectors/neo4j-sink.json
  # Assert: HTTP 201
  
  # 커넥터 상태 확인
  curl -s http://localhost:8083/connectors/neo4j-sink/status | jq '.connector.state'
  # Assert: "RUNNING"
  
  # PostgreSQL INSERT → Neo4j 동기화 테스트
  docker exec postgres psql -U admin -d ecommerce -c \
    "INSERT INTO products (name, price, category_id) VALUES ('Sink Test', 50.00, 1)"
  sleep 5
  curl -s http://localhost:7474/db/neo4j/tx/commit \
    -H "Content-Type: application/json" \
    -u neo4j:password \
    -d '{"statements":[{"statement":"MATCH (p:Product {name: \"Sink Test\"}) RETURN p.price"}]}' \
    | jq '.results[0].data[0].row[0]'
  # Assert: 50.00
  
  # 관계 생성 확인
  curl -s http://localhost:7474/db/neo4j/tx/commit \
    -H "Content-Type: application/json" \
    -u neo4j:password \
    -d '{"statements":[{"statement":"MATCH (p:Product {name: \"Sink Test\"})-[:BELONGS_TO]->(c:Category) RETURN c.name"}]}' \
    | jq '.results[0].data[0].row[0]'
  # Assert: 카테고리 이름 반환
  
  # DELETE 테스트
  docker exec postgres psql -U admin -d ecommerce -c \
    "DELETE FROM products WHERE name = 'Sink Test'"
  sleep 5
  curl -s http://localhost:7474/db/neo4j/tx/commit \
    -H "Content-Type: application/json" \
    -u neo4j:password \
    -d '{"statements":[{"statement":"MATCH (p:Product {name: \"Sink Test\"}) RETURN count(p)"}]}' \
    | jq '.results[0].data[0].row[0]'
  # Assert: 0
  ```

  **Commit**: YES
  - Message: `feat(cdc): add neo4j sink connector with cypher strategy`
  - Files: `connectors/neo4j-sink.json`
  - Pre-commit: `curl -s http://localhost:8083/connectors/neo4j-sink/status`

---

- [ ] 6. Neo4j CDC Source 커넥터

  **What to do**:
  - Neo4j Kafka Connector (Source) 설정
  - CDC 전략으로 Neo4j 변경 이벤트 캡처
  - 토픽 네이밍: `neo4j-cdc-events`
  - 노드/관계 변경 모두 캡처

  **Must NOT do**:
  - Query 전략 사용 (CDC로 통일)
  - 복잡한 셀렉터 필터링
  - 다중 토픽 분리

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 4, 5, 7)
  - **Blocks**: Tasks 12, 13
  - **Blocked By**: Task 1

  **References**:
  - Neo4j Source Connector: https://neo4j.com/docs/kafka/current/source/
  - CDC strategy: `neo4j.source-strategy: CHANGE_DATA_CAPTURE`
  - Selectors: `neo4j.cdc.selectors: [{"select":"e"}]` (모든 엔티티)

  **Acceptance Criteria**:
  ```bash
  # 커넥터 등록
  curl -X POST http://localhost:8083/connectors \
    -H "Content-Type: application/json" \
    -d @connectors/neo4j-source.json
  # Assert: HTTP 201
  
  # 커넥터 상태 확인
  curl -s http://localhost:8083/connectors/neo4j-source/status | jq '.connector.state'
  # Assert: "RUNNING"
  
  # 토픽 생성 확인
  docker exec redpanda rpk topic list | grep neo4j-cdc
  # Assert: neo4j-cdc-events 존재
  
  # Neo4j 직접 변경 → 이벤트 캡처 테스트
  curl -s http://localhost:7474/db/neo4j/tx/commit \
    -H "Content-Type: application/json" \
    -u neo4j:password \
    -d '{"statements":[{"statement":"CREATE (t:TestNode {name: \"CDC Test\"})"}]}'
  sleep 3
  docker exec redpanda rpk topic consume neo4j-cdc-events --num 1 | grep "CDC Test"
  # Assert: 이벤트에 "CDC Test" 포함
  ```

  **Commit**: YES
  - Message: `feat(cdc): add neo4j cdc source connector`
  - Files: `connectors/neo4j-source.json`
  - Pre-commit: `curl -s http://localhost:8083/connectors/neo4j-source/status`

---

- [x] 7. 그래프 라이브러리 평가 (Spike)

  **What to do**:
  - @neo4j-nvl/react PoC 구현
    - InteractiveNvlWrapper로 기본 그래프 렌더링
    - 노드 클릭 이벤트 핸들링
    - DrawInteraction으로 드래그-투-링크 테스트
  - React Flow (Xyflow) PoC 구현
    - 기본 노드/엣지 렌더링
    - onConnect 핸들러로 링크 생성
  - 평가 기준:
    - 노드 5,000개 렌더링 성능
    - 드래그-투-링크 UX 품질
    - 커스터마이징 용이성
    - Neo4j 데이터 구조 호환성
  - 결정 문서 작성

  **Must NOT do**:
  - 완전한 UI 구현
  - 성능 최적화
  - 두 라이브러리 모두 완성

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 4, 5, 6)
  - **Blocks**: Task 9
  - **Blocked By**: Task 1

  **References**:
  - NVL API: https://neo4j.com/docs/api/nvl/current/
  - NVL React: InteractiveNvlWrapper, DrawInteraction
  - React Flow: https://reactflow.dev/
  - arrows.app: 드래그-투-링크 패턴 참고

  **Acceptance Criteria**:
  ```bash
  # NVL PoC 파일 존재
  ls apps/web/src/components/spikes/NvlSpike.tsx
  # Assert: 파일 존재
  
  # React Flow PoC 파일 존재
  ls apps/web/src/components/spikes/ReactFlowSpike.tsx
  # Assert: 파일 존재
  
  # 평가 문서 존재
  ls docs/graph-library-evaluation.md
  # Assert: 파일 존재, NVL vs React Flow 비교 포함
  
  # 결정 기록
  grep -i "선택:" docs/graph-library-evaluation.md
  # Assert: "NVL" 또는 "React Flow" 중 하나 선택됨
  ```

  **Commit**: YES
  - Message: `spike(ui): evaluate neo4j-nvl vs react-flow for graph visualization`
  - Files: `apps/web/src/components/spikes/`, `docs/graph-library-evaluation.md`
  - Pre-commit: None (spike)

---

### Phase 3: UI

- [x] 8. Next.js 프로젝트 및 API 설정

  **What to do**:
  - Next.js App Router 구조 설정
  - Neo4j JavaScript Driver 연동
  - PostgreSQL 연결 (Prisma 또는 직접 pg)
  - API Routes 설정:
    - GET /api/graph - Neo4j에서 그래프 데이터 조회
    - POST /api/nodes - PostgreSQL에 노드 생성
    - PUT /api/nodes/:id - PostgreSQL에 노드 수정
    - DELETE /api/nodes/:id - PostgreSQL에 노드 삭제
    - POST /api/relationships - PostgreSQL에 관계 생성
    - DELETE /api/relationships/:id - PostgreSQL에 관계 삭제

  **Must NOT do**:
  - GraphQL 사용
  - 복잡한 캐싱 전략
  - 미들웨어 인증

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 3 (sequential start)
  - **Blocks**: Tasks 9, 10, 11, 12
  - **Blocked By**: Tasks 3, 4, 5

  **References**:
  - Neo4j JS Driver: https://neo4j.com/docs/javascript-manual/current/
  - Next.js API Routes: https://nextjs.org/docs/app/building-your-application/routing/route-handlers
  - Prisma PostgreSQL: https://www.prisma.io/docs/concepts/database-connectors/postgresql

  **Acceptance Criteria**:
  ```bash
  # 개발 서버 시작
  cd apps/web && bun dev &
  sleep 5
  
  # Health check
  curl -s http://localhost:3000/api/health
  # Assert: {"status":"ok"}
  
  # 그래프 데이터 조회
  curl -s http://localhost:3000/api/graph
  # Assert: HTTP 200, nodes와 relationships 배열 포함
  
  # 노드 생성 (TDD: 테스트 먼저)
  # Test: POST /api/nodes → PostgreSQL에 삽입됨
  curl -X POST http://localhost:3000/api/nodes \
    -H "Content-Type: application/json" \
    -d '{"type":"Product","name":"API Test","price":100}'
  # Assert: HTTP 201, id 반환
  
  # 노드 삭제
  curl -X DELETE http://localhost:3000/api/nodes/{id}
  # Assert: HTTP 204
  ```

  **Commit**: YES
  - Message: `feat(api): add next.js api routes for graph crud`
  - Files: `apps/web/src/app/api/`
  - Pre-commit: `bun test`

---

- [x] 9. 그래프 시각화 컴포넌트

  **What to do**:
  - Task 7에서 선택된 라이브러리로 그래프 컴포넌트 구현
  - GraphViewer 컴포넌트:
    - 노드/관계 렌더링
    - 줌/팬 인터랙션
    - 노드 클릭 시 상세 정보 표시
    - 노드 드래그 이동
  - 레이아웃: Force-directed
  - 노드 스타일: 레이블별 색상 구분

  **Must NOT do**:
  - 다중 레이아웃 지원
  - 3D 시각화
  - 복잡한 필터링 UI

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 3 (after Task 8)
  - **Blocks**: Tasks 10, 11, 13
  - **Blocked By**: Tasks 7, 8

  **References**:
  - Task 7 평가 결과 문서
  - NVL: InteractiveNvlWrapper, nvlOptions, mouseEventCallbacks
  - React Flow: ReactFlow, useNodesState, useEdgesState

  **Acceptance Criteria**:
  
  **Playwright E2E:**
  ```typescript
  // apps/web/tests/graph-viewer.spec.ts
  test('graph renders nodes and relationships', async ({ page }) => {
    await page.goto('/');
    
    // 캔버스 존재 확인
    const canvas = page.locator('canvas, .react-flow');
    await expect(canvas).toBeVisible();
    
    // 노드 렌더링 확인 (최소 1개)
    // NVL: data-testid 또는 텍스트로 확인
    // React Flow: .react-flow__node 클래스
    
    // 스크린샷
    await page.screenshot({ path: '.sisyphus/evidence/task-9-graph-render.png' });
  });
  ```

  **Commit**: YES
  - Message: `feat(ui): add graph visualization component with [nvl|react-flow]`
  - Files: `apps/web/src/components/graph/`
  - Pre-commit: `bun test && bunx playwright test graph-viewer`

---

- [x] 10. 노드 CRUD UI

  **What to do**:
  - NodePanel 컴포넌트:
    - 노드 목록 표시 (타입별 필터)
    - 노드 상세 보기 (선택 시)
    - 노드 생성 폼
    - 노드 수정 폼
    - 노드 삭제 버튼
  - Optimistic Update 구현:
    - API 호출 전 UI 즉시 업데이트
    - 실패 시 롤백
  - React Query (TanStack Query) 사용

  **Must NOT do**:
  - 복잡한 폼 유효성 검사
  - 파일 업로드
  - 벌크 작업

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Task 11)
  - **Blocks**: Task 13
  - **Blocked By**: Task 9

  **References**:
  - TanStack Query: https://tanstack.com/query/latest
  - Optimistic Updates: https://tanstack.com/query/latest/docs/react/guides/optimistic-updates

  **Acceptance Criteria**:
  
  **Playwright E2E:**
  ```typescript
  // apps/web/tests/node-crud.spec.ts
  test('create node via UI', async ({ page }) => {
    await page.goto('/');
    
    // "Add Node" 버튼 클릭
    await page.click('[data-testid="add-node-btn"]');
    
    // 폼 채우기
    await page.fill('[data-testid="node-name"]', 'E2E Test Product');
    await page.fill('[data-testid="node-price"]', '123.45');
    await page.selectOption('[data-testid="node-type"]', 'Product');
    
    // 저장
    await page.click('[data-testid="save-node-btn"]');
    
    // UI에 노드 표시 확인 (Optimistic)
    await expect(page.locator('text=E2E Test Product')).toBeVisible();
    
    // PostgreSQL에 저장 확인 (API)
    const response = await page.request.get('/api/nodes?name=E2E Test Product');
    expect(response.status()).toBe(200);
    
    await page.screenshot({ path: '.sisyphus/evidence/task-10-node-create.png' });
  });
  ```

  **Commit**: YES
  - Message: `feat(ui): add node crud panel with optimistic updates`
  - Files: `apps/web/src/components/nodes/`
  - Pre-commit: `bun test && bunx playwright test node-crud`

---

- [ ] 11. 관계 CRUD UI (드래그-투-링크)

  **What to do**:
  - 드래그-투-링크 구현:
    - 노드에서 드래그 시작
    - 다른 노드에 드롭하여 관계 생성
    - 관계 타입 선택 다이얼로그
  - RelationshipPanel 컴포넌트:
    - 관계 목록 (선택된 노드 기준)
    - 관계 삭제
  - Optimistic Update

  **Must NOT do**:
  - 관계 속성 편집 (버전 2에서)
  - 다중 관계 동시 생성
  - 관계 방향 변경

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Task 10)
  - **Blocks**: Task 13
  - **Blocked By**: Task 9

  **References**:
  - NVL DrawInteraction: `interactionOptions.draw`, `onDrawEnd`
  - React Flow onConnect: https://reactflow.dev/docs/api/react-flow-props/
  - arrows.app drag-to-link 패턴

  **Acceptance Criteria**:
  
  **Playwright E2E:**
  ```typescript
  // apps/web/tests/relationship-crud.spec.ts
  test('create relationship via drag-to-link', async ({ page }) => {
    await page.goto('/');
    
    // 두 노드 위치 찾기
    const sourceNode = page.locator('[data-testid="node-product-1"]');
    const targetNode = page.locator('[data-testid="node-category-1"]');
    
    // 드래그-투-링크 (소스 → 타겟)
    await sourceNode.dragTo(targetNode);
    
    // 관계 타입 선택 다이얼로그
    await page.click('[data-testid="rel-type-BELONGS_TO"]');
    await page.click('[data-testid="create-rel-btn"]');
    
    // 관계 선 표시 확인
    await expect(page.locator('[data-testid="relationship-line"]')).toBeVisible();
    
    await page.screenshot({ path: '.sisyphus/evidence/task-11-drag-to-link.png' });
  });
  ```

  **Commit**: YES
  - Message: `feat(ui): add drag-to-link relationship creation`
  - Files: `apps/web/src/components/relationships/`
  - Pre-commit: `bun test && bunx playwright test relationship-crud`

---

- [ ] 12. CDC 이벤트 뷰어

  **What to do**:
  - EventViewer 페이지 (/events):
    - 최근 N개 CDC 이벤트 표시
    - PostgreSQL CDC 이벤트 (pg-cdc.* 토픽)
    - Neo4j CDC 이벤트 (neo4j-cdc-events 토픽)
  - 실시간 업데이트 (polling 또는 SSE)
  - 이벤트 상세 보기 (JSON 표시)
  - Redpanda Console 링크 추가

  **Must NOT do**:
  - 이벤트 필터링/검색
  - 이벤트 리플레이
  - 시간 범위 쿼리

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 10, 11)
  - **Blocks**: Task 13
  - **Blocked By**: Tasks 6, 8

  **References**:
  - Redpanda Console: http://localhost:8080
  - Kafka consumer API for Next.js

  **Acceptance Criteria**:
  
  **Playwright E2E:**
  ```typescript
  // apps/web/tests/event-viewer.spec.ts
  test('event viewer shows cdc events', async ({ page }) => {
    await page.goto('/events');
    
    // 이벤트 목록 존재 확인
    const eventList = page.locator('[data-testid="event-list"]');
    await expect(eventList).toBeVisible();
    
    // 최소 1개 이벤트 표시 (시드 데이터로 인해)
    const events = page.locator('[data-testid="event-item"]');
    await expect(events.first()).toBeVisible();
    
    // Redpanda Console 링크
    const consoleLink = page.locator('a[href*="8080"]');
    await expect(consoleLink).toBeVisible();
    
    await page.screenshot({ path: '.sisyphus/evidence/task-12-event-viewer.png' });
  });
  ```

  **Commit**: YES
  - Message: `feat(ui): add cdc event viewer page`
  - Files: `apps/web/src/app/events/`
  - Pre-commit: `bun test && bunx playwright test event-viewer`

---

### Phase 4: Integration

- [ ] 13. E2E 테스트 및 통합 검증

  **What to do**:
  - 전체 플로우 E2E 테스트:
    1. UI에서 노드 생성
    2. PostgreSQL에 저장 확인
    3. CDC로 Neo4j 동기화 확인
    4. Neo4j CDC 이벤트 발행 확인
    5. 이벤트 뷰어에 표시 확인
  - 성능 테스트 (선택):
    - 100개 노드 렌더링
    - CDC 지연 시간 측정
  - README 작성

  **Must NOT do**:
  - 부하 테스트
  - 카오스 테스트
  - CI/CD 파이프라인 (선택)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: [`playwright`]

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 4 (final)
  - **Blocks**: None
  - **Blocked By**: Tasks 10, 11, 12

  **References**:
  - 모든 이전 태스크의 Acceptance Criteria

  **Acceptance Criteria**:
  
  **Playwright E2E (Full Flow):**
  ```typescript
  // apps/web/tests/e2e-full-flow.spec.ts
  test('full cdc flow: UI → PG → Neo4j → Event', async ({ page }) => {
    const uniqueName = `E2E-${Date.now()}`;
    
    // 1. UI에서 노드 생성
    await page.goto('/');
    await page.click('[data-testid="add-node-btn"]');
    await page.fill('[data-testid="node-name"]', uniqueName);
    await page.click('[data-testid="save-node-btn"]');
    
    // 2. PostgreSQL 확인 (API)
    const pgCheck = await page.request.get(`/api/nodes?name=${uniqueName}`);
    expect(pgCheck.status()).toBe(200);
    const pgData = await pgCheck.json();
    expect(pgData.length).toBeGreaterThan(0);
    
    // 3. CDC 동기화 대기 (최대 10초)
    await page.waitForTimeout(5000);
    
    // 4. Neo4j 확인 (API)
    const neo4jCheck = await page.request.get(`/api/graph?name=${uniqueName}`);
    expect(neo4jCheck.status()).toBe(200);
    const neo4jData = await neo4jCheck.json();
    expect(neo4jData.nodes.some(n => n.name === uniqueName)).toBe(true);
    
    // 5. 이벤트 뷰어 확인
    await page.goto('/events');
    await expect(page.locator(`text=${uniqueName}`)).toBeVisible({ timeout: 10000 });
    
    await page.screenshot({ path: '.sisyphus/evidence/task-13-full-flow.png' });
  });
  ```

  **Final Verification:**
  ```bash
  # 모든 테스트 실행
  cd apps/web && bun test && bunx playwright test
  # Assert: All tests pass
  
  # 서비스 상태 확인
  docker compose ps
  # Assert: All services healthy
  
  # README 존재
  cat README.md | head -20
  # Assert: 프로젝트 설명 포함
  ```

  **Commit**: YES
  - Message: `test(e2e): add full flow integration tests`
  - Files: `apps/web/tests/`, `README.md`
  - Pre-commit: `bun test && bunx playwright test`

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 1 | `feat(infra): add docker compose` | `docker-compose.yml` | `docker compose up -d` |
| 2 | `feat(db): add ecommerce schema` | `db/init.sql` | SQL 실행 |
| 3 | `feat(test): setup vitest and playwright` | `apps/web/` | `bun test` |
| 4 | `feat(cdc): add debezium source` | `connectors/` | Connector status |
| 5 | `feat(cdc): add neo4j sink` | `connectors/` | CDC 동기화 |
| 6 | `feat(cdc): add neo4j source` | `connectors/` | 이벤트 캡처 |
| 7 | `spike(ui): evaluate graph libs` | `docs/` | 문서 존재 |
| 8 | `feat(api): add crud routes` | `apps/web/src/app/api/` | API 테스트 |
| 9 | `feat(ui): add graph viewer` | `apps/web/src/components/` | Playwright |
| 10 | `feat(ui): add node crud` | `apps/web/src/components/` | Playwright |
| 11 | `feat(ui): add drag-to-link` | `apps/web/src/components/` | Playwright |
| 12 | `feat(ui): add event viewer` | `apps/web/src/app/events/` | Playwright |
| 13 | `test(e2e): add integration tests` | `apps/web/tests/` | All tests pass |

---

## Success Criteria

### Verification Commands
```bash
# 전체 시스템 시작
docker compose up -d && cd apps/web && bun dev

# 모든 테스트 실행
bun test && bunx playwright test

# CDC 동기화 확인
docker exec postgres psql -U admin -d ecommerce -c "INSERT INTO products (name, price, category_id) VALUES ('Final Test', 1.00, 1)"
sleep 5
curl -s http://localhost:7474/db/neo4j/tx/commit -u neo4j:password -H "Content-Type: application/json" -d '{"statements":[{"statement":"MATCH (p:Product {name: \"Final Test\"}) RETURN p"}]}' | jq '.results[0].data'
# Expected: 노드 데이터 반환
```

### Final Checklist
- [ ] 모든 Docker 서비스 healthy
- [ ] PostgreSQL INSERT → 5초 내 Neo4j 반영
- [ ] UI에서 노드/관계 CRUD 가능
- [ ] 드래그-투-링크로 관계 생성 가능
- [ ] CDC 이벤트가 Redpanda Console과 커스텀 뷰어에 표시
- [ ] 모든 TDD 테스트 통과
- [ ] README 존재
