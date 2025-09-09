import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  ChipDenominationsResponse,
  ChipDenominationsResponseSchema,
} from '../schemas/config';

const DEFAULT_CHIPS: ChipDenominationsResponse = {
  denoms: [1000, 100, 25],
};

@ApiTags('config')
@Controller('config')
export class ConfigController {
  @Get('chips')
  @ApiOperation({ summary: 'List chip denominations' })
  @ApiResponse({ status: 200, description: 'Chip denominations' })
  listChips(): ChipDenominationsResponse {
    return ChipDenominationsResponseSchema.parse(DEFAULT_CHIPS);
  }
}
