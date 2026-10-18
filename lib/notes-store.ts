import { insforge } from "./insforge";

export interface NoteShare {
	email: string;
	role: 'viewer' | 'editor';
	sharedAt: string;
}

export interface NoteAttachment {
	id: string;
	name: string;
	url: string;
	size: number;
	type: string;
	uploadedAt: string;
}

export interface NoteItem {
	id: string;
	title: string;
	tags: string[];
	content: string;
	summary?: string;
	icon?: string;
	images?: string[];
	attachments?: NoteAttachment[];
	isPinned?: boolean;
	ownerId?: string;
	ownerEmail?: string;
	sharedWith?: NoteShare[];
	createdAt: string;
	updatedAt: string;
}

// Custom Order Persistence Helpers
const LOCAL_STORAGE_ORDER_KEY = "codiary_notes_order_v1";

function loadOrderFromLocalStorage(): string[] {
	if (typeof window === "undefined") return [];
	try {
		const stored = localStorage.getItem(LOCAL_STORAGE_ORDER_KEY);
		if (stored) {
			const parsed = JSON.parse(stored);
			if (Array.isArray(parsed)) return parsed;
		}
	} catch (e) {}
	return [];
}

function saveOrderToLocalStorage(orderIds: string[]): void {
	if (typeof window === "undefined") return;
	try {
		localStorage.setItem(LOCAL_STORAGE_ORDER_KEY, JSON.stringify(orderIds));
	} catch (e) {}
}

function applyCustomOrder(notes: NoteItem[]): NoteItem[] {
	const savedOrder = loadOrderFromLocalStorage();
	if (!savedOrder || savedOrder.length === 0) return notes;

	const noteMap = new Map(notes.map((n) => [n.id, n]));
	const ordered: NoteItem[] = [];

	savedOrder.forEach((id) => {
		const note = noteMap.get(id);
		if (note) {
			ordered.push(note);
			noteMap.delete(id);
		}
	});

	noteMap.forEach((note) => ordered.push(note));
	return ordered;
}

// LocalStorage Notes Vault Persistence Helpers
const LOCAL_STORAGE_NOTES_KEY = "codiary_notes_vault_v1";

function loadNotesFromLocalStorage(): NoteItem[] {
	if (typeof window === "undefined") return [];
	try {
		const stored = localStorage.getItem(LOCAL_STORAGE_NOTES_KEY);
		if (stored) {
			const parsed = JSON.parse(stored);
			if (Array.isArray(parsed) && parsed.length > 0) return parsed;
		}
	} catch (e) {
		console.warn("Error loading notes from localStorage:", e);
	}
	return [];
}

function saveNotesToLocalStorage(notes: NoteItem[]): void {
	if (typeof window === "undefined") return;
	try {
		localStorage.setItem(LOCAL_STORAGE_NOTES_KEY, JSON.stringify(notes));
	} catch (e) {
		console.warn("Error saving notes to localStorage:", e);
	}
}

// Helper to ensure InsForge SDK client has the active JWT access token attached
export function ensureClientToken(): void {
	if (typeof window !== "undefined") {
		try {
			const storedToken = localStorage.getItem("codiary_auth_token");
			if (storedToken) {
				insforge.setAccessToken(storedToken);
			}
		} catch (e) {}
	}
}

// In-memory cache for fast local UI interactions during active session
let inMemoryNotes: NoteItem[] = [];

export function generateUUID(): string {
	if (
		typeof crypto !== "undefined" &&
		typeof crypto.randomUUID === "function"
	) {
		return crypto.randomUUID();
	}
	return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
		const r = (Math.random() * 16) | 0;
		const v = c === "x" ? r : (r & 0x3) | 0x8;
		return v.toString(16);
	});
}

export function isValidUUID(str: string | undefined | null): boolean {
	if (!str) return false;
	return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
		str,
	);
}

/**
 * Helper to extract icon and clean summary from DB summary string.
 */
