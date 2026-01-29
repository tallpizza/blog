
## Task 3: Test Infrastructure Setup

### Decisions Made

1. **Vitest Configuration**
   - Used `vitest.config.ts` with React Testing Library setup
   - Configured jsdom environment for DOM testing
   - Set up `vitest.setup.ts` to import jest-dom matchers
   - Used `include` pattern to only run tests in `__tests__` directory (exclude Playwright tests)
   - Added test scripts to package.json: `test`, `test:ui`, `test:e2e`

2. **Playwright Configuration**
   - Created `playwright.config.ts` with baseURL http://localhost:3000
   - Configured for chromium, firefox, and webkit browsers
   - Set up webServer to auto-start Next.js dev server
   - Tests located in `tests/` directory (separate from Vitest)

3. **Directory Structure**
   - Next.js App Router at `frontend/app/`
   - Vitest tests in `frontend/__tests__/`
   - Playwright tests in `frontend/tests/`
   - Public assets in `frontend/public/`

4. **Dependencies Installed**
   - vitest@4.0.18
   - @testing-library/react@16.3.2
   - @testing-library/jest-dom@6.9.1
   - @vitejs/plugin-react@5.1.2
   - jsdom@27.4.0 (required for vitest jsdom environment)
   - playwright@1.58.0
   - @playwright/test@1.58.0

### Key Learnings

1. **Vitest + Playwright Conflict**: Vitest was trying to run Playwright test files. Solution: Use `include` pattern in vitest.config.ts to only include `__tests__/**/*.test.ts` files.

2. **jsdom Dependency**: Must explicitly install jsdom as a dev dependency for vitest to work with jsdom environment.

3. **Test Script Organization**: Separate test directories for unit tests (__tests__) and e2e tests (tests) prevents conflicts and keeps concerns separated.

4. **Next.js 16 with Turbopack**: Dev server starts in ~386ms with Turbopack, very fast for development.

5. **TDD Workflow Ready**: 
   - RED: Write failing test
   - GREEN: Make test pass with minimal code
   - REFACTOR: Improve implementation
   - Both Vitest (unit) and Playwright (e2e) configured for this workflow

### Verification Results

✅ Vitest: 3 tests passed
✅ Playwright: Version 1.58.0 installed with all browsers
✅ Next.js: Dev server starts successfully
✅ Directory structure: app/, components/, lib/ ready for development

## Fix: Test Runner Configuration Conflict

