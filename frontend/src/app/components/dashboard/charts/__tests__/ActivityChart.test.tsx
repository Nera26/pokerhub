import { render, screen } from '@testing-library/react';

const useChartMock = jest.fn();
const buildChartConfigMock = jest.fn((fn: any) =>
  fn({
    accent: '',
    border: '',
    text: '',
    hexToRgba: () => '',
  }),
);

jest.mock('@/lib/useChart', () => ({
  buildChartConfig: (...args: any[]) => buildChartConfigMock(...args),
  useChart: (config: unknown) => {
    useChartMock(config);
    return { ref: jest.fn(), ready: true };
  },
}));

const ActivityChart = require('../ActivityChart').default;

describe('ActivityChart', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('shows no data message when dataset is empty', () => {
    render(<ActivityChart labels={[]} data={[]} />);
    expect(screen.getByText(/no data/i)).toBeInTheDocument();
  });

  it('passes data and labels to chart config', () => {
    const labels = ['0h', '4h'];
    const data = [1, 2];
    render(<ActivityChart labels={labels} data={data} />);
    const builder = buildChartConfigMock.mock.calls[0][0];
    const config = builder({
      accent: '',
      border: '',
      text: '',
      hexToRgba: () => '',
    });
    expect(config.data.labels).toEqual(labels);
    expect(config.data.datasets[0].data).toEqual(data);
  });
});
