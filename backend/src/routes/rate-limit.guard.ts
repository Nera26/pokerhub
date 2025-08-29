import {
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import {
  InjectThrottlerOptions,
  InjectThrottlerStorage,
  ThrottlerGuard,
  ThrottlerLimitDetail,
  ThrottlerModuleOptions,
  ThrottlerRequest,
  ThrottlerStorage,
} from '@nestjs/throttler';
import type { MessageResponse } from '@shared/types';

@Injectable()
export class RateLimitGuard extends ThrottlerGuard {
  constructor(
    @InjectThrottlerOptions() options: ThrottlerModuleOptions,
    @InjectThrottlerStorage() storage: ThrottlerStorage,
    reflector: Reflector,
    private readonly config: ConfigService,
  ) {
    super(options, storage, reflector);
  }

  protected async handleRequest(
    requestProps: ThrottlerRequest,
  ): Promise<boolean> {
    const ttl = this.config.get<number>('rateLimit.window', 60);
    const limit = this.config.get<number>('rateLimit.max', 5);
    return super.handleRequest({ ...requestProps, ttl, limit });
  }

  protected async throwThrottlingException(
    _context: ExecutionContext,
    _detail: ThrottlerLimitDetail,
  ): Promise<void> {
    const body: MessageResponse = { message: 'Too Many Requests' };
    throw new HttpException(body, HttpStatus.TOO_MANY_REQUESTS);
  }
}
