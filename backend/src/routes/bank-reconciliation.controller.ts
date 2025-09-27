import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Body,
  HttpCode,
  BadRequestException,
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
import { promises as fs } from 'fs';

/** Minimal type that matches what we actually read from Multer */
type UploadLike = {
  buffer?: Buffer;
  path?: string;
};

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
    @UploadedFile() file: UploadLike | undefined,
    @Body() body: BankReconciliationRequest | unknown,
  ) {
    if (file) {
      let csv: string | undefined;

      if (file.buffer && file.buffer.length > 0) {
        csv = file.buffer.toString('utf-8');
      } else if (file.path) {
        csv = await fs.readFile(file.path, 'utf-8');
      }

      if (!csv) {
        throw new BadRequestException('Uploaded file is empty or unreadable.');
      }

      await this.reconciliation.reconcileCsv(csv);
    } else if (body && typeof body === 'object' && 'entries' in (body as any)) {
      const parsed = BankReconciliationRequestSchema.parse(body);
      await this.reconciliation.reconcileApi(parsed.entries);
    } else {
      throw new BadRequestException('Provide a CSV file or JSON entries.');
    }

    return MessageResponseSchema.parse({
      message: 'reconciled',
      contractVersion: API_CONTRACT_VERSION,
    });
  }
}
