import { onAuthStateChanged, User } from 'firebase/auth';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getAuthInstance, loginWithEmail, logout, registerWithEmail, sendReset } from '../data/auth';
import { firebaseConfigured } from '../data/firebase';
import { routeCache } from '../services/routeCache';

export type AuthUser = { uid: string; email: string | null; name: string | null };

type AuthValue = {
  user: AuthUser | null;
  loading: boolean;
  /** true quando o Firebase está configurado e o login é exigido */
  requiresLogin: boolean;
  isLoggedIn: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
};

const Ctx = createContext<AuthValue | null>(null);

const toUser = (u: User): AuthUser => ({ uid: u.uid, email: u.email, name: u.displayName });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(firebaseConfigured);

  useEffect(() => {
    if (!firebaseConfigured) return;
    return onAuthStateChanged(getAuthInstance(), (u) => {
      setUser(u ? toUser(u) : null);
      setLoading(false);
    });
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    await loginWithEmail(email, password);
  }, []);

  const signUp = useCallback(async (name: string, email: string, password: string) => {
    const u = await registerWithEmail(name, email, password);
    setUser(toUser(u)); // já com o nome atualizado
  }, []);

  const signOut = useCallback(async () => {
    routeCache.clear();
    await logout();
  }, []);

  const value = useMemo<AuthValue>(
    () => ({
      user,
      loading,
      requiresLogin: firebaseConfigured,
      isLoggedIn: !firebaseConfigured || !!user,
      signIn,
      signUp,
      signOut,
      resetPassword: sendReset,
    }),
    [user, loading, signIn, signUp, signOut],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth precisa estar dentro de AuthProvider');
  return v;
}
