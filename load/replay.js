#!/usr/bin/env node
import fs from 'fs';
import { spawnSync } from 'child_process';
import path from 'path';

const seedPath = process.argv[2] || path.resolve('seed.txt');
const seed = fs.readFileSync(seedPath, 'utf-8').trim();
const script = path.resolve('./load/k6-table-actions.js');
spawnSync('k6', ['run', script], {
  stdio: 'inherit',
  env: { ...process.env, SEED: seed, CHAOS_MODE: '1' },
});
