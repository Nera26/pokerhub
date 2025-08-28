export interface Player {
  id: number;
  username: string;
  avatar: string;
  chips: number;
  committed?: number;
  isActive?: boolean;
  isFolded?: boolean;
  sittingOut?: boolean;
  isAllIn?: boolean;
  isWinner?: boolean;
  timeLeft?: number;
  cards?: [string, string];
  pos?: string;              // BTN/SB/BB/UTG/…
  lastAction?: string;       // "bet $8", "called $4", "posted SB", "folded"
}
