# Product & System Specification: Codiary

> **Framework:** Spec-Driven Development (SDD)  
> **Status:** Implemented & Verified  
> **Target System:** Developer Notes Workspace & Architectural Notes Drawer  

---

## 1. System Overview & Scope

`Codiary` is an architectural notes drawer and developer notes platform designed for software engineers. This specification outlines the functional and technical requirements implemented for the **Ajaia LLC Full Stack Product Engineer Assessment**.

---

## 2. Core Functional Specifications (The 4 Tasks)

### Task 1: Rich Document Creation & Canvas Editor
- **Objective**: Provide a fast, block-based workspace for capturing software architecture, code snippets, and engineering logs.
- **Canvas Blocks Supported**:
  - Paragraphs (`/p`)
  - Headings (`/h1`, `/h2`, `/h3`)
  - Syntax-highlighted Code Blocks (`/code`) with language selection (TypeScript, Python, Go, Rust, SQL, Bash) and copy-to-clipboard
  - Callouts / Quotes (`/quote`)
  - Checklists / To-do items (`/todo`)
  - Bulleted and numbered lists (`/list`, `/ordered`)
  - Dividers (`/divider`)
- **Metadata Management**:
  - Live document title editing with placeholder support
  - Custom emoji icon selector
  - Relational tag chips with autocomplete and inline creation
- **Persistence & Autosave**:
  - Debounced autosave (1500ms delay) updating PostgreSQL via InsForge SDK
  - Live visual sync badge in top header:
    - `🟢 Saved` — Synchronized with cloud PostgreSQL
    - `🟡 Saving...` — Network request in progress
    - `🟠 Unsaved` — Local edits pending debounce

---

### Task 2: Direct File Import Pipeline
- **Objective**: Enable zero-friction document ingestion from existing developer files into editable canvas notes.
- **Trigger**: Click **"IMPORT"** in the notes toolbar or press the global shortcut.
- **User Interface**: Dedicated glassmorphism modal with:
  - Drag-and-drop dropzone with animated hover states
  - Native file picker fallback
  - File details preview (filename, formatted size in KB/MB)
  - Clear format tags (`.md`, `.txt`, `.json`) and 10MB size limit disclosure
  - Error alert banner for invalid file types or oversized files
- **Parsing Engine (Browser-Native)**:
  - `.md` Files: Extracts title from the first `# Heading` (falling back to sanitized filename) and parses body into block content.
  - `.txt` Files: Converts filename into document title and preserves plain text with code block detection.
  - `.json` Files: Handles both individual note objects and notes drawer backups, batch-importing all entries into InsForge PostgreSQL.
- **Validation Rules**:
  - Whitelist: `.md`, `.txt`, `.json` (reject all other extensions).
  - Hard limit: 10,485,760 bytes (10 MB).

---

### Task 3: Access Control & Multi-User Sharing
- **Objective**: Allow engineers to share architecture notes with team members under strict role enforcement.
- **Data Model**: PostgreSQL table `note_shares`:
  ```sql
  CREATE TABLE note_shares (
    id UUID PRIMARY KEY,
    note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
    shared_by_user_id TEXT NOT NULL,
    shared_to_email TEXT NOT NULL,
    permission TEXT CHECK (permission IN ('viewer', 'editor')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  ```
- **Permission Matrix**:
  - **Editor Role**: Full read and write permissions to modify canvas blocks, code snippets, and checklists. Cannot delete the note or revoke ownership.
  - **Viewer Role**: Strict read-only access. The editor canvas disables block manipulation, hides action menus, and renders an amber `Viewer (Read Only)` badge.
- **Workspace Visibility**:
  - Shared notes display purple collaborator badges on note cards (`Shared (Editor)` / `Shared (Viewer)`).
  - Dedicated **"Shared with Me"** tab in the library sidebar and filter bar.

---

### Task 4: Dual Export Engine
- **Objective**: Export notes cleanly for external documentation, RFC publication, or team distribution.
- **Supported Formats**:
  1. **Markdown Export (`.md`)**:
     - Formats content with standard YAML frontmatter:
       ```markdown
       ---
       title: Microservices Event Bus Architecture
       tags: [kafka, architecture, distributed-systems]
       exported_at: 2026-10-18T20:00:00Z
       ---
       ```
     - Triggers automated browser download as `<title-slug>.md`.
  2. **PDF Export (`.pdf`)**:
     - Strips UI controls, navigation chrome, sidebars, and action buttons via CSS `@media print`.
     - Invokes native print engine with presentation-grade typography and code block formatting.
- **Entry Points**:
  - Right-click context menu on any note card in `/notes`.
  - Header dropdown menu (`Export ▾`) inside the active note canvas.

---

### Extended Task: In-Place Document Renaming
- **Objective**: Rapid title modifications without having to open the heavy document canvas.
- **Behavior**:
  - Available on right-click context menu via **"RENAME NOTE"**.
  - Opens modal matching the [FileImportDialog](file:///Users/melwyn/Github/codiary/components/file-import-dialog.tsx) visual aesthetics.
  - Autofocuses and highlights current title.
  - Supports `Enter` to commit and `Esc` to cancel.
  - Updates title in-memory and PostgreSQL database instantly with toast confirmation.
