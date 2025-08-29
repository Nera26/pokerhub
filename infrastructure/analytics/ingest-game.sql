-- Kafka ingestion for game events
CREATE TABLE IF NOT EXISTS game_events_queue
(
  value String
) ENGINE = Kafka
SETTINGS kafka_broker_list = '{{KAFKA_BROKERS}}',
        kafka_topic_list = 'hand',
        kafka_group_name = 'game_events_ingest',
        kafka_format = 'JSONEachRow';

CREATE MATERIALIZED VIEW IF NOT EXISTS game_events_mv
TO game_event AS
SELECT
  JSONExtractString(value, 'clientId') AS clientId,
  JSONExtractString(value, 'action.actionId') AS action_id,
  JSONExtractString(value, 'action.playerId') AS playerId,
  JSONExtractString(value, 'action.tableId') AS tableId,
  JSONExtractString(value, 'action.handId') AS handId,
  JSONExtractString(value, 'action.type') AS type,
  JSONExtractFloat(value, 'action.amount') AS amount,
  now() AS ts
FROM game_events_queue;
