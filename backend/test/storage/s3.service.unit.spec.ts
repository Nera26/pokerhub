import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { S3Service } from '../../src/storage/s3.service';

jest.mock('@google-cloud/storage', () => {
  const saveMock = jest.fn();
  const downloadMock = jest.fn();
  const getSignedUrlMock = jest.fn();
  const fileMock = jest.fn(() => ({
    save: saveMock,
    download: downloadMock,
    getSignedUrl: getSignedUrlMock,
  }));
  const bucketMock = jest.fn(() => ({ file: fileMock, name: 'test-bucket' }));
  const createBucketMock = jest.fn();
  const Storage = jest.fn(() => ({
    bucket: bucketMock,
    createBucket: createBucketMock,
  }));
  return {
    Storage,
    __mock: {
      saveMock,
      downloadMock,
      getSignedUrlMock,
      bucketMock,
      fileMock,
      createBucketMock,
    },
  };
});

const { __mock } = require('@google-cloud/storage');

function createService() {
  const config = {
    get: (key: string) => {
      const map: Record<string, string> = {
        'gcp.projectId': 'proj',
        'gcp.endpoint': 'http://localhost',
        'gcp.clientEmail': 'email',
        'gcp.privateKey': 'secret',
        'gcp.bucket': 'test-bucket',
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

  it('logs unexpected errors when ensuring bucket', async () => {
    const errorSpy = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation();
    const service = createService();
    __mock.createBucketMock.mockRejectedValue(new Error('boom'));
    await service.ensureBucket();
    expect(errorSpy).toHaveBeenCalledWith(
      'Failed to create bucket test-bucket',
      expect.any(Error),
    );
  });

  it('uploads an object', async () => {
    const service = createService();
    await service.uploadObject('key', 'data');
    expect(__mock.bucketMock).toHaveBeenCalledWith('test-bucket');
    expect(__mock.fileMock).toHaveBeenCalledWith('key');
    expect(__mock.saveMock).toHaveBeenCalledWith('data');
  });

  it('downloads an object', async () => {
    const service = createService();
    __mock.downloadMock.mockResolvedValue([Buffer.from('hello')]);
    const buf = await service.downloadObject('key');
    expect(buf.toString()).toBe('hello');
  });

  it('throws descriptive error when download fails', async () => {
    const service = createService();
    __mock.downloadMock.mockRejectedValue(new Error('not found'));
    await expect(service.downloadObject('key')).rejects.toThrow(
      'Failed to retrieve object key: not found',
    );
  });

  it('creates a signed url', async () => {
    const service = createService();
    __mock.getSignedUrlMock.mockResolvedValue(['http://signed']);
    const url = await service.getSignedUrl('key');
    expect(url).toBe('http://signed');
  });
});

