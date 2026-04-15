// ─────────────────────────────────────────────────
// Clave de Google Places API
// Consíguela en: https://console.cloud.google.com/
// Activa: "Places API (New)"
// ─────────────────────────────────────────────────
export const GOOGLE_PLACES_API_KEY = 'AIzaSyAGsJx_0fUzJmVDA539E5zo_mDfLBvKRMA';

// ─────────────────────────────────────────────────
// Webhook para notificarte por email cuando un usuario
// sugiere un sitio nuevo desde la pestaña "Sugerir".
//
// Servicios recomendados (pick one):
// - https://formspree.io (50/mes gratis)
// - https://getform.io  (50/mes gratis)
// - https://usebasin.com (100/mes gratis)
//
// 1. Crea cuenta con tu email.
// 2. Crea un form nuevo "Appreton - sitios sugeridos".
// 3. Confirma el email que te envian.
// 4. Copia aqui el endpoint que te dan.
//
// Formato: 'https://formspree.io/f/xxxxxxxx'
//
// Si se deja vacio (''), no se envia email (feature flag).
// ─────────────────────────────────────────────────
export const SUBMISSION_WEBHOOK_URL = '';

// Email al que deberian llegar las notificaciones. Se incluye en el
// payload como metadato para que puedas filtrar en el servicio si
// usas varios formularios. No se usa como destinatario directo.
export const SUBMISSION_NOTIFY_EMAIL = '';

// ─────────────────────────────────────────────────
// Google Sign-In nativo
//
// Web Client ID del OAuth 2.0 de Google Cloud (tipo "Aplicacion web").
// Es el mismo que tienes pegado en Supabase → Authentication →
// Providers → Google → Client ID. Sirve para que Supabase valide
// el id_token que genera el login nativo de Android.
//
// NO es el Client ID del cliente Android: Google pide el WEB aqui
// porque GoogleSignin.signIn() pide un id_token firmado con ese
// audience, y Supabase valida contra ese audience.
// ─────────────────────────────────────────────────
export const GOOGLE_WEB_CLIENT_ID =
  '1012059070308-51rbls8jgeh88qlqnjfv448utmvjj71l.apps.googleusercontent.com';
