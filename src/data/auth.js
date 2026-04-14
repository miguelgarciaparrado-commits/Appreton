import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { storageGet, storageSet, storageRemove } from './storage';
import { supabase } from './supabase';

WebBrowser.maybeCompleteAuthSession();

const AUTH_USER_KEY = '@appreton_auth_user';
const ALL_USERS_KEY = '@appreton_all_users';
const CREDENTIALS_KEY = '@appreton_credentials';
const USERS_DATA_KEY = '@appreton_users_data';

// Level definitions — curva exponencial, 12 niveles con nombres gamberros
const LEVELS = [
  { level: 1,  title: 'Estreñido',             minXp: 0 },
  { level: 2,  title: 'Novato del Zurullo',    minXp: 100 },
  { level: 3,  title: 'Mojacalzones',          minXp: 250 },
  { level: 4,  title: 'Picacacas',             minXp: 500 },
  { level: 5,  title: 'Catador de Truños',     minXp: 900 },
  { level: 6,  title: 'Forjamojones',          minXp: 1500 },
  { level: 7,  title: 'Inspector de Retretes', minXp: 2400 },
  { level: 8,  title: 'Maestro Cagador',       minXp: 3700 },
  { level: 9,  title: 'Sabio del Plaston',     minXp: 5500 },
  { level: 10, title: 'Leyenda del Trono',     minXp: 8000 },
  { level: 11, title: 'Mito del Retrete',      minXp: 11500 },
  { level: 12, title: 'Dios de la Cloaca',     minXp: 16000 },
];

// XP base por opinion (bajado de 50 a 20 — ahora los bonus hacen el trabajo)
const XP_BASE_REVIEW = 20;
const XP_FIRST_ON_PLACE = 15;
const XP_LONG_COMMENT = 5;
const XP_ON_SITE = 15;
const XP_FIRST_OF_DAY = 10;
const XP_STREAK_3 = 10;
const XP_STREAK_7 = 20;

// Cooldown diario: a partir de la 11a opinion del dia no se dan puntos
const DAILY_XP_CAP = 10;

// Calcula XP final de una opinion a partir del contexto
// context: { isFirstOnPlace, hasLongComment, isOnSite, isFirstOfDay, currentStreak }
export function calculateReviewXp(context = {}) {
  let xp = XP_BASE_REVIEW;
  if (context.isFirstOnPlace) xp += XP_FIRST_ON_PLACE;
  if (context.hasLongComment) xp += XP_LONG_COMMENT;
  if (context.isOnSite) xp += XP_ON_SITE;
  if (context.isFirstOfDay) {
    xp += XP_FIRST_OF_DAY;
    if ((context.currentStreak || 0) >= 7) xp += XP_STREAK_7;
    else if ((context.currentStreak || 0) >= 3) xp += XP_STREAK_3;
  }
  return xp;
}

// Sample users for the ranking
const SAMPLE_USERS = [
  {
    id: 'sample_1',
    displayName: 'CacaMaster2000',
    email: 'caca@mail.com',
    provider: 'google',
    avatarType: 'poop_3',
    customAvatarUri: null,
    level: 6,
    xp: 2350,
    totalReviews: 47,
    joinDate: '2025-06-10',
    isSample: true,
  },
  {
    id: 'sample_2',
    displayName: 'LaReinaDelWC',
    email: 'reina@mail.com',
    provider: 'instagram',
    avatarType: 'poop_1',
    customAvatarUri: null,
    level: 5,
    xp: 1450,
    totalReviews: 29,
    joinDate: '2025-08-22',
    isSample: true,
  },
  {
    id: 'sample_3',
    displayName: 'InspectorRetrete',
    email: 'inspector@mail.com',
    provider: 'facebook',
    avatarType: 'poop_5',
    customAvatarUri: null,
    level: 5,
    xp: 1100,
    totalReviews: 22,
    joinDate: '2025-09-05',
    isSample: true,
  },
  {
    id: 'sample_4',
    displayName: 'ElCriticoCagon',
    email: 'critico@mail.com',
    provider: 'apple',
    avatarType: 'poop_2',
    customAvatarUri: null,
    level: 4,
    xp: 750,
    totalReviews: 15,
    joinDate: '2025-10-12',
    isSample: true,
  },
  {
    id: 'sample_5',
    displayName: 'TronoDeOro',
    email: 'trono@mail.com',
    provider: 'google',
    avatarType: 'poop_6',
    customAvatarUri: null,
    level: 4,
    xp: 550,
    totalReviews: 11,
    joinDate: '2025-11-01',
    isSample: true,
  },
  {
    id: 'sample_6',
    displayName: 'BuscaWC',
    email: 'busca@mail.com',
    provider: 'instagram',
    avatarType: 'poop_4',
    customAvatarUri: null,
    level: 3,
    xp: 300,
    totalReviews: 6,
    joinDate: '2025-12-15',
    isSample: true,
  },
  {
    id: 'sample_7',
    displayName: 'NovataDelWC',
    email: 'novata@mail.com',
    provider: 'facebook',
    avatarType: 'poop_1',
    customAvatarUri: null,
    level: 2,
    xp: 150,
    totalReviews: 3,
    joinDate: '2026-01-20',
    isSample: true,
  },
  {
    id: 'sample_8',
    displayName: 'PrimerizoCagon',
    email: 'primerizo@mail.com',
    provider: 'google',
    avatarType: 'poop_3',
    customAvatarUri: null,
    level: 1,
    xp: 50,
    totalReviews: 1,
    joinDate: '2026-03-01',
    isSample: true,
  },
];

