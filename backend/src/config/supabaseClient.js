const { createClient } = require('@supabase/supabase-js');
const envConfig = require('./envConfig');

const SUPABASE_URL = envConfig.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = envConfig.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

let supabaseInstance = null;

function getSupabaseClient() {
  if (!supabaseInstance && SUPABASE_URL && SUPABASE_SERVICE_KEY) {
    try {
      supabaseInstance = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      });
      console.log(`[SupabaseClient] Initialized Supabase client for URL: ${SUPABASE_URL}`);
    } catch (error) {
      console.error('[SupabaseClient] Error initializing Supabase client:', error.message);
    }
  }
  return supabaseInstance;
}

module.exports = {
  getSupabaseClient,
  SUPABASE_URL
};
