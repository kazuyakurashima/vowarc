import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Supabase configuration
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check .env file.');
}

// Check if running in server environment (API routes)
const isServer = typeof window === 'undefined';

// Custom storage implementation for Expo
// Uses SecureStore for mobile (more secure) and localStorage for web
// For server-side (API routes), returns null to avoid localStorage errors
const ExpoSecureStoreAdapter = {
  getItem: async (key: string) => {
    if (isServer) {
      // Server-side: no storage needed
      return null;
    }
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    return await SecureStore.getItemAsync(key);
  },
  setItem: async (key: string, value: string) => {
    if (isServer) {
      // Server-side: no-op
      return;
    }
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  },
  removeItem: async (key: string) => {
    if (isServer) {
      // Server-side: no-op
      return;
    }
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  },
};

// Create unified Supabase client (for client-side use)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter as any,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Server-side Supabase client with service role key (bypasses RLS)
// Only use this in API routes, never expose to client
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const getServerClient = () => {
  if (!supabaseServiceKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is not set. Required for API routes.'
    );
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

// Re-export types for convenience
export type * from './supabase/types';
