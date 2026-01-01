# Backup & Restore Guide

This project includes automated **smart incremental backups** of your Supabase data to protect against data loss while minimizing storage and compute usage.

## 📋 Quick Summary

| Aspect | Details |
|--------|---------|
| **Backup Schedule** | Daily at 3 AM UTC (automatic via GitHub Actions) |
| **Mon-Sat** | Incremental backups (~10 KB, last 14 days only) |
| **Sunday** | Full backups (~100 KB, everything) |
| **1st of month** | Archive backups (~100 KB, kept 90 days) |
| **Storage** | Private GitHub repo, encrypted with AES-256-GCM |
| **Restore** | `node scripts/restore-smart.js` (auto-merges backups) |
| **Manual backup** | `node scripts/backup-incremental.js` |

**Benefits**: 90% smaller daily backups, 85% less compute time, fully portable encrypted JSON.

## Quick Start

### Setup Steps for Private Backup Repo

#### 1. Create a Private Backup Repo on GitHub

Go to GitHub and create a new private repository:
- **Name**: `hi-time-backups-private` (or whatever you prefer)
- **Visibility**: Private
- **Initialize with README** (optional)

#### 2. Create Personal Access Token


**Option A: Direct URL (Easiest)**
1. Go directly to: https://github.com/settings/tokens (this is your personal settings, not the repo)
2. Click **Generate new token (classic)**

**Option B: Via Navigation**
1. Click your **profile picture** (top-right corner) → Select **Settings** (NOT the repository settings) →  **Developer settings**
2. Click **Personal access tokens** → **Tokens (classic)** → **Generate new token (classic)** 
3. **Name**: "Backup Workflow Token"
4. **Expiration**: Set your preferred expiration (or "No expiration" if you prefer)
5. **Scopes**: Select `repo` (full control) - this will check all repo permissions
6. Click **Generate token** at the bottom
7. **Copy the token immediately** - you won't be able to see it again!

#### 3. Add GitHub Secrets

**IMPORTANT**: Add secrets to your **MAIN repo** (the `hi-time` repo where your code is), NOT the backup repo.

Go to your main repo (`hi-time`) → Settings → Secrets and variables → Actions

Click the green "New repository secret" button to add these secrets:
- `SUPABASE_URL` → Your Supabase project URL
- `SUPABASE_SECRET_KEY` → Your Supabase service role key
- `BACKUP_ENCRYPTION_KEY` → Generate with:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
- `BACKUP_REPO` → Your backup repo name (e.g., `yourusername/hi-time-backups-private`)
- `BACKUP_REPO_TOKEN` → The personal access token from step 2

#### 4. Test It Locally

```bash
# Generate encryption key and add to .env
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Add to .env:
# BACKUP_ENCRYPTION_KEY=the_key_above

# Test smart backup (auto-detects full vs incremental)
node scripts/backup-incremental.js

# Should create backups/backup-inc-YYYY-MM-DD.json or backup-full-YYYY-MM-DD.json
ls -lh backups/
```

#### 5. Enable Automated Backups

Push the workflow to your repository:
```bash
git add .github/workflows/backup.yml scripts/backup-incremental.js scripts/restore-smart.js
git commit -m "feat: enable smart incremental backup system"
git push
```

Then manually trigger the first backup:
- Go to your **main repo** (`hi-time`) → Actions → Smart Backup → Run workflow

After this, backups will run automatically every day at 3 AM UTC.

## Backup Strategy Overview

The smart backup system uses a **hybrid incremental approach**:

### Automatic Backup Types

1. **Daily Incremental Backups** (Mon-Sat)
   - Only backs up data modified in the last 14 days
   - Current year memories only
   - Current month daily shipping
   - ~90% smaller than full backups
   - Fast and efficient

2. **Weekly Full Backups** (Every Sunday)
   - Complete snapshot of all data
   - Baseline for incremental backups
   - Reliable recovery point

3. **Monthly Archive Backups** (1st of month)
   - Full backup for long-term retention
   - Kept for 90 days vs 30 days for regular backups

### Why This Approach?

- **Efficient**: You typically only update current week data daily
- **Fast**: 90% smaller daily backups = faster GitHub Actions runs
- **Smart**: Automatically chooses backup type based on day
- **Cost-effective**: Uses minimal free tier resources

### Manual Backup

**Legacy full backup** (backs up everything):
```bash
node scripts/backup.js
```

**Smart backup** (auto-detects if full or incremental needed):
```bash
node scripts/backup-incremental.js
```

**File naming convention**:
- `backup-inc-YYYY-MM-DD.json` - Incremental backup
- `backup-full-YYYY-MM-DD.json` - Full backup
- `backup-latest-inc.json` - Symlink to latest incremental
- `backup-latest-full.json` - Symlink to latest full
- `backup-YYYY-MM-DD.json` - Legacy format (still supported)

