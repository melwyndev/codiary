# Ajaia LLC - Full Stack Product Engineer Assessment Submission

Candidate: Melwyn (melwyndev)
Project: Codiary — Developer Notes Workspace & Architectural Vault
Date: October 18, 2026

---

## Deliverables & Links

- Live Deployed Product: https://codiary-jet.vercel.app/
- GitHub Repository: https://github.com/melwyndev/codiary.git
- Walkthrough Video (Google Drive): https://drive.google.com/drive/folders/1QEegniy6JMzxMx1siKb8H84QtE8x5ANi?usp=sharing
- Spec-Driven Development Artifacts: https://github.com/melwyndev/codiary/tree/main/specs

Note regarding Walkthrough Video:
The Google Drive folder contains the primary walkthrough video demonstrating all assessment features end-to-end. Due to an audio input capture issue during recording, the initial recording does not include microphone sound. A supplemental voiced walkthrough video is being uploaded to the exact same Google Drive folder. All features are fully functional and testable on the live deployment.

---

## 1. Project Overview & Scenario

Codiary is a developer notes workspace, architectural vault, and code snippet manager built to eliminate fragmented engineering context across browser tabs, communication tools, and local scratchpads.

Built with Next.js 16 (App Router), Tailwind CSS 3.4, and InsForge BaaS (PostgreSQL with Row-Level Security), Codiary combines the fluid speed of local-first optimistic UI updates with cloud-backed persistence.

---

## 2. Core Technical Tasks Implementation

### Task 1: Document Creation & Editing
- Block-Based Canvas Editor: Intuitive slash commands (/h1, /h2, /h3, /code, /quote, /todo, /list, /divider) for rapid keyboard-driven note composition.
- Syntax-Highlighted Code Blocks: Supports TypeScript, Python, Go, Rust, SQL, Bash with one-click copy-to-clipboard functionality.
- Document Metadata: Custom document title with live editing, emoji icon selector, and relational tag chips with autocomplete.
- Autosave & Persistence: Changes debounce automatically (1500ms) and persist directly to PostgreSQL. The top-right header features a live sync badge:
  * Green "Saved" — Synchronized with cloud PostgreSQL.
  * Yellow "Saving..." — Network write in flight.
  * Orange "Unsaved" — Local changes pending debounce.
- Deletion: Clean deletion controls with feedback toasts from both the document canvas and the notes context menu.

### Task 2: File Upload & Ingestion
- Document Import Workflow: Accessible via the prominent "IMPORT" button on the notes library toolbar.
- Drag-and-Drop Ingestion: Glassmorphism modal with animated drag-and-drop dropzone and native file picker fallback.
- Supported Formats:
  * .md (Markdown): Extracts title from first "# Heading" (or filename) and converts content into editable canvas blocks.
  * .txt (Plain Text): Formats raw text with title generation.
  * .json (Vault Backups): Handles single notes or multi-note backups, batch-importing into PostgreSQL.
- Format & Size Guards: 10 MB maximum file size cap with client-side validation and clear error alert banners.

### Task 3: Access Control & Multi-User Sharing
- Email-Based Sharing: Share notes with team members directly by entering their email in the Share dialog.
- Role Enforcement (RBAC):
  * Viewer Role: Read-only canvas. Block editing, adding blocks, deletion, and renaming are strictly disabled; an amber "Viewer (Read Only)" badge is displayed.
  * Editor Role: Full editing capabilities to update blocks, code snippets, and checklists.
- Visual Separation:
  * Distinct collaborator badges on note cards ("Shared (Editor)" / "Shared (Viewer)").
  * Dedicated "Shared with Me" tab and filter in the library sidebar.
- Database Schema: Backed by PostgreSQL note_shares table with foreign key cascading and Row-Level Security.

### Task 4: Dual Export Engine
- Markdown Export (.md): Serializes document content into clean Markdown with YAML frontmatter metadata (title, tags, exported_at).
- PDF Export (.pdf): Custom print stylesheet (@media print) that strips UI navigation, action buttons, and sidebars, triggering a clean print-to-PDF view.
- Dual Access Points: Available via right-click context menu in the notes library and via the "Export" dropdown menu in the editor header.

### Extended Task: In-Place Document Renaming
- Added a "RENAME NOTE" option to the right-click context menu on any note card.
- Opens an autofocus modal matching the import dialog UI to change document titles without having to load the editor canvas.

---

## 3. Product Thinking & Design Quality

