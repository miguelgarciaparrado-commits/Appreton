import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ifqftuqkdgsepvtqwefp.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmcWZ0dXFrZGdzZXB2dHF3ZWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzMDM0ODQsImV4cCI6MjA4OTg3OTQ4NH0._MxtbIG1ZpoEUZn4MfLFnD4pR8L1E_Z027mrZUgkFSQ';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});