function parseSummaryAndIcon(rawSummary?: string): {
	summary?: string;
	icon?: string;
} {
	let cleanSummary = rawSummary || "";
	let icon: string | undefined = undefined;

	if (cleanSummary && cleanSummary.includes("[icon:")) {
		const iconMatch = cleanSummary.match(/\[icon:\s*([^\]]+)\]/);
		if (iconMatch && iconMatch[1]) {
			icon = iconMatch[1].trim();
			cleanSummary = cleanSummary.replace(/\[icon:\s*[^\]]+\]/, "").trim();
		}
	}

	// Legacy cleanup for old [tags: ...] string if present in DB summary
	if (cleanSummary && cleanSummary.includes("[tags:")) {
		cleanSummary = cleanSummary.replace(/\[tags:\s*[^\]]+\\]/, "").trim();
	}

	return { summary: cleanSummary || undefined, icon };
}

/**
 * Helper to encode icon into DB summary string (keeping summary clean for text).
 */
function formatSummaryWithIcon(
	summary?: string,
	icon?: string,
): string | undefined {
	let result = summary || "";
	if (icon) {
		result = `[icon: ${icon}] ${result}`.trim();
	}
	return result || undefined;
}

/**
 * Fetch all unique tag names created across the user's workspace.
 */
export async function getAllUserTagsFromInsForge(): Promise<string[]> {
	try {
		const { data, error } = await insforge.database.from("tags").select("name");
		if (!error && Array.isArray(data)) {
			const uniqueNames = Array.from(
				new Set(
					data.map((t: any) => t.name?.trim().toLowerCase()).filter(Boolean),
				),
			).sort();
			if (uniqueNames.length > 0) return uniqueNames;
		}
	} catch (err) {
		console.warn("InsForge getAllUserTags error:", err);
	}
	// Fallback to tags present in memory notes
	const set = new Set<string>();
	inMemoryNotes.forEach((n) => n.tags.forEach((t) => set.add(t)));
	return Array.from(set).sort();
}

/**
 * Fetch tags mapping for all notes from note_tags & tags tables.
 */
export async function fetchNoteTagsMapFromInsForge(): Promise<
	Map<string, string[]>
> {
	const map = new Map<string, string[]>();
	try {
		const [tagsRes, noteTagsRes] = await Promise.all([
			insforge.database.from("tags").select("id, name"),
			insforge.database.from("note_tags").select("note_id, tag_id"),
		]);

		if (Array.isArray(tagsRes.data) && Array.isArray(noteTagsRes.data)) {
			const tagIdToNameMap = new Map<string, string>();
			tagsRes.data.forEach((t: any) => {
				if (t.id && t.name) {
					tagIdToNameMap.set(t.id, t.name);
				}
			});

			noteTagsRes.data.forEach((nt: any) => {
				const tagName = tagIdToNameMap.get(nt.tag_id);
				if (tagName) {
					const existing = map.get(nt.note_id) || [];
					if (!existing.includes(tagName)) {
						existing.push(tagName);
					}
					map.set(nt.note_id, existing);
				}
			});
		}
	} catch (err) {
		console.warn("InsForge fetchNoteTagsMap warning:", err);
	}
	return map;
}

/**
 * Helper to sync tags for a note into public.tags and public.note_tags tables.
 */
