import { render, screen } from '@testing-library/react';
import Avatar from '../Avatar';

describe('Avatar', () => {
  it('renders with accessible name and default size', () => {
    render(<Avatar name="Alice" />);
    const avatar = screen.getByRole('img', { name: 'Alice' });
    expect(avatar).toBeInTheDocument();
    expect(avatar).toHaveStyle({ width: '28px', height: '28px' });
    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('applies custom size via props', () => {
    render(<Avatar name="Bob" size={40} />);
    const avatar = screen.getByRole('img', { name: 'Bob' });
    expect(avatar).toHaveStyle({ width: '40px', height: '40px' });
  });
});