- Visual Polish: Curated dark and light theme, modern typography (Inter and JetBrains Mono), glassmorphism popovers, and color-coded status badges.
- Smooth Feedback Loops: Non-blocking toast notifications (showToast), loading states (Loader2), and animated card transitions.
- Defensive Error Handling: Offline and network latency fallbacks via local in-memory storage, ensuring zero data loss during network hiccups.

---

## 4. AI-Native Workflow Notes: Spec-Driven Development (SDD)

Rather than unstructured "vibe coding", this project was developed using Spec-Driven Development (SDD) (following the JetBrains and DeepLearning.AI methodology):

- Decoupling Specification from Implementation:
  We created three permanent technical specifications in the repository under the specs/ directory:
  1. specs/constitution.md: Project-level non-negotiables, technology boundaries (Next.js 16, locked Tailwind CSS 3.4), role permission matrices, and security invariants.
  2. specs/spec.md: Formal specification for all 4 assessment tasks detailing inputs, outputs, validation rules, and UI states.
  3. specs/tasks.md: Structured feature loops (Plan -> Implement -> Verify -> Status) tracking acceptance criteria and verification tests.

- Eliminating Context Decay:
  Because LLM agent sessions have finite context windows, anchoring project rules in durable markdown specifications prevented hallucinations, architectural drift, and regressions across iterations.

- Rigorous Verification:
  Every feature loop concluded with static type validation (npx tsc --noEmit) and production build checks (pnpm build).

---

## 5. Solution Architecture & Key Technical Decisions

### Architecture:
- Frontend: Next.js 16 (App Router, Turbopack, Tailwind CSS 3.4) with interactive block editor and client-side parsing.
- State Management: In-memory cache for instant frame-0 UI updates paired with debounced background synchronization.
- Backend & Database: InsForge BaaS (PostgreSQL with PostgREST API) hosting tables for notes, note_shares, tags, and storage buckets.

### Key Trade-offs:
- BaaS vs. Custom Express Server: Leveraged InsForge BaaS (PostgreSQL + PostgREST). This eliminated boilerplate for CRUD routes, auth session cookies, and database connection pooling, allowing full focus on product UX, file ingestion, and sharing roles.
- Client-Side File Parsing vs. Server Upload Workers: Parsed .md, .txt, and .json files directly in the browser. This eliminated server cold-start latency, eliminated compute costs for file parsing, and provided instant document instantiation.
- Optimistic UI vs. Blocking Network Requests: Immediate local cache update followed by debounced PostgreSQL synchronization ensures a responsive typing experience even on high-latency connections.

---

## 6. How to Run Locally

### Prerequisites
- Node.js: v18.18.0 or newer
- Package Manager: pnpm (recommended), npm, or yarn

### Step 1: Clone the Repository
git clone https://github.com/melwyndev/codiary.git
cd codiary

### Step 2: Install Dependencies
pnpm install
(or: npm install)

### Step 3: Configure Environment Variables
Create a .env.local file in the project root:
NEXT_PUBLIC_INSFORGE_BASE_URL=https://hxpct5r5.eu-central.insforge.app
NEXT_PUBLIC_INSFORGE_ANON_KEY=anon_22aa1ba06252dde17f0efd8bea0322d0ca8e6283d1c1f3610bad07f7c7319560

(These credentials are also backed up in lib/insforge.ts as safe defaults).

### Step 4: Run Development Server
pnpm dev
(or: npm run dev)

Open http://localhost:3000 in your browser.

### Step 5: Production Build Verification
To test the production build locally:
pnpm build
pnpm start

---

## 7. Submission Checklist Summary

- Task 1 (Creation & Editing): Block editor with /h1, /code, /quote, /todo, tags, emoji icons, and live autosave.
- Task 2 (File Upload): Drag-and-drop document import dialog for .md, .txt, .json with 10 MB size limit.
- Task 3 (Sharing): Multi-user sharing with Viewer (read-only) and Editor roles, plus "Shared with Me" library tab.
- Task 4 (Export): Dual Markdown (.md with frontmatter) and PDF print view export.
- Extended Features: In-place document renaming from right-click context menu.
- AI-Native Workflow: Spec-Driven Development (specs/constitution.md, specs/spec.md, specs/tasks.md).
- Live Deployment: https://codiary-jet.vercel.app/
- Repository: https://github.com/melwyndev/codiary.git
- Walkthrough Video: https://drive.google.com/drive/folders/1QEegniy6JMzxMx1siKb8H84QtE8x5ANi?usp=sharing