export function getLevelInfo(xp) {
  let currentLevel = LEVELS[0];
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].minXp) {
      currentLevel = LEVELS[i];
      break;
    }
  }
  const nextLevel = LEVELS.find((l) => l.level === currentLevel.level + 1);
  const xpForNext = nextLevel ? nextLevel.minXp : null;
  const xpForCurrent = currentLevel.minXp;
  const progress = nextLevel
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

// Get current logged-in user
export async function getCurrentUser() {
  try {
    const data = await storageGet(AUTH_USER_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

// Register new user with email + password via Supabase Auth
export async function register(email, password) {
  const emailLower = email.trim().toLowerCase();

  const { data, error } = await supabase.auth.signUp({
    email: emailLower,
    password,
  });

  if (error) {
    if (error.message.includes('already registered') || error.message.includes('already been registered')) {
      throw new Error('Este email ya esta registrado');
    }
    throw new Error(error.message);
  }

  const authUser = data.user;
  if (!authUser) throw new Error('No se pudo crear la cuenta');

  const user = {
    id: authUser.id,
    displayName: '',
    email: emailLower,
    provider: 'email',
    avatarType: 'poop_1',
    customAvatarUri: null,
    level: 1,
    xp: 0,
    totalReviews: 0,
    joinDate: new Date().toISOString().split('T')[0],
    profileCompleted: false,
  };

  await storageSet(AUTH_USER_KEY, JSON.stringify(user));
  await saveUserData(authUser.id, user);
  await addOrUpdateUserInList(user);
  return user;
}

// Login with email + password via Supabase Auth
export async function loginWithEmail(email, password) {
  const emailLower = email.trim().toLowerCase();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: emailLower,
    password,
  });

  if (error) {
    if (error.message.includes('Invalid login credentials') || error.message.includes('invalid_credentials')) {
      throw new Error('Email o contrasena incorrectos');
    }
    throw new Error(error.message);
  }

  const authUser = data.user;
  if (!authUser) throw new Error('No se pudo iniciar sesion');

  // Check Supabase profile first
  let user = null;
  try {
    const { data: supabaseProfile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (supabaseProfile) {
      user = {
        id: supabaseProfile.id,
        displayName: supabaseProfile.display_name || '',
        email: supabaseProfile.email || emailLower,
        provider: 'email',
        avatarType: supabaseProfile.avatar_type || 'poop_1',
        customAvatarUri: supabaseProfile.custom_avatar_uri || null,
        level: supabaseProfile.level || 1,
        xp: supabaseProfile.xp || 0,
        totalReviews: supabaseProfile.total_reviews || 0,
        joinDate: supabaseProfile.join_date || new Date().toISOString().split('T')[0],
        profileCompleted: supabaseProfile.profile_completed || false,
        lastReviewDate: supabaseProfile.last_review_date || null,
        currentStreak: supabaseProfile.current_streak || 0,
        gender: supabaseProfile.gender || null,
      };
    }
  } catch {}

  if (!user) {
    const localData = await getUserData(authUser.id);
    user = localData || {
      id: authUser.id,
      displayName: '',
      email: emailLower,
      provider: 'email',
      avatarType: 'poop_1',
      customAvatarUri: null,
      level: 1,
      xp: 0,
      totalReviews: 0,
      joinDate: new Date().toISOString().split('T')[0],
      profileCompleted: false,
    };
  }

  await storageSet(AUTH_USER_KEY, JSON.stringify(user));
  await saveUserData(authUser.id, user);
  return user;
}

// Forgot password — sends reset email via Supabase
export async function forgotPassword(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(
    email.trim().toLowerCase(),
    { redirectTo: 'appreton://auth/reset-password' }
  );
  if (error) throw new Error(error.message);
}

async function saveUserData(userId, user) {
  try {
    const data = await storageGet(USERS_DATA_KEY);
    const users = data ? JSON.parse(data) : {};
    users[userId] = user;
    await storageSet(USERS_DATA_KEY, JSON.stringify(users));
  } catch {}
}

async function getUserData(userId) {
  try {
    const data = await storageGet(USERS_DATA_KEY);
    const users = data ? JSON.parse(data) : {};
    return users[userId] || null;
  } catch {
    return null;
  }
}

// Providers supported by Supabase OAuth
const SUPABASE_OAUTH_PROVIDERS = {
  google: 'google',
  facebook: 'facebook',
  apple: 'apple',
};

// Login with OAuth provider via Supabase + in-app browser
export async function loginWithProvider(provider) {
  const supabaseProvider = SUPABASE_OAUTH_PROVIDERS[provider];

  if (!supabaseProvider) {
    throw new Error('Este proveedor no está disponible todavía. Usa Google, Facebook o Apple.');
  }

  const redirectUrl = Linking.createURL('auth/callback');

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: supabaseProvider,
    options: {
      redirectTo: redirectUrl,
      skipBrowserRedirect: true,
    },
  });

  if (error) throw new Error(error.message);
  if (!data?.url) throw new Error('No se pudo iniciar la autenticación');

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

  if (result.type === 'cancel' || result.type === 'dismiss') {
    throw new Error('Inicio de sesión cancelado');
  }
  if (result.type !== 'success') {
    throw new Error('No se pudo completar el inicio de sesión');
  }

  // Try to extract session tokens from the callback URL
  const callbackUrl = result.url;
  const hashPart = callbackUrl.split('#')[1];
  let sessionSet = false;

  if (hashPart) {
    const params = new URLSearchParams(hashPart);
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    if (accessToken) {
      await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken || '',
      });
      sessionSet = true;
    }
  }

  if (!sessionSet) {
    // PKCE flow: exchange code for session
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(callbackUrl);
    if (exchangeError) throw new Error(exchangeError.message);
  }

  const { data: { user: authUser }, error: userError } = await supabase.auth.getUser();
  if (userError || !authUser) throw new Error('No se pudo obtener la información del usuario');

  // Reuse existing profile: check Supabase first, then local storage, then create new
  let user = null;

  try {
    const { data: supabaseProfile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (supabaseProfile) {
      user = {
        id: supabaseProfile.id,
        displayName: supabaseProfile.display_name || '',
        email: supabaseProfile.email || authUser.email || '',
        provider: supabaseProfile.provider || provider,
        avatarType: supabaseProfile.avatar_type || 'poop_1',
        customAvatarUri: supabaseProfile.custom_avatar_uri || null,
        level: supabaseProfile.level || 1,
        xp: supabaseProfile.xp || 0,
        totalReviews: supabaseProfile.total_reviews || 0,
        joinDate: supabaseProfile.join_date || new Date().toISOString().split('T')[0],
        profileCompleted: supabaseProfile.profile_completed || false,
        lastReviewDate: supabaseProfile.last_review_date || null,
        currentStreak: supabaseProfile.current_streak || 0,
        gender: supabaseProfile.gender || null,
      };
    }
  } catch {}

  if (!user) {
    const existingData = await getUserData(authUser.id);
    user = existingData || {
      id: authUser.id,
      displayName:
        authUser.user_metadata?.full_name ||
        authUser.user_metadata?.name ||
        authUser.email?.split('@')[0] ||
        '',
      email: authUser.email || '',
      provider,
      avatarType: 'poop_1',
      customAvatarUri: null,
      level: 1,
      xp: 0,
      totalReviews: 0,
      joinDate: new Date().toISOString().split('T')[0],
      profileCompleted: false,
    };
  }

  await storageSet(AUTH_USER_KEY, JSON.stringify(user));
  await saveUserData(authUser.id, user);
  await addOrUpdateUserInList(user);
  return user;
}

