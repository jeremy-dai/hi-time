#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import crypto from 'crypto';
import readline from 'readline';

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
 * Decrypt data using AES-256-GCM
 */
function decrypt(encryptedData) {
  try {
    const parsed = JSON.parse(encryptedData);

    if (!parsed.encrypted) {
      // Data is not encrypted
      return encryptedData;
    }

    if (!BACKUP_ENCRYPTION_KEY) {
      throw new Error('Backup is encrypted but BACKUP_ENCRYPTION_KEY is not set');
    }

    const key = Buffer.from(BACKUP_ENCRYPTION_KEY, 'hex');
    const iv = Buffer.from(parsed.iv, 'hex');
    const authTag = Buffer.from(parsed.authTag, 'hex');

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(parsed.data, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    // If parsing fails, assume it's unencrypted
    return encryptedData;
  }
}

/**
 * Prompt user for confirmation
 */
function askConfirmation(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

/**
 * Restore data to a table
 */
async function restoreTable(tableName, records, mode = 'upsert') {
  if (!records || records.length === 0) {
    console.log(`  ⊘ No records to restore for ${tableName}`);
    return;
  }

  console.log(`\nRestoring ${tableName} (${records.length} records)...`);

  try {
    if (mode === 'replace') {
      // Delete all existing records first
      const { error: deleteError } = await supabase
        .from(tableName)
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (deleteError) {
        throw new Error(`Failed to clear ${tableName}: ${deleteError.message}`);
      }
      console.log(`  ✓ Cleared existing records`);
    }

    // Insert/upsert records in batches (Supabase has a limit)
    const batchSize = 100;
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);

      const { error } = await supabase
        .from(tableName)
        .upsert(batch, { onConflict: getConflictKey(tableName) });

      if (error) {
        throw new Error(`Failed to restore batch: ${error.message}`);
      }

      console.log(`  ✓ Restored ${Math.min(i + batchSize, records.length)}/${records.length} records`);
    }

  } catch (error) {
    console.error(`  ❌ Error restoring ${tableName}: ${error.message}`);
    throw error;
  }
}

/**
 * Get the conflict resolution key for each table
 */
function getConflictKey(tableName) {
  const conflictKeys = {
    weeks: 'user_id,year,week_number',
    user_settings: 'user_id',
    year_memories: 'user_id,year',
    week_reviews: 'user_id,year,week_number',
    daily_shipping: 'user_id,year,month,day',
    quarterly_plans: 'user_id,plan_id',
    data_snapshots: 'id',
  };
  return conflictKeys[tableName] || 'id';
}

/**
 * Main restore function
 */
async function performRestore(backupFile, mode = 'upsert') {
  console.log(`\n🔄 Starting restore from ${backupFile}\n`);

  try {
    // Read backup file
    const backupPath = backupFile.startsWith('/')
      ? backupFile
      : join(__dirname, '../backups', backupFile);

    const encryptedData = readFileSync(backupPath, 'utf8');
    const decryptedData = decrypt(encryptedData);
    const backupData = JSON.parse(decryptedData);

    // Display backup info
    console.log(`📊 Backup Information:`);
    console.log(`  • Created: ${backupData.timestamp}`);
    console.log(`  • Version: ${backupData.version}`);
    console.log(`  • Total records: ${backupData.metadata.totalRecords}`);
    console.log(`  • Encrypted: ${backupData.metadata.encrypted ? 'Yes' : 'No'}`);

    // Confirm with user
    console.log(`\n⚠️  Restore Mode: ${mode.toUpperCase()}`);
    if (mode === 'replace') {
      console.log(`This will DELETE ALL existing data and replace it with the backup!`);
    } else {
      console.log(`This will merge/update existing data with the backup.`);
    }

    const confirmed = await askConfirmation('\nDo you want to continue? (y/n): ');
    if (!confirmed) {
      console.log('Restore cancelled.');
      process.exit(0);
    }

    // Restore each table
    await restoreTable('weeks', backupData.tables.weeks, mode);
    await restoreTable('user_settings', backupData.tables.user_settings, mode);
    await restoreTable('year_memories', backupData.tables.year_memories, mode);
    await restoreTable('week_reviews', backupData.tables.week_reviews, mode);
    if (backupData.tables.daily_shipping) {
      await restoreTable('daily_shipping', backupData.tables.daily_shipping, mode);
    }
    if (backupData.tables.quarterly_goals) {
      await restoreTable('quarterly_goals', backupData.tables.quarterly_goals, mode);
    }
    if (backupData.tables.quarterly_goal_milestones) {
      await restoreTable('quarterly_goal_milestones', backupData.tables.quarterly_goal_milestones, mode);
    }
    if (backupData.tables.quarterly_plans) {
      await restoreTable('quarterly_plans', backupData.tables.quarterly_plans, mode);
    }
    if (backupData.tables.data_snapshots) {
      await restoreTable('data_snapshots', backupData.tables.data_snapshots, mode);
    }

    console.log(`\n✅ Restore completed successfully!\n`);

  } catch (error) {
    console.error(`\n❌ Restore failed: ${error.message}`);
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const backupFile = args[0] || 'backup-latest.json';
const mode = args.includes('--replace') ? 'replace' : 'upsert';

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Usage: node restore.js [backup-file] [--replace]

Arguments:
  backup-file    Path to backup file (default: backup-latest.json)
  --replace      Replace all existing data (default: upsert/merge)

Examples:
  node restore.js                          # Restore from latest backup (merge)
  node restore.js backup-2026-01-01.json   # Restore from specific backup
  node restore.js --replace                # Replace all data with latest backup
`);
  process.exit(0);
}

// Run restore
performRestore(backupFile, mode);
