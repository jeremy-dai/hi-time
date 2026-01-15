import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import { parseTimeCSV, exportTimeCSV } from './csv.js';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load .env from root directory before reading environment variables
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootEnvPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: rootEnvPath });

const ALLOW_ORIGIN = process.env.ALLOW_ORIGIN || 'http://localhost:5173';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;
const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;

const MAX_DAYS = 7;
const MAX_SLOTS = 34; // 17 hours * 2 (30-minute blocks)

const app = express();
app.use(cors({ origin: ALLOW_ORIGIN }));
app.use(express.json({ limit: '2mb' }));

function sanitizeWeekData(weekData) {
  const makeEmptyDay = () => [];
  if (!Array.isArray(weekData)) {
    return Array.from({ length: MAX_DAYS }, () => makeEmptyDay());
  }

  const days = weekData.slice(0, MAX_DAYS);
  while (days.length < MAX_DAYS) {
    days.push(makeEmptyDay());
  }

  return days.map(day => Array.isArray(day) ? day.slice(0, MAX_SLOTS) : makeEmptyDay());
}

// Init Supabase
// Note: We need SUPABASE_URL and SUPABASE_SECRET_KEY in environment variables
let supabase;

// Initialize admin Supabase client (for scripts/imports only)
export function initSupabase() {
  if (supabase) return;
  if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
    console.error('Missing SUPABASE_URL or SUPABASE_SECRET_KEY env vars');
    return;
  }
  supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);
}

// Create authenticated Supabase client from user's JWT token
function getAuthenticatedClient(authToken) {
  if (!authToken || !SUPABASE_PUBLISHABLE_KEY) return null;

  // Create client with user's token (respects RLS)
  return createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    global: {
      headers: { Authorization: `Bearer ${authToken}` }
    }
  });
}

function parseWeekKey(weekKey) {
  // Format: "YYYY-Www" e.g., "2023-W40"
  const match = weekKey.match(/^(\d{4})-W(\d{1,2})$/);
  if (!match) return null;
  return {
    year: parseInt(match[1], 10),
    week: parseInt(match[2], 10),
  };
}

// Authentication middleware
app.use(async (req, res, next) => {
  // Public routes (no auth needed)
  const publicRoutes = ['/api/health', '/api/weeks/.*/import'];
  const isPublicRoute = publicRoutes.some(route => {
    const regex = new RegExp(`^${route}$`);
    return regex.test(req.path);
  }) || req.path === '/api/health';

  if (isPublicRoute) {
    return next();
  }

  try {
    // Get auth token from header
    const authToken = req.header('Authorization')?.replace('Bearer ', '');
    if (!authToken) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Create authenticated client
    const authenticatedClient = getAuthenticatedClient(authToken);
    if (!authenticatedClient) {
      return res.status(401).json({ error: 'Invalid authentication' });
    }

    // Verify user
    const { data: { user }, error } = await authenticatedClient.auth.getUser();
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Attach to request for use in route handlers
    req.user = user;
    req.supabase = authenticatedClient;

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Authentication failed' });
  }
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/weeks', async (req, res) => {
  // RLS automatically filters by authenticated user
  const { data, error } = await req.supabase
    .from('weeks')
    .select('year, week_number');

  if (error) {
    console.error('Error fetching weeks:', error);
    return res.status(500).json({ error: 'Failed to fetch weeks' });
  }

  // Convert back to "YYYY-Www" format for frontend compatibility
  const weeks = data.map(d =>
    `${d.year}-W${String(d.week_number).padStart(2, '0')}`
  );

  res.json({ weeks });
});