// Save/update user profile
export async function saveUserProfile(updates) {
  const user = await getCurrentUser();
  if (!user) return null;
  const updated = { ...user, ...updates };
  // Recalculate level from XP
  const levelInfo = getLevelInfo(updated.xp);
  updated.level = levelInfo.level;
  await storageSet(AUTH_USER_KEY, JSON.stringify(updated));
  await saveUserData(updated.id, updated);
  await addOrUpdateUserInList(updated);
  return updated;
}

// Logout
export async function logout() {
  await storageRemove(AUTH_USER_KEY);
}

// Helpers de fecha (YYYY-MM-DD)
function todayStr() {
  return new Date().toISOString().split('T')[0];
}
function yesterdayStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

// Evalua si esta opinion cuenta como "primera del dia" y calcula la racha
// actualizada. Devuelve { isFirstOfDay, newStreak, newLastReviewDate }.
export function computeDailyProgress(user) {
  const today = todayStr();
  const last = user?.lastReviewDate;
  if (last === today) {
    // Ya hizo al menos una opinion hoy: no es primera del dia, racha no cambia
    return {
      isFirstOfDay: false,
      newStreak: user?.currentStreak || 0,
      newLastReviewDate: today,
    };
  }
  // Es la primera del dia
  const yday = yesterdayStr();
  const newStreak = last === yday ? (user?.currentStreak || 0) + 1 : 1;
  return {
    isFirstOfDay: true,
    newStreak,
    newLastReviewDate: today,
  };
}

