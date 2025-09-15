import { render } from '@testing-library/react';
import RevenueDonut, { type RevenueStream } from '../RevenueDonut';

const useChartMock = jest.fn();
const useChartPaletteMock = jest.fn();

jest.mock('@/lib/useChart', () => ({
  useChart: (config: unknown) => {
    useChartMock(config);
    return { ref: { current: null }, ready: true };
  },
}));

jest.mock('@/hooks/useChartPalette', () => ({
  useChartPalette: () => useChartPaletteMock(),
}));

describe('RevenueDonut', () => {
  beforeEach(() => {
    useChartMock.mockReset();
    useChartPaletteMock.mockReset();
  });

  it('renders dynamic labels and falls back to default palette on error', () => {
    useChartPaletteMock.mockReturnValue({ data: undefined, isError: true });
    const streams: RevenueStream[] = [
      { label: 'Cash', pct: 50, value: 5000 },
      { label: 'Tournaments', pct: 30, value: 3000 },
      { label: 'Rake', pct: 20, value: 2000 },
    ];
    render(<RevenueDonut streams={streams} />);
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

  it('uses colors from palette when available', () => {
    useChartPaletteMock.mockReturnValue({
      data: ['#111', '#222'],
      isError: false,
    });
    const streams: RevenueStream[] = [
      { label: 'Cash', pct: 60 },
      { label: 'Tournaments', pct: 40 },
    ];
    render(<RevenueDonut streams={streams} />);
    const config = useChartMock.mock.calls[0][0] as {
      data: { datasets: { backgroundColor: string[] }[] };
    };
    expect(config.data.datasets[0].backgroundColor).toEqual(['#111', '#222']);
  });

  it('uses colors from palette', () => {
    const palette = ['#123', '#456', '#789'];
    useChartPaletteMock.mockReturnValue({ data: palette });
    const streams: RevenueStream[] = [
      { label: 'Cash', pct: 50 },
      { label: 'Tournaments', pct: 30 },
      { label: 'Rake', pct: 20 },
    ];
    render(<RevenueDonut streams={streams} />);
    const config = useChartMock.mock.calls[0][0] as {
      data: { datasets: { backgroundColor: string[] }[] };
    };
    expect(config.data.datasets[0].backgroundColor).toEqual(palette);
  });
});
