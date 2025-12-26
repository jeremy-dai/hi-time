# Authentication Setup Guide

This guide covers authentication setup for both **local development** and **production deployment**.

## What's Included?

✅ **Login/Signup UI** - Email/password authentication with automatic session management
✅ **Production-ready** - Uses Supabase Auth with JWT tokens
✅ **Row Level Security (RLS)** - Your data is protected at the database level
✅ **Secure by default** - Users can only access their own data
✅ **No manual token management** - Sessions are handled automatically

---

## Local Development Setup

### 1. Configure Supabase Authentication

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Navigate to **Authentication** → **Providers**
3. **Email** provider should already be enabled by default

**Important for Local Dev**: Email confirmation is enabled by default on hosted Supabase projects. You have two options:

**Option A: Disable Email Confirmation (Recommended for Local Dev)**
1. Go to **Authentication** → **Email Auth**
2. Turn **OFF** "Confirm email"
3. Save

**Option B: Manually Confirm Users**
- After creating users via CLI or signup UI, go to **Authentication** → **Users**
- Click on the user → **"..."** menu → **"Confirm email"**

### 2. Apply Database Security (RLS Policies)

**Critical Step**: This protects your data at the database level.

1. Open your Supabase dashboard
2. Go to **SQL Editor**
3. Copy and run the SQL from `database/setup-rls.sql`:

```bash
cat database/setup-rls.sql
```

This will:
- Enable Row Level Security on `weeks` and `user_settings` tables
- Create policies so users can only access their own data
- Prevent any user (even you!) from accessing another user's data

### 3. Update Your Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` and add your Supabase credentials. For testing, you can also use the pre-configured test user:

```env
# Backend
SUPABASE_URL=https://yourproject.supabase.co
SUPABASE_PUBLISHABLE_KEY=eyJ...  # "anon public" key from Supabase dashboard
SUPABASE_SECRET_KEY=eyJ...        # "service_role" key from dashboard

# Frontend
VITE_SUPABASE_URL=https://yourproject.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...  # Same as above "anon public" key

# API
VITE_API_BASE_URL=http://localhost:8001/api
ALLOW_ORIGIN=http://localhost:5173
PORT=8001

# Test User (Optional)
VITE_TEST_USER_ID=6878982638626404e6d35207
VITE_TEST_USER_EMAIL=jeremy@kawo.com
VITE_TEST_USER_TOKEN=1d655514-6cf4-4657-a08d-a3e35dd7dc50
VITE_TEST_ORG_ID=5bbeb89b746706598113c33a
VITE_TEST_BRAND_ID=5a96553fe4b03ac3f944278a
```

**Where to find these values:**
- Go to Supabase dashboard → **Project Settings** → **API**
- Copy the **Project URL** for `SUPABASE_URL` and `VITE_SUPABASE_URL`
- Copy the **anon public** key for `SUPABASE_PUBLISHABLE_KEY` and `VITE_SUPABASE_PUBLISHABLE_KEY`
- Copy the **service_role** key for `SUPABASE_SECRET_KEY`

### 4. Start the App

```bash
# Start both frontend and backend
make start

# OR manually:
# Terminal 1: Backend
cd api && npm start

# Terminal 2: Frontend
cd time-tracker && npm run dev
```

Visit http://localhost:5173 - you'll see the login page!

### 5. Create Your First User Account

**Method 1: Via Signup UI (Recommended)**

1. Visit http://localhost:5173
2. Click "Don't have an account? Sign up"
3. Enter your email and password
4. Click "Sign Up"
5. **If email confirmation is enabled**: Go to Supabase dashboard → **Authentication** → **Users** → Click user → **"Confirm email"**
6. Go back to http://localhost:5173
7. Click "Already have an account? Sign in"
8. Log in with your credentials

**Method 2: Via CLI (Alternative)**

```bash
cd api
node scripts/create-user.js your@email.com yourpassword
```

If email confirmation is enabled, you still need to confirm the user in the dashboard (step 5 above).

### 6. Import Your Existing Data

If you have CSV files in `raw_data/` to import:

**Step 1: Get Your Auth Token**

```bash
cd api
node scripts/get-auth-token.js your@email.com yourpassword
```

This will output something like:
```
✅ Login successful!

Add this to your .env file:
VITE_AUTH_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

User ID: 7fa3180f-ccab-45c7-84f9-83b0f6eff387
```

**Step 2: Import Data**

