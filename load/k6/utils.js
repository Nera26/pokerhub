import { setupSocketProxy } from '../lib/socket-stress.js';

export function setup() {
  const proxy = setupSocketProxy();
  return { ...proxy, start: Date.now() };
}

export function teardown(data) {
  data.elapsed = Date.now() - data.start;
  return data;
}
