-- ClickHouse tables for analytics events
CREATE TABLE IF NOT EXISTS game_event
(
  clientId String,
  action_id String,
  playerId Nullable(String),
  tableId Nullable(String),
  handId Nullable(String),
  type String,
  amount Nullable(Float64),
  ts DateTime DEFAULT now()
) ENGINE = MergeTree()
ORDER BY (tableId, handId, action_id);

CREATE TABLE IF NOT EXISTS tournament_event
(
  type String,
  tournamentId String,
  startDate Nullable(DateTime),
  ts DateTime DEFAULT now()
) ENGINE = MergeTree()
ORDER BY (tournamentId, ts);