export async function syncNoteTagsInInsForge(
	noteId: string,
	tagNames: string[],
	userId?: string,
): Promise<string[]> {
	if (!isValidUUID(noteId)) return tagNames;

	const sanitizedTags = Array.from(
		new Set(tagNames.map((t) => t.trim().toLowerCase()).filter(Boolean)),
	);
	const finalTags = sanitizedTags.length > 0 ? sanitizedTags : ["general"];

	let activeUserId = userId;
	if (!activeUserId || !isValidUUID(activeUserId)) {
		try {
			const { data: userData } = await insforge.auth.getCurrentUser();
			if (userData?.user?.id && isValidUUID(userData.user.id)) {
				activeUserId = userData.user.id;
			}
		} catch {}
	}

	try {
		// 1. Fetch existing tags for current user
		const { data: existingTagsData } = await insforge.database
			.from("tags")
			.select("id, name");

		const tagMap = new Map<string, string>();
		if (Array.isArray(existingTagsData)) {
			existingTagsData.forEach((t: any) => {
				if (t.name && t.id) {
					tagMap.set(t.name.toLowerCase(), t.id);
				}
			});
		}

		// 2. Ensure each tag exists in public.tags
		const tagIds: string[] = [];
		for (const tagName of finalTags) {
			if (tagMap.has(tagName)) {
				tagIds.push(tagMap.get(tagName)!);
			} else {
				const tagPayload: any = { name: tagName };
				if (isValidUUID(activeUserId)) {
					tagPayload.user_id = activeUserId;
				}
				const { data: newTagData, error } = await insforge.database
					.from("tags")
					.insert([tagPayload])
					.select("id");

				if (!error && Array.isArray(newTagData) && newTagData[0]?.id) {
					const newId = newTagData[0].id;
					tagMap.set(tagName, newId);
					tagIds.push(newId);
				} else {
					delete tagPayload.user_id;
					const { data: fallbackData } = await insforge.database
						.from("tags")
						.insert([tagPayload])
						.select("id");
					if (Array.isArray(fallbackData) && fallbackData[0]?.id) {
						const newId = fallbackData[0].id;
						tagMap.set(tagName, newId);
						tagIds.push(newId);
					}
				}
			}
		}

		// 3. Clear existing note_tags for this note_id
		await insforge.database.from("note_tags").delete().eq("note_id", noteId);

		// 4. Insert new note_tags relationships
		if (tagIds.length > 0) {
			const noteTagPayloads = tagIds.map((tag_id) => ({
				note_id: noteId,
				tag_id,
			}));
			await insforge.database.from("note_tags").insert(noteTagPayloads);
		}

		return finalTags;
	} catch (err) {
		console.warn("InsForge note_tags sync warning:", err);
		return finalTags;
	}
}

function notifyRefreshNotes(): void {
	if (typeof window !== "undefined") {
		window.dispatchEvent(new CustomEvent("refresh-notes"));
	}
}

/**
 * Fetch all note shares mapping from public.note_shares table.
 */
export async function fetchNoteSharesMapFromInsForge(): Promise<
	Map<string, NoteShare[]>
> {
	const map = new Map<string, NoteShare[]>();
	try {
		const { data, error } = await insforge.database
			.from("note_shares")
			.select("note_id, shared_with_email, role, shared_at");
		if (!error && Array.isArray(data)) {
			data.forEach((row: any) => {
				const existing = map.get(row.note_id) || [];
				existing.push({
					email: row.shared_with_email,
					role: (row.role as 'viewer' | 'editor') || 'viewer',
					sharedAt: row.shared_at,
				});
				map.set(row.note_id, existing);
			});
		}
	} catch (err) {
		console.warn("InsForge fetchNoteSharesMap error:", err);
	}
	return map;
}

/**
 * Fetch all notes for current authenticated user directly from InsForge PostgreSQL.
 */
export async function getNotesFromInsForge(): Promise<NoteItem[]> {
	ensureClientToken();
	try {
		const [notesRes, noteTagsMap, noteSharesMap] = await Promise.all([
			insforge.database.from("notes").select("*"),
			fetchNoteTagsMapFromInsForge(),
			fetchNoteSharesMapFromInsForge(),
		]);

		if (notesRes.error) {
			console.warn("InsForge fetch notes warning:", notesRes.error);
		}

		if (!notesRes.error && Array.isArray(notesRes.data)) {
			const mapped: NoteItem[] = notesRes.data.map((row: any) => {
				const { summary, icon } = parseSummaryAndIcon(row.summary);
				const relationalTags = noteTagsMap.get(row.id);
				const tags =
					relationalTags && relationalTags.length > 0
						? relationalTags
						: ["general"];

				return {
					id: row.id,
					title: row.title || "Untitled Note",
					tags,
					content: row.content || "",
					summary,
					icon,
					isPinned: Boolean(row.is_pinned),
					ownerId: row.user_id || undefined,
					ownerEmail: row.owner_email || undefined,
					sharedWith: noteSharesMap.get(row.id) || [],
					attachments: Array.isArray(row.attachments) ? row.attachments : [],
					createdAt: row.created_at
						? new Date(row.created_at)
								.toISOString()
								.replace("T", " ")
								.substring(0, 16)
						: new Date().toISOString().substring(0, 16),
					updatedAt: row.updated_at
						? new Date(row.updated_at)
								.toISOString()
								.replace("T", " ")
								.substring(0, 16)
						: new Date().toISOString().substring(0, 16),
				};
			});

			// Preserve any pending notes or local notes not yet returned by the server
			const serverIds = new Set(mapped.map((n) => n.id));
			const pendingNotes: NoteItem[] = [];
			for (const [id, pending] of pendingCreatedNotes.entries()) {
				if (!serverIds.has(id)) {
					pendingNotes.push(pending);
				}
			}
			for (const localNote of inMemoryNotes) {
				if (!serverIds.has(localNote.id) && !pendingNotes.some((p) => p.id === localNote.id)) {
					pendingNotes.push(localNote);
				}
			}

			const merged = [...pendingNotes, ...mapped];
			const ordered = applyCustomOrder(merged);
			inMemoryNotes = ordered;
			saveNotesToLocalStorage(inMemoryNotes);
			notifyRefreshNotes();
			return ordered;
		}
	} catch (err) {
		console.error("Error fetching notes from InsForge DB:", err);
	}
	return inMemoryNotes;
}

