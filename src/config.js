// ─────────────────────────────────────────────────────────────────────────────
// src/config.js — Configuración global de APPreton
//
// ⚠️  NUNCA subas claves secretas aquí. Las únicas que van aquí son:
//     - Claves públicas (anon key de Supabase, web client ID de Google)
//     - URLs públicas
//     Secretos del servidor (service_role key, etc.) van SOLO en el backend.
// ─────────────────────────────────────────────────────────────────────────────

// ── Supabase ──────────────────────────────────────────────────────────────────
export const SUPABASE_URL = 'https://gcperiixkrrqoydfmned.supabase.co';
// Anon key: Supabase → Project Settings → API → anon public
export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjcGVyaWl4a3JycW95ZGZtbmVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4NzkyMDAsImV4cCI6MjA5MDQ1NTIwMH0.M3ITmssduSTPEmX9NsxwhqnsUdiDQL9lAETt1NaoHhg';

// ── Google Sign-In ────────────────────────────────────────────────────────────
// Web Client ID (OAuth 2.0) — Google Cloud Console → Credentials
// Debe coincidir con el configurado en Supabase → Auth → Google → Client IDs
export const GOOGLE_WEB_CLIENT_ID =
  '37060093629-icf40rgsgg3bm8qdnusc65dup7uj3k96.apps.googleusercontent.com';

// ── Google Maps / Places API ──────────────────────────────────────────────────
// Google Cloud Console → APIs & Services → Credentials
// Restringir por package com.miguelgp.appreton + SHA-1 antes de producción
export const GOOGLE_PLACES_API_KEY = 'TU_GOOGLE_PLACES_API_KEY';

// ── App constants ─────────────────────────────────────────────────────────────
export const APP_PACKAGE = 'com.miguelgp.appreton';
export const NEARBY_RADIUS_KM = 1; // Radio en km para mostrar lugares cercanos
