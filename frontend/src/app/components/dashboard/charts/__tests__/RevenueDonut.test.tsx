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

  it('renders dynamic labels and default colors when palette is missing', () => {
    // No palette provided → falls back to default accent colors
    useChartPaletteMock.mockReturnValue({ data: undefined });

    renderChart(<RevenueDonut streams={streams} />);

    const config = useChartMock.mock.calls[0][0] as {
      data: {
        labels: string[];
        datasets: { data: number[]; backgroundColor: string[] }[];
      };
    };

    expect(config.data.labels).toEqual(streams.map((s) => s.label));
    expect(config.data.datasets[0].data).toEqual(streams.map((s) => s.pct));
    expect(config.data.datasets[0].backgroundColor).toEqual([
      'var(--color-accent-green)',
      'var(--color-accent-yellow)',
      'var(--color-accent-blue)',
    ]);
  });

  it('uses colors from chart palette', () => {
    useChartPaletteMock.mockReturnValue({ data: ['#111', '#222', '#333'] });

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
