#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync, statSync } from 'fs';
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
    quarterly_goals: 'id',
    quarterly_goal_milestones: 'id',
    quarterly_plans: 'user_id,plan_id',
    data_snapshots: 'id',
  };
  return conflictKeys[tableName] || 'id';
}

/**
 * Load and decrypt a backup file
 */
function loadBackup(backupPath) {
  const encryptedData = readFileSync(backupPath, 'utf8');
  const decryptedData = decrypt(encryptedData);
  return JSON.parse(decryptedData);
}

/**
 * Find the most recent full backup
 */
function findLatestFullBackup(backupsDir) {
  const files = readdirSync(backupsDir)
    .filter(f => f.startsWith('backup-full-') && f.endsWith('.json'))
    .map(f => ({
      name: f,
      path: join(backupsDir, f),
      mtime: statSync(join(backupsDir, f)).mtime
    }))
    .sort((a, b) => b.mtime - a.mtime);

  return files.length > 0 ? files[0].path : null;
}

/**
 * Find all incremental backups since a given date
 */
function findIncrementalBackupsSince(backupsDir, sinceDate) {
  const files = readdirSync(backupsDir)
    .filter(f => f.startsWith('backup-inc-') && f.endsWith('.json'))
    .map(f => {
      const path = join(backupsDir, f);
      return {
        name: f,
        path: path,
        mtime: statSync(path).mtime
      };
    })
    .filter(f => f.mtime > sinceDate)
    .sort((a, b) => a.mtime - b.mtime); // Oldest to newest

  return files.map(f => f.path);
}

/**
 * Merge incremental backups into full backup data
 */
function mergeIncrementalBackups(fullBackup, incrementalBackups) {
  console.log(`\n🔄 Merging ${incrementalBackups.length} incremental backups...\n`);

  // Create a map for efficient lookups
  const mergedTables = {
    weeks: new Map(fullBackup.tables.weeks.map(r => [getRecordKey('weeks', r), r])),
    user_settings: new Map(fullBackup.tables.user_settings.map(r => [getRecordKey('user_settings', r), r])),
    year_memories: new Map(fullBackup.tables.year_memories.map(r => [getRecordKey('year_memories', r), r])),
    week_reviews: new Map(fullBackup.tables.week_reviews.map(r => [getRecordKey('week_reviews', r), r])),
    daily_shipping: new Map(fullBackup.tables.daily_shipping.map(r => [getRecordKey('daily_shipping', r), r])),
    quarterly_goals: new Map((fullBackup.tables.quarterly_goals || []).map(r => [getRecordKey('quarterly_goals', r), r])),
    quarterly_goal_milestones: new Map((fullBackup.tables.quarterly_goal_milestones || []).map(r => [getRecordKey('quarterly_goal_milestones', r), r])),
    quarterly_plans: new Map((fullBackup.tables.quarterly_plans || []).map(r => [getRecordKey('quarterly_plans', r), r])),
    data_snapshots: new Map((fullBackup.tables.data_snapshots || []).map(r => [getRecordKey('data_snapshots', r), r])),
  };

  // Apply each incremental backup in order
  for (const incBackup of incrementalBackups) {
    console.log(`  Applying ${incBackup.timestamp}...`);

    for (const [tableName, records] of Object.entries(incBackup.tables)) {
      if (!records || !Array.isArray(records)) continue;

      for (const record of records) {
        const key = getRecordKey(tableName, record);
        mergedTables[tableName].set(key, record);
      }
    }
  }

  // Convert maps back to arrays
  return {
    ...fullBackup,
    tables: {
      weeks: Array.from(mergedTables.weeks.values()),
      user_settings: Array.from(mergedTables.user_settings.values()),
      year_memories: Array.from(mergedTables.year_memories.values()),
      week_reviews: Array.from(mergedTables.week_reviews.values()),
      daily_shipping: Array.from(mergedTables.daily_shipping.values()),
      quarterly_goals: Array.from(mergedTables.quarterly_goals.values()),
      quarterly_goal_milestones: Array.from(mergedTables.quarterly_goal_milestones.values()),
    },
    metadata: {
      ...fullBackup.metadata,
      mergedIncrementals: incrementalBackups.length,
    }
  };
}

/**
 * Get a unique key for a record based on table's conflict key
 */
