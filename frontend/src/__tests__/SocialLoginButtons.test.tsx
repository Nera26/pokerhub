import { render, screen, fireEvent } from '@testing-library/react';
import SocialLoginButtons from '@/app/components/auth/SocialLoginButtons';
import { faGoogle, faFacebookF } from '@fortawesome/free-brands-svg-icons';
import { useQuery } from '@tanstack/react-query';

jest.mock('@tanstack/react-query', () => ({ useQuery: jest.fn() }));
const useQueryMock = useQuery as unknown as jest.Mock;

const popup = 'width=500,height=600';

describe('SocialLoginButtons', () => {
  let openSpy: jest.SpyInstance;

  beforeEach(() => {
    openSpy = jest.spyOn(window, 'open').mockImplementation(() => null);
    useQueryMock.mockReset();
  });

  afterEach(() => {
    openSpy.mockRestore();
  });

  it('shows loading state', () => {
    useQueryMock.mockReturnValue({ isLoading: true });
    render(<SocialLoginButtons />);
    expect(screen.getByText('Loading providers...')).toBeInTheDocument();
  });

  it('shows error state', () => {
    useQueryMock.mockReturnValue({
      isLoading: false,
      error: new Error('fail'),
    });
    render(<SocialLoginButtons />);
    expect(screen.getByText('Error loading providers')).toBeInTheDocument();
  });

  it('renders providers and opens popup', () => {
    useQueryMock.mockReturnValue({
      isLoading: false,
      error: null,
      data: [
        { name: 'google', url: '/auth/google', label: 'Google' },
        { name: 'facebook', url: '/auth/facebook', label: 'Facebook' },
      ],
    });
    render(<SocialLoginButtons />);
    fireEvent.click(screen.getByRole('button', { name: /google/i }));
    expect(openSpy).toHaveBeenCalledWith('/auth/google', 'GoogleLogin', popup);
    fireEvent.click(screen.getByRole('button', { name: /facebook/i }));
    expect(openSpy).toHaveBeenCalledWith(
      '/auth/facebook',
      'FacebookLogin',
      popup,
    );
    expect(
      document.querySelector(`[data-icon='${faGoogle.iconName}']`),
    ).toBeInTheDocument();
    expect(
      document.querySelector(`[data-icon='${faFacebookF.iconName}']`),
    ).toBeInTheDocument();
  });
});
