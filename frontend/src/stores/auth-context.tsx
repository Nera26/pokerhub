import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useAuthStore, usePlayerId } from '@/stores/auth-store';
import { getStatus } from '@/lib/api/wallet';
import { fetchMe } from '@/lib/api/profile';

export interface AuthContextValue {
  playerId: string;
  token: string | null;
  realBalance: number;
  creditBalance: number;
  setBalances: (real: number, credit: number) => void;
  isLoading: boolean;
  error: string | null;
  avatarUrl: string | null;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
AuthContext.displayName = 'AuthContext';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const token = useAuthStore((s) => s.token);
  const avatarUrl = useAuthStore((s) => s.avatarUrl);
  const setAvatarUrl = useAuthStore((s) => s.setAvatarUrl);
  const playerId = usePlayerId();
  const [realBalance, setRealBalance] = useState(0);
  const [creditBalance, setCreditBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setBalances = useCallback(
    (real: number, credit: number) => {
      setRealBalance(real);
      setCreditBalance(credit);
    },
    [setCreditBalance, setRealBalance]
  );

  useEffect(() => {
    if (!token || !playerId) return;
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    getStatus(playerId)
      .then((res) => {
        if (cancelled) return;
        setBalances(res.realBalance, res.creditBalance);
        setIsLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setError('Failed to load wallet');
        setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [playerId, setBalances, token]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    fetchMe()
      .then((res) => {
        if (cancelled) return;
        setAvatarUrl(res.avatarUrl);
      })
      .catch(() => {
        if (cancelled) return;
        setAvatarUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [token, setAvatarUrl]);

  const value = useMemo<AuthContextValue>(
    () => ({
      playerId,
      token,
      realBalance,
      creditBalance,
      setBalances,
      isLoading,
      error,
      avatarUrl,
    }),
    [
      avatarUrl,
      creditBalance,
      error,
      isLoading,
      playerId,
      realBalance,
      setBalances,
      token,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function getAuthToken(): string | null {
  return useAuthStore.getState().token;
}
