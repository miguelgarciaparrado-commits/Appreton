// ─────────────────────────────────────────────────────────────────────────────
// src/data/auth.js — Autenticación y perfil de usuario (APPreton)
//
// Flujos soportados:
//   1. Google Sign-In nativo  → loginWithGoogleNative()
//   2. Google OAuth (web)     → loginWithGoogleWeb()  [fallback]
//   3. Email/contraseña       → loginWithEmail() / registerWithEmail()
//
// Persistencia: Supabase Auth + tabla user_profiles
// ─────────────────────────────────────────────────────────────────────────────

import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { supabase } from './supabase';
import { GOOGLE_WEB_CLIENT_ID } from '../config';

// ── Configurar Google Sign-In (llamar una vez al arrancar la app) ──────────────
export function configureGoogleSignIn() {
  GoogleSignin.configure({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    offlineAccess: false,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// NIVELES Y XP
// ─────────────────────────────────────────────────────────────────────────────

const LEVELS = [
  { level: 1, title: 'Cagoncete',          minXp: 0    },
  { level: 2, title: 'Explorador de WC',   minXp: 100  },
  { level: 3, title: 'Critico de Retretes',minXp: 250  },
  { level: 4, title: 'Inspector de WC',    minXp: 500  },
  { level: 5, title: 'Maestro Cagador',    minXp: 1000 },
  { level: 6, title: 'Leyenda del Trono',  minXp: 2000 },
];

const XP_PER_REVIEW = 50;

export function getLevelInfo(xp) {
  let currentLevel = LEVELS[0];
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].minXp) {
      currentLevel = LEVELS[i];
      break;
    }
  }
  const nextLevel = LEVELS.find((l) => l.level === currentLevel.level + 1);
  const xpForNext    = nextLevel ? nextLevel.minXp : null;
  const xpForCurrent = currentLevel.minXp;
  const progress     = nextLevel
    ? (xp - xpForCurrent) / (xpForNext - xpForCurrent)
    : 1;

  return {
    level: currentLevel.level,
    title: currentLevel.title,
    xp,
    xpForCurrent,
    xpForNext,
    progress,
    isMaxLevel: !nextLevel,
  };
}

export function getAllLevels() {
  return LEVELS;
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS DE FECHA (con zona horaria local para evitar bug CEST/UTC)
// ─────────────────────────────────────────────────────────────────────────────

function todayStr() {
  // toLocaleDateString('sv-SE') devuelve YYYY-MM-DD en hora local
  return new Date().toLocaleDateString('sv-SE');
}

function yesterdayStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toLocaleDateString('sv-SE');
}

// ─────────────────────────────────────────────────────────────────────────────
// PERFIL — leer / crear / actualizar en Supabase
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Lee el perfil del usuario autenticado desde user_profiles.
 * Si no existe aún, lo crea con valores por defecto.
 */
export async function getOrCreateProfile(supabaseUser) {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', supabaseUser.id)
    .single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = "no rows returned" → hay que crear el perfil
    throw error;
  }

  if (data) return data;

  // Crear perfil nuevo
  const newProfile = {
    id: supabaseUser.id,
    email: supabaseUser.email,
    display_name: supabaseUser.user_metadata?.full_name || '',
    avatar_type: 'poop_1',
    custom_avatar_uri: null,
    xp: 0,
    level: 1,
    total_reviews: 0,
    streak: 0,
    last_active_date: todayStr(),
    join_date: todayStr(),
    profile_completed: false,
  };

  const { data: created, error: createError } = await supabase
    .from('user_profiles')
    .insert(newProfile)
    .select()
    .single();

  if (createError) throw createError;
  return created;
}

/**
 * Devuelve el usuario actual (sesión Supabase + perfil) o null.
 */
export async function getCurrentUser() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;

    const profile = await getOrCreateProfile(session.user);
    return { ...profile, supabaseUser: session.user };
  } catch {
    return null;
  }
}

/**
 * Actualiza campos del perfil en Supabase y devuelve el perfil actualizado.
 */
