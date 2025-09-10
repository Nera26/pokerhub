import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  ChipDenominationsResponse,
  TableThemeResponse,
} from '../schemas/config';

const CHIP_DENOMS: number[] = [1000, 100, 25];
const TABLE_THEME: TableThemeResponse = {
  hairline: 'var(--color-hairline)',
  positions: {
    BTN: {
      color: 'hsl(44,88%,60%)',
      glow: 'hsla(44,88%,60%,0.45)',
      badge: '/badges/btn.svg',
    },
    SB: {
      color: 'hsl(202,90%,60%)',
      glow: 'hsla(202,90%,60%,0.45)',
      badge: '/badges/sb.svg',
    },
    BB: {
      color: 'hsl(275,85%,65%)',
      glow: 'hsla(275,85%,65%,0.45)',
      badge: '/badges/bb.svg',
    },
    UTG: { color: 'var(--color-pos-utg)', glow: 'var(--glow-pos-utg)' },
    MP: { color: 'var(--color-pos-mp)', glow: 'var(--glow-pos-mp)' },
    CO: { color: 'var(--color-pos-co)', glow: 'var(--glow-pos-co)' },
    HJ: { color: 'var(--color-pos-hj)', glow: 'var(--glow-pos-hj)' },
    LJ: { color: 'var(--color-pos-lj)', glow: 'var(--glow-pos-lj)' },
  },
};

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
