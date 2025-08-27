import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Repository } from 'typeorm';
import { FileEntity } from './file.entity';

@Injectable()
export class S3Service {
  private readonly client: S3Client;

  constructor(
    @InjectRepository(FileEntity)
    private readonly files: Repository<FileEntity>,
  ) {
    this.client = new S3Client({
      endpoint: process.env.S3_ENDPOINT,
      region: process.env.S3_REGION || 'us-east-1',
      forcePathStyle: true,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY || 'test',
        secretAccessKey: process.env.S3_SECRET_KEY || 'test',
      },
    });
  }

  async upload(
    bucket: string,
    key: string,
    body: Buffer | string,
  ): Promise<FileEntity> {
    await this.client.send(
      new PutObjectCommand({ Bucket: bucket, Key: key, Body: body }),
    );
    const entity = this.files.create({ key });
    return this.files.save(entity);
  }

  async download(bucket: string, key: string): Promise<Buffer> {
    const result = await this.client.send(
      new GetObjectCommand({ Bucket: bucket, Key: key }),
    );
    const array = await result.Body?.transformToByteArray();
    return Buffer.from(array ?? []);
  }

  async getSignedUrl(
    bucket: string,
    key: string,
    expiresIn = 3600,
  ): Promise<string> {
    const command = new GetObjectCommand({ Bucket: bucket, Key: key });
    const url = await getSignedUrl(this.client, command, { expiresIn });
    await this.files.update({ key }, { url });
    return url;
  }
}
