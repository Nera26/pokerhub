import { screen } from '@testing-library/react';
import { renderWithClient } from './renderWithClient';
import AuditLogs from '../AuditLogs';
import { fetchAuditActionColors } from '@/lib/api/admin';

jest.mock('@/hooks/useApiError', () => ({ useApiError: () => {} }));
jest.mock('@/hooks/useAuditLogs', () => ({
  useAuditLogs: () => ({
    data: {
      logs: [
        {
          timestamp: '2024-01-01',
          user: 'Admin',
          type: 'Add Balance',
          description: 'desc',
        },
      ],
    },
    isLoading: false,
    error: null,
  }),
}));
jest.mock('@/hooks/useAuditAlerts', () => ({
  useAuditAlerts: () => ({ data: [], isLoading: false, error: null }),
}));
jest.mock('@/hooks/useAdminOverview', () => ({
  useAdminOverview: () => ({ data: [], isLoading: false, error: null }),
}));
jest.mock('@/hooks/useAdminEvents', () => ({
  useAdminEvents: () => ({ data: [], isLoading: false, error: null }),
}));
jest.mock('@/lib/api/admin', () => ({
  fetchAuditActionColors: jest.fn(),
}));

const mockFetchAuditActionColors = fetchAuditActionColors as jest.Mock;

describe('AuditLogs action colors', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('applies color class from API mapping', async () => {
    mockFetchAuditActionColors.mockResolvedValue({
      'add balance': 'text-accent-green',
    });

    renderWithClient(<AuditLogs />);

    const actionCell = await screen.findByText('Add Balance');
    expect(actionCell).toHaveClass('text-accent-green');
  });
});