app.get('/api/weeks/:week_key', async (req, res) => {
  const { week_key } = req.params;
  const parsed = parseWeekKey(week_key);

  if (!parsed) {
    return res.status(400).json({ error: 'Invalid week key format' });
  }

  // RLS automatically filters by authenticated user
  const { data, error} = await req.supabase
    .from('weeks')
    .select('week_data, starting_hour, theme, updated_at')
    .eq('year', parsed.year)
    .eq('week_number', parsed.week)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 is "Row not found"
    console.error('Error fetching week data:', error);
    return res.status(500).json({ error: 'Failed to fetch week data' });
  }

  res.json({
    weekData: data ? sanitizeWeekData(data.week_data) : null,
    startingHour: data?.starting_hour ?? 8,
    theme: data?.theme || null,
    updatedAt: data?.updated_at ? new Date(data.updated_at).getTime() : null
  });
});

app.post('/api/weeks/batch', async (req, res) => {
  const { weekKeys } = req.body;

  if (!Array.isArray(weekKeys) || weekKeys.length === 0) {
    return res.json({ weeks: {} });
  }

  // Parse keys to get years and week numbers
  const parsedKeys = weekKeys.map(key => {
    const parsed = parseWeekKey(key);
    return parsed ? { ...parsed, key } : null;
  }).filter(Boolean);

  if (parsedKeys.length === 0) {
    return res.json({ weeks: {} });
  }

  // Construct query
  // Since we need to match (year, week) pairs, we can use the .or() syntax with multiple conditions
  // format: year.eq.2024,week_number.eq.1,year.eq.2024,week_number.eq.2...
  // But Supabase/PostgREST 'or' syntax is tricky for pairs.
  // Alternative: Fetch all weeks for the years involved and filter in memory (efficient if not too many years)
  // OR use a custom RPC if we had one.
  // OR just loop if it's small batch? No, that defeats the purpose.
  // Best approach for PostgREST: use 'in' for years and then filter?
  // Actually, constructing a long OR string is standard for this:
  // or=(and(year.eq.2024,week_number.eq.1),and(year.eq.2024,week_number.eq.2))
  
  const orConditions = parsedKeys
    .map(p => `and(year.eq.${p.year},week_number.eq.${p.week})`)
    .join(',');

  const { data, error } = await req.supabase
    .from('weeks')
    .select('year, week_number, week_data, starting_hour, theme, updated_at')
    .or(orConditions);

  if (error) {
    console.error('Error batch fetching weeks:', error);
    return res.status(500).json({ error: 'Failed to fetch weeks' });
  }

  // Map back to response format
  const result = {};

  // Initialize all requested keys as null first
  weekKeys.forEach(key => {
    result[key] = null;
  });

  // Fill in found data
  data.forEach(d => {
    const key = `${d.year}-W${String(d.week_number).padStart(2, '0')}`;
    result[key] = {
      weekData: sanitizeWeekData(d.week_data),
      startingHour: d.starting_hour ?? 8,
      theme: d.theme || null,
      updatedAt: d.updated_at ? new Date(d.updated_at).getTime() : null
    };
  });

  res.json({ weeks: result });
});

app.put('/api/weeks/:week_key', async (req, res) => {
  const { week_key } = req.params;
  const { weekData, startingHour, theme } = req.body || {};

  if (!weekData) {
    return res.status(400).json({ error: 'weekData is required' });
  }

  const parsed = parseWeekKey(week_key);
  if (!parsed) {
    return res.status(400).json({ error: 'Invalid week key format' });
  }

  const sanitizedWeekData = sanitizeWeekData(weekData);

  // Prepare upsert data
  // Frontend should always send complete metadata to avoid race conditions
  const upsertData = {
    user_id: req.user.id,
    year: parsed.year,
    week_number: parsed.week,
    week_data: sanitizedWeekData,
    starting_hour: startingHour ?? 8, // Use provided or default
    theme: theme === undefined ? null : theme, // Explicitly handle null vs undefined
    updated_at: new Date().toISOString(),
  };

  // RLS requires user_id to match authenticated user
  const { error } = await req.supabase
    .from('weeks')
    .upsert(upsertData, {
      onConflict: 'user_id,year,week_number'
    });

  if (error) {
    console.error('Error saving week data:', error);
    return res.status(500).json({ error: 'Failed to save week data' });
  }

  res.json({ ok: true });
});