// Map to temporarily hold newly created notes until the editor page mounts
const pendingCreatedNotes = new Map<string, NoteItem>();

/**
 * Fetch single note by ID from InsForge DB.
 */
export async function getNoteByIdFromInsForge(
	id: string,
): Promise<NoteItem | null> {
	let cached =
		inMemoryNotes.find((n) => n.id === id) ||
		pendingCreatedNotes.get(id) ||
		null;

	if (isValidUUID(id)) {
		try {
			const [noteRes, noteTagsMap, noteSharesMap] = await Promise.all([
				insforge.database.from("notes").select("*").eq("id", id),
				fetchNoteTagsMapFromInsForge(),
				fetchNoteSharesMapFromInsForge(),
			]);

			if (
				!noteRes.error &&
				Array.isArray(noteRes.data) &&
				noteRes.data.length > 0
			) {
				const data = noteRes.data[0];
				const { summary, icon } = parseSummaryAndIcon(data.summary);
				const relationalTags = noteTagsMap.get(data.id);
				const tags =
					relationalTags && relationalTags.length > 0
						? relationalTags
						: cached?.tags || ["general"];

				const item: NoteItem = {
					id: data.id,
					title: data.title || "Untitled Note",
					tags,
					content: data.content || "",
					summary,
					icon,
					isPinned: Boolean(data.is_pinned),
					ownerId: data.user_id || cached?.ownerId,
					ownerEmail: data.owner_email || cached?.ownerEmail,
					sharedWith: noteSharesMap.get(data.id) || cached?.sharedWith || [],
					attachments: Array.isArray(data.attachments)
						? data.attachments
						: (cached?.attachments || []),
					createdAt: data.created_at
						? new Date(data.created_at)
								.toISOString()
								.replace("T", " ")
								.substring(0, 16)
						: new Date().toISOString().substring(0, 16),
					updatedAt: data.updated_at
						? new Date(data.updated_at)
								.toISOString()
								.replace("T", " ")
								.substring(0, 16)
						: new Date().toISOString().substring(0, 16),
				};

				const idx = inMemoryNotes.findIndex((n) => n.id === id);
				if (idx !== -1) inMemoryNotes[idx] = item;
				else inMemoryNotes.unshift(item);

				pendingCreatedNotes.delete(id);
				return item;
			}
		} catch (err) {
			console.error("Error fetching note by ID from InsForge DB:", err);
		}
	}

	if (cached) {
		const idx = inMemoryNotes.findIndex((n) => n.id === id);
		if (idx === -1) inMemoryNotes.unshift(cached);
		return cached;
	}

	return null;
}

/**
 * Create a new note directly in InsForge DB with relational tags.
 */
