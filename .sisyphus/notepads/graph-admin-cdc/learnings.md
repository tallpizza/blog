# Graph Admin CDC - Learnings

## Docker Compose Infrastructure Setup

### PostgreSQL Configuration
- PostgreSQL 15-alpine image used for lightweight footprint
- Logical replication enabled via command flags: `wal_level=logical`, `max_wal_senders=4`, `max_replication_slots=4`
- Init script creates publication and replication slot for CDC
- Healthcheck uses `pg_isready` to verify database availability

### Neo4j Configuration
- Neo4j 5-enterprise image required for CDC features (not available in community edition)
- CDC enabled via environment variables: `NEO4J_dbms_cdc_enabled=true`, `NEO4J_db_cdc_mode=FULL`
- License agreement must be accepted: `NEO4J_ACCEPT_LICENSE_AGREEMENT=yes`
- Memory constraints set to 512m heap for development environment
- Plugins directory mounted at `/var/lib/neo4j/plugins` for APOC installation
- Healthcheck validates Neo4j HTTP endpoint with authentication

### Redpanda Configuration
- Single-node Redpanda cluster for development
- Dual advertise addresses: PLAINTEXT for internal (29092) and OUTSIDE for external (9092)
- Schema Registry enabled on port 8081
- RPC communication on port 33145
- Healthcheck uses `rpk cluster info` command

### Kafka Connect Configuration
- Confluent Kafka Connect 7.5.0 image
- Automatic installation of Debezium PostgreSQL connector and Neo4j connector via confluent-hub
- JSON converters for key/value serialization
- Storage topics created automatically with replication factor 1
- Healthcheck validates REST API endpoint

### Redpanda Console
- Web UI for Kafka/Redpanda cluster management
- Connects to Redpanda broker on internal network
- Accessible on port 8080

### Network & Volumes
- All services connected via `graph_network` bridge network
- Persistent volumes for data: postgres_data, neo4j_data, neo4j_logs, redpanda_data, kafka_connect_data
- Bind mounts for configuration: init-postgres.sql, plugins directory

### Healthchecks
- All services configured with 10s interval, 5s timeout, 5 retries
- PostgreSQL: `pg_isready` command
- Neo4j: HTTP endpoint with authentication
- Redpanda: `rpk cluster info` command
- Kafka Connect: REST API `/connectors` endpoint
- Redpanda Console: HTTP GET on root path

### Environment Variables
- All sensitive values (passwords) configurable via .env file
- Default values provided in docker-compose.yml with fallback syntax
- .env.example documents all required configuration

### Known Limitations
- Single-node setup (not production-ready for HA)
- No TLS/SSL configuration
- No volume backup strategies
- Development memory constraints on Neo4j
## Task 2: PostgreSQL Schema & CDC Configuration

### Schema Design
- Created 5-table E-commerce schema: categories, products, customers, orders, order_items
- Used SERIAL for auto-incrementing PKs (standard PostgreSQL pattern)
- Foreign keys properly configured with NOT NULL constraints
- DECIMAL(10,2) for monetary values (price, total)
- TIMESTAMP DEFAULT CURRENT_TIMESTAMP for order creation tracking

### CDC Configuration
- REPLICA IDENTITY FULL required on ALL tables for Debezium to capture old values in UPDATE/DELETE
- Publication `dbz_publication` created with FOR ALL TABLES (captures all table changes)
- ALTER SYSTEM SET wal_level = logical enables logical replication at PostgreSQL level

### Sample Data
- 3 categories (Electronics, Books, Clothing)
- 7 products across categories with realistic pricing
- 3 customers with unique emails
- 3 orders with realistic timestamps (5, 3, 1 days ago)
- 8 order_items linking orders to products with quantities and prices

### Key Patterns
- Foreign key constraints enforce referential integrity
- UNIQUE constraints on name (categories) and email (customers)
- Order totals calculated from order_items (sum of quantity * price)
- Realistic E-commerce data relationships maintained

### Files Created
- db/init.sql: Schema + CDC configuration (61 lines)
- db/seed.sql: Sample data (42 lines)

## Task 1 Fixes: Docker Image Names & Configuration

### Image Name Corrections
- Redpanda image: `docker.redpanda.com/redpanda:latest` → `redpandadata/redpanda:latest`
- Redpanda Console image: `docker.redpanda.com/console:latest` → `redpandadata/console:latest`
- Both images are available on Docker Hub under redpandadata organization

### Neo4j CDC Configuration
- Neo4j 5 does NOT support `dbms.cdc.enabled` or `db.cdc.mode` environment variables
- These settings are not recognized in Neo4j 5-enterprise and cause startup failure
- Removed invalid CDC environment variables; Neo4j 5 CDC is configured differently (via plugins/extensions)
- Enterprise image still required for CDC capabilities

