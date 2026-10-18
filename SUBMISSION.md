# Ajaia LLC - Full Stack Product Engineer Assessment

Candidate: Melwyn Mascarenhas (melwyndev)
Date: October 18, 2026

---

## Links

- Live Product: https://codiary-jet.vercel.app/
- GitHub Repository: https://github.com/melwyndev/codiary.git
- Google Drive Folder (all deliverables): https://drive.google.com/drive/folders/1QEegniy6JMzxMx1siKb8H84QtE8x5ANi?usp=sharing
- Walkthrough Video: included in the Google Drive folder above

---

## Demo Credentials

Two pre-configured test accounts for reviewing sharing and collaboration:

- User 1: user1@gmail.com / password1234
- User 2: user2@gmail.com / password1234

---

## Google Drive Folder Contents

The Google Drive folder contains the following separate deliverable files:

1. Source code: Available at https://github.com/melwyndev/codiary.git (also linked in README)
2. README.md: Local setup and run instructions (in repo root)
3. ARCHITECTURE.md: Short architecture note covering tech stack, data model, priorities, and tradeoffs
4. AI-WORKFLOW.md: AI workflow note covering tools used, what was accepted/rejected, and verification methods
5. TESTING.md: Complete list of what is working, what is incomplete, and what I would build next
6. VIDEO-LINK.txt: Text file containing the walkthrough video URL
7. sample-architecture-note.md: A sample .md file reviewers can use to test the file import feature
8. Walkthrough video file: Demo recording of all features

---

## Project Overview

Codiary is a collaborative document editor built for the Ajaia LLC assessment. It is a developer notes workspace with rich text editing, file import, document sharing, and export capabilities.

Built with Next.js 16 (App Router), Tailwind CSS 3.4, and InsForge BaaS (managed PostgreSQL with Row-Level Security).

---

## What Is Working (End-to-End)

### Task 1: Document Creation and Editing
- Create new documents from the notes library
- Rename documents via right-click context menu modal
- Edit content using a block-based canvas editor in the browser
- Rich text formatting: bold, italic, headings (H1/H2/H3), code blocks with syntax highlighting, bulleted lists, checklists, quotes, dividers
- Slash commands: /h1, /h2, /h3, /code, /quote, /todo, /list, /divider
- Custom emoji icon selector and relational tag system with autocomplete
- Debounced autosave (1500ms) with live sync badge (Saved / Saving / Unsaved)
- Documents persist after page refresh
- Pin/unpin and drag-and-drop reordering in the library

### Task 2: File Upload
- "IMPORT" button opens a dedicated modal with drag-and-drop dropzone
- Uploads a .md, .txt, or .json file and turns it into a new editable document
- Markdown files: title extracted from first # Heading line
- JSON files: handles single notes and multi-note vault backups (batch import)
- File size validation: 10 MB maximum with clear error message
- Unsupported file types rejected with error alert
- Supported types and limits clearly stated in both UI and README
- Successfully imported files open directly in the canvas editor

### Task 3: Sharing
- Document owner can share by entering a collaborator email
- Two permission levels: Viewer (read-only) and Editor (read-write)
- Viewer: canvas locked, editing disabled, "Viewer (Read Only)" badge shown
- Editor: full editing access to blocks and content
- Visible distinction between owned and shared documents (purple badges on cards)
- "Shared with Me" filter tab in library sidebar
- Uses real InsForge Auth accounts (user1@gmail.com and user2@gmail.com), not mocked users

### Task 4: Persistence
- All documents stored in InsForge PostgreSQL via PostgREST API
- Documents, formatting, and block structure survive page refresh and browser close
- Sharing permissions persist in the note_shares table with foreign key cascading
- Tags persist in relational tags and note_tags join tables

### Task 5: Product and Engineering Quality
- Clear setup and run instructions in README.md
- Live deployment at https://codiary-jet.vercel.app/
- Input validation and error handling on all forms (share, import, rename, delete)
- TypeScript strict mode: 0 errors (npx tsc --noEmit)
- Production build: 0 errors (pnpm build)
- Toast notifications for all user-facing operations
- Architecture note provided (ARCHITECTURE.md)

