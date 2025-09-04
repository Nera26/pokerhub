import { ExceptionFilter, Catch, ArgumentsHost, BadRequestException } from '@nestjs/common';
import { ZodError } from 'zod';

@Catch(ZodError)
export class ZodExceptionFilter implements ExceptionFilter {
  catch(exception: ZodError, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse();
    const badRequest = new BadRequestException(exception.errors);
    const status = badRequest.getStatus();
    const res = badRequest.getResponse();
    response.status(status).json(res);
  }
}
