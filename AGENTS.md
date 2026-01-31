# AGENTS.md - Graph Admin

## Project Overview

Graph database administration UI with Neo4j backend and Next.js frontend. Interactive graph visualization with CRUD operations via Cypher queries.

## Directory Structure

```
graph-admin/
├── docker-compose.yml      # Neo4j service (ports: 7475 HTTP, 7688 Bolt)
├── frontend/               # Next.js 16 application
│   ├── app/                # App Router (pages, layouts, API routes)
│   │   └── api/            # REST API routes (Cypher-based)
│   ├── components/         # React components
│   │   ├── graph/          # Graph visualization components
│   │   │   ├── hooks/      # Custom hooks (useRingLinkCreation, etc.)
│   │   │   ├── panels/     # Side panels (NodeDetail, CreateLink, etc.)
│   │   │   └── types.ts    # Graph-related type definitions
│   │   ├── nodes/          # Node CRUD components
│   │   └── providers/      # Context providers (QueryProvider)
│   ├── lib/                # Shared utilities (neo4j.ts driver)
│   ├── __tests__/          # Vitest unit tests
│   └── tests/              # Playwright E2E tests
```

## Commands

**패키지 매니저: Bun 사용 필수** (npm, yarn, pnpm 사용 금지)

All commands run from `frontend/` directory:

```bash
# Development
bun dev                     # Start dev server (localhost:3000)
bun build                   # Production build
bun start                   # Start production server

# Linting
bun lint                    # Run ESLint

# Unit Tests (Vitest)
bun test                    # Run all unit tests
bun test:ui                 # Run with Vitest UI
bun test [filename]         # Run specific test file
bun test -- -t "test name"  # Run test matching name

# E2E Tests (Playwright)
bun run test:e2e                          # Run all E2E tests
bun run test:e2e -- --grep "test name"    # Run E2E test matching name
bun run test:e2e -- tests/node-crud.e2e.ts  # Run specific E2E file

# Infrastructure
docker compose up -d        # Start Neo4j (from project root)
docker compose down         # Stop Neo4j
```

## Tech Stack

- **Runtime**: Bun
- **Framework**: Next.js 16 (App Router)
- **React**: 19.2
- **TypeScript**: 5.x (strict mode)
- **Styling**: TailwindCSS 4
- **Testing**: Vitest (unit), Playwright (E2E)
- **Linting**: ESLint 9 (next/core-web-vitals + typescript)
- **Database**: Neo4j 5 (via neo4j-driver)
- **Graph Viz**: react-force-graph-2d/3d

## Development Process (MANDATORY)

### TDD (Test-Driven Development) - 필수 준수

**모든 기능 구현 시 반드시 TDD 사이클을 따를 것.**

```
1. RED    - 실패하는 테스트 먼저 작성
2. GREEN  - 테스트를 통과하는 최소한의 코드 작성
3. REFACTOR - 코드 정리 (테스트는 계속 통과해야 함)
```

**TDD 워크플로우:**

```bash
# 1. 테스트 파일 생성/수정
#    - API: frontend/__tests__/api/[feature].test.ts
#    - E2E: frontend/tests/[feature].e2e.ts

# 2. 실패하는 테스트 확인
bun test -- -t "새로운 기능 테스트"

# 3. 구현 코드 작성

# 4. 테스트 통과 확인
bun test -- -t "새로운 기능 테스트"

# 5. 리팩토링 후 전체 테스트
bun test && bun lint
```

**TDD 규칙:**
- 테스트 없이 프로덕션 코드 작성 금지
- 실패하는 테스트 없이 새 코드 작성 금지
- 한 번에 하나의 테스트만 실패하도록 유지
- 테스트가 통과하면 즉시 리팩토링 고려

### Tidy First - 리팩토링 원칙

**TDD GREEN 단계 후, 코드 정리를 먼저 수행:**

```
1. 구조 변경 (Tidying) - 동작 변경 없이 코드 구조 개선
2. 동작 변경 (Behavior Change) - 정리된 코드에서 기능 수정
```

**Tidy First 체크리스트:**
- [ ] Guard Clauses: 중첩 조건문을 early return으로 변환
- [ ] Dead Code: 사용하지 않는 코드 제거
- [ ] Normalize Symmetries: 비슷한 코드는 일관된 패턴으로 통일
- [ ] Extract Helper: 반복되는 로직을 함수로 추출
- [ ] Chunk Statements: 관련 코드를 논리적 블록으로 그룹화
- [ ] Reorder: 읽기 순서에 맞게 코드 재배치 (호출되는 함수가 호출하는 함수 근처에)

**주의:** Tidying과 Behavior Change를 같은 커밋에 섞지 말 것

## Code Style Guidelines

### TypeScript

- **Strict mode enabled** - no implicit any, strict null checks
- **Never suppress errors**: No `as any`, `@ts-ignore`, `@ts-expect-error`
- Use explicit types for function parameters and return values
- Prefer `interface` for object types, `type` for unions/intersections
- Use `Record<string, unknown>` instead of `object` for generic objects

### Imports

```typescript
// 1. React imports first
import { useEffect, useState, useCallback, useRef } from 'react';

// 2. Next.js imports
import dynamic from 'next/dynamic';
import { NextResponse } from 'next/server';

// 3. External libraries
import { Integer } from 'neo4j-driver';

// 4. Internal imports with path alias
import { getNeo4jDriver } from '@/lib/neo4j';
import { GraphData, Node } from './types';

// 5. Relative imports (same module)
import { GRAPH_BACKGROUND, NODE_RADIUS } from './constants';
```

