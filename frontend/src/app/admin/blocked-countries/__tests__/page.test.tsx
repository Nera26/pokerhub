import { fireEvent, screen, waitFor } from '@testing-library/react';
import BlockedCountriesPage from '../page';
import { renderWithClient } from '@/app/components/dashboard/__tests__/renderWithClient';
import { useBlockedCountries } from '@/hooks/useBlockedCountries';
import { useRequireAdmin } from '@/hooks/useRequireAdmin';
import {
  createBlockedCountry,
  updateBlockedCountry,
  deleteBlockedCountry,
} from '@/lib/api/blockedCountries';

jest.mock('@/hooks/useRequireAdmin', () => ({
  useRequireAdmin: jest.fn(),
}));

jest.mock('@/hooks/useBlockedCountries', () => ({
  useBlockedCountries: jest.fn(),
}));

jest.mock('@/lib/api/blockedCountries', () => ({
  createBlockedCountry: jest.fn(),
  updateBlockedCountry: jest.fn(),
  deleteBlockedCountry: jest.fn(),
}));

const mockUseBlockedCountries = useBlockedCountries as jest.MockedFunction<
  typeof useBlockedCountries
>;
const mockUseRequireAdmin = useRequireAdmin as jest.MockedFunction<
  typeof useRequireAdmin
>;

type UseBlockedCountriesResult = ReturnType<typeof useBlockedCountries>;

type Overrides = Partial<UseBlockedCountriesResult>;

function setupUseBlockedCountries(overrides: Overrides = {}) {
  const refetch =
    (overrides.refetch as UseBlockedCountriesResult['refetch']) ??
    jest.fn().mockResolvedValue({});

  mockUseBlockedCountries.mockReturnValue({
    data: [],
    isLoading: false,
    isError: false,
    error: null,
    refetch,
    ...overrides,
    refetch,
  } as UseBlockedCountriesResult);

  return { refetch };
}

describe('BlockedCountriesPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupUseBlockedCountries();
  });

  it('requires admin access', () => {
    renderWithClient(<BlockedCountriesPage />);
    expect(mockUseRequireAdmin).toHaveBeenCalled();
  });

  it('renders blocked countries in a table', () => {
    setupUseBlockedCountries({
      data: [{ country: 'CA' }, { country: 'DE' }],
    } as Overrides);

    renderWithClient(<BlockedCountriesPage />);

    expect(screen.getByText('CA')).toBeInTheDocument();
    expect(screen.getByText('DE')).toBeInTheDocument();
  });

  it('creates a new blocked country', async () => {
    const { refetch } = setupUseBlockedCountries();
    (createBlockedCountry as jest.Mock).mockResolvedValue({ country: 'US' });

    renderWithClient(<BlockedCountriesPage />);

    const input = screen.getByPlaceholderText('Country code');
    fireEvent.change(input, { target: { value: 'us' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add Country' }));

    await waitFor(() =>
      expect(createBlockedCountry).toHaveBeenCalledWith({ country: 'US' }),
    );
    expect(refetch).toHaveBeenCalled();
    await waitFor(() => expect(input).toHaveValue(''));
  });

  it('updates an existing blocked country', async () => {
    const { refetch } = setupUseBlockedCountries({
      data: [{ country: 'CA' }],
    } as Overrides);
    (updateBlockedCountry as jest.Mock).mockResolvedValue({ country: 'MX' });

    renderWithClient(<BlockedCountriesPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    const input = screen.getByPlaceholderText('Country code');
    expect(input).toHaveValue('CA');
    fireEvent.change(input, { target: { value: 'mx' } });
    fireEvent.click(screen.getByRole('button', { name: 'Update Country' }));

    await waitFor(() =>
      expect(updateBlockedCountry).toHaveBeenCalledWith('CA', {
        country: 'MX',
      }),
    );
    expect(refetch).toHaveBeenCalled();
  });

  it('deletes a blocked country', async () => {
    const { refetch } = setupUseBlockedCountries({
      data: [{ country: 'CA' }],
    } as Overrides);
    (deleteBlockedCountry as jest.Mock).mockResolvedValue(undefined);

    renderWithClient(<BlockedCountriesPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() =>
      expect(deleteBlockedCountry).toHaveBeenCalledWith('CA'),
    );
    expect(refetch).toHaveBeenCalled();
  });

  it('renders an error state when the query fails', () => {
    setupUseBlockedCountries({
      isError: true,
      error: { message: 'Failed to load' } as Overrides['error'],
    });

    renderWithClient(<BlockedCountriesPage />);

    expect(screen.getByRole('alert')).toHaveTextContent('Failed to load');
  });

  it('shows a failure message when create fails', async () => {
    setupUseBlockedCountries();
    (createBlockedCountry as jest.Mock).mockRejectedValue(new Error('fail'));

    renderWithClient(<BlockedCountriesPage />);

    fireEvent.change(screen.getByPlaceholderText('Country code'), {
      target: { value: 'fr' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add Country' }));

    await waitFor(() =>
      expect(createBlockedCountry).toHaveBeenCalledWith({ country: 'FR' }),
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Failed to save blocked country',
    );
  });
});
