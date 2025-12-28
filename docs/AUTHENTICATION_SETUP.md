# Authentication Setup Guide

This guide covers authentication setup for the Hi-Time application using Supabase Auth.

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

Edit `.env` and add your Supabase credentials:

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

See the [CLI Scripts Guide](SCRIPTS.md) for more details on user management scripts.

### 6. Import Your Existing Data (Optional)

If you have CSV files to import, see the [CLI Scripts Guide](SCRIPTS.md) for detailed instructions.

**Quick steps:**
1. Get your auth token: `node scripts/get-auth-token.js your@email.com yourpassword`
2. Place CSV files (named `YYYY-MM-DD.csv`) in `raw_data/`
3. Run import: `node scripts/import-local-data.js <your-token>`
4. Log in at http://localhost:5173 to view your data

---

## How Authentication Works

### Authentication Flow

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

## Row Level Security (RLS)

RLS is the most critical security feature. It ensures data isolation at the database level.

### How RLS Works

**Without RLS:**
```sql
SELECT * FROM weeks;
-- Returns ALL users' data ❌
```

**With RLS:**
```sql
SELECT * FROM weeks;
-- Returns ONLY current user's data ✅
```

### RLS Policies

The `database/setup-rls.sql` file creates these policies:

**For `weeks` table:**
- Users can SELECT their own rows (`user_id = auth.uid()`)
- Users can INSERT rows with their own user_id
- Users can UPDATE their own rows
- Users can DELETE their own rows

**For `user_settings` table:**
- Same pattern - users can only access their own settings

### Testing RLS

Create two users and verify isolation:

```bash
# See CLI Scripts Guide for detailed multi-user testing
cd api
node scripts/create-user.js user1@test.com pass1
node scripts/create-user.js user2@test.com pass2

# Log in as user1 in Chrome
# Log in as user2 in Firefox/Incognito
# Verify each sees only their own data
```

---

## Production Configuration

For production deployment, see the [Deployment Guide](DEPLOYMENT.md).

**Key differences for production:**

1. **Enable Email Confirmation**
   - Go to **Authentication** → **Email Auth**
   - Turn **ON** "Confirm email"

2. **Configure Site URL**
   - Go to **Authentication** → **URL Configuration**
   - Set **Site URL** to your production frontend URL

3. **Add Redirect URLs**
   - Add production URL: `https://your-app.vercel.app/**`
   - Keep localhost for development: `http://localhost:5173/**`

4. **Update Environment Variables**
   - Set production URLs for `ALLOW_ORIGIN` and `VITE_API_BASE_URL`

See [Deployment Guide](DEPLOYMENT.md) for complete production setup instructions.

---

## Troubleshooting

### "Missing Supabase environment variables"

**Cause:** `.env` file not found or missing variables

**Fix:**
1. Ensure `.env` exists in project root
2. Verify it has `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`
3. Restart frontend: `make start` or `cd time-tracker && npm run dev`

### "Invalid login credentials"

**Cause:** User account not confirmed or doesn't exist

**Fix:**
1. Check if user exists: Supabase dashboard → **Authentication** → **Users**
2. Confirm user email: Click user → **"..."** → **"Confirm email"**
3. OR disable email confirmation (see step 1 above)

### "401 Unauthorized" API Errors

**Cause:** Not logged in or invalid token

**Fix:**
1. Make sure you're logged in through the UI
2. Clear browser localStorage and log in again
3. Check browser console for auth errors

### No Data After Login

**Cause:** Data imported for different user, or RLS policies blocking access

**Fix:**
1. Verify you imported data with YOUR auth token
2. Check user ID matches in dashboard → **Table Editor** → **weeks** → `user_id` column
3. Verify RLS policies exist: dashboard → **Database** → **Policies**

### Users Can See Other Users' Data

**Cause:** RLS policies not applied or incorrect

**Fix:**
1. Verify policies exist: Supabase dashboard → **Database** → **Policies**
2. Re-run `database/setup-rls.sql` in SQL Editor
3. Test with two different user accounts in different browsers

---

## Extending Authentication

### Adding OAuth Providers

Supabase supports Google, GitHub, and other OAuth providers.

**In Supabase Dashboard:**
1. Go to **Authentication** → **Providers**
2. Enable desired provider (e.g., Google OAuth)
3. Configure OAuth credentials from provider (Google Cloud Console, etc.)

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

Update your login component to include the OAuth button:

```tsx
<button onClick={signInWithGoogle}>
  Sign in with Google
</button>
```

### Adding Password Reset

Supabase includes built-in password reset functionality:

```typescript
// Request password reset
await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${window.location.origin}/update-password`
})

// Update password (on reset page)
await supabase.auth.updateUser({
  password: newPassword
})
```

Configure reset email template in Supabase dashboard → **Authentication** → **Email Templates**.

---

## Additional Resources

**Official Docs:**
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [JavaScript Client](https://supabase.com/docs/reference/javascript/auth-signup)

**Related Guides:**
- [CLI Scripts Guide](SCRIPTS.md) - User management and data import
- [Deployment Guide](DEPLOYMENT.md) - Production setup
- [Database Schema](DATABASE_SCHEMA.md) - Database structure

**Common Issues:**
- Check browser console for detailed error messages
- Verify environment variables are set correctly
- Confirm RLS policies are applied
- Test with a fresh incognito window

**Still stuck?** Check the error logs:
- Frontend: Browser console (F12)
- Backend: Terminal where API is running
- Database: Supabase dashboard → **Logs**
