import { render, screen, fireEvent } from '@testing-library/react';
import SocialLoginButtons from '@/app/components/auth/SocialLoginButtons';

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
});
