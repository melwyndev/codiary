# Architecture Note: Codiary

## High-Level Architecture

Codiary is a full-stack collaborative document editor built with:
- Frontend: Next.js 16 (App Router, Turbopack) with Tailwind CSS 3.4
- Backend & Database: InsForge BaaS (managed PostgreSQL with PostgREST API)
- Authentication: InsForge Auth (email/password + OAuth via Google & GitHub)
- Storage: InsForge cloud storage buckets for file attachments
- Deployment: Vercel (production build, automatic CI/CD from GitHub main branch)

## Data Model

The PostgreSQL schema consists of the following core tables:
- notes: Stores document content, title, icon, owner_email, owner user_id, timestamps, and a JSONB attachments column.
- note_shares: Links notes to collaborator emails with a permission field (viewer or editor). Foreign key cascades on note deletion.
- tags: Stores unique tag names.
- note_tags: Join table connecting notes to tags (many-to-many).
- note_embeddings: Stores 384-dimensional pgvector embeddings for semantic search.

Row-Level Security (RLS) is enforced on note_shares using auth.email() to ensure users can only access notes they own or that have been explicitly shared with them.

## State Management Strategy

The app uses a dual-layer persistence model:
- Layer 1 (In-Memory Cache): Notes are stored in a local JavaScript array for instant frame-0 rendering. All UI reads come from this cache first.
- Layer 2 (Cloud Sync): Every mutation (create, update, delete) is written to InsForge PostgreSQL via the SDK. Autosave uses a 1500ms debounce to batch keystrokes before persisting.
- Sync Badge: The editor header shows a live status indicator (Saved / Saving / Unsaved) so the user always knows the sync state.

This approach ensures the editor feels instantaneous even on slow connections, while PostgreSQL remains the authoritative source of truth.

## Key Priorities and Why

1. Document Editing Experience (Highest Priority)
   - Built a custom block-based editor with slash commands (/h1, /code, /quote, /todo, /list, /divider) rather than integrating a heavyweight library like TipTap or ProseMirror.
   - Why: A lightweight custom editor gave full control over the UX, kept bundle size small, and made the editing flow feel native and fast.

2. File Import Pipeline (High Priority)
   - Chose client-side file parsing over server-side upload workers.
   - Why: Eliminates server cold-start latency, avoids compute costs, and provides instant document creation. Files are parsed entirely in the browser (no raw file data is transmitted to intermediary servers).

3. Sharing with RBAC (High Priority)
   - Implemented real permission enforcement (not just UI hiding) backed by PostgreSQL RLS.
   - Why: Demonstrates a production-grade access control pattern. Viewer role truly cannot edit; Editor role truly can.

4. Export Engine (Medium Priority)
   - Dual export (Markdown with YAML frontmatter + PDF via print stylesheet).
   - Why: These are the two most practical export formats for developers.

## What I Deliberately Deprioritized

- Real-time collaborative editing (e.g., CRDT/OT): Would require significant infrastructure (WebSocket server, conflict resolution) that was out of scope for the timebox. The sharing model demonstrates access control intent without real-time co-editing.
- Automated testing: Focused on manual end-to-end verification and TypeScript strict mode (npx tsc --noEmit with 0 errors) rather than writing unit tests, given the time constraint.
- Version history: Would add complexity to the data model (snapshots table, diff viewer) without meaningfully improving the core editing/sharing demo.
- Commenting / suggestions mode: A stretch goal that was deprioritized in favor of polishing the core four tasks.

## What I Would Build Next (2-4 More Hours)

- Add at least 3-5 meaningful automated tests (Jest + React Testing Library) covering document CRUD, file import validation, and sharing permission checks.
- Implement real-time presence indicators (who's viewing a document) using InsForge Realtime WebSocket channels.
- Add document version history with snapshot diffs.
- Improve mobile responsiveness for the block editor canvas.
