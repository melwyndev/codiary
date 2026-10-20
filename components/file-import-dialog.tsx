'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { createNoteInInsForge, generateUUID } from '@/lib/notes-store';
import { Button } from '@/components/ui/button';
import { showToast } from '@/components/toast';
import {
  UploadCloud,
  FileText,
  FileCode,
  FileSpreadsheet,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

interface FileImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const SUPPORTED_EXTENSIONS = ['.md', '.txt', '.json'];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export function FileImportDialog({ isOpen, onClose, onSuccess }: FileImportDialogProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const validateFile = (file: File): boolean => {
    setError(null);
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!SUPPORTED_EXTENSIONS.includes(ext)) {
      setError(`Unsupported file type (${ext}). Please upload a .md, .txt, or .json file.`);
      return false;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError(`File is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum allowed size is 10 MB.`);
      return false;
    }

    return true;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && validateFile(file)) {
      setSelectedFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && validateFile(file)) {
      setSelectedFile(file);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setError(null);

    try {
      const rawText = await selectedFile.text();
      const ext = '.' + selectedFile.name.split('.').pop()?.toLowerCase();
      const baseName = selectedFile.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');

      let title = baseName || 'Imported Document';
      let content = rawText;
      let tags = ['imported'];

      // If JSON backup, check if single note or vault export
      if (ext === '.json') {
        try {
          const parsed = JSON.parse(rawText);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Vault backup with multiple notes
            for (const item of parsed) {
              await createNoteInInsForge(
                {
                  id: generateUUID(),
                  title: item.title || 'Untitled Note',
                  tags: Array.isArray(item.tags) ? item.tags : ['imported'],
                  content: item.content || '',
                },
                user?.id,
                user?.email,
              );
            }
            showToast(`Imported ${parsed.length} notes from vault backup!`);
            setIsProcessing(false);
            if (onSuccess) onSuccess();
            onClose();
            return;
          } else if (parsed && typeof parsed === 'object') {
            title = parsed.title || title;
            content = parsed.content || rawText;
            if (Array.isArray(parsed.tags)) tags = parsed.tags;
          }
        } catch (jsonErr) {
          // If JSON parse fails, treat as plain text
          content = rawText;
        }
      }

      // Check first line of markdown for # Header title
      if (ext === '.md') {
        const firstLine = rawText.trim().split('\n')[0];
        if (firstLine.startsWith('# ')) {
          title = firstLine.replace(/^#\s+/, '').trim();
        }
      }

      const newId = generateUUID();
      const createdNote = await createNoteInInsForge(
        {
          id: newId,
          title,
          tags,
          content,
        },
        user?.id,
        user?.email,
      );

      showToast(`Imported "${title}" into editable document!`);
      if (onSuccess) onSuccess();
      onClose();
      router.push(`/notes/${createdNote.id}`);
    } catch (err: any) {
      console.error('Import error:', err);
      setError(err.message || 'Failed to parse and import file.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150 font-sans"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-card border border-border rounded-3xl shadow-2xl overflow-hidden flex flex-col p-6 sm:p-7 relative animate-in zoom-in-95 duration-150 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-3.5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-foreground">Import Document</h2>
              <p className="text-xs text-muted-foreground">
                Turn an existing file into a new editable note
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

        {/* Drag and Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 ${
            isDragging
              ? 'border-emerald-500 bg-emerald-500/5 scale-[0.99]'
              : 'border-border/80 hover:border-emerald-500/60 hover:bg-muted/30'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".md,.txt,.json"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="w-12 h-12 rounded-2xl bg-muted/80 flex items-center justify-center mb-3 text-muted-foreground">
            <FileText className="w-6 h-6 text-emerald-500" />
          </div>

          <p className="text-sm font-semibold text-foreground">
            {selectedFile ? selectedFile.name : 'Click to select or drag and drop a file'}
          </p>

          <p className="text-xs text-muted-foreground mt-1 max-w-xs">
            {selectedFile
              ? `${(selectedFile.size / 1024).toFixed(1)} KB · Ready to import`
              : 'Drop your Markdown (.md), Plain Text (.txt), or JSON note backup here'}
          </p>
        </div>

        {/* Error Feedback */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 text-destructive text-xs border border-destructive/20">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Supported File Types Disclosure */}
        <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/60 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-foreground">
            <span>Supported File Formats</span>
            <span className="text-[10px] text-muted-foreground font-normal">Max size: 10 MB</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="p-2 rounded-xl bg-background border border-border/80 flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-emerald-500">.md</span>
              <span className="text-[11px] text-muted-foreground truncate">Markdown</span>
            </div>
            <div className="p-2 rounded-xl bg-background border border-border/80 flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-blue-500">.txt</span>
              <span className="text-[11px] text-muted-foreground truncate">Text Note</span>
            </div>
            <div className="p-2 rounded-xl bg-background border border-border/80 flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-amber-500">.json</span>
              <span className="text-[11px] text-muted-foreground truncate">Vault Data</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-1">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isProcessing}
            className="rounded-xl text-xs font-semibold h-10 px-4"
          >
            Cancel
          </Button>

          <Button
            type="button"
            onClick={handleImport}
            disabled={!selectedFile || isProcessing}
            className="rounded-xl text-xs font-semibold h-10 px-5 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                Import into Document
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
