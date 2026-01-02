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
const BACKUP_ENCRYPTION_KEY = process.env.BACKUP_ENCRYPTION_KEY; // Optional: 32-byte hex string

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
 * Fetch all data from a table
 */
async function fetchAllFromTable(tableName) {
  console.log(`Fetching data from ${tableName}...`);

  const { data, error } = await supabase
    .from(tableName)
    .select('*');

  if (error) {
    throw new Error(`Failed to fetch ${tableName}: ${error.message}`);
  }

  console.log(`  ✓ Fetched ${data.length} records from ${tableName}`);
  return data;
}

/**
 * Main backup function
 */
async function performBackup() {
  const timestamp = new Date().toISOString();
  console.log(`\n🔄 Starting backup at ${timestamp}\n`);

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

    // Compile backup data
    const backupData = {
      timestamp,
      version: '1.0',
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

    console.log(`\n📊 Backup Summary:`);
    console.log(`  • weeks: ${weeks.length} records`);
    console.log(`  • user_settings: ${userSettings.length} records`);
    console.log(`  • year_memories: ${yearMemories.length} records`);
    console.log(`  • week_reviews: ${weekReviews.length} records`);
    console.log(`  • daily_shipping: ${dailyShipping.length} records`);
    console.log(`  • quarterly_goals: ${quarterlyGoals.length} records`);
    console.log(`  • quarterly_goal_milestones: ${quarterlyGoalMilestones.length} records`);
    console.log(`  • Total: ${backupData.metadata.totalRecords} records`);

    // Create backups directory if it doesn't exist
    const backupsDir = join(__dirname, '../backups');
    mkdirSync(backupsDir, { recursive: true });

    // Generate filename with date
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const filename = `backup-${date}.json`;
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

    // Also create a "latest" backup for easy access
    const latestPath = join(backupsDir, 'backup-latest.json');
    writeFileSync(latestPath, finalData, 'utf8');
    console.log(`  📌 Latest backup updated\n`);

  } catch (error) {
    console.error(`\n❌ Backup failed: ${error.message}`);
    process.exit(1);
  }
}

// Run backup
performBackup();
