'use client';

import useSocket from './useSocket';
import { sendAction, join, buyIn, sitOut, rebuy } from '@/lib/socket';

export default function useGameSocket() {
  const socket = useSocket('game');
  return { socket, sendAction, join, buyIn, sitout: sitOut, rebuy } as const;
}
