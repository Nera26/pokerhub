import { spawn } from 'child_process';
import Redis from 'ioredis';
import { RoomManager } from '../src/game/room.service';

describe('RoomWorker dealing flag', () => {
  let server: any;
  let redis: Redis;
  let manager: RoomManager;

  beforeAll(async () => {
    server = spawn('redis-server', ['--save', '""', '--appendonly', 'no']);
    redis = new Redis();
    await new Promise((resolve) => redis.once('ready', resolve));
    manager = new RoomManager(redis as any);
  });

  afterAll(async () => {
    await manager.onModuleDestroy();
    await redis.quit();
    server.kill();
  });

  it('halts dealing when disabled for room', async () => {
    await redis.set('feature-flag:room:t1:dealing', '0');
    const room = manager.get('t1');
    await room.apply({ type: 'postBlind', playerId: 'p1', amount: 1 });
    const state = await room.apply({ type: 'postBlind', playerId: 'p2', amount: 2 });
    expect(state.phase).toBe('WAIT_BLINDS');
    expect(state.players.every((p: any) => p.holeCards === undefined)).toBe(true);
  });
});
