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
  // ⚠️  current_streak e last_review_date a null/0 — nunca inicializar streak a 1
  const newProfile = {
    id: supabaseUser.id,
    email: supabaseUser.email,
    display_name: supabaseUser.user_metadata?.full_name || '',
    avatar_type: 'poop_1',
    custom_avatar_uri: null,
    xp: 0,
    level: 1,
    total_reviews: 0,
    current_streak: 0,       // Era "streak" — renombrado a current_streak
    last_review_date: null,  // null = nunca ha opinado
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
 * Calcula el nuevo estado de la racha basándose en la última reseña del usuario.
 * Es una función pura (no toca Supabase) — se puede llamar antes de guardar.
 *
 * @param {object} user  Perfil del usuario con campos last_review_date y current_streak
 * @returns {{ isFirstOfDay: boolean, newStreak: number, newLastReviewDate: string }}
 *
 * Casos:
 *   - last_review_date null/vacío → primera reseña ever → streak = 1
 *   - last_review_date === hoy   → ya opinó hoy → sin cambio
 *   - last_review_date === ayer  → racha consecutiva → streak + 1
 *   - cualquier otra fecha       → racha rota → streak = 1
 */
export function computeDailyProgress(user) {
  const today = todayStr();
  const yday  = yesterdayStr();
  const last  = user?.last_review_date ?? null;
  const prevStreak = user?.current_streak ?? 0;

  console.log('[STREAK] computeDailyProgress →', { last, today, yday, prevStreak });

  // Sin historial previo: primera reseña ever → streak comienza en 1
  if (!last) {
    console.log('[STREAK] Primera reseña ever → streak 1');
    return { isFirstOfDay: true, newStreak: 1, newLastReviewDate: today };
  }

  // Ya opinó hoy → no cambiar nada
  if (last === today) {
    console.log('[STREAK] Ya opinó hoy → sin cambio, streak =', prevStreak);
    return { isFirstOfDay: false, newStreak: prevStreak, newLastReviewDate: today };
  }

  // Racha consecutiva o rota
  const newStreak = last === yday ? prevStreak + 1 : 1;
  console.log('[STREAK] last===yday?', last === yday, '→ newStreak =', newStreak);

  return { isFirstOfDay: true, newStreak, newLastReviewDate: today };
}

/**
 * Registra que el usuario abrió la app hoy (actualiza last_active_date).
 * ⚠️  NO toca current_streak — el streak solo lo actualiza addXpToUser()
 *     cuando se publica una reseña.
 */
export async function updateDailyStreak() {
  try {
    const user = await getCurrentUser();
    if (!user) return null;

    const today      = todayStr();
    const lastActive = user.last_active_date ?? null;

    console.log('[STREAK] updateDailyStreak →', {
      lastActive,
      today,
      current_streak: user.current_streak,
      last_review_date: user.last_review_date,
    });

    // Ya se registró hoy — no cambiar nada
    if (lastActive === today) {
      console.log('[STREAK] Ya abrió hoy — sin cambio');
      return { streak: user.current_streak ?? 0, isNewDay: false };
    }

    // Solo actualizamos last_active_date — NO tocamos current_streak
    await saveUserProfile({ last_active_date: today });
    console.log('[STREAK] last_active_date actualizado a', today);

    return { streak: user.current_streak ?? 0, isNewDay: true };
  } catch (e) {
    console.warn('[STREAK] updateDailyStreak error:', e?.message);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// XP
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Suma XP al usuario tras publicar una reseña.
 * También actualiza la racha diaria basada en last_review_date.
 * Devuelve { user, levelInfo, leveledUp, streakInfo }.
 */
export async function addXpToUser() {
  const user = await getCurrentUser();
  if (!user) return null;

  const newXp           = (user.xp || 0) + XP_PER_REVIEW;
  const newTotalReviews = (user.total_reviews || 0) + 1;
  const levelInfo       = getLevelInfo(newXp);

  // Calcular racha basada en reviews (no en aperturas de app)
  const { newStreak, newLastReviewDate, isFirstOfDay } = computeDailyProgress(user);

  console.log('[STREAK] addXpToUser → guardando current_streak =', newStreak, ', last_review_date =', newLastReviewDate);

  const updated = await saveUserProfile({
    xp: newXp,
    total_reviews: newTotalReviews,
    level: levelInfo.level,
    current_streak: newStreak,
    last_review_date: newLastReviewDate,
  });

  console.log('[STREAK] guardado OK → current_streak en DB =', updated?.current_streak);

  return {
    user: updated,
    levelInfo,
    leveledUp:  levelInfo.level > (user.level || 1),
    streakInfo: { newStreak, isFirstOfDay },
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

  await getOrCreateProfile(data.user);
  // updateDailyStreak actualiza last_active_date y devuelve el perfil fresco
  const streakResult = await updateDailyStreak();
  // Devolver perfil actualizado (con current_streak correcto)
  const freshProfile = await getCurrentUser();
  return { ...freshProfile, _streakResult: streakResult };
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

  await getOrCreateProfile(data.user);
  const streakResult = await updateDailyStreak();
  const freshProfile = await getCurrentUser();
  return { ...freshProfile, _streakResult: streakResult };
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
// NOTA T5 — Banner 🔥 racha
// ─────────────────────────────────────────────────────────────────────────────
// El banner debe leer user.current_streak (no user.streak).
// Solo mostrarlo si current_streak >= 1:
//
//   {user.current_streak >= 1 && (
//     <Text>🔥 Racha de {user.current_streak} día(s)</Text>
//   )}
//
// El archivo donde está el banner NO está sincronizado en este repo.
// Aplica este cambio en el componente correspondiente en Windows.
// ─────────────────────────────────────────────────────────────────────────────

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
