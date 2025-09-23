'use client';

import { create } from 'zustand';

export type SeatId = number;
export type Money = number;

export type SeatPosition = {
  x: number;
  y: number;
};

export type CommitEvent = {
  actionId: string;
  seatId: SeatId;
  amount: Money;
  toSidePotIndex?: number;
};

interface TableStoreState {
  seatPositions: Record<SeatId, SeatPosition>;
  setSeatPosition: (seatId: SeatId, position: SeatPosition) => void;
}

const useTableStore = create<TableStoreState>((set) => ({
  seatPositions: {},
  setSeatPosition: (seatId, position) =>
    set((state) => ({
      seatPositions: {
        ...state.seatPositions,
        [seatId]: position,
      },
    })),
}));

export function useSeatPositions() {
  return useTableStore((state) => state.seatPositions);
}

export function useSetSeatPosition() {
  return useTableStore((state) => state.setSeatPosition);
}
