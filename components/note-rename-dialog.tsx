'use client';

import React, { useState, useEffect, useRef } from 'react';
import { NoteItem, updateNoteInInsForge } from '@/lib/notes-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { showToast } from '@/components/toast';
import { Pencil, X, Loader2, Check, AlertCircle } from 'lucide-react';

interface NoteRenameDialogProps {
  isOpen: boolean;
  note: NoteItem | null;
  onClose: () => void;
  onRenamed?: (newTitle: string) => void;
}

export function NoteRenameDialog({
  isOpen,
  note,
  onClose,
  onRenamed,
}: NoteRenameDialogProps) {
  const [title, setTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync title when note opens
  useEffect(() => {
    if (note && isOpen) {
      setTitle(note.title || '');
      setError(null);
      // Focus and highlight the text input
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 50);
    }
  }, [note, isOpen]);

  if (!isOpen || !note) return null;

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      setError('Document title cannot be empty.');
      return;
    }

    if (trimmedTitle === note.title) {
      onClose();
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await updateNoteInInsForge(note.id, { title: trimmedTitle });
      showToast(`Renamed to "${trimmedTitle}"`);
      if (onRenamed) onRenamed(trimmedTitle);
      onClose();
    } catch (err: any) {
      console.error('Failed to rename note:', err);
      setError(err.message || 'Failed to update document title.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150 font-sans"
      onClick={onClose}
      onKeyDown={handleKeyDown}
    >
      <div
        className="w-full max-w-lg bg-card border border-border rounded-3xl shadow-2xl overflow-hidden flex flex-col p-6 sm:p-7 relative animate-in zoom-in-95 duration-150 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-3.5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              <Pencil className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-foreground">Rename Document</h2>
              <p className="text-xs text-muted-foreground">
                Update the title of this note
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="rename-input"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Document Title
            </label>
            <Input
              id="rename-input"
              ref={inputRef}
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError(null);
              }}
              placeholder="e.g. Distributed Consensus Architecture"
              className="h-11 rounded-xl bg-background border-border text-foreground font-medium px-3.5 text-sm focus-visible:ring-blue-500"
              disabled={isSaving}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 text-destructive text-xs border border-destructive/20">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Details Bar */}
          <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/60 flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] text-foreground/80">
                ID: {note.id.substring(0, 8)}...
              </span>
            </div>
            {note.updatedAt && (
              <span className="text-[11px]">
                Last modified: {note.updatedAt}
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSaving}
              className="rounded-xl text-xs font-semibold h-10 px-4"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={isSaving || !title.trim()}
              className="rounded-xl text-xs font-semibold h-10 px-5 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-1.5" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