### Redpanda Command Configuration
- `--advertise-schema-registry-addr` is NOT a valid redpanda command option
- Removed invalid advertise option; schema registry is automatically available on port 8081
- Simplified command to only include valid redpanda start options

### Port Allocation
- PostgreSQL: Changed from 5432 to 5433 (port 5432 already in use by other container)
- Neo4j HTTP: Changed from 7474 to 7475 (port 7474 already in use)
- Neo4j Bolt: Changed from 7687 to 7688 (port 7687 already in use)
- Kafka Connect: Changed from 8083 to 8084 (port 8083 already in use)
- Redpanda Console: Kept on 8080 (available)
- Redpanda Kafka: Kept on 9092 (available)

### Verification Results
- ✅ PostgreSQL: `SHOW wal_level` returns "logical"
- ✅ Neo4j: HTTP endpoint responds with valid JSON (test query returns 1)
- ✅ Redpanda: `rpk cluster info` shows 1 broker with 4 topics created
- ✅ Kafka Connect: REST API `/connectors` returns empty array (ready for connectors)
- ✅ Redpanda Console: HTTP 200 response with HTML content

### All Services Status
- postgres: healthy
- neo4j: healthy
- redpanda: healthy
- kafka-connect: healthy
- redpanda-console: healthy

## Database Name Mismatch Fix

### Issue
- docker-compose.yml had `POSTGRES_DB: graph_db`
- db/init.sql expected `ecommerce` database
- Acceptance criteria required `ecommerce` database

### Root Cause
- init-postgres.sql (CDC config only) was mounted instead of db/init.sql
- Database name mismatch between docker-compose and initialization scripts