app.post('/api/weeks/:week_key/import', async (req, res) => {
  const { csv_text } = req.body || {};
  if (!csv_text || typeof csv_text !== 'string') {
    return res.status(400).json({ error: 'csv_text is required' });
  }
  try {
    const parsed = parseTimeCSV(csv_text);
    res.json({ weekData: parsed.weekData });
  } catch (e) {
    res.status(400).json({ error: String(e?.message || e) });
  }
});

app.get('/api/weeks/:week_key/export', async (req, res) => {
  const { week_key } = req.params;
  const parsed = parseWeekKey(week_key);

  if (!parsed) {
    return res.status(400).json({ error: 'Invalid week key format' });
  }

  // RLS automatically filters by authenticated user
  const { data, error } = await req.supabase
    .from('weeks')
    .select('week_data, starting_hour')
    .eq('year', parsed.year)
    .eq('week_number', parsed.week)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching week data for export:', error);
    return res.status(500).json({ error: 'Failed to fetch data' });
  }

  const weekData = sanitizeWeekData(data?.week_data || []);
  const startingHour = data?.starting_hour ?? 8;
  const csv_text = exportTimeCSV(weekData, startingHour);
  res.json({ csv_text });
});

// Bulk Export API
app.get('/api/export/bulk', async (req, res) => {
  const { start, end } = req.query;

  if (!start || !end) {
    return res.status(400).json({ error: 'start and end week keys are required (YYYY-Www)' });
  }

  const startParsed = parseWeekKey(start);
  const endParsed = parseWeekKey(end);

  if (!startParsed || !endParsed) {
    return res.status(400).json({ error: 'Invalid week key format' });
  }

  // Determine year range and week range
  // This logic is simple if within same year, but complex if crossing years.
  // We can query Supabase for all weeks between these keys.
  // Since we store year and week_number as integers, we can filter easily.
  
  // Construct a query to get all weeks in range.
  // Logic: 
  // (year > startYear OR (year == startYear AND week >= startWeek))
  // AND
  // (year < endYear OR (year == endYear AND week <= endWeek))
  
  const { data: weeks, error } = await req.supabase
    .from('weeks')
    .select('year, week_number, week_data, starting_hour')
    .or(`year.gt.${startParsed.year},and(year.eq.${startParsed.year},week_number.gte.${startParsed.week})`)
    .or(`year.lt.${endParsed.year},and(year.eq.${endParsed.year},week_number.lte.${endParsed.week})`)
    .order('year', { ascending: true })
    .order('week_number', { ascending: true });

  if (error) {
    console.error('Error fetching bulk export data:', error);
    return res.status(500).json({ error: 'Failed to fetch data' });
  }

  // Now verify the AND condition manually if OR query returned too much (Supabase OR syntax can be tricky combined)
  // Actually, the above query structure might be misinterpreted by PostgREST as (A OR B) AND (C OR D) if we chain .or().
  // Let's filter in memory if the dataset isn't huge, or refine the query.
  // Given user scale, in-memory filtering is fine.
  
  const filteredWeeks = weeks.filter(w => {
    const isAfterStart = w.year > startParsed.year || (w.year === startParsed.year && w.week_number >= startParsed.week);
    const isBeforeEnd = w.year < endParsed.year || (w.year === endParsed.year && w.week_number <= endParsed.week);
    return isAfterStart && isBeforeEnd;
  });

  // Combine CSVs
  // Strategy: We can either zip them, or combine into one big CSV if format allows?
  // The user asked for "export csv", usually meaning one file. 
  // If we concatenate weeks, we need to handle headers.
  // Option 1: One big CSV with "Week" column?
  // Option 2: Just concatenate with headers repeated (simple but messy).
  // Option 3: Return a JSON with map of filename -> content (frontend zips it)?
  // Let's try to make one big CSV with a "Week" column added to the header?
  // Or just concatenate them with a blank line in between.
  
  let combinedCSV = '';
  
  for (const week of filteredWeeks) {
      const weekKey = `${week.year}-W${String(week.week_number).padStart(2, '0')}`;
      const startingHour = week.starting_hour ?? 8;
      combinedCSV += `Week: ${weekKey}\n`;
      combinedCSV += exportTimeCSV(week.week_data, startingHour);
      combinedCSV += '\n\n';
  }

  res.json({ csv_text: combinedCSV });
});

