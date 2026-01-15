# Database Schema

> **Quick Setup:** The complete database schema is available in [database/schema.sql](../database/schema.sql). Run this file in your Supabase SQL Editor to create all tables, indexes, and security policies.

## Tables

### `weeks`
Stores the weekly time tracking data.

```sql
create table weeks (
  id uuid default gen_random_uuid() primary key,
  user_id text not null,
  year integer not null,
  week_number integer not null,
  week_data jsonb not null default '[]'::jsonb,
  starting_hour integer default 8,
  theme text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (user_id, year, week_number)
);

create index idx_weeks_user_year_week on weeks(user_id, year, week_number);
```

### `user_settings`
Stores user preferences, including subcategories.

```sql
create table user_settings (
  user_id text primary key,
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```

### `year_memories`
Stores daily memories with mood tracking and tags, organized by year.

```sql
create table year_memories (
  id uuid default gen_random_uuid() primary key,
  user_id text not null,
  year integer not null,
  memories jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (user_id, year)
);

create index idx_year_memories_user_year on year_memories(user_id, year);
```

#### Memories JSON Structure

The `memories` column stores a JSON object mapping dates to memory objects:

```json
{
  "2025-01-01": {
    "date": "2025-01-01",
    "memory": "Had a great day!",
    "tags": ["work", "achievement"],
    "mood": "great",
    "createdAt": 1704067200000,
    "updatedAt": 1704067200000
  },
  "2025-01-02": {
    "date": "2025-01-02",
    "memory": "Relaxing weekend",
    "mood": "good",
    "createdAt": 1704153600000,
    "updatedAt": 1704153600000
  }
}
```

**Memory Object Fields:**
- `date` (string, required): Date in YYYY-MM-DD format
- `memory` (string, required): The memory text content
- `tags` (string[], optional): Optional tags/categories
- `mood` (string, optional): One of: 'great', 'good', 'neutral', 'bad', 'terrible'
- `createdAt` (number, required): Unix timestamp in milliseconds
- `updatedAt` (number, required): Unix timestamp in milliseconds

### `week_reviews`
Stores weekly reflection entries organized by year and ISO week number.

```sql
create table week_reviews (
  id uuid default gen_random_uuid() primary key,
  user_id text not null,
  year integer not null,
  week_number integer not null,
  review text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, year, week_number),
  check (week_number >= 0 and week_number <= 53),
  check (year >= 2000 and year <= 2100)
);

create index idx_week_reviews_user_id on week_reviews(user_id);
create index idx_week_reviews_user_year on week_reviews(user_id, year);
create index idx_week_reviews_user_year_week on week_reviews(user_id, year, week_number);
```

**Special Convention:**
- `week_number = 0` is reserved for **annual reviews** (yearly retrospectives)
- `week_number 1-53` are standard ISO week numbers for weekly reviews

### `daily_shipping`
Stores daily "what did you ship today" entries with completion tracking.

```sql
create table daily_shipping (
  id uuid default gen_random_uuid() primary key,
  user_id text not null,
  year integer not null,
  month integer not null,
  day integer not null,
  shipped text not null,
  completed boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, year, month, day),
  check (month >= 1 and month <= 12),
  check (day >= 1 and day <= 31),
  check (year >= 2000 and year <= 2100)
);

create index idx_daily_shipping_user_id on daily_shipping(user_id);
create index idx_daily_shipping_user_year on daily_shipping(user_id, year);
create index idx_daily_shipping_user_date on daily_shipping(user_id, year, month, day);
```

**Fields:**
- `shipped` (text): What the user shipped/accomplished that day
- `completed` (boolean): Whether the item has been marked as done

**Implementation Details:**
- Uses **Cache-First Pattern**: localStorage cache loads instantly, then syncs with database in background
- Optimistic updates with instant UI feedback and error recovery
- Year-based API endpoint for efficient bulk loading: `GET /api/shipping/{year}`
- Automatic localStorage cache management via `useDailyShipping` hook
- Individual entries saved to database immediately: `PUT /api/shipping/{year}/{month}/{day}`

