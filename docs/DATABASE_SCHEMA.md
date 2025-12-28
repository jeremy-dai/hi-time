# Database Schema

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

## Security (Row Level Security)

Enable RLS to ensure users can only access their own data.

For detailed RLS setup instructions, see the [Authentication Setup Guide](AUTHENTICATION_SETUP.md).

```sql
-- Enable RLS
alter table weeks enable row level security;
alter table user_settings enable row level security;
alter table year_memories enable row level security;

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
```

## Migration Plan

1.  **Run SQL**: Run the SQL above in Supabase SQL Editor.
