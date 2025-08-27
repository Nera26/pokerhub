import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StorageModule } from '../../src/storage/storage.module';
import { S3Service } from '../../src/storage/s3.service';
import { FileEntity } from '../../src/storage/file.entity';
import S3rver from 's3rver';

describe('S3Service integration', () => {
  let server: S3rver;
  let service: S3Service;
  const bucket = 'test-bucket';

  beforeAll(async () => {
    server = new S3rver({
      address: '127.0.0.1',
      port: 4569,
      silent: true,
      configureBuckets: [{ name: bucket }],
    });
    await server.run();

    const endpoint = 'http://127.0.0.1:4569';
    process.env.S3_ENDPOINT = endpoint;
    process.env.S3_REGION = 'us-east-1';
    process.env.S3_ACCESS_KEY = 'S3RVER';
    process.env.S3_SECRET_KEY = 'S3RVER';

    const moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [FileEntity],
          synchronize: true,
        }),
        StorageModule,
      ],
    }).compile();
    service = moduleRef.get(S3Service);
  }, 30000);

  afterAll(async () => {
    await server.close();
  });

  it('uploads and downloads files with S3', async () => {
    const key = 'hello.txt';
    const body = 'hello world';
    const file = await service.upload(bucket, key, body);
    expect(file.key).toBe(key);

    const data = await service.download(bucket, key);
    expect(data.toString()).toBe(body);

    const url = await service.getSignedUrl(bucket, key, 60);
    expect(url).toContain(key);
  });
});
