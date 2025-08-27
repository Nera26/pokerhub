export async function ingestEvent(event: Record<string, unknown>): Promise<void> {
  const endpoint = process.env.CLICKHOUSE_URL || 'http://clickhouse:8123';
  const body = JSON.stringify(event) + '\n';
  await fetch(`${endpoint}/?query=INSERT%20INTO%20events%20FORMAT%20JSONEachRow`, {
    method: 'POST',
    body,
    headers: { 'Content-Type': 'application/json' },
  });
}
