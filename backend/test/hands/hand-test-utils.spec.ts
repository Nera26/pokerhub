import jwt from 'jsonwebtoken';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { auth, writeHandLog, removeHandLog } from './hand-test-utils';

const LOG_DIR = join(__dirname, '../../../storage/hand-logs');

describe('hand-test-utils', () => {
  it('creates auth token with user id', () => {
    const header = auth('user');
    const token = header.replace('Bearer ', '');
    const payload = jwt.verify(token, 'secret') as any;
    expect(payload.sub).toBe('user');
  });

  it('writes and removes hand logs', () => {
    const frames = [0, { type: 'start' }, {}, {}];
    writeHandLog('util', frames);
    const file = join(LOG_DIR, 'util.jsonl');
    expect(existsSync(file)).toBe(true);
    expect(readFileSync(file, 'utf8')).toBe(`${JSON.stringify(frames)}\n`);
    removeHandLog('util');
    expect(existsSync(file)).toBe(false);
  });
});