### `quarterly_plans` 🆕
Stores quarterly planning data following the JSON structure defined below. **Migration available** at [database/migrations/02_quarterly_plans.sql](../database/migrations/02_quarterly_plans.sql).

```sql
CREATE TABLE IF NOT EXISTS quarterly_plans (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text NOT NULL,
  plan_id text NOT NULL,
  plan_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE (user_id, plan_id)
);

CREATE INDEX IF NOT EXISTS idx_quarterly_plans_user_id ON quarterly_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_quarterly_plans_user_plan ON quarterly_plans(user_id, plan_id);
```

**Implementation Details:**
- Uses **Pattern 2 (Debounced Sync)**: Database is source of truth, 5-second debounce for frontend updates
- Supports multiple plans per user via `plan_id` field
- Complete plan structure stored in `plan_data` JSONB column
- See [Plan JSON Format](#plan-json-format) section below for complete structure

**Current Status:**
- ✅ Database migration created
- ✅ Backend API endpoints implemented (`/api/plans/*`)
- ✅ Frontend hook implemented ([`useQuarterlyPlan`](../time-tracker/src/hooks/useQuarterlyPlan.ts))
- ✅ Mission Control UI with inline editing and sync status

### `data_snapshots` 🆕
Stores historical snapshots of data for version control and recovery. **Migration available** at [database/migrations/01_history_table.sql](../database/migrations/01_history_table.sql).

```sql
CREATE TABLE IF NOT EXISTS data_snapshots (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  entity_type text NOT NULL, -- 'week', 'settings', etc.
  entity_key text NOT NULL, -- e.g., '2024-W01'
  snapshot_type text CHECK (snapshot_type IN ('manual', 'auto', 'restore')),
  description text,
  data jsonb NOT NULL,
  metadata jsonb
);

CREATE INDEX IF NOT EXISTS idx_data_snapshots_user_entity ON data_snapshots(user_id, entity_type, entity_key);
CREATE INDEX IF NOT EXISTS idx_data_snapshots_created_at ON data_snapshots(created_at);
```

**Use Cases:**
- **Data Recovery**: Restore previous versions if data is lost or corrupted
- **Version History**: Track changes over time for audit/debugging
- **Conflict Resolution**: Compare versions when sync conflicts occur

**Snapshot Types:**
- `manual`: User-initiated backups via History Modal
- `auto`: Automatic snapshots before risky operations (CSV imports, bulk edits)
- `restore`: Created when restoring from a previous snapshot

**Current Status:**
- ✅ Database migration created
- ✅ Backend API endpoints implemented (`/api/snapshots/*`)
- ✅ Frontend hook implemented ([`useHistory`](../time-tracker/src/hooks/useHistory.ts))
- ✅ History Modal with sync status indicator

## Security (Row Level Security)

Enable RLS to ensure users can only access their own data.

For detailed RLS setup instructions, see the [Authentication Setup Guide](AUTHENTICATION_SETUP.md).

```sql
-- Enable RLS
alter table weeks enable row level security;
alter table user_settings enable row level security;
alter table year_memories enable row level security;
alter table week_reviews enable row level security;
alter table daily_shipping enable row level security;
alter table quarterly_plans enable row level security; -- 🆕
alter table data_snapshots enable row level security; -- 🆕

-- Policies
create policy "Users can only access their own weeks"
on weeks for all
using (auth.uid()::text = user_id)
with check (auth.uid()::text = user_id);

create policy "Users can only access their own settings"
on user_settings for all
using (auth.uid()::text = user_id)
with check (auth.uid()::text = user_id);

create policy "Users can only access their own memories"
on year_memories for all
using (auth.uid()::text = user_id)
with check (auth.uid()::text = user_id);

create policy "Users can only access their own week reviews"
on week_reviews for all
using ((select auth.uid())::text = user_id)
with check ((select auth.uid())::text = user_id);

create policy "Users can only access their own daily shipping"
on daily_shipping for all
using ((select auth.uid())::text = user_id)
with check ((select auth.uid())::text = user_id);

-- 🆕 Quarterly plans policy
create policy "Users can only access their own quarterly plans"
on quarterly_plans for all
using ((select auth.uid())::text = user_id)
with check ((select auth.uid())::text = user_id);

-- 🆕 Snapshots policy
create policy "Users can only access their own snapshots"
on data_snapshots for all
using ((select auth.uid())::text = user_id)
with check ((select auth.uid())::text = user_id);
```

## Setup Instructions

Run the complete schema from [database/schema.sql](../database/schema.sql) in your Supabase SQL Editor. This creates all tables, indexes, and RLS policies in one step.

---

## Plan JSON Format (V2)

The `quarterly_plans.plan_data` JSONB column stores a complete planning document using the structure defined below.

**Guiding Principle**: Store only **canonical fields** in the database and **derive the rest** (week numbers, cycle ranges, dates, KPI values) in code.

### Schema Version

Current version: `2`

```json
{
  "schema_version": 2
}
```

### Top-Level Structure

```json
{
  "plan": { ... },
  "work_types": [ ... ],
  "templates": { ... },
  "weekly_habit": { ... },
  "cycles": [ ... ]
}
```

### `plan` Object

Canonical plan metadata + the **single anchor** used to compute derived week/date fields.

```json
{
  "id": "string",
  "name": "string",
  "description": "string",
  "created_at": "YYYY-MM-DD",
  "updated_at": "YYYY-MM-DD",
  "anchor_date": "YYYY-MM-DD",
  "timezone": "IANA timezone, e.g. Asia/Shanghai"
}
```

**Notes:**
- `plan.anchor_date` is the only required date input
- All week dates are derived from this anchor point
- Week indices map to dates: `start_date + (week_index * 7 days)`

### `work_types` Array (New in V2)

Defines the types of work being tracked (replacing categories and trackers).

```json
{
  "id": "tech",
  "name": "Engineering",
  "color": "blue", // tailwind color name
  "kpi_target": {
    "unit": "hours",
    "weekly_value": 20
  }
}
```

### `templates` Object (New in V2)

Reusable Markdown templates for deliverables.

```json
{
  "product_spec": "## Problem\n...\n## Solution\n...",
  "weekly_log": "## Highlights\n..."
}
```

### `weekly_habit` Object

Reusable weekly ritual/check-in.

```json
{
  "name": "string",
  "timing": "string",
  "questions": ["string", "..."],
  "logs": []
}
```

### `cycles` Array

A cycle groups multiple weeks.

```json
{
  "id": "string",
  "name": "string",
  "theme": "string (optional)",
  "description": "string (optional)",
  "status": "not_started|in_progress|completed (optional)",
  "weeks": [ ... ]
}
```

### `weeks` Array (within a cycle)

Weeks contain the actionable plan.

```json
{
  "theme": "string (optional)",
  "goals": ["string", "..."], // Replaces focus_areas
  
  "todos": [ ... ],
  "deliverables": [ ... ],
  
  "reflection_questions": [ ... ], // Replaces product_questions
  "acceptance_criteria": [ ... ] // Replaces validation_criteria
}
```

**Note**: `week_number` is optional and usually derived from the array index.

### `todos` Array

Linked to `work_types` for KPI calculation.

```json
{
  "id": "string",
  "title": "string",
  "type_id": "string", // Links to work_types.id
  "priority": "low|medium|high",
  "estimate": 1, // Hours or points
  "status": "not_started|in_progress|blocked|done",
  "dependencies": ["todo_id", "..."]
}
```

### `deliverables` Array

Linked to `templates`.

```json
{
  "id": "string",
  "title": "string",
  "type_id": "string", // Links to work_types.id
  "template_id": "string", // Links to templates key
  "status": "not_started|in_progress|done"
}
```
