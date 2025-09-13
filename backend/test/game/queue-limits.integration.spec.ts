import { createQueueScenario, collectGauge } from './queue-utils';

describe.each([
  {
    name: 'overload',
    queueLimit: 5,
    alertThreshold: 3,
    globalLimit: 3,
    enqueue: 6,
    rateChecks: 4,
    expectDrops: true,
    expectLimited: true,
  },
  {
    name: 'saturation',
    queueLimit: 5,
    globalLimit: 10,
    enqueue: 4,
    rateChecks: 9,
    expectDrops: false,
    expectLimited: false,
  },
])('GameGateway queue $name', (scenario) => {
  afterEach(() => {
    delete process.env.GATEWAY_QUEUE_LIMIT;
    delete process.env.WS_OUTBOUND_QUEUE_ALERT_THRESHOLD;
    delete process.env.GATEWAY_GLOBAL_LIMIT;
  });

  it('reports metrics with expected behavior', async () => {
    const { gateway, rooms, callbacks, dropCounter } = createQueueScenario({
      queueLimit: scenario.queueLimit,
      alertThreshold: scenario.alertThreshold,
      globalLimit: scenario.globalLimit,
    });

    const client: any = {
      id: 'c1',
      emit: jest.fn(),
      handshake: { headers: {}, auth: {}, address: '1.1.1.1' },
      conn: { remoteAddress: '1.1.1.1' },
      data: {},
    };

    for (let i = 0; i < scenario.enqueue; i++) {
      (gateway as any).enqueue(client, 'state', {});
    }

    let limited = false;
    for (let i = 0; i < scenario.rateChecks; i++) {
      // eslint-disable-next-line no-await-in-loop
      limited = await (gateway as any).isRateLimited(client);
    }

    const { maxCb, limitCb, thresholdCb, globalLimitCb, globalCountCb } = callbacks;
    const maxObs = collectGauge(maxCb);
    const limitObs = collectGauge(limitCb);
    const thresholdObs = collectGauge(thresholdCb);
    const globalLimitObs = collectGauge(globalLimitCb);
    const globalCountObs = collectGauge(globalCountCb);

    if (scenario.expectDrops) {
      expect(dropCounter).toHaveBeenCalled();
    } else {
      expect(dropCounter).not.toHaveBeenCalled();
    }

    expect(limited).toBe(scenario.expectLimited);
    expect(limitObs).toHaveBeenCalledWith(scenario.queueLimit);
    expect(globalLimitObs).toHaveBeenCalledWith(scenario.globalLimit);

    const maxVal = maxObs.mock.calls[0][0];
    const countVal = globalCountObs.mock.calls[0][0];

    if (scenario.alertThreshold !== undefined) {
      expect(thresholdObs).toHaveBeenCalledWith(scenario.alertThreshold);
      expect(maxVal).toBe(scenario.queueLimit);
      expect(maxVal).toBeGreaterThan(scenario.alertThreshold);
      expect(countVal).toBeGreaterThan(scenario.globalLimit);
    } else {
      expect(maxVal).toBeLessThan(scenario.queueLimit);
      expect(countVal).toBeLessThan(scenario.globalLimit);
    }

    await rooms.onModuleDestroy();
  });
});

