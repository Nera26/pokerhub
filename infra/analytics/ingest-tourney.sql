-- ClickHouse Kafka ingestion for tournament topic
CREATE TABLE IF NOT EXISTS tourney_events_queue
(
  value String
)
ENGINE = Kafka
SETTINGS kafka_broker_list = '{{KAFKA_BROKERS}}',
        kafka_topic_list = 'tourney',
        kafka_group_name = 'tourney_ingest',
        kafka_format = 'JSONEachRow';

CREATE TABLE IF NOT EXISTS tourney_events
(
  value String
)
ENGINE = MergeTree()
ORDER BY tuple();

CREATE MATERIALIZED VIEW IF NOT EXISTS tourney_events_mv
TO tourney_events AS
SELECT value FROM tourney_events_queue;

