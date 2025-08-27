import { NextResponse } from 'next/server';

export const revalidate = 30; // tables change often

export async function GET() {
  // For now, return mocked table data
  const tables = [
    {
      id: '1',
      tableName: 'Ante Up Arena',
      gameType: 'texas',
      stakes: { small: 1, big: 2 },
      players: { current: 5, max: 9 },
      buyIn: { min: 100, max: 500 },
      stats: { handsPerHour: 85, avgPot: 45, rake: 5 },
      createdAgo: '2h ago',
    },
    {
      id: '2',
      tableName: "Bluff Master's Den",
      gameType: 'texas',
      stakes: { small: 0.5, big: 1 },
      players: { current: 9, max: 9 },
      buyIn: { min: 50, max: 200 },
      stats: { handsPerHour: 92, avgPot: 28, rake: 5 },
      createdAgo: '4h ago',
    },
    {
      id: '3',
      tableName: 'River Rats Table',
      gameType: 'omaha',
      stakes: { small: 2, big: 5 },
      players: { current: 3, max: 9 },
      buyIn: { min: 200, max: 1000 },
      stats: { handsPerHour: 75, avgPot: 32, rake: 5 },
      createdAgo: '30m ago',
    },
    {
      id: '4',
      tableName: "High Roller's Hideout",
      gameType: 'allin',
      stakes: { small: 5, big: 10 },
      players: { current: 7, max: 9 },
      buyIn: { min: 500, max: 2000 },
      stats: { handsPerHour: 120, avgPot: 150, rake: 5 },
      createdAgo: '5h ago',
    },
  ];

  return NextResponse.json(tables);
}
