'use client';

import { create } from 'zustand';

interface AuthState {
  token: string | null;
  setToken: (token: string) => void;
  clearToken: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  token: null,
  setToken: (token) => set({ token }),
  clearToken: () => set({ token: null }),
}));

export const useAuthToken = () => useAuthStore((s) => s.token);
export const useAuthActions = (): Pick<AuthState, 'setToken' | 'clearToken'> =>
  useAuthStore((s) => ({ setToken: s.setToken, clearToken: s.clearToken }));
