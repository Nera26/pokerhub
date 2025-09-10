import type { TableThemeResponse } from '@shared/types';

/**
 * Minimal fallback table theme.
 * The backend seeds the database with full position data via migration or
 * admin UI. Frontend consumers should expect `/api/config/table-theme` to
 * provide positions and use these defaults only when the API is unavailable.
 */
export const TABLE_THEME: TableThemeResponse = {
  hairline: 'var(--color-hairline)',
  positions: {},
};

export default TABLE_THEME;
