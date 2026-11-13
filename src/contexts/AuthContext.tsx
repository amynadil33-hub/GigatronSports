import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface AuthCtx {
  user: any | null;
  loading: boolean;
  isAdmin: boolean;
  adminCheckError: string | null;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthCtx | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminCheckError, setAdminCheckError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    let requestId = 0;
    const pendingChecks = new Set<ReturnType<typeof setTimeout>>();

    const applySession = async (session: any | null) => {
      const currentRequest = ++requestId;
      const nextUser = session?.user ?? null;
      setUser(nextUser);
      setAdminCheckError(null);
      if (!nextUser) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.rpc('is_admin');
      if (!active || currentRequest !== requestId) return;

      setIsAdmin(!error && data === true);
      if (error) {
        console.error('Unable to verify administrator access:', error.message);
        setAdminCheckError('Unable to verify administrator access. Please try again.');
      }
      setLoading(false);
    };

    supabase.auth.getSession().then(({ data }) => {
      if (active) void applySession(data.session);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setLoading(true);
      // Supabase invokes auth callbacks while its auth lock is held. Defer the
      // database role check so its request cannot deadlock waiting for that lock.
      const timeout = setTimeout(() => {
        pendingChecks.delete(timeout);
        if (active) void applySession(session);
      }, 0);
      pendingChecks.add(timeout);
    });
    return () => {
      active = false;
      requestId += 1;
      pendingChecks.forEach(clearTimeout);
      sub.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error) return { error: null };

    const message = error.message.toLowerCase();
    if (message.includes('failed to fetch') || message.includes('network')) {
      return { error: 'The authentication service is unavailable. Please check the Supabase project configuration.' };
    }

    return { error: error.message };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAdmin(false);
    setAdminCheckError(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, adminCheckError, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
