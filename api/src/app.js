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

const app = express();
app.use(cors({ origin: ALLOW_ORIGIN }));
app.use(express.json({ limit: '2mb' }));

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
  const { data, error } = await req.supabase
    .from('weeks')
    .select('week_data')
    .eq('year', parsed.year)
    .eq('week_number', parsed.week)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 is "Row not found"
    console.error('Error fetching week data:', error);
    return res.status(500).json({ error: 'Failed to fetch week data' });
  }

  res.json({ weekData: data?.week_data || null });
});

app.put('/api/weeks/:week_key', async (req, res) => {
  const { week_key } = req.params;
  const { weekData } = req.body || {};

  if (!weekData) {
    return res.status(400).json({ error: 'weekData is required' });
  }

  const parsed = parseWeekKey(week_key);
  if (!parsed) {
    return res.status(400).json({ error: 'Invalid week key format' });
  }

  // RLS requires user_id to match authenticated user
  const { error } = await req.supabase
    .from('weeks')
    .upsert({
      user_id: req.user.id,
      year: parsed.year,
      week_number: parsed.week,
      week_data: weekData,
      updated_at: new Date().toISOString(),
    }, {
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
    .select('week_data')
    .eq('year', parsed.year)
    .eq('week_number', parsed.week)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching week data for export:', error);
    return res.status(500).json({ error: 'Failed to fetch data' });
  }

  const weekData = data?.week_data || [];
  const csv_text = exportTimeCSV(weekData);
  res.json({ csv_text });
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

export default app;