export async function saveUserProfile(updates) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;

  // Recalcular nivel si viene xp en los updates
  const extraUpdates = {};
  if (updates.xp !== undefined) {
    extraUpdates.level = getLevelInfo(updates.xp).level;
  }

  const { data, error } = await supabase
    .from('user_profiles')
    .update({ ...updates, ...extraUpdates })
    .eq('id', session.user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ─────────────────────────────────────────────────────────────────────────────
// RACHA DIARIA
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Actualiza la racha del usuario al abrir la app.
 * Devuelve { streak, isNewDay } para mostrar feedback si corresponde.
 */
export async function updateDailyStreak() {
  try {
    const user = await getCurrentUser();
    if (!user) return null;

    const today     = todayStr();
    const yesterday = yesterdayStr();
    const lastActive = user.last_active_date;

    if (lastActive === today) {
      // Ya se registró hoy — no cambiar nada
      return { streak: user.streak, isNewDay: false };
    }

    const newStreak = lastActive === yesterday
      ? (user.streak || 0) + 1  // Racha consecutiva
      : 1;                       // Racha rota → reiniciar a 1

    await saveUserProfile({
      streak: newStreak,
      last_active_date: today,
    });

    return { streak: newStreak, isNewDay: true };
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// XP
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Suma XP al usuario tras publicar una reseña.
 * Devuelve { user, levelInfo, leveledUp }.
 */
export async function addXpToUser() {
  const user = await getCurrentUser();
  if (!user) return null;

  const newXp          = (user.xp || 0) + XP_PER_REVIEW;
  const newTotalReviews = (user.total_reviews || 0) + 1;
  const levelInfo      = getLevelInfo(newXp);

  const updated = await saveUserProfile({
    xp: newXp,
    total_reviews: newTotalReviews,
    level: levelInfo.level,
  });

  return {
    user: updated,
    levelInfo,
    leveledUp: levelInfo.level > (user.level || 1),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTENTICACIÓN — Google Sign-In nativo
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Login con Google Sign-In nativo (flujo recomendado en producción).
 * Requiere @react-native-google-signin/google-signin y google-services.json.
 *
 * Flujo:
 *   GoogleSignin.signIn() → idToken → supabase.signInWithIdToken()
 */
export async function loginWithGoogleNative() {
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

  const userInfo = await GoogleSignin.signIn();
  const idToken  = userInfo.data?.idToken ?? userInfo.idToken;

  if (!idToken) throw new Error('No se recibió idToken de Google');

  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'google',
    token: idToken,
  });

  if (error) throw error;

  const profile = await getOrCreateProfile(data.user);
  await updateDailyStreak();
  return profile;
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTENTICACIÓN — Google OAuth web (fallback)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Login con Google OAuth vía navegador (fallback si el nativo falla).
 * Abre el navegador externo y redirige de vuelta a la app.
 */
export async function loginWithGoogleWeb() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: 'com.miguelgp.appreton://auth/callback',
    },
  });

  if (error) throw error;
  return data;
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTENTICACIÓN — Email / contraseña
// ─────────────────────────────────────────────────────────────────────────────

export async function loginWithEmail(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;

  const profile = await getOrCreateProfile(data.user);
  await updateDailyStreak();
  return profile;
}

export async function registerWithEmail(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;

  // signUp puede devolver user sin sesión si hay confirmación por email pendiente
  if (!data.session) {
    return { pendingEmailConfirmation: true };
  }

  const profile = await getOrCreateProfile(data.user);
  return profile;
}

// ─────────────────────────────────────────────────────────────────────────────
// LOGOUT
// ─────────────────────────────────────────────────────────────────────────────

export async function logout() {
  try {
    await GoogleSignin.signOut();
  } catch {
    // Google puede no tener sesión activa — ignorar
  }
  await supabase.auth.signOut();
}

// ─────────────────────────────────────────────────────────────────────────────
// RANKING — usuarios para la tabla de clasificación
// ─────────────────────────────────────────────────────────────────────────────

export async function getAllUsersForRanking() {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('id, display_name, avatar_type, custom_avatar_uri, level, xp, total_reviews')
    .not('display_name', 'is', null)
    .neq('display_name', '')
    .order('xp', { ascending: false })
    .limit(100);

  if (error) return [];
  return data;
}
