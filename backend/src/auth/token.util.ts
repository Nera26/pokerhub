import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import type { Socket } from 'socket.io';

/**
 * Extracts the bearer token from either HTTP or WebSocket execution context.
 * Throws {@link UnauthorizedException} when the header is missing or malformed.
 */
export function extractBearerToken(context: ExecutionContext): string {
  let header: unknown;
  if (context.getType() === 'ws') {
    const client = context.switchToWs().getClient<Socket>();
    header = client?.handshake?.headers?.['authorization'];
  } else {
    const req = context.switchToHttp().getRequest();
    header = req?.headers?.['authorization'];
  }
  if (typeof header !== 'string' || !header.startsWith('Bearer ')) {
    throw new UnauthorizedException();
  }
  return header.slice(7);
}
