'use client';

import React, { useEffect, useState, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';

const BlockEditor = dynamic(() => import('@/components/block-editor'), {
  ssr: false,
  loading: () => (
    <div className="py-8 px-4 text-xs text-muted-foreground animate-pulse font-sans">
      Loading block editor...
    </div>
  ),
});
import { useAuth } from '@/components/auth-provider';
import { AppNavbar } from '@/components/app-navbar';
import { AppSidebar } from '@/components/app-sidebar';
import { ShareOGModal } from '@/components/share-og-modal';
import { showToast } from '@/components/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Loader2,
  ArrowLeft,
  Sparkles,
  Trash2,
  Tag,
  X,
  Check,
  Clock,
  Pin,
  Eye,
  Edit3,
  Copy,
  Download,
  Code2,
  CheckSquare,
  Heading,
  MessageSquareQuote,
  MoreHorizontal,
  Calendar,
  Smile,
  Type,
  List,
  Quote,
  Minus,
  FileText,
  Plus,
  Share2,
  Users,
  Shield,
  Paperclip,
  File,
  ExternalLink,
  Printer,
  ChevronDown,
  FileCode,
  Wifi,
} from 'lucide-react';
import { exportNoteToPDF } from '@/lib/export-utils';
import {
  getNotesFromInsForge,
  getNoteByIdFromInsForge,
  getNoteById,
  updateNoteInInsForge,
  deleteNoteFromInsForge,
  togglePinNote,
  autoOrganizeNote,
  getAllUserTagsFromInsForge,
  getUserNotePermission,
  uploadNoteAttachmentToInsForge,
  removeNoteAttachmentFromInsForge,
  NoteItem,
  NoteAttachment,
} from '@/lib/notes-store';
import { ShareDialog } from '@/components/share-dialog';
import {
  subscribeToNote,
  broadcastNoteChangeDebounced,
  Collaborator,
  NoteChangePayload,
} from '@/lib/realtime';

interface SlashMenuItem {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  snippet: string;
  keywords: string[];
}

