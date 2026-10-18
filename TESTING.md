# Testing & Feature Inclusion List: Codiary

## What Is Working (End-to-End Verified)

### Task 1: Document Creation & Editing
- Create new documents from the notes library.
- Rename documents via right-click context menu modal.
- Edit document content in the browser using a block-based canvas editor.
- Slash commands: /h1, /h2, /h3, /code, /quote, /todo, /list, /divider.
- Rich text formatting: bold, italic, headings, code blocks with syntax highlighting, bulleted lists, checklists.
- Custom emoji icon selector for documents.
- Relational tag system with autocomplete and inline tag creation.
- Debounced autosave (1500ms) with live sync badge (Saved / Saving / Unsaved).
- Documents persist after page refresh.
- Delete documents from both the canvas and library context menu.
- Pin/unpin documents to the top of the library.
- Drag-and-drop reordering in the notes library.

### Task 2: File Upload & Import
- "IMPORT" button opens a dedicated modal with drag-and-drop dropzone.
- Supports .md (Markdown), .txt (plain text), .json (single note or vault backup).
- Markdown files: title extracted from first # Heading line.
- JSON vault backups: batch-imports multiple notes at once.
- File size validation: 10 MB maximum with clear error message.
- Unsupported file types are rejected with an error alert.
- Successfully imported files open directly in the canvas editor.
- Supported types and size limits are clearly stated in both the UI and README.

### Task 3: Sharing & Access Control
- Document owner can share a note by entering a collaborator email address.
- Two permission levels: Viewer (read-only) and Editor (read-write).
- Viewer role: canvas is locked, block editing disabled, "Viewer (Read Only)" badge displayed.
- Editor role: full editing access to all blocks and content.
- Shared documents show purple badges on note cards ("Shared (Editor)" / "Shared (Viewer)").
- "Shared with Me" filter tab in the library sidebar.
- Sharing uses real InsForge Auth accounts, not mocked users.
- Test accounts provided:
  - user1@gmail.com / password1234
  - user2@gmail.com / password1234

### Task 4: Persistence
- All documents stored in InsForge PostgreSQL (PostgREST API).
- Documents survive page refresh, browser close, and device switching.
- Formatting and block structure are preserved as serialized content.
- Sharing permissions persist in the note_shares table.
- Tags persist in the tags and note_tags join tables.

### Task 5: Product & Engineering Quality
- Clear setup instructions in README.md.
- Live deployment at https://codiary-jet.vercel.app/
- Input validation and error handling on all forms (share dialog, import dialog, rename dialog).
- TypeScript strict mode: 0 type errors (npx tsc --noEmit).
- Production build: 0 build errors (pnpm build).
- Architecture note provided (ARCHITECTURE.md).
- Toast notifications for all user-facing operations.

### Stretch Features Completed
- Export to Markdown (.md) with YAML frontmatter metadata.
- Export to PDF via clean @media print stylesheet.
- Role-based sharing permissions (Viewer vs Editor) beyond basic access.
- In-place document renaming from the library context menu.

## What Is Incomplete

- Automated tests: No unit or integration tests were written due to the time constraint. All verification was done manually and via TypeScript strict mode compilation checks.
- Real-time collaboration indicators: The sharing model is permission-based but does not show live presence (who is currently viewing a document).
- .docx file import: Only .md, .txt, and .json are supported. Adding .docx would require a parsing library like mammoth.js.
- Commenting or suggestions mode: Not implemented.
- Document version history: Not implemented.

## What I Would Build Next (2-4 More Hours)

1. Automated Tests: Add 5-8 tests using Jest and React Testing Library covering:
   - Document CRUD operations (create, read, update, delete).
   - File import validation (reject oversized files, reject unsupported types, accept valid files).
   - Sharing permission checks (Viewer cannot edit, Editor can edit).

2. Real-Time Presence: Use InsForge Realtime WebSocket channels to show live user avatars on documents being viewed by collaborators.

3. Document Version History: Add a snapshots table that stores content versions on each save, with a timeline viewer to browse and restore previous versions.

4. Mobile Responsiveness: Improve the block editor layout and context menu positioning for mobile and tablet viewports.

## Verification Methods Used

- TypeScript strict mode compilation (npx tsc --noEmit): 0 errors.
- Next.js production build (pnpm build): 0 errors, all 11 routes compiled successfully.
- Manual end-to-end testing of every feature across two test accounts.
- Cross-browser verification in Chrome.