// Cuenta cuantas opiniones con XP ha dado el usuario hoy (para el cooldown)
export async function countTodayXpHits(user) {
  if (!user) return 0;
  try {
    const { data } = await supabase
      .from('reviews')
      .select('date', { count: 'exact', head: false })
      .eq('user_id', user.id)
      .eq('date', todayStr());
    return data?.length || 0;
  } catch {
    return 0;
  }
}

// Sube XP y actualiza racha. Si xpGained === 0 (edicion o cooldown), solo
// guarda la opinion sin tocar nivel.
export async function addXpToUser(xpGained = 0, dailyProgress = null) {
  const user = await getCurrentUser();
  if (!user) return null;

  const prevLevel = user.level || 1;
  const newXp = (user.xp || 0) + (xpGained || 0);
  const newTotalReviews = (user.totalReviews || 0) + 1;
  const levelInfo = getLevelInfo(newXp);

  const updated = {
    ...user,
    xp: newXp,
    totalReviews: newTotalReviews,
    level: levelInfo.level,
  };

  // Si la opinion ha contribuido al streak (fue primera del dia), guardamos
  if (dailyProgress && dailyProgress.isFirstOfDay) {
    updated.lastReviewDate = dailyProgress.newLastReviewDate;
    updated.currentStreak = dailyProgress.newStreak;
  }

  await storageSet(AUTH_USER_KEY, JSON.stringify(updated));
  await saveUserData(updated.id, updated);
  await addOrUpdateUserInList(updated);
  return {
    user: updated,
    levelInfo,
    leveledUp: levelInfo.level > prevLevel,
    xpGained,
  };
}

// Internal: maintain a list of all users for ranking (local + Supabase)
async function addOrUpdateUserInList(user) {
  const entry = {
    id: user.id,
    displayName: user.displayName,
    avatarType: user.avatarType,
    customAvatarUri: user.customAvatarUri,
    level: user.level,
    xp: user.xp,
    totalReviews: user.totalReviews,
    isSample: user.isSample || false,
  };

  // Sync to Supabase
  try {
    await supabase.from('user_profiles').upsert({
      id: user.id,
      display_name: user.displayName,
      email: user.email,
      provider: user.provider,
      avatar_type: user.avatarType,
      custom_avatar_uri: user.customAvatarUri,
      level: user.level,
      xp: user.xp,
      total_reviews: user.totalReviews,
      join_date: user.joinDate,
      profile_completed: user.profileCompleted || false,
      gender: user.gender || null,
      is_sample: user.isSample || false,
      last_review_date: user.lastReviewDate || null,
      current_streak: user.currentStreak || 0,
    });
  } catch {}

  // Also keep local cache
  try {
    const data = await storageGet(ALL_USERS_KEY);
    let users = data ? JSON.parse(data) : [];
    const index = users.findIndex((u) => u.id === user.id);
    if (index !== -1) users[index] = entry;
    else users.push(entry);
    await storageSet(ALL_USERS_KEY, JSON.stringify(users));
  } catch {}
}

// Get all users for ranking — solo Supabase
export async function getAllUsersForRanking() {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .order('xp', { ascending: false });

    if (!error && data) {
      return data
        .map((u) => ({
          id: u.id,
          displayName: u.display_name,
          avatarType: u.avatar_type,
          customAvatarUri: u.custom_avatar_uri,
          level: u.level,
          xp: u.xp,
          totalReviews: u.total_reviews,
        }))
        .filter((u) => u.displayName && u.displayName.length > 0);
    }
  } catch {}
  return [];
}
