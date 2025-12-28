# Production Deployment Guide

This guide covers deploying the Hi-Time application to production.

## Prerequisites

Before deploying to production:

- ✅ Verify RLS policies are applied (Supabase dashboard → **Database** → **Policies**)
- ✅ Confirm email templates are configured (dashboard → **Authentication** → **Email Templates**)
- ✅ Review auth settings (enable email confirmation for production)
- ✅ Test the application locally with authentication enabled

See [Authentication Setup](AUTHENTICATION_SETUP.md) for auth configuration details.

---

## 1. Database (Supabase)

Your Supabase database is already hosted and production-ready! No additional deployment needed.

### Production Checklist

1. **Verify RLS Policies**
   - Go to Supabase dashboard → **Database** → **Policies**
   - Ensure policies exist for `weeks` and `user_settings` tables
   - Test with multiple user accounts to verify data isolation

2. **Configure Email Settings**
   - Go to **Authentication** → **Email Auth**
   - Enable "Confirm email" for production security
   - Customize email templates if needed (dashboard → **Authentication** → **Email Templates**)

3. **Get Production Credentials**
   - Go to **Project Settings** → **API**
   - Copy **Project URL** → `SUPABASE_URL`
   - Copy **anon public** key → `SUPABASE_PUBLISHABLE_KEY`
   - Copy **service_role** key → `SUPABASE_SECRET_KEY` (backend only)

---

## 2. Deploy Backend API

### Recommended Platforms

