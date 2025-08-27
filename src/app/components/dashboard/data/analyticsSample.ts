export type LogType = 'Login' | 'Table Event' | 'Broadcast' | 'Error';

export type LogRow = {
  id: number;
  date: string;
  type: LogType;
  description: string;
  user: string;
  ip: string;
};

export const SAMPLE_LOGS: LogRow[] = [
  {
    id: 1,
    date: '2024-01-15 14:32:18',
    type: 'Login',
    description: 'User successfully logged in from IP 192.168.1.45',
    user: 'Mike_P',
    ip: '192.168.1.45',
  },
  {
    id: 2,
    date: '2024-01-15 14:28:42',
    type: 'Table Event',
    description: 'Player joined table #45821 with $2,500 buy-in',
    user: 'Sarah_K',
    ip: '192.168.1.67',
  },
  {
    id: 3,
    date: '2024-01-15 14:25:17',
    type: 'Broadcast',
    description: 'System announcement: Tournament starting in 30 minutes',
    user: 'System',
    ip: '-',
  },
  {
    id: 4,
    date: '2024-01-15 14:22:33',
    type: 'Error',
    description: 'Failed payment processing for user withdrawal request',
    user: 'Alex_R',
    ip: '10.0.0.15',
  },
  {
    id: 5,
    date: '2024-01-15 14:18:56',
    type: 'Login',
    description: 'User logged out after 2h 45m session',
    user: 'Tom_W',
    ip: '172.16.0.7',
  },
  {
    id: 6,
    date: '2024-01-15 14:15:22',
    type: 'Table Event',
    description: 'New table #45826 created with $5/$10 stakes',
    user: 'Admin',
    ip: '10.0.0.5',
  },
  {
    id: 7,
    date: '2024-01-15 14:12:08',
    type: 'Error',
    description: 'Database connection timeout during hand processing',
    user: 'System',
    ip: '-',
  },
  {
    id: 8,
    date: '2024-01-15 14:09:41',
    type: 'Broadcast',
    description: 'Weekly bonus promotion activated for all users',
    user: 'Admin',
    ip: '10.0.0.8',
  },
];

export const TYPE_BADGE_CLASSES: Record<LogType, string> = {
  Login: 'bg-success text-black',
  'Table Event': 'bg-accent text-black',
  Broadcast: 'bg-info text-white',
  Error: 'bg-danger text-white',
};
