-- ClickHouse Kafka ingestion for wallet topic
CREATE TABLE IF NOT EXISTS wallet_events_queue
(
  value String
)
ENGINE = Kafka
SETTINGS kafka_broker_list = '{{KAFKA_BROKERS}}',
        kafka_topic_list = 'wallet',
        kafka_group_name = 'wallet_ingest',
        kafka_format = 'JSONEachRow';

CREATE TABLE IF NOT EXISTS wallet_events
(
  value String
)
ENGINE = MergeTree()
ORDER BY tuple();

CREATE MATERIALIZED VIEW IF NOT EXISTS wallet_events_mv
TO wallet_events AS
SELECT value FROM wallet_events_queue;

