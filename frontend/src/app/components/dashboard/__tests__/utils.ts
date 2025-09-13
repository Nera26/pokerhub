import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ManageTables from '../ManageTables';
import { fetchTables } from '@/lib/api/table';
import type { Table } from '@shared/types';
import { renderWithClient } from './renderWithClient';

const mockFetchTables = fetchTables as jest.MockedFunction<typeof fetchTables>;

const tableFixture: Table = {
  id: '1',
  tableName: 'Main',
  gameType: 'texas',
  stakes: { small: 1, big: 2 },
  players: { current: 0, max: 9 },
  buyIn: { min: 50, max: 500 },
  stats: { handsPerHour: 0, avgPot: 0, rake: 0 },
  createdAgo: '1h',
};

export async function searchTables() {
  mockFetchTables.mockResolvedValueOnce([tableFixture]);
  renderWithClient(React.createElement(ManageTables));
  await waitFor(() => screen.getByText('Main'));
  await userEvent.click(screen.getByText(/update/i));
  return tableFixture;
}

export { tableFixture };