export async function createNoteInInsForge(
	data: {
		id?: string;
		title: string;
		tags?: string[];
		content?: string;
		icon?: string;
	},
	userId?: string,
	userEmail?: string,
): Promise<NoteItem> {
	const now = new Date().toISOString();
	const noteId = data.id && isValidUUID(data.id) ? data.id : generateUUID();
	const title = data.title?.trim() ? data.title : "Untitled Note";
	const tags = data.tags && data.tags.length > 0 ? data.tags : ["general"];
	const content = data.content || "";
	const icon = data.icon;
	const baseSummary = content ? content.substring(0, 120) + "..." : undefined;
	const dbSummary = formatSummaryWithIcon(baseSummary, icon);

	// Synchronously initialize note and cache it immediately on Frame 0
	// so the editor page /notes/[id] renders with zero flicker or "Note Not Found" flash!
	const newNote: NoteItem = {
		id: noteId,
		title,
		tags,
		content,
		summary: baseSummary,
		icon,
		isPinned: false,
		ownerId: userId,
		ownerEmail: userEmail,
		sharedWith: [],
		attachments: [],
		createdAt: now.replace("T", " ").substring(0, 16),
		updatedAt: now.replace("T", " ").substring(0, 16),
	};

	pendingCreatedNotes.set(noteId, newNote);
	if (!inMemoryNotes.some((n) => n.id === noteId)) {
		inMemoryNotes.unshift(newNote);
	}
	notifyRefreshNotes();

	let activeUserId = userId;
	let activeUserEmail = userEmail;
	if (!activeUserId || !activeUserEmail) {
		ensureClientToken();
		try {
			if (typeof window !== "undefined") {
				const stored = localStorage.getItem("codiary_session_user_v1");
				if (stored) {
					const parsed = JSON.parse(stored);
					if (!activeUserId && parsed?.id && isValidUUID(parsed.id)) {
						activeUserId = parsed.id;
						newNote.ownerId = activeUserId;
					}
					if (!activeUserEmail && parsed?.email) {
						activeUserEmail = parsed.email;
						newNote.ownerEmail = activeUserEmail;
					}
				}
			}
			const { data: userData } = await insforge.auth.getCurrentUser();
			if (!activeUserId && userData?.user?.id && isValidUUID(userData.user.id)) {
				activeUserId = userData.user.id;
				newNote.ownerId = activeUserId;
			}
			if (!activeUserEmail && userData?.user?.email) {
				activeUserEmail = userData.user.email;
				newNote.ownerEmail = activeUserEmail;
			}
		} catch {}
	}

	const dbPayload: any = {
		id: noteId,
		title,
		content,
		summary: dbSummary,
		is_pinned: false,
	};

	if (isValidUUID(activeUserId)) {
		dbPayload.user_id = activeUserId;
	}
	if (activeUserEmail) {
		dbPayload.owner_email = activeUserEmail;
	}

	try {
		const { error } = await insforge.database.from("notes").upsert([dbPayload]);
		if (error) {
			console.warn("InsForge note DB upsert error:", error);
		}
		// Sync tags into public.tags and public.note_tags tables
		const syncedTags = await syncNoteTagsInInsForge(noteId, tags, activeUserId);
		newNote.tags = syncedTags;
		saveNotesToLocalStorage(inMemoryNotes);
		notifyRefreshNotes();
	} catch (err) {
		console.warn("InsForge note DB insert warning:", err);
	}

	return newNote;
}

/**
 * Update an existing note directly in InsForge DB with relational tags.
 */
