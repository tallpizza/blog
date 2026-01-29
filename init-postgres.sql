-- Enable logical replication
ALTER SYSTEM SET wal_level = logical;
ALTER SYSTEM SET max_wal_senders = 4;
ALTER SYSTEM SET max_replication_slots = 4;

-- Create publication for CDC
CREATE PUBLICATION cdc_publication FOR ALL TABLES;

-- Create replication slot
SELECT * FROM pg_create_logical_replication_slot('cdc_slot', 'test_decoding');
