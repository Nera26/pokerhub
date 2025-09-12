import { render, screen } from '@testing-library/react';
import TablePageClient from '@/app/table/[id]/TablePageClient';
import { useTableData } from '@/hooks/useTableData';
import { useApiError } from '@/hooks/useApiError';
import useSocket from '@/hooks/useSocket';

jest.mock('@/hooks/useTableData');
jest.mock('@/hooks/useApiError');
jest.mock('@/hooks/useSocket', () => jest.fn());
jest.mock('next/dynamic', () => {
  const dynamic = () => () => null;
  return dynamic;
});
jest.mock('@/components/FairnessModal', () => () => null);

const mockUseTableData = useTableData as jest.MockedFunction<
  typeof useTableData
>;
const mockUseApiError = useApiError as jest.MockedFunction<typeof useApiError>;

describe('TablePageClient', () => {
  beforeEach(() => {
    mockUseApiError.mockReturnValue(null);
  });

  it('renders loading state', () => {
    mockUseTableData.mockReturnValue({
      data: undefined,
      error: null,
      isLoading: true,
    } as any);
    render(<TablePageClient tableId="t1" />);
    expect(screen.getByText(/loading table/i)).toBeInTheDocument();
  });

  it('renders error message', () => {
    mockUseTableData.mockReturnValue({
      data: undefined,
      error: new Error('oops'),
      isLoading: false,
    } as any);
    mockUseApiError.mockReturnValue('Failed');
    render(<TablePageClient tableId="t1" />);
    expect(screen.getByText('Failed')).toBeInTheDocument();
  });
});
