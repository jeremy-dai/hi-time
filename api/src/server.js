import app, { initSupabase } from './app.js';

const PORT = process.env.PORT ? Number(process.env.PORT) : 8001;

// Initialize Supabase client
initSupabase();

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}/api`);
});
