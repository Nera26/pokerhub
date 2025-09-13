import { screen, waitFor } from '@testing-library/react';
import { mockSiteMeta, renderDashboardPage } from './helpers';

jest.mock('@/lib/api/admin', () => ({
  fetchAdminTabs: jest
    .fn()
    .mockResolvedValue([
      { id: 'dashboard', title: 'Dashboard', component: './dummy' },
    ]),
  fetchAdminTabMeta: jest.fn().mockResolvedValue({
    enabled: true,
    title: 'Dashboard',
    component: './dummy',
  }),
}));
it('uses default avatar from site metadata when profile avatar is missing', async () => {
  const metaAvatar = 'https://example.com/fallback.png';
  mockSiteMeta(metaAvatar);
  renderDashboardPage();

  const img = await screen.findByAltText('Admin avatar');
  await waitFor(() =>
    expect(img.getAttribute('src')).toContain(encodeURIComponent(metaAvatar)),
  );
});
