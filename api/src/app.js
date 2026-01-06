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
// Quarterly Goals API
// ============================================================================

// GET /api/goals/:year/:quarter - Get all goals with milestones for a quarter
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

  try {
    // RLS automatically filters by authenticated user
    const { data: goals, error: goalsError } = await req.supabase
      .from('quarterly_goals')
      .select('*')
      .eq('year', yearNum)
      .eq('quarter', quarterNum)
      .order('display_order', { ascending: true });

    if (goalsError) {
      console.error('Error fetching quarterly goals:', goalsError);
      return res.status(500).json({ error: 'Failed to fetch goals' });
    }

    // Get all milestones for these goals
    const goalIds = goals.map(g => g.id);
    let milestones = [];

    if (goalIds.length > 0) {
      const { data: milestonesData, error: milestonesError } = await req.supabase
        .from('quarterly_goal_milestones')
        .select('*')
        .in('goal_id', goalIds)
        .order('display_order', { ascending: true });

      if (milestonesError) {
        console.error('Error fetching milestones:', milestonesError);
        return res.status(500).json({ error: 'Failed to fetch milestones' });
      }

      milestones = milestonesData || [];
    }

    // Group milestones by goal_id
    const milestonesByGoal = {};
    milestones.forEach(m => {
      if (!milestonesByGoal[m.goal_id]) {
        milestonesByGoal[m.goal_id] = [];
      }
      milestonesByGoal[m.goal_id].push({
        id: m.id,
        goalId: m.goal_id,
        title: m.title,
        completed: m.completed,
        displayOrder: m.display_order,
        createdAt: new Date(m.created_at).getTime(),
        updatedAt: new Date(m.updated_at).getTime(),
      });
    });

    // Format goals with their milestones
    const formattedGoals = goals.map(g => ({
      id: g.id,
      year: g.year,
      quarter: g.quarter,
      title: g.title,
      description: g.description || undefined,
      completed: g.completed,
      displayOrder: g.display_order,
      milestones: milestonesByGoal[g.id] || [],
      createdAt: new Date(g.created_at).getTime(),
      updatedAt: new Date(g.updated_at).getTime(),
    }));

    res.json({
      goals: {
        year: yearNum,
        quarter: quarterNum,
        goals: formattedGoals,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/goals:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/goals/:year/:quarter - Create a new goal
app.post('/api/goals/:year/:quarter', async (req, res) => {
  const { year, quarter } = req.params;
  const { title, description } = req.body;

  const yearNum = parseInt(year, 10);
  const quarterNum = parseInt(quarter, 10);

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    return res.status(400).json({ error: 'Title is required' });
  }

  if (isNaN(yearNum) || yearNum < 2000 || yearNum > 2100) {
    return res.status(400).json({ error: 'Invalid year' });
  }

  if (isNaN(quarterNum) || quarterNum < 1 || quarterNum > 4) {
    return res.status(400).json({ error: 'Invalid quarter (must be 1-4)' });
  }

  try {
    // RLS automatically filters by authenticated user
    const { data: maxOrderData } = await req.supabase
      .from('quarterly_goals')
      .select('display_order')
      .eq('year', yearNum)
      .eq('quarter', quarterNum)
      .order('display_order', { ascending: false })
      .limit(1);

    const nextOrder = maxOrderData && maxOrderData.length > 0 ? maxOrderData[0].display_order + 1 : 0;

    const { data: goal, error } = await req.supabase
      .from('quarterly_goals')
      .insert({
        user_id: req.user.id,
        year: yearNum,
        quarter: quarterNum,
        title: title.trim(),
        description: description ? description.trim() : null,
        completed: false,
        display_order: nextOrder,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating quarterly goal:', error);
      return res.status(500).json({ error: 'Failed to create goal' });
    }

    res.json({
      goal: {
        id: goal.id,
        year: goal.year,
        quarter: goal.quarter,
        title: goal.title,
        description: goal.description || undefined,
        completed: goal.completed,
        displayOrder: goal.display_order,
        milestones: [],
        createdAt: new Date(goal.created_at).getTime(),
        updatedAt: new Date(goal.updated_at).getTime(),
      },
    });
  } catch (error) {
    console.error('Error in POST /api/goals:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/goals/:goalId - Update a goal
app.put('/api/goals/:goalId', async (req, res) => {
  const { goalId } = req.params;
  const { title, description, completed, displayOrder } = req.body;

  try {
    const updates = { updated_at: new Date().toISOString() };
    if (title !== undefined) updates.title = title.trim();
    if (description !== undefined) updates.description = description ? description.trim() : null;
    if (completed !== undefined) updates.completed = completed;
    if (displayOrder !== undefined) updates.display_order = displayOrder;

    // RLS automatically ensures user can only update their own goals
    const { error } = await req.supabase
      .from('quarterly_goals')
      .update(updates)
      .eq('id', goalId);

    if (error) {
      console.error('Error updating quarterly goal:', error);
      return res.status(500).json({ error: 'Failed to update goal' });
    }

    res.json({ ok: true });
  } catch (error) {
    console.error('Error in PUT /api/goals:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/goals/:goalId - Delete a goal (cascades to milestones)
app.delete('/api/goals/:goalId', async (req, res) => {
  const { goalId } = req.params;

  try {
    // RLS automatically ensures user can only delete their own goals
    const { error } = await req.supabase
      .from('quarterly_goals')
      .delete()
      .eq('id', goalId);

    if (error) {
      console.error('Error deleting quarterly goal:', error);
      return res.status(500).json({ error: 'Failed to delete goal' });
    }

    res.json({ ok: true });
  } catch (error) {
    console.error('Error in DELETE /api/goals:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/goals/:goalId/milestones - Create a milestone
app.post('/api/goals/:goalId/milestones', async (req, res) => {
  const { goalId } = req.params;
  const { title } = req.body;

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    return res.status(400).json({ error: 'Title is required' });
  }

  try {
    // Get max display_order for this goal (RLS ensures user can only access their own goals)
    const { data: maxOrderData } = await req.supabase
      .from('quarterly_goal_milestones')
      .select('display_order')
      .eq('goal_id', goalId)
      .order('display_order', { ascending: false })
      .limit(1);

    const nextOrder = maxOrderData && maxOrderData.length > 0 ? maxOrderData[0].display_order + 1 : 0;

    // RLS will prevent creating milestones for goals not owned by the user
    const { data: milestone, error } = await req.supabase
      .from('quarterly_goal_milestones')
      .insert({
        goal_id: goalId,
        title: title.trim(),
        completed: false,
        display_order: nextOrder,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating milestone:', error);
      return res.status(500).json({ error: 'Failed to create milestone' });
    }

    res.json({
      milestone: {
        id: milestone.id,
        goalId: milestone.goal_id,
        title: milestone.title,
        completed: milestone.completed,
        displayOrder: milestone.display_order,
        createdAt: new Date(milestone.created_at).getTime(),
        updatedAt: new Date(milestone.updated_at).getTime(),
      },
    });
  } catch (error) {
    console.error('Error in POST /api/goals/:goalId/milestones:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/milestones/:milestoneId - Update a milestone
app.put('/api/milestones/:milestoneId', async (req, res) => {
  const { milestoneId } = req.params;
  const { title, completed, displayOrder } = req.body;

  try {
    const updates = { updated_at: new Date().toISOString() };
    if (title !== undefined) updates.title = title.trim();
    if (completed !== undefined) updates.completed = completed;
    if (displayOrder !== undefined) updates.display_order = displayOrder;

    // RLS automatically ensures user can only update milestones of their own goals
    const { error } = await req.supabase
      .from('quarterly_goal_milestones')
      .update(updates)
      .eq('id', milestoneId);

    if (error) {
      console.error('Error updating milestone:', error);
      return res.status(500).json({ error: 'Failed to update milestone' });
    }

    res.json({ ok: true });
  } catch (error) {
    console.error('Error in PUT /api/milestones:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/milestones/:milestoneId - Delete a milestone
app.delete('/api/milestones/:milestoneId', async (req, res) => {
  const { milestoneId } = req.params;

  try {
    // RLS automatically ensures user can only delete milestones of their own goals
    const { error } = await req.supabase
      .from('quarterly_goal_milestones')
      .delete()
      .eq('id', milestoneId);

    if (error) {
      console.error('Error deleting milestone:', error);
      return res.status(500).json({ error: 'Failed to delete milestone' });
    }

    res.json({ ok: true });
  } catch (error) {
    console.error('Error in DELETE /api/milestones:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default app;
