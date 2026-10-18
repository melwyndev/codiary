"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ModeToggle } from "@/components/mode-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { showToast } from "@/components/toast";
import { getNotes, reorderNotes, createNote } from "@/lib/notes-store";
import {
  Menu,
  User,
  Users,
  LogOut,
  FileText,
  Sparkles,
  Download,
  UploadCloud,
  HelpCircle,
  X,
  Keyboard,
} from "lucide-react";

export function UserMenu() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  const displayName = user.profile?.nickname || user.name || user.email?.split("@")[0] || "User";

  // Export Entire Vault as JSON Backup
  const handleExportVaultBackup = () => {
    try {
      const notesList = getNotes();
      const backupData = JSON.stringify(notesList, null, 2);
      const blob = new Blob([backupData], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `codiary-vault-backup-${new Date().toISOString().substring(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      showToast("Vault backup downloaded (.json)");
    } catch (err) {
      showToast("Failed to backup vault", "error");
    }
  };

  // Import Notes File Picker (.md or .json)
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      try {
        if (file.name.endsWith(".json")) {
          const parsed = JSON.parse(text);
          if (Array.isArray(parsed)) {
            const currentNotes = getNotes();
            const merged = [...currentNotes];
            parsed.forEach((importedNote) => {
              if (!merged.some((n) => n.id === importedNote.id)) {
                merged.unshift(importedNote);
              }
            });
            reorderNotes(merged);
            window.dispatchEvent(new CustomEvent("refresh-notes"));
            showToast(`Imported ${parsed.length} notes from JSON backup`);
          }
        } else {
          // Import Markdown file
          createNote({
            title: file.name.replace(/\.[^/.]+$/, ""),
            tags: ["imported"],
            content: text,
          });
          window.dispatchEvent(new CustomEvent("refresh-notes"));
          showToast(`Imported "${file.name}" from Markdown`);
        }
      } catch (err) {
        showToast("Failed to parse imported file", "error");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-full border-border bg-card hover:bg-muted text-foreground transition-transform duration-200 active:scale-95 shadow-sm"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          sideOffset={8}
          className="w-60 p-2 rounded-2xl bg-card/95 backdrop-blur-xl border border-border shadow-2xl space-y-1 font-sans animate-in fade-in zoom-in-95 duration-150"
        >
          {/* User Info Header */}
          <div className="px-3 py-2.5 space-y-0.5 border-b border-border/60 mb-1">
            <p className="text-xs font-black uppercase tracking-wider text-foreground truncate">
              {displayName}
            </p>
            <p className="text-[11px] text-muted-foreground truncate font-sans font-medium">
              {user.email}
            </p>
          </div>

          {/* Navigation Links */}
          <DropdownMenuItem
            onClick={() => router.push("/notes")}
            className="cursor-pointer flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-foreground hover:bg-muted focus:bg-muted transition-colors"
          >
            <FileText className="w-4 h-4 text-muted-foreground" />
            <span>Notes Library</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => router.push("/account")}
            className="cursor-pointer flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-foreground hover:bg-muted focus:bg-muted transition-colors"
          >
            <User className="w-4 h-4 text-muted-foreground" />
            <span>Account & Profile</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator className="my-1 bg-border/60" />

          {/* Vault Management Section */}
          <div className="px-3 py-1.5 text-[10px] font-sans font-black uppercase tracking-wider text-muted-foreground/75">
            Vault Management
          </div>

          <DropdownMenuItem
            onClick={handleExportVaultBackup}
            className="cursor-pointer flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-foreground hover:bg-muted focus:bg-muted transition-colors"
          >
            <Download className="w-4 h-4 text-indigo-400" />
            <span>Backup Vault</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => fileInputRef.current?.click()}
            className="cursor-pointer flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-foreground hover:bg-muted focus:bg-muted transition-colors"
          >
            <UploadCloud className="w-4 h-4 text-emerald-400" />
            <span>Import Vault</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => setIsShortcutsOpen(true)}
            className="cursor-pointer flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-foreground hover:bg-muted focus:bg-muted transition-colors"
          >
            <HelpCircle className="w-4 h-4 text-muted-foreground" />
            <span>Shortcuts Help</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator className="my-1 bg-border/60" />

          {/* Sign Out CTA */}
          <DropdownMenuItem
            onClick={() => signOut()}
            className="cursor-pointer flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-muted focus:bg-muted transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Hidden file input for vault import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".md,.json"
        onChange={handleImportFile}
        className="hidden"
      />

      {/* Mode / Theme Toggle */}
      <ModeToggle />

      {/* Keyboard Shortcuts Modal */}
      {isShortcutsOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 font-sans animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2 font-bold text-foreground">
                <Keyboard className="w-4 h-4 text-amber-500" />
                <h2>Keyboard Shortcuts</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsShortcutsOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-foreground font-medium">
              <div className="flex justify-between items-center p-2.5 bg-muted rounded-xl">
                <span>Global Command Search</span>
                <kbd className="px-2 py-1 bg-background border border-border rounded text-[10px] font-bold">Cmd + K</kbd>
              </div>
              <div className="flex justify-between items-center p-2.5 bg-muted rounded-xl">
                <span>Create New Note</span>
                <kbd className="px-2 py-1 bg-background border border-border rounded text-[10px] font-bold">Cmd + N</kbd>
              </div>
              <div className="flex justify-between items-center p-2.5 bg-muted rounded-xl">
                <span>Account Profile Settings</span>
                <kbd className="px-2 py-1 bg-background border border-border rounded text-[10px] font-bold">Cmd + Shift + A</kbd>
              </div>
              <div className="flex justify-between items-center p-2.5 bg-muted rounded-xl">
                <span>Toggle Light / Dark Theme</span>
                <kbd className="px-2 py-1 bg-background border border-border rounded text-[10px] font-bold">Cmd + Shift + T</kbd>
              </div>
              <div className="flex justify-between items-center p-2.5 bg-muted rounded-xl">
                <span>Dismiss Modals / Menus</span>
                <kbd className="px-2 py-1 bg-background border border-border rounded text-[10px] font-bold">ESC</kbd>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
