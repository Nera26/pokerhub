import React from 'react';
import { screen } from '@testing-library/react';
import Dashboard from '../Dashboard';
import { renderWithClient } from './renderWithClient';
import { setupDashboardMocks } from './dashboardMocks';
import { server } from '@/test-utils/server';
import { http, HttpResponse, delay } from 'msw';

describe('Dashboard panels', () => {
  beforeEach(() => {
    setupDashboardMocks();
  });

  describe('User panel', () => {
    it('shows loading state', () => {
      server.use(
        http.get('/api/admin/users', async () => {
          await delay('infinite');
          return HttpResponse.json([]);
        }),
      );
      renderWithClient(<Dashboard />);
      expect(screen.getByText(/loading users/i)).toBeInTheDocument();
    });

    it('shows error state', async () => {
      server.use(
        http.get('/api/admin/users', () =>
          HttpResponse.json({ error: 'x' }, { status: 500 }),
        ),
      );
      renderWithClient(<Dashboard />);
      await screen.findByText(/failed to load users/i);
    });

    it('shows empty state', () => {
      renderWithClient(<Dashboard />);
      expect(screen.getByText(/no users found/i)).toBeInTheDocument();
    });

    it('shows users', async () => {
      server.use(
        http.get('/api/admin/users', () =>
          HttpResponse.json([
            {
              id: '1',
              username: 'alice',
              avatarKey: '',
              balance: 10,
              banned: false,
            },
          ]),
        ),
      );
      renderWithClient(<Dashboard />);
      expect(await screen.findByText('alice')).toBeInTheDocument();
    });
  });

  describe('Active tables panel', () => {
    it('shows loading state', () => {
      server.use(
        http.get('/api/tables', async () => {
          await delay('infinite');
          return HttpResponse.json([]);
        }),
      );
      renderWithClient(<Dashboard />);
      expect(screen.getByText(/loading tables/i)).toBeInTheDocument();
    });

    it('shows error state', async () => {
      server.use(
        http.get('/api/tables', () =>
          HttpResponse.json({ error: 'x' }, { status: 500 }),
        ),
      );
      renderWithClient(<Dashboard />);
      await screen.findByText(/failed to load tables/i);
    });

    it('shows empty state', () => {
      renderWithClient(<Dashboard />);
      expect(screen.getByText(/no active tables/i)).toBeInTheDocument();
    });

    it('shows tables', async () => {
      server.use(
        http.get('/api/tables', () =>
          HttpResponse.json([
            {
              id: 't1',
              tableName: 'Table 1',
              gameType: 'texas',
              stakes: { small: 1, big: 2 },
              players: { current: 1, max: 6 },
              buyIn: { min: 40, max: 200 },
              stats: { handsPerHour: 0, avgPot: 0, rake: 0 },
              createdAgo: '1h',
            },
          ]),
        ),
      );
      renderWithClient(<Dashboard />);
      expect(await screen.findByText('Table 1')).toBeInTheDocument();
    });
  });
});
