import { render } from '@testing-library/react';
import CashGameList from '@/app/components/home/CashGameList';
import type { Table } from '@/hooks/useLobbyData';

const entityListSpy = jest.fn();

jest.mock('@/components/EntityList', () => {
  const actual = jest.requireActual('@/components/EntityList');
  return {
    __esModule: true,
    default: jest.fn((props: any) => {
      entityListSpy(props);
      return actual.default(props);
    }),
  };
});

describe('CashGameList', () => {
  it('renders via EntityList', () => {
    const tables: Table[] = [];
    render(<CashGameList tables={tables} gameType="texas" hidden={false} />);
    expect(entityListSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'cash-games-panel',
        items: tables,
        title: 'Cash Games',
        emptyMessage: 'No cash games available.',
        hidden: false,
      }),
    );
  });
});