// Settings API
app.get('/api/settings', async (req, res) => {
  // RLS automatically filters by authenticated user
  const { data, error } = await req.supabase
    .from('user_settings')
    .select('settings')
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching settings:', error);
    return res.status(500).json({ error: 'Failed to fetch settings' });
  }

  res.json({ settings: data?.settings || {} });
});

app.put('/api/settings', async (req, res) => {
  const { settings } = req.body || {};

  if (!settings) {
    return res.status(400).json({ error: 'settings is required' });
  }

  // RLS requires user_id to match authenticated user
  const { error } = await req.supabase
    .from('user_settings')
    .upsert({
      user_id: req.user.id,
      settings,
      updated_at: new Date().toISOString(),
    });

  if (error) {
    console.error('Error saving settings:', error);
    return res.status(500).json({ error: 'Failed to save settings' });
  }

  res.json({ ok: true });
});

// Memories API
app.get('/api/memories/:year', async (req, res) => {
  const year = parseInt(req.params.year, 10);

  if (!year || isNaN(year)) {
    return res.status(400).json({ error: 'Invalid year parameter' });
  }

  // RLS automatically filters by authenticated user
  const { data, error } = await req.supabase
    .from('year_memories')
    .select('memories')
    .eq('year', year)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 is "Row not found"
    console.error('Error fetching memories:', error);
    return res.status(500).json({ error: 'Failed to fetch memories' });
  }

  res.json({
    memories: data ? { year, memories: data.memories } : null
  });
});

app.put('/api/memories/:year', async (req, res) => {
  const year = parseInt(req.params.year, 10);
  const { memories } = req.body || {};

  if (!year || isNaN(year)) {
    return res.status(400).json({ error: 'Invalid year parameter' });
  }

  if (!memories || typeof memories !== 'object') {
    return res.status(400).json({ error: 'memories object is required' });
  }

  // RLS requires user_id to match authenticated user
  const { error } = await req.supabase
    .from('year_memories')
    .upsert({
      user_id: req.user.id,
      year,
      memories,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id,year'
    });

  if (error) {
    console.error('Error saving memories:', error);
    return res.status(500).json({ error: 'Failed to save memories' });
  }

  res.json({ ok: true });
});

// Week Reviews API
app.get('/api/reviews/:year', async (req, res) => {
  const year = parseInt(req.params.year, 10);

  if (!year || isNaN(year)) {
    return res.status(400).json({ error: 'Invalid year parameter' });
  }

  // RLS automatically filters by authenticated user
  const { data, error } = await req.supabase
    .from('week_reviews')
    .select('*')
    .eq('year', year)
    .order('week_number', { ascending: true });

  if (error) {
    console.error('Error fetching week reviews:', error);
    return res.status(500).json({ error: 'Failed to fetch week reviews' });
  }

  // Transform array to keyed object
  const reviews = {};
  if (data) {
    data.forEach(review => {
      reviews[review.week_number] = {
        year: review.year,
        weekNumber: review.week_number,
        review: review.review,
        createdAt: new Date(review.created_at).getTime(),
        updatedAt: new Date(review.updated_at).getTime(),
      };
    });
  }

  res.json({
    reviews: { year, reviews }
  });
});

