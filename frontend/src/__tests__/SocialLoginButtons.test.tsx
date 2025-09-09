import { render, screen, fireEvent } from '@testing-library/react';
import SocialLoginButtons from '@/app/components/auth/SocialLoginButtons';
import { faGoogle, faFacebookF } from '@fortawesome/free-brands-svg-icons';

const popup = 'width=500,height=600';

describe('SocialLoginButtons', () => {
  let openSpy: jest.SpyInstance;

  beforeEach(() => {
    openSpy = jest.spyOn(window, 'open').mockImplementation(() => null);
  });

  afterEach(() => {
    openSpy.mockRestore();
  });

  it('opens Google OAuth popup', () => {
    render(<SocialLoginButtons />);
    fireEvent.click(screen.getByRole('button', { name: /google/i }));
    expect(openSpy).toHaveBeenCalledWith('/auth/google', 'GoogleLogin', popup);
  });

  it('opens Facebook OAuth popup', () => {
    render(<SocialLoginButtons />);
    fireEvent.click(screen.getByRole('button', { name: /facebook/i }));
    expect(openSpy).toHaveBeenCalledWith(
      '/auth/facebook',
      'FacebookLogin',
      popup,
    );
  });

  it('renders social icons', () => {
    render(<SocialLoginButtons />);
    expect(
      document.querySelector(`[data-icon='${faGoogle.iconName}']`),
    ).toBeInTheDocument();
    expect(
      document.querySelector(`[data-icon='${faFacebookF.iconName}']`),
    ).toBeInTheDocument();
  });
});
