import { render, screen } from '@testing-library/react';
import ErrorChart from '../ErrorChart';

const useChartPaletteMock = jest.fn();

jest.mock('@/hooks/useChartPalette', () => ({
  useChartPalette: () => useChartPaletteMock(),
}));

jest.mock('@/lib/useChart', () => ({
  buildChartConfig: (fn: any) =>
    fn({
      accent: '',
      border: '',
      text: '',
      hexToRgba: () => '',
    }),
  useChart: () => ({ ref: jest.fn() }),
}));

describe('ErrorChart', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  const labels = ['A', 'B'];
  const data = [1, 2];

  it('shows loading state', () => {
    useChartPaletteMock.mockReturnValue({
      isLoading: true,
      isError: false,
      data: undefined,
    });
    render(<ErrorChart labels={labels} data={data} />);
    expect(screen.getByText(/loading palette/i)).toBeInTheDocument();
  });

  it('shows error and uses fallback', () => {
    useChartPaletteMock.mockReturnValue({
      isLoading: false,
      isError: true,
      data: undefined,
    });
    const { container } = render(<ErrorChart labels={labels} data={data} />);
    expect(
      screen.getByText(/failed to load chart palette/i),
    ).toBeInTheDocument();
    expect(container.querySelector('canvas')).toBeInTheDocument();
  });

  it('renders chart when palette is loaded', () => {
    useChartPaletteMock.mockReturnValue({
      isLoading: false,
      isError: false,
      data: ['#111', '#222'],
    });
    const { container } = render(<ErrorChart labels={labels} data={data} />);
    expect(container.querySelector('canvas')).toBeInTheDocument();
  });
});
