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

## Migration Plan

1.  **Create `user_settings` table**: Run the SQL above in Supabase SQL Editor.
