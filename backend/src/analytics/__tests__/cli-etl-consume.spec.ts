const runMock = jest.fn();
const get = jest.fn().mockReturnValue({ run: runMock });
const close = jest.fn();
const createApplicationContext = jest
  .fn()
  .mockResolvedValue({ get, close });

jest.mock('@nestjs/core', () => ({
  NestFactory: { createApplicationContext },
}));
jest.mock('../../app.module', () => ({}));
jest.mock('../etl.service', () => ({}));

describe('CLI etl:consume', () => {
  it('runs EtlService.run', async () => {
    const { run } = require('../../../../tools/cli');
    await run('etl:consume');
    expect(createApplicationContext).toHaveBeenCalled();
    expect(get).toHaveBeenCalled();
    expect(runMock).toHaveBeenCalled();
    expect(close).toHaveBeenCalled();
  });
});

