import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { setupTelemetry, shutdownTelemetry } from '../../telemetry/telemetry';

@Injectable()
export class OtelProvider implements OnModuleDestroy {
  constructor() {
    setupTelemetry();
  }

  async onModuleDestroy() {
    await shutdownTelemetry();
  }
}
