import { metrics } from '@opentelemetry/api';

describe('GameGateway frame retry', () => {
  it('retries with exponential backoff and drops after max attempts', async () => {
    jest.useFakeTimers();
    jest.resetModules();

    const frameRetries = { add: jest.fn() };
    const framesDropped = { add: jest.fn() };
    (metrics as any).getMeter = () => ({
      createHistogram: jest.fn().mockReturnValue({ record: jest.fn() }),
      createCounter: (name: string) => {
        if (name === 'frame_retries_total') return frameRetries;
        if (name === 'frames_dropped_total') return framesDropped;
        return { add: jest.fn() };
      },
      createObservableGauge: jest
        .fn()
        .mockReturnValue({ addCallback() {}, removeCallback() {} }),
    });

    const { GameGateway } = require('../../src/game/game.gateway');
    const { RoomManager } = require('../../src/game/room.service');
    const { ClockService } = require('../../src/game/clock.service');

    class DummyAnalytics { async recordGameEvent() {} }
    class DummyRepo { async findOne() { return null; } async find() { return []; } async save() {} }
    class DummyRedis {
      async incr() { return 1; }
      async expire() { return 1; }
      async exists() { return 0; }
      async set() { return 'OK'; }
      async hgetall() { return {}; }
      pipeline() { return { hdel() { return this; }, exec: async () => [] } as any; }
    }

    const gateway = new GameGateway(
      new RoomManager() as any,
      new DummyAnalytics() as any,
      new ClockService(),
      new DummyRepo() as any,
      new DummyRepo() as any,
      new DummyRedis() as any,
    );

    const times: number[] = [];
    const client: any = {
      id: 'c1',
      emit: jest.fn(() => times.push(Date.now())),
    };

    (gateway as any).trackFrame(client, 'state', { frameId: 'f1' });

    jest.advanceTimersByTime(200);
    expect(frameRetries.add).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(400);
    expect(frameRetries.add).toHaveBeenCalledTimes(2);

    jest.advanceTimersByTime(800);
    expect(frameRetries.add).toHaveBeenCalledTimes(3);

    jest.advanceTimersByTime(1600);
    expect(frameRetries.add).toHaveBeenCalledTimes(4);
    expect(framesDropped.add).toHaveBeenCalledTimes(1);

    expect(times).toEqual([200, 600, 1400, 3000]);

    jest.useRealTimers();
  });
});
