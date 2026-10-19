"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
	getNotes,
	getNotesFromInsForge,
	togglePinNote,
	deleteNoteFromInsForge,
	reorderNotes,
	NoteItem,
} from "@/lib/notes-store";
import { useSidebar } from "@/components/sidebar-context";
import { useAuth } from "@/components/auth-provider";
import {
	FileText,
	Pin,
	ChevronDown,
	MoreHorizontal,
	Plus,
	Trash2,
	Edit3,
	GripVertical,
	Users,
	Pencil,
	Share2,
	FileCode,
	Printer,
} from "lucide-react";
import { ShareDialog } from "@/components/share-dialog";
import { NoteRenameDialog } from "@/components/note-rename-dialog";
import { exportNoteToMarkdown, exportNoteToPDF } from "@/lib/export-utils";
import { showToast } from "@/components/toast";

interface AppSidebarProps {
	/** Optional ID of the currently active note to highlight in the list */
	activeNoteId?: string;
}

export function AppSidebar({ activeNoteId }: AppSidebarProps) {
	const router = useRouter();
	const { user } = useAuth();
	const { isSidebarOpen, closeSidebar } = useSidebar();
	const [notesList, setNotesList] = useState<NoteItem[]>(() => getNotes());

	// Section collapsible state
	const [isRecentsOpen, setIsRecentsOpen] = useState(true);
	const [isPinnedOpen, setIsPinnedOpen] = useState(true);
	const [isSharedOpen, setIsSharedOpen] = useState(true);
	const [isAllNotesOpen, setIsAllNotesOpen] = useState(true);

	// Drag & Drop State
	const [draggedSection, setDraggedSection] = useState<"pinned" | "all" | null>(null);
	const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
	const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
	const wasDraggingRef = useRef<boolean>(false);

	// Right-Click Context Menu State
	const [contextMenu, setContextMenu] = useState<{
		visible: boolean;
		x: number;
		y: number;
		note: NoteItem | null;
	}>({ visible: false, x: 0, y: 0, note: null });

	// Modals State
	const [renameModalNote, setRenameModalNote] = useState<NoteItem | null>(null);
	const [shareModalNote, setShareModalNote] = useState<NoteItem | null>(null);

	// Load from InsForge DB on mount
	useEffect(() => {
		getNotesFromInsForge().then((notes) => {
			if (notes) {
				setNotesList(notes);
			}
		});
	}, []);

	// Global notes store update listener
	useEffect(() => {
		const handleRefresh = () => setNotesList(getNotes());
		window.addEventListener("refresh-notes", handleRefresh);
		return () => window.removeEventListener("refresh-notes", handleRefresh);
	}, []);

	// Dismiss context menu on click or scroll
	useEffect(() => {
		const closeMenu = () => setContextMenu((prev) => ({ ...prev, visible: false }));
		window.addEventListener("click", closeMenu);
		window.addEventListener("scroll", closeMenu, true);
		return () => {
			window.removeEventListener("click", closeMenu);
			window.removeEventListener("scroll", closeMenu, true);
		};
	}, []);

	const currentUserEmail = (user?.email || '').trim().toLowerCase();
	const sharedNotes = notesList.filter((n) => {
		const owner = (n.ownerEmail || '').trim().toLowerCase();
		const isNotOwner = owner && owner !== currentUserEmail;
		const isSharedWithUser = n.sharedWith?.some(
			(s) => s.email.trim().toLowerCase() === currentUserEmail
		);
		return isNotOwner && isSharedWithUser;
	});

	// Recents: Automatically sorted based on last edited/updated (no drag sorting)
	const recentNotes = [...notesList].sort(
		(a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
	);
	const pinnedNotes = notesList.filter((n) => n.isPinned);
	const allNotes = [...notesList];

	const handleNavigate = (e: React.MouseEvent, noteId: string) => {
		if (wasDraggingRef.current) {
			e.preventDefault();
			e.stopPropagation();
			return;
		}
		if (typeof window !== "undefined" && window.innerWidth < 1024) {
			closeSidebar();
		}
		router.push(`/notes/${noteId}`);
	};

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

	// Drag & Drop Handlers for Pinned Section
	const handlePinnedDragStart = (e: React.DragEvent, index: number) => {
		wasDraggingRef.current = true;
		setDraggedSection("pinned");
		setDraggedIndex(index);
		e.dataTransfer.effectAllowed = "move";
	};

	const handlePinnedDragOver = (e: React.DragEvent, index: number) => {
		e.preventDefault();
		if (draggedSection !== "pinned") return;
		e.dataTransfer.dropEffect = "move";
		if (dragOverIndex !== index) {
			setDragOverIndex(index);
		}
	};

	const handlePinnedDrop = (e: React.DragEvent, targetIndex: number) => {
		e.preventDefault();
		if (draggedSection !== "pinned" || draggedIndex === null || draggedIndex === targetIndex) return;

		const currentPinned = notesList.filter((n) => n.isPinned);
		const updatedPinned = [...currentPinned];
		const [movedItem] = updatedPinned.splice(draggedIndex, 1);
		updatedPinned.splice(targetIndex, 0, movedItem);

		const unpinned = notesList.filter((n) => !n.isPinned);
		const newFullList = [...updatedPinned, ...unpinned];

		setNotesList(newFullList);
		reorderNotes(newFullList);
		setDraggedSection(null);
		setDraggedIndex(null);
		setDragOverIndex(null);
	};

	// Drag & Drop Handlers for All Notes Section
	const handleAllDragStart = (e: React.DragEvent, index: number) => {
		wasDraggingRef.current = true;
		setDraggedSection("all");
		setDraggedIndex(index);
		e.dataTransfer.effectAllowed = "move";
	};

	const handleAllDragOver = (e: React.DragEvent, index: number) => {
		e.preventDefault();
		if (draggedSection !== "all") return;
		e.dataTransfer.dropEffect = "move";
		if (dragOverIndex !== index) {
			setDragOverIndex(index);
		}
	};

	const handleAllDrop = (e: React.DragEvent, targetIndex: number) => {
		e.preventDefault();
		if (draggedSection !== "all" || draggedIndex === null || draggedIndex === targetIndex) return;

		const updated = [...notesList];
		const [movedItem] = updated.splice(draggedIndex, 1);
		updated.splice(targetIndex, 0, movedItem);

		setNotesList(updated);
		reorderNotes(updated);
		setDraggedSection(null);
		setDraggedIndex(null);
		setDragOverIndex(null);
	};

	const handleDragEnd = () => {
		setDraggedSection(null);
		setDraggedIndex(null);
		setDragOverIndex(null);
		setTimeout(() => {
			wasDraggingRef.current = false;
		}, 150);
	};

	return (
		<>
			{/* Mobile Backdrop */}
			{isSidebarOpen && (
				<div
					className="fixed inset-0 bg-black/40 backdrop-blur-xs z-20 lg:hidden"
					onClick={closeSidebar}
				/>
			)}

			{/* Sidebar Panel */}
			<aside
				className={`fixed inset-y-14 lg:inset-y-0 left-0 z-30 w-72 h-[calc(100vh-3.5rem)] lg:h-full bg-card/95 backdrop-blur-md lg:bg-card/40 border-r border-border flex flex-col overflow-y-auto transition-all duration-300 ease-in-out shrink-0 p-5 space-y-6 ${isSidebarOpen
						? "translate-x-0 opacity-100 lg:w-72 lg:border-r"
						: "-translate-x-full opacity-0 pointer-events-none lg:w-0 lg:border-r-0 lg:translate-x-0 lg:opacity-0 lg:pointer-events-none"
					} lg:relative`}
			>
				<div className="space-y-5">
					{/* SECTION 1: RECENTS (Sorted automatically by last edited / updated) */}
					{recentNotes.length > 0 && (
						<div className="space-y-1.5">
							<button
								type="button"
								onClick={() => setIsRecentsOpen(!isRecentsOpen)}
								className="w-full flex items-center justify-between px-1 hover:text-foreground text-muted-foreground/80 transition-colors group cursor-pointer"
							>
								<div className="flex items-center gap-1.5">
									<ChevronDown
										className={`w-3.5 h-3.5 transition-transform duration-200 ${isRecentsOpen ? "" : "-rotate-90"
											}`}
									/>
									<span className="text-[10px] font-sans font-black uppercase tracking-wider">
										Recents
									</span>
								</div>
							</button>

							{isRecentsOpen && (
								<div className="space-y-0.5 pl-1">
									{recentNotes.slice(0, 5).map((n) => (
										<div
											key={`recent-${n.id}`}
											onClick={(e) => handleNavigate(e, n.id)}
											onContextMenu={(e) => handleContextMenu(e, n)}
											className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${n.id === activeNoteId
													? "bg-muted text-foreground font-black"
													: "text-muted-foreground hover:text-foreground hover:bg-muted/40"
												}`}
										>
											{n.icon ? (
												<span className="text-sm shrink-0">{n.icon}</span>
											) : (
												<FileText
													className={`w-3.5 h-3.5 shrink-0 ${n.id === activeNoteId
															? "text-foreground"
															: "text-muted-foreground/75"
														}`}
												/>
											)}
											<span className="truncate flex-1">{n.title}</span>
										</div>
									))}
									{recentNotes.length > 5 && (
										<Link
											href="/notes?view=recents"
											onClick={closeSidebar}
											className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-muted-foreground/70 hover:text-foreground hover:bg-muted/40 transition-all"
										>
											<MoreHorizontal className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
											<span className="truncate flex-1">More</span>
										</Link>
									)}
								</div>
							)}
						</div>
					)}

					{/* SECTION 2: PINNED (Drag and drop sortable & right-click enabled) */}
					{pinnedNotes.length > 0 && (
						<div className="space-y-1.5 pt-3 border-t border-border/40">
							<button
								type="button"
								onClick={() => setIsPinnedOpen(!isPinnedOpen)}
								className="w-full flex items-center justify-between px-1 hover:text-foreground text-muted-foreground/80 transition-colors group cursor-pointer"
							>
								<div className="flex items-center gap-1.5">
									<ChevronDown
										className={`w-3.5 h-3.5 transition-transform duration-200 ${isPinnedOpen ? "" : "-rotate-90"
											}`}
									/>
									<span className="text-[10px] font-sans font-black uppercase tracking-wider">
										Pinned
									</span>
								</div>
							</button>

							{isPinnedOpen && (
								<div className="space-y-0.5 pl-1">
									{pinnedNotes.slice(0, 5).map((n, index) => {
										const isDragging = draggedSection === "pinned" && draggedIndex === index;
										const isDragOver = draggedSection === "pinned" && dragOverIndex === index;
										return (
											<div
												key={`pinned-${n.id}`}
												draggable
												onDragStart={(e) => handlePinnedDragStart(e, index)}
												onDragOver={(e) => handlePinnedDragOver(e, index)}
												onDrop={(e) => handlePinnedDrop(e, index)}
												onDragEnd={handleDragEnd}
												onClick={(e) => handleNavigate(e, n.id)}
												onContextMenu={(e) => handleContextMenu(e, n)}
												className={`group relative flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-semibold cursor-grab active:cursor-grabbing transition-all duration-200 select-none ${n.id === activeNoteId
														? "bg-muted text-foreground font-black"
														: "text-muted-foreground hover:text-foreground hover:bg-muted/40"
													} ${isDragging
														? "opacity-40 scale-95 border border-amber-500/40 shadow-md"
														: "opacity-100"
													} ${isDragOver
														? "border-t-2 border-amber-500 bg-amber-500/10"
														: ""
													}`}
											>
												<GripVertical className="w-3 h-3 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
												{n.icon ? (
													<span className="text-sm shrink-0">{n.icon}</span>
												) : (
													<FileText
														className={`w-3.5 h-3.5 shrink-0 ${n.id === activeNoteId
																? "text-foreground"
																: "text-muted-foreground/75"
															}`}
													/>
												)}
												<span className="truncate flex-1">{n.title}</span>
												<Pin className="w-2.5 h-2.5 text-amber-500 fill-current shrink-0" />
											</div>
										);
									})}
									{pinnedNotes.length > 5 && (
										<Link
											href="/notes?view=pinned"
											onClick={closeSidebar}
											className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-muted-foreground/70 hover:text-foreground hover:bg-muted/40 transition-all"
										>
											<MoreHorizontal className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
											<span className="truncate flex-1">More</span>
										</Link>
									)}
								</div>
							)}
						</div>
					)}

					{/* SECTION 2.5: SHARED WITH ME */}
					{sharedNotes.length > 0 && (
						<div className="space-y-1.5 pt-3 border-t border-border/40">
							<button
								type="button"
								onClick={() => setIsSharedOpen(!isSharedOpen)}
								className="w-full flex items-center justify-between px-1 hover:text-foreground text-muted-foreground/80 transition-colors group cursor-pointer"
							>
								<div className="flex items-center gap-1.5">
									<ChevronDown
										className={`w-3.5 h-3.5 transition-transform duration-200 ${isSharedOpen ? "" : "-rotate-90"
											}`}
									/>
									<span className="text-[10px] font-sans font-black uppercase tracking-wider flex items-center gap-1.5">
										<Users className="w-3 h-3 text-purple-500" />
										Shared with Me
									</span>
								</div>
								<span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400">
									{sharedNotes.length}
								</span>
							</button>

							{isSharedOpen && (
								<div className="space-y-0.5 pl-1">
									{sharedNotes.map((n) => (
										<div
											key={`shared-${n.id}`}
											onClick={(e) => handleNavigate(e, n.id)}
											onContextMenu={(e) => handleContextMenu(e, n)}
											className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${n.id === activeNoteId
													? "bg-purple-500/15 text-purple-700 dark:text-purple-300 font-black"
													: "text-muted-foreground hover:text-foreground hover:bg-muted/40"
												}`}
										>
											{n.icon ? (
												<span className="text-sm shrink-0">{n.icon}</span>
											) : (
												<FileText className="w-3.5 h-3.5 shrink-0 text-purple-500" />
											)}
											<span className="truncate flex-1">{n.title}</span>
											<span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono">
												{n.sharedWith?.find((s) => s.email.toLowerCase() === currentUserEmail)?.role || 'shared'}
											</span>
										</div>
									))}
								</div>
							)}
						</div>
					)}

					{/* SECTION 3: ALL NOTES (Drag and drop sortable & right-click enabled) */}
					<div className="space-y-1.5 pt-3 border-t border-border/40">
						<button
							type="button"
							onClick={() => setIsAllNotesOpen(!isAllNotesOpen)}
							className="w-full flex items-center justify-between px-1 hover:text-foreground text-muted-foreground/80 transition-colors group cursor-pointer"
						>
							<div className="flex items-center gap-1.5">
								<ChevronDown
									className={`w-3.5 h-3.5 transition-transform duration-200 ${isAllNotesOpen ? "" : "-rotate-90"
										}`}
								/>
								<span className="text-[10px] font-sans font-black uppercase tracking-wider">
									All Notes
								</span>
							</div>
						</button>

						{isAllNotesOpen && (
							<div className="space-y-0.5 pl-1">
								{allNotes.length === 0 ? (
									<div className="space-y-2 px-1 py-2">
										<p className="text-[11px] text-muted-foreground/60 italic pl-1">
											No notes in workspace
										</p>
										<Link
											href="/notes?action=new"
											onClick={closeSidebar}
											className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-card hover:bg-muted border border-border rounded-xl text-xs font-bold text-foreground transition-colors shadow-2xs"
										>
											<Plus className="w-3.5 h-3.5 text-amber-500" />
											<span>Add Note</span>
										</Link>
									</div>
								) : (
									<>
										{allNotes.slice(0, 5).map((n, index) => {
											const isDragging = draggedSection === "all" && draggedIndex === index;
											const isDragOver = draggedSection === "all" && dragOverIndex === index;
											return (
												<div
													key={`all-${n.id}`}
													draggable
													onDragStart={(e) => handleAllDragStart(e, index)}
													onDragOver={(e) => handleAllDragOver(e, index)}
													onDrop={(e) => handleAllDrop(e, index)}
													onDragEnd={handleDragEnd}
													onClick={(e) => handleNavigate(e, n.id)}
													onContextMenu={(e) => handleContextMenu(e, n)}
													className={`group relative flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-semibold cursor-grab active:cursor-grabbing transition-all duration-200 select-none ${n.id === activeNoteId
															? "bg-muted text-foreground font-black"
															: "text-muted-foreground hover:text-foreground hover:bg-muted/40"
														} ${isDragging
															? "opacity-40 scale-95 border border-amber-500/40 shadow-md"
															: "opacity-100"
														} ${isDragOver
															? "border-t-2 border-amber-500 bg-amber-500/10"
															: ""
														}`}
												>
													<GripVertical className="w-3 h-3 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
													{n.icon ? (
														<span className="text-sm shrink-0">{n.icon}</span>
													) : (
														<FileText
															className={`w-3.5 h-3.5 shrink-0 ${n.id === activeNoteId
																	? "text-foreground"
																	: "text-muted-foreground/75"
																}`}
														/>
													)}
													<span className="truncate flex-1">{n.title}</span>
													{n.isPinned && (
														<Pin className="w-2.5 h-2.5 text-amber-500 fill-current shrink-0" />
													)}
												</div>
											);
										})}
										{allNotes.length > 5 && (
											<Link
												href="/notes"
												onClick={closeSidebar}
												className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-muted-foreground/70 hover:text-foreground hover:bg-muted/40 transition-all"
											>
												<MoreHorizontal className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
												<span className="truncate flex-1">More</span>
											</Link>
										)}
									</>
								)}
							</div>
						)}
					</div>
				</div>
			</aside>

			{/* RIGHT-CLICK CONTEXT MENU POPOVER */}
			{contextMenu.visible && contextMenu.note && (
				<div
					style={{ top: contextMenu.y, left: contextMenu.x }}
					className="fixed z-[9999] min-w-[170px] bg-card border border-border rounded-2xl shadow-2xl p-1.5 space-y-0.5 animate-in fade-in zoom-in-95 duration-150 font-sans text-xs uppercase tracking-wider font-bold"
					onClick={(e) => e.stopPropagation()}
				>
					<button
						type="button"
						onClick={() => {
							const noteId = contextMenu.note?.id;
							setContextMenu({ visible: false, x: 0, y: 0, note: null });
							if (noteId) togglePinNote(noteId);
						}}
						className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-foreground hover:bg-muted transition-colors text-left font-bold cursor-pointer"
					>
						<Pin className="w-4 h-4 text-amber-500" />
						<span>{contextMenu.note.isPinned ? "UNPIN NOTE" : "PIN NOTE"}</span>
					</button>

					<button
						type="button"
						onClick={() => {
							const noteId = contextMenu.note?.id;
							setContextMenu({ visible: false, x: 0, y: 0, note: null });
							if (noteId) router.push(`/notes/${noteId}`);
						}}
						className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-foreground hover:bg-muted transition-colors text-left font-bold cursor-pointer"
					>
						<Edit3 className="w-4 h-4 text-muted-foreground" />
						<span>EDIT NOTE</span>
					</button>

					<button
						type="button"
						onClick={() => {
							const target = contextMenu.note;
							setContextMenu({ visible: false, x: 0, y: 0, note: null });
							if (target) setRenameModalNote(target);
						}}
						className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 transition-colors text-left font-bold cursor-pointer"
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
						className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-purple-600 dark:text-purple-400 hover:bg-purple-500/10 transition-colors text-left font-bold cursor-pointer"
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
						className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 transition-colors text-left font-bold cursor-pointer"
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
						className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 transition-colors text-left font-bold cursor-pointer"
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
								showToast("Deleted note");
							}
						}}
						className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-destructive hover:bg-destructive/10 transition-colors text-left font-bold cursor-pointer"
					>
						<Trash2 className="w-4 h-4 text-destructive" />
						<span>DELETE NOTE</span>
					</button>
				</div>
			)}

			{/* Share Dialog */}
			{shareModalNote && (
				<ShareDialog
					note={shareModalNote}
					isOpen={Boolean(shareModalNote)}
					onClose={() => setShareModalNote(null)}
					onUpdate={() => setNotesList(getNotes())}
				/>
			)}

			{/* Rename Dialog */}
			<NoteRenameDialog
				isOpen={Boolean(renameModalNote)}
				note={renameModalNote}
				onClose={() => setRenameModalNote(null)}
				onRenamed={() => setNotesList(getNotes())}
			/>
		</>
	);
}
