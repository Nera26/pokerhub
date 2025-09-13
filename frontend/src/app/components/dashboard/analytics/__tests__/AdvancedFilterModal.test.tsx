import { render, screen } from '@testing-library/react';
import AdvancedFilterModal from '../AdvancedFilterModal';

describe('AdvancedFilterModal', () => {
  const defaultProps = {
    open: true,
    dateFrom: '',
    setDateFrom: jest.fn(),
    dateTo: '',
    setDateTo: jest.fn(),
    userFilter: '',
    setUserFilter: jest.fn(),
    resultLimit: 25,
    setResultLimit: jest.fn(),
    onApply: jest.fn(),
    onClear: jest.fn(),
    onClose: jest.fn(),
  };

  it('renders content inside Modal when open', () => {
    render(<AdvancedFilterModal {...defaultProps} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Advanced Filters')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<AdvancedFilterModal {...defaultProps} open={false} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
