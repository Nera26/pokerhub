import { renderHook } from '@testing-library/react';
import useTransactionVirtualizer from '@/hooks/useTransactionVirtualizer';

describe('useTransactionVirtualizer', () => {
  it('sorts items by date and virtualizes rows', () => {
    const items = [
      { date: '2024-02-01', id: 2 },
      { date: '2024-01-01', id: 1 },
    ];
    const { result } = renderHook(() => useTransactionVirtualizer(items));
    expect(result.current.sortedItems.map((i) => i.id)).toEqual([1, 2]);
    expect(result.current.rowVirtualizer.getVirtualItems()).toHaveLength(2);
  });
});
