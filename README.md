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
- **Dark Mode First**: Sleek, modern dark-themed UI for comfortable all-day usage.
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
  - MongoDB (Persistence)
  - CSV parsing/export logic

## 🛠️ Setup & Run

### Prerequisites
- Node.js (v18+)
- MongoDB (running locally on port 27017)

### Quick Start

1.  **Install Dependencies**
    ```bash
    make install
    ```

2.  **Configure Environment**
    ```bash
    make dev
    # This creates a .env file. Open it and verify the settings.
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
4.  **Save**: Data is automatically saved to MongoDB if the backend is running.

## 🚀 Deployment

### Database Hosting with MongoDB Atlas

For production deployment, use MongoDB Atlas (free tier available):

1. **Create MongoDB Atlas Account**
   - Sign up at [mongodb.com/cloud/atlas/register](https://www.mongodb.com/cloud/atlas/register)
   - Create a new cluster (M0 Sandbox - Free tier)

2. **Configure Database Access**
   - Go to Database Access → Add New Database User
   - Create a username and password (save these!)
   - Set permissions to "Read and write to any database"

3. **Configure Network Access**
   - Go to Network Access → Add IP Address
   - For development: Click "Allow Access from Anywhere" (0.0.0.0/0)
   - For production: Add your specific IP addresses

4. **Get Connection String**
   - Go to Database → Connect → Connect your application
   - Select "Driver: Node.js"
   - Copy the connection string:
     ```
     mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
     ```
   - Replace `<username>` and `<password>` with your credentials

5. **Update Environment Variables**
   - **Local `.env`**: Keep using `mongodb://localhost:27017/` for development
   - **Production (Vercel)**: Add environment variables in Vercel dashboard:
     ```
     MONGO_URL=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/
     DB_NAME=kevin_db
     COLLECTION=time_tracker_weeks
     ```

### Deploy to Vercel

This project is configured for Vercel deployment:

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard:
# Settings → Environment Variables → Add MONGO_URL, DB_NAME, etc.
```

Your app will be live at `https://your-project.vercel.app`
