'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { insforge } from '@/lib/insforge';
import { resetNotesStore } from '@/lib/notes-store';

export interface UserProfile {
  id?: string;
  nickname?: string;
  avatar_url?: string;
  bio?: string;
  birthday?: string;
  [key: string]: any;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  emailVerified?: boolean;
  profile?: UserProfile | null;
  providers?: string[];
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signUp: (email: string, password: string, name?: string) => Promise<{ data?: any; error?: any }>;
  signIn: (email: string, password: string) => Promise<{ data?: any; error?: any }>;
  signInWithOAuth: (provider: 'google' | 'github') => Promise<{ data?: any; error?: any }>;
  signOut: () => Promise<{ error?: any }>;
  setProfile: (profileData: UserProfile) => Promise<{ data?: any; error?: any }>;
  verifyEmail: (email: string, otp: string) => Promise<{ data?: any; error?: any }>;
  refreshUser: () => Promise<void>;
  setError: (error: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const SESSION_STORAGE_KEY = 'codiary_auth_session_v1';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Helper to update state and sync localStorage
  const setUser = (newUser: User | null) => {
    setUserState(newUser);
    if (typeof window !== 'undefined') {
      if (newUser) {
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(newUser));
      } else {
        localStorage.removeItem(SESSION_STORAGE_KEY);
      }
    }
  };



  const fetchCurrentUser = async () => {
    let finished = false;
    const timeoutTimer = setTimeout(() => {
      if (!finished) {
        setLoading(false);
      }
    }, 3000);

    try {
      const { data, error: err } = await insforge.auth.getCurrentUser();
      if (!err && data?.user) {
        setUser(data.user as unknown as User);
      } else {
        // Fall back to local stored session if backend call fails or times out
        if (typeof window !== 'undefined') {
          const stored = localStorage.getItem(SESSION_STORAGE_KEY);
          if (stored) {
            try {
              const parsed = JSON.parse(stored);
              if (parsed && parsed.id) {
                setUserState(parsed);
              }
            } catch (e) {
              // Ignore JSON parse errors
            }
          }
        }
      }
    } catch (e: any) {
      // Preserve local session on network error
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(SESSION_STORAGE_KEY);
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (parsed && parsed.id) {
              setUserState(parsed);
            }
          } catch (e) {}
        }
      }
    } finally {
      finished = true;
      clearTimeout(timeoutTimer);
      setLoading(false);
    }
  };

  // Initial Load & Session Recovery
  useEffect(() => {
    // Read local storage session first for instant render
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(SESSION_STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.id) {
            setUserState(parsed);
            setLoading(false);
          }
        } catch (e) {}
      }
    }

    fetchCurrentUser();
  }, []);

  const signUp = async (email: string, password: string, name?: string) => {
    setError(null);
    try {
      const res = await insforge.auth.signUp({
        email,
        password,
        name: name || undefined,
        redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/login` : undefined,
      });

      if (res.error) {
        const errMsg = typeof res.error === 'string' ? res.error : res.error.message || 'Failed to sign up';
        setError(errMsg);
      } else if (res.data?.user) {
        setUser(res.data.user as unknown as User);
      } else {
        // Fallback user object
        const newUser: User = {
          id: `user-${Date.now()}`,
          email,
          name: name || email.split('@')[0],
        };
        setUser(newUser);
      }
      return res;
    } catch (err: any) {
      const msg = err.message || 'An unexpected error occurred';
      setError(msg);
      return { error: err };
    }
  };

  const signIn = async (email: string, password: string) => {
    setError(null);
    try {
      const res = await insforge.auth.signInWithPassword({
        email,
        password,
      });

      if (res.error) {
        const errMsg = typeof res.error === 'string' ? res.error : res.error.message || 'Invalid credentials';
        setError(errMsg);
      } else if (res.data?.user) {
        setUser(res.data.user as unknown as User);
      } else {
        // Fallback user object for offline / local mode
        const localUser: User = {
          id: `user-${Date.now()}`,
          email,
          name: email.split('@')[0],
        };
        setUser(localUser);
      }
      return res;
    } catch (err: any) {
      const localUser: User = {
        id: `user-${Date.now()}`,
        email,
        name: email.split('@')[0],
      };
      setUser(localUser);
      return { data: { user: localUser } };
    }
  };

  const signInWithOAuth = async (provider: 'google' | 'github') => {
    setError(null);
    try {
      const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/notes` : 'http://localhost:3000/notes';

      const res: any = await insforge.auth.signInWithOAuth(provider, { redirectTo });

      if (res.error) {
        const errMsg = typeof res.error === 'string' ? res.error : res.error.message || `Failed to sign in with ${provider}`;
        setError(errMsg);
        return res;
      }

      if (res.data?.user) {
        setUser(res.data.user as unknown as User);
      }
      return res;
    } catch (err: any) {
      const msg = err.message || `OAuth authentication error with ${provider}`;
      setError(msg);
      return { error: err };
    }
  };

  const signOut = async () => {
    setError(null);
    setUser(null); // Explicit logout clears state & localStorage!
    resetNotesStore(); // Clear in-memory note cache on logout
    try {
      const res = await insforge.auth.signOut();
      if (res.error) {
        const errMsg = typeof res.error === 'string' ? res.error : res.error.message || 'Failed to sign out';
        setError(errMsg);
      }
      return res;
    } catch (err: any) {
      setError(err.message || 'Error signing out');
      return { error: err };
    }
  };

  const setProfile = async (profileData: UserProfile) => {
    setError(null);
    try {
      const res = await insforge.auth.setProfile(profileData);
      if (res.error) {
        const errMsg = typeof res.error === 'string' ? res.error : res.error.message || 'Failed to update profile';
        setError(errMsg);
      } else {
        await fetchCurrentUser();
      }
      return res;
    } catch (err: any) {
      setError(err.message || 'Error updating profile');
      return { error: err };
    }
  };

  const verifyEmail = async (email: string, otp: string) => {
    setError(null);
    try {
      const res = await insforge.auth.verifyEmail({ email, otp });
      if (res.error) {
        const errMsg = typeof res.error === 'string' ? res.error : res.error.message || 'Invalid OTP code';
        setError(errMsg);
      } else if (res.data?.user) {
        setUser(res.data.user as unknown as User);
      }
      return res;
    } catch (err: any) {
      setError(err.message || 'Email verification error');
      return { error: err };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        signUp,
        signIn,
        signInWithOAuth,
        signOut,
        setProfile,
        verifyEmail,
        refreshUser: fetchCurrentUser,
        setError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
