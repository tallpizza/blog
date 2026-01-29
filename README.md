# Graph Admin with PostgreSQL/Neo4j CDC

A graph database administration UI with Change Data Capture (CDC) pipeline from PostgreSQL to Neo4j.

## Overview

This project demonstrates a complete CDC pipeline where:
- **PostgreSQL** serves as the source of truth
- **Debezium** captures changes from PostgreSQL
- **Redpanda** (Kafka-compatible) streams CDC events
- **Neo4j** syncs data via Kafka Connect sink connector
- **Next.js UI** provides graph visualization and CRUD operations

## Architecture

```
PostgreSQL (SOT)
  ↓ (Debezium CDC)
Redpanda Topics
  ↓ (Neo4j Sink Connector)
Neo4j Graph DB
  ↓ (Bolt Protocol)
Next.js UI (Graph Visualization + CRUD)
```

## Features

- ✅ **CDC Pipeline**: PostgreSQL → Redpanda → Neo4j (< 5 seconds latency)
- ✅ **Graph Visualization**: Interactive graph with @neo4j-nvl/react
- ✅ **Node CRUD**: Create, read, update, delete nodes via UI
- ✅ **Event Monitoring**: CDC event viewer with Redpanda Console integration
- ✅ **E-commerce Schema**: Categories, Products, Customers, Orders, Order Items

## Tech Stack

- **Frontend**: Next.js 16, React 19, TanStack Query, @neo4j-nvl/react
- **Backend**: Next.js API Routes, Neo4j Driver, PostgreSQL (pg)
- **Database**: PostgreSQL 15 (logical replication), Neo4j 5.26.20 Enterprise
- **CDC**: Debezium 2.3.4, Kafka Connect, Redpanda
- **Testing**: Vitest, Playwright

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Bun (or Node.js 18+)

### 1. Start Infrastructure

```bash
docker compose up -d
```

This starts:
- PostgreSQL (port 5433)
- Neo4j (HTTP: 7475, Bolt: 7688)
- Redpanda (port 9092)
- Kafka Connect (port 8084)
- Redpanda Console (port 8080)

### 2. Verify Services

```bash
docker compose ps
```

All services should show "healthy" status.

### 3. Start Next.js App

```bash
cd apps/web
bun install
bun dev
```

Open http://localhost:3000

### 4. Explore

- **Graph UI**: http://localhost:3000
- **Event Viewer**: http://localhost:3000/events
- **Redpanda Console**: http://localhost:8080
- **Neo4j Browser**: http://localhost:7475 (user: neo4j, password: neo4j_password)

## Testing

```bash
cd apps/web

# Unit tests (Vitest)
bun test

# E2E tests (Playwright)
bun run test:e2e

# All tests
bun test && bun run test:e2e
```

## CDC Pipeline Verification

```bash
# Insert a product in PostgreSQL
docker exec postgres psql -U admin -d ecommerce -c \
  "INSERT INTO products (name, price, category_id) VALUES ('Test Product', 99.99, 1)"

# Wait 5 seconds for CDC sync
sleep 5

# Verify in Neo4j
curl -s http://localhost:7475/db/neo4j/tx/commit \
  -H "Content-Type: application/json" \
  -u neo4j:neo4j_password \
  -d '{"statements":[{"statement":"MATCH (p:Product {name: \"Test Product\"}) RETURN p"}]}' | jq
```

## Database Schema

### PostgreSQL Tables

- `categories` - Product categories
- `products` - Products with prices
- `customers` - Customer information
- `orders` - Customer orders
- `order_items` - Order line items

### Neo4j Graph Model

- Nodes: `:Category`, `:Product`, `:Customer`, `:Order`
- Relationships:
  - `(:Product)-[:BELONGS_TO]->(:Category)`
  - `(:Customer)-[:PLACED]->(:Order)`
  - `(:Order)-[:CONTAINS]->(:Product)`

## Configuration

### Environment Variables

Copy `.env.example` to `.env` and adjust as needed:

```bash
POSTGRES_USER=admin
POSTGRES_PASSWORD=postgres_password
POSTGRES_DB=ecommerce
NEO4J_AUTH=neo4j/neo4j_password
```

### Ports

- PostgreSQL: 5433 (non-standard to avoid conflicts)
- Neo4j HTTP: 7475
- Neo4j Bolt: 7688
- Redpanda: 9092
- Kafka Connect: 8084
- Redpanda Console: 8080
- Next.js: 3000

## Known Limitations

1. **Neo4j CDC Source**: Blocked due to Neo4j Connector 5.1.19 incompatibility with Neo4j 5.26.20
   - Workaround: Use Redpanda Console to view PostgreSQL CDC events
   
2. **Drag-to-Link**: Not implemented in current version
   - Relationships can be created via API
   - UI enhancement planned for v2

3. **Single-node Setup**: Not production-ready for high availability

## Project Structure

```
graph-admin/
├── docker-compose.yml          # All services
├── db/
│   ├── init.sql               # PostgreSQL schema + CDC config
│   └── seed.sql               # Sample data
├── connectors/
│   ├── postgres-source.json   # Debezium connector
│   └── neo4j-sink.json        # Neo4j sink connector
├── apps/web/                  # Next.js application
│   ├── app/                   # App Router pages
│   ├── components/            # React components
│   ├── lib/                   # Database clients
│   ├── __tests__/             # Vitest unit tests
│   └── tests/                 # Playwright E2E tests
└── .sisyphus/                 # Project planning & notes
```

## Development

### Adding a New Node Type

1. Add table to `db/init.sql`
2. Configure `REPLICA IDENTITY FULL`
3. Add to Debezium `table.include.list`
4. Add Cypher mapping in `neo4j-sink.json`
5. Update UI form in `NodePanel.tsx`

### Debugging CDC

```bash
# Check connector status
curl -s http://localhost:8084/connectors/postgres-source/status | jq

# View Redpanda topics
docker exec redpanda rpk topic list

# Consume CDC events
docker exec redpanda rpk topic consume pg-cdc.public.products --num 10
```

## License

MIT

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Graph visualization by [@neo4j-nvl/react](https://github.com/neo4j-nvl/react)
- CDC powered by [Debezium](https://debezium.io/)
- Streaming by [Redpanda](https://redpanda.com/)
