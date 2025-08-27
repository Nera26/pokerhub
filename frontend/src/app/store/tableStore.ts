import { create } from 'zustand';

export type Money = number; // cents
export type SeatId = number;

export interface SeatState {
  id: SeatId;
  name: string;
  avatar: string;
  balance: Money; // stack behind line
  inHand: boolean;
}

export interface TablePot {
  main: Money;
  sidePots: Money[];
}

export interface CommitEvent {
  handId: string;
  actionId: string;
  seatId: SeatId;
  amount: Money;
  toSidePotIndex?: number;
}

export interface TableState {
  handId: string;
  seats: SeatState[];
  pot: TablePot;
  street: 'pre' | 'flop' | 'turn' | 'river' | 'showdown';
}

type TableSlice = {
  seatPositions: Record<SeatId, { x: number; y: number }>;
  setSeatPosition: (id: SeatId, pos: { x: number; y: number }) => void;
};

export const useTableStore = create<TableSlice>()((set) => ({
  seatPositions: {},
  setSeatPosition: (id, pos) =>
    set((state) => ({
      seatPositions: { ...state.seatPositions, [id]: pos },
    })),
}));

export const useSeatPositions = () => useTableStore((s) => s.seatPositions);
export const useSetSeatPosition = () => useTableStore((s) => s.setSeatPosition);