export async function updateNoteInInsForge(
	id: string,
	updates: Partial<NoteItem>,
): Promise<NoteItem | undefined> {
	const index = inMemoryNotes.findIndex((n) => n.id === id);
	const now = new Date().toISOString();

	const currentItem = index !== -1 ? inMemoryNotes[index] : null;

	const sanitizedUpdates = { ...updates };
	if (sanitizedUpdates.title !== undefined) {
		sanitizedUpdates.title = sanitizedUpdates.title.trim()
			? sanitizedUpdates.title
			: "Untitled Note";
	}

	const updatedNote: NoteItem = {
		id,
		title: sanitizedUpdates.title ?? currentItem?.title ?? "Untitled Note",
		tags: sanitizedUpdates.tags ?? currentItem?.tags ?? ["general"],
		content: sanitizedUpdates.content ?? currentItem?.content ?? "",
		summary: sanitizedUpdates.summary ?? currentItem?.summary,
		icon:
			sanitizedUpdates.icon !== undefined
				? sanitizedUpdates.icon
				: currentItem?.icon,
		isPinned: sanitizedUpdates.isPinned ?? currentItem?.isPinned ?? false,
		attachments:
			sanitizedUpdates.attachments !== undefined
				? sanitizedUpdates.attachments
				: (currentItem?.attachments || []),
		createdAt: currentItem?.createdAt || now.replace("T", " ").substring(0, 16),
		updatedAt: now.replace("T", " ").substring(0, 16),
	};

	if (index !== -1) {
		inMemoryNotes[index] = updatedNote;
	} else {
		inMemoryNotes.unshift(updatedNote);
	}
	notifyRefreshNotes();
	ensureClientToken();

	let activeUserId: string | undefined;
	try {
		const { data: userData } = await insforge.auth.getCurrentUser();
		if (userData?.user?.id && isValidUUID(userData.user.id)) {
			activeUserId = userData.user.id;
		}
	} catch {}

	const dbSummary = formatSummaryWithIcon(
		updatedNote.summary,
		updatedNote.icon,
	);

	const dbPayload: any = {
		title: updatedNote.title,
		content: updatedNote.content,
		summary: dbSummary,
		is_pinned: Boolean(updatedNote.isPinned),
	};

	if (sanitizedUpdates.attachments !== undefined) {
		dbPayload.attachments = sanitizedUpdates.attachments;
	}

	if (isValidUUID(id)) {
		try {
			const { error } = await insforge.database
				.from("notes")
				.update(dbPayload)
				.eq("id", id);
			if (error) {
				console.warn("InsForge note DB update error, attempting upsert:", error);
				await insforge.database.from("notes").upsert([{
					id,
					...dbPayload,
					...(isValidUUID(activeUserId) ? { user_id: activeUserId } : {}),
					...(updatedNote.ownerEmail ? { owner_email: updatedNote.ownerEmail } : {}),
				}]);
			}
			// Sync tags into public.tags and public.note_tags tables if tags were updated
			if (sanitizedUpdates.tags !== undefined) {
				const syncedTags = await syncNoteTagsInInsForge(
					id,
					updatedNote.tags,
					activeUserId,
				);
				updatedNote.tags = syncedTags;
			}
			saveNotesToLocalStorage(inMemoryNotes);
			notifyRefreshNotes();
		} catch (err) {
			console.warn("InsForge update note error:", err);
		}
	}

	return updatedNote;
}

/**
 * Delete a note directly from InsForge DB.
 */
export async function deleteNoteFromInsForge(id: string): Promise<boolean> {
	inMemoryNotes = inMemoryNotes.filter((n) => n.id !== id);
	notifyRefreshNotes();

	if (isValidUUID(id)) {
		try {
			const { error } = await insforge.database
				.from("notes")
				.delete()
				.eq("id", id);
			return !error;
		} catch (err) {
			console.warn("InsForge delete note error:", err);
			return false;
		}
	}
	return true;
}

/**
 * Reset memory store on user logout or session switch.
 */
export function resetNotesStore(): void {
	inMemoryNotes = [];
	if (typeof window !== "undefined") {
		localStorage.removeItem(LOCAL_STORAGE_NOTES_KEY);
		localStorage.removeItem(LOCAL_STORAGE_ORDER_KEY);
	}
}

// Backward Compatibility Wrappers (delegates to DB operations)
export async function syncNotesFromInsForge(): Promise<NoteItem[]> {
	return getNotesFromInsForge();
}

export function getNotes(): NoteItem[] {
	return [...inMemoryNotes];
}

export function getNoteById(id: string): NoteItem | undefined {
	return inMemoryNotes.find((n) => n.id === id) || pendingCreatedNotes.get(id);
}