Path alias: `@/*` maps to `frontend/*`

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `GraphViewer.tsx`, `NodeDetailPanel.tsx` |
| Hooks | camelCase with `use` prefix | `useRingLinkCreation.ts` |
| Utilities | camelCase | `getNodeColor.ts`, `neo4j.ts` |
| Types/Interfaces | PascalCase | `interface GraphData {}` |
| Constants | SCREAMING_SNAKE_CASE | `GRAPH_BACKGROUND`, `NODE_RADIUS` |
| API routes | kebab-case directories | `/api/nodes/[id]/route.ts` |
| Test files | `.test.ts(x)` (unit), `.e2e.ts` (E2E) | `nodes.test.ts`, `node-crud.e2e.ts` |

### Component Patterns

```typescript
// Client components require directive
'use client';

// Imports grouped as above
import { useEffect, useState } from 'react';

// Props interface before component
interface NodePanelProps {
  onNodeCreated: (nodeId: string) => void;
}

// Functional component with explicit props type
export default function NodePanel({ onNodeCreated }: NodePanelProps) {
  // Hooks at top
  const [loading, setLoading] = useState(false);
  
  // Callbacks with useCallback for stable references
  const handleClick = useCallback(() => {
    // ...
  }, [dependencies]);

  // Early returns for loading/error states
  if (loading) return <div>Loading...</div>;

  // Main render
  return (/* ... */);
}
```

### Custom Hooks

```typescript
// Define input/output interfaces
interface UseRingLinkCreationProps {
  containerRef: RefObject<HTMLDivElement | null>;
  fgRef: RefObject<any>;
}

interface UseRingLinkCreationReturn {
  dragLink: DragLink | null;
  clearDragLink: () => void;
}

// Named export (not default)
export function useRingLinkCreation(
  props: UseRingLinkCreationProps
): UseRingLinkCreationReturn {
  // Implementation
}

// Re-export from hooks/index.ts
export { useRingLinkCreation } from './useRingLinkCreation';
```

### API Routes (Next.js App Router)

```typescript
import { NextResponse } from 'next/server';
import { getNeo4jDriver } from '@/lib/neo4j';

export async function POST(request: Request) {
  const driver = getNeo4jDriver();
  const session = driver.session();

  try {
    const body = await request.json();
    // Validate input
    if (!body.type) {
      return NextResponse.json(
        { error: 'Node type is required' },
        { status: 400 }
      );
    }
    
    // Execute Cypher
    const result = await session.run(cypher, params);
    
    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: error.message || 'Operation failed' },
      { status: 500 }
    );
  } finally {
    // Always close session
    await session.close();
  }
}
```

### Error Handling

- **API routes**: try/catch/finally with `session.close()` in finally
- **Components**: Error state with user-friendly messages
- **Async operations**: Wrap in try/catch, set error state
- **ErrorBoundary**: Use for graceful fallbacks (see `Graph3DErrorBoundary`)

```typescript
// Component error handling pattern
const [error, setError] = useState<string | null>(null);

try {
  const response = await fetch('/api/graph');
  if (!response.ok) throw new Error('Failed to fetch');
  const data = await response.json();
} catch (err) {
  setError(err instanceof Error ? err.message : 'Unknown error');
}
```

### Testing Patterns

**Unit Tests (Vitest)**:
```typescript
import { describe, it, expect, afterAll } from 'vitest';

describe('POST /api/nodes', () => {
  let testNodeIds: string[] = [];

  afterAll(async () => {
    // Cleanup test data
  });

  it('returns 400 when type is missing', async () => {
    const res = await fetch('http://localhost:3000/api/nodes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test' }),
    });
    expect(res.status).toBe(400);
  });
});
```

**E2E Tests (Playwright)**:
```typescript
import { test, expect } from '@playwright/test';

test('create node via UI', async ({ page }) => {
  await page.goto('/');
  await page.click('[data-testid="add-node-btn"]');
  await page.fill('[data-testid="node-name"]', 'Test Product');
  await page.click('[data-testid="save-node-btn"]');
  // Assertions
});
```

### Styling (TailwindCSS 4)

- Use Tailwind utility classes directly in JSX
- Common patterns: `flex`, `items-center`, `bg-gray-950`, `text-gray-400`
- Responsive: `md:`, `lg:` prefixes
- Interactive states: `hover:`, `disabled:`

## Environment Variables

```bash
# frontend/.env
NEO4J_URI=bolt://localhost:7688
NEO4J_USER=neo4j
NEO4J_PASSWORD=neo4j_password
```

## Neo4j Graph Model

- **Nodes**: `:Category`, `:Product`, `:Customer`, `:Order`
- **Relationships**:
  - `(:Product)-[:BELONGS_TO]->(:Category)`
  - `(:Customer)-[:PLACED]->(:Order)`
  - `(:Order)-[:CONTAINS]->(:Product)`

## Common Pitfalls

1. **Neo4j Integer**: Use `Integer.isInteger()` and `.toNumber()` for Neo4j integers
2. **Dynamic imports**: Heavy graph libraries require `dynamic(() => import(...), { ssr: false })`
3. **Client components**: Add `'use client'` for components using hooks/browser APIs
4. **Session cleanup**: Always close Neo4j sessions in finally block
5. **Test isolation**: Clean up test data in afterAll/afterEach hooks
