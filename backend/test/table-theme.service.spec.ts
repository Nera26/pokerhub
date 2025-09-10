import { TableThemeService } from '../src/services/table-theme.service';
import { TABLE_THEME } from '@shared/config/tableTheme';

const updatedTheme = { ...TABLE_THEME, hairline: 'var(--color-alt)' };

describe('TableThemeService', () => {
  it('gets and updates table theme', () => {
    const service = new TableThemeService();
    expect(service.get()).toEqual(TABLE_THEME);
    service.update(updatedTheme);
    expect(service.get()).toEqual(updatedTheme);
  });
});
