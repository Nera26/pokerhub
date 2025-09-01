#!/usr/bin/env node
'use strict';

const { randomUUID } = require('crypto');
const Redis = require('ioredis');

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
const count = Number(process.env.RESERVATIONS || 1);
const prefix = process.env.RESERVATION_PREFIX || 'reservation';

async function main() {
  console.log(`Creating ${count} stalled reservation(s)...`);
  for (let i = 0; i < count; i++) {
    const handId = randomUUID();
    const key = `${prefix}:${handId}`;
    await redis.set(key, 'stalled');
    await redis.persist(key);
    console.log(`Stalled reservation for hand ${handId}. Cleanup: redis-cli del ${key}`);
  }
  console.log('Reservations will remain until manually deleted.');
  await redis.quit();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
