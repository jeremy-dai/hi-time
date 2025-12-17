import express from 'express';
import cors from 'cors';
import { MongoClient } from 'mongodb';
import { parseTimeCSV, exportTimeCSV } from './csv.js';

const PORT = process.env.PORT ? Number(process.env.PORT) : 8001;
const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/';
const DB_NAME = process.env.DB_NAME || 'kevin_db';
const COLLECTION = process.env.COLLECTION || 'time_tracker_weeks';
const ALLOW_ORIGIN = process.env.ALLOW_ORIGIN || 'http://localhost:5173';

const app = express();
app.use(cors({ origin: ALLOW_ORIGIN }));
app.use(express.json({ limit: '2mb' }));

let db;
let collection;

async function initMongo() {
  const client = new MongoClient(MONGO_URL);
  await client.connect();
  db = client.db(DB_NAME);
  collection = db.collection(COLLECTION);
}

function getUserId(req) {
  return req.header('X-User-Id') || 'local-user';
}

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/weeks', async (req, res) => {
  const userId = getUserId(req);
  const docs = await collection
    .find({ user_id: userId }, { projection: { week_key: 1 } })
    .toArray();
  const weeks = Array.from(new Set(docs.map((d) => d.week_key))).filter(Boolean);
  res.json({ weeks });
});

app.get('/api/weeks/:week_key', async (req, res) => {
  const userId = getUserId(req);
  const { week_key } = req.params;
  const doc = await collection.findOne({ user_id: userId, week_key });
  res.json({ weekData: doc?.weekData || null });
});

app.put('/api/weeks/:week_key', async (req, res) => {
  const userId = getUserId(req);
  const { week_key } = req.params;
  const { weekData } = req.body || {};
  if (!weekData) {
    return res.status(400).json({ error: 'weekData is required' });
  }
  await collection.updateOne(
    { user_id: userId, week_key },
    {
      $set: {
        user_id: userId,
        week_key,
        weekData,
        updated_at: new Date(),
      },
    },
    { upsert: true }
  );
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
  const userId = getUserId(req);
  const { week_key } = req.params;
  const doc = await collection.findOne({ user_id: userId, week_key });
  const weekData = doc?.weekData || [];
  const csv_text = exportTimeCSV(weekData);
  res.json({ csv_text });
});

initMongo()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`API listening on http://localhost:${PORT}/api`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize MongoDB:', err);
    process.exit(1);
  });
