#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import crypto from 'crypto';

// Load environment variables
const __dirname = dirname(fileURLToPath(import.meta.url));
const rootEnvPath = join(__dirname, '../.env');
dotenv.config({ path: rootEnvPath });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SECRET_KEY;
const BACKUP_ENCRYPTION_KEY = process.env.BACKUP_ENCRYPTION_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SECRET_KEY in .env file');
  process.exit(1);
}

// Initialize Supabase client with service role (bypasses RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/**
 * Encrypt data using AES-256-GCM
 */
function encrypt(data) {
  if (!BACKUP_ENCRYPTION_KEY) {
    console.warn('⚠️  BACKUP_ENCRYPTION_KEY not set - backups will be unencrypted');
    return data;
  }

  const key = Buffer.from(BACKUP_ENCRYPTION_KEY, 'hex');
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return JSON.stringify({
    encrypted: true,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
    data: encrypted
  });
}

/**
 * Retry a function with exponential backoff
 */
async function withRetry(fn, maxRetries = 3, initialDelay = 1000) {
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        const delay = initialDelay * Math.pow(2, attempt - 1);
        console.log(`  ⚠️  Attempt ${attempt} failed, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
}

/**
 * Fetch all data from a table (for full backup)
 */
async function fetchAllFromTable(tableName) {
  console.log(`Fetching all data from ${tableName}...`);

  return withRetry(async () => {
    const { data, error } = await supabase
      .from(tableName)
      .select('*');

    if (error) {
      throw new Error(`Failed to fetch ${tableName}: ${error.message}`);
    }

    console.log(`  ✓ Fetched ${data.length} records from ${tableName}`);
    return data;
  });
}

/**
 * Fetch recent data from a table (for incremental backup)
 */
async function fetchRecentFromTable(tableName, daysBack) {
  const cutoffDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);
  console.log(`Fetching recent data from ${tableName} (since ${cutoffDate.toISOString().split('T')[0]})...`);

  return withRetry(async () => {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .gte('updated_at', cutoffDate.toISOString());

    if (error) {
      throw new Error(`Failed to fetch ${tableName}: ${error.message}`);
    }

    console.log(`  ✓ Fetched ${data.length} recent records from ${tableName}`);
    return data;
  });
}

/**
 * Fetch data by current year (for year_memories)
 */
async function fetchCurrentYearMemories() {
  const currentYear = new Date().getFullYear();
  console.log(`Fetching year_memories for ${currentYear}...`);

  return withRetry(async () => {
    const { data, error } = await supabase
      .from('year_memories')
      .select('*')
      .eq('year', currentYear);

    if (error) {
      throw new Error(`Failed to fetch year_memories: ${error.message}`);
    }

    console.log(`  ✓ Fetched ${data.length} records for year ${currentYear}`);
    return data;
  });
}

/**
 * Fetch data by current month (for daily_shipping)
 */
async function fetchCurrentMonthShipping() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  console.log(`Fetching daily_shipping for ${currentYear}-${String(currentMonth).padStart(2, '0')}...`);

  return withRetry(async () => {
    const { data, error } = await supabase
      .from('daily_shipping')
      .select('*')
      .eq('year', currentYear)
      .eq('month', currentMonth);

    if (error) {
      throw new Error(`Failed to fetch daily_shipping: ${error.message}`);
    }

    console.log(`  ✓ Fetched ${data.length} records for current month`);
    return data;
  });
}

/**
 * Perform full backup
 */
async function performFullBackup() {
  const timestamp = new Date().toISOString();
  console.log(`\n🔄 Starting FULL backup at ${timestamp}\n`);

  try {
    // Fetch all data from all tables
    const [weeks, userSettings, yearMemories, weekReviews, dailyShipping, quarterlyGoals, quarterlyGoalMilestones] = await Promise.all([
      fetchAllFromTable('weeks'),
      fetchAllFromTable('user_settings'),
      fetchAllFromTable('year_memories'),
      fetchAllFromTable('week_reviews'),
      fetchAllFromTable('daily_shipping'),
      fetchAllFromTable('quarterly_goals'),
      fetchAllFromTable('quarterly_goal_milestones'),
    ]);

    const backupData = {
      timestamp,
      version: '1.0',
      type: 'full',
      tables: {
        weeks,
        user_settings: userSettings,
        year_memories: yearMemories,
        week_reviews: weekReviews,
        daily_shipping: dailyShipping,
        quarterly_goals: quarterlyGoals,
        quarterly_goal_milestones: quarterlyGoalMilestones,
      },
      metadata: {
        totalRecords: weeks.length + userSettings.length + yearMemories.length + weekReviews.length + dailyShipping.length + quarterlyGoals.length + quarterlyGoalMilestones.length,
        encrypted: !!BACKUP_ENCRYPTION_KEY,
      }
    };

    console.log(`\n📊 Full Backup Summary:`);
    console.log(`  • weeks: ${weeks.length} records`);
    console.log(`  • user_settings: ${userSettings.length} records`);
    console.log(`  • year_memories: ${yearMemories.length} records`);
    console.log(`  • week_reviews: ${weekReviews.length} records`);
    console.log(`  • daily_shipping: ${dailyShipping.length} records`);
    console.log(`  • quarterly_goals: ${quarterlyGoals.length} records`);
    console.log(`  • quarterly_goal_milestones: ${quarterlyGoalMilestones.length} records`);
    console.log(`  • Total: ${backupData.metadata.totalRecords} records`);

    return backupData;
  } catch (error) {
    console.error(`\n❌ Full backup failed: ${error.message}`);
    throw error;
  }
}

/**
 * Perform incremental backup (last 14 days of changes)
 */
async function performIncrementalBackup() {
  const timestamp = new Date().toISOString();
  console.log(`\n🔄 Starting INCREMENTAL backup at ${timestamp}\n`);

  try {
    // Fetch recent data (last 14 days for weeks/week_reviews)
    const [weeks, userSettings, yearMemories, weekReviews, dailyShipping, quarterlyGoals, quarterlyGoalMilestones] = await Promise.all([
      fetchRecentFromTable('weeks', 14),
      fetchAllFromTable('user_settings'), // Always include settings (tiny)
      fetchCurrentYearMemories(), // Current year only
      fetchRecentFromTable('week_reviews', 14),
      fetchCurrentMonthShipping(), // Current month only
      fetchAllFromTable('quarterly_goals'), // Always include all goals (typically small)
      fetchAllFromTable('quarterly_goal_milestones'), // Always include all milestones (typically small)
    ]);

    const backupData = {
      timestamp,
      version: '1.0',
      type: 'incremental',
      incrementalWindow: {
        weeks: '14 days',
        week_reviews: '14 days',
        year_memories: 'current year',
        daily_shipping: 'current month',
        user_settings: 'all',
        quarterly_goals: 'all',
        quarterly_goal_milestones: 'all'
      },
      tables: {
        weeks,
        user_settings: userSettings,
        year_memories: yearMemories,
        week_reviews: weekReviews,
        daily_shipping: dailyShipping,
        quarterly_goals: quarterlyGoals,
        quarterly_goal_milestones: quarterlyGoalMilestones,
      },
      metadata: {
        totalRecords: weeks.length + userSettings.length + yearMemories.length + weekReviews.length + dailyShipping.length + quarterlyGoals.length + quarterlyGoalMilestones.length,
        encrypted: !!BACKUP_ENCRYPTION_KEY,
      }
    };

    console.log(`\n📊 Incremental Backup Summary:`);
    console.log(`  • weeks (last 14 days): ${weeks.length} records`);
    console.log(`  • user_settings (all): ${userSettings.length} records`);
    console.log(`  • year_memories (current year): ${yearMemories.length} records`);
    console.log(`  • week_reviews (last 14 days): ${weekReviews.length} records`);
    console.log(`  • daily_shipping (current month): ${dailyShipping.length} records`);
    console.log(`  • quarterly_goals (all): ${quarterlyGoals.length} records`);
    console.log(`  • quarterly_goal_milestones (all): ${quarterlyGoalMilestones.length} records`);
    console.log(`  • Total: ${backupData.metadata.totalRecords} records`);

    return backupData;
  } catch (error) {
    console.error(`\n❌ Incremental backup failed: ${error.message}`);
    throw error;
  }
}

/**
 * Save backup to file
 */
function saveBackup(backupData, type) {
  // Create backups directory if it doesn't exist
  const backupsDir = join(__dirname, '../backups');
  mkdirSync(backupsDir, { recursive: true });

  // Generate filename with date
  const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const filename = type === 'full'
    ? `backup-full-${date}.json`
    : `backup-inc-${date}.json`;
  const filepath = join(backupsDir, filename);

  // Convert to JSON and optionally encrypt
  const jsonData = JSON.stringify(backupData, null, 2);
  const finalData = encrypt(jsonData);

  // Write to file
  writeFileSync(filepath, finalData, 'utf8');

  const fileSizeKB = (Buffer.byteLength(finalData, 'utf8') / 1024).toFixed(2);
  console.log(`\n✅ Backup completed successfully!`);
  console.log(`  📁 File: ${filename}`);
  console.log(`  📦 Size: ${fileSizeKB} KB`);
  console.log(`  🔒 Encrypted: ${backupData.metadata.encrypted ? 'Yes' : 'No'}`);
  console.log(`  📂 Type: ${type.toUpperCase()}`);

  // Update "latest" symlink based on type
  if (type === 'incremental') {
    const latestPath = join(backupsDir, 'backup-latest-inc.json');
    writeFileSync(latestPath, finalData, 'utf8');
    console.log(`  📌 Latest incremental backup updated`);
  } else {
    const latestPath = join(backupsDir, 'backup-latest-full.json');
    writeFileSync(latestPath, finalData, 'utf8');
    console.log(`  📌 Latest full backup updated`);
  }

  console.log('');
}

/**
 * Determine backup type based on day of week and month
 */
function determineBackupType() {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const dayOfMonth = now.getDate();

  // First day of month = monthly archive (full backup)
  if (dayOfMonth === 1) {
    return { type: 'full', reason: 'Monthly archive (first day of month)' };
  }

  // Sunday = weekly full backup
  if (dayOfWeek === 0) {
    return { type: 'full', reason: 'Weekly full backup (Sunday)' };
  }

  // All other days = incremental backup
  return { type: 'incremental', reason: 'Daily incremental backup' };
}

/**
 * Main execution
 */
async function main() {
  const backupStrategy = determineBackupType();
  console.log(`\n🎯 Backup Strategy: ${backupStrategy.reason}\n`);

  let backupData;
  if (backupStrategy.type === 'full') {
    backupData = await performFullBackup();
  } else {
    backupData = await performIncrementalBackup();
  }

  saveBackup(backupData, backupStrategy.type);
}

// Run backup
main().catch(error => {
  console.error('Backup failed:', error);
  process.exit(1);
});
