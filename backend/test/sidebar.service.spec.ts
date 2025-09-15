import { SidebarService } from '../src/services/sidebar.service';
import type { SidebarItem } from '../src/schemas/admin';
import { ConfigService } from '@nestjs/config';
import type { Repository } from 'typeorm';
import { AdminTabEntity } from '../src/database/entities/admin-tab.entity';

describe('SidebarService', () => {
  it('returns config and db items without duplicates', async () => {
    const configItems: SidebarItem[] = [
      {
        id: 'users',
        label: 'UsersCfg',
        icon: 'faUsers',
        component: 'cfg',
      },
      {
        id: 'custom',
        label: 'Custom',
        icon: 'home',
        component: 'CustomCmp',
      },
    ];
    const repoItems: AdminTabEntity[] = [
      {
        id: 'users',
        label: 'UsersDb',
        icon: 'faUsers',
        component: 'dbUsers',
      } as AdminTabEntity,
      {
        id: 'events',
        label: 'Events',
        icon: 'faBell',
        component: '@/app/components/dashboard/AdminEvents',
      } as AdminTabEntity,
    ];
    const config = { get: jest.fn().mockReturnValue(configItems) } as unknown as ConfigService;
    const repo = { find: jest.fn().mockResolvedValue(repoItems) } as unknown as Repository<AdminTabEntity>;
    const service = new SidebarService(config, repo);

    await expect(service.getItems()).resolves.toEqual([
      {
        id: 'users',
        label: 'UsersCfg',
        icon: 'faUsers',
        component: 'cfg',
      },
      {
        id: 'custom',
        label: 'Custom',
        icon: 'faHome',
        component: 'CustomCmp',
      },
      {
        id: 'events',
        label: 'Events',
        icon: 'faBell',
        component: '@/app/components/dashboard/AdminEvents',
      },
    ]);
  });
});
