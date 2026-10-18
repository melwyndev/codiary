'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { AppNavbar } from '@/components/app-navbar';
import { AppSidebar } from '@/components/app-sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Loader2,
  Save,
  CheckCircle2,
  AlertCircle,
  User,
  ShieldCheck,
} from 'lucide-react';

export default function AccountPage() {
  const router = useRouter();
  const { user, loading, setProfile, error, setError } = useAuth();

  const [nickname, setNickname] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Protected route guard: redirect to /login if unauthenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    } else if (user) {
      setNickname(user.profile?.nickname || user.name || '');
      setBio(user.profile?.bio || '');
      setAvatarUrl(user.profile?.avatar_url || '');
    }
  }, [user, loading, router]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setSuccessMsg(null);
    setError(null);
    try {
      const res = await setProfile({
        nickname,
        bio,
        avatar_url: avatarUrl,
      });
      if (!res.error) {
        setSuccessMsg('Profile updated successfully!');
      }
    } catch (err: any) {
      // Handled by Auth Context
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <AppNavbar />
        <div className="flex-1 flex items-center justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-background text-foreground transition-colors duration-200">
      <AppNavbar title="Account & Profile Settings" />

      <div className="flex flex-1 overflow-hidden h-[calc(100vh-5rem)]">
        <AppSidebar />
        <main className="flex-1 overflow-y-auto">
        {/* Account Settings Content Container */}
        <div className="px-4 sm:px-5 py-6 sm:py-8 space-y-6 sm:space-y-8">

        {/* Feedback Alerts */}
        {error && (
          <Alert variant="destructive" className="text-xs">
            <AlertCircle className="w-4 h-4 mr-2" />
            <AlertTitle className="font-semibold">Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {successMsg && (
          <Alert variant="default" className="border-emerald-500/40 text-emerald-600 dark:text-emerald-400 text-xs">
            <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-500" />
            <AlertTitle className="font-semibold">Success</AlertTitle>
            <AlertDescription>{successMsg}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Session Info */}
          <div className="md:col-span-4 bg-card border border-border p-6 rounded-2xl shadow-sm space-y-5">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <ShieldCheck className="w-4 h-4 text-foreground" />
              <h2 className="text-base font-bold tracking-tight text-foreground">Session Info</h2>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="text-[10px] uppercase font-sans font-bold tracking-wider text-muted-foreground block mb-1">
                  User Identifier
                </label>
                <div className="p-2.5 bg-muted rounded-lg border border-border font-sans font-bold break-all">
                  {user.id}
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-sans font-bold tracking-wider text-muted-foreground block mb-1">
                  Email Address
                </label>
                <div className="p-2.5 bg-muted rounded-lg border border-border font-sans font-bold">
                  {user.email}
                </div>
              </div>
            </div>
          </div>

          {/* Profile Form */}
          <div className="md:col-span-8 bg-card border border-border p-6 rounded-2xl shadow-sm space-y-6">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <User className="w-4 h-4 text-foreground" />
              <h2 className="text-base font-bold tracking-tight text-foreground">Profile Metadata</h2>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="nickname" className="pl-2 text-xs font-bold uppercase tracking-wider text-foreground">
                  Display Name / Nickname
                </Label>
                <Input
                  id="nickname"
                  type="text"
                  placeholder="e.g. Alex Developer"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="bg-background border-border text-foreground input-standard"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="bio" className="pl-2 text-xs font-bold uppercase tracking-wider text-foreground">
                  Bio
                </Label>
                <Input
                  id="bio"
                  type="text"
                  placeholder="Full-stack engineer building AI tools"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="bg-background border-border text-foreground input-standard"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="avatarUrl" className="pl-2 text-xs font-bold uppercase tracking-wider text-foreground">
                  Avatar Image URL
                </Label>
                <Input
                  id="avatarUrl"
                  type="url"
                  placeholder="https://example.com/avatar.jpg"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  className="bg-background border-border text-foreground input-standard"
                />
              </div>

              <Button type="submit" disabled={isUpdating} variant="default" className="w-full sm:w-auto btn-standard">
                {isUpdating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                SAVE PROFILE
              </Button>
            </form>
          </div>
        </div>
      </div>
    </main>
  </div>
</div>
  );
}
