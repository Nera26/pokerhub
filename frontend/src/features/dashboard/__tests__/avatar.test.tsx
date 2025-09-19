import { screen, waitFor } from '@testing-library/react';
import {
  mockFetchAdminTabMeta,
  mockFetchAdminTabs,
  mockSiteMeta,
  renderDashboardPage,
  resetDashboardMocks,
} from './test-utils';

beforeEach(() => {
  resetDashboardMocks();
  mockFetchAdminTabs.mockResolvedValue([
    { id: 'dashboard', title: 'Dashboard', component: './dummy' },
  ]);
  mockFetchAdminTabMeta.mockResolvedValue({
    id: 'dashboard',
    enabled: true,
    title: 'Dashboard',
    component: './dummy',
    message: '',
  });
});
it('uses default avatar from site metadata when profile avatar is missing', async () => {
  const metaAvatar = 'https://example.com/fallback.png';
  mockSiteMeta(metaAvatar);
  renderDashboardPage();

  const img = await screen.findByAltText('Admin avatar');
  await waitFor(() =>
    expect(img.getAttribute('src')).toContain(encodeURIComponent(metaAvatar)),
  );
});