### Solution
1. Updated docker-compose.yml: `POSTGRES_DB: ecommerce`
2. Updated .env.example: `POSTGRES_DB=ecommerce`
3. Fixed volume mount: `./db/init.sql` and `./db/seed.sql`
4. Removed invalid `CREATE DATABASE IF NOT EXISTS` syntax (PostgreSQL doesn't support this)
5. Removed `\c ecommerce` connection command (not needed when POSTGRES_DB is set)

### PostgreSQL Initialization Flow
- Docker creates database specified in POSTGRES_DB environment variable
- Scripts in /docker-entrypoint-initdb.d/ run in alphabetical order
- init.sql creates tables and configures CDC
- seed.sql populates sample data
- No need to explicitly create or connect to database in init scripts

### Verification Results
- ✅ All 5 tables created: categories, products, customers, orders, order_items
- ✅ 7 products in database (>= 5 required)
- ✅ Sample data properly seeded with realistic values
- ✅ Foreign key relationships intact
- ✅ REPLICA IDENTITY FULL configured for CDC

### Key Learnings
- PostgreSQL `CREATE DATABASE` doesn't support `IF NOT EXISTS` syntax
- Docker Compose POSTGRES_DB environment variable automatically creates the database
- Init scripts should not try to create or switch databases when POSTGRES_DB is set
- Multiple SQL files in /docker-entrypoint-initdb.d/ are executed in order

## Task 4: Debezium PostgreSQL Source Connector

### Debezium Version Compatibility Issue
- Debezium 3.x (latest from Confluent Hub) is NOT compatible with Confluent Platform 7.5.0
- Debezium 3.x requires Java 17+ and has different classloading requirements
- Symptom: Plugin loads but connector class not discovered (no "Added plugin" log message)
- Solution: Use Debezium 2.3.4.Final downloaded directly from Maven Central

### Manual Debezium Installation
- Confluent Hub doesn't have Debezium 2.3.x versions available
- Downloaded from Maven Central: `https://repo1.maven.org/maven2/io/debezium/debezium-connector-postgres/2.3.4.Final/debezium-connector-postgres-2.3.4.Final-plugin.tar.gz`
- Extracted to `/usr/share/confluent-hub-components/debezium-connector-postgresql`
- Debezium 2.3.4.Final successfully loaded and registered as connector plugin

### Connector Configuration
- `connector.class`: `io.debezium.connector.postgresql.PostgresConnector`
- `plugin.name`: `pgoutput` (PostgreSQL 10+ built-in logical decoding plugin)
- `slot.name`: `debezium_slot` (matches replication slot created in init.sql)
- `publication.name`: `dbz_publication` (matches publication created in init.sql)
- `publication.autocreate.mode`: `disabled` (use existing publication)
- `table.include.list`: Explicit list of tables to capture (public.categories, public.products, etc.)
- JSON converters with `schemas.enable: false` for simpler message format

### Topic Naming Convention
- Pattern: `{topic.prefix}.{schema}.{table}`
- Example: `pg-cdc.public.products`
- All 5 tables created topics: categories, products, customers, orders, order_items

### CDC Event Structure
- `op`: Operation type ("r" = read/snapshot, "c" = create/insert, "u" = update, "d" = delete)
- `before`: Previous row state (null for INSERT and snapshot)
- `after`: New row state (null for DELETE)
- `source`: Metadata (connector version, database, table, LSN, transaction ID, timestamp)
- `ts_ms`: Event timestamp in milliseconds

### Snapshot Behavior
- Debezium performs initial snapshot of existing data on first start
- Snapshot events have `op: "r"` and `snapshot: "first_in_data_collection"`
- After snapshot, connector switches to streaming mode for real-time CDC

### Data Type Handling
- DECIMAL/NUMERIC types are base64 encoded in JSON (e.g., price "Jw8=" for 99.99)
- This is because JSON doesn't have native decimal type
- Use Avro or Protobuf converters for proper decimal handling, or decode base64 in consumer

### Verification Results
- ✅ Connector status: RUNNING
- ✅ 5 topics created for all tables
- ✅ INSERT event captured: "Test CDC" product with op="c"
- ✅ Event appears in topic within 3 seconds
- ✅ Snapshot data also available (7 existing products)

### Key Learnings
- Always check Debezium version compatibility with Kafka Connect platform
- Manual installation from Maven Central is reliable fallback when Confluent Hub fails
- pgoutput plugin is simplest choice for PostgreSQL 10+ (no additional plugins needed)
- REPLICA IDENTITY FULL is required for capturing old values in UPDATE/DELETE events
- JSON converters are simple but have limitations with decimal types

## Task 5: Neo4j Sink Connector with Cypher Strategy

### Neo4j Kafka Connector Configuration
- `connector.class`: `org.neo4j.connectors.kafka.sink.Neo4jConnector`
- Cypher strategy uses `neo4j.cypher.topic.{topic-name}` configuration pattern
- Each topic requires explicit Cypher query mapping
- Event binding: `event.after` (new state), `event.before` (old state), `event.op` (operation type)

### APOC Requirement for DELETE Handling
- Neo4j Cypher doesn't support conditional logic (IF/CASE) in standard queries
- APOC (Awesome Procedures On Cypher) required for `apoc.do.when()` conditional execution
- Downloaded APOC 5.26.20 core JAR to plugins directory
- Neo4j restart required after adding APOC plugin
- Verified with `RETURN apoc.version()`

### Cypher Query Patterns
- **INSERT/UPDATE**: `MERGE (n:Label {id: after.id}) SET n.prop = after.prop`
- **Relationships**: `MERGE (a)-[:REL_TYPE]->(b)` after merging both nodes
- **DELETE**: `MATCH (n:Label {id: before.id}) DETACH DELETE n`
- **Conditional**: `CALL apoc.do.when(event.op = 'd', 'delete_query', 'upsert_query', {params}) YIELD value RETURN value`

### Event Operation Types
- `op = 'r'`: Read (snapshot)
- `op = 'c'`: Create (INSERT)
- `op = 'u'`: Update
- `op = 'd'`: Delete

### Data Type Handling
- DECIMAL/NUMERIC types are base64 encoded in JSON (e.g., "E4g=" for 75.50)
- This is a limitation of JSON converters (no native decimal type)
- Neo4j stores the base64 value as-is
- For proper decimal handling, use Avro or Protobuf converters

### Relationship Mapping Strategy
- **products → categories**: `(Product)-[:BELONGS_TO]->(Category)` via `category_id`
- **orders → customers**: `(Customer)-[:PLACED]->(Order)` via `customer_id`
- **order_items**: `(Order)-[:CONTAINS {quantity, price}]->(Product)` via `order_id` and `product_id`

### Error Handling Configuration
- `errors.tolerance: all` - Continue processing on errors
- `errors.log.enable: true` - Log errors for debugging
- `errors.log.include.messages: true` - Include full error messages

### Sync Performance
- INSERT events appear in Neo4j within 5 seconds
- DELETE events processed with same latency
- Relationships created atomically with nodes

### Key Learnings
- Neo4j connector requires explicit strategy configuration per topic (error: "Topic is not assigned a sink strategy")
- APOC is essential for CDC DELETE handling without complex workarounds
- `WITH event WHERE event.after IS NOT NULL` filters out DELETE events (not suitable for full CDC)
- MERGE is idempotent and safe for both INSERT and UPDATE operations
- DETACH DELETE removes node and all its relationships
- Connector processes snapshot events (op='r') on first start

### Verification Results
- ✅ Connector status: RUNNING
- ✅ INSERT: Product synced to Neo4j within 5 seconds
- ✅ Relationships: Product linked to Category via BELONGS_TO
- ✅ DELETE: Product removed from Neo4j with DETACH DELETE
- ✅ All 5 tables configured with Cypher mappings

### Known Limitations
- Base64 encoding for DECIMAL types (use Avro converters for production)
- APOC dependency adds complexity to deployment
- No built-in schema evolution handling
- Single Cypher query per topic (no multi-statement transactions)

