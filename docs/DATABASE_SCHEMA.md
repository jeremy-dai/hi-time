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

## Security (Row Level Security)

Enable RLS to ensure users can only access their own data.

```sql
-- Enable RLS
alter table weeks enable row level security;
alter table user_settings enable row level security;

-- Policies
create policy "Users can only access their own weeks"
on weeks for all
using (auth.uid()::text = user_id)
with check (auth.uid()::text = user_id);

create policy "Users can only access their own settings"
on user_settings for all
using (auth.uid()::text = user_id)
with check (auth.uid()::text = user_id);
```

## Migration Plan

1.  **Run SQL**: Run the SQL above in Supabase SQL Editor.
