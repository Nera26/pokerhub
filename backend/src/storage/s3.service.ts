import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Bucket, Storage } from '@google-cloud/storage';

@Injectable()
export class S3Service {
  private readonly storage: Storage;
  private readonly bucket: Bucket;
  private readonly logger = new Logger(S3Service.name);

  constructor(private readonly config: ConfigService) {
    this.storage = new Storage({
      projectId: this.config.get<string>('gcp.projectId'),
      apiEndpoint: this.config.get<string>('gcp.endpoint'),
      credentials: {
        client_email: this.config.get<string>('gcp.clientEmail') || 'test',
        private_key: this.config.get<string>('gcp.privateKey') || 'test',
      },
    });
    const bucketName = this.config.get<string>('gcp.bucket') || 'default-bucket';
    this.bucket = this.storage.bucket(bucketName);
  }

  async ensureBucket(): Promise<void> {
    try {
      await this.storage.createBucket(this.bucket.name);
    } catch (err: unknown) {
      const { code } = err as { code?: number };
      if (code !== 409) {
        this.logger.error(
          `Failed to create bucket ${this.bucket.name}`,
          err as Error,
        );
      }
    }
  }

  async uploadObject(
    key: string,
    body: Buffer | Uint8Array | string,
  ): Promise<string> {
    await this.bucket.file(key).save(body as any);
    return key;
  }

  async downloadObject(key: string): Promise<Buffer> {
    try {
      const [contents] = await this.bucket.file(key).download();
      return contents;
    } catch (err: unknown) {
      const message = (err as Error).message ?? err;
      throw new Error(`Failed to retrieve object ${key}: ${message}`);
    }
  }

  async getSignedUrl(key: string, expiresIn = 3600): Promise<string> {
    const [url] = await this.bucket.file(key).getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + expiresIn * 1000,
    });
    return url;
  }
}
