import { createTournamentModule } from '../utils/createTournamentModule';

function createRedis() {
  const store = new Map<string, string>();
  return {
    get: async (key: string) => store.get(key) ?? null,
    set: async (key: string, value: string) => {
      store.set(key, value);
      return 'OK';
    },
    del: async (key: string) => {
      store.delete(key);
      return 1;
    },
    keys: async (pattern: string) => {
      const regex = new RegExp('^' + pattern.replace('*', '.*') + '$');
      return Array.from(store.keys()).filter((k) => regex.test(k));
    },
    mget: async (keys: string[]) => keys.map((k) => store.get(k) ?? null),
  } as any;
}

describe('TournamentService level persistence', () => {
  let redis: any;

  beforeEach(() => {
    redis = createRedis();
  });

  it('restores level state from redis', async () => {
    const { service: s1, moduleRef: m1 } = await createTournamentModule({
      redis,
    });
    await s1.handleLevelUp('t1', 3);
    await s1.hotPatchLevel('t1', 2, 50, 100);
    await m1.close();

    const { service: s2, moduleRef: m2 } = await createTournamentModule({
      redis,
    });
    expect(s2.getCurrentLevel('t1')).toBe(3);
    expect(s2.getHotPatchedLevel('t1', 2)).toEqual({ smallBlind: 50, bigBlind: 100 });
    await m2.close();
  });
});
