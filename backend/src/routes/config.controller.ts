import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  ChipDenominationsResponse,
  TableThemeResponse,
} from '../schemas/config';
import { TABLE_THEME } from '@shared/config/tableTheme';

const CHIP_DENOMS: number[] = [1000, 100, 25];

@ApiTags('config')
@Controller('config')
export class ConfigController {
  @Get('chips')
  @ApiOperation({ summary: 'List chip denominations' })
  @ApiResponse({ status: 200, description: 'Chip denominations' })
  listChips(): ChipDenominationsResponse {
    return { denoms: CHIP_DENOMS };
  }

  @Get('table-theme')
  @ApiOperation({ summary: 'Get table theme' })
  @ApiResponse({ status: 200, description: 'Table theme mapping' })
  getTableTheme(): TableThemeResponse {
    return TABLE_THEME;
  }
}
