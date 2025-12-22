# Hi-Time Monorepo

A modern time logging and analysis application designed to help you track, categorize, and optimize your weekly productivity.

## 🚀 Features

- **Modern Calendar View**: Floating event cards with traditional calendar styling, drag-to-create and resize support.
- **Ghost Mode** 👻: Automatically shows last year's same week as reference (in transparent style). Double-click to activate ghost events as real entries - perfect for recurring schedules!
- **Category Management**: Organize time into key categories:
  - 🟢 **Rest** (Recharging)
  - 🟡 **Productive Work** (Deep focus)
  - 🔵 **Guilty Free Play** (Leisure)
  - 🔴 **Procrastination** (Time waste)
  - 🟠 **Mandatory Work** (Chores/Admin)
- **Analytics Dashboard**: Visualize your productivity with:
  - Weekly breakdowns and trends
  - Category distribution charts
  - Productivity scores
- **Data Portability**: Import/Export weekly data via CSV.

## 🏗️ Architecture

This project is a **Monorepo** managed with NPM Workspaces, consisting of:

- **Frontend (`time-tracker/`)**:
  - React 19 + TypeScript + Vite
  - Tailwind CSS v4 (Dark mode enabled)
  - Recharts for analytics
  - Lucide React icons
- **Backend (`api/`)**:
  - Node.js + Express
  - Supabase (PostgreSQL) (Persistence)
  - CSV parsing/export logic

## 🛠️ Setup & Run

### Prerequisites
- Node.js (v18+)
- Supabase Project (PostgreSQL)

### Quick Start

1.  **Install Dependencies**
    ```bash
    make install
    ```

2.  **Configure Environment**
    ```bash
    make dev
    # This creates a .env file. Open it and add your SUPABASE_URL and SUPABASE_KEY.
    ```

3.  **Start Development Servers** ⭐

    **Option A: Start Both at Once** (Recommended - One Command!)
    ```bash
    make start
    # or
    npm run dev
    ```

    This launches:
    - 🌐 **Frontend** at http://localhost:5173
    - 🛠️ **API** at http://localhost:8001

    Both servers run with colored output for easy identification. Stopping one automatically stops the other.

    **Option B: Start Separately** (Two Terminals)
    ```bash
    # Terminal 1 - Frontend
    make web

    # Terminal 2 - Backend
    make api
    ```

### Other Commands
- `make clean`: Remove build artifacts and `node_modules`.
- `make status`: Check git status.

## 📂 Project Structure

```
.
├── api/                 # Backend API service
├── time-tracker/        # Frontend React application
├── Makefile             # Command shortcuts
├── package.json         # Root workspace config
└── .env.example         # Environment variable template
```

## 📝 Usage Guide

1.  **Log Time**: Go to the **Timesheet** tab. Click and drag on the calendar to create time blocks.
2.  **Categorize**: Right-click a block to assign a category (Work, Rest, etc.).
3.  **Analyze**: Switch to the **Dashboard** to see your weekly stats and trends.
4.  **Save**: Data is automatically saved to Supabase if the backend is running.

## 🚀 Deployment

### Database Hosting with Supabase

This project uses Supabase (PostgreSQL) for data storage.

1. **Create Supabase Project**
   - Sign up at [supabase.com](https://supabase.com)
   - Create a new project

2. **Run Schema SQL**
   - Go to the SQL Editor in Supabase.
   - Run the following SQL to create the table:

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

3. **Get Credentials**
   - Go to Project Settings -> API.
   - Copy the **Project URL** (`SUPABASE_URL`).
   - Copy the **Publishable Key** (`SUPABASE_PUBLISHABLE_KEY`) for client-side use.
   - Copy the **Secret Key** (`SUPABASE_SECRET_KEY`) for server-side use.

4. **Update Environment Variables**
   - **Local `.env`**:
     ```
     SUPABASE_URL=https://<your-project>.supabase.co
     SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
     SUPABASE_SECRET_KEY=sb_secret_...
     ```
   - **Production (Vercel)**: Add these environment variables in the Vercel dashboard.

### Deploy to Vercel

This project is configured for Vercel deployment:

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard:
# Settings → Environment Variables → Add SUPABASE_URL and SUPABASE_SECRET_KEY
```

Your app will be live at `https://your-project.vercel.app`

### Populate Supabase database with CSV files.
Run the script :
```
node api/scripts/import-local-data.js
```

- Read CSV files from raw_data/ .
- Parse filenames like 2025 Time-10.3.csv .
  - It interprets this as Year 2025, Month 10, Week 3 .
  - It converts this into an approximate ISO Week Number (e.g., Week 42) for the database.
- Parse the CSV content using the existing parseTimeCSV logic.
- Upsert the data into your Supabase weeks table.