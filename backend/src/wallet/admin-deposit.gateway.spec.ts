import { AdminDepositGateway } from './admin-deposit.gateway';
import { ConfigService } from '@nestjs/config';

const mRun = jest.fn();
const mSubscribe = jest.fn();
const mConnect = jest.fn();
const mConsumer = { connect: mConnect, subscribe: mSubscribe, run: mRun } as any;

jest.mock('kafkajs', () => ({
  Kafka: jest.fn(() => ({ consumer: () => mConsumer })),
  Consumer: jest.fn(),
}));

describe('AdminDepositGateway', () => {
  afterEach(() => {
    jest.clearAllMocks();
    process.env.NODE_ENV = 'test';
  });

  it('broadcasts deposit.confirmed events', async () => {
    process.env.NODE_ENV = 'development';
    const config = {
      get: jest.fn().mockReturnValue('localhost:9092'),
    } as unknown as ConfigService;
    const gateway = new AdminDepositGateway(config);
    const emit = jest.fn();
    (gateway as any).server = { emit };

    await gateway.onModuleInit();
    expect(mSubscribe).toHaveBeenCalledWith({ topic: 'admin.deposit.confirmed' });
    const eachMessage = mRun.mock.calls[0][0].eachMessage;

    const payload = { depositId: '22222222-2222-2222-2222-222222222222' };
    await eachMessage({
      topic: 'admin.deposit.confirmed',
      message: { value: Buffer.from(JSON.stringify(payload)) },
    });

    expect(emit).toHaveBeenCalledWith('deposit.confirmed', payload);
  });
});
