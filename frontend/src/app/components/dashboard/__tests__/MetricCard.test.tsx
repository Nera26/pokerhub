import { render, screen } from '@testing-library/react';
import { faUsers } from '@fortawesome/free-solid-svg-icons';
import MetricCard from '../MetricCard';

describe('MetricCard', () => {
  it('shows loading state', () => {
    render(<MetricCard icon={faUsers} label="Users" value="10" loading />);
    expect(screen.getByText('Users')).toBeInTheDocument();
    expect(screen.getByText('...')).toBeInTheDocument();
  });

  it('shows error state', () => {
    render(<MetricCard icon={faUsers} label="Users" value="10" error />);
    expect(screen.getByText('Error')).toBeInTheDocument();
  });

  it('shows value when not loading or error', () => {
    render(<MetricCard icon={faUsers} label="Users" value="10" />);
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.queryByText('Error')).not.toBeInTheDocument();
  });
});
