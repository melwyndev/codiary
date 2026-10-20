'use client';

import React, { useState } from 'react';
import { NoteItem, NoteShare, shareNoteInInsForge, revokeNoteShareInInsForge } from '@/lib/notes-store';
import { useAuth } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { showToast } from '@/components/toast';
import {
  Share2,
  Users,
  UserPlus,
  Shield,
  Eye,
  Edit3,
  Copy,
  Check,
  X,
  Trash2,
  Lock,
  Sparkles,
} from 'lucide-react';

interface ShareDialogProps {
  note: NoteItem;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (updatedNote: NoteItem) => void;
}



export function ShareDialog({ note, isOpen, onClose, onUpdate }: ShareDialogProps) {
  const { user } = useAuth();
  const [emailInput, setEmailInput] = useState('');
  const [roleInput, setRoleInput] = useState<'viewer' | 'editor'>('viewer');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen || !note) return null;

  const currentShares: NoteShare[] = note.sharedWith || [];
  const ownerDisplay = note.ownerEmail || (note.ownerId === user?.id ? user?.email : 'You');
  const isCurrentUserOwner = Boolean(
    !note.ownerEmail ||
    note.ownerEmail === user?.email ||
    (note.ownerId && user?.id && note.ownerId === user.id)
  );

  const handleGrantAccess = async (targetEmail: string, role: 'viewer' | 'editor') => {
    const trimmed = targetEmail.trim().toLowerCase();
    if (!trimmed) {
      showToast('Please provide a valid email address.', 'error');
      return;
    }

    if (trimmed === (user?.email || '').toLowerCase()) {
      showToast('You are already the owner of this document.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const updatedShares = await shareNoteInInsForge(note.id, trimmed, role);
      const updatedNote: NoteItem = { ...note, sharedWith: updatedShares };
      if (onUpdate) onUpdate(updatedNote);
      setEmailInput('');
      showToast(`Granted ${role} access to ${trimmed}`);
    } catch (err) {
      showToast('Failed to grant access.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevoke = async (targetEmail: string) => {
    try {
      const updatedShares = await revokeNoteShareInInsForge(note.id, targetEmail);
      const updatedNote: NoteItem = { ...note, sharedWith: updatedShares };
      if (onUpdate) onUpdate(updatedNote);
      showToast(`Revoked access for ${targetEmail}`);
    } catch (err) {
      showToast('Failed to revoke access.', 'error');
    }
  };

  const handleCopyLink = () => {
    const shareableUrl = `${window.location.origin}/notes/${note.id}`;
    navigator.clipboard.writeText(shareableUrl);
    setCopiedLink(true);
    showToast('Shareable link copied to clipboard!');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150 font-sans"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col p-6 relative animate-in zoom-in-95 duration-150 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-foreground">Share Document</h2>
              <p className="text-xs text-muted-foreground line-clamp-1 max-w-[280px]">
                {note.title || 'Untitled Note'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Grant Access Form */}
        <div className="space-y-3">
          <Label className="text-xs font-semibold text-foreground uppercase tracking-wider">
            Add Collaborator
          </Label>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              type="email"
              placeholder="collaborator@example.com"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              className="flex-1 text-sm rounded-xl h-10"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleGrantAccess(emailInput, roleInput);
                }
              }}
            />
            <div className="flex gap-2">
              <select
                value={roleInput}
                onChange={(e) => setRoleInput(e.target.value as 'viewer' | 'editor')}
                className="h-10 px-3 rounded-xl border border-border bg-background text-foreground text-xs font-medium focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="viewer">Can View</option>
                <option value="editor">Can Edit</option>
              </select>
              <Button
                type="button"
                onClick={() => handleGrantAccess(emailInput, roleInput)}
                disabled={isSubmitting || !emailInput.trim()}
                className="h-10 rounded-xl px-4 text-xs font-semibold"
              >
                <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                Invite
              </Button>
            </div>
          </div>
        </div>

        {/* Collaborators List */}
        <div className="space-y-2 border-t border-border pt-4">
          <Label className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center justify-between">
            <span>People with access</span>
            <span className="text-muted-foreground font-normal">{currentShares.length + 1} user(s)</span>
          </Label>

          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {/* Owner Row */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/40 border border-border/60">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs uppercase">
                  {ownerDisplay?.[0] || 'U'}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">
                    {ownerDisplay}
                  </p>
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Shield className="w-3 h-3 text-amber-500" />
                    Document Owner
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                Owner
              </span>
            </div>

            {/* Shared Users Rows */}
            {currentShares.map((share) => (
              <div
                key={share.email}
                className="flex items-center justify-between p-2.5 rounded-xl bg-card border border-border hover:border-border/80 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-xs uppercase">
                    {share.email[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">
                      {share.email}
                    </p>
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                      {share.role === 'editor' ? (
                        <>
                          <Edit3 className="w-3 h-3 text-emerald-500" />
                          <span>Can edit</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-3 h-3 text-blue-500" />
                          <span>Can view</span>
                        </>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                      share.role === 'editor'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                        : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                    }`}
                  >
                    {share.role}
                  </span>
                  {isCurrentUserOwner && (
                    <button
                      type="button"
                      onClick={() => handleRevoke(share.email)}
                      className="p-1 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      title="Revoke access"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer / Copy Link */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopyLink}
            className="rounded-xl text-xs font-medium h-9"
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-500" />
                Link Copied!
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 mr-1.5" />
                Copy Share Link
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={onClose}
            className="rounded-xl text-xs font-semibold px-4 h-9"
          >
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}

function Plus(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}
