import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  getStatus(): { status: string } {
    return { status: 'ok' };
  }
}
