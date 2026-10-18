'use client';

import React, { useState } from 'react';
import { NoteItem } from '@/lib/notes-store';
import { Button } from '@/components/ui/button';
import { showToast } from '@/components/toast';
import { Share2, Copy, ExternalLink, X, Image as ImageIcon } from 'lucide-react';

interface ShareOGModalProps {
  note: NoteItem;
  isOpen: boolean;
  onClose: () => void;
}

export function ShareOGModal({ note, isOpen, onClose }: ShareOGModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !note) return null;

  const tagsQuery = note.tags?.join(',') || 'general';
  const ogImageUrl = `/api/og?title=${encodeURIComponent(note.title)}&summary=${encodeURIComponent(
    note.summary || ''
  )}&tags=${encodeURIComponent(tagsQuery)}`;

  const handleCopyLink = () => {
    const fullUrl = `${window.location.origin}${ogImageUrl}`;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    showToast('Social Card link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150 font-sans"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-card border border-border rounded-3xl shadow-2xl overflow-hidden flex flex-col space-y-4 p-6 relative animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/80 pb-4">
          <div className="flex items-center gap-2 font-bold text-sm text-foreground">
            <Share2 className="w-4 h-4 text-amber-500" />
            <span>Social Share Card Preview</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Dynamic OG Card Preview */}
        <div className="aspect-[1200/630] w-full rounded-2xl overflow-hidden border border-border bg-black shadow-inner relative group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={ogImageUrl}
            alt={`OpenGraph preview for ${note.title}`}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <div className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5 text-amber-500" />
            <span>1200x630 High-Resolution Social Card</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => window.open(ogImageUrl, '_blank')}
              className="rounded-full text-xs font-bold font-sans flex-1 sm:flex-initial"
            >
              <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
              Open Image
            </Button>
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={handleCopyLink}
              className="btn-standard flex-1 sm:flex-initial"
            >
              <Copy className="w-3.5 h-3.5 mr-1.5" />
              {copied ? 'Copied!' : 'Copy Image Link'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
