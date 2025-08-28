import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { FlaggedSessionJob } from '../analytics/flagged-session.job';
import { CollusionService } from '../analytics/collusion.service';
import {
  FlaggedSessionsResponse,
  FlaggedSessionsResponseSchema,
  ReviewActionRequest,
  ReviewActionRequestSchema,
} from '../schemas/review';
import { MessageResponse, MessageResponseSchema } from '../schemas/auth';
import { ZodError } from 'zod';

@Controller('admin')
export class AdminController {
  constructor(
    private readonly job: FlaggedSessionJob,
    private readonly collusion: CollusionService,
  ) {}

  @Get('flagged-sessions')
  listFlagged() {
    return this.job.getSessions();
  }

  @Get('collusion/flags')
  async listCollusionFlags(): Promise<FlaggedSessionsResponse> {
    const sessions = await this.collusion.listFlaggedSessions();
    return FlaggedSessionsResponseSchema.parse(sessions);
  }

  @Post('collusion/:id')
  async applyCollusionAction(
    @Param('id') id: string,
    @Body() body: ReviewActionRequest,
  ): Promise<MessageResponse> {
    try {
      const parsed = ReviewActionRequestSchema.parse(body);
      await this.collusion.applyAction(id, parsed.action);
      return MessageResponseSchema.parse({ message: parsed.action });
    } catch (err) {
      if (err instanceof ZodError) {
        throw new BadRequestException(err.errors);
      }
      throw err;
    }
  }
}
