import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { GcsService } from '../../src/storage/gcs.service';

jest.mock('@google-cloud/storage', () => {
  const exists = jest.fn();
  const create = jest.fn();
  const download = jest.fn();
  const file = jest.fn(() => ({ download, save: jest.fn() }));
  const bucket = jest.fn(() => ({ exists, create, file }));
  const Storage = jest.fn(() => ({ bucket }));
  return { Storage, __mocks: { bucket, exists, create, file, download } };
});

const { __mocks } = jest.requireMock('@google-cloud/storage') as any;

function createService() {
  const config = {
    get: (key: string) => {
      const map: Record<string, string> = {
        'gcs.projectId': 'test',
        'gcs.endpoint': 'http://localhost',
        'gcs.bucket': 'test-bucket',
      };
      return map[key];
    },
  } as unknown as ConfigService;
  return new GcsService(config);
}

describe('GcsService (unit)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('ensureBucket', () => {
    it('logs unexpected errors', async () => {
      const errorSpy = jest
        .spyOn(Logger.prototype, 'error')
        .mockImplementation();
      __mocks.exists.mockRejectedValue(new Error('boom'));
      const service = createService();
      await service.ensureBucket();
      expect(errorSpy).toHaveBeenCalledWith(
        'Failed to ensure bucket test-bucket',
        expect.any(Error),
      );
    });
  });

  describe('downloadObject', () => {
    it('throws descriptive error when retrieval fails', async () => {
      __mocks.download.mockRejectedValue(new Error('not found'));
      const service = createService();
      await expect(service.downloadObject('key')).rejects.toThrow(
        'Failed to retrieve object key: not found',
      );
    });
  });
});
