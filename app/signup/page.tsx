'use client';

import React, { Suspense } from 'react';
import { AppNavbar } from '@/components/app-navbar';
import { Loader2 } from 'lucide-react';
import { LoginForm } from '@/app/login/page';

export default function SignupPage() {
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
          <LoginForm defaultMode="signup" />
        </Suspense>
      </main>
    </div>
  );
}
