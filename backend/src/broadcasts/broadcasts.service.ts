import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Broadcast, SendBroadcastRequest } from '../schemas/broadcasts';

@Injectable()
export class BroadcastsService {
  private broadcasts: Broadcast[] = [];

  list(): Broadcast[] {
    return this.broadcasts;
  }

  send(req: SendBroadcastRequest): Broadcast {
    const broadcast: Broadcast = {
      id: randomUUID(),
      type: req.type,
      text: req.text,
      urgent: req.urgent,
      timestamp: new Date().toISOString(),
    };
    this.broadcasts.unshift(broadcast);
    return broadcast;
  }
}
