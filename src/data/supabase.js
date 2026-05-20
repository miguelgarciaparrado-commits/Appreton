// ─────────────────────────────────────────────────────────────────────────────
// src/data/supabase.js — Cliente Supabase singleton
// ─────────────────────────────────────────────────────────────────────────────
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config';

// Usamos AsyncStorage como storage para persistir la sesión en React Native
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // En RN no hay URL de redirect
  },
});
