import { screen } from '@testing-library/react';
import {
  renderChart,
  useChartPaletteMock,
  getChartConfig,
  resetChartMocks,
} from '../../__tests__/chartTestUtils';

const ErrorChart = require('../ErrorChart').default;

describe('ErrorChart', () => {
  afterEach(resetChartMocks);

  const labels = ['A', 'B'];
  const data = [1, 2];

  it('shows loading state', () => {
    useChartPaletteMock.mockReturnValue({
      isLoading: true,
      isError: false,
      data: undefined,
    });
    renderChart(<ErrorChart labels={labels} data={data} />);
    expect(screen.getByText(/loading chart/i)).toBeInTheDocument();
  });

  it('shows error when palette fails to load', () => {
    useChartPaletteMock.mockReturnValue({
      isLoading: false,
      isError: true,
      data: undefined,
    });
    const { container } = renderChart(
      <ErrorChart labels={labels} data={data} />,
    );
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
    renderChart(<ErrorChart labels={labels} data={data} />);
    const config = getChartConfig();
    expect(config.data.datasets[0].backgroundColor).toEqual(['#111', '#222']);
  });
});
