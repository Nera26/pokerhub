export interface Session {
  playerId: string;
  ip: string;
}

export interface Transfer {
  from: string;
  to: string;
  amount: number;
}

export interface BetEvent {
  handId: string;
  playerId: string;
  timeMs: number;
}
