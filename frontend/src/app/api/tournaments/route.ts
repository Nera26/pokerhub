import { NextResponse } from 'next/server';

export const revalidate = 300; // tournaments are relatively stable

export async function GET() {
  const tournaments = [
    {
      id: '1',
      title: 'Weekend Warrior Special',
      buyIn: 50,
      fee: 5,
      prizePool: 10000,
      players: { current: 150, max: 300 },
      registered: false,
    },
    {
      id: '2',
      title: 'Sunday Million Satellite',
      buyIn: 11,
      fee: 0,
      prizePool: '5 Seats GTD',
      players: { current: 80, max: 200 },
      registered: false,
    },
    {
      id: '3',
      title: 'Daily Freeroll Frenzy',
      buyIn: 0,
      prizePool: 100,
      players: { current: 450, max: 1000 },
      registered: true,
    },
  ];

  return NextResponse.json(tournaments);
}
