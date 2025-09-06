import http from 'k6/http';

export function setupSocketProxy({
  host = __ENV.TOXIPROXY_URL || 'http://localhost:8474',
  name = __ENV.TOXIPROXY_NAME || 'pokerhub_ws',
  listen = `0.0.0.0:${__ENV.PROXY_PORT || '3001'}`,
  upstream = __ENV.UPSTREAM || 'localhost:4000',
  latencyMs = Number(__ENV.LATENCY_MS || 200),
  jitterMs = Number(__ENV.JITTER_MS || 200),
  packetLoss = Number(__ENV.PACKET_LOSS || 0.05),
} = {}) {
  try {
    http.del(`${host}/proxies/${name}`);
  } catch (e) {
    /* ignore */
  }
  http.post(
    `${host}/proxies`,
    JSON.stringify({ name, listen, upstream }),
    { headers: { 'Content-Type': 'application/json' } },
  );
  try {
    http.del(`${host}/proxies/${name}/toxics/all`);
  } catch (e) {
    /* ignore */
  }
  http.post(
    `${host}/proxies/${name}/toxics`,
    JSON.stringify({
      name: 'latency',
      type: 'latency',
      attributes: { latency: latencyMs, jitter: jitterMs },
    }),
    { headers: { 'Content-Type': 'application/json' } },
  );
  http.post(
    `${host}/proxies/${name}/toxics`,
    JSON.stringify({
      name: 'packet_loss',
      type: 'timeout',
      attributes: { timeout: 1 },
      toxicity: packetLoss,
    }),
    { headers: { 'Content-Type': 'application/json' } },
  );
  return { wsUrl: `ws://localhost:${listen.split(':')[1]}/game` };
}