- **[Railway](https://railway.app)** - Easiest, supports Node.js
- **[Render](https://render.com)** - Free tier available
- **[Fly.io](https://fly.io)** - Great for global deployment

### Environment Variables

Set these in your hosting platform:

```env
# Required
SUPABASE_URL=https://yourproject.supabase.co
SUPABASE_PUBLISHABLE_KEY=eyJ...
SUPABASE_SECRET_KEY=eyJ...

# CORS - Set to your production frontend URL
ALLOW_ORIGIN=https://your-frontend-domain.com

# Port (adjust based on hosting platform)
PORT=8001
```

### Example: Deploy to Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Create project
railway init

# Deploy from api/ directory
cd api
railway up

# Set environment variables in Railway dashboard
# Settings → Variables → Add variables listed above

# Note your backend URL
# Example: https://your-api.railway.app
```

### Example: Deploy to Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **New** → **Web Service**
3. Connect your repository
4. Configure:
   - **Root Directory**: `api`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: Node
5. Add environment variables (see above)
6. Click **Create Web Service**
7. Note your backend URL (e.g., `https://your-api.onrender.com`)

---

## 3. Deploy Frontend

### Recommended Platforms

- **[Vercel](https://vercel.com)** - Best for React/Vite (recommended)
- **[Netlify](https://netlify.com)** - Simple deployment
- **[Cloudflare Pages](https://pages.cloudflare.com)** - Fast global CDN

### Environment Variables

Set these in your hosting platform:

```env
# Required
VITE_SUPABASE_URL=https://yourproject.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...

# Point to your deployed backend
VITE_API_BASE_URL=https://your-api.railway.app/api
```

### Example: Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Navigate to frontend
cd time-tracker

# Deploy
vercel

# Follow prompts and set environment variables when asked
# Production URL: https://your-app.vercel.app
```

**Build Configuration:**
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`
- Root Directory: `time-tracker`

### Example: Deploy to Netlify

1. Go to [Netlify Dashboard](https://app.netlify.com)
2. Click **Add new site** → **Import an existing project**
3. Connect your repository
4. Configure:
   - **Base directory**: `time-tracker`
   - **Build command**: `npm run build`
   - **Publish directory**: `time-tracker/dist`
5. Add environment variables (see above)
6. Click **Deploy site**
7. Note your frontend URL (e.g., `https://your-app.netlify.app`)

---

## 4. Configure CORS

Your backend needs to allow requests from your production frontend domain.

### Single Origin

Update your backend environment variable:

```env
ALLOW_ORIGIN=https://your-frontend-domain.vercel.app
```

### Multiple Origins (Dev + Production)

Edit [api/src/app.js](../api/src/app.js):

```javascript
const allowedOrigins = [
  'http://localhost:5173',                    // Local dev
  'https://your-frontend-domain.vercel.app'   // Production
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));
```

Redeploy your backend after making this change.

---

## 5. Configure Supabase for Production

### Update Site URL

1. Go to Supabase dashboard → **Authentication** → **URL Configuration**
2. Set **Site URL** to your production frontend:
   ```
   https://your-app.vercel.app
   ```

### Add Redirect URLs

1. In **URL Configuration**, add authorized redirect URLs:
   ```
   https://your-app.vercel.app/**
   http://localhost:5173/**
   ```
   The localhost URL allows local development to continue working.

### Enable Email Confirmation

1. Go to **Authentication** → **Email Auth**
2. Turn **ON** "Confirm email" for production security
3. Test the confirmation flow with a new account

---

## 6. Test Production Deployment

### Pre-Launch Testing

1. **Visit Production URL**
   - Open your production frontend URL
   - Verify the login page loads

2. **Create Test Account**
   - Sign up with a test email
   - Confirm email (check inbox)
   - Log in successfully

3. **Test Core Features**
   - Create time entries
   - Edit and delete entries
   - Navigate between weeks
   - Check dashboard analytics
   - Verify data persists after logout/login

4. **Test Multi-User Isolation**
   - Create two test accounts
   - Log in with Account A (Chrome)
   - Log in with Account B (Incognito/Firefox)
   - Add data to each account
   - Verify each user only sees their own data

### Performance Testing

```bash
# Test API health
curl https://your-api.railway.app/api/health

# Expected response:
# {"status":"ok"}
```

---

## 7. Post-Deployment

### Monitor Your Application

**Frontend Monitoring (Vercel):**
- Dashboard → **Analytics** (page views, errors)
- **Logs** (runtime errors)

**Backend Monitoring (Railway/Render):**
- Dashboard → **Metrics** (CPU, memory, requests)
- **Logs** (server errors, API calls)

**Database Monitoring (Supabase):**
- Dashboard → **Database** → **Logs**
- Monitor query performance and errors

### Set Up Custom Domain (Optional)

**Frontend (Vercel):**
1. Go to your project → **Settings** → **Domains**
2. Add your custom domain (e.g., `hitime.yourdomain.com`)
3. Follow DNS configuration instructions

**Backend (Railway):**
1. Go to your service → **Settings** → **Domains**
2. Add custom domain (e.g., `api.hitime.yourdomain.com`)
3. Configure DNS records

**Update Supabase:**
- Update **Site URL** to your custom domain
- Update **Redirect URLs** to include custom domain

### Security Best Practices

- ✅ **Never commit `.env` files** (already in `.gitignore`)
- ✅ **Use environment variables** for all secrets
- ✅ **Enable HTTPS** (automatic on Vercel/Netlify/Railway)
- ✅ **Enable email confirmation** in production
- ✅ **Monitor logs** for suspicious activity
- ✅ **Keep dependencies updated** (`npm audit`)

---

## Troubleshooting

### CORS Errors in Production

**Symptom:** Frontend can't connect to backend API

**Cause:** Backend `ALLOW_ORIGIN` doesn't match frontend URL

**Fix:**
1. Check backend environment variable: `ALLOW_ORIGIN=https://your-frontend.vercel.app`
2. Ensure there's no trailing slash
3. Redeploy backend
4. Test with: `curl -I https://your-api.railway.app/api/health`

### Email Confirmation Links Not Working

**Symptom:** Users can't confirm their email

**Cause:** Supabase Site URL not set correctly

**Fix:**
1. Go to Supabase dashboard → **Authentication** → **URL Configuration**
2. Set **Site URL** to `https://your-frontend.vercel.app`
3. Add to **Redirect URLs**: `https://your-frontend.vercel.app/**`
4. Test by creating a new account

### 401 Unauthorized Errors

**Symptom:** API requests fail with 401 errors

**Cause:** Frontend not sending auth token, or token expired

**Fix:**
1. Check browser console for auth errors
2. Clear browser localStorage and log in again
3. Verify `VITE_SUPABASE_PUBLISHABLE_KEY` matches Supabase dashboard
4. Check backend logs for token validation errors

### Users Can See Other Users' Data

**Symptom:** Data isolation broken

**Cause:** RLS policies not applied or incorrect

**Fix:**
1. Go to Supabase dashboard → **Database** → **Policies**
2. Verify policies exist for `weeks` and `user_settings` tables
3. Re-run `database/setup-rls.sql` in SQL Editor
4. Test with two different accounts in different browsers

### Build Failures

**Frontend Build Fails:**
- Check build logs in Vercel/Netlify dashboard
- Verify all dependencies are in `package.json`
- Test build locally: `cd time-tracker && npm run build`

**Backend Deploy Fails:**
- Check logs in Railway/Render dashboard
- Verify Node.js version compatibility
- Test locally: `cd api && npm start`

---

## Environment Variables Reference

### Backend (Railway/Render)

```env
SUPABASE_URL=https://yourproject.supabase.co
SUPABASE_PUBLISHABLE_KEY=eyJ...
SUPABASE_SECRET_KEY=eyJ...
ALLOW_ORIGIN=https://your-frontend-domain.com
PORT=8001
```

### Frontend (Vercel/Netlify)

```env
VITE_SUPABASE_URL=https://yourproject.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...
VITE_API_BASE_URL=https://your-api.railway.app/api
```

---

## Questions?

- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **Railway Docs**: [docs.railway.app](https://docs.railway.app)
- **Render Docs**: [render.com/docs](https://render.com/docs)
- **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)

**Still stuck?** Check the error logs:
- Frontend: Vercel/Netlify dashboard → Logs
- Backend: Railway/Render dashboard → Logs
- Database: Supabase dashboard → Logs
