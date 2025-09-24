import { render, screen } from '@testing-library/react';
import AuditTable from '../AuditTable';

describe('AuditTable', () => {
  const baseRow = {
    id: '1',
    timestamp: '2024-01-01T00:00:00Z',
    type: 'Login',
    description: 'User logged in',
    user: 'alice',
    ip: '127.0.0.1',
    reviewed: false,
    reviewedBy: null,
    reviewedAt: null,
  } as any;

  it('updates badge classes when props change', () => {
    const setPage = jest.fn();
    const onView = jest.fn();
    const { rerender } = render(
      <AuditTable
        rows={[baseRow]}
        page={1}
        pageCount={1}
        start={0}
        total={1}
        setPage={setPage}
        onView={onView}
        badgeClasses={{ Login: 'bg-green-500 text-white' } as any}
      />,
    );

    const badge = screen.getByText('Login');
    expect(badge.className).toContain('bg-green-500');

    rerender(
      <AuditTable
        rows={[baseRow]}
        page={1}
        pageCount={1}
        start={0}
        total={1}
        setPage={setPage}
        onView={onView}
        badgeClasses={{ Login: 'bg-red-500 text-black' } as any}
      />,
    );

    expect(screen.getByText('Login').className).toContain('bg-red-500');
  });
});