```bash
node scripts/import-local-data.js <paste-your-token-here>
```

**Step 3: Log In and View Data**

1. Go to http://localhost:5173
2. Log in with your email and password
3. Your imported data will be visible!

---

## How Authentication Works

### Local Development Flow

1. **Sign up/Login**: Users authenticate through the UI
2. **Session Storage**: Supabase stores the JWT token in browser's localStorage
3. **Auto Refresh**: Sessions automatically refresh before expiring (default: 1 hour)
4. **API Requests**: Frontend includes the token in `Authorization: Bearer <token>` header
5. **Backend Verification**: Backend validates token and creates authenticated Supabase client
6. **RLS Enforcement**: Database policies ensure users only access their own data

### What Happens Behind the Scenes

```
User logs in
    ↓
Supabase Auth creates JWT token
    ↓
Token stored in browser (localStorage)
    ↓
Frontend includes token in API requests
    ↓
Backend verifies token with Supabase
    ↓
Backend creates authenticated Supabase client
    ↓
RLS policies filter data by user_id
    ↓
User sees only their own data
```

### Security Features

- ✅ **Row Level Security (RLS)**: Database-level protection - even admin scripts respect user boundaries
- ✅ **JWT Token Verification**: Every API request validates the token
- ✅ **Automatic Session Refresh**: No manual token management needed
- ✅ **Secure Password Storage**: Supabase handles bcrypt hashing
- ✅ **HTTPS in Production**: Required for secure token transmission
- ⚠️ **Never commit `.env`**: Add to `.gitignore` (already done)

---

## Production Deployment

When you're ready to deploy to production, follow these steps:

### 1. Database (Already Hosted)

Your Supabase database is already hosted and production-ready! No additional deployment needed.

**Pre-Deployment Checklist:**
- ✅ Verify RLS policies are applied (check dashboard → **Database** → **Policies**)
- ✅ Confirm email templates are configured (dashboard → **Authentication** → **Email Templates**)
- ✅ Review auth settings (enable email confirmation for production)

### 2. Deploy Backend API

