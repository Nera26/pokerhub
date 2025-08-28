import { Inject, Injectable } from '@nestjs/common';
import { ServiceStatusResponse } from '@shared/types';

@Injectable()
export class AppService {
  constructor(
    @Inject('API_CONTRACT_VERSION') private readonly version: string,
  ) {}

  getHello(): string {
    return 'Hello World!';
  }

  getStatus(): ServiceStatusResponse {
    return { status: 'ok', contractVersion: this.version };
  }
}
