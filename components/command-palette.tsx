'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import {
  Search,
  Plus,
  User,
  Sun,
  Moon,
  Home,
  FileText,
  Tag,
  CornerDownLeft,
  X,
  Sparkles,
} from 'lucide-react';
import { getNotes, createNoteInInsForge, generateUUID, NoteItem } from '@/lib/notes-store';
import { searchNotesSemantically } from '@/lib/semantic-search';
import { showToast } from '@/components/toast';
import { useAuth } from '@/components/auth-provider';

export function CommandPalette() {
  const router = useRouter();
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load notes whenever command palette opens
  useEffect(() => {
    if (isOpen) {
      setNotes(getNotes());
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Keyboard shortcut listener (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        setIsOpen(false);
      }
    };

    const handleCustomOpen = () => setIsOpen(true);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('open-command-palette', handleCustomOpen);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('open-command-palette', handleCustomOpen);
    };
  }, [isOpen]);

  // Unified Semantic Search Filtering
  const semanticResults = searchNotesSemantically(notes, query);
  const filteredNotes = semanticResults.map((r) => r.note);

  const actions = [
    {
      id: 'action-new',
      title: 'Create New Note',
      category: 'Action',
      icon: <Plus className="w-4 h-4 text-emerald-400" />,
      perform: async () => {
        setIsOpen(false);
        const newId = generateUUID();
        await createNoteInInsForge(
          { id: newId, title: 'Untitled Note', tags: ['general'], content: '' },
          user?.id,
          user?.email,
        );
        showToast('Created new note!');
        router.push(`/notes/${newId}`);
      },
    },
    {
      id: 'action-account',
      title: 'Go to Account Settings',
      category: 'Action',
      icon: <User className="w-4 h-4 text-indigo-400" />,
      perform: () => {
        setIsOpen(false);
        router.push('/account');
      },
    },
    {
      id: 'action-theme',
      title: `Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`,
      category: 'Action',
      icon: theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-sky-400" />,
      perform: () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
        setIsOpen(false);
      },
    },
    {
      id: 'action-home',
      title: 'Go to Landing Page',
      category: 'Action',
      icon: <Home className="w-4 h-4 text-muted-foreground" />,
      perform: () => {
        setIsOpen(false);
        router.push('/');
      },
    },
  ];

  const totalItems = filteredNotes.length + (query === '' ? actions.length : 0);

  // Arrow key navigation
  const handleKeyDownInput = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % totalItems);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + totalItems) % totalItems);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (query === '') {
        if (selectedIndex < actions.length) {
          actions[selectedIndex].perform();
        } else {
          const noteIndex = selectedIndex - actions.length;
          if (filteredNotes[noteIndex]) {
            setIsOpen(false);
            router.push(`/notes/${filteredNotes[noteIndex].id}`);
          }
        }
      } else {
        if (filteredNotes[selectedIndex]) {
          setIsOpen(false);
          router.push(`/notes/${filteredNotes[selectedIndex].id}`);
        }
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-start justify-center pt-16 sm:pt-24 p-4 animate-in fade-in duration-150 font-sans"
      onClick={() => setIsOpen(false)}
    >
      <div
        className="w-full max-w-2xl bg-card border border-border rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Decorative Codiary Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#aac2ec] via-[#fae8b4] via-[#f5c6a5] to-[#b8d8be]" />

        {/* Command Search Header */}
        <div className="flex items-center px-5 py-4 border-b border-border/80 gap-3">
          <Search className="w-5 h-5 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search notes by title, tag, or content..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDownInput}
            className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground text-sm font-sans font-medium outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-[10px] font-sans font-bold uppercase text-muted-foreground bg-muted rounded-md border border-border">
            ESC
          </kbd>
        </div>

        {/* Results Body */}
        <div className="max-h-[380px] overflow-y-auto p-2 space-y-3 divide-y divide-border/40">
          {/* Quick Actions (shown when query is empty) */}
          {query === '' && (
            <div className="space-y-1 pb-2">
              <div className="px-3 py-1.5 text-[10px] font-sans font-bold uppercase tracking-wider text-muted-foreground">
                Quick Actions
              </div>
              {actions.map((act, idx) => (
                <button
                  key={act.id}
                  type="button"
                  onClick={act.perform}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl transition-all text-left text-xs font-sans ${
                    selectedIndex === idx
                      ? 'bg-muted text-foreground font-bold shadow-sm'
                      : 'text-muted-foreground hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-background rounded-xl border border-border/60">
                      {act.icon}
                    </div>
                    <span>{act.title}</span>
                  </div>
                  <CornerDownLeft className="w-3.5 h-3.5 opacity-40" />
                </button>
              ))}
            </div>
          )}

          {/* Notes Search Results */}
          <div className="space-y-1 pt-2">
            <div className="px-3 py-1.5 text-[10px] font-sans font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>Notes Drawer ({filteredNotes.length})</span>
              {query !== '' && <span className="text-[9px]">Press Enter to Open</span>}
            </div>

            {filteredNotes.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground font-sans">
                No matching notes found for "{query}".
              </div>
            ) : (
              filteredNotes.map((note, idx) => {
                const actualIndex = query === '' ? actions.length + idx : idx;
                const isSelected = selectedIndex === actualIndex;

                return (
                  <button
                    key={note.id}
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      router.push(`/notes/${note.id}`);
                    }}
                    onMouseEnter={() => setSelectedIndex(actualIndex)}
                    className={`w-full flex items-center justify-between px-3 py-3 rounded-2xl transition-all text-left space-x-3 ${
                      isSelected
                        ? 'bg-muted text-foreground font-bold shadow-sm'
                        : 'text-muted-foreground hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <FileText className="w-4 h-4 text-foreground/70 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold truncate text-foreground">
                            {note.title}
                          </span>
                          {note.isPinned && (
                            <span className="px-2 py-0.5 text-[9px] font-bold uppercase bg-amber-500/10 text-amber-500 rounded-full border border-amber-500/20">
                              Pinned
                            </span>
                          )}
                        </div>
                        {note.summary && (
                          <p className="text-[11px] text-muted-foreground truncate font-sans font-normal mt-0.5">
                            {note.summary}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <CornerDownLeft className={`w-3.5 h-3.5 ${isSelected ? 'opacity-100 text-foreground' : 'opacity-0'}`} />
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Command Palette Footer */}
        <div className="px-5 py-3 border-t border-border/80 bg-muted/30 flex items-center justify-between text-[11px] font-sans text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-background rounded border border-border font-bold">↑↓</kbd> Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-background rounded border border-border font-bold">↵</kbd> Select
            </span>
          </div>
          <div className="flex items-center gap-1 font-bold text-foreground">
            <span>Codiary Search</span>
            <Sparkles className="w-3 h-3 text-amber-500 ml-1" />
          </div>
        </div>
      </div>
    </div>
  );
}
