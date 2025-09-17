import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import {
  AntiCheatFlagSchema,
  AntiCheatFlagsResponseSchema,
  AntiCheatFlagUpdateRequestSchema,
  AntiCheatNextActionQuerySchema,
  AntiCheatNextActionResponseSchema,
  type AntiCheatFlag,
  type AntiCheatReviewStatus,
} from '@shared/types';
import { CollusionService } from '../analytics/collusion.service';
import { AuthGuard } from '../auth/auth.guard';
import { AdminGuard } from '../auth/admin.guard';

const REVIEW_ORDER: AntiCheatReviewStatus[] = [
  'flagged',
  'warn',
  'restrict',
  'ban',
];

@UseGuards(AuthGuard, AdminGuard)
@ApiTags('anti-cheat')
@Controller('anti-cheat')
export class AntiCheatController {
  constructor(private readonly collusion: CollusionService) {}

  @Get('flags')
  @ApiOperation({ summary: 'List flagged sessions requiring review' })
  @ApiResponse({ status: 200, description: 'Flagged sessions with history' })
  async listFlags(): Promise<AntiCheatFlag[]> {
    const sessions = await this.collusion.listFlaggedSessions();
    const withHistory = await Promise.all(
      sessions.map(async (session) => {
        const history = await this.collusion.getActionHistory(session.id);
        return AntiCheatFlagSchema.parse({
          id: session.id,
          users: session.users,
          status: session.status,
          history,
        });
      }),
    );
    return AntiCheatFlagsResponseSchema.parse(withHistory);
  }

  @Put('flags/:id')
  @ApiOperation({ summary: 'Apply the next anti-cheat action to a session' })
  @ApiResponse({ status: 200, description: 'Updated flag with history' })
  async updateFlag(
    @Param('id') id: string,
    @Body() body: unknown,
    @Req() req: Request,
  ): Promise<AntiCheatFlag> {
    const { action } = AntiCheatFlagUpdateRequestSchema.parse(body);
    const reviewerId = (req as Request & { userId?: string }).userId ?? 'admin';
    try {
      await this.collusion.applyAction(id, action, reviewerId);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Session not found') {
          throw new NotFoundException(error.message);
        }
        throw new BadRequestException(error.message);
      }
      throw error;
    }

    const [history, sessions] = await Promise.all([
      this.collusion.getActionHistory(id),
      this.collusion.listFlaggedSessions({ page: 1, pageSize: 100, status: action }),
    ]);
    const flag = sessions.find((session) => session.id === id);
    if (!flag) {
      throw new NotFoundException('Flag not found');
    }
    return AntiCheatFlagSchema.parse({
      id: flag.id,
      users: flag.users,
      status: flag.status,
      history,
    });
  }

  @Get('next-action')
  @ApiOperation({ summary: 'Determine the next anti-cheat action' })
  @ApiResponse({ status: 200, description: 'Next actionable escalation, if any' })
  async nextAction(@Query() query: unknown) {
    const { current } = AntiCheatNextActionQuerySchema.parse(query);
    const currentIndex = REVIEW_ORDER.indexOf(current);
    const next =
      currentIndex >= 0 && currentIndex < REVIEW_ORDER.length - 1
        ? REVIEW_ORDER[currentIndex + 1]
        : null;
    return AntiCheatNextActionResponseSchema.parse({ next });
  }
}
