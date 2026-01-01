import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Setup environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;

// Get auth token from command line argument
const AUTH_TOKEN = process.argv[2];

if (!AUTH_TOKEN) {
  console.error('❌ Usage: node import-memories-from-csv.js <auth-token>');
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

// Month names as they appear in the CSV
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'];

/**
 * Parse memory CSV file (day-row × month-column format)
 * @param {string} csvContent - The CSV file content
 * @param {number} year - The year for these memories
 * @returns {Object} - Memories object with date keys (YYYY-MM-DD)
 */
function parseMemoryCSV(csvContent, year) {
  const lines = csvContent.split('\n');
  const memories = {};

  if (lines.length < 2) {
    console.warn('   ⚠️ CSV file has insufficient rows');
    return memories;
  }

  // Parse header to find month column indices
  const header = lines[0].split(',');
  const monthIndices = {};

  // Find which columns correspond to which months
  header.forEach((cell, index) => {
    const monthName = cell.trim();
    const monthIndex = MONTHS.indexOf(monthName);
    if (monthIndex !== -1) {
      monthIndices[monthIndex] = index;
    }
  });

  console.log(`   📅 Found ${Object.keys(monthIndices).length} month columns`);

  // Process each day row (skip header row)
  for (let rowNum = 1; rowNum <= 31; rowNum++) {
    if (rowNum >= lines.length) break;

    const line = lines[rowNum];
    if (!line.trim()) continue;

    const cells = line.split(',');

    // cells[0] is the day number, skip it
    // Process each month for this day
    for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
      const colIndex = monthIndices[monthIndex];
      if (colIndex === undefined) continue;

      // Get the memory text for this day and month
      let memoryText = '';

      // Handle multi-column spans (some months have multiple columns due to CSV formatting)
      // Collect all non-empty cells for this month
      if (colIndex < cells.length) {
        memoryText = cells[colIndex]?.trim() || '';

        // Sometimes memories span multiple columns, check next column too
        if (colIndex + 1 < cells.length && monthIndices[monthIndex + 1] !== colIndex + 1) {
          const nextCell = cells[colIndex + 1]?.trim() || '';
          if (nextCell && !MONTHS.includes(nextCell)) {
            memoryText = memoryText ? `${memoryText} ${nextCell}` : nextCell;
          }
        }
      }

      // Skip empty memories
      if (!memoryText) continue;

      // Validate date (skip invalid dates like Feb 30)
      const month = monthIndex + 1;
      const day = rowNum;
      const date = new Date(year, monthIndex, day);

      if (date.getMonth() !== monthIndex || date.getDate() !== day) {
        // Invalid date (e.g., Feb 30)
        continue;
      }

      // Format date as YYYY-MM-DD
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

      // Create memory entry
      const timestamp = date.getTime();
      memories[dateStr] = {
        date: dateStr,
        memory: memoryText,
        createdAt: timestamp,
        updatedAt: timestamp
      };
    }
  }

  return memories;
}

/**
 * Parse memory CSV with better handling of the specific format
 */
