import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'PokerHub backend is running';
  }

  getHealth() {
    return { status: 'ok' };
  }
}