function getRecordKey(tableName, record) {
  const keyMap = {
    weeks: `${record.user_id}_${record.year}_${record.week_number}`,
    user_settings: record.user_id,
    year_memories: `${record.user_id}_${record.year}`,
    week_reviews: `${record.user_id}_${record.year}_${record.week_number}`,
    daily_shipping: `${record.user_id}_${record.year}_${record.month}_${record.day}`,
    quarterly_goals: record.id,
    quarterly_goal_milestones: record.id,
    quarterly_plans: `${record.user_id}_${record.plan_id}`,
    data_snapshots: record.id,
  };
  return keyMap[tableName] || record.id;
}

/**
 * Smart restore: automatically finds full backup + incrementals
 */
async function performSmartRestore(mode = 'upsert') {
  console.log(`\n🔄 Starting smart restore (auto-detecting backups)\n`);

  try {
    const backupsDir = join(__dirname, '../backups');

    // Find latest full backup
    const fullBackupPath = findLatestFullBackup(backupsDir);
    if (!fullBackupPath) {
      throw new Error('No full backup found. Please create a full backup first.');
    }

    console.log(`📦 Found full backup: ${fullBackupPath}`);
    const fullBackup = loadBackup(fullBackupPath);
    const fullBackupDate = new Date(fullBackup.timestamp);

    // Find incremental backups since the full backup
    const incrementalPaths = findIncrementalBackupsSince(backupsDir, fullBackupDate);
    console.log(`📦 Found ${incrementalPaths.length} incremental backups since full backup\n`);

    let finalBackup;
    if (incrementalPaths.length > 0) {
      const incrementalBackups = incrementalPaths.map(path => loadBackup(path));
      finalBackup = mergeIncrementalBackups(fullBackup, incrementalBackups);
    } else {
      finalBackup = fullBackup;
    }

    return finalBackup;
  } catch (error) {
    console.error(`\n❌ Smart restore failed: ${error.message}`);
    throw error;
  }
}

/**
 * Single file restore (legacy support)
 */
async function performSingleRestore(backupFile) {
  console.log(`\n🔄 Starting restore from ${backupFile}\n`);

  try {
    const backupPath = backupFile.startsWith('/')
      ? backupFile
      : join(__dirname, '../backups', backupFile);

    const backupData = loadBackup(backupPath);
    return backupData;
  } catch (error) {
    console.error(`\n❌ Restore failed: ${error.message}`);
    throw error;
  }
}

/**
 * Main restore function
 */
async function performRestore(backupFile, mode = 'upsert') {
  let backupData;

  if (!backupFile || backupFile === 'auto') {
    backupData = await performSmartRestore();
  } else {
    backupData = await performSingleRestore(backupFile);
  }

  // Display backup info
  console.log(`\n📊 Backup Information:`);
  console.log(`  • Created: ${backupData.timestamp}`);
  console.log(`  • Version: ${backupData.version}`);
  console.log(`  • Type: ${backupData.type || 'legacy'}`);
  if (backupData.metadata.mergedIncrementals) {
    console.log(`  • Merged incrementals: ${backupData.metadata.mergedIncrementals}`);
  }
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
    if (backupData.tables.quarterly_plans) {
      await restoreTable('quarterly_plans', backupData.tables.quarterly_plans, mode);
    }
    if (backupData.tables.data_snapshots) {
      await restoreTable('data_snapshots', backupData.tables.data_snapshots, mode);
    }

    console.log(`\n✅ Smart restore completed successfully!\n`);
}

// Parse command line arguments
const args = process.argv.slice(2);
const backupFile = args[0] || 'auto'; // Default to 'auto' for smart restore
const mode = args.includes('--replace') ? 'replace' : 'upsert';

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Usage: node restore-smart.js [backup-file] [--replace]

Arguments:
  backup-file    Path to backup file or 'auto' for smart restore (default: auto)
  --replace      Replace all existing data (default: upsert/merge)

Smart Restore:
  When using 'auto' or no argument, the script will:
  1. Find the most recent full backup
  2. Find all incremental backups since that full backup
  3. Merge them together for a complete restore

Examples:
  node restore-smart.js                              # Smart restore (auto-merge)
  node restore-smart.js auto                         # Same as above
  node restore-smart.js backup-full-2026-01-01.json  # Restore from specific full backup
  node restore-smart.js backup-inc-2026-01-05.json   # Restore from specific incremental
  node restore-smart.js auto --replace               # Smart restore, replace all data
`);
  process.exit(0);
}

// Run restore
performRestore(backupFile, mode);