app.put('/api/reviews/:year/:weekNumber', async (req, res) => {
  const year = parseInt(req.params.year, 10);
  const weekNumber = parseInt(req.params.weekNumber, 10);
  const { review } = req.body || {};

  console.log(`PUT /api/reviews/${req.params.year}/${req.params.weekNumber} - Parsed: year=${year}, weekNumber=${weekNumber}`);

  if (!year || isNaN(year)) {
    return res.status(400).json({ error: 'Invalid year parameter' });
  }

  // Allow week_number = 0 for annual reviews, 1-53 for weekly reviews
  if (isNaN(weekNumber) || weekNumber < 0 || weekNumber > 53) {
    console.log(`Invalid week number: weekNumber=${weekNumber}, isNaN=${isNaN(weekNumber)}, < 0=${weekNumber < 0}, > 53=${weekNumber > 53}`);
    return res.status(400).json({ error: 'Invalid week number (must be 0-53, where 0 is annual review)' });
  }

  if (!review || typeof review !== 'string') {
    return res.status(400).json({ error: 'review string is required' });
  }

  // First, check if this review already exists to preserve created_at
  const { data: existing } = await req.supabase
    .from('week_reviews')
    .select('created_at')
    .eq('year', year)
    .eq('week_number', weekNumber)
    .single();

  // RLS requires user_id to match authenticated user
  const upsertData = {
    user_id: req.user.id,
    year,
    week_number: weekNumber,
    review,
    updated_at: new Date().toISOString(),
  };

  // Only set created_at if this is a new record
  if (!existing) {
    upsertData.created_at = new Date().toISOString();
  }

  console.log('Upsert data:', JSON.stringify(upsertData, null, 2));

  const { error } = await req.supabase
    .from('week_reviews')
    .upsert(upsertData, {
      onConflict: 'user_id,year,week_number'
    });

  if (error) {
    console.error('Error saving week review:', error);
    return res.status(500).json({ error: 'Failed to save week review' });
  }

  res.json({ ok: true });
});

app.delete('/api/reviews/:year/:weekNumber', async (req, res) => {
  const year = parseInt(req.params.year, 10);
  const weekNumber = parseInt(req.params.weekNumber, 10);

  if (!year || isNaN(year)) {
    return res.status(400).json({ error: 'Invalid year parameter' });
  }

  // Allow week_number = 0 for annual reviews, 1-53 for weekly reviews
  if (isNaN(weekNumber) || weekNumber < 0 || weekNumber > 53) {
    return res.status(400).json({ error: 'Invalid week number (must be 0-53, where 0 is annual review)' });
  }

  // RLS automatically filters by authenticated user
  const { error } = await req.supabase
    .from('week_reviews')
    .delete()
    .eq('year', year)
    .eq('week_number', weekNumber);

  if (error) {
    console.error('Error deleting week review:', error);
    return res.status(500).json({ error: 'Failed to delete week review' });
  }

  res.json({ ok: true });
});

// Daily Shipping API
app.get('/api/shipping/:year', async (req, res) => {
  const year = parseInt(req.params.year, 10);

  if (!year || isNaN(year)) {
    return res.status(400).json({ error: 'Invalid year parameter' });
  }

  // RLS automatically filters by authenticated user
  const { data, error } = await req.supabase
    .from('daily_shipping')
    .select('*')
    .eq('year', year)
    .order('month', { ascending: true })
    .order('day', { ascending: true });

  if (error) {
    console.error('Error fetching daily shipping:', error);
    return res.status(500).json({ error: 'Failed to fetch daily shipping' });
  }

  // Transform array to keyed object (YYYY-MM-DD format)
  const entries = {};
  if (data) {
    data.forEach(entry => {
      const dateKey = `${entry.year}-${String(entry.month).padStart(2, '0')}-${String(entry.day).padStart(2, '0')}`;
      entries[dateKey] = {
        year: entry.year,
        month: entry.month,
        day: entry.day,
        shipped: entry.shipped,
        completed: entry.completed || false,
        createdAt: new Date(entry.created_at).getTime(),
        updatedAt: new Date(entry.updated_at).getTime(),
      };
    });
  }

  res.json({
    shipping: { year, entries }
  });
});

