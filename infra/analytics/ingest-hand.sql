-- ClickHouse Kafka ingestion for hand topic
CREATE TABLE IF NOT EXISTS hand_events_queue
(
  value String
)
ENGINE = Kafka
SETTINGS kafka_broker_list = '{{KAFKA_BROKERS}}',
        kafka_topic_list = 'hand',
        kafka_group_name = 'hand_ingest',
        kafka_format = 'JSONEachRow';

CREATE TABLE IF NOT EXISTS hand_events
(
  value String
)
ENGINE = MergeTree()
ORDER BY tuple();

CREATE MATERIALIZED VIEW IF NOT EXISTS hand_events_mv
TO hand_events AS
SELECT value FROM hand_events_queue;

