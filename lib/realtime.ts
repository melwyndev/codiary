import { insforge } from './insforge';

export interface Collaborator {
  userId: string;
  email: string;
  name?: string;
  avatar?: string;
  joinedAt: string;
  lastActiveAt?: string;
  color: string;
}

export interface NoteChangePayload {
  noteId: string;
  senderId: string;
  senderEmail: string;
  clientSessionId?: string;
  title?: string;
  content?: string;
  tags?: string[];
  icon?: string | null;
  attachments?: any[];
  isPinned?: boolean;
  updatedAt: string;
}

// Unique ephemeral browser tab identifier to reliably discard self-echoes
export const CLIENT_SESSION_ID =
  typeof window !== 'undefined'
    ? `tab_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`
    : 'server';

// Collaborator color palette for dynamic avatar styling
const COLLABORATOR_COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#8b5cf6', // purple
  '#f59e0b', // amber
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
  '#14b8a6', // teal
];

export function getCollaboratorColor(identifier: string): string {
  let hash = 0;
  for (let i = 0; i < identifier.length; i++) {
    hash = identifier.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % COLLABORATOR_COLORS.length;
  return COLLABORATOR_COLORS[index];
}

let isConnecting = false;

/**
 * Ensure the InsForge realtime socket is connected with the authenticated user session.
 */
export async function ensureRealtimeConnected(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  try {
    if (insforge.realtime.isConnected) {
      return true;
    }

    if (!isConnecting) {
      isConnecting = true;
      await insforge.realtime.connect();
      isConnecting = false;
    } else {
      let attempts = 0;
      while (isConnecting && attempts < 20) {
        await new Promise((r) => setTimeout(r, 100));
        attempts++;
      }
    }
    return insforge.realtime.isConnected;
  } catch (err) {
    console.warn('Realtime connection attempt:', err);
    isConnecting = false;
    return false;
  }
}

/**
 * Debounce helper for keystroke broadcasting to prevent flooding WebSocket
 */
const debounceTimers: Map<string, NodeJS.Timeout> = new Map();

export function broadcastNoteChangeDebounced(
  noteId: string,
  payload: Partial<NoteChangePayload>,
  currentUser: { id: string; email?: string },
  delayMs: number = 150
) {
  const key = `debounce:${noteId}`;
  if (debounceTimers.has(key)) {
    clearTimeout(debounceTimers.get(key)!);
  }

  const timer = setTimeout(() => {
    debounceTimers.delete(key);
    publishNoteChange(noteId, payload, currentUser);
  }, delayMs);

  debounceTimers.set(key, timer);
}

/**
 * Publish note changes to the note collaboration channel.
 */
export async function publishNoteChange(
  noteId: string,
  changes: Partial<NoteChangePayload>,
  currentUser: { id: string; email?: string }
): Promise<void> {
  if (!noteId || !currentUser?.id) return;

  const connected = await ensureRealtimeConnected();
  if (!connected) return;

  const fullPayload: NoteChangePayload = {
    noteId,
    senderId: currentUser.id,
    senderEmail: currentUser.email || 'Anonymous',
    clientSessionId: CLIENT_SESSION_ID,
    title: changes.title,
    content: changes.content,
    tags: changes.tags,
    icon: changes.icon,
    attachments: changes.attachments,
    isPinned: changes.isPinned,
    updatedAt: new Date().toISOString(),
  };

  try {
    const channel = `note:${noteId}`;
    await insforge.realtime.publish(channel, 'note:change', fullPayload);
  } catch (err) {
    console.warn('Error publishing note change:', err);
  }
}

/**
 * Subscribe to live changes and presence for a specific note.
 */
export function subscribeToNote(
  noteId: string,
  currentUser: { id: string; email?: string; name?: string },
  callbacks: {
    onRemoteChange?: (payload: NoteChangePayload) => void;
    onPresenceChange?: (collaborators: Collaborator[]) => void;
  }
): () => void {
  if (typeof window === 'undefined' || !noteId) return () => {};

  const channel = `note:${noteId}`;
  let isSubscribed = false;
  let heartbeatInterval: NodeJS.Timeout | null = null;
  const activeCollaborators = new Map<string, Collaborator>();

  const notifyPresence = () => {
    if (callbacks.onPresenceChange) {
      const now = Date.now();
      const currentList: Collaborator[] = [];
      for (const [id, collab] of activeCollaborators.entries()) {
        const lastSeen = collab.lastActiveAt ? new Date(collab.lastActiveAt).getTime() : 0;
        if (id === currentUser.id || now - lastSeen < 45000) {
          currentList.push(collab);
        } else {
          activeCollaborators.delete(id);
        }
      }
      callbacks.onPresenceChange(currentList);
    }
  };

  const handleRemoteChange = (msg: any) => {
    const payload = (msg?.payload || msg) as NoteChangePayload;
    if (!payload || !payload.noteId || payload.noteId !== noteId) return;

    // Unconditionally ignore self-echoes from this exact browser tab session
    if (payload.clientSessionId && payload.clientSessionId === CLIENT_SESSION_ID) return;

    // Fallback: ignore changes sent by the current user if clientSessionId is absent
    const sender = payload.senderId || msg?.meta?.senderId;
    if (!payload.clientSessionId && sender && sender === currentUser.id) return;

    // Record collaborator activity
    if (payload.senderId && payload.senderEmail) {
      activeCollaborators.set(payload.senderId, {
        userId: payload.senderId,
        email: payload.senderEmail,
        joinedAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
        color: getCollaboratorColor(payload.senderEmail),
      });
      notifyPresence();
    }

    if (callbacks.onRemoteChange) {
      callbacks.onRemoteChange(payload);
    }
  };

  const handlePresencePing = (msg: any) => {
    const payload = msg?.payload || msg;
    if (!payload || !payload.userId || payload.noteId !== noteId) return;

    activeCollaborators.set(payload.userId, {
      userId: payload.userId,
      email: payload.email || 'Anonymous',
      name: payload.name,
      avatar: payload.avatar,
      joinedAt: payload.joinedAt || new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      color: getCollaboratorColor(payload.email || payload.userId),
    });
    notifyPresence();
  };

  const sendPresencePing = async () => {
    if (!insforge.realtime.isConnected) return;
    try {
      await insforge.realtime.publish(channel, 'note:presence:ping', {
        noteId,
        userId: currentUser.id,
        email: currentUser.email || 'Anonymous',
        name: currentUser.name,
        joinedAt: new Date().toISOString(),
      });
    } catch (e) {}
  };

  // Register self as initial active collaborator
  if (currentUser?.id) {
    activeCollaborators.set(currentUser.id, {
      userId: currentUser.id,
      email: currentUser.email || 'Me',
      name: currentUser.name,
      joinedAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      color: getCollaboratorColor(currentUser.email || currentUser.id),
    });
  }

  // Setup connection and subscribe
  (async () => {
    const connected = await ensureRealtimeConnected();
    if (!connected) return;

    try {
      const res = await insforge.realtime.subscribe(channel);
      if (res.ok) {
        isSubscribed = true;
        await sendPresencePing();
        heartbeatInterval = setInterval(sendPresencePing, 15000);
      }
    } catch (err) {
      console.warn('Realtime subscribe error:', err);
    }
  })();

  insforge.realtime.on('note:change', handleRemoteChange);
  insforge.realtime.on('note:presence:ping', handlePresencePing);

  return () => {
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
      heartbeatInterval = null;
    }

    insforge.realtime.off('note:change', handleRemoteChange);
    insforge.realtime.off('note:presence:ping', handlePresencePing);

    if (isSubscribed) {
      try {
        insforge.realtime.unsubscribe(channel);
      } catch (e) {}
    }
  };
}
