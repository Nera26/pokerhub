import { screen } from '@testing-library/react';
import {
  renderChart,
  getChartConfig,
  resetChartMocks,
} from '../../__tests__/chartTestUtils';

const ActivityChart = require('../ActivityChart').default;

describe('ActivityChart', () => {
  afterEach(resetChartMocks);

  it('shows no data message when dataset is empty', () => {
    renderChart(<ActivityChart labels={[]} data={[]} />);
    expect(screen.getByText(/no data/i)).toBeInTheDocument();
  });

  it('passes data and labels to chart config', () => {
    const labels = ['0h', '4h'];
    const data = [1, 2];
    renderChart(<ActivityChart labels={labels} data={data} />);
    const config = getChartConfig();
    expect(config.data.labels).toEqual(labels);
    expect(config.data.datasets[0].data).toEqual(data);
  });
});
