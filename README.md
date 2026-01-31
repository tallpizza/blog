# Graph Admin

A graph database administration UI with Neo4j and Cypher-based CRUD operations.

## Overview

This project provides a graph visualization and management interface powered by:
- **Neo4j** as the graph database
- **Cypher** queries for all CRUD operations
- **Next.js UI** for graph visualization and management

## Architecture

```
Neo4j Graph DB
  ↓ (Bolt Protocol)
Next.js API Routes (Cypher)
  ↓
Next.js UI (Graph Visualization + CRUD)
```

## Features

- **Graph Visualization**: Interactive graph with @neo4j-nvl/react
- **Node CRUD**: Create, read, update, delete nodes via UI
- **Relationship CRUD**: Create and delete relationships between nodes
- **Cypher-based**: All operations use native Cypher queries

## Tech Stack

- **Frontend**: Next.js 16, React 19, TanStack Query, @neo4j-nvl/react
- **Backend**: Next.js API Routes, Neo4j Driver
- **Database**: Neo4j 5 Enterprise
- **Testing**: Vitest, Playwright

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Bun (or Node.js 18+)

### 1. Start Neo4j

```bash
docker compose up -d
```

This starts:
- Neo4j (HTTP: 7475, Bolt: 7688)

### 2. Verify Service

```bash
docker compose ps
```

Neo4j should show "healthy" status.

### 3. Start Next.js App

```bash
cd frontend
bun install
bun dev
```

Open http://localhost:3000

### 4. Explore

- **Graph UI**: http://localhost:3000
- **Neo4j Browser**: http://localhost:7475 (user: neo4j, password: neo4j_password)

## Testing

```bash
cd frontend

# Unit tests (Vitest)
bun test

# E2E tests (Playwright)
bun run test:e2e

# All tests
bun test && bun run test:e2e
```

## Neo4j Graph Model

- Nodes: `:Category`, `:Product`, `:Customer`, `:Order`
- Relationships:
  - `(:Product)-[:BELONGS_TO]->(:Category)`
  - `(:Customer)-[:PLACED]->(:Order)`
  - `(:Order)-[:CONTAINS]->(:Product)`

## Configuration

### Environment Variables

Copy `.env.example` to `.env` and adjust as needed:

```bash
NEO4J_URI=bolt://localhost:7688
NEO4J_USER=neo4j
NEO4J_PASSWORD=neo4j_password
```

### Ports

- Neo4j HTTP: 7475
- Neo4j Bolt: 7688
- Next.js: 3000

## Project Structure

```
graph-admin/
├── docker-compose.yml          # Neo4j service
├── frontend/                   # Next.js application
│   ├── app/                    # App Router pages
│   │   └── api/                # API routes (Cypher-based)
│   ├── components/             # React components
│   ├── lib/                    # Neo4j client
│   ├── __tests__/              # Vitest unit tests
│   └── tests/                  # Playwright E2E tests
```

## API Endpoints

### Nodes

- `POST /api/nodes` - Create a node
  ```json
  { "type": "Product", "name": "iPhone", "price": 999 }
  ```
- `PUT /api/nodes/:id` - Update a node
- `DELETE /api/nodes/:id?type=Product` - Delete a node

### Relationships

- `POST /api/relationships` - Create a relationship
  ```json
  { "startNodeId": 1, "endNodeId": 2, "type": "BELONGS_TO", "properties": {} }
  ```
- `DELETE /api/relationships/:id` - Delete a relationship

### Graph

- `GET /api/graph` - Get all nodes and relationships

## License

MIT

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Graph visualization by [@neo4j-nvl/react](https://github.com/neo4j-nvl/react)
- Powered by [Neo4j](https://neo4j.com/)
