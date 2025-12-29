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
- **Polished UI**: Modern design system with reusable components (toast notifications, modals, skeleton loaders)
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

## 📖 Documentation

### Getting Started
- [Authentication Setup](docs/AUTHENTICATION_SETUP.md) - Configure Supabase auth, RLS policies, and user management
- [CLI Scripts Guide](docs/SCRIPTS.md) - Create users, get auth tokens, and import data

### Technical References
- [Database Schema](docs/DATABASE_SCHEMA.md) - Database structure and relationships
- [Database Efficiency Analysis](docs/DATABASE_EFFICIENCY.md) - Performance optimization details
- [API Documentation](docs/API.md) - Backend API endpoints and usage
- **[Design System](time-tracker/DESIGN_SYSTEM.md)** - UI components, colors, typography, and usage patterns

### Deployment
- [Production Deployment](docs/DEPLOYMENT.md) - Deploy to Vercel, Railway, Render, and more

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

## 📊 Importing Existing Data

### CSV Import (Recommended)

**CSV Format:** The app uses a standardized CSV format where:
- Columns are **always** in order: Sunday, Monday, Tuesday, Wednesday, Thursday, Friday, Saturday
- Files are named `YYYY-MM-DD.csv` where the date is the **Sunday** of that week
- Each row represents a 30-minute time slot (08:00, 08:30, 09:00, etc.)

#### Quick Import Steps

**1. Get Your User ID**
```bash
cd api
node scripts/get-user-id.js
```

**2. Prepare CSV Files**

Place CSV files in `raw_data/` directory with Sunday-date naming:
```
2024-12-29.csv  → Week starting Sunday Dec 29, 2024 (ISO Week 2024-W52)
2025-01-05.csv  → Week starting Sunday Jan 5, 2025 (ISO Week 2025-W01)
2025-01-12.csv  → Week starting Sunday Jan 12, 2025 (ISO Week 2025-W02)
```

**3. Run Batch Import**
```bash
node scripts/import-local-data-direct.js <your-user-id>
```

The script will:
- ✅ Parse all CSV files in `raw_data/`
- ✅ Calculate correct ISO week numbers automatically
- ✅ Perform single batch upsert to database (fast & reliable)
- ✅ Map columns correctly: Sunday (col 1) → database index 6, Monday (col 2) → index 0, etc.

**4. Clear Browser Cache & Refresh**

After import, clear localStorage in your browser (F12 → Application → Local Storage → Clear All) and refresh the page to load the new data.

---

For detailed instructions and troubleshooting, see the [CLI Scripts Guide](docs/SCRIPTS.md).