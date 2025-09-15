import { ThemeColor, themeColorMap } from '../colors';

describe('themeColorMap', () => {
  it('maps each ThemeColor to a Tailwind class', () => {
    Object.values(ThemeColor).forEach((color) => {
      expect(themeColorMap[color].startsWith('bg-')).toBe(true);
    });
  });
});
