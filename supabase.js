const { createClient } = require('@supabase/supabase-js');

// Your Supabase project: kqpbfnximstnobxsnivm
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://kqpbfnximstnobxsnivm.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validate configuration
if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ ERROR: SUPABASE_SERVICE_ROLE_KEY is missing in .env file');
  process.exit(1);
}

// Create Supabase client with service role key (for admin operations)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Test connection to your Supabase project
const testConnection = async () => {
  try {
    const { data, error } = await supabase.from('messages').select('count');
    if (error) throw error;
    console.log('✅ Supabase Connected Successfully');
    console.log('   Project: kqpbfnximstnobxsnivm');
    console.log('   URL: https://kqpbfnximstnobxsnivm.supabase.co');
    return true;
  } catch (err) {
    console.error('❌ Supabase Connection Error:', err.message);
    console.error('   Please check your SERVICE_ROLE_KEY in .env file');
    return false;
  }
};

module.exports = { supabase, testConnection };
