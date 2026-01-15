#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootEnvPath = join(__dirname, '../.env');
dotenv.config({ path: rootEnvPath });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SECRET_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SECRET_KEY in .env file');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function testTable(tableName) {
  try {
    const { data, error, count } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.log(`❌ ${tableName}: ${error.message}`);
      return false;
    }
    console.log(`✅ ${tableName}: exists (${count} records)`);
    return true;
  } catch (err) {
    console.log(`❌ ${tableName}: ${err.message}`);
    return false;
  }
}

async function main() {
  console.log('\n🔍 Testing Supabase connection and tables...\n');

  const tables = [
    'weeks',
    'user_settings',
    'year_memories',
    'week_reviews',
    'daily_shipping',
    'quarterly_plans',
    'data_snapshots'
  ];

  for (const table of tables) {
    await testTable(table);
  }

  console.log('\n✅ Test complete\n');
}

main().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});