### Problem
`bun test` (Bun's native test runner) was picking up both Vitest and Playwright test files, causing conflicts.

### Solution
1. **Renamed Playwright tests**: `tests/example.spec.ts` → `tests/example.e2e.ts`
2. **Updated playwright.config.ts**: Changed from `testDir: './tests'` to `testMatch: '**/*.e2e.ts'`
3. **Result**: 
   - `bun test` now runs ONLY Vitest tests (3 pass)
   - `bun run test:e2e` runs ONLY Playwright tests (6 pass across 3 browsers)

### Key Learning
- Bun's native test runner (`bun test`) looks for `.test.ts` and `.spec.ts` files
- Playwright's test runner looks for `.spec.ts` files by default
- Using `.e2e.ts` extension prevents Bun from picking up Playwright tests
- This separation allows both test runners to coexist without conflicts

### Verification
```bash
cd frontend && bun test
# Output: 3 pass, 0 fail (Vitest only)

cd frontend && bun run test:e2e
# Output: 6 passed (Playwright across chromium, firefox, webkit)
```

## [2026-01-29] Task 6 Decision: Skip Neo4j CDC Monitoring

### Problem
Neo4j Kafka Connector 5.1.19 is incompatible with Neo4j 5.26.20 CDC implementation.

### Decision: SKIP for now
- Core pipeline (PostgreSQL → Neo4j) works ✅
- Neo4j CDC monitoring is nice-to-have, not critical
- Continue with remaining tasks

### Impact
- Task 12: CDC Event Viewer will show only PostgreSQL events
- Task 13: E2E tests will verify main pipeline only


## [2026-01-29] Task 7 Decision: Graph Library Selection

### Decision: @neo4j-nvl/react

**선택: @neo4j-nvl/react (Neo4j Visualization Library)**

### Rationale

1. **Official Neo4j Library**
   - Maintained by Neo4j team
   - Guaranteed compatibility with Neo4j data structures
   - Aligns with project's Neo4j-centric architecture

2. **Performance**
   - Handles 5000+ nodes @ 60fps (WebGL rendering)
   - React Flow limited to 500-1000 nodes
   - E-commerce domain can have large graphs (10K+ nodes)

3. **Drag-to-Link**
   - Built-in DrawInteraction component
   - Less boilerplate than React Flow's onConnect handler
   - Native support for relationship type selection

4. **Neo4j Integration**
   - Direct support for Neo4j node/relationship objects
   - No manual data transformation required
   - Built-in property visualization

### Trade-offs Accepted

- **Less customization flexibility**: Acceptable for admin UI (not consumer-facing)
- **Smaller community**: Mitigated by official Neo4j support
- **Larger bundle size** (~150KB vs 80KB): Justified by performance gains

### Implementation Plan

- **Task 9**: Create GraphViewer component with InteractiveNvlWrapper
- **Task 11**: Implement drag-to-link via DrawInteraction
- **Task 13**: Performance test with 1000+ node dataset

### Evaluation Document

Full comparison available in `docs/graph-library-evaluation.md`:
- Performance benchmarks (NVL 3.7x faster)
- Feature comparison table
- Neo4j compatibility analysis
- Risk mitigation strategies

### Verification

```bash
ls docs/graph-library-evaluation.md
grep -i "선택:" docs/graph-library-evaluation.md
# Expected: "@neo4j-nvl/react"
```


## Task 8: API Architecture Decisions

### Database Client Libraries
- **Decision**: Use `pg` library directly instead of Prisma
- **Rationale**: 
  - Simpler setup without schema generation
  - Direct SQL control for dynamic queries
  - Lighter weight for API routes
  - Better alignment with existing PostgreSQL schema

### Connection Management
- **Decision**: Singleton pattern for Neo4j driver, connection pool for PostgreSQL
- **Rationale**:
  - Neo4j driver is expensive to create (authentication, connection setup)
  - PostgreSQL pool handles concurrent requests efficiently
  - Prevents connection exhaustion under load
  - Follows official driver recommendations

### API Response Format
- **Decision**: Return database rows directly with minimal transformation
- **Rationale**:
  - Simpler implementation
  - Matches PostgreSQL column names
  - Frontend can handle data transformation
  - Reduces API layer complexity

### Node Type Handling
- **Decision**: Use `type` field in request body to determine table
- **Rationale**:
  - Single endpoint for all node types
  - Easier to extend with new node types
  - Consistent API interface
  - Validation happens at API layer

### Relationship Modeling
- **Decision**: Use order_items table for relationships (not separate relationship endpoint per type)
- **Rationale**:
  - Aligns with E-commerce schema design
  - Foreign keys enforce referential integrity
  - CDC connector handles Neo4j relationship creation
  - Simpler than managing multiple relationship types

### Error Handling Strategy
- **Decision**: Return JSON error objects with descriptive messages
- **Rationale**:
  - Consistent error format across all endpoints
  - Helpful for debugging and frontend error display
  - Proper HTTP status codes (400, 404, 500)
  - Logs errors server-side for monitoring

### Test Strategy
- **Decision**: TDD with Vitest for unit/integration tests
- **Rationale**:
  - Tests written before implementation (RED-GREEN-REFACTOR)
  - Fast feedback loop with Vitest
  - Integration tests hit real database (not mocked)
  - Ensures endpoints work end-to-end
