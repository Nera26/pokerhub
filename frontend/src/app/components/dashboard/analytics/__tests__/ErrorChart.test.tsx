import { render, screen } from '@testing-library/react';
import ErrorChart from '../ErrorChart';

const useChartPaletteMock = jest.fn();
const buildChartConfigMock = jest.fn((fn: any) =>
  fn({
    accent: '',
    border: '',
    text: '',
    hexToRgba: () => '',
  }),
);

jest.mock('@/hooks/useChartPalette', () => ({
  useChartPalette: () => useChartPaletteMock(),
}));

jest.mock('@/lib/useChart', () => ({
  buildChartConfig: (...args: any[]) => buildChartConfigMock(...args),
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

  it('shows error when palette fails to load', () => {
    useChartPaletteMock.mockReturnValue({
      isLoading: false,
      isError: true,
      data: undefined,
    });
    const { container } = render(<ErrorChart labels={labels} data={data} />);
    expect(
      screen.getByText(/failed to load chart palette/i),
    ).toBeInTheDocument();
    expect(container.querySelector('canvas')).not.toBeInTheDocument();
  });

  it('uses colors from API response', () => {
    useChartPaletteMock.mockReturnValue({
      isLoading: false,
      isError: false,
      data: ['#111', '#222'],
    });
    render(<ErrorChart labels={labels} data={data} />);
    const config = buildChartConfigMock.mock.results[0].value;
    expect(config.data.datasets[0].backgroundColor).toEqual(['#111', '#222']);
  });
});
