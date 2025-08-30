import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { GcsService } from '../../src/storage/gcs.service';

const save = jest.fn();
const download = jest.fn();
const getSignedUrl = jest.fn();
const file = jest.fn(() => ({ save, download, getSignedUrl }));
const exists = jest.fn();
const bucket = jest.fn(() => ({ file, exists }));
const createBucket = jest.fn();

jest.mock('@google-cloud/storage', () => ({
  Storage: jest.fn(() => ({ bucket, createBucket })),
}));

function createService() {
  const config = {
    get: (key: string) => {
      const map: Record<string, string> = {
        'gcs.projectId': 'proj',
        'gcs.keyFilename': 'key',
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
      const service = createService();
      const err = new Error('boom');
      createBucket.mockRejectedValue(err);
      await service.ensureBucket();
      expect(errorSpy).toHaveBeenCalledWith(
        'Failed to create bucket test-bucket',
        err,
      );
    });
  });

  describe('downloadObject', () => {
    it('throws descriptive error when retrieval fails', async () => {
      const service = createService();
      download.mockRejectedValue(new Error('not found'));
      await expect(service.downloadObject('key')).rejects.toThrow(
        'Failed to retrieve object key: not found',
      );
    });
  });
});

