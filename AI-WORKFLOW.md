# AI-Native Workflow Note: Codiary

## AI Tools Used

- Google Gemini (Antigravity IDE): Primary agentic coding assistant used for code generation, architecture decisions, and iterative implementation.
- InsForge MCP Tools: Used for backend infrastructure provisioning (database schema, storage buckets, auth configuration) via the InsForge CLI agent toolchain.

## Where AI Materially Sped Up My Work

1. Scaffolding & Boilerplate:
   AI generated the initial project structure, InsForge SDK client setup, and database migration SQL files significantly faster than writing them by hand. This saved approximately 30-45 minutes of setup time.

2. Component Generation:
   The block editor slash command menu, file import dialog, share dialog, rename dialog, and export utilities were each generated as complete, styled React components. AI produced working first drafts that I then reviewed, tested, and refined.

3. Database Schema & RLS:
   AI drafted the note_shares table schema, foreign key constraints, and Row-Level Security policies. This required careful review since incorrect RLS policies would silently break access control.

4. Spec-Driven Development Artifacts:
   AI helped draft the project constitution, system specification, and feature loop documentation under the specs/ directory, following the Spec-Driven Development methodology.

## What AI-Generated Output I Accepted

- UI component structure and Tailwind CSS styling: Accepted with minor adjustments to color palette and spacing tokens.
- Database migration SQL: Accepted after verifying column types, foreign key constraints, and RLS policy correctness.
- Export utilities (Markdown serializer, PDF print stylesheet): Accepted after manual testing of output quality.
- InsForge SDK integration patterns (auth, database CRUD, storage): Accepted as these follow well-documented SDK patterns.

## What AI-Generated Output I Rejected or Modified

- Initial mock/demo user system: AI suggested simulated personas with fake data. I rejected this in favor of real InsForge Auth accounts (user1@gmail.com, user2@gmail.com) that authenticate against the actual PostgreSQL auth.users table.
- AI Organize feature: AI generated an AI-powered note organizer using OpenRouter, but I chose to hide this from the UI to keep the product focused on the four assessment tasks rather than adding tangential AI features.
- Overly complex state management: AI initially proposed a Redux-like store pattern. I rejected this in favor of a simpler in-memory array with direct InsForge SDK calls, which was more appropriate for the project scope.

## How I Verified Correctness, UX Quality, and Implementation Reliability

1. TypeScript Strict Mode: Ran npx tsc --noEmit after every feature loop to ensure zero type errors across the entire codebase.

2. Production Build Verification: Ran pnpm build before every commit to verify the Next.js production build compiles without errors or warnings.

3. Manual End-to-End Testing:
   - Created documents with all slash command block types and verified persistence after page refresh.
   - Imported .md, .txt, and .json files and verified correct title extraction and content parsing.
   - Shared documents between user1@gmail.com and user2@gmail.com, then logged into each account to verify Viewer (read-only) and Editor (read-write) enforcement.
   - Exported documents to Markdown and PDF, then opened the exported files to verify formatting integrity.
   - Renamed documents via the context menu and verified the title updated in both the card grid and the database.

4. Spec-Driven Verification:
   Each feature was implemented following a Plan-Implement-Verify loop documented in specs/tasks.md. Acceptance criteria were defined before coding began, and each criterion was checked off after implementation.
