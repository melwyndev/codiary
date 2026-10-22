'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { AppNavbar } from '@/components/app-navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, ShieldCheck, Mail } from 'lucide-react';

export function LoginForm({ defaultMode }: { defaultMode?: 'signin' | 'signup' }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading, signIn, signUp, signInWithOAuth, verifyEmail, error: authError, setError } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup' | 'verify'>(defaultMode || 'signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<'google' | 'github' | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  // If already authenticated, redirect to notes
  useEffect(() => {
    if (!authLoading && user) {
      router.push('/notes');
    }
  }, [user, authLoading, router]);

  // Handle search params mode & verification alerts
  useEffect(() => {
    const paramMode = searchParams.get('mode');
    if (paramMode === 'signup' || paramMode === 'signin' || paramMode === 'verify') {
      setMode(paramMode);
    }
    const status = searchParams.get('insforge_status');
    const err = searchParams.get('insforge_error');
    if (status === 'success') {
      setInfoMessage('Your email has been verified successfully. You can now sign in.');
    } else if (err) {
      setError(decodeURIComponent(err));
    }
  }, [searchParams, setError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);
    setIsSubmitting(true);

    try {
      if (mode === 'signin') {
        const res = await signIn(email, password);
        if (res.data?.user) {
          router.push('/notes');
        }
      } else if (mode === 'signup') {
        const res = await signUp(email, password, name);
        if (res.data?.requireEmailVerification) {
          setInfoMessage('Verification code sent to your email. Please enter it below.');
          setMode('verify');
        } else if (res.data?.user && res.data.accessToken) {
          setInfoMessage('Account created successfully!');
          router.push('/notes');
        }
      } else if (mode === 'verify') {
        const res = await verifyEmail(email, otp);
        if (res.data?.user && res.data.accessToken) {
          setInfoMessage('Email verified successfully!');
          router.push('/notes');
        }
      }
    } catch (err: any) {
      // Error handled by AuthProvider state
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOAuth = async (provider: 'google' | 'github') => {
    setError(null);
    setInfoMessage(null);
    setOauthLoading(provider);
    try {
      await signInWithOAuth(provider);
    } catch (err) {
      // Error handled in context
    } finally {
      setOauthLoading(null);
    }
  };

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 my-auto">
        <Loader2 className="w-8 h-8 animate-spin text-foreground mb-3" />
        <p className="text-sm text-muted-foreground font-mono">Checking session state...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto my-auto p-6 sm:p-8 bg-card border border-border rounded-2xl shadow-sm space-y-6">
      {/* Form Title & Decorative Pastel Bar */}
      <div className="space-y-3 text-center">
        <div className="flex items-center justify-center gap-1.5 mx-auto w-fit p-1 bg-muted rounded-full">
          <span className="w-2.5 h-2.5 rounded-full bg-[#aac2ec]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#fae8b4]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#f5c6a5]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#b8d8be]" />
        </div>
        <h1 className="text-2xl font-black tracking-tight text-foreground">
          {mode === 'signin' && 'Sign In to Codiary'}
          {mode === 'signup' && 'Create Your Notes Drawer'}
          {mode === 'verify' && 'Verify Your Email'}
        </h1>
        <p className="text-xs text-muted-foreground">
          {mode === 'signin' && 'Access your private archive & notes'}
          {mode === 'signup' && 'Start capturing ideas, daily notes & personal projects'}
          {mode === 'verify' && `We sent a 6-digit verification code to ${email || 'your email'}`}
        </p>
      </div>

      {/* Mode Switcher Tabs */}
      {mode !== 'verify' && (
        <div className="grid grid-cols-2 p-1 bg-muted rounded-lg text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setError(null);
              setInfoMessage(null);
            }}
            className={`py-2 px-3 rounded-md transition-all text-center ${
              mode === 'signin'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            SIGN IN
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setError(null);
              setInfoMessage(null);
            }}
            className={`py-2 px-3 rounded-md transition-all text-center ${
              mode === 'signup'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            SIGN UP
          </button>
        </div>
      )}

      {/* Alerts */}
      {authError && (
        <Alert variant="destructive" className="text-xs">
          <AlertCircle className="w-4 h-4 mr-2" />
          <AlertTitle className="font-semibold">Authentication Error</AlertTitle>
          <AlertDescription>{authError}</AlertDescription>
        </Alert>
      )}

      {infoMessage && (
        <Alert variant="default" className="border-emerald-500/40 text-emerald-600 dark:text-emerald-400 text-xs">
          <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-500" />
          <AlertTitle className="font-semibold">Notice</AlertTitle>
          <AlertDescription>{infoMessage}</AlertDescription>
        </Alert>
      )}

      {/* OAuth Buttons */}
      {mode !== 'verify' && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting || oauthLoading !== null}
              onClick={() => handleOAuth('google')}
              className="w-full btn-standard"
            >
              {oauthLoading === 'google' ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              GOOGLE
            </Button>

            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting || oauthLoading !== null}
              onClick={() => handleOAuth('github')}
              className="w-full btn-standard"
            >
              {oauthLoading === 'github' ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <svg className="w-4 h-4 mr-2 fill-current" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
              )}
              GITHUB
            </Button>
          </div>

          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-sans font-bold">
              <span className="bg-card px-2 text-muted-foreground">Or continue with email</span>
            </div>
          </div>
        </>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'signup' && (
          <div className="space-y-1.5">
            <Label htmlFor="name" className="pl-2 text-xs font-bold uppercase tracking-wider text-foreground">
              Full Name
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="Jane Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-background border-border text-foreground input-standard"
            />
          </div>
        )}

        {mode !== 'verify' && (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="email" className="pl-2 text-xs font-bold uppercase tracking-wider text-foreground">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-background border-border text-foreground input-standard"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="pl-2 text-xs font-bold uppercase tracking-wider text-foreground">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-background border-border text-foreground input-standard !pr-14"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors z-10"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </>
        )}

        {mode === 'verify' && (
          <div className="space-y-1.5">
            <Label htmlFor="otp" className="pl-2 text-xs font-bold uppercase tracking-wider text-foreground">
              Verification Code (OTP)
            </Label>
            <div className="relative">
              <Input
                id="otp"
                type="text"
                required
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="bg-background border-border text-foreground tracking-widest text-center text-lg font-mono input-standard !pl-14"
              />
              <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
            </div>
          </div>
        )}

        <Button
          type="submit"
          disabled={isSubmitting}
          variant="default"
          className="w-full btn-standard"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              {mode === 'signin' && 'Sign In'}
              {mode === 'signup' && 'Create Account'}
              {mode === 'verify' && 'Verify Email'}
            </>
          )}
        </Button>
      </form>

      {/* Footer Switcher Link */}
      <div className="text-center pt-2 border-t border-border text-xs text-muted-foreground">
        {mode === 'signin' ? (
          <p>
            Don't have an account?{' '}
            <Link href="/signup" className="text-foreground font-semibold hover:underline">
              Sign Up
            </Link>
          </p>
        ) : mode === 'signup' ? (
          <p>
            Already have an account?{' '}
            <Link href="/login" className="text-foreground font-semibold hover:underline">
              Sign In
            </Link>
          </p>
        ) : (
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setError(null);
              setInfoMessage(null);
            }}
            className="text-foreground font-semibold hover:underline"
          >
            Back to Sign In
          </button>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <AppNavbar />
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <Suspense
          fallback={
            <div className="flex flex-col items-center justify-center p-12">
              <Loader2 className="w-8 h-8 animate-spin text-foreground mb-3" />
              <p className="text-sm text-muted-foreground font-sans font-medium">Loading authentication...</p>
            </div>
          }
        >
          <LoginForm defaultMode="signin" />
        </Suspense>
      </main>
    </div>
  );
}
