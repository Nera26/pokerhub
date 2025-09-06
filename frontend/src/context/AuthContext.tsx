import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react';
import { useAuthStore, usePlayerId } from '@/app/store/authStore';
import { getStatus } from '@/lib/api/wallet';

interface AuthContextValue {
  playerId: string;
  token: string | null;
  realBalance: number;
  creditBalance: number;
  setBalances: (real: number, credit: number) => void;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const token = useAuthStore((s) => s.token);
  const playerId = usePlayerId();
  const [realBalance, setRealBalance] = useState(0);
  const [creditBalance, setCreditBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setBalances = (real: number, credit: number) => {
    setRealBalance(real);
    setCreditBalance(credit);
  };

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
  }, [playerId, token]);

  return (
    <AuthContext.Provider
      value={{
        playerId,
        token,
        realBalance,
        creditBalance,
        setBalances,
        isLoading,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
