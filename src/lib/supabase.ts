import { createClient } from '@supabase/supabase-js';
import { logger } from './logger';
import type { Database } from '../types/database';

// Check if we're in Node.js environment (for testing)
const isNode = typeof window === 'undefined';

const getEnvVar = (name: string): string => {
  let value: string | undefined;

  if (isNode) {
    // In Node.js, use process.env
    value = process.env[name];
  } else {
    // In browser, use import.meta.env
    value = (import.meta as any).env?.[name];
  }

  // For testing purposes, allow empty values but log warning
  if (!value) {
    logger.warn(`Missing environment variable: ${name} - using empty string for testing`);
    return '';
  }
  return value;
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY');

// Only create client if we have valid credentials
let supabase: ReturnType<typeof createClient<Database>>;

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  });
} else {
  // Create a dummy client for testing when credentials are missing
  supabase = createClient<Database>('https://dummy.supabase.co', 'dummy-key', {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    }
  });
}

export { supabase };
