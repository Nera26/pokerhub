import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LanguageSelector from '@/app/components/common/LanguageSelector';
import { renderWithIntl } from '../../test/utils';
import { useRouter, useParams } from 'next/navigation';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useParams: jest.fn(),
}));

describe('LanguageSelector', () => {
  const refresh = jest.fn();
  const mockUseRouter = useRouter as jest.Mock;
  const mockUseParams = useParams as jest.Mock;
  const originalCookie = Object.getOwnPropertyDescriptor(
    Document.prototype,
    'cookie',
  )!;
  let cookieStore = '';

  beforeEach(() => {
    cookieStore = '';
    mockUseRouter.mockReturnValue({ refresh });
    mockUseParams.mockReturnValue({ locale: 'en' });
    Object.defineProperty(document, 'cookie', {
      configurable: true,
      get: () => cookieStore,
      set: (val) => {
        cookieStore = val;
      },
    });
  });

  afterEach(() => {
    Object.defineProperty(document, 'cookie', originalCookie);
    jest.clearAllMocks();
  });

  it('sets cookie with persistence and SameSite attributes', async () => {
    renderWithIntl(<LanguageSelector />, { locale: 'en' });

    const select = screen.getByLabelText(/language/i);
    await userEvent.selectOptions(select, 'es');

    expect(cookieStore).toBe(
      'locale=es; path=/; max-age=31536000; SameSite=Lax',
    );
    expect(refresh).toHaveBeenCalled();
  });
});
