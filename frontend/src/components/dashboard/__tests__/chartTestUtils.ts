import { render } from '@testing-library/react';
import type { ReactElement } from 'react';

export const chartPalette = {
  accent: '',
  border: '',
  text: '',
  hexToRgba: () => '',
};

export const useChartPaletteMock = jest.fn();
export const useChartMock = jest.fn();
export const buildChartConfigMock = jest.fn((fn: any) => fn(chartPalette));

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

export function getChartConfig(callIndex = 0) {
  return buildChartConfigMock.mock.results[callIndex]?.value;
}

export function renderChart(ui: ReactElement) {
  return render(ui);
}

export function resetChartMocks() {
  jest.resetAllMocks();
  buildChartConfigMock.mockImplementation((fn: any) => fn(chartPalette));
}
