# CLI Scripts Guide

This guide covers the command-line scripts available for managing users and data in Hi-Time.

## Available Scripts

All scripts are located in `api/scripts/`:

- **`create-user.js`** - Create new user accounts
- **`get-auth-token.js`** - Retrieve authentication tokens
- **`import-local-data.js`** - Import CSV data from `raw_data/` directory

---

## Prerequisites

1. **Supabase Configuration**
   - Ensure your `.env` file has valid Supabase credentials
   - See [Authentication Setup](AUTHENTICATION_SETUP.md) for configuration

2. **Install Dependencies**
   ```bash
   cd api
   npm install
   ```

---

## Creating Users

### create-user.js

Creates a new user account in Supabase Auth.

**Usage:**
```bash
cd api
node scripts/create-user.js <email> <password>
```

**Example:**
```bash
node scripts/create-user.js jeremy@example.com mySecurePass123
```

**Output:**
```
✅ User created successfully!

Email: jeremy@example.com
User ID: 7fa3180f-ccab-45c7-84f9-83b0f6eff387

⚠️ Note: If email confirmation is enabled, confirm the user in Supabase dashboard:
   Authentication → Users → Click user → "Confirm email"
```

**Important Notes:**
- If email confirmation is enabled (default on hosted Supabase):
  1. Go to Supabase dashboard → **Authentication** → **Users**
  2. Find the user → Click **"..."** menu → **"Confirm email"**
- For local development, consider disabling email confirmation (see [Authentication Setup](AUTHENTICATION_SETUP.md))
- Passwords must meet Supabase's security requirements (typically 6+ characters)

**Common Errors:**
- `User already registered` - Account with this email already exists
- `Missing SUPABASE_URL or SUPABASE_PUBLISHABLE_KEY` - Check your `.env` file
- `Password should be at least 6 characters` - Use a longer password

---

## Getting Authentication Tokens

### get-auth-token.js

Retrieves a JWT authentication token for a user. Useful for:
- Importing data via `import-local-data.js`
- Testing API endpoints manually
- Development workflows

**Usage:**
```bash
cd api
node scripts/get-auth-token.js <email> <password>
```

**Example:**
```bash
node scripts/get-auth-token.js jeremy@example.com mySecurePass123
```

**Output:**
```
✅ Login successful!

Add this to your .env file:
VITE_AUTH_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

User ID: 7fa3180f-ccab-45c7-84f9-83b0f6eff387
Email: jeremy@example.com
```

**Usage Tips:**
- Copy the token for use with `import-local-data.js`
- Optionally add to `.env` as `VITE_AUTH_TOKEN` for development
- Tokens expire after 1 hour (default) - regenerate if needed

**Common Errors:**
- `Invalid login credentials` - Check email/password or confirm user in dashboard
- `Email not confirmed` - Confirm the user in Supabase dashboard (see above)

---

## Importing Data

### import-local-data.js

Imports CSV files from the `raw_data/` directory into your Supabase database.

**Features:**
- ✅ Calculates ISO week numbers from actual dates
- ✅ Respects Row Level Security (RLS) - imports to authenticated user only
- ✅ Supports upsert - safely re-import without duplicates
- ✅ Validates data with existing CSV parser

**Usage:**
```bash
cd api
node scripts/import-local-data.js <auth-token>
```

**Step-by-Step Guide:**

**Step 1: Get Your Auth Token**
```bash
node scripts/get-auth-token.js your@email.com yourpassword
```

Copy the token from the output.

**Step 2: Prepare Your CSV Files**

Place CSV files in `raw_data/` with filenames in this format:
```
YYYY-MM-DD.csv
```

Where `YYYY-MM-DD` is the **start date (Sunday)** of the week.

**Examples:**
- `2024-12-29.csv` → Week starting Dec 29, 2024 (Sunday) → 2024-W52
- `2025-01-05.csv` → Week starting Jan 5, 2025 (Sunday) → 2025-W01
- `2025-01-12.csv` → Week starting Jan 12, 2025 (Sunday) → 2025-W02

**Step 3: Run Import**
```bash
node scripts/import-local-data.js <paste-your-token-here>
```

**Example Output:**
```
🚀 Starting local data import...
👤 Importing for user: jeremy@example.com (7fa3180f-ccab-...)
📂 Reading from: /Users/you/hi-time/raw_data
📊 Found 52 CSV files.

Processing 2024-12-29.csv...
   -> Week start: 12/29/2024
   -> ISO Week: 2024-W52
   ✅ Imported successfully!

Processing 2025-01-05.csv...
   -> Week start: 1/5/2025
   -> ISO Week: 2025-W01
   ✅ Imported successfully!

...

==========================================
🎉 Import finished!
✅ Success: 52
❌ Failed: 0
==========================================
```