app.put('/api/shipping/:year/:month/:day', async (req, res) => {
  const year = parseInt(req.params.year, 10);
  const month = parseInt(req.params.month, 10);
  const day = parseInt(req.params.day, 10);
  const { shipped, completed } = req.body || {};

  if (!year || isNaN(year)) {
    return res.status(400).json({ error: 'Invalid year parameter' });
  }

  if (!month || isNaN(month) || month < 1 || month > 12) {
    return res.status(400).json({ error: 'Invalid month (must be 1-12)' });
  }

  if (!day || isNaN(day) || day < 1 || day > 31) {
    return res.status(400).json({ error: 'Invalid day (must be 1-31)' });
  }

  if (!shipped || typeof shipped !== 'string') {
    return res.status(400).json({ error: 'shipped string is required' });
  }

  // RLS requires user_id to match authenticated user
  const { error } = await req.supabase
    .from('daily_shipping')
    .upsert({
      user_id: req.user.id,
      year,
      month,
      day,
      shipped,
      completed: completed || false,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id,year,month,day'
    });

  if (error) {
    console.error('Error saving daily shipping:', error);
    return res.status(500).json({ error: 'Failed to save daily shipping' });
  }

  res.json({ ok: true });
});

app.delete('/api/shipping/:year/:month/:day', async (req, res) => {
  const year = parseInt(req.params.year, 10);
  const month = parseInt(req.params.month, 10);
  const day = parseInt(req.params.day, 10);

  if (!year || isNaN(year)) {
    return res.status(400).json({ error: 'Invalid year parameter' });
  }

  if (!month || isNaN(month)) {
    return res.status(400).json({ error: 'Invalid month' });
  }

  if (!day || isNaN(day)) {
    return res.status(400).json({ error: 'Invalid day' });
  }

  // RLS automatically filters by authenticated user
  const { error } = await req.supabase
    .from('daily_shipping')
    .delete()
    .eq('year', year)
    .eq('month', month)
    .eq('day', day);

  if (error) {
    console.error('Error deleting daily shipping:', error);
    return res.status(500).json({ error: 'Failed to delete daily shipping' });
  }

  res.json({ ok: true });
});

// ============================================================================
// Legacy Quarterly Goals API (DEPRECATED - tables dropped in migration 02)
// These endpoints now return empty data for backwards compatibility
// ============================================================================

// GET /api/goals/:year/:quarter - Return empty goals data
app.get('/api/goals/:year/:quarter', async (req, res) => {
  const { year, quarter } = req.params;

  const yearNum = parseInt(year, 10);
  const quarterNum = parseInt(quarter, 10);

  if (isNaN(yearNum) || yearNum < 2000 || yearNum > 2100) {
    return res.status(400).json({ error: 'Invalid year' });
  }

  if (isNaN(quarterNum) || quarterNum < 1 || quarterNum > 4) {
    return res.status(400).json({ error: 'Invalid quarter (must be 1-4)' });
  }

  // Return empty data since tables no longer exist
  res.json({
    goals: {
      year: yearNum,
      quarter: quarterNum,
      goals: [],
    },
  });
});

// ============================================================================
// Data Snapshots API (History/Version Control)
// ============================================================================

const MAX_SNAPSHOTS_PER_ENTITY = 50;

