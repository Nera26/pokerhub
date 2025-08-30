import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Storage } from '@google-cloud/storage';

@Injectable()
export class GcsService {
  private readonly client: Storage;
  private readonly bucket: string;
  private readonly logger = new Logger(GcsService.name);

  constructor(private readonly config: ConfigService) {
    this.client = new Storage({
      projectId: this.config.get<string>('gcs.projectId'),
      keyFilename: this.config.get<string>('gcs.keyFilename'),
    });
    this.bucket = this.config.get<string>('gcs.bucket') || 'default-bucket';
  }

  async ensureBucket(): Promise<void> {
    try {
      const [exists] = await this.client.bucket(this.bucket).exists();
      if (!exists) {
        await this.client.createBucket(this.bucket);
      }
    } catch (err: unknown) {
      this.logger.error(`Failed to create bucket ${this.bucket}`, err as Error);
    }
  }

  async uploadObject(
    key: string,
    body: Buffer | Uint8Array | string,
  ): Promise<string> {
    await this.client.bucket(this.bucket).file(key).save(body);
    return key;
  }

  async downloadObject(key: string): Promise<Buffer> {
    try {
      const [data] = await this.client
        .bucket(this.bucket)
        .file(key)
        .download();
      return data;
    } catch (err: unknown) {
      const message = (err as Error).message ?? err;
      throw new Error(`Failed to retrieve object ${key}: ${message}`);
    }
  }

  async getSignedUrl(key: string, expiresIn = 3600): Promise<string> {
    const [url] = await this.client
      .bucket(this.bucket)
      .file(key)
      .getSignedUrl({
        action: 'read',
        expires: Date.now() + expiresIn * 1000,
      });
    return url;
  }
}

