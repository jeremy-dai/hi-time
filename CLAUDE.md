# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
# Install dependencies (from root)
npm install

# Start both frontend and API concurrently (recommended)
npm run dev

# Start frontend only (http://localhost:5173)
npm run dev --workspace=time-tracker

# Start API only (http://localhost:8001)
npm run start --workspace=api

# Build frontend for production
npm run build

# Lint frontend code
npm run lint --workspace=time-tracker

# Run frontend tests
npm test --workspace=time-tracker

# Run a single test file
npx vitest run time-tracker/src/utils/date.test.ts
```

## Architecture Overview

This is a **monorepo** (NPM workspaces) with two packages:

### Frontend (`time-tracker/`)
- React 19 + TypeScript + Vite
- Tailwind CSS v4
- Handsontable for the calendar grid
- Recharts for analytics visualizations
- State management via React hooks + localStorage caching

### Backend (`api/`)
- Node.js + Express (plain JavaScript, ES modules)
- Supabase (PostgreSQL) for persistence
- JWT-based authentication with Supabase Auth
- Row-Level Security (RLS) policies for multi-tenant data isolation

### Database (`database/`)
- PostgreSQL schema in `schema.sql`
- Tables: `weeks`, `user_settings`, `year_memories`, `week_reviews`, `daily_shipping`, `quarterly_plans`, `data_snapshots`

## Key Concepts

### Time Categories
Single-letter keys used throughout the codebase:
- `W` = Work (Productive)
- `M` = Mandatory (Chores/Admin)
- `P` = Procrastination
- `R` = Rest
- `G` = Play (Guilty Free)
- `''` = Empty/Unset

### Week Key Format
ISO week format: `YYYY-Www` (e.g., `2025-W01` for week 1 of 2025)

### Data Flow
1. Frontend loads week data from localStorage cache first
2. Fetches from API if cache is stale (>1 hour) or missing
3. Saves to both localStorage and API on changes
4. `useLocalStorageSync` hook manages sync state and conflict detection

## File Structure Highlights

```
time-tracker/src/
├── App.tsx              # Main app, routing, week navigation
├── api.ts               # API client for all backend calls
├── components/
│   ├── calendar/        # Handsontable-based timesheet
│   ├── dashboard/       # Analytics charts and summaries
│   ├── insights/        # Annual insights and trends
│   ├── shared/          # Reusable UI (Modal, Toast, etc.)
│   └── layout/          # App shell, header, sidebar
├── hooks/               # Custom React hooks
│   ├── useLocalStorageSync.ts  # Sync management
│   └── useHistory.ts           # Version history/snapshots
├── constants/
│   └── colors.ts        # Category color definitions
├── types/
│   └── time.ts          # TypeScript interfaces
└── utils/
    ├── date.ts          # ISO week calculations
    └── analytics.ts     # Statistics and aggregations
```

## Design System

- **Border radius**: `rounded-xl` for cards/buttons, `rounded-sm` for grid elements, `rounded-full` for badges
- **Primary color**: Emerald green (`#10b981`)
- **Category colors**: Defined in `time-tracker/src/constants/colors.ts`
- See `docs/DESIGN_SYSTEM.md` for complete patterns

## Environment Variables

Required in `.env` at project root:
```
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...
```

## Pre-Completion Checklist

**IMPORTANT**: Before finishing any task that modifies TypeScript/React code, you MUST run the TypeScript compiler to catch build errors:

```bash
# Run from project root - this catches production build errors
cd time-tracker && npx tsc --noEmit
```

### Common Build Errors to Watch For

1. **Type-only imports with `verbatimModuleSyntax`**
   - The project uses `verbatimModuleSyntax: true` in tsconfig
   - Types must use `import type { X }` syntax, not `import { X }`
   - If importing both values and types: `import { func } from './api'` and `import type { Type } from './api'` separately
   - Error: `TS1484: 'X' is a type and must be imported using a type-only import`

2. **Unused imports/variables**
   - TypeScript strict mode flags unused imports as errors
   - Error: `TS6133: 'X' is declared but its value is never read`

3. **Component prop type mismatches**
   - Check existing component interfaces before passing props
   - Common issue: passing React elements where strings are expected (e.g., Modal `title` prop expects `string`, not `JSX.Element`)
   - Error: `TS2322: Type 'Element' is not assignable to type 'string'`

4. **API function signatures**
   - When adding new API functions, ensure return types match usage
   - Check existing patterns in `api.ts` for consistency

### Verification Steps

After making changes:
1. **TypeScript check**: `cd time-tracker && npx tsc --noEmit`
2. **API syntax check**: `cd api && node --check src/app.js`
3. **Lint** (optional but recommended): `npm run lint --workspace=time-tracker`

### Why Local `npm run build` May Pass But Production Fails

- Vercel uses stricter TypeScript settings
- Local dev mode (`npm run dev`) doesn't run full type checking
- Always run `npx tsc --noEmit` to simulate production build checks
