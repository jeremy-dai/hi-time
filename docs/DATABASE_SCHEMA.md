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

-- 🆕 Snapshots policy
create policy "Users can only access their own snapshots"
on data_snapshots for all
using ((select auth.uid())::text = user_id)
with check ((select auth.uid())::text = user_id);
```

## Setup Instructions

Run the complete schema from [database/schema.sql](../database/schema.sql) in your Supabase SQL Editor. This creates all tables, indexes, and RLS policies in one step.