// GET /api/snapshots/:entityType/:entityKey - Get all snapshots for an entity
app.get('/api/snapshots/:entityType/:entityKey', async (req, res) => {
  const { entityType, entityKey } = req.params;

  if (!entityType || !entityKey) {
    return res.status(400).json({ error: 'entityType and entityKey are required' });
  }

  try {
    // RLS automatically filters by authenticated user
    const { data, error } = await req.supabase
      .from('data_snapshots')
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_key', entityKey)
      .order('created_at', { ascending: false })
      .limit(MAX_SNAPSHOTS_PER_ENTITY);

    if (error) {
      console.error('Error fetching snapshots:', error);
      return res.status(500).json({ error: 'Failed to fetch snapshots' });
    }

    // Transform to frontend format
    const snapshots = (data || []).map(s => ({
      id: s.id,
      timestamp: new Date(s.created_at).getTime(),
      description: s.description || '',
      data: s.data,
      metadata: s.metadata || {},
      type: s.snapshot_type || 'manual',
    }));

    res.json({ snapshots });
  } catch (error) {
    console.error('Error in GET /api/snapshots:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/snapshots/:entityType/:entityKey - Create a new snapshot
app.post('/api/snapshots/:entityType/:entityKey', async (req, res) => {
  const { entityType, entityKey } = req.params;
  const { data, metadata, description, snapshotType } = req.body;

  if (!entityType || !entityKey) {
    return res.status(400).json({ error: 'entityType and entityKey are required' });
  }

  if (!data) {
    return res.status(400).json({ error: 'data is required' });
  }

  const validTypes = ['manual', 'auto', 'restore'];
  const type = validTypes.includes(snapshotType) ? snapshotType : 'manual';

  try {
    // Check current snapshot count and delete oldest if at limit
    const { data: existingSnapshots, error: countError } = await req.supabase
      .from('data_snapshots')
      .select('id, created_at')
      .eq('entity_type', entityType)
      .eq('entity_key', entityKey)
      .order('created_at', { ascending: false });

    if (countError) {
      console.error('Error checking snapshot count:', countError);
      return res.status(500).json({ error: 'Failed to check snapshot count' });
    }

    // If at or over limit, delete oldest snapshots
    if (existingSnapshots && existingSnapshots.length >= MAX_SNAPSHOTS_PER_ENTITY) {
      const snapshotsToDelete = existingSnapshots.slice(MAX_SNAPSHOTS_PER_ENTITY - 1);
      const idsToDelete = snapshotsToDelete.map(s => s.id);

      const { error: deleteError } = await req.supabase
        .from('data_snapshots')
        .delete()
        .in('id', idsToDelete);

      if (deleteError) {
        console.error('Error deleting old snapshots:', deleteError);
        // Continue anyway, non-critical
      }
    }

    // Create new snapshot
    const { data: snapshot, error } = await req.supabase
      .from('data_snapshots')
      .insert({
        user_id: req.user.id,
        entity_type: entityType,
        entity_key: entityKey,
        snapshot_type: type,
        description: description || null,
        data: data,
        metadata: metadata || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating snapshot:', error);
      return res.status(500).json({ error: 'Failed to create snapshot' });
    }

    res.json({
      snapshot: {
        id: snapshot.id,
        timestamp: new Date(snapshot.created_at).getTime(),
        description: snapshot.description || '',
        data: snapshot.data,
        metadata: snapshot.metadata || {},
        type: snapshot.snapshot_type,
      },
    });
  } catch (error) {
    console.error('Error in POST /api/snapshots:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/snapshots/:snapshotId - Delete a specific snapshot
app.delete('/api/snapshots/:snapshotId', async (req, res) => {
  const { snapshotId } = req.params;

  if (!snapshotId) {
    return res.status(400).json({ error: 'snapshotId is required' });
  }

  try {
    // RLS automatically ensures user can only delete their own snapshots
    const { error } = await req.supabase
      .from('data_snapshots')
      .delete()
      .eq('id', snapshotId);

    if (error) {
      console.error('Error deleting snapshot:', error);
      return res.status(500).json({ error: 'Failed to delete snapshot' });
    }

    res.json({ ok: true });
  } catch (error) {
    console.error('Error in DELETE /api/snapshots:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/snapshots/:entityType/:entityKey/all - Delete all snapshots for an entity
app.delete('/api/snapshots/:entityType/:entityKey/all', async (req, res) => {
  const { entityType, entityKey } = req.params;

  if (!entityType || !entityKey) {
    return res.status(400).json({ error: 'entityType and entityKey are required' });
  }

  try {
    // RLS automatically ensures user can only delete their own snapshots
    const { error } = await req.supabase
      .from('data_snapshots')
      .delete()
      .eq('entity_type', entityType)
      .eq('entity_key', entityKey);

    if (error) {
      console.error('Error deleting all snapshots:', error);
      return res.status(500).json({ error: 'Failed to delete snapshots' });
    }

    res.json({ ok: true });
  } catch (error) {
    console.error('Error in DELETE /api/snapshots/all:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================================================
// Quarterly Plans API (Pattern 2: Debounced Sync - DB is source of truth)
// ============================================================================

// GET /api/plans - List all plans for the user
app.get('/api/plans', async (req, res) => {
  try {
    // RLS automatically filters by authenticated user
    const { data, error } = await req.supabase
      .from('quarterly_plans')
      .select('plan_id, plan_data, created_at, updated_at')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching plans:', error);
      return res.status(500).json({ error: 'Failed to fetch plans' });
    }

    // Return list of plans with basic metadata
    const plans = (data || []).map(p => ({
      planId: p.plan_id,
      name: p.plan_data?.plan?.name || p.plan_id,
      description: p.plan_data?.plan?.description || '',
      createdAt: new Date(p.created_at).getTime(),
      updatedAt: new Date(p.updated_at).getTime(),
    }));

    res.json({ plans });
  } catch (error) {
    console.error('Error in GET /api/plans:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/plans/:planId - Get a specific plan
app.get('/api/plans/:planId', async (req, res) => {
  const { planId } = req.params;

  if (!planId) {
    return res.status(400).json({ error: 'planId is required' });
  }

  try {
    // RLS automatically filters by authenticated user
    const { data, error } = await req.supabase
      .from('quarterly_plans')
      .select('*')
      .eq('plan_id', planId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "Row not found"
      console.error('Error fetching plan:', error);
      return res.status(500).json({ error: 'Failed to fetch plan' });
    }

    if (!data) {
      return res.json({ plan: null });
    }

    res.json({
      plan: {
        planId: data.plan_id,
        planData: data.plan_data,
        createdAt: new Date(data.created_at).getTime(),
        updatedAt: new Date(data.updated_at).getTime(),
      }
    });
  } catch (error) {
    console.error('Error in GET /api/plans/:planId:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/plans/:planId - Create or update a plan
app.put('/api/plans/:planId', async (req, res) => {
  const { planId } = req.params;
  const { planData } = req.body;

  if (!planId) {
    return res.status(400).json({ error: 'planId is required' });
  }

  if (!planData || typeof planData !== 'object') {
    return res.status(400).json({ error: 'planData object is required' });
  }

  try {
    // RLS requires user_id to match authenticated user
    const { error } = await req.supabase
      .from('quarterly_plans')
      .upsert({
        user_id: req.user.id,
        plan_id: planId,
        plan_data: planData,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,plan_id'
      });

    if (error) {
      console.error('Error saving plan:', error);
      return res.status(500).json({ error: 'Failed to save plan' });
    }

    res.json({ ok: true });
  } catch (error) {
    console.error('Error in PUT /api/plans/:planId:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/plans/:planId - Delete a plan
app.delete('/api/plans/:planId', async (req, res) => {
  const { planId } = req.params;

  if (!planId) {
    return res.status(400).json({ error: 'planId is required' });
  }

  try {
    // RLS automatically ensures user can only delete their own plans
    const { error } = await req.supabase
      .from('quarterly_plans')
      .delete()
      .eq('plan_id', planId);

    if (error) {
      console.error('Error deleting plan:', error);
      return res.status(500).json({ error: 'Failed to delete plan' });
    }

    res.json({ ok: true });
  } catch (error) {
    console.error('Error in DELETE /api/plans/:planId:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default app;
