import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BlockedCountriesPage from '../page';
import { renderWithClient } from '@/app/components/dashboard/__tests__/renderWithClient';
import { useRequireAdmin } from '@/hooks/useRequireAdmin';
import {
  fetchBlockedCountries,
  createBlockedCountry,
  updateBlockedCountry,
  deleteBlockedCountry,
} from '@/lib/api/blockedCountries';

jest.mock('@/hooks/admin/useCrudState', () => {
  const { buildCrudStateMock } =
    require('../../shared/__tests__/mockCrudState') as typeof import('../../shared/__tests__/mockCrudState');
  return {
    useCrudState: jest.fn(buildCrudStateMock()),
  };
});

jest.mock('@/hooks/useRequireAdmin', () => ({
  useRequireAdmin: jest.fn(),
}));

jest.mock('@/lib/api/blockedCountries', () => ({
  fetchBlockedCountries: jest.fn(),
  createBlockedCountry: jest.fn(),
  updateBlockedCountry: jest.fn(),
  deleteBlockedCountry: jest.fn(),
}));

const mockUseRequireAdmin = useRequireAdmin as jest.MockedFunction<
  typeof useRequireAdmin
>;
const mockFetchBlockedCountries = jest.mocked(fetchBlockedCountries);

function renderPage() {
  return renderWithClient(<BlockedCountriesPage />);
}

describe('BlockedCountriesPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchBlockedCountries.mockResolvedValue([]);
  });

  it('requires admin access', async () => {
    renderPage();
    await waitFor(() => expect(mockUseRequireAdmin).toHaveBeenCalled());
  });

  it('renders blocked countries in a table', async () => {
    mockFetchBlockedCountries.mockResolvedValueOnce([
      { country: 'CA' },
      { country: 'DE' },
    ]);

    renderPage();

    expect(await screen.findByText('CA')).toBeInTheDocument();
    expect(screen.getByText('DE')).toBeInTheDocument();
  });

  it('shows a validation error when the country is missing', async () => {
    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: 'Add Country' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Country code is required',
    );
  });

  it('creates a new blocked country', async () => {
    const user = userEvent.setup();
    mockFetchBlockedCountries
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ country: 'US' }]);
    jest.mocked(createBlockedCountry).mockResolvedValue({ country: 'US' });

    renderPage();

    const input = await screen.findByPlaceholderText('Country code');
    await user.type(input, 'us');

    await user.click(screen.getByRole('button', { name: 'Add Country' }));

    await waitFor(() =>
      expect(createBlockedCountry).toHaveBeenCalledWith({ country: 'US' }),
    );
    await waitFor(() => expect(fetchBlockedCountries).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(input).toHaveValue(''));
  });

  it('updates an existing blocked country', async () => {
    const user = userEvent.setup();
    mockFetchBlockedCountries
      .mockResolvedValueOnce([{ country: 'CA' }])
      .mockResolvedValueOnce([{ country: 'MX' }]);
    jest.mocked(updateBlockedCountry).mockResolvedValue({ country: 'MX' });

    renderPage();

    await user.click(await screen.findByRole('button', { name: 'Edit' }));
    const input = screen.getByPlaceholderText('Country code');
    await waitFor(() => expect(input).toHaveValue('CA'));
    await user.clear(input);
    await user.type(input, 'mx');
    await user.click(screen.getByRole('button', { name: 'Update Country' }));

    await waitFor(() =>
      expect(updateBlockedCountry).toHaveBeenCalledWith('CA', {
        country: 'MX',
      }),
    );
    await waitFor(() => expect(fetchBlockedCountries).toHaveBeenCalledTimes(2));
  });

  it('deletes a blocked country', async () => {
    mockFetchBlockedCountries
      .mockResolvedValueOnce([{ country: 'CA' }])
      .mockResolvedValueOnce([]);
    jest.mocked(deleteBlockedCountry).mockResolvedValue(undefined);

    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: 'Delete' }));

    await waitFor(() =>
      expect(deleteBlockedCountry).toHaveBeenCalledWith('CA'),
    );
    await waitFor(() => expect(fetchBlockedCountries).toHaveBeenCalledTimes(2));
  });

  it('renders an error state when the query fails', async () => {
    mockFetchBlockedCountries.mockRejectedValueOnce(
      new Error('Failed to load'),
    );

    renderPage();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Failed to load blocked countries: Failed to load',
    );
  });

  it('shows a failure message when create fails', async () => {
    const user = userEvent.setup();
    mockFetchBlockedCountries.mockResolvedValueOnce([]);
    jest
      .mocked(createBlockedCountry)
      .mockRejectedValue(new Error('save failed'));

    renderPage();

    const input = await screen.findByPlaceholderText('Country code');
    await user.type(input, 'fr');
    await user.click(screen.getByRole('button', { name: 'Add Country' }));

    await waitFor(() =>
      expect(createBlockedCountry).toHaveBeenCalledWith({ country: 'FR' }),
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Failed to save blocked country: save failed',
    );
  });
});
