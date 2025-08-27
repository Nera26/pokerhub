import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { S3Service } from '../../src/storage/s3.service';

jest.mock('@aws-sdk/client-s3', () => {
  const send = jest.fn();
  const S3Client = jest.fn(() => ({ send }));
  return {
    S3Client,
    CreateBucketCommand: jest.fn(),
    GetObjectCommand: jest.fn(),
    PutObjectCommand: jest.fn(),
  };
});

function createService() {
  const config = {
    get: (key: string) => {
      const map: Record<string, string> = {
        's3.region': 'us-east-1',
        's3.endpoint': 'http://localhost',
        's3.accessKeyId': 'id',
        's3.secretAccessKey': 'secret',
        's3.bucket': 'test-bucket',
      };
      return map[key];
    },
  } as unknown as ConfigService;
  return new S3Service(config);
}

describe('S3Service (unit)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('ensureBucket', () => {
    it('logs unexpected errors', async () => {
      const errorSpy = jest
        .spyOn(Logger.prototype, 'error')
        .mockImplementation();
      const service = createService();
      const clientSend = (service as unknown as { client: { send: jest.Mock } })
        .client.send;
      const err = new Error('boom');
      clientSend.mockRejectedValue(err);
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
      const clientSend = (service as unknown as { client: { send: jest.Mock } })
        .client.send;
      clientSend.mockRejectedValue(new Error('not found'));
      await expect(service.downloadObject('key')).rejects.toThrow(
        'Failed to retrieve object key: not found',
      );
    });

    it('throws descriptive error when stream fails', async () => {
      const service = createService();
      const clientSend = (service as unknown as { client: { send: jest.Mock } })
        .client.send;
      const iterable = {
        // eslint-disable-next-line @typescript-eslint/require-await, require-yield
        async *[Symbol.asyncIterator]() {
          throw new Error('stream fail');
        },
      };
      clientSend.mockResolvedValue({ Body: iterable });
      await expect(service.downloadObject('key')).rejects.toThrow(
        'Error streaming object key: stream fail',
      );
    });
  });
});
