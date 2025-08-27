import { Injectable } from '@nestjs/common';
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
    } catch {
      // bucket likely exists
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
    const { Body } = await this.client.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
    );
    if (!Body) {
      throw new Error('Object body is empty');
    }
    const chunks = [] as Uint8Array[];
    for await (const chunk of Body as any as AsyncIterable<Uint8Array>) {
      chunks.push(chunk);
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
