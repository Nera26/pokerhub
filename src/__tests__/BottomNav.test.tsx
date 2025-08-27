import { render, screen } from '@testing-library/react';
import BottomNav from '@/app/components/common/BottomNav';

const mockUsePathname = jest.fn();

jest.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
}));

jest.mock('next/link', () => {
  return ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  );
});

jest.mock(
  'next/image',
  () => (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt={props.alt} />;
  },
);

describe('BottomNav', () => {
  beforeEach(() => {
    mockUsePathname.mockReset();
  });

  it('activates item when pathname starts with href', () => {
    mockUsePathname.mockReturnValue('/wallet/deposit');
    render(<BottomNav />);
    const wallet = screen.getByRole('link', { name: 'Wallet' });
    expect(wallet.className).toContain('text-accent-yellow');
  });

  it('only marks lobby active on root path', () => {
    mockUsePathname.mockReturnValue('/');
    render(<BottomNav />);
    const lobby = screen.getByRole('link', { name: 'Lobby' });
    expect(lobby.className).toContain('text-accent-yellow');
    ['Wallet', 'Promotions', 'Leaders', /Alerts/, /Profile/].forEach(
      (label: string | RegExp) => {
        expect(
          screen.getByRole('link', { name: label }).className.split(' '),
        ).not.toContain('text-accent-yellow');
      },
    );
  });
});
