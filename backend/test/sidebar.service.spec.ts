import { SidebarService } from '../src/services/sidebar.service';
import { AdminTabEntity } from '../src/database/entities/admin-tab.entity';
import type { Repository } from 'typeorm';

describe('SidebarService', () => {
  it('returns normalized sidebar items from database', async () => {
    const repoItems: AdminTabEntity[] = [
      {
        id: 'analytics',
        label: 'Analytics',
        icon: 'chart-line',
        component: '@/app/components/dashboard/analytics/Analytics',
      } as AdminTabEntity,
      {
        id: 'events',
        label: 'Events',
        icon: 'faBell',
        component: '@/app/components/dashboard/AdminEvents',
      } as AdminTabEntity,
    ];
    const repo = {
      find: jest
        .fn()
        .mockResolvedValue(repoItems),
    } as unknown as Repository<AdminTabEntity>;
    const service = new SidebarService(repo);

    await expect(service.getItems()).resolves.toEqual([
      {
        id: 'analytics',
        label: 'Analytics',
        icon: 'faChartLine',
        component: '@/app/components/dashboard/analytics/Analytics',
      },
      {
        id: 'events',
        label: 'Events',
        icon: 'faBell',
        component: '@/app/components/dashboard/AdminEvents',
      },
    ]);
    expect(repo.find).toHaveBeenCalledWith({ order: { id: 'ASC' } });
  });
});
