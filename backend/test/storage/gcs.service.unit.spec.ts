import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { GcsService } from '../../src/storage/gcs.service';

jest.mock('@google-cloud/storage', () => {
  const exists = jest.fn();
  const create = jest.fn();
  const download = jest.fn();
  const save = jest.fn();
  const getSignedUrl = jest.fn();
  const file = jest.fn(() => ({ download, save, getSignedUrl }));
  const bucket = jest.fn(() => ({ exists, create, file }));
  const Storage = jest.fn(() => ({ bucket }));
  return {
    Storage,
    __mocks: { bucket, exists, create, file, download, save, getSignedUrl },
  };
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
    it('downloads object contents', async () => {
      __mocks.download.mockResolvedValue([Buffer.from('data')]);
      const service = createService();
      const buf = await service.downloadObject('key');
      expect(buf.toString()).toBe('data');
      expect(__mocks.file).toHaveBeenCalledWith('key');
      expect(__mocks.download).toHaveBeenCalled();
    });

    it('throws descriptive error when retrieval fails', async () => {
      __mocks.download.mockRejectedValue(new Error('not found'));
      const service = createService();
      await expect(service.downloadObject('key')).rejects.toThrow(
        'Failed to retrieve object key: not found',
      );
    });
  });

  it('uploads objects to storage', async () => {
    const service = createService();
    const key = await service.uploadObject('foo.txt', 'hello');
    expect(key).toBe('foo.txt');
    expect(__mocks.file).toHaveBeenCalledWith('foo.txt');
    expect(__mocks.save).toHaveBeenCalledWith(Buffer.from('hello'));
  });

  it('generates signed urls', async () => {
    __mocks.getSignedUrl.mockResolvedValue(['http://signed']);
    const service = createService();
    const url = await service.getSignedUrl('foo.txt', 60);
    expect(url).toBe('http://signed');
    expect(__mocks.getSignedUrl).toHaveBeenCalledWith({
      action: 'read',
      expires: expect.any(Number),
    });
  });
});
