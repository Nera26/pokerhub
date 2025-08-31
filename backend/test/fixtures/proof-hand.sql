CREATE TABLE IF NOT EXISTS "hand" (
  id uuid PRIMARY KEY,
  log text NOT NULL,
  commitment text NOT NULL,
  seed text,
  nonce text,
  settled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO hand (id, log, commitment, seed, nonce, settled)
VALUES ('11111111-1111-1111-1111-111111111111', '', 'd798d1fac6bd4bb1c11f50312760351013379a0ab6f0a8c0af8a506b96b2525a', 'aa', 'bb', true);
