import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { storageGet, storageSet, storageRemove } from './storage';
import { supabase } from './supabase';

WebBrowser.maybeCompleteAuthSession();

const AUTH_USER_KEY = '@appreton_auth_user';
const ALL_USERS_KEY = '@appreton_all_users';
const CREDENTIALS_KEY = '@appreton_credentials';
const USERS_DATA_KEY = '@appreton_users_data';

// Level definitions
const LEVELS = [
  { level: 1, title: 'Cagoncete', minXp: 0 },
  { level: 2, title: 'Explorador de Banos', minXp: 100 },
  { level: 3, title: 'Critico de Retretes', minXp: 250 },
  { level: 4, title: 'Inspector de WC', minXp: 500 },
  { level: 5, title: 'Maestro Cagador', minXp: 1000 },
  { level: 6, title: 'Leyenda del Trono', minXp: 2000 },
];

const XP_PER_REVIEW = 50;

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
    displayName: 'LaReinaDelBano',
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
    displayName: 'BuscaBanos',
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

// Register new user with email + password
export async function register(email, password) {
  const emailLower = email.trim().toLowerCase();
  const creds = await getCredentials();
  if (creds[emailLower]) {
    throw new Error('Este email ya esta registrado');
  }
  const userId = 'user_' + Date.now().toString();
  const user = {
    id: userId,
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
  creds[emailLower] = { password, userId };
  await storageSet(CREDENTIALS_KEY, JSON.stringify(creds));
  await saveUserData(userId, user);
  await storageSet(AUTH_USER_KEY, JSON.stringify(user));
  await addOrUpdateUserInList(user);
  return user;
}

// Login with email + password
export async function loginWithEmail(email, password) {
  const emailLower = email.trim().toLowerCase();
  const creds = await getCredentials();
  if (!creds[emailLower]) {
    throw new Error('Email no encontrado. Registrate primero');
  }
  if (creds[emailLower].password !== password) {
    throw new Error('Contrasena incorrecta');
  }
  const userId = creds[emailLower].userId;
  const userData = await getUserData(userId);
  if (!userData) {
    throw new Error('Usuario no encontrado');
  }
  await storageSet(AUTH_USER_KEY, JSON.stringify(userData));
  return userData;
}

async function getCredentials() {
  try {
    const data = await storageGet(CREDENTIALS_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
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

  // Reuse existing profile or create a new one
  const existingData = await getUserData(authUser.id);
  const user = existingData || {
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

// Add XP to the current user (called after a review)
export async function addXpToUser() {
  const user = await getCurrentUser();
  if (!user) return null;
  const newXp = (user.xp || 0) + XP_PER_REVIEW;
  const newTotalReviews = (user.totalReviews || 0) + 1;
  const levelInfo = getLevelInfo(newXp);
  const updated = {
    ...user,
    xp: newXp,
    totalReviews: newTotalReviews,
    level: levelInfo.level,
  };
  await storageSet(AUTH_USER_KEY, JSON.stringify(updated));
  await saveUserData(updated.id, updated);
  await addOrUpdateUserInList(updated);
  return { user: updated, levelInfo, leveledUp: levelInfo.level > user.level };
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
