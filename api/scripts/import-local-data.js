import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { parseTimeCSV } from '../src/csv.js';

// Setup environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;

// Get auth token from command line argument
const AUTH_TOKEN = process.argv[2];

if (!AUTH_TOKEN) {
  console.error('❌ Usage: node import-local-data.js <auth-token>');
  console.error('   Get your token by running: node get-auth-token.js <email> <password>');
  console.error('   Or copy it from your .env file (VITE_AUTH_TOKEN)\n');
  process.exit(1);
}

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_PUBLISHABLE_KEY in .env file');
  process.exit(1);
}

// Create client with auth token (respects RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  global: {
    headers: { Authorization: `Bearer ${AUTH_TOKEN}` }
  }
});

const RAW_DATA_DIR = path.join(__dirname, '../../raw_data');

async function importLocalData() {
  // Verify auth token and get user ID
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error('❌ Invalid auth token');
    process.exit(1);
  }

  const USER_ID = user.id;
  console.log('🚀 Starting local data import...');
  console.log(`👤 Importing for user: ${user.email} (${USER_ID})`);
  console.log(`📂 Reading from: ${RAW_DATA_DIR}`);

  if (!fs.existsSync(RAW_DATA_DIR)) {
    console.error(`❌ Directory not found: ${RAW_DATA_DIR}`);
    return;
  }

  const files = fs.readdirSync(RAW_DATA_DIR).filter(f => f.endsWith('.csv'));
  console.log(`📊 Found ${files.length} CSV files.`);

  let successCount = 0;
  let errorCount = 0;

  for (const file of files) {
    console.log(`\nProcessing ${file}...`);

    // Parse filename: "YYYY-MM-DD.csv" (start date of the week)
    const match = file.match(/^(\d{4})-(\d{2})-(\d{2})\.csv$/);

    let year, weekNumber;

    if (match) {
      const fileYear = parseInt(match[1], 10);
      const fileMonth = parseInt(match[2], 10) - 1; // JavaScript months are 0-indexed
      const fileDay = parseInt(match[3], 10);

      // Create date from filename in UTC (noon to avoid day boundary issues)
      const startDate = new Date(Date.UTC(fileYear, fileMonth, fileDay, 12));

      // Calculate US week number (Sunday-based, UTC) to match frontend
      const d = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate()));
      year = d.getUTCFullYear();

      // Check if date is in December and might be in next year's week 1
      if (d.getUTCMonth() === 11 && d.getUTCDate() >= 25) {
        const nextJan1 = new Date(Date.UTC(year + 1, 0, 1));
        const nextJan1Day = nextJan1.getUTCDay();

        // Find first Sunday on or before next year's Jan 1
        const nextYearFirstSunday = new Date(nextJan1);
        if (nextJan1Day !== 0) {
          nextYearFirstSunday.setUTCDate(nextJan1.getUTCDate() - nextJan1Day);
        }

        // If current date is on or after next year's week 1 start, use next year
        if (d >= nextYearFirstSunday) {
          weekNumber = 1;
          year = year + 1;
        }
      }

      // If not already set, calculate for current year
      if (!weekNumber) {
        const jan1 = new Date(Date.UTC(year, 0, 1));
        const jan1Day = jan1.getUTCDay();

        // Find first Sunday on or before Jan 1 (Week 1 always contains Jan 1)
        const firstSunday = new Date(jan1);
        if (jan1Day !== 0) {
          firstSunday.setUTCDate(jan1.getUTCDate() - jan1Day);
        }

        const daysSinceFirstSunday = Math.floor((d.getTime() - firstSunday.getTime()) / 86400000);
        weekNumber = Math.floor(daysSinceFirstSunday / 7) + 1;
      }

      console.log(`   -> Week start: ${startDate.toISOString().split('T')[0]}`);
      console.log(`   -> US Week (UTC): ${year}-W${String(weekNumber).padStart(2, '0')}`);
    } else {
       // Fallback or ignore other files
       console.warn(`   ⚠️ Filename format not recognized (expected YYYY-MM-DD.csv): ${file}. Skipping.`);
       // Don't count as error if it's just a sample or other file
       continue;
    }

    try {
      const filePath = path.join(RAW_DATA_DIR, file);
      const csvContent = fs.readFileSync(filePath, 'utf-8');
      
      // Parse CSV to JSON structure
      const { weekData } = parseTimeCSV(csvContent);
      
      // Insert into Supabase
      const { error } = await supabase
        .from('weeks')
        .upsert({
          user_id: USER_ID,
          year: year,
          week_number: weekNumber,
          week_data: weekData,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,year,week_number'
        });

      if (error) {
        console.error(`   ❌ DB Insert failed:`, error.message);
        errorCount++;
      } else {
        console.log(`   ✅ Imported successfully!`);
        successCount++;
      }

    } catch (err) {
      console.error(`   ❌ Error processing file:`, err.message);
      errorCount++;
    }
  }

  console.log('\n==========================================');
  console.log('🎉 Import finished!');
  console.log(`✅ Success: ${successCount}`);
  console.log(`❌ Failed: ${errorCount}`);
  console.log('==========================================');
}

importLocalData();