export function createNote(data: {
	title: string;
	tags?: string[];
	content?: string;
	icon?: string;
	ownerId?: string;
	ownerEmail?: string;
}): NoteItem {
	const noteId = generateUUID();
	const now = new Date().toISOString().replace("T", " ").substring(0, 16);
	const newNote: NoteItem = {
		id: noteId,
		title: data.title?.trim() ? data.title : "Untitled Note",
		tags: data.tags || ["general"],
		content: data.content || "",
		summary: data.content ? data.content.substring(0, 120) + "..." : undefined,
		icon: data.icon,
		images: [],
		isPinned: false,
		ownerId: data.ownerId,
		ownerEmail: data.ownerEmail,
		sharedWith: [],
		createdAt: now,
		updatedAt: now,
	};
	inMemoryNotes.unshift(newNote);
	createNoteInInsForge(data);
	return newNote;
}

export function updateNote(
	id: string,
	updates: Partial<NoteItem>,
): NoteItem | undefined {
	const index = inMemoryNotes.findIndex((n) => n.id === id);
	if (index === -1) return undefined;

	const now = new Date().toISOString().replace("T", " ").substring(0, 16);
	const updated = {
		...inMemoryNotes[index],
		...updates,
		updatedAt: now,
	};
	inMemoryNotes[index] = updated;
	updateNoteInInsForge(id, updates);
	return updated;
}

export function deleteNote(id: string): boolean {
	const initialLength = inMemoryNotes.length;
	inMemoryNotes = inMemoryNotes.filter((n) => n.id !== id);
	deleteNoteFromInsForge(id);
	return inMemoryNotes.length < initialLength;
}

export function togglePinNote(id: string): NoteItem | undefined {
	const note = inMemoryNotes.find((n) => n.id === id);
	if (!note) return undefined;
	return updateNote(id, { isPinned: !note.isPinned });
}

export function reorderNotes(newOrderedList: NoteItem[]): NoteItem[] {
	inMemoryNotes = [...newOrderedList];
	saveOrderToLocalStorage(newOrderedList.map((n) => n.id));
	notifyRefreshNotes();
	return [...inMemoryNotes];
}

export function autoOrganizeNote(
	id: string,
	aiData?: { title?: string; summary?: string; tags?: string[] },
): NoteItem | undefined {
	const note = inMemoryNotes.find((n) => n.id === id);
	if (!note) return undefined;

	const refinedTitle =
		aiData?.title ||
		(note.title.startsWith("[AI Refined]")
			? note.title
			: `[AI Refined] ${note.title}`);
	const generatedSummary =
		aiData?.summary ||
		note.summary ||
		(note.content
			? note.content.substring(0, 150) + "..."
			: "AI auto-generated concise technical summary of this note context.");
	const mergedTags =
		aiData?.tags || Array.from(new Set([...note.tags, "ai-organized"]));

	return updateNote(id, {
		title: refinedTitle,
		summary: generatedSummary,
		tags: mergedTags,
	});
}

/**
 * Grant access to another user for a specific note.
 */
export async function shareNoteInInsForge(
	noteId: string,
	email: string,
	role: 'viewer' | 'editor' = 'viewer',
): Promise<NoteShare[]> {
	const sanitizedEmail = email.trim().toLowerCase();
	if (!sanitizedEmail) return [];

	const shareItem: NoteShare = {
		email: sanitizedEmail,
		role,
		sharedAt: new Date().toISOString().replace("T", " ").substring(0, 16),
	};

	// 1. Update in-memory cache
	const note = inMemoryNotes.find((n) => n.id === noteId);
	if (note) {
		const existing = note.sharedWith || [];
		const filtered = existing.filter((s) => s.email.toLowerCase() !== sanitizedEmail);
		filtered.push(shareItem);
		note.sharedWith = filtered;
		saveNotesToLocalStorage(inMemoryNotes);
		notifyRefreshNotes();
	}

	// 2. Persist to InsForge DB if valid UUID
	if (isValidUUID(noteId)) {
		try {
			let currentUserId: string | undefined;
			try {
				const { data: userData } = await insforge.auth.getCurrentUser();
				if (userData?.user?.id) currentUserId = userData.user.id;
			} catch {}

			await insforge.database
				.from("note_shares")
				.delete()
				.eq("note_id", noteId)
				.eq("shared_with_email", sanitizedEmail);

			await insforge.database.from("note_shares").insert([{
				note_id: noteId,
				shared_with_email: sanitizedEmail,
				role,
				...(currentUserId ? { shared_by_user_id: currentUserId } : {}),
			}]);
		} catch (err) {
			console.warn("InsForge shareNote error:", err);
		}
	}

	return note?.sharedWith || [shareItem];
}

