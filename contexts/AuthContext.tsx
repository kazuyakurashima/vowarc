import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import {
  initializeRevenueCat,
  setRevenueCatUserId,
  logOutRevenueCat,
} from '@/lib/revenuecat';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize RevenueCat SDK
    initializeRevenueCat().catch((err) => {
      console.warn('RevenueCat initialization failed:', err);
    });

    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      // Set RevenueCat user ID if logged in
      if (session?.user?.id) {
        try {
          await setRevenueCatUserId(session.user.id);
        } catch (err) {
          console.warn('Failed to set RevenueCat user ID:', err);
        }
      }

      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      // Update RevenueCat user ID on auth change
      if (session?.user?.id) {
        try {
          await setRevenueCatUserId(session.user.id);
        } catch (err) {
          console.warn('Failed to set RevenueCat user ID:', err);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) throw error;
  };

  const signOut = async () => {
    // Log out of RevenueCat first
    try {
      await logOutRevenueCat();
    } catch (err) {
      console.warn('Failed to log out of RevenueCat:', err);
    }

    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const resetPassword = async (email: string) => {
    // Don't use redirectTo for Expo Go - it doesn't handle deep links well
    // Users will click the email link (which verifies the token), then manually return to the app
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
  };

  const value = {
    session,
    user,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