**Step 4: Verify in App**
1. Go to http://localhost:5173
2. Log in with your credentials
3. Your imported data will be visible!

---

## CSV File Format

The CSV files should follow this format (same as the app's export format):

```csv
Day,Start Time,End Time,Productivity Type,Activity,Category,Subcategory,Notes
Sunday,00:00,06:00,Rest,Sleep,Health,Sleep,
Sunday,06:00,07:00,Productive Work,Morning routine,Personal,Routine,
...
```

**Columns:**
- **Day**: Day of week (Sunday, Monday, etc.)
- **Start Time**: 24-hour format (HH:MM)
- **End Time**: 24-hour format (HH:MM)
- **Productivity Type**: Rest, Productive Work, Guilty Free Play, Procrastination, Mandatory Work
- **Activity**: Short description
- **Category**: Main category
- **Subcategory**: Optional subcategory
- **Notes**: Optional notes

---

## ISO Week Number Calculation

The import script automatically calculates ISO week numbers from the filename date:

**How it works:**
1. Parses filename: `2025-01-05.csv` → January 5, 2025
2. Uses ISO 8601 week date standard:
   - Week starts on Monday
   - Week 1 contains the first Thursday of the year
   - Weeks belong to the year that contains the Thursday
3. Calculates: `2025-W01`

**Example Weeks:**
```
Dec 29, 2024 (Sunday) → 2024-W52 ✓
Jan 5, 2025 (Sunday)  → 2025-W01 ✓
Jan 12, 2025 (Sunday) → 2025-W02 ✓
Dec 21, 2025 (Sunday) → 2025-W51 ✓
```

**Important:** Use the **Sunday start date** in filenames, even though ISO weeks technically start on Monday. The script handles the conversion correctly.

---

## Multi-User Testing

Test data isolation with multiple users:

```bash
# Create two users
node scripts/create-user.js user1@test.com pass1
node scripts/create-user.js user2@test.com pass2

# Confirm both users in Supabase dashboard if needed
# (Authentication → Users → Confirm email)

# Get tokens for each user
node scripts/get-auth-token.js user1@test.com pass1
# Copy token1

node scripts/get-auth-token.js user2@test.com pass2
# Copy token2

# Import different data for each user
node scripts/import-local-data.js <token1>
# (swap CSV files in raw_data/)
node scripts/import-local-data.js <token2>

# Test isolation:
# - Log in as user1 in Chrome → See user1's data only
# - Log in as user2 in Firefox/Incognito → See user2's data only
```

---

## Advanced Usage

### Batch Create Users

Create multiple test users:

```bash
# create-test-users.sh
#!/bin/bash
for i in {1..5}; do
  node scripts/create-user.js "test$i@example.com" "testpass$i"
done
```

### Re-import Data

The import script uses upsert, so you can safely re-import:

```bash
# Fix CSV files
# Re-run import with same token
node scripts/import-local-data.js <your-token>

# Only changed weeks will be updated
```

### Import Subset of Files

```bash
# Move files you don't want to import temporarily
mkdir raw_data_backup
mv raw_data/2024-*.csv raw_data_backup/

# Import only 2025 data
node scripts/import-local-data.js <your-token>

# Restore files
mv raw_data_backup/*.csv raw_data/
```

---

## Troubleshooting

### "Invalid auth token"

**Cause:** Token expired (1 hour default) or incorrect

**Fix:**
1. Get a fresh token: `node scripts/get-auth-token.js <email> <password>`
2. Use the new token immediately

### "Filename format not recognized"

**Cause:** CSV filename doesn't match `YYYY-MM-DD.csv` format

**Fix:**
1. Rename files to match format: `2025-01-05.csv`
2. Use the Sunday start date of each week

### "DB Insert failed"

**Cause:** RLS policies blocking access, or invalid data

**Fix:**
1. Verify RLS policies are applied (see [Authentication Setup](AUTHENTICATION_SETUP.md))
2. Check user ID matches in Supabase dashboard
3. Verify CSV data is valid format

### "Directory not found: raw_data"

**Cause:** `raw_data/` directory doesn't exist

**Fix:**
```bash
mkdir raw_data
# Add your CSV files
```

---

## Questions?

For authentication setup and RLS configuration, see:
- [Authentication Setup](AUTHENTICATION_SETUP.md)
- [Database Schema](DATABASE_SCHEMA.md)

For production deployment of the app:
- [Deployment Guide](DEPLOYMENT.md)
