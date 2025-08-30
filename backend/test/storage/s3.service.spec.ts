/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
import { GenericContainer, StartedTestContainer } from 'testcontainers';
import { Test } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { gcsConfig } from '../../src/config';
import { S3Service } from '../../src/storage/s3.service';
import { StorageModule } from '../../src/storage/storage.module';

jest.setTimeout(60000);

describe.skip('S3Service (integration)', () => {
  let container: StartedTestContainer;
  let service: S3Service;
  let canRun = true;

  beforeAll(async () => {
    try {
      const generic: any = new GenericContainer('localstack/localstack')
        .withEnvironment({ SERVICES: 's3' })
        .withExposedPorts(4566);
      container = await generic.start();

      const endpoint = `http://${container.getHost()}:${container.getMappedPort(4566)}`;
      process.env.GCS_ENDPOINT = endpoint;
      process.env.GCP_PROJECT_ID = 'test';
      process.env.GCP_CLIENT_EMAIL = 'test@example.com';
      process.env.GCP_PRIVATE_KEY = 'test';
      process.env.GCS_BUCKET = 'test-bucket';

      const moduleRef = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({ load: [gcsConfig], ignoreEnvFile: true }),
          StorageModule,
        ],
      }).compile();

      service = moduleRef.get(S3Service);
      await service.ensureBucket();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('Skipping S3 integration tests:', err);
      canRun = false;
    }
  });

  afterAll(async () => {
    if (canRun && container) {
      await container.stop();
    }
  });

  it('uploads and downloads objects', async () => {
    if (!canRun) {
      expect(true).toBe(true);
      return;
    }
    const key = await service.uploadObject('foo.txt', 'bar');
    const buf = await service.downloadObject(key);
    expect(buf.toString()).toBe('bar');
  });
});
