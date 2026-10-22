# Codiary - Developer Notes & Architectural Notes Drawer

Codiary is a developer notes workspace, code snippet repository, and architectural archive powered by **Next.js**, **Tailwind CSS**, and **InsForge BaaS**.

---

## 📐 Spec-Driven Development (SDD) Workflow

This project was built following the **Spec-Driven Development (SDD)** paradigm (developed in partnership with JetBrains & DeepLearning.AI). Rather than unsupervised "vibe coding", the development was anchored in three permanent technical specifications:

1. **[Project Constitution (`specs/constitution.md`)](file:///Users/melwyn/Github/codiary/specs/constitution.md)**: Defines immutable architectural rules, non-negotiables, technology stack constraints, and role permission matrices.
2. **[System Specification (`specs/spec.md`)](file:///Users/melwyn/Github/codiary/specs/spec.md)**: Decouples the *WHAT and WHY* from the *HOW*, detailing exact specifications for all 4 assessment tasks (Block Editor, File Ingestion, Sharing/RBAC, and Dual Export).
3. **[Feature Loops & Verification Log (`specs/tasks.md`)](file:///Users/melwyn/Github/codiary/specs/tasks.md)**: Documents each feature development loop through `Plan → Implement → Verify → Status: Completed`.

---

## 📁 File Upload & Document Import Workflows

Codiary supports two product-relevant file workflows designed specifically for developers and engineering teams:

### 1. Document Import (File → Editable Note)
Import existing local notes or documentation directly into the workspace:
- **How to use**: Click the **"IMPORT"** button on the Notes Library toolbar or drag and drop a file into the import dialog.
- **Behavior**: The file is parsed natively in the browser without server latency; the file name is converted into the document title, and a new editable document is immediately created in InsForge PostgreSQL and opened in the Block Editor.
- **Supported File Types**:
  - `.md` — Markdown document (extracts title from `# Heading` or file name)
  - `.txt` — Plain text note
  - `.json` — Codiary note or notes drawer backup export
- **File Size Limit**: Up to **10 MB** per imported document.

### 2. Document Attachments (File → Attached Asset in a Note)
Attach reference architecture diagrams, specifications, archives, or datasets directly to any document:
- **How to use**: Open any note, click **"Attach"** in the header or **"Attach File"** in the Attachments bar right beneath the metadata tags.
- **Behavior**: Files are uploaded to the secure InsForge cloud storage bucket (`note-attachments`). Uploaded assets display with file-type badges, file size (KB/MB), upload timestamp, a download link, and deletion controls.
- **Supported Attachment Types**:
  - `.pdf` — Technical RFCs, design specifications, whitepapers
  - `.docx` / `.doc` — Word documents and project briefs
  - `.png` / `.jpg` / `.jpeg` — Architecture diagrams, flowcharts, screenshots
  - `.zip` — Code bundles, reproduction packages, asset archives
  - `.txt` — Logs, sample data, configuration dumps
- **File Size Limit**: Up to **10 MB** per uploaded attachment.

---

## 🚀 Key Features

- **Block & Markdown Editor**: Block-based canvas editor with slash commands (`/code`, `/heading`, `/table`, `/checklist`).
- **Semantic Vector Search**: Integrated with InsForge pgvector (384-dimensional embeddings) to find notes by concept and meaning.
- **Document Sharing & Permissions**: Share documents with collaborators by email with **Viewer** (read-only) or **Editor** (read/write) access.
- **Relational Tagging System**: Multi-tag filtering and tag suggestion autocomplete.
- **Local-First Speed with Cloud Persistence**: Instant frame-0 rendering backed by PostgreSQL and PostgREST via InsForge SDK.

---

## 🛠️ Getting Started

### Prerequisites
- Node.js v18.18.0 or newer
- pnpm (recommended), npm, or yarn

### 1. Clone the Repository
```bash
git clone https://github.com/melwyndev/codiary.git
cd codiary
```

### 2. Install Dependencies
```bash
pnpm install
# or npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env.local` and configure your InsForge credentials:
```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_INSFORGE_BASE_URL=https://your-project.region.insforge.app
NEXT_PUBLIC_INSFORGE_ANON_KEY=your-insforge-anon-key
```

### 4. Run Development Server
```bash
pnpm dev
# or npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Production Build
```bash
pnpm build
pnpm start
```

---

## 🔑 Demo Credentials

Two pre-configured test accounts are available for reviewing the sharing and collaboration features:

- **User 1**: `user1@gmail.com` / `password1234`
- **User 2**: `user2@gmail.com` / `password1234`

---

## 🔗 Live Deployment

- **Live Product**: [https://codiary-jet.vercel.app/](https://codiary-jet.vercel.app/)
- **GitHub Repository**: [https://github.com/melwyndev/codiary.git](https://github.com/melwyndev/codiary.git)