function parseMemoryCSVRobust(csvContent, year) {
  const memories = {};

  // Split into lines
  const lines = csvContent.split('\n').filter(line => line.trim());

  if (lines.length < 2) {
    console.warn('   ⚠️ CSV file has insufficient rows');
    return memories;
  }

  // Parse the header row to find month positions
  // The CSV has format: "回忆记录,January,,February,,March,..."
  // where months are separated by empty columns
  const headerCells = lines[0].split(',');
  const monthColumns = [];

  for (let i = 0; i < headerCells.length; i++) {
    const cell = headerCells[i].trim();
    const monthIndex = MONTHS.indexOf(cell);
    if (monthIndex !== -1) {
      monthColumns.push({ monthIndex, colIndex: i });
    }
  }

  console.log(`   📅 Found months at positions:`, monthColumns.map(m => `${MONTHS[m.monthIndex]}:${m.colIndex}`).join(', '));

  // Process data rows (rows 1-31 for days of month)
  for (let rowIdx = 1; rowIdx < lines.length && rowIdx <= 32; rowIdx++) {
    const line = lines[rowIdx];
    const cells = line.split(',');

    // First cell should be the day number
    const dayNum = parseInt(cells[0], 10);
    if (isNaN(dayNum) || dayNum < 1 || dayNum > 31) continue;

    // Process each month
    for (let i = 0; i < monthColumns.length; i++) {
      const { monthIndex, colIndex } = monthColumns[i];

      // Get memory text from this month's column
      // Memory might span the column and the next empty column
      let memoryText = '';

      if (colIndex < cells.length) {
        const cell1 = cells[colIndex]?.trim() || '';
        const cell2 = colIndex + 1 < cells.length ? cells[colIndex + 1]?.trim() || '' : '';

        // Combine cells if the second one isn't a month header
        memoryText = cell1;
        if (cell2 && !MONTHS.includes(cell2)) {
          memoryText = memoryText ? `${memoryText} ${cell2}` : cell2;
        }
      }

      if (!memoryText) continue;

      // Validate the date exists
      const testDate = new Date(year, monthIndex, dayNum);
      if (testDate.getMonth() !== monthIndex || testDate.getDate() !== dayNum) {
        continue; // Invalid date like Feb 30
      }

      // Create the date string
      const month = monthIndex + 1;
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;

      const timestamp = new Date(year, monthIndex, dayNum).getTime();
      memories[dateStr] = {
        date: dateStr,
        memory: memoryText,
        createdAt: timestamp,
        updatedAt: timestamp
      };
    }
  }

  return memories;
}

async function importMemories() {
  // Verify auth token and get user ID
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error('❌ Invalid auth token');
    process.exit(1);
  }

  const USER_ID = user.id;
  console.log('🚀 Starting memory import from CSV files...');
  console.log(`👤 Importing for user: ${user.email} (${USER_ID})\n`);

  // Look for Weekly Summary CSV files in the project root
  const projectRoot = path.join(__dirname, '../..');
  const memoryFiles = [
    { file: 'Weekly Summary-2024.csv', year: 2024 },
    { file: 'Weekly Summary-2025.csv', year: 2025 }
  ];

  let totalMemories = 0;
  let successCount = 0;
  let errorCount = 0;

  for (const { file, year } of memoryFiles) {
    const filePath = path.join(projectRoot, file);

    if (!fs.existsSync(filePath)) {
      console.log(`⚠️ File not found: ${file} (skipping)`);
      continue;
    }

    console.log(`\n📖 Processing ${file}...`);

    try {
      const csvContent = fs.readFileSync(filePath, 'utf-8');

      // Parse CSV to memory object structure
      const memories = parseMemoryCSVRobust(csvContent, year);

      const memoryCount = Object.keys(memories).length;
      console.log(`   ✨ Parsed ${memoryCount} memories for year ${year}`);

      if (memoryCount === 0) {
        console.log(`   ⚠️ No memories found in ${file}`);
        continue;
      }

      // Show sample of parsed memories
      const sampleDates = Object.keys(memories).slice(0, 3);
      console.log(`   📝 Sample memories:`);
      sampleDates.forEach(date => {
        console.log(`      ${date}: "${memories[date].memory}"`);
      });

      // Insert into Supabase
      const { error } = await supabase
        .from('year_memories')
        .upsert({
          user_id: USER_ID,
          year: year,
          memories: memories,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,year'
        });

      if (error) {
        console.error(`   ❌ DB Insert failed:`, error.message);
        errorCount++;
      } else {
        console.log(`   ✅ Successfully imported ${memoryCount} memories to database!`);
        totalMemories += memoryCount;
        successCount++;
      }

    } catch (err) {
      console.error(`   ❌ Error processing file:`, err.message);
      console.error(err.stack);
      errorCount++;
    }
  }

  console.log('\n==========================================');
  console.log('🎉 Memory import finished!');
  console.log(`📊 Total memories imported: ${totalMemories}`);
  console.log(`✅ Files processed successfully: ${successCount}`);
  console.log(`❌ Failed: ${errorCount}`);
  console.log('==========================================');
}

importMemories();
