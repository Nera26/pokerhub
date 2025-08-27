import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  CreateBucketCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class S3Service {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly logger = new Logger(S3Service.name);

  constructor(private readonly config: ConfigService) {
    this.client = new S3Client({
      region: this.config.get<string>('s3.region'),
      endpoint: this.config.get<string>('s3.endpoint'),
      forcePathStyle: true,
      credentials: {
        accessKeyId: this.config.get<string>('s3.accessKeyId') || 'test',
        secretAccessKey:
          this.config.get<string>('s3.secretAccessKey') || 'test',
      },
    });
    this.bucket = this.config.get<string>('s3.bucket') || 'default-bucket';
  }

  async ensureBucket(): Promise<void> {
    try {
      await this.client.send(new CreateBucketCommand({ Bucket: this.bucket }));
    } catch (err: unknown) {
      const { name } = err as { name?: string };
      if (
        name !== 'BucketAlreadyOwnedByYou' &&
        name !== 'BucketAlreadyExists'
      ) {
        this.logger.error(
          `Failed to create bucket ${this.bucket}`,
          err as Error,
        );
      }
    }
  }

  async uploadObject(
    key: string,
    body: Buffer | Uint8Array | string,
  ): Promise<string> {
    await this.client.send(
      new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: body }),
    );
    return key;
  }

  async downloadObject(key: string): Promise<Buffer> {
    let body: any;
    try {
      ({ Body: body } = await this.client.send(
        new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      ));
    } catch (err: unknown) {
      const message = (err as Error).message ?? err;
      throw new Error(`Failed to retrieve object ${key}: ${message}`);
    }
    if (!body) {
      throw new Error('Object body is empty');
    }
    const chunks: Uint8Array[] = [];
    try {
      for await (const chunk of body as AsyncIterable<Uint8Array>) {
        chunks.push(chunk);
      }
    } catch (err: unknown) {
      const message = (err as Error).message ?? err;
      throw new Error(`Error streaming object ${key}: ${message}`);
    }
    return Buffer.concat(chunks);
  }

  async getSignedUrl(key: string, expiresIn = 3600): Promise<string> {
    return getSignedUrl(
      this.client,
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      { expiresIn },
    );
  }
}
