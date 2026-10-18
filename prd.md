# Codiary PRD (Product Requirements Document)

## Project Overview

`Codiary` is a modern, AI-powered engineering notebook and collaborative document vault designed for developers, technical founders, and builders. It serves as an engineer's "second brain"—a single place to capture ideas, architecture decisions, research, code snippets, and working context.

Codiary pairs a distraction-free block editor (with autosave, tag taxonomy, and inline image attachments) with automated AI organization (summaries, smart titles, and tagging), granular role-based sharing (`viewer` vs. `editor`), multi-format file import/export, and semantic search powered by vector embeddings.

---

## High-Level Summary

The core product loop in Codiary:
1. **Capture & Import**: Create notes from scratch or import existing technical documents across multiple formats (`.md`, `.txt`, `.json`, `.csv`, `.py`, `.js`, `.ts`, `.tsx`, etc.).
2. **Draft & Edit**: Write freely in a responsive block editor with debounced autosave, markdown formatting, and inline image attachments.
3. **AI-Assisted Organization**: Run one-click AI auto-organization to generate concise executive summaries, improved technical titles, and taxonomy tags.
4. **Retrieve & Recall**: Surface notes instantly either via keyword/tag filters or by natural-language semantic meaning via a `Cmd+K` / `Ctrl+K` command palette powered by vector embeddings.
5. **Collaborate & Share**: Share notes with collaborators by email with granular role-based permissions (`viewer` for read-only access and `editor` for collaborative modifications).

---

## Product Name

`Codiary`

---

## Product Summary

`Codiary` is an AI-assisted knowledge vault and collaborative document workspace for software engineers. It combines fast capture, multi-format file import, AI-powered structure extraction, granular access permissions, and semantic vector recall in a high-contrast developer aesthetic.

---

## Target Users

- **Software Engineers & Architects**: Documenting architecture decisions, debugging traces, API specs, and technical RFCs.
- **Indie Hackers & Technical Founders**: Maintaining product roadmaps, release notes, and technical knowledge bases.
- **Engineering Teams**: Collaborating on internal technical documentation with clear read/write permission boundaries.

---

## Core Value Proposition

A unified, developer-native knowledge vault combining:
- **Instant capture** with multi-format imports and debounced autosave.
- **AI-driven metadata** that organizes without destroying user intent.
- **Granular sharing** with real-time role-based access control.
- **Deep recall** through semantic vector search even when exact keywords are forgotten.

---

## Functional Scope & Features

### 1. Document Creation & Editing
- **Block-Based Rich Text Editor**: Clean, responsive editing interface supporting headings, code blocks, lists, quotes, and inline images.
- **Debounced Autosave**: Changes persist automatically with clear visual status indicators (`Saved`, `Saving...`, `Error`).
- **Document Renaming**: Rename documents via a dedicated modal or context menu without losing document state.
- **Document Deletion**: Safe deletion workflow with user confirmation.

### 2. Multi-Format File Import & Export
- **File Import Dialog**: Directly import files into new notes with automatic title detection and body extraction. Supported formats:
  - Markdown (`.md`)
  - Plain Text (`.txt`)
  - Code & Config: Python (`.py`), JavaScript/TypeScript (`.js`, `.ts`, `.tsx`), JSON (`.json`), CSV (`.csv`), HTML (`.html`), CSS (`.css`)
- **Document Export**: Download any note as standard Markdown (`.md`) with preserved formatting.

### 3. Document Sharing & Role-Based Permissions
- **Granular Email Sharing**: Document owners can invite collaborators by email address.
- **Permission Levels**:
  - `viewer`: Read-only mode. Content editing, auto-organize, and deletion are disabled in the UI and enforced at the database level.
  - `editor`: Can update note title, body, and tags.
- **Owner Control**: Revoke collaborator access or update permissions anytime.
- **"Shared with Me" Library Tab**: Dedicated tab listing notes shared with the active user, with permission badges (`Viewer` / `Editor`).

### 4. AI Auto-Organization
- **One-Click Auto-Organize**: Analyzes note contents via OpenRouter LLMs.
- Generates:
  - High-signal technical title
  - Structured executive summary
  - Relevant classification tags
- Updates note metadata non-destructively without overwriting the user's body text.

### 5. Semantic Vector Search
- **Command Palette (`Cmd+K` / `Ctrl+K`)**: Global search dialog accessible from anywhere in the application.
- **Vector Embeddings**: Generates 1536-dimensional embeddings (`text-embedding-3-small`) stored in PostgreSQL.
- **Cosine Similarity Matching**: Finds relevant documents by conceptual meaning even when exact search terms differ.
- **Keyword & Tag Filtering**: Fast client-side filtering by title, summary, and taxonomy tags.

### 6. Asset & Image Management
- **Inline Image Uploads**: Upload images directly into documents, stored in an InsForge storage bucket.
- **File Validation**: Strict validation for allowed MIME types (`image/png`, `image/jpeg`, `image/webp`, `image/gif`) and file size limits (5MB max).

### 7. Authentication & Security
- **Per-User Isolation**: User accounts authenticated via InsForge Auth with JWT sessions.
- **Row-Level Security (RLS)**: Enforces that users can only read or modify their own notes or notes explicitly shared with them.

---

## Technical Architecture

- **Frontend Framework**: Next.js 16 (App Router, Turbopack) + React 19 + TypeScript.
- **Styling**: Tailwind CSS 3.4 with custom design tokens, dark/light theme support, and responsive layouts.
- **Backend & Database**: InsForge BaaS (PostgreSQL + PostgREST).
- **Storage**: InsForge S3-compatible Object Storage for image assets.
- **AI Integrations**: OpenRouter API (`text-embedding-3-small` for vector embeddings, chat models for auto-organization).
- **Core Database Entities**:
  - `notes`: `id`, `user_id`, `title`, `content`, `summary`, `created_at`, `updated_at`
  - `document_shares`: `id`, `document_id`, `shared_by_user_id`, `shared_with_email`, `permission` (`viewer` | `editor`), `created_at`
  - `tags`: `id`, `name`, `user_id`
  - `note_tags`: `note_id`, `tag_id`
  - `note_embeddings`: `note_id`, `embedding` (vector)

---

## Implementation Status

| Feature Area | Status | Notes |
| :--- | :--- | :--- |
| User Authentication | Shipped | Email/password login & registration via InsForge Auth |
| Note CRUD & Autosave | Shipped | Full block editing with debounced state save |
| Document Renaming | Shipped | Context menu & modal rename workflow |
| Multi-Format Import | Shipped | Supports `.md`, `.txt`, `.json`, `.csv`, `.py`, `.ts`, etc. |
| Markdown Export | Shipped | Download note content as `.md` |
| Role-Based Sharing | Shipped | `viewer` and `editor` roles with RLS enforcement |
| Shared With Me Tab | Shipped | Library view with role indicators |
| AI Auto-Organize | Shipped | Generates title, summary, and tags |
| Semantic Vector Search | Shipped | `Cmd+K` palette with cosine similarity search |
| Inline Image Uploads | Shipped | Storage bucket integration with validation |
| Dark / Light Theme | Shipped | System, dark, and light mode support |
