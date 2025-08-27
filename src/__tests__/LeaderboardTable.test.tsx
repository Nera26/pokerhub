import { render } from '@testing-library/react';
import LeaderboardTable, {
  Player,
} from '@/app/components/leaderboard/LeaderboardTable';
import { waitFor } from '@testing-library/react';

describe('LeaderboardTable', () => {
  const basePlayers: Player[] = [
    {
      id: 1,
      username: 'Alice',
      avatar: '/a.png',
      winnings: 100,
      gamesPlayed: 10,
      winRate: 50,
      tier: 'Bronze',
      isCurrent: false,
      category: 'daily-cash',
    },
    {
      id: 2,
      username: 'Bob',
      avatar: '/b.png',
      winnings: 150,
      gamesPlayed: 5,
      winRate: 40,
      tier: 'Gold',
      isCurrent: false,
      category: 'daily-cash',
    },
    {
      id: 3,
      username: 'Charlie',
      avatar: '/c.png',
      winnings: 100,
      gamesPlayed: 8,
      winRate: 60,
      tier: 'Silver',
      isCurrent: false,
      category: 'daily-cash',
    },
    {
      id: 4,
      username: 'Dave',
      avatar: '/d.png',
      winnings: 100,
      gamesPlayed: 4,
      winRate: 60,
      tier: 'Silver',
      isCurrent: false,
      category: 'daily-cash',
    },
    {
      id: 5,
      username: 'Eve',
      avatar: '/e.png',
      winnings: 200,
      gamesPlayed: 2,
      winRate: 70,
      tier: 'Gold',
      isCurrent: false,
      category: 'weekly-cash',
    },
  ];

  it('filters by category and sorts players correctly', () => {
    const { container } = render(
      <LeaderboardTable
        data={basePlayers}
        selectedTime="daily"
        selectedMode="cash"
      />,
    );

    const rows = Array.from(container.querySelectorAll('tbody tr'));
    expect(rows).toHaveLength(4);
    const names = rows.map((row) =>
      row.querySelectorAll('td')[1].textContent?.trim(),
    );
    expect(names).toEqual(['Bob', 'Charlie', 'Dave', 'Alice']);
  });

  it('scrolls current user into view when outside top five', async () => {
    const scrollIntoView = jest.fn();
    const original = window.HTMLElement.prototype.scrollIntoView;
    window.HTMLElement.prototype.scrollIntoView = scrollIntoView;

    const players: Player[] = [
      {
        id: 1,
        username: 'P1',
        avatar: '/1.png',
        winnings: 600,
        gamesPlayed: 10,
        winRate: 50,
        tier: 'Bronze',
        isCurrent: false,
        category: 'daily-cash',
      },
      {
        id: 2,
        username: 'P2',
        avatar: '/2.png',
        winnings: 500,
        gamesPlayed: 10,
        winRate: 50,
        tier: 'Bronze',
        isCurrent: false,
        category: 'daily-cash',
      },
      {
        id: 3,
        username: 'P3',
        avatar: '/3.png',
        winnings: 400,
        gamesPlayed: 10,
        winRate: 50,
        tier: 'Bronze',
        isCurrent: false,
        category: 'daily-cash',
      },
      {
        id: 4,
        username: 'P4',
        avatar: '/4.png',
        winnings: 300,
        gamesPlayed: 10,
        winRate: 50,
        tier: 'Bronze',
        isCurrent: false,
        category: 'daily-cash',
      },
      {
        id: 5,
        username: 'P5',
        avatar: '/5.png',
        winnings: 200,
        gamesPlayed: 10,
        winRate: 50,
        tier: 'Bronze',
        isCurrent: false,
        category: 'daily-cash',
      },
      {
        id: 6,
        username: 'Me',
        avatar: '/me.png',
        winnings: 100,
        gamesPlayed: 10,
        winRate: 50,
        tier: 'Bronze',
        isCurrent: true,
        category: 'daily-cash',
      },
    ];

    render(
      <LeaderboardTable
        data={players}
        selectedTime="daily"
        selectedMode="cash"
      />,
    );

    await waitFor(() => {
      expect(scrollIntoView).toHaveBeenCalled();
    });

    window.HTMLElement.prototype.scrollIntoView = original;
  });
});