export default function NoteEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const noteId = resolvedParams.id;

  const router = useRouter();
  const { user, loading } = useAuth();

  // Check memory/localStorage store synchronously for instant rendering on Frame 1
  const initialCached = getNoteById(noteId);

  const [note, setNote] = useState<NoteItem | null>(() => initialCached || null);
  const [title, setTitle] = useState(() => initialCached?.title || '');
  const [tags, setTags] = useState<string[]>(() => initialCached?.tags || []);
  const [content, setContent] = useState(() => initialCached?.content || '');
  const [isPinned, setIsPinned] = useState(() => Boolean(initialCached?.isPinned));
  const [icon, setIcon] = useState<string | null>(() => initialCached?.icon || null);
  const [newTagInput, setNewTagInput] = useState('');
  const [showAddTag, setShowAddTag] = useState(false);
  const [allAvailableTags, setAllAvailableTags] = useState<string[]>([]);
  const [isFetchingNote, setIsFetchingNote] = useState(() => !initialCached);

  // Load all user tags for auto-completion suggestions
  useEffect(() => {
    async function loadAllTags() {
      const available = await getAllUserTagsFromInsForge();
      setAllAvailableTags(available);
    }
    loadAllTags();
  }, [tags]);

  // Notion Cover / Icon state
  const [showIconPicker, setShowIconPicker] = useState(false);

  // Editor View Mode: 'write' vs 'preview'
  const [mode, setMode] = useState<'write' | 'preview'>('write');

  // Notion-Style Slash Menu State
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashQuery, setSlashQuery] = useState('');
  const [selectedSlashIndex, setSelectedSlashIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'idle'>('idle');
  const [lastSavedTime, setLastSavedTime] = useState<string>(() => initialCached?.updatedAt || '');
  const [isOrganizing, setIsOrganizing] = useState(false);
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);

  // Realtime live changes & collaborators presence state
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [remoteContent, setRemoteContent] = useState<string | undefined>(undefined);
  const [remoteSyncNotice, setRemoteSyncNotice] = useState<string | null>(null);
  const isApplyingRemoteChangeRef = useRef(false);
  const noticeTimerRef = useRef<NodeJS.Timeout | null>(null);

  // File Attachments State
  const [attachments, setAttachments] = useState<NoteAttachment[]>(() => initialCached?.attachments || []);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const attachmentInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleUploadAttachment = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      showToast('File is too large. Maximum size is 10 MB.', 'error');
      return;
    }

    setIsUploadingAttachment(true);
    try {
      const newAttachment = await uploadNoteAttachmentToInsForge(noteId, file);
      if (newAttachment) {
        const updated = [...attachments, newAttachment];
        setAttachments(updated);
        if (!isViewer && user?.id) {
          broadcastNoteChangeDebounced(noteId, { attachments: updated }, { id: user.id, email: user.email });
        }
        showToast(`Attached "${file.name}" to note`);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to upload attachment', 'error');
    } finally {
      setIsUploadingAttachment(false);
      if (attachmentInputRef.current) {
        attachmentInputRef.current.value = '';
      }
    }
  };

  const handleRemoveAttachment = async (attachmentId: string) => {
    try {
      const updated = await removeNoteAttachmentFromInsForge(noteId, attachmentId);
      setAttachments(updated);
      if (!isViewer && user?.id) {
        broadcastNoteChangeDebounced(noteId, { attachments: updated }, { id: user.id, email: user.email });
      }
      showToast('Removed attachment');
    } catch (err) {
      showToast('Failed to remove attachment', 'error');
    }
  };

  // Compute Document Permissions
  const permission = getUserNotePermission(note, user?.email, user?.id);
  const isViewer = permission.role === 'viewer';

  // Protected route guard
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Load Note data directly from InsForge PostgreSQL DB
  useEffect(() => {
    let isMounted = true;
    async function loadNoteData() {
      const cached = getNoteById(noteId);
      if (cached) {
        if (!isMounted) return;
        setNote(cached);
        setTitle(cached.title);
        setTags(cached.tags || []);
        setContent(cached.content || '');
        setIcon(cached.icon || null);
        setIsPinned(Boolean(cached.isPinned));
        setLastSavedTime(cached.updatedAt);
        setAttachments(cached.attachments || []);
        setIsFetchingNote(false);
      } else {
        if (!isMounted) return;
        setIsFetchingNote(true);
      }

      let existing = await getNoteByIdFromInsForge(noteId);
      // Graceful retry in case an in-flight creation is still persisting
      if (!existing && !cached) {
        await new Promise((resolve) => setTimeout(resolve, 300));
        existing = await getNoteByIdFromInsForge(noteId);
      }

      if (isMounted) {
        if (existing) {
          setNote(existing);
          setTitle(existing.title);
          setTags(existing.tags || []);
          setContent(existing.content || '');
          setIcon(existing.icon || null);
          setIsPinned(Boolean(existing.isPinned));
          setLastSavedTime(existing.updatedAt);
          setAttachments(existing.attachments || []);
        }
        setIsFetchingNote(false);
      }
    }
    loadNoteData();
    return () => {
      isMounted = false;
    };
  }, [noteId]);

  // Subscribe to InsForge Realtime Channel for Live Document Collaboration
  useEffect(() => {
    if (!noteId || !user?.id) return;

    const unsubscribe = subscribeToNote(
      noteId,
      {
        id: user.id,
        email: user.email || undefined,
        name: (user as any).user_metadata?.full_name || user.email?.split('@')[0],
      },
      {
        onRemoteChange: (payload: NoteChangePayload) => {
          isApplyingRemoteChangeRef.current = true;
          if (payload.title !== undefined) setTitle(payload.title);
          if (payload.icon !== undefined) setIcon(payload.icon);
          if (payload.tags !== undefined) setTags(payload.tags);
          if (payload.isPinned !== undefined) setIsPinned(payload.isPinned);
          if (payload.attachments !== undefined) setAttachments(payload.attachments);
          if (payload.content !== undefined) {
            setContent(payload.content);
            setRemoteContent(payload.content);
          }
          if (payload.updatedAt) setLastSavedTime(payload.updatedAt);

          setRemoteSyncNotice(`${payload.senderEmail} updated live`);
          if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
          noticeTimerRef.current = setTimeout(() => setRemoteSyncNotice(null), 3500);

          setTimeout(() => {
            isApplyingRemoteChangeRef.current = false;
          }, 600);
        },
        onPresenceChange: (activeList) => {
          setCollaborators(activeList);
        },
      }
    );

    return () => {
      if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
      unsubscribe();
    };
  }, [noteId, user]);

  // 1000ms Debounced Autosave to InsForge PostgreSQL DB
  useEffect(() => {
    if (!note || isApplyingRemoteChangeRef.current) return;

    const savedTitle = title.trim() ? title : 'Untitled Note';

    if (isViewer) return;

    const hasChanged =
      savedTitle !== note.title ||
      content !== note.content ||
      isPinned !== Boolean(note.isPinned) ||
      icon !== (note.icon || null) ||
      JSON.stringify(tags) !== JSON.stringify(note.tags);

    if (!hasChanged) return;

    setSaveStatus('saving');
    const timer = setTimeout(async () => {
      const updated = await updateNoteInInsForge(noteId, {
        title: savedTitle,
        tags,
        content,
        isPinned,
        icon: icon || undefined,
      });

      if (updated) {
        setNote(updated);
        setSaveStatus('saved');
        setLastSavedTime(updated.updatedAt);
      } else {
        setSaveStatus('saved');
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [title, tags, content, isPinned, noteId, note]);

  // Word & Reading Time Calculation (Memoized for high typing performance)
  const wordCount = React.useMemo(() => (content.trim() ? content.trim().split(/\s+/).length : 0), [content]);
  const charCount = content.length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  // Toggle Pin
  const handleTogglePin = () => {
    const nextPinState = !isPinned;
    setIsPinned(nextPinState);
    togglePinNote(noteId);
    if (!isViewer && user?.id) {
      broadcastNoteChangeDebounced(noteId, { isPinned: nextPinState }, { id: user.id, email: user.email });
    }
  };

  // Copy Content Action
  const handleCopyContent = () => {
    navigator.clipboard.writeText(content);
    showToast('Note content copied to clipboard!');
  };

  // Export as Markdown File (.md)
  const handleExportMarkdown = () => {
    const markdownContent = `---
title: "${title}"
tags: [${tags.map((t) => `"${t}"`).join(', ')}]
createdAt: "${note?.createdAt}"
---

# ${title}

${content}`;

    const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.md`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Exported note as Markdown (.md)');
  };

  // Slash menu block items
  const slashMenuItems: SlashMenuItem[] = [
    {
      id: 'text',
      label: 'Text',
      description: 'Just start writing with plain text.',
      icon: <Type className="w-4 h-4 text-sky-400" />,
      snippet: 'Write your thoughts here...',
      keywords: ['text', 'paragraph', 'plain'],
    },
    {
      id: 'h1',
      label: 'Heading 1',
      description: 'Big section heading.',
      icon: <Heading className="w-4 h-4 text-indigo-400" />,
      snippet: '# Large Heading\n',
      keywords: ['h1', 'heading', 'title', 'large'],
    },
    {
      id: 'h2',
      label: 'Heading 2',
      description: 'Medium section heading.',
      icon: <Heading className="w-4 h-4 text-blue-400 scale-90" />,
      snippet: '## Medium Heading\n',
      keywords: ['h2', 'heading', 'subtitle', 'medium'],
    },
    {
      id: 'h3',
      label: 'Heading 3',
      description: 'Small section heading.',
      icon: <Heading className="w-4 h-4 text-cyan-400 scale-75" />,
      snippet: '### Small Heading\n',
      keywords: ['h3', 'heading', 'sub', 'small'],
    },
    {
      id: 'code',
      label: 'Code Block',
      description: 'Capture code snippets with syntax highlighting.',
      icon: <Code2 className="w-4 h-4 text-emerald-400" />,
      snippet: '```ts\n// Enter TypeScript / JavaScript snippet\nconst code = "notion-style";\n```\n',
      keywords: ['code', 'snippet', 'typescript', 'javascript', 'python', 'json'],
    },
    {
      id: 'callout',
      label: 'Callout Box',
      description: 'Make key details or warnings stand out.',
      icon: <MessageSquareQuote className="w-4 h-4 text-amber-400" />,
      snippet: '> [!NOTE]\n> Write key takeaway, reminder, or insight...\n',
      keywords: ['callout', 'note', 'alert', 'box', 'warning', 'info'],
    },
    {
      id: 'todo',
      label: 'To-do List',
      description: 'Track tasks with interactive checkboxes.',
      icon: <CheckSquare className="w-4 h-4 text-emerald-400" />,
      snippet: '- [ ] Task item to complete\n- [ ] Follow up item\n',
      keywords: ['todo', 'task', 'checklist', 'checkbox'],
    },
    {
      id: 'bullet',
      label: 'Bulleted List',
      description: 'Create a simple bulleted list.',
      icon: <List className="w-4 h-4 text-purple-400" />,
      snippet: '- List item 1\n- List item 2\n',
      keywords: ['bullet', 'list', 'unordered'],
    },
    {
      id: 'quote',
      label: 'Quote',
      description: 'Capture quotes or highlighted excerpts.',
      icon: <Quote className="w-4 h-4 text-rose-400" />,
      snippet: '> "Simplicity is the prerequisite for reliability."\n',
      keywords: ['quote', 'excerpt', 'citation'],
    },
    {
      id: 'divider',
      label: 'Divider',
      description: 'Visually divide sections with a line.',
      icon: <Minus className="w-4 h-4 text-muted-foreground" />,
      snippet: '---\n',
      keywords: ['divider', 'line', 'hr', 'separator'],
    },
  ];

  // Filter slash items based on search query after '/'
  const filteredSlashItems = slashMenuItems.filter((item) => {
    if (!slashQuery) return true;
    const q = slashQuery.toLowerCase();
    return (
      item.label.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.keywords.some((k) => k.includes(q))
    );
  });

  // Quick Formatting Insert
  const insertFormatting = (snippet: string) => {
    setContent((prev) => {
      // Remove trailing slash if triggered via slash command
      const cleaned = prev.replace(/\/([a-zA-Z0-9]*)$/, '');
      return cleaned + (cleaned.endsWith('\n') || cleaned === '' ? '' : '\n\n') + snippet;
    });
    setShowSlashMenu(false);
    setSlashQuery('');
    showToast('Block inserted');
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // Handle Textarea Input and Slash Command Trigger
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);

    // Detect slash position
    const lastSlashIndex = val.lastIndexOf('/');
    if (lastSlashIndex !== -1 && lastSlashIndex >= val.length - 20) {
      const textAfterSlash = val.substring(lastSlashIndex + 1);
      // Ensure no newline between slash and current cursor
      if (!textAfterSlash.includes('\n')) {
        setShowSlashMenu(true);
        setSlashQuery(textAfterSlash);
        setSelectedSlashIndex(0);
        return;
      }
    }

    setShowSlashMenu(false);
    setSlashQuery('');
  };

  // Keyboard navigation inside textarea for slash menu
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showSlashMenu || filteredSlashItems.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSlashIndex((prev) => (prev + 1) % filteredSlashItems.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSlashIndex((prev) => (prev - 1 + filteredSlashItems.length) % filteredSlashItems.length);
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      const selectedItem = filteredSlashItems[selectedSlashIndex];
      if (selectedItem) {
        insertFormatting(selectedItem.snippet);
      }
    } else if (e.key === 'Escape') {
      setShowSlashMenu(false);
    }
  };

  // Tag Handlers
  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTagInput.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      const updated = [...tags, trimmed];
      setTags(updated);
      setNewTagInput('');
      setShowAddTag(false);
      if (!isViewer && user?.id) {
        broadcastNoteChangeDebounced(noteId, { tags: updated }, { id: user.id, email: user.email });
      }
      showToast(`Added #${trimmed} tag`);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const updated = tags.filter((t) => t !== tagToRemove);
    setTags(updated);
    if (!isViewer && user?.id) {
      broadcastNoteChangeDebounced(noteId, { tags: updated }, { id: user.id, email: user.email });
    }
  };

  // AI Auto-Organize Trigger
  const handleAIAutoOrganize = async () => {
    if (!content.trim()) {
      showToast('Add note content before running AI Auto-Organize');
      return;
    }

    setIsOrganizing(true);
    setAiMessage(null);

    try {
      const res = await fetch('/api/ai/organize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, tags }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to organize note');
      }

      const organized = autoOrganizeNote(noteId, {
        title: data.title,
        summary: data.summary,
        tags: data.tags,
      });

      if (organized) {
        setNote(organized);
        setTitle(organized.title);
        setTags(organized.tags);
        setAiMessage(
          data.warning
            ? `AI organized (Fallback Mode): ${data.warning}`
            : 'Groq AI auto-organized your title, summary, and tags!'
        );
        showToast('AI auto-organization complete!');
      }
    } catch (err: any) {
      console.error('AI auto-organize error:', err);
      showToast(err.message || 'AI organization failed');
    } finally {
      setIsOrganizing(false);
    }
  };

  // Delete Note
  const handleDeleteNote = () => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      deleteNoteFromInsForge(noteId);
      showToast('Note deleted');
      router.push('/notes');
    }
  };

  if (loading || !user || isFetchingNote) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground font-sans">
        <AppNavbar />
        <div className="flex-1 flex items-center justify-center p-12">
          <div className="flex flex-col items-center gap-3 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-foreground" />
            <p className="text-sm text-muted-foreground font-sans font-medium">Loading note context...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <AppNavbar />
        <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-16 text-center space-y-4 font-sans">
          <h1 className="text-2xl font-bold">Note Not Found</h1>
          <p className="text-sm text-muted-foreground">
            The note you are trying to edit does not exist or was deleted.
          </p>
          <Button asChild variant="default" className="btn-standard">
            <Link href="/notes">← BACK TO NOTE LIBRARY</Link>
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-background text-foreground transition-colors duration-200 font-sans">
      {/* Top Navbar */}
      <AppNavbar
        title={
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Back to Library */}
            <Button asChild variant="outline" size="sm" className="rounded-full font-sans font-bold text-xs">
              <Link href="/notes">
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                LIBRARY
              </Link>
            </Button>

            {/* Autosave Status */}
            <div className="flex items-center gap-1.5 px-3 py-1 bg-card border border-border rounded-full text-xs font-sans font-semibold">
              {saveStatus === 'saving' ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" />
                  <span className="text-amber-500 font-bold">Saving...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-muted-foreground">Saved {lastSavedTime}</span>
                </>
              )}
            </div>

            {/* Word & Reading Time Metrics */}
            <div className="hidden md:flex items-center gap-3 text-xs font-sans text-muted-foreground border-l border-border/80 pl-3">
              <span>{wordCount} words</span>
              <span>•</span>
              <span>{charCount} chars</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" /> {readingTime} min read
              </span>
            </div>
          </div>
        }
      />

      {/* Main Container */}
      <div className="flex flex-1 min-h-0 h-[calc(100vh-3.5rem)] overflow-hidden">
        {/* Sidebar */}
        <AppSidebar activeNoteId={noteId} />

        {/* Main Notion Canvas Panel */}
        <main className="flex-1 h-full overflow-y-auto bg-background selection:bg-amber-500/20 selection:text-foreground">
          {/* Notion Page Header Bar */}
          <div className="h-12 border-b border-border/40 px-6 sm:px-12 flex items-center justify-between bg-background/80 backdrop-blur-md sticky top-0 z-20">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-xs font-sans font-medium text-muted-foreground">
              <Link href="/notes" className="hover:text-foreground transition-colors">
                Notes
              </Link>
              <span>/</span>
              <span className="text-foreground font-bold truncate max-w-[240px]">
                {title.trim() || 'Untitled'}
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Realtime Live Collaborators Presence */}
              {collaborators.length > 0 && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/25 rounded-full text-xs font-sans">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hidden sm:inline">
                    Live ({collaborators.length})
                  </span>
                  <div className="flex items-center -space-x-1.5 ml-0.5">
                    {collaborators.slice(0, 4).map((c) => (
                      <div
                        key={c.userId}
                        className="relative group cursor-pointer"
                        title={`${c.email} (${c.userId === user?.id ? 'You' : 'Viewing now'})`}
                      >
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-xs border border-background select-none uppercase"
                          style={{ backgroundColor: c.color }}
                        >
                          {c.email.substring(0, 1)}
                        </div>
                      </div>
                    ))}
                    {collaborators.length > 4 && (
                      <div className="w-5 h-5 rounded-full bg-muted text-[9px] font-bold text-muted-foreground flex items-center justify-center border border-background">
                        +{collaborators.length - 4}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Live Remote Stream Notification */}
              {remoteSyncNotice && (
                <div className="hidden lg:flex items-center gap-1 px-2.5 py-1 bg-blue-500/10 border border-blue-500/25 text-blue-600 dark:text-blue-400 rounded-full text-[11px] font-semibold animate-pulse">
                  <Wifi className="w-3 h-3 text-blue-500" />
                  <span>{remoteSyncNotice}</span>
                </div>
              )}

              {/* Ownership Status Pill */}
              <div
                className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${permission.isOwner
                    ? 'bg-muted/80 border-border text-foreground'
                    : isViewer
                      ? 'bg-purple-500/10 border-purple-500/25 text-purple-600 dark:text-purple-400'
                      : 'bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-400'
                  }`}
              >
                {permission.isOwner ? (
                  <>
                    <Shield className="w-3.5 h-3.5 text-amber-500" />
                    <span>Owner</span>
                  </>
                ) : (
                  <>
                    <Users className="w-3.5 h-3.5 text-purple-500" />
                    <span>{permission.role === 'editor' ? 'Can Edit' : 'View Only'}</span>
                  </>
                )}
              </div>

              {/* Share Document Button */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowShareDialog(true)}
                className="h-8 px-2.5 rounded-lg text-xs font-sans font-bold bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/20 transition-all"
                title="Share Document with Collaborators"
              >
                <Share2 className="w-3.5 h-3.5 mr-1.5" />
                <span>Share</span>
              </Button>

              {/* Export Dropdown Button */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 px-2.5 rounded-lg text-xs font-sans font-bold bg-muted/60 hover:bg-muted text-foreground border-border transition-all flex items-center gap-1.5"
                    title="Export Document"
                  >
                    <Download className="w-3.5 h-3.5 text-blue-500" />
                    <span>Export</span>
                    <ChevronDown className="w-3 h-3 opacity-60" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 font-sans">
                  <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
                    Export Document
                  </div>
                  <DropdownMenuItem
                    onClick={() => note && exportNoteToPDF({ ...note, title, content, tags, icon: icon || undefined })}
                    className="cursor-pointer flex items-center gap-2 text-xs font-semibold py-2"
                  >
                    <Printer className="w-3.5 h-3.5 text-blue-500" />
                    <span>Export to PDF</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleExportMarkdown}
                    className="cursor-pointer flex items-center gap-2 text-xs font-semibold py-2"
                  >
                    <FileCode className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Export to Markdown</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Pin Toggle */}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleTogglePin}
                className="h-8 w-8 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
                title={isPinned ? 'Unpin note' : 'Pin note'}
              >
                <Pin className={`w-4 h-4 ${isPinned ? 'text-amber-500 fill-amber-500' : ''}`} />
              </Button>

              {/* Options Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
                    title="Page options"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 font-sans">
                  <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
                    Page Options
                  </div>
                  <DropdownMenuItem
                    onClick={() => setShowShareModal(true)}
                    className="cursor-pointer flex items-center gap-2 text-xs font-semibold py-2"
                  >
                    <Share2 className="w-3.5 h-3.5 text-amber-500" />
                    <span>Share Social Card (OG)</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleCopyContent}
                    className="cursor-pointer flex items-center gap-2 text-xs font-semibold py-2"
                  >
                    <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>Copy page contents</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleExportMarkdown}
                    className="cursor-pointer flex items-center gap-2 text-xs font-semibold py-2"
                  >
                    <Download className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Export as Markdown (.md)</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => note && exportNoteToPDF({ ...note, title, content, tags, icon: icon || undefined })}
                    className="cursor-pointer flex items-center gap-2 text-xs font-semibold py-2"
                  >
                    <Printer className="w-3.5 h-3.5 text-blue-500" />
                    <span>Export as PDF (.pdf)</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleDeleteNote}
                    className="cursor-pointer flex items-center gap-2 text-xs font-semibold text-destructive focus:text-destructive py-2"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    <span>Move to Trash</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* NOTION DOCUMENT CANVAS */}
          <div className="max-w-6xl mx-auto px-6 sm:px-12 pt-10 pb-96 space-y-6">
            {/* AI Alert Notification */}
            {aiMessage && (
              <Alert variant="default" className="border-amber-500/40 bg-amber-500/10 text-foreground text-xs rounded-2xl">
                <Sparkles className="w-4 h-4 mr-2 text-amber-500" />
                <AlertTitle className="font-semibold">AI Organization Complete</AlertTitle>
                <AlertDescription>{aiMessage}</AlertDescription>
              </Alert>
            )}

            {/* Notion Top Trigger Bar (Hover Icon / Cover Actions) */}
            <div className="relative group flex items-center gap-3 text-xs text-muted-foreground/70 hover:text-muted-foreground transition-colors min-h-[36px]">
              {icon ? (
                <button
                  type="button"
                  onClick={() => setShowIconPicker(!showIconPicker)}
                  className="text-4xl leading-none cursor-pointer hover:scale-110 transition-transform p-1 rounded-xl hover:bg-muted/50"
                  title="Click to change or remove icon"
                >
                  {icon}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setIcon('📝');
                    setShowIconPicker(true);
                  }}
                  className="opacity-0 group-hover:opacity-100 flex items-center gap-1.5 hover:bg-muted/80 px-2.5 py-1 rounded-lg transition-all font-semibold text-foreground text-xs"
                >
                  <Smile className="w-4 h-4 text-amber-500" />
                  <span>Add icon</span>
                </button>
              )}

              {/* EMOJI PICKER POPOVER */}
              {showIconPicker && (
                <div className="absolute top-12 left-0 z-50 bg-card border border-border rounded-2xl shadow-2xl p-3 w-64 space-y-2 animate-in zoom-in-95 duration-150 font-sans">
                  <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border/50 pb-2">
                    <span>Select Note Icon</span>
                    <button
                      type="button"
                      onClick={() => setShowIconPicker(false)}
                      className="hover:text-foreground"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-6 gap-1.5 pt-1">
                    {['📝', '🚀', '💡', '💻', '🧠', '⚡', '🎨', '📌', '📁', '📚', '🔥', '🛠️'].map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => {
                          setIcon(emoji);
                          setShowIconPicker(false);
                          if (!isViewer && user?.id) {
                            broadcastNoteChangeDebounced(noteId, { icon: emoji }, { id: user.id, email: user.email });
                          }
                        }}
                        className={`text-xl p-1.5 rounded-xl hover:bg-muted transition-transform hover:scale-125 ${icon === emoji ? 'bg-muted ring-2 ring-primary/40' : ''
                          }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                  {icon && (
                    <button
                      type="button"
                      onClick={() => {
                        setIcon(null);
                        setShowIconPicker(false);
                        if (!isViewer && user?.id) {
                          broadcastNoteChangeDebounced(noteId, { icon: null }, { id: user.id, email: user.email });
                        }
                      }}
                      className="w-full text-center text-xs font-semibold text-destructive hover:bg-destructive/10 py-1.5 rounded-xl transition-colors mt-1"
                    >
                      Remove Icon
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* View-Only Notice for Shared Viewers */}
            {isViewer && (
              <div className="flex items-center gap-2.5 p-3.5 bg-purple-500/10 border border-purple-500/25 text-purple-700 dark:text-purple-300 rounded-2xl text-xs font-semibold">
                <Eye className="w-4 h-4 shrink-0 text-purple-500" />
                <span>
                  You are viewing a shared document owned by <strong>{note?.ownerEmail || 'another collaborator'}</strong> in read-only mode.
                </span>
              </div>
            )}

            {/* NOTION PAGE TITLE */}
            <div>
              <textarea
                value={title}
                readOnly={isViewer}
                onChange={(e) => {
                  if (isViewer) return;
                  const newTitle = e.target.value;
                  setTitle(newTitle);
                  if (user?.id) {
                    broadcastNoteChangeDebounced(noteId, { title: newTitle }, { id: user.id, email: user.email });
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    textareaRef.current?.focus();
                  }
                }}
                onBlur={() => {
                  if (!title.trim()) {
                    setTitle('Untitled Note');
                    if (user?.id) {
                      broadcastNoteChangeDebounced(noteId, { title: 'Untitled Note' }, { id: user.id, email: user.email });
                    }
                  }
                }}
                placeholder="Untitled"
                rows={1}
                className={`w-full bg-transparent border-none focus:outline-none text-4xl sm:text-5xl font-black tracking-tight text-foreground placeholder:text-muted-foreground/30 resize-none overflow-hidden leading-tight font-sans ${isViewer ? 'cursor-default' : ''
                  }`}
              />
            </div>

            {/* NOTION PROPERTIES METADATA TABLE */}
            <div className="border-y border-border/40 py-3 my-4 space-y-2.5 text-xs">
              {/* Row 1: Tags */}
              <div className="flex items-center gap-4 group">
                <div className="w-28 flex items-center gap-2 text-muted-foreground font-medium shrink-0">
                  <Tag className="w-3.5 h-3.5 text-muted-foreground/70" />
                  <span>Tags</span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-muted/80 hover:bg-muted border border-border/60 rounded-md font-bold text-foreground transition-colors"
                    >
                      <span>#{tag}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}

                  {showAddTag ? (
                    <div className="relative inline-flex items-center">
                      <form onSubmit={handleAddTag} className="inline-flex items-center">
                        <Input
                          type="text"
                          autoFocus
                          placeholder="Tag name..."
                          value={newTagInput}
                          onChange={(e) => setNewTagInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Escape') {
                              setShowAddTag(false);
                              setNewTagInput('');
                            }
                          }}
                          className="h-6 px-2 text-xs w-32 bg-muted border-border rounded-md font-bold"
                        />
                      </form>

                      {/* TAG SUGGESTIONS POPOVER */}
                      <div className="absolute top-8 left-0 z-50 bg-card border border-border rounded-xl shadow-xl p-1.5 min-w-[160px] max-h-48 overflow-y-auto space-y-0.5 animate-in zoom-in-95 duration-100 font-sans text-xs">
                        <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border/40 mb-1 flex items-center justify-between">
                          <span>Suggestions</span>
                          {newTagInput.trim() && !allAvailableTags.includes(newTagInput.trim().toLowerCase()) && (
                            <span className="text-[9px] text-amber-500 font-extrabold">(New Tag)</span>
                          )}
                        </div>

                        {/* Existing tag suggestions matching input */}
                        {allAvailableTags
                          .filter((t) => !tags.includes(t) && t.includes(newTagInput.trim().toLowerCase()))
                          .map((suggestedTag) => (
                            <button
                              key={suggestedTag}
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                if (!tags.includes(suggestedTag)) {
                                  setTags([...tags, suggestedTag]);
                                  setNewTagInput('');
                                  setShowAddTag(false);
                                  showToast(`Added #${suggestedTag}`);
                                }
                              }}
                              className="w-full flex items-center justify-between px-2 py-1 rounded-lg hover:bg-muted font-bold text-foreground text-left transition-colors"
                            >
                              <span>#{suggestedTag}</span>
                              <Plus className="w-3 h-3 text-muted-foreground" />
                            </button>
                          ))}

                        {/* If user typed something brand new */}
                        {newTagInput.trim() &&
                          !allAvailableTags.includes(newTagInput.trim().toLowerCase()) &&
                          !tags.includes(newTagInput.trim().toLowerCase()) && (
                            <button
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                const trimmed = newTagInput.trim().toLowerCase();
                                setTags([...tags, trimmed]);
                                setNewTagInput('');
                                setShowAddTag(false);
                                showToast(`Created & added #${trimmed}`);
                              }}
                              className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-left transition-colors border border-amber-500/30"
                            >
                              <Plus className="w-3.5 h-3.5 shrink-0" />
                              <span>Add "{newTagInput.trim().toLowerCase()}"</span>
                            </button>
                          )}

                        {/* Close Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setShowAddTag(false);
                            setNewTagInput('');
                          }}
                          className="w-full text-center text-[10px] font-semibold text-muted-foreground hover:text-foreground py-1 border-t border-border/40 mt-1 cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowAddTag(true)}
                      className="inline-flex items-center gap-1 px-2 py-0.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors font-medium opacity-70 group-hover:opacity-100 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      Empty
                    </button>
                  )}
                </div>
              </div>


            </div>



            {/* NOTION SLASH MENU POPOVER */}
            <div className="relative">
              {showSlashMenu && mode === 'write' && (
                <div className="absolute top-0 left-0 z-50 bg-card border border-border rounded-2xl shadow-2xl p-2 w-72 max-h-80 overflow-y-auto space-y-1 animate-in zoom-in-95 duration-150 font-sans text-xs">
                  <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between border-b border-border/50 mb-1">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-500" /> Formatting Blocks
                    </span>
                    <span>Type to filter</span>
                  </div>

                  {filteredSlashItems.length === 0 ? (
                    <div className="px-3 py-4 text-center text-muted-foreground font-medium text-xs">
                      No matching blocks found
                    </div>
                  ) : (
                    filteredSlashItems.map((item, idx) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => insertFormatting(item.snippet)}
                        onMouseEnter={() => setSelectedSlashIndex(idx)}
                        className={`w-full text-left px-3 py-2 rounded-xl transition-all flex items-start gap-3 ${selectedSlashIndex === idx
                            ? 'bg-muted text-foreground font-bold shadow-2xs'
                            : 'hover:bg-muted/60 text-muted-foreground'
                          }`}
                      >
                        <div className="p-1.5 bg-background border border-border/80 rounded-lg shrink-0 mt-0.5">
                          {item.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-foreground text-xs">{item.label}</div>
                          <div className="text-[11px] text-muted-foreground font-normal line-clamp-1">
                            {item.description}
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}

              {/* CANVAS WRITING AREA */}
              <BlockEditor
                initialContent={initialCached?.content || note?.content || ''}
                remoteContent={remoteContent}
                onChange={(newMarkdown) => {
                  setContent(newMarkdown);
                  if (!isViewer && user?.id) {
                    broadcastNoteChangeDebounced(noteId, { content: newMarkdown }, { id: user.id, email: user.email });
                  }
                }}
                editable={!isViewer}
                className="min-h-[460px]"
              />
            </div>
          </div>
        </main>
      </div>

      {/* Social Card Preview Modal */}
      {note && (
        <ShareOGModal
          note={note}
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
        />
      )}

      {/* Document Sharing Collaborators Modal */}
      {note && (
        <ShareDialog
          note={note}
          isOpen={showShareDialog}
          onClose={() => setShowShareDialog(false)}
          onUpdate={(updated) => setNote(updated)}
        />
      )}
    </div>
  );
}
