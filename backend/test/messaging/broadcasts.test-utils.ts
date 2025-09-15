import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { createDataSource } from '../utils/pgMem';
import { BroadcastEntity } from '../../src/database/entities/broadcast.entity';
import { BroadcastTemplateEntity } from '../../src/database/entities/broadcast-template.entity';
import { BroadcastTypeEntity } from '../../src/database/entities/broadcast-type.entity';
import { BroadcastsService } from '../../src/messaging/broadcasts.service';
import { BroadcastsController } from '../../src/messaging/broadcasts.controller';
import { BroadcastTemplatesController } from '../../src/messaging/templates.controller';
import { BroadcastTypesController } from '../../src/messaging/types.controller';
import { AuthGuard } from '../../src/auth/auth.guard';
import { AdminGuard } from '../../src/auth/admin.guard';

export async function setupBroadcasts() {
  const dataSource = await createDataSource([
    BroadcastEntity,
    BroadcastTemplateEntity,
    BroadcastTypeEntity,
  ]);

  const service = new BroadcastsService(dataSource);

  const moduleRef = await Test.createTestingModule({
    controllers: [
      BroadcastsController,
      BroadcastTemplatesController,
      BroadcastTypesController,
    ],
    providers: [{ provide: BroadcastsService, useValue: service }],
  })
    .overrideGuard(AuthGuard)
    .useValue({ canActivate: () => true })
    .overrideGuard(AdminGuard)
    .useValue({ canActivate: () => true })
    .compile();

  const app = moduleRef.createNestApplication();
  await app.init();

  const typeRepo = dataSource.getRepository(BroadcastTypeEntity);
  await typeRepo.save({
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    name: 'announcement',
    icon: '📢',
    color: 'text-accent-yellow',
  });
  await typeRepo.save({
    id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    name: 'alert',
    icon: '⚠️',
    color: 'text-danger-red',
  });
  await typeRepo.save({
    id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    name: 'notice',
    icon: 'ℹ️',
    color: 'text-accent-blue',
  });

  const templateRepo = dataSource.getRepository(BroadcastTemplateEntity);
  await templateRepo.save({
    id: '11111111-1111-1111-1111-111111111111',
    name: 'maintenance',
    text:
      'Server maintenance scheduled for [DATE] at [TIME]. Expected downtime: [DURATION]. We apologize for any inconvenience.',
  });
  await templateRepo.save({
    id: '22222222-2222-2222-2222-222222222222',
    name: 'tournament',
    text:
      'New tournament starting [DATE] at [TIME]! Buy-in: [AMOUNT] | Prize Pool: [PRIZE] | Register now to secure your seat!',
  });

  const spies = {
    send: jest.spyOn(service, 'send'),
    list: jest.spyOn(service, 'list'),
    listTemplates: jest.spyOn(service, 'listTemplates'),
    listTypes: jest.spyOn(service, 'listTypes'),
  };

  return {
    app,
    service,
    repos: {
      dataSource,
      broadcasts: dataSource.getRepository(BroadcastEntity),
      templates: templateRepo,
      types: typeRepo,
    },
    spies,
  };
}

export type BroadcastsTestContext = Awaited<ReturnType<typeof setupBroadcasts>>;

