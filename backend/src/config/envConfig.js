require('dotenv').config();

const REQUIRED_ENV_VARS = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY',
  'BACKEND_SECRET'
];

function validateEnv() {
  const missing = REQUIRED_ENV_VARS.filter(key => !process.env[key] || process.env[key].trim() === '');
  if (missing.length > 0) {
    const errorMsg = `[CRITICAL FATAL ERROR] Missing required environment variables: ${missing.join(', ')}. Server startup halted.`;
    console.error(errorMsg);
    if (process.env.NODE_ENV === 'production') {
      throw new Error(errorMsg);
    } else {
      console.warn(`[WARNING] Environment check notice - missing in environment: ${missing.join(', ')}`);
    }
  }
}

validateEnv();

module.exports = {
  SUPABASE_URL: process.env.SUPABASE_URL || 'https://tqdzowkqyusxjfkmzlks.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || '',
  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL || '',
  FIREBASE_PRIVATE_KEY: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  BACKEND_SECRET: process.env.BACKEND_SECRET || '',
  validateEnv
};