### Stretch Features Completed
- Export to Markdown (.md) with YAML frontmatter
- Export to PDF via clean @media print stylesheet
- Role-based sharing permissions (Viewer vs Editor) beyond basic access
- In-place document renaming from the library context menu

---

## What Is Incomplete

- Automated tests: No unit or integration tests were written due to the time constraint. All verification was done manually and via TypeScript strict mode checks.
- Real-time collaboration indicators: Sharing is permission-based but does not show live presence.
- .docx file import: Only .md, .txt, .json supported.
- Commenting or suggestions mode: Not implemented.
- Document version history: Not implemented.

---

## What I Would Build Next (2-4 More Hours)

1. Automated Tests: Add 5-8 tests using Jest and React Testing Library covering document CRUD, file import validation, and sharing permission checks.
2. Real-Time Presence: Use InsForge Realtime WebSocket channels to show live user avatars on documents.
3. Document Version History: Snapshot-based version timeline with restore capability.
4. Mobile Responsiveness: Improve block editor layout for mobile and tablet viewports.

---

## Architecture Summary

- Frontend: Next.js 16 (App Router, Turbopack) with Tailwind CSS 3.4
- State: In-memory cache for instant UI + debounced PostgreSQL sync for persistence
- Backend: InsForge BaaS (PostgreSQL with PostgREST API, Row-Level Security)
- Auth: InsForge Auth (email/password accounts)
- Storage: InsForge cloud storage buckets for file attachments
- Deployment: Vercel with automatic CI/CD from GitHub main branch

Key tradeoffs:
- Chose InsForge BaaS over a custom Express server to eliminate boilerplate and focus on product UX
- Chose client-side file parsing over server upload workers for zero-latency document creation
- Chose optimistic UI updates with debounced sync for a responsive editing experience

Full architecture details: see ARCHITECTURE.md in the Google Drive folder and repo root.

---

## AI-Native Workflow Summary

Tools used:
- Google Gemini (Antigravity IDE) for agentic code generation and iterative implementation
- InsForge MCP Tools for backend infrastructure provisioning

Where AI sped up work:
- Project scaffolding and boilerplate (saved 30-45 min)
- Component generation (block editor, dialogs, export utilities)
- Database schema and RLS policy drafting

What I accepted: UI components, database migrations (after review), export utilities, SDK integration patterns.

What I rejected: Simulated mock users (used real auth instead), AI-organize feature (kept scope focused), overly complex state management (simplified to in-memory + SDK calls).

How I verified: TypeScript strict mode (0 errors), production build checks (0 errors), manual end-to-end testing across two accounts, Spec-Driven Development verification loops.

Full AI workflow details: see AI-WORKFLOW.md in the Google Drive folder and repo root.

---

## How to Run Locally

Prerequisites: Node.js v18.18.0+, pnpm (recommended) or npm

Step 1: Clone
git clone https://github.com/melwyndev/codiary.git
cd codiary

Step 2: Install
pnpm install

Step 3: Environment Variables
Create .env.local in the project root:
NEXT_PUBLIC_INSFORGE_BASE_URL=https://hxpct5r5.eu-central.insforge.app
NEXT_PUBLIC_INSFORGE_ANON_KEY=anon_22aa1ba06252dde17f0efd8bea0322d0ca8e6283d1c1f3610bad07f7c7319560

Step 4: Run
pnpm dev

Open http://localhost:3000

Step 5: Production build (optional)
pnpm build
pnpm start

---

## Walkthrough Video Note

The Google Drive folder contains the walkthrough video demonstrating all assessment tasks end-to-end. Due to an audio input capture issue during recording, the initial recording does not include microphone audio. A supplemental voiced walkthrough is being added to the same Google Drive folder. All features are fully functional and testable on the live deployment at https://codiary-jet.vercel.app/
