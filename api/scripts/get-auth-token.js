import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY;

const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.error('Usage: node get-auth-token.js <email> <password>');
  process.exit(1);
}

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_PUBLISHABLE_KEY in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function getToken() {
  console.log(`\n🔐 Logging in as: ${email}\n`);

  // Try to sign in
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error('❌ Login failed:', error.message);
    console.log('\nTo create an account, use: node create-user.js <email> <password>\n');
    process.exit(1);
  }

  console.log('✅ Login successful!');
  console.log('\n📝 Add this to your .env file:');
  console.log('━'.repeat(60));
  console.log(`VITE_AUTH_TOKEN=${data.session.access_token}`);
  console.log('━'.repeat(60));
  console.log('\nUser Details:');
  console.log('  User ID:', data.user.id);
  console.log('  Email:', data.user.email);
  console.log('\n✅ You can now use the app with this token!\n');
}

getToken();