### Restore from Backup

**Smart restore** (auto-merges full + incremental backups):
```bash
node scripts/restore-smart.js
# or
node scripts/restore-smart.js auto
```

This automatically:
1. Finds the most recent full backup
2. Finds all incremental backups since then
3. Merges them together for complete data
4. Restores to your database

**Legacy restore** (single backup file):
```bash
node scripts/restore.js backup-full-2026-01-01.json
```

**Replace all data** (⚠️ destructive):
```bash
node scripts/restore-smart.js auto --replace
```

## Automated Backups

### How It Works

- **Main repo (public)** - Contains code, no sensitive backups
- **Backup repo (private)** - Stores encrypted daily backups
- **Workflow runs daily**, creates backup, pushes to private repo
- **Local backups folder** is gitignored, won't appear in public repo

### GitHub Actions (Recommended)

The `.github/workflows/backup.yml` workflow is stored in your **MAIN repo** (`hi-time`) and runs daily at 3 AM UTC:

1. **Automatically chooses backup type** based on the day:
   - Sunday or 1st of month → Full backup
   - All other days → Incremental backup
2. Exports relevant Supabase data (full or recent changes)
3. Encrypts it using `BACKUP_ENCRYPTION_KEY`
4. Pushes encrypted backup to your private backup repository
5. Retention policy:
   - Incremental backups: 30 days
   - Full backups: 90 days

**To enable**:
- Make sure GitHub Secrets are configured in your **main repo** (see Setup above)
- Push the workflow file to your **main repository**
- Backups will run automatically

**Manual trigger**:
- Go to your **main repo** → Actions → Daily Backup → Run workflow

### What Gets Backed Up

**Full Backups** (Sundays & 1st of month):
- All data from all tables

**Incremental Backups** (Mon-Sat):
- `weeks` - Last 14 days of updates
- `user_settings` - All settings (always included, very small)
- `year_memories` - Current year only
- `week_reviews` - Last 14 days of updates
- `daily_shipping` - Current month only

**Why incremental?** You typically only edit the current week and occasionally fix last week's data. This captures your active work while being 90% smaller than full backups.

## Security Best Practices

### Security Layers

✅ **Backups stored in private repo** (not public)  
✅ **Data encrypted with AES-256-GCM**  
✅ **Encryption key never in repo** (only in GitHub Secrets)  
✅ **Personal access token secured in GitHub Secrets**  

Even if someone gets access to your private backup repo, they can't decrypt the data without the encryption key!

### 1. Encryption

- Always set `BACKUP_ENCRYPTION_KEY` to encrypt backups
- Use a strong 32-byte random key (64 hex characters)
- Never commit the encryption key to Git

### 2. Supabase Security

Your existing setup already includes:
- ✅ Row Level Security (RLS) enabled
- ✅ JWT authentication
- ✅ User-specific data isolation
- ✅ Environment variables for secrets

### 3. Additional Recommendations

**Enable 2FA on Supabase account**:
- Go to Supabase dashboard → Account → Security
- Enable two-factor authentication

**Rotate your Supabase keys periodically**:
- Every 3-6 months, generate new API keys
- Update `.env` and GitHub Secrets

**Monitor database access**:
- Check Supabase logs regularly for suspicious activity
- Go to your project → Database → Logs

**Limit API key exposure**:
- Never commit `.env` to Git (already in `.gitignore`)
- Don't share your service role key
- Use anon/public key in frontend only

**Database backups retention**:
- Free tier: Keep 7-30 days of backups locally/GitHub
- Consider upgrading Supabase tier for automatic backups

## Recovery Scenarios

### Scenario 1: Accidental Data Deletion (Recent)

```bash
# Smart restore automatically merges latest backups
node scripts/restore-smart.js
```

### Scenario 2: Restore to Specific Date

```bash
# List available backups
ls -lh backups/

# Restore from specific full backup
node scripts/restore-smart.js backup-full-2026-01-01.json
```

### Scenario 3: Database Compromised

1. Immediately rotate all Supabase keys
2. Create new Supabase project
3. Update `.env` with new credentials
4. Restore from last known good backup:
   ```bash
   node scripts/restore-smart.js auto --replace
   ```

### Scenario 4: Testing Changes Safely

```bash
# Backup before risky operation (force full backup)
node scripts/backup.js

# Make changes...

# If something goes wrong:
node scripts/restore-smart.js
```

## Backup Storage Options

### Current Setup: Private GitHub Repository

- **Pros**: Version history, free, automatic, private and secure
- **Cons**: Retention limits (30 days incremental, 90 days full - configurable)
- **Security**: Encrypted backups stored in private repo, separate from public code repo
- **Efficiency**: Smart incremental backups use ~90% less storage and compute

