import { NextResponse } from 'next/server';
import type { Player } from '@/app/components/tables/types';

interface ChatMessage {
  id: number;
  username: string;
  avatar: string;
  text: string;
  time: string;
}

export interface TableDetail {
  smallBlind: number;
  bigBlind: number;
  pot: number;
  communityCards: string[];
  players: Player[];
  chatMessages: ChatMessage[];
}

const tableDetails: Record<string, TableDetail> = {
  '1': {
    smallBlind: 1,
    bigBlind: 2,
    pot: 0,
    communityCards: [],
    players: [
      {
        id: 1,
        username: 'You',
        avatar: 'https://i.pravatar.cc/80?img=1',
        chips: 1250,
        cards: ['A♥', 'K♠'],
        isActive: true,
        committed: 0,
        pos: 'BTN',
      },
      {
        id: 2,
        username: 'Tom_H',
        avatar: 'https://i.pravatar.cc/80?img=2',
        chips: 1380,
        committed: 1,
        pos: 'SB',
        lastAction: 'posted SB',
      },
      {
        id: 3,
        username: 'Alex_B',
        avatar: 'https://i.pravatar.cc/80?img=3',
        chips: 2450,
        committed: 2,
        pos: 'BB',
        lastAction: 'posted BB',
      },
      {
        id: 4,
        username: 'UTG',
        avatar: 'https://i.pravatar.cc/80?img=4',
        chips: 2100,
        committed: 4,
        pos: 'UTG',
        lastAction: 'bet $4',
      },
      {
        id: 5,
        username: 'Emma_T',
        avatar: 'https://i.pravatar.cc/80?img=5',
        chips: 756,
        committed: 0,
        pos: 'UTG+1',
      },
      {
        id: 6,
        username: 'Dan_Q',
        avatar: 'https://i.pravatar.cc/80?img=9',
        chips: 1020,
        committed: 0,
        pos: 'MP',
      },
      {
        id: 7,
        username: 'Lisa_M',
        avatar: 'https://i.pravatar.cc/80?img=6',
        chips: 1890,
        committed: 0,
        pos: 'LJ',
      },
      {
        id: 8,
        username: 'Anna_R',
        avatar: 'https://i.pravatar.cc/80?img=7',
        chips: 1340,
        committed: 0,
        pos: 'HJ',
      },
      {
        id: 9,
        username: 'Mike_P',
        avatar: 'https://i.pravatar.cc/80?img=8',
        chips: 890,
        committed: 0,
        pos: 'CO',
        sittingOut: false,
      },
    ],
    chatMessages: [
      {
        id: 1,
        username: 'Admin',
        avatar: 'https://i.pravatar.cc/80?img=10',
        text: 'Welcome to the table!',
        time: '10:00',
      },
    ],
  },
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const table = tableDetails[id];
  if (!table) {
    return NextResponse.json({ message: 'Table not found' }, { status: 404 });
  }
  return NextResponse.json(table);
}
