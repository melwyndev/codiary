"use client";

import React, { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { AppNavbar } from "@/components/app-navbar";
import { AppSidebar } from "@/components/app-sidebar";
import { CommandPalette } from "@/components/command-palette";
import { ToastContainer, showToast } from "@/components/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
	DropdownMenu,
	DropdownMenuTrigger,
	DropdownMenuContent,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import {
	Loader2,
	AlertCircle,
	Plus,
	Search,
	Tag,
	Sparkles,
	X,
	LayoutGrid,
	List,
	Pin,
	Command,
	HelpCircle,
	Download,
	UploadCloud,
	ArrowUpDown,
	RotateCcw,
	FileText,
	PanelLeft,
	Users,
	Share2,
	Shield,
	FileCode,
	Printer,
	Pencil,
} from "lucide-react";
import { ShareDialog } from "@/components/share-dialog";
import { FileImportDialog } from "@/components/file-import-dialog";
import { NoteRenameDialog } from "@/components/note-rename-dialog";
import { exportNoteToMarkdown, exportNoteToPDF } from "@/lib/export-utils";
import {
	getNotesFromInsForge,
	getNotes,
	createNoteInInsForge,
	reorderNotes,
	deleteNoteFromInsForge,
	togglePinNote,
	generateUUID,
	NoteItem,
} from "@/lib/notes-store";
import { searchNotesSemantically } from "@/lib/semantic-search";

function NotesContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const actionParam = searchParams.get("action");

	const { user, loading, error } = useAuth();

	// Synchronously initialize notesList from memory store for instant route transitions
	const [notesList, setNotesList] = useState<NoteItem[]>(() => getNotes());
	const [searchQuery, setSearchQuery] = useState("");
	const [isFetchingNotes, setIsFetchingNotes] = useState(
		() => getNotes().length === 0,
	);

	// MULTI-SELECT TAGS
	const [selectedTags, setSelectedTags] = useState<string[]>([]);

	// SHARING & OWNERSHIP FILTER
	const [sharingFilter, setSharingFilter] = useState<"all" | "owned" | "shared">("all");
	const [shareModalNote, setShareModalNote] = useState<NoteItem | null>(null);
	const [isImportModalOpen, setIsImportModalOpen] = useState(false);

	// SORTING STATE
	const [sortBy, setSortBy] = useState<
		"custom" | "updated" | "created" | "title"
	>("custom");

	const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

	// Drag & Drop State
	const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
	const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

	// Notion-Style Context Menu State
	const [contextMenu, setContextMenu] = useState<{
		visible: boolean;
		x: number;
		y: number;
		note: NoteItem | null;
	}>({ visible: false, x: 0, y: 0, note: null });

	// Rename Modal State
	const [renameModalNote, setRenameModalNote] = useState<NoteItem | null>(null);

	// Load notes on mount & user change directly from InsForge PostgreSQL DB
	const refreshNotes = () => {
		setNotesList(getNotes());
		setIsFetchingNotes(false);
		getNotesFromInsForge().then((list) => {
			if (list && list.length > 0) {
				setNotesList(list);
			}
		});
	};

	useEffect(() => {
		refreshNotes();
		window.addEventListener("refresh-notes", refreshNotes);
		return () => {
			window.removeEventListener("refresh-notes", refreshNotes);
		};
	}, [user]);

	// Dismiss Context Menu on window click or scroll
	useEffect(() => {
		const closeMenu = () =>
			setContextMenu((prev) => ({ ...prev, visible: false }));
		window.addEventListener("click", closeMenu);
		window.addEventListener("scroll", closeMenu);
		return () => {
			window.removeEventListener("click", closeMenu);
			window.removeEventListener("scroll", closeMenu);
		};
	}, []);

	// Protected Route Guard
	useEffect(() => {
		if (!loading && !user) {
			router.push("/login");
		}
	}, [user, loading, router]);

	// Toggle Multi-Select Tag
	const toggleTagFilter = (tag: string) => {
		setSelectedTags((prev) =>
			prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
		);
	};

	const clearAllFilters = () => {
		setSelectedTags([]);
		setSearchQuery("");
		showToast("Filters reset");
	};

	const isCreatingNew = searchParams.get("action") === "new";

	// Direct Note Creation (Bypasses modal step & navigates immediately without grid flash)
	const handleCreateNewNoteDirectly = async () => {
		const newNoteId = generateUUID();
		await createNoteInInsForge(
			{
				id: newNoteId,
				title: "Untitled Note",
				tags: ["general"],
				content: "",
			},
			user?.id,
			user?.email,
		);
		showToast("Created new note!");
		router.push(`/notes/${newNoteId}`);
	};

	// Handle action=new query parameter
	useEffect(() => {
		if (isCreatingNew) {
			handleCreateNewNoteDirectly();
		}
	}, [isCreatingNew]);

	// Context Menu Trigger (Right Click)
	const handleContextMenu = (e: React.MouseEvent, note: NoteItem) => {
		e.preventDefault();
		e.stopPropagation();
		setContextMenu({
			visible: true,
			x: e.clientX,
			y: e.clientY,
			note,
		});
	};

	// Drag & Drop Sorting Handlers
	const wasDraggingRef = useRef<boolean>(false);

	const handleDragStart = (e: React.DragEvent, index: number) => {
		wasDraggingRef.current = true;
		setDraggedIndex(index);
		e.dataTransfer.effectAllowed = "move";
	};

	const handleDragOver = (e: React.DragEvent, index: number) => {
		e.preventDefault();
		e.dataTransfer.dropEffect = "move";
		if (dragOverIndex !== index) {
			setDragOverIndex(index);
		}
	};

	const handleDrop = (e: React.DragEvent, targetIndex: number) => {
		e.preventDefault();
		if (draggedIndex === null || draggedIndex === targetIndex) return;

		const updated = [...notesList];
		const [movedItem] = updated.splice(draggedIndex, 1);
		updated.splice(targetIndex, 0, movedItem);

		setNotesList(updated);
		reorderNotes(updated);
		setDraggedIndex(null);
		setDragOverIndex(null);
	};

	const handleDragEnd = () => {
		setDraggedIndex(null);
		setDragOverIndex(null);
		setTimeout(() => {
			wasDraggingRef.current = false;
		}, 150);
	};

	// Compute Tag Map & Counts
	const tagCounts: { [tag: string]: number } = {};
	notesList.forEach((n) => {
		n.tags.forEach((t) => {
			tagCounts[t] = (tagCounts[t] || 0) + 1;
		});
	});

	const currentView = searchParams.get("view") || "all";

	// Filter & Sort Logic using Unified Semantic Search Engine
	const semanticMatchedNotes = searchQuery.trim()
		? searchNotesSemantically(notesList, searchQuery).map((r) => r.note)
		: notesList;

	const currentUserEmail = (user?.email || "").trim().toLowerCase();
	const isSharedWithMe = (n: NoteItem) => {
		const owner = (n.ownerEmail || "").trim().toLowerCase();
		return (
			Boolean(owner) &&
			owner !== currentUserEmail &&
			Boolean(n.sharedWith?.some((s) => s.email.toLowerCase() === currentUserEmail))
		);
	};
	const isOwnedByMe = (n: NoteItem) => {
		const owner = (n.ownerEmail || "").trim().toLowerCase();
		return !owner || owner === currentUserEmail || n.ownerId === user?.id;
	};

	const filteredNotes = semanticMatchedNotes.filter((n) => {
		if (currentView === "pinned" && !n.isPinned) return false;

		if (sharingFilter === "owned" && !isOwnedByMe(n)) return false;
		if (sharingFilter === "shared" && !isSharedWithMe(n)) return false;

		const matchesTag =
			selectedTags.length === 0 ||
			selectedTags.every((st) => n.tags.includes(st));
		return matchesTag;
	});

	// Sort Filtered Notes
	const sortedNotes = [...filteredNotes].sort((a, b) => {
		if (currentView === "recents") {
			return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
		}
		if (sortBy === "updated")
			return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
		if (sortBy === "created")
			return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
		if (sortBy === "title") return a.title.localeCompare(b.title);
		return 0; // Custom drag-and-drop order
	});

	// Separate Pinned Notes vs Unpinned Notes
	const pinnedNotes =
		currentView === "all" || currentView === "private"
			? sortedNotes.filter((n) => n.isPinned)
			: [];
	const unpinnedNotes =
		currentView === "all" || currentView === "private"
			? sortedNotes.filter((n) => !n.isPinned)
			: sortedNotes;

	const hasActiveFilters = selectedTags.length > 0 || searchQuery !== "";

	if (
		loading ||
		!user ||
		isCreatingNew ||
		(isFetchingNotes && notesList.length === 0)
	) {
		return (
			<div className="min-h-screen flex flex-col bg-background text-foreground">
				<AppNavbar />
				<div className="flex-1 flex items-center justify-center p-12">
					<div className="flex flex-col items-center gap-3 text-center">
						<Loader2 className="w-8 h-8 animate-spin text-foreground" />
						<p className="text-sm text-muted-foreground font-sans font-medium font-bold tracking-wider">
							{isCreatingNew ? "CREATING NEW NOTE..." : "LOADING NOTE VAULT..."}
						</p>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="h-screen overflow-hidden flex flex-col bg-background text-foreground transition-colors duration-200">
			{/* Universal App Navbar */}

			{/* Global Raycast-Style Command Palette */}
			<CommandPalette />

			{/* Toast Notification Container */}
			<ToastContainer />

			{/* Unified App Navbar — h-14, auth-conditional, consistent across all routes */}
			<AppNavbar title="Developer Notes & Library" />

			{/* Flex container for sidebar + main content */}
			<div className="flex flex-1 min-h-0 h-[calc(100vh-3.5rem)] overflow-hidden">
				{/* Unified App Sidebar */}
				<AppSidebar />

				{/* Main Panel */}
				<main className="flex-1 h-full overflow-y-auto">
					{/* ROW 2: Main Workspace Section */}
					<div className="px-4 sm:px-5 py-6 sm:py-8 space-y-6 sm:space-y-8">
						{/* Feedback Alerts */}
						{error && (
							<Alert variant="destructive" className="text-xs">
								<AlertCircle className="w-4 h-4 mr-2" />
								<AlertTitle className="font-semibold">Error</AlertTitle>
								<AlertDescription>{error}</AlertDescription>
							</Alert>
						)}

						{/* NOTES WORKSPACE & LIBRARY */}
						<div className="space-y-6">
							{/* ROW 2: Search Bar Row + View Toggle & NEW NOTE CTA */}
							<div className="flex flex-col sm:flex-row items-center justify-between gap-4">
								{/* Search Bar with Cmd+K Trigger */}
								<div className="relative flex-1 w-full">
									<Search className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground z-10" />
									<Input
										type="text"
										placeholder="Search notes by title, tag, or content (Cmd+K)..."
										value={searchQuery}
										onChange={(e) => setSearchQuery(e.target.value)}
										className="bg-card border-border text-foreground input-standard !pl-14 !pr-20 w-full"
									/>
									<button
										type="button"
										onClick={() =>
											window.dispatchEvent(
												new CustomEvent("open-command-palette"),
											)
										}
										className="absolute right-4 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1 px-2.5 py-1 text-[10px] font-sans font-bold uppercase text-muted-foreground bg-muted hover:bg-muted/80 rounded-lg border border-border/80 transition-colors"
									>
										<Command className="w-3 h-3" /> K
									</button>
								</div>

								{/* Controls Group: Sort Selector + View Mode Switcher + NEW NOTE Button */}
								<div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto justify-end">
									{/* Vault Sorting Selector using Shadcn DropdownMenu */}
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button
												variant="outline"
												className="h-16 px-4 rounded-full border-border bg-card hover:bg-muted text-xs font-sans font-bold text-foreground flex items-center gap-2 shrink-0"
											>
												<ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
												<span>
													{sortBy === "custom"
														? "Custom Order"
														: sortBy === "updated"
															? "Recently Updated"
															: sortBy === "created"
																? "Recently Created"
																: "Title (A-Z)"}
												</span>
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent align="end" className="w-48">
											<DropdownMenuRadioGroup
												value={sortBy}
												onValueChange={(val: any) => setSortBy(val)}
											>
												<DropdownMenuRadioItem
													value="custom"
													className="text-xs font-bold font-sans"
												>
													Custom Order
												</DropdownMenuRadioItem>
												<DropdownMenuRadioItem
													value="updated"
													className="text-xs font-bold font-sans"
												>
													Recently Updated
												</DropdownMenuRadioItem>
												<DropdownMenuRadioItem
													value="created"
													className="text-xs font-bold font-sans"
												>
													Recently Created
												</DropdownMenuRadioItem>
												<DropdownMenuRadioItem
													value="title"
													className="text-xs font-bold font-sans"
												>
													Title (A-Z)
												</DropdownMenuRadioItem>
											</DropdownMenuRadioGroup>
										</DropdownMenuContent>
									</DropdownMenu>

									{/* View Mode Switcher */}
									<div className="flex items-center gap-1 bg-card border border-border p-1 rounded-full shrink-0 h-16">
										<button
											type="button"
											onClick={() => setViewMode("grid")}
											className={`h-14 px-3.5 rounded-full text-xs font-sans font-bold flex items-center gap-1.5 transition-all ${
												viewMode === "grid"
													? "bg-muted text-foreground border border-border shadow-sm font-black"
													: "text-muted-foreground hover:text-foreground"
											}`}
											title="Grid View"
										>
											<LayoutGrid className="w-4 h-4" />
											<span className="hidden sm:inline">GRID</span>
										</button>
										<button
											type="button"
											onClick={() => setViewMode("list")}
											className={`h-14 px-3.5 rounded-full text-xs font-sans font-bold flex items-center gap-1.5 transition-all ${
												viewMode === "list"
													? "bg-muted text-foreground border border-border shadow-sm font-black"
													: "text-muted-foreground hover:text-foreground"
											}`}
											title="List View"
										>
											<List className="w-4 h-4" />
											<span className="hidden sm:inline">LIST</span>
										</button>
									</div>

									{/* Import Document Button */}
									<Button
										type="button"
										onClick={() => setIsImportModalOpen(true)}
										variant="outline"
										className="h-14 px-4 rounded-full border-border bg-card hover:bg-muted text-foreground text-xs font-sans font-bold flex items-center gap-2 transition-all shadow-sm"
										title="Import .md, .txt, or .json file into a new document"
									>
										<UploadCloud className="w-4 h-4 text-emerald-500" />
										<span className="hidden sm:inline">IMPORT</span>
									</Button>

									{/* NEW NOTE Button */}
									<Button
										onClick={handleCreateNewNoteDirectly}
										variant="default"
										className="btn-standard shrink-0 shadow-md"
									>
										<Plus className="w-4 h-4 mr-2" />
										NEW NOTE
									</Button>
								</div>
							</div>

							{/* SHARING & OWNERSHIP FILTER TABS */}
							<div className="flex flex-wrap items-center gap-2 pt-1 pb-1">
								<div className="flex items-center gap-1.5 p-1 bg-muted/60 rounded-2xl border border-border/60">
									<button
										type="button"
										onClick={() => setSharingFilter("all")}
										className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
											sharingFilter === "all"
												? "bg-card text-foreground shadow-sm border border-border/80 font-black"
												: "text-muted-foreground hover:text-foreground"
										}`}
									>
										<FileText className="w-3.5 h-3.5" />
										<span>All Notes</span>
										<span className="text-[10px] px-1.5 py-0.2 rounded-full bg-muted font-mono">
											{notesList.length}
										</span>
									</button>

									<button
										type="button"
										onClick={() => setSharingFilter("owned")}
										className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
											sharingFilter === "owned"
												? "bg-card text-foreground shadow-sm border border-border/80 font-black"
												: "text-muted-foreground hover:text-foreground"
										}`}
									>
										<Shield className="w-3.5 h-3.5 text-amber-500" />
										<span>My Notes</span>
										<span className="text-[10px] px-1.5 py-0.2 rounded-full bg-muted font-mono">
											{notesList.filter(isOwnedByMe).length}
										</span>
									</button>

									<button
										type="button"
										onClick={() => setSharingFilter("shared")}
										className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
											sharingFilter === "shared"
												? "bg-card text-purple-600 dark:text-purple-400 shadow-sm border border-purple-500/30 font-black"
												: "text-muted-foreground hover:text-foreground"
										}`}
									>
										<Users className="w-3.5 h-3.5 text-purple-500" />
										<span>Shared with Me</span>
										<span className="text-[10px] px-1.5 py-0.2 rounded-full bg-purple-500/10 font-mono text-purple-600 dark:text-purple-400 font-bold">
											{notesList.filter(isSharedWithMe).length}
										</span>
									</button>
								</div>
							</div>

							{/* Tag Filter Chips Bar */}
							{Object.keys(tagCounts).length > 0 && (
								<div className="flex flex-wrap items-center gap-2 pt-1 pb-1">
									<div className="flex items-center gap-1.5 text-xs font-sans font-bold text-muted-foreground mr-1">
										<Tag className="w-3.5 h-3.5 text-amber-500" />
										<span>Filter Tags:</span>
									</div>

									{Object.entries(tagCounts).map(([tag, count]) => {
										const isSelected = selectedTags.includes(tag);
										return (
											<button
												key={tag}
												type="button"
												onClick={() => toggleTagFilter(tag)}
												className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-sans font-bold transition-all cursor-pointer border ${
													isSelected
														? "bg-amber-500/15 border-amber-500 text-amber-600 dark:text-amber-400 shadow-xs"
														: "bg-card border-border hover:bg-muted text-muted-foreground hover:text-foreground"
												}`}
											>
												<span>#{tag}</span>
												<span
													className={`px-1.5 py-0.2 rounded-full text-[10px] ${
														isSelected
															? "bg-amber-500/30 text-amber-700 dark:text-amber-300 font-extrabold"
															: "bg-muted text-muted-foreground/80"
													}`}
												>
													{count}
												</span>
											</button>
										);
									})}

									{hasActiveFilters && (
										<Button
											variant="ghost"
											size="sm"
											onClick={clearAllFilters}
											className="h-7 px-2.5 rounded-full text-xs font-sans font-bold text-muted-foreground hover:text-foreground"
										>
											<X className="w-3 h-3 mr-1" />
											Reset Filters
										</Button>
									)}
								</div>
							)}

							{/* SECTION 1: PINNED NOTES (If any) */}
							{pinnedNotes.length > 0 && (
								<div className="space-y-3 pt-2">
									<div className="flex items-center gap-2 text-xs font-sans font-bold uppercase tracking-wider text-amber-500">
										<Pin className="w-3.5 h-3.5 fill-current" />
										<span>Pinned Notes ({pinnedNotes.length})</span>
									</div>
									<div
										className={
											viewMode === "grid"
												? "grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-5"
												: "grid grid-cols-1 gap-3.5"
										}
									>
										{pinnedNotes.map((note) =>
											renderNoteCard(note, notesList.indexOf(note)),
										)}
									</div>
								</div>
							)}

							{/* SECTION 2: ALL / UNPINNED NOTES */}
							<div className="space-y-3 pt-2">
								{(pinnedNotes.length > 0 || currentView !== "all") && (
									<div className="text-xs font-sans font-bold uppercase tracking-wider text-muted-foreground">
										{currentView === "recents"
											? `Recent Notes (${unpinnedNotes.length})`
											: currentView === "pinned"
												? `Pinned Notes (${unpinnedNotes.length})`
												: `All Notes (${unpinnedNotes.length})`}
									</div>
								)}
								<div
									className={
										viewMode === "grid"
											? "grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-5"
											: "grid grid-cols-1 gap-3.5"
									}
								>
									{filteredNotes.length === 0 ? (
										<div className="col-span-full p-12 text-center bg-card border border-border rounded-3xl text-muted-foreground text-xs font-sans font-medium space-y-2">
											<p>
												No notes found matching your active filter criteria.
											</p>
											<Button
												variant="outline"
												size="sm"
												onClick={clearAllFilters}
												className="rounded-full text-xs"
											>
												Reset All Filters
											</Button>
										</div>
									) : (
										unpinnedNotes.map((note) =>
											renderNoteCard(note, notesList.indexOf(note)),
										)
									)}
								</div>
							</div>
						</div>
					</div>
				</main>

				{/* NOTION-STYLE RIGHT-CLICK CONTEXT MENU POPOVER */}
				{contextMenu.visible && contextMenu.note && (
					<div
						style={{ top: contextMenu.y, left: contextMenu.x }}
						className="fixed z-50 min-w-[170px] bg-card border border-border rounded-2xl shadow-2xl p-1.5 space-y-0.5 animate-in fade-in zoom-in-95 duration-150 font-sans text-xs uppercase tracking-wider font-bold"
						onClick={(e) => e.stopPropagation()}
					>
						<button
							type="button"
							onClick={() => {
								const noteId = contextMenu.note?.id;
								setContextMenu({ visible: false, x: 0, y: 0, note: null });
								if (noteId) togglePinNote(noteId);
								refreshNotes();
							}}
							className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-foreground hover:bg-muted transition-colors text-left font-bold"
						>
							<Pin className="w-4 h-4 text-amber-500" />
							<span>
								{contextMenu.note.isPinned ? "UNPIN NOTE" : "PIN NOTE"}
							</span>
						</button>

						<button
							type="button"
							onClick={() => {
								const noteId = contextMenu.note?.id;
								setContextMenu({ visible: false, x: 0, y: 0, note: null });
								if (noteId) router.push(`/notes/${noteId}`);
							}}
							className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-foreground hover:bg-muted transition-colors text-left font-bold"
						>
							<span>EDIT NOTE</span>
						</button>

						<button
							type="button"
							onClick={() => {
								const target = contextMenu.note;
								setContextMenu({ visible: false, x: 0, y: 0, note: null });
								if (target) setRenameModalNote(target);
							}}
							className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 transition-colors text-left font-bold"
						>
							<Pencil className="w-4 h-4 text-blue-500" />
							<span>RENAME NOTE</span>
						</button>

						<button
							type="button"
							onClick={() => {
								const target = contextMenu.note;
								setContextMenu({ visible: false, x: 0, y: 0, note: null });
								if (target) setShareModalNote(target);
							}}
							className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-purple-600 dark:text-purple-400 hover:bg-purple-500/10 transition-colors text-left font-bold"
						>
							<Share2 className="w-4 h-4" />
							<span>SHARE NOTE</span>
						</button>

						<div className="h-px bg-border/60 my-1" />

						<button
							type="button"
							onClick={() => {
								const target = contextMenu.note;
								setContextMenu({ visible: false, x: 0, y: 0, note: null });
								if (target) exportNoteToMarkdown(target);
							}}
							className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 transition-colors text-left font-bold"
						>
							<FileCode className="w-4 h-4" />
							<span>EXPORT MARKDOWN (.MD)</span>
						</button>

						<button
							type="button"
							onClick={() => {
								const target = contextMenu.note;
								setContextMenu({ visible: false, x: 0, y: 0, note: null });
								if (target) exportNoteToPDF(target);
							}}
							className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 transition-colors text-left font-bold"
						>
							<Printer className="w-4 h-4" />
							<span>EXPORT PDF (.PDF)</span>
						</button>

						<div className="h-px bg-border/60 my-1" />

						<button
							type="button"
							onClick={() => {
								const noteId = contextMenu.note?.id;
								setContextMenu({ visible: false, x: 0, y: 0, note: null });
								if (noteId) {
									deleteNoteFromInsForge(noteId);
									refreshNotes();
									showToast("Deleted note");
								}
							}}
							className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-destructive hover:bg-destructive/10 transition-colors text-left font-bold"
						>
							<span>DELETE NOTE</span>
						</button>
					</div>
				)}

				{/* Share Collaborators Modal */}
				{shareModalNote && (
					<ShareDialog
						note={shareModalNote}
						isOpen={Boolean(shareModalNote)}
						onClose={() => setShareModalNote(null)}
						onUpdate={refreshNotes}
					/>
				)}

				{/* File Import Document Modal */}
				<FileImportDialog
					isOpen={isImportModalOpen}
					onClose={() => setIsImportModalOpen(false)}
					onSuccess={refreshNotes}
				/>

				{/* Rename Document Modal */}
				<NoteRenameDialog
					isOpen={Boolean(renameModalNote)}
					note={renameModalNote}
					onClose={() => setRenameModalNote(null)}
					onRenamed={() => refreshNotes()}
				/>
			</div>
		</div>
	);

	// Helper Card Renderer
	function renderNoteCard(note: NoteItem, index: number) {
		const isDragging = draggedIndex === index;
		const isDragOver = dragOverIndex === index;

		return viewMode === "grid" ? (
			<div
				key={note.id}
				draggable
				onDragStart={(e) => handleDragStart(e, index)}
				onDragOver={(e) => handleDragOver(e, index)}
				onDrop={(e) => handleDrop(e, index)}
				onDragEnd={handleDragEnd}
				onContextMenu={(e) => handleContextMenu(e, note)}
				onClick={(e) => {
					if (wasDraggingRef.current) return;
					router.push(`/notes/${note.id}`);
				}}
				className={`p-6 bg-card border rounded-3xl shadow-sm hover:shadow-xl hover:border-foreground/30 hover:-translate-y-1 transition-all duration-300 cursor-grab active:cursor-grabbing group flex flex-col justify-between relative overflow-hidden space-y-4 ${
					isDragging ? "opacity-40 scale-[0.98]" : "opacity-100"
				} ${isDragOver ? "border-primary ring-2 ring-primary/40" : "border-border/80"}`}
			>
				{/* Top Hover Pastel Gradient Line */}
				<div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-[#aac2ec] via-[#fae8b4] via-[#f5c6a5] to-[#b8d8be] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

				<div className="space-y-3.5">
					{/* Header Row: Ownership Badge, Share Button, Pin Toggle & Date */}
					<div className="flex items-center justify-between gap-2">
						<span className="text-[11px] text-muted-foreground font-sans font-medium">
							{note.createdAt}
						</span>

						<div className="flex items-center gap-1.5">
							{/* Sharing Badge */}
							{(() => {
								const owner = (note.ownerEmail || "").trim().toLowerCase();
								const isShared = Boolean(owner) && owner !== currentUserEmail && Boolean(note.sharedWith?.some((s) => s.email.toLowerCase() === currentUserEmail));
								const myRole = isShared ? note.sharedWith?.find((s) => s.email.toLowerCase() === currentUserEmail)?.role : null;
								const shareCount = note.sharedWith?.length || 0;

								if (isShared) {
									return (
										<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/25">
											<Users className="w-3 h-3" />
											<span className="truncate max-w-[100px]">{note.ownerEmail}</span>
											<span className="opacity-75 font-mono uppercase text-[9px]">({myRole})</span>
										</span>
									);
								}

								if (shareCount > 0) {
									return (
										<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/25">
											<Users className="w-3 h-3" />
											<span>{shareCount} shared</span>
										</span>
									);
								}

								return null;
							})()}

							{/* Quick Share Button */}
							<button
								type="button"
								onClick={(e) => {
									e.stopPropagation();
									setShareModalNote(note);
								}}
								className="p-1.5 rounded-lg border border-border/50 bg-muted/40 text-muted-foreground/60 hover:text-purple-500 hover:bg-purple-500/10 hover:border-purple-500/20 transition-all cursor-pointer"
								title="Share Note with Collaborators"
							>
								<Share2 className="w-3.5 h-3.5" />
							</button>

							<button
								type="button"
								onClick={(e) => {
									e.stopPropagation();
									togglePinNote(note.id);
									refreshNotes();
								}}
								className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
									note.isPinned
										? "bg-amber-500/10 border-amber-500/30 text-amber-500 fill-current"
										: "bg-muted/40 border-border/50 text-muted-foreground/60 hover:text-amber-500 hover:bg-muted"
								}`}
								title={note.isPinned ? "Unpin Note" : "Pin Note"}
							>
								<Pin
									className={`w-3.5 h-3.5 ${note.isPinned ? "fill-current" : ""}`}
								/>
							</button>
						</div>
					</div>

					{/* Title */}
					<h3 className="text-lg font-black tracking-tight text-foreground group-hover:text-foreground/90 transition-colors line-clamp-1 flex items-center gap-2">
						{note.icon && (
							<span className="text-2xl shrink-0">{note.icon}</span>
						)}
						<span className="truncate">{note.title}</span>
					</h3>

					{/* AI Summary Banner */}
					{note.summary && (
						<p className="text-xs text-foreground/90 leading-relaxed bg-amber-500/5 dark:bg-amber-400/5 border-l-2 border-amber-400 p-3 rounded-r-xl font-sans">
							<Sparkles className="w-3.5 h-3.5 inline-block mr-1.5 text-amber-500 -mt-0.5" />
							{note.summary}
						</p>
					)}

					{/* Preview Content */}
					<div className="bg-muted/40 p-3.5 rounded-2xl border border-border/50 font-sans text-xs text-muted-foreground/90 whitespace-pre-wrap line-clamp-3 leading-relaxed">
						{note.content || "(Empty content)"}
					</div>
				</div>

				{/* Footer Tags */}
				<div className="flex items-center justify-between gap-2 pt-3 border-t border-border/50">
					<div className="flex flex-wrap gap-1.5">
						{note.tags.map((tag) => (
							<span
								key={tag}
								className="inline-flex items-center text-[10px] font-sans font-bold text-muted-foreground bg-muted/80 px-2.5 py-0.5 rounded-full border border-border/60 hover:bg-muted transition-colors"
							>
								<Tag className="w-2.5 h-2.5 mr-1 opacity-70" />
								{tag}
							</span>
						))}
					</div>
				</div>
			</div>
		) : (
			<div
				key={note.id}
				draggable
				onDragStart={(e) => handleDragStart(e, index)}
				onDragOver={(e) => handleDragOver(e, index)}
				onDrop={(e) => handleDrop(e, index)}
				onDragEnd={handleDragEnd}
				onContextMenu={(e) => handleContextMenu(e, note)}
				onClick={(e) => {
					if (wasDraggingRef.current) return;
					router.push(`/notes/${note.id}`);
				}}
				className={`p-5 bg-card border rounded-2xl shadow-sm hover:shadow-md hover:border-foreground/30 transition-all duration-200 cursor-grab active:cursor-grabbing group flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden ${
					isDragging ? "opacity-40 scale-[0.98]" : "opacity-100"
				} ${isDragOver ? "border-primary ring-2 ring-primary/40" : "border-border/80"}`}
			>
				<div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-[#aac2ec] via-[#fae8b4] to-[#b8d8be] opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

				<div className="flex-1 space-y-2 min-w-0">
					<div className="flex flex-wrap items-center gap-2.5">
						{note.isPinned && (
							<Pin className="w-3.5 h-3.5 text-amber-500 fill-current shrink-0" />
						)}
						{note.icon && <span className="text-xl shrink-0">{note.icon}</span>}
						<h3 className="text-base font-bold tracking-tight text-foreground group-hover:underline truncate">
							{note.title}
						</h3>
						<span className="text-[11px] text-muted-foreground font-sans font-medium ml-auto md:ml-0">
							{note.createdAt}
						</span>
					</div>

					{note.summary && (
						<p className="text-xs text-foreground/80 bg-amber-500/5 border-l-2 border-amber-400 px-2.5 py-1 rounded-r-md truncate">
							<Sparkles className="w-3 h-3 inline mr-1 text-amber-500" />
							{note.summary}
						</p>
					)}

					<p className="text-xs text-muted-foreground font-sans truncate">
						{note.content || "(Empty content)"}
					</p>
				</div>

				<div className="flex items-center gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-border/60">
					{/* Sharing Badge */}
					{(() => {
						const owner = (note.ownerEmail || "").trim().toLowerCase();
						const isShared = Boolean(owner) && owner !== currentUserEmail && Boolean(note.sharedWith?.some((s) => s.email.toLowerCase() === currentUserEmail));
						const myRole = isShared ? note.sharedWith?.find((s) => s.email.toLowerCase() === currentUserEmail)?.role : null;
						const shareCount = note.sharedWith?.length || 0;

						if (isShared) {
							return (
								<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/25">
									<Users className="w-3 h-3" />
									<span className="truncate max-w-[90px]">{note.ownerEmail}</span>
									<span className="opacity-75 font-mono uppercase text-[9px]">({myRole})</span>
								</span>
							);
						}

						if (shareCount > 0) {
							return (
								<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/25">
									<Users className="w-3 h-3" />
									<span>{shareCount} shared</span>
								</span>
							);
						}

						return null;
					})()}

					{/* Quick Share Button */}
					<button
						type="button"
						onClick={(e) => {
							e.stopPropagation();
							setShareModalNote(note);
						}}
						className="p-1.5 rounded-lg border border-border/50 bg-muted/40 text-muted-foreground/60 hover:text-purple-500 hover:bg-purple-500/10 hover:border-purple-500/20 transition-all cursor-pointer"
						title="Share Note with Collaborators"
					>
						<Share2 className="w-3.5 h-3.5" />
					</button>

					<div className="flex flex-wrap gap-1.5 max-w-[200px]">
						{note.tags.map((tag) => (
							<span
								key={tag}
								className="inline-flex items-center text-[10px] font-sans font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full border border-border"
							>
								#{tag}
							</span>
						))}
					</div>
				</div>
			</div>
		);
	}
}

export default function NotesPage() {
	return (
		<Suspense
			fallback={
				<div className="min-h-screen flex flex-col bg-background text-foreground">
					<AppNavbar />
					<div className="flex-1 flex items-center justify-center p-12">
						<Loader2 className="w-8 h-8 animate-spin text-foreground" />
					</div>
				</div>
			}
		>
			<NotesContent />
		</Suspense>
	);
}
