import { render, screen } from '@testing-library/react';
import { useLocale } from 'next-intl';
import { useTranslations } from '@/hooks/useTranslations';
import { useAuditLogTypes } from '@/hooks/lookups';
import SearchBar from '@/app/components/dashboard/analytics/SearchBar';

jest.mock('next-intl', () => ({
  useLocale: jest.fn(),
}));

jest.mock('@/hooks/useTranslations', () => ({
  useTranslations: jest.fn(),
}));

jest.mock('@/hooks/lookups', () => ({
  useAuditLogTypes: jest.fn(),
}));

const mockedUseLocale = jest.mocked(useLocale);
const mockedUseTranslations = jest.mocked(useTranslations);
const mockedUseAuditLogTypes = jest.mocked(useAuditLogTypes);

describe('Analytics SearchBar translations', () => {
  const renderComponent = () =>
    render(
      <SearchBar
        search=""
        setSearch={jest.fn()}
        type="all"
        setType={jest.fn()}
        onSubmit={jest.fn()}
      />,
    );

  beforeEach(() => {
    jest.resetAllMocks();
    mockedUseLocale.mockReturnValue('en');
    mockedUseAuditLogTypes.mockReturnValue({
      data: { types: ['security'] },
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useAuditLogTypes>);
    mockedUseTranslations.mockReturnValue({
      data: undefined,
    } as unknown as ReturnType<typeof useTranslations>);
  });

  it('uses translated placeholder text when available', () => {
    mockedUseTranslations.mockReturnValue({
      data: { auditSearchPlaceholder: 'Custom audit search' },
    } as unknown as ReturnType<typeof useTranslations>);

    renderComponent();

    expect(screen.getByRole('textbox')).toHaveAttribute(
      'placeholder',
      'Custom audit search',
    );
  });

  it('falls back to default placeholder when translation is missing', () => {
    const { container } = renderComponent();

    expect(screen.getByRole('textbox')).toHaveAttribute(
      'placeholder',
      'Search…',
    );
    expect(container).toMatchSnapshot();
  });
});
