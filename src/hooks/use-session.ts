'use client';

/**
 * Hook useSession — abstraction au-dessus de Supabase Auth pour partager
 * l'état de session dans tous les composants client.
 *
 * Pattern :
 * - Au mount : récupère la session initiale via supabase.auth.getSession()
 * - Souscrit à onAuthStateChange pour les updates (login/logout/refresh)
 * - Lit le profil étendu (full_name, role, points, tier) depuis public.users
 *
 * Usage :
 *   const { session, user, profile, loading } = useSession();
 *   if (loading) return null;
 *   if (!user) return <NotLoggedIn />;
 *   // user.id, profile.role, profile.points, etc.
 */

import { useCallback, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: 'customer' | 'admin' | 'support';
  points: number;
  tier: 'bronze' | 'argent' | 'or' | 'vip';
  newsletter: boolean;
  created_at: string;
}

export interface SessionState {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  /** Force un refresh manuel du profil (après update points par exemple) */
  refreshProfile: () => Promise<void>;
  /** Logout helper */
  signOut: () => Promise<void>;
}

export function useSession(): SessionState {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from('users')
      .select('id, email, full_name, role, points, tier, newsletter, created_at')
      .eq('id', userId)
      .single();

    if (error) {
      console.warn('[useSession] fetchProfile error:', error.message);
      setProfile(null);
      return;
    }
    setProfile(data as UserProfile);
  }, []);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    // 1. Session initiale
    supabase.auth.getSession().then(({ data: { session: s } }: { data: { session: Session | null } }) => {
      setSession(s);
      if (s?.user) {
        void fetchProfile(s.user.id);
      }
      setLoading(false);
    });

    // 2. Souscription aux changements (login/logout/refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: string, s: Session | null) => {
        setSession(s);
        if (s?.user) {
          void fetchProfile(s.user.id);
        } else {
          setProfile(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const refreshProfile = useCallback(async () => {
    if (session?.user) await fetchProfile(session.user.id);
  }, [session, fetchProfile]);

  const signOut = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
  }, []);

  return {
    session,
    user: session?.user ?? null,
    profile,
    loading,
    refreshProfile,
    signOut,
  };
}
