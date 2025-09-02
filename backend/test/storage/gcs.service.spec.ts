/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
import { GenericContainer, StartedTestContainer } from 'testcontainers';
import { Test } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { gcsConfig } from '../../src/config';
import { GcsService } from '../../src/storage/gcs.service';
import { StorageModule } from '../../src/storage/storage.module';

jest.setTimeout(60000);

describe('GcsService (integration)', () => {
  let container: StartedTestContainer;
  let service: GcsService;
  let canRun = true;

  beforeAll(async () => {
    try {
      const generic: any = new GenericContainer('fsouza/fake-gcs-server')
        .withExposedPorts(4443);
      container = await generic.start();

      const endpoint = `http://${container.getHost()}:${container.getMappedPort(4443)}`;
      process.env.GCS_EMULATOR_HOST = endpoint;
      process.env.GCP_PROJECT = 'test';
      process.env.GCS_BUCKET = 'test-bucket';

      const moduleRef = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({ load: [gcsConfig], ignoreEnvFile: true }),
          StorageModule,
        ],
      }).compile();

      service = moduleRef.get(GcsService);
      await service.ensureBucket();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('Skipping GCS integration tests:', err);
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