### Alternative: Local + Cloud Storage

Modify `scripts/backup-incremental.js` to also upload to:
- Google Drive API
- Dropbox API
- AWS S3 (free tier: 5GB)
- Backblaze B2 (10GB free)

### Recommended Multi-Layer Strategy

1. **Private GitHub Repo** - Daily automated smart backups (primary)
   - Incremental backups Mon-Sat
   - Full backups on Sundays
2. **Local backups** - Weekly manual full backups to external drive
3. **Cloud storage** - Monthly full backups to Google Drive/Dropbox

## Troubleshooting

### Backup fails with "Missing credentials"

Make sure `.env` has:
```env
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SECRET_KEY=eyJhbG...
```

### Restore fails with "Authentication error"

- Check that `SUPABASE_SECRET_KEY` is the **service role key**, not the anon key
- Verify the key hasn't been rotated

### "Backup is encrypted but BACKUP_ENCRYPTION_KEY is not set"

- Find the encryption key you used when creating the backup
- Add it to `.env` as `BACKUP_ENCRYPTION_KEY`

### GitHub Action fails

- Check that all secrets are set in repo settings:
  - `SUPABASE_URL`
  - `SUPABASE_SECRET_KEY`
  - `BACKUP_ENCRYPTION_KEY`
  - `BACKUP_REPO` (format: `username/repo-name`)
  - `BACKUP_REPO_TOKEN` (personal access token)
- Verify the secret names match exactly (case-sensitive)
- Check Actions tab for detailed error logs
- Ensure the personal access token has `repo` scope
- Verify the backup repo exists and is private

## Backup File Format

```json
{
  "timestamp": "2026-01-01T03:00:00.000Z",
  "version": "1.0",
  "tables": {
    "weeks": [...],
    "user_settings": [...],
    "year_memories": [...],
    "week_reviews": [...],
    "daily_shipping": [...]
  },
  "metadata": {
    "totalRecords": 1234,
    "encrypted": true
  }
}
```

If encrypted, the entire JSON is wrapped in:
```json
{
  "encrypted": true,
  "iv": "hex_string",
  "authTag": "hex_string",
  "data": "encrypted_hex_data"
}
```

## Cost Considerations

### Free Forever
- GitHub Actions: 2,000 minutes/month
  - **Before**: ~60 min/month (30 days × 2 min full backup)
  - **After**: ~9-15 min/month (incremental backups are 6x faster)
  - 🎉 **85% reduction** in compute usage
- GitHub Storage: Unlimited for repos
  - **Before**: ~3-6 MB/month (30 full backups)
  - **After**: ~500 KB - 1 MB/month (mostly incrementals)
  - 🎉 **83% reduction** in storage usage
- Local storage: Free
- Supabase Free Tier: 500MB database, unlimited API requests

### If You Outgrow Free Tier
- Supabase Pro ($25/mo): 8GB database + Point-in-time recovery
- GitHub Pro ($4/mo): If you need private repos (already included in free for personal)

### Smart Backup Benefits
With the incremental strategy, you'll use:
- **~0.5%** of GitHub Actions free tier (vs 3% before)
- Faster backups (0.3 min vs 2 min)
- Same data protection
- Better recovery granularity

## Frequently Asked Questions

### Can I still use the old backup.js script?

Yes! The legacy `backup.js` script still works and creates full backups with the old naming convention. Both scripts can coexist.

### What if I want to force a full backup?

Use the legacy script: `node scripts/backup.js` or wait for Sunday/1st of month when the smart script automatically creates full backups.

### Are my backups portable if I stop using Supabase?

**Yes!** The backups are encrypted JSON files using standard AES-256-GCM encryption. After decryption, it's pure JSON that can be imported into any database (SQLite, PostgreSQL, MongoDB, etc.) or used directly in code. You're not locked into Supabase.

### How do I decrypt a backup without restoring it?

See the decryption example in the BACKUP.md documentation under "Data Portability". You just need Node.js crypto module and your `BACKUP_ENCRYPTION_KEY`.

### What happens if I lose my encryption key?

Your encrypted backups become unrecoverable. **Save your `BACKUP_ENCRYPTION_KEY` securely** in a password manager or secure location separate from the backups.

### Can I change the incremental window (14 days)?

Yes! Edit `scripts/backup-incremental.js` and modify the number `14` in the `fetchRecentFromTable(tableName, 14)` calls to your preferred number of days.

### Why are incremental backups better than full backups?

For personal time tracking data where you typically only edit current week data, incremental backups:
- Are 90% smaller (faster uploads, less storage)
- Run 6x faster (less compute time)
- Use minimal free tier resources
- Still provide daily recovery points when combined with weekly full backups

## Questions?

- For issues, check GitHub repo issues
- For Supabase security, see: https://supabase.com/docs/guides/platform/security
