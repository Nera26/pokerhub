import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Body,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '../auth/auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { BankReconciliationService } from '../wallet/bank-reconciliation.service';
import {
  BankReconciliationRequestSchema,
  type BankReconciliationRequest,
} from '@shared/wallet.schema';
import { MessageResponseSchema } from '../schemas/auth';
import { API_CONTRACT_VERSION } from '@shared/constants';
import type { Request } from 'express';
import 'multer';

@ApiTags('admin')
@UseGuards(AuthGuard, AdminGuard)
@Controller('admin/deposits')
export class BankReconciliationController {
  constructor(private readonly reconciliation: BankReconciliationService) {}

  @Post('reconcile')
  @HttpCode(200)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Reconcile bank deposits' })
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiBody({
    description: 'Upload CSV file or provide JSON entries',
    schema: {
      oneOf: [
        {
          type: 'object',
          properties: {
            file: { type: 'string', format: 'binary' },
          },
        },
        {
          type: 'object',
          properties: {
            entries: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  reference: { type: 'string' },
                  amount: { type: 'number' },
                },
                required: ['reference', 'amount'],
              },
            },
          },
          required: ['entries'],
        },
      ],
    },
  })
  @ApiResponse({ status: 200, description: 'Reconciliation completed' })
  async reconcile(
    @UploadedFile() file: Request['file'] | undefined,
    @Body() body: BankReconciliationRequest | unknown,
  ) {
    if (file && file.buffer) {
      await this.reconciliation.reconcileCsv(file.buffer.toString('utf-8'));
    } else if (body && typeof body === 'object' && 'entries' in (body as any)) {
      const parsed = BankReconciliationRequestSchema.parse(body);
      await this.reconciliation.reconcileApi(parsed.entries);
    }

    return MessageResponseSchema.parse({
      message: 'reconciled',
      contractVersion: API_CONTRACT_VERSION,
    });
  }
}
