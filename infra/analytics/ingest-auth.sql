-- ClickHouse Kafka ingestion for auth topic
CREATE TABLE IF NOT EXISTS auth_events_queue
(
  value String
)
ENGINE = Kafka
SETTINGS kafka_broker_list = '{{KAFKA_BROKERS}}',
        kafka_topic_list = 'auth',
        kafka_group_name = 'auth_ingest',
        kafka_format = 'JSONEachRow';

CREATE TABLE IF NOT EXISTS auth_events
(
  value String
)
ENGINE = MergeTree()
ORDER BY tuple();

CREATE MATERIALIZED VIEW IF NOT EXISTS auth_events_mv
TO auth_events AS
SELECT value FROM auth_events_queue;

