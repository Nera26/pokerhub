import { Injectable } from '@nestjs/common';
import { TABLE_THEME } from '@shared/config/tableTheme';
import type { TableThemeResponse } from '@shared/types';

@Injectable()
export class TableThemeService {
  private theme: TableThemeResponse = { ...TABLE_THEME };

  get(): TableThemeResponse {
    return this.theme;
  }

  update(theme: TableThemeResponse): TableThemeResponse {
    this.theme = { ...theme };
    return this.theme;
  }
}
