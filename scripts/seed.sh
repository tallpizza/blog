#!/bin/bash
set -e

NEO4J_USER=${NEO4J_USER:-neo4j}
NEO4J_PASSWORD=${NEO4J_PASSWORD:-neo4j_password}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Seeding Neo4j database..."

cat "$SCRIPT_DIR/seed-neo4j.cypher" | docker exec -i neo4j cypher-shell \
  -u "$NEO4J_USER" \
  -p "$NEO4J_PASSWORD"

echo "✓ Seed completed"
