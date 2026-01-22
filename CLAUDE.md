# CLAUDE.md

## Quick Start

```bash
npm install              # Install dependencies
npm run dev              # Start frontend + API (recommended)
npm run build            # Build for production
```

## Architecture

**Monorepo** (NPM workspaces):
- **Frontend** (`time-tracker/`): React 19 + TypeScript + Vite, Tailwind v4, Handsontable, Recharts
- **Backend** (`api/`): Node.js + Express (JS/ES modules), Supabase (PostgreSQL + Auth + RLS)
- **Database** (`database/`): Tables: `weeks`, `user_settings`, `year_memories`, `week_reviews`, `daily_shipping`, `quarterly_plans`, `data_snapshots`

## Key Concepts

**Time Categories**: `W` Work | `M` Mandatory | `P` Procrastination | `R` Rest | `G` Play

**Week Format**: ISO `YYYY-Www` (e.g., `2025-W01`)

**Data Flow**: localStorage cache → API fetch if stale (>1hr) → sync via `useLocalStorageSync` hook

## Important Files

- `time-tracker/src/api.ts` - API client
- `time-tracker/src/types/time.ts` - TypeScript interfaces
- `time-tracker/src/constants/colors.ts` - Category colors
- `database/schema.sql` - PostgreSQL schema

## Design System

- **Borders**: `rounded-xl` (cards/buttons), `rounded-sm` (grid), `rounded-full` (badges)
- **Primary**: Emerald green `#10b981`
- See `docs/DESIGN_SYSTEM.md` for patterns

## Environment

`.env` at project root:
```
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...
```

## Before Completing Tasks

**REQUIRED**: Run TypeScript check after modifying TS/React code:
```bash
cd time-tracker && npx tsc --noEmit
```

**Common errors**:
- `TS1484`: Use `import type { X }` for types (project uses `verbatimModuleSyntax: true`)
- `TS6133`: Remove unused imports/variables
- `TS2322`: Check component prop types (e.g., Modal `title` expects `string`, not JSX)

**Why**: Vercel uses stricter settings than local dev mode. Always run `npx tsc --noEmit` to catch production build errors.
