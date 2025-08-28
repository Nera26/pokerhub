import { buildMetadata } from '@/lib/metadata';

jest.mock('@/lib/base-url', () => ({ getBaseUrl: () => 'http://base' }));

describe('buildMetadata', () => {
  it('returns defaults', () => {
    expect(buildMetadata()).toEqual({
      title: 'PokerHub',
      description: "Live Texas Hold'em, Omaha & Tournaments — PokerHub",
      image: 'http://base/pokerhub-logo.svg',
      url: 'http://base',
    });
  });
});
