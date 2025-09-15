import {
  renderChart,
  useChartMock,
  useChartPaletteMock,
  resetChartMocks,
} from '../../__tests__/chartTestUtils';
import RevenueDonut, { type RevenueStream } from '../RevenueDonut';

describe('RevenueDonut', () => {
  afterEach(resetChartMocks);

  const streams: RevenueStream[] = [
    { label: 'Cash', pct: 50, value: 5000 },
    { label: 'Tournaments', pct: 30, value: 3000 },
    { label: 'Rake', pct: 20, value: 2000 },
  ];

  it('shows empty state when palette is missing', () => {
    useChartPaletteMock.mockReturnValue({ data: undefined, isError: false });

    const { container, getByText } = renderChart(
      <RevenueDonut streams={streams} />,
    );

    expect(getByText(/no data/i)).toBeInTheDocument();
    expect(container.querySelector('canvas')).not.toBeInTheDocument();
  });

  it('uses colors from chart palette', () => {
    useChartPaletteMock.mockReturnValue({
      data: ['#111', '#222', '#333'],
      isError: false,
    });

    renderChart(<RevenueDonut streams={streams} />);

    const config = useChartMock.mock.calls[0][0] as {
      data: { datasets: { backgroundColor: string[] }[] };
    };

    expect(config.data.datasets[0].backgroundColor).toEqual([
      '#111',
      '#222',
      '#333',
    ]);
  });
});
