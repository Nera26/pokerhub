import { createContext, useContext, useState, type ReactNode } from 'react';

interface AuthContextValue {
  playerId: string;
  token: string;
  realBalance: number;
  creditBalance: number;
  setBalances: (real: number, credit: number) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [playerId] = useState('u1');
  const [token] = useState('token');
  const [realBalance, setRealBalance] = useState(0);
  const [creditBalance, setCreditBalance] = useState(0);

  const setBalances = (real: number, credit: number) => {
    setRealBalance(real);
    setCreditBalance(credit);
  };

  return (
    <AuthContext.Provider value={{ playerId, token, realBalance, creditBalance, setBalances }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
