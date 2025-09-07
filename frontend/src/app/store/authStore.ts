'use client';

import { create } from 'zustand';

interface AuthState {
  token: string | null;
  avatarUrl: string | null;
  setToken: (token: string) => void;
  clearToken: () => void;
  setAvatarUrl: (url: string | null) => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  token: null,
  avatarUrl: null,
  setToken: (token) => set({ token }),
  clearToken: () => set({ token: null, avatarUrl: null }),
  setAvatarUrl: (url) => set({ avatarUrl: url }),
}));

export const useAuthToken = () => useAuthStore((s) => s.token);
export const useAuthActions = (): Pick<
  AuthState,
  'setToken' | 'clearToken' | 'setAvatarUrl'
> => useAuthStore((s) => ({
  setToken: s.setToken,
  clearToken: s.clearToken,
  setAvatarUrl: s.setAvatarUrl,
}));

function decodePlayerId(token: string | null): string {
  if (!token) return '';
  try {
    const base64 = token.split('.')[1];
    const json =
      typeof window === 'undefined'
        ? Buffer.from(base64, 'base64').toString('utf8')
        : atob(base64);
    const payload = JSON.parse(json);
    return typeof payload.sub === 'string' ? payload.sub : '';
  } catch {
    return '';
  }
}

export const usePlayerId = () => useAuthStore((s) => decodePlayerId(s.token));
