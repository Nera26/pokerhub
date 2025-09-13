import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithClient } from './renderWithClient';
import FeatureFlagsPanel from '../FeatureFlagsPanel';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { updateFeatureFlag } from '@/lib/api/feature-flags';

jest.mock('@/hooks/useApiError', () => ({ useApiError: () => {} }));
jest.mock('@/hooks/useFeatureFlags');
jest.mock('@/lib/api/feature-flags');

const mockUseFeatureFlags = useFeatureFlags as jest.Mock;
const mockUpdate = updateFeatureFlag as jest.Mock;

describe('FeatureFlagsPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders list of feature flags', () => {
    mockUseFeatureFlags.mockReturnValue({
      data: { flagA: true, flagB: false },
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });
    renderWithClient(<FeatureFlagsPanel />);
    expect(screen.getByLabelText('flagA')).toBeChecked();
    expect(screen.getByLabelText('flagB')).not.toBeChecked();
  });

  it('toggles a flag', async () => {
    const refetch = jest.fn();
    mockUseFeatureFlags.mockReturnValue({
      data: { flagA: false },
      isLoading: false,
      error: null,
      refetch,
    });
    mockUpdate.mockResolvedValue(undefined);

    renderWithClient(<FeatureFlagsPanel />);
    fireEvent.click(screen.getByLabelText('flagA'));
    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith('flagA', true);
      expect(refetch).toHaveBeenCalled();
    });
  });

  it('shows loading state', () => {
    mockUseFeatureFlags.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: jest.fn(),
    });
    renderWithClient(<FeatureFlagsPanel />);
    expect(screen.getByText(/loading feature flags/i)).toBeInTheDocument();
  });

  it('shows error state', () => {
    mockUseFeatureFlags.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('fail'),
      refetch: jest.fn(),
    });
    renderWithClient(<FeatureFlagsPanel />);
    expect(
      screen.getByText(/failed to load feature flags/i),
    ).toBeInTheDocument();
  });
});
