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
  console.error('Usage: node create-user.js <email> <password>');
  process.exit(1);
}

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_PUBLISHABLE_KEY in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createUser() {
  console.log(`\n👤 Creating user account...\n`);

  // Try to sign up
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    console.error('❌ User creation failed:', error.message);
    process.exit(1);
  }

  console.log('✅ User created successfully!');
  console.log('\nUser Details:');
  console.log('  Email:', data.user.email);
  console.log('  User ID:', data.user.id);

  // Check if email confirmation is required
  if (data.user && !data.session) {
    console.log('\n⚠️  Note: Email confirmation is enabled.');
    console.log('   Please confirm the user in Supabase dashboard:');
    console.log('   Authentication → Users → Click user → "Confirm email"\n');
  } else if (data.session) {
    console.log('\n✅ User is ready to use! You can now log in.\n');
  }
}

createUser();
