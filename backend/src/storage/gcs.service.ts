import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Storage } from '@google-cloud/storage';

@Injectable()
export class GcsService {
  private readonly storage: Storage;
  private readonly bucket: string;
  private readonly logger = new Logger(GcsService.name);

  constructor(private readonly config: ConfigService) {
    const projectId = this.config.get<string>('gcs.projectId');
    const endpoint = this.config.get<string>('gcs.endpoint');
    this.storage = new Storage({ projectId, ...(endpoint ? { apiEndpoint: endpoint } : {}) });
    this.bucket = this.config.get<string>('gcs.bucket') || 'default-bucket';
  }

  async ensureBucket(): Promise<void> {
    const bucket = this.storage.bucket(this.bucket);
    try {
      const [exists] = await bucket.exists();
      if (!exists) {
        await bucket.create();
      }
    } catch (err: unknown) {
      this.logger.error(`Failed to ensure bucket ${this.bucket}`, err as Error);
    }
  }

  async uploadObject(key: string, body: Buffer | Uint8Array | string): Promise<string> {
    const file = this.storage.bucket(this.bucket).file(key);
    const data = typeof body === 'string' ? Buffer.from(body) : body;
    await file.save(data);
    return key;
  }

  async downloadObject(key: string): Promise<Buffer> {
    const file = this.storage.bucket(this.bucket).file(key);
    try {
      const [contents] = await file.download();
      return contents;
    } catch (err: unknown) {
      const message = (err as Error).message ?? err;
      throw new Error(`Failed to retrieve object ${key}: ${message}`);
    }
  }

  async getSignedUrl(key: string, expiresIn = 3600): Promise<string> {
    const file = this.storage.bucket(this.bucket).file(key);
    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + expiresIn * 1000,
    });
    return url;
  }
}
