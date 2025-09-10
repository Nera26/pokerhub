export const profile = {
  username: 'Admin',
  email: 'admin@example.com',
  avatarUrl: '/a.png',
  bank: '',
  location: '',
  joined: '2024-01-01T00:00:00Z',
  bio: '',
  experience: 0,
  balance: 0,
};

export function mockProfile(overrides: Partial<typeof profile> = {}) {
  return {
    fetchProfile: jest.fn().mockResolvedValue({ ...profile, ...overrides }),
  };
}
