import { exportCsv } from '@/lib/exportCsv';

describe('exportCsv', () => {
  it('clicks download link once', () => {
    const createObjectURL = jest.fn(() => 'blob:foo');
    const revokeObjectURL = jest.fn();
    // @ts-ignore
    URL.createObjectURL = createObjectURL;
    // @ts-ignore
    URL.revokeObjectURL = revokeObjectURL;
    const click = jest
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {});

    exportCsv('file.csv', ['A'], [['1']]);

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledTimes(1);
    expect(click).toHaveBeenCalledTimes(1);
  });
});
