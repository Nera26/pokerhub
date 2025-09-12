import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ManageTables from '../ManageTables';
import { fetchTables, createTable } from '@/lib/api/table';
import { renderWithClient } from './renderWithClient';
import type { Table } from '@shared/types';

const mockFetchTables = fetchTables as jest.MockedFunction<typeof fetchTables>;
const mockCreateTable = createTable as jest.MockedFunction<typeof createTable>;

type Overrides = {
  fetchTables?: Table[];
  createTable?: unknown | Error;
};

export async function fillTableForm({
  fetchTables: fetchTablesResponse = [],
  createTable: createTableResponse,
}: Overrides = {}) {
  mockFetchTables.mockResolvedValueOnce(fetchTablesResponse);

  if (createTableResponse !== undefined) {
    if (createTableResponse instanceof Error) {
      mockCreateTable.mockRejectedValue(createTableResponse);
    } else {
      mockCreateTable.mockResolvedValue(createTableResponse as any);
    }
  }

  renderWithClient(<ManageTables />);

  const openBtn = await screen.findByText(/create table/i);
  await userEvent.click(openBtn);

  await userEvent.type(screen.getByLabelText(/table name/i), 'My Table');
  await userEvent.selectOptions(screen.getByLabelText(/game type/i), 'omaha');
  await userEvent.type(screen.getByLabelText(/small blind/i), '1');
  await userEvent.type(screen.getByLabelText(/big blind/i), '2');
  await userEvent.type(screen.getByLabelText(/starting stack/i), '100');
  await userEvent.type(screen.getByLabelText(/max players/i), '6');
  await userEvent.type(screen.getByLabelText(/min buy-in/i), '50');
  await userEvent.type(screen.getByLabelText(/max buy-in/i), '200');

  await userEvent.click(
    screen.getAllByRole('button', { name: /create table/i })[1],
  );
}