/**
 * Revoke sharing access for a user.
 */
export async function revokeNoteShareInInsForge(
	noteId: string,
	email: string,
): Promise<NoteShare[]> {
	const sanitizedEmail = email.trim().toLowerCase();

	// 1. Update in-memory
	const note = inMemoryNotes.find((n) => n.id === noteId);
	if (note && note.sharedWith) {
		note.sharedWith = note.sharedWith.filter((s) => s.email.toLowerCase() !== sanitizedEmail);
		saveNotesToLocalStorage(inMemoryNotes);
		notifyRefreshNotes();
	}

	// 2. Delete from InsForge DB if valid UUID
	if (isValidUUID(noteId)) {
		try {
			await insforge.database
				.from("note_shares")
				.delete()
				.eq("note_id", noteId)
				.eq("shared_with_email", sanitizedEmail);
		} catch (err) {
			console.warn("InsForge revokeNoteShare error:", err);
		}
	}

	return note?.sharedWith || [];
}

/**
 * Determine user's permission for a note.
 */
export function getUserNotePermission(
	note: NoteItem | null | undefined,
	userEmail?: string,
	userId?: string,
): { isOwner: boolean; isShared: boolean; role: 'owner' | 'editor' | 'viewer'; canEdit: boolean } {
	if (!note) return { isOwner: true, isShared: false, role: 'owner', canEdit: true };

	const normUserEmail = (userEmail || '').trim().toLowerCase();
	const normOwnerEmail = (note.ownerEmail || '').trim().toLowerCase();

	const isOwner = Boolean(
		(note.ownerId && userId && note.ownerId === userId) ||
		(normOwnerEmail && normUserEmail && normOwnerEmail === normUserEmail) ||
		(!note.ownerId && !note.ownerEmail)
	);

	if (isOwner) {
		return { isOwner: true, isShared: false, role: 'owner', canEdit: true };
	}

	const share = note.sharedWith?.find(
		(s) => s.email.trim().toLowerCase() === normUserEmail
	);

	if (share) {
		const role = share.role || 'viewer';
		return { isOwner: false, isShared: true, role, canEdit: role === 'editor' };
	}

	return { isOwner: false, isShared: true, role: 'viewer', canEdit: false };
}

/**
 * Upload an attachment to InsForge Storage bucket 'note-attachments' and associate it with a note.
 */
export async function uploadNoteAttachmentToInsForge(
	noteId: string,
	file: File,
): Promise<NoteAttachment | null> {
	const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
	const filePath = `notes/${noteId}/${Date.now()}-${sanitizedName}`;

	const { data, error } = await insforge.storage
		.from("note-attachments")
		.upload(filePath, file);

	if (error || !data?.url) {
		console.error("InsForge attachment upload error:", error);
		throw new Error(error?.message || "Failed to upload file to storage.");
	}

	const attachment: NoteAttachment = {
		id: generateUUID(),
		name: file.name,
		url: data.url,
		size: file.size,
		type: file.type || "application/octet-stream",
		uploadedAt: new Date().toISOString().replace("T", " ").substring(0, 16),
	};

	// Append to note in memory and update database
	const currentNote = getNoteById(noteId);
	const currentList = currentNote?.attachments || [];
	const updatedList = [...currentList, attachment];
	await updateNoteInInsForge(noteId, { attachments: updatedList });

	return attachment;
}

/**
 * Remove an attachment from a note.
 */
export async function removeNoteAttachmentFromInsForge(
	noteId: string,
	attachmentId: string,
): Promise<NoteAttachment[]> {
	const currentNote = getNoteById(noteId);
	if (!currentNote) return [];

	const currentList = currentNote.attachments || [];
	const updatedList = currentList.filter((a) => a.id !== attachmentId);
	await updateNoteInInsForge(noteId, { attachments: updatedList });
	return updatedList;
}