**Recommended Platforms:**
- [Railway](https://railway.app) - Easiest, supports Node.js
- [Render](https://render.com) - Free tier available
- [Fly.io](https://fly.io) - Great for global deployment

**Environment Variables to Set:**

```env
# Required
SUPABASE_URL=https://yourproject.supabase.co
SUPABASE_PUBLISHABLE_KEY=eyJ...
SUPABASE_SECRET_KEY=eyJ...

# IMPORTANT: Set to your production frontend URL
ALLOW_ORIGIN=https://your-frontend-domain.com

PORT=8001  # or whatever your host requires
```

**Example: Deploy to Railway**

1. Install Railway CLI: `npm install -g @railway/cli`
2. Login: `railway login`
3. Create project: `railway init`
4. Deploy: `railway up`
5. Set environment variables in Railway dashboard
6. Note your backend URL (e.g., `https://your-api.railway.app`)

### 3. Deploy Frontend

**Recommended Platforms:**
- [Vercel](https://vercel.com) - Best for React/Vite (recommended)
- [Netlify](https://netlify.com) - Simple deployment
- [Cloudflare Pages](https://pages.cloudflare.com) - Fast global CDN

**Environment Variables to Set:**

```env
# Required
VITE_SUPABASE_URL=https://yourproject.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...

# Point to your deployed backend
VITE_API_BASE_URL=https://your-api.railway.app/api
```

**Example: Deploy to Vercel**

1. Install Vercel CLI: `npm install -g vercel`
2. Navigate to frontend: `cd time-tracker`
3. Deploy: `vercel`
4. Follow prompts and set environment variables when asked
5. Production URL: `https://your-app.vercel.app`

**Build Configuration:**
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

### 4. Update CORS Settings

**In your backend `.env` or environment variables:**

```env
ALLOW_ORIGIN=https://your-frontend-domain.vercel.app
```

**For multiple origins (dev + production):**

Update `api/src/app.js` to allow both:

```javascript
const allowedOrigins = [
  'http://localhost:5173',
  'https://your-frontend-domain.vercel.app'
]

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  }
}))
```

### 5. Configure Supabase for Production

**Update Site URL:**
1. Go to Supabase dashboard → **Authentication** → **URL Configuration**
2. Set **Site URL** to your production frontend: `https://your-app.vercel.app`

**Add Redirect URLs:**
1. In **URL Configuration**, add:
   - `https://your-app.vercel.app/**`
   - `http://localhost:5173/**` (keep for local dev)

**Enable Email Confirmation:**
1. Go to **Authentication** → **Email Auth**
2. Turn **ON** "Confirm email" for production security
3. Update email templates if needed

### 6. Test Production Deployment

1. Visit your production URL
2. Sign up for a new account
3. Confirm email (check inbox)
4. Log in
5. Try creating/editing time entries
6. Verify data persists

---

## Troubleshooting

### Local Development Issues

#### "Missing Supabase environment variables"

**Cause:** `.env` file not found or missing `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY`

**Fix:**
1. Ensure `.env` exists in project root
2. Restart frontend: `make start` or `cd time-tracker && npm run dev`
3. Verify Vite picks up `.env` from parent dir (check `vite.config.ts` has `envDir: '..'`)

#### "Invalid login credentials"

**Cause:** User account not confirmed or doesn't exist

**Fix:**
1. Check if user exists: Supabase dashboard → **Authentication** → **Users**
2. Confirm user email: Click user → **"..."** → **"Confirm email"**
3. OR disable email confirmation (see step 1 above)

#### "401 Unauthorized" API Errors

**Cause:** Not logged in or invalid token

**Fix:**
1. Make sure you're logged in through the UI
2. Clear browser localStorage and log in again
3. Check browser console for auth errors

#### No Data After Login

**Cause:** Data imported for different user, or RLS policies blocking access

**Fix:**
1. Verify you imported data with YOUR auth token
2. Check user ID matches in dashboard → **Table Editor** → **weeks** → `user_id` column
3. Verify RLS policies exist: dashboard → **Database** → **Policies**

### Production Issues

#### CORS Errors in Production

**Cause:** Backend `ALLOW_ORIGIN` doesn't match frontend URL

**Fix:**
1. Update backend environment variable: `ALLOW_ORIGIN=https://your-frontend.vercel.app`
2. Redeploy backend
3. Verify with: `curl -I https://your-api.railway.app/api/health`

#### Email Confirmation Links Not Working

**Cause:** Supabase Site URL not set correctly

**Fix:**
1. Go to Supabase dashboard → **Authentication** → **URL Configuration**
2. Set **Site URL** to `https://your-frontend.vercel.app`
3. Add to **Redirect URLs**: `https://your-frontend.vercel.app/**`

#### Users Can See Other Users' Data

**Cause:** RLS policies not applied or incorrect

**Fix:**
1. Verify policies exist: Supabase dashboard → **Database** → **Policies**
2. Re-run `database/setup-rls.sql` in SQL Editor
3. Test with two different user accounts in different browsers

---

## Advanced Topics

### Manual Token Management (Optional)

For development workflows where you don't want to log in every time:

**Get Token:**
```bash
node api/scripts/get-auth-token.js your@email.com yourpassword
```

**Add to `.env`:**
```env
VITE_AUTH_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Note:** This bypasses the login UI. Only use for local development automation.

### CLI Scripts

**Create User:**
```bash
node api/scripts/create-user.js email@example.com password123
```

**Get Auth Token:**
```bash
node api/scripts/get-auth-token.js email@example.com password123
```

**Import Data:**
```bash
node api/scripts/import-local-data.js <your-auth-token>
```

### Multi-User Testing

Test data isolation locally:

```bash
# Create two users
node api/scripts/create-user.js user1@test.com pass1
node api/scripts/create-user.js user2@test.com pass2

# Confirm both in Supabase dashboard
# Log in as user1 in Chrome
# Log in as user2 in Incognito/Firefox
# Verify each user sees only their own data
```

### Extending Authentication

Add more auth providers (Google, GitHub, etc.):

**In Supabase Dashboard:**
1. Go to **Authentication** → **Providers**
2. Enable desired provider (e.g., Google OAuth)
3. Configure OAuth credentials

**In Your Code:**

```typescript
import { supabase } from './lib/supabase'

async function signInWithGoogle() {
  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin
    }
  })
}
```

---

## Questions?

**Official Docs:**
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [JavaScript Client](https://supabase.com/docs/reference/javascript/auth-signup)

**Common Issues:**
- Check browser console for detailed error messages
- Verify environment variables are set correctly
- Confirm RLS policies are applied
- Test with a fresh incognito window

**Still stuck?** Check the error logs:
- Frontend: Browser console (F12)
- Backend: Terminal where API is running
- Database: Supabase dashboard → **Logs**
