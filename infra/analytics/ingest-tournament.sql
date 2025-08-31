-- Kafka ingestion for tournament events
CREATE TABLE IF NOT EXISTS tournament_events_queue
(
  value String
) ENGINE = Kafka
SETTINGS kafka_broker_list = '{{KAFKA_BROKERS}}',
        kafka_topic_list = 'tourney',
        kafka_group_name = 'tournament_events_ingest',
        kafka_format = 'JSONEachRow';

CREATE MATERIALIZED VIEW IF NOT EXISTS tournament_events_mv
TO tournament_event AS
SELECT
  JSONExtractString(value, 'type') AS type,
  JSONExtractString(value, 'tournamentId') AS tournamentId,
  parseDateTimeBestEffortOrNull(JSONExtractString(value, 'startDate')) AS startDate,
  now() AS ts
FROM tournament_events_queue;
