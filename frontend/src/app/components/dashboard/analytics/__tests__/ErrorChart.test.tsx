import { render, screen } from '@testing-library/react';

const useChartPaletteMock = jest.fn();
const useChartMock = jest.fn();
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
  useChart: (config: unknown) => {
    useChartMock(config);
    return { ref: jest.fn(), ready: true };
  },
}));

const ErrorChart = require('../ErrorChart').default;

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
    expect(screen.getByText(/loading chart/i)).toBeInTheDocument();
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
    const builder = buildChartConfigMock.mock.calls[0][0];
    const config = builder({
      accent: '',
      border: '',
      text: '',
      hexToRgba: () => '',
    });
    expect(config.data.datasets[0].backgroundColor).toEqual(['#111', '#222']);
  });
});
