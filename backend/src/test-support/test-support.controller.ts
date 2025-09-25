import { Body, Controller, Delete, Param, Post } from '@nestjs/common';
import { z } from 'zod';
import { TestSupportService } from './test-support.service';

const SeedUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['Admin', 'Player']).optional(),
});

const SeedCollusionSchema = z
  .object({
    sessionId: z.string().optional(),
    users: z.array(z.string()).min(1).optional(),
    features: z.record(z.any()).optional(),
  })
  .default({});

@Controller('test')
export class TestSupportController {
  constructor(private readonly support: TestSupportService) {}

  @Post('users')
  async ensureUser(@Body() body: unknown) {
    const parsed = SeedUserSchema.parse(body);
    const user = await this.support.ensureUser(parsed);
    return {
      id: user.id,
      email: user.email,
      role: user.role,
    };
  }

  @Post('collusion/flag')
  async seedCollusion(@Body() body: unknown) {
    const parsed = SeedCollusionSchema.parse(body ?? {});
    const result = await this.support.seedCollusionFlag(parsed);
    return {
      id: result.sessionId,
      users: result.users,
      status: 'flagged' as const,
    };
  }

  @Delete('collusion/:sessionId')
  async deleteCollusion(@Param('sessionId') sessionId: string) {
    await this.support.deleteCollusion(sessionId);
    return { message: 'deleted' };
  }
}
