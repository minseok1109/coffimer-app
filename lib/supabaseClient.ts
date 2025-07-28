import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const supabaseUrl = 'https://qyjbrwvlzxrtrypwncfl.supabase.co';
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5amJyd3ZsenhydHJ5cHduY2ZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkzNTE5OTQsImV4cCI6MjA2NDkyNzk5NH0.d5yLGjuwAHF0AZDXV7YTQl-loRrK1iGSAXoR-4XQkZw';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage, // persist to device
    autoRefreshToken: true, // refresh silently
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce',
  },
});
