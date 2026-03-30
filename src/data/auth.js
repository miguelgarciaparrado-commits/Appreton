import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

const AUTH_USER_KEY = '@appreton_auth_user';

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

// Get current logged-in user (from local cache)
export async function getCurrentUser() {
  try {
    const data = await AsyncStorage.getItem(AUTH_USER_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

// Save user locally
async function saveUserLocally(user) {
  await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

// Register with email and password
export async function registerWithEmail(email, password) {
  // Check if email already exists in Supabase
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('email', email.toLowerCase())
    .single();

  if (existing) {
    throw new Error('Ya existe una cuenta con este email');
  }

  const { data, error } = await supabase
    .from('users')
    .insert({
      email: email.toLowerCase(),
      password,
      provider: 'email',
      avatar_type: 'poop_1',
      xp: 0,
      total_reviews: 0,
      profile_completed: false,
    })
    .select()
    .single();

  if (error) throw new Error('Error al crear la cuenta: ' + error.message);

  const user = mapDbUser(data);
  await saveUserLocally(user);
  return user;
}

// Login with email and password
export async function loginWithEmail(email, password) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email.toLowerCase())
    .eq('password', password)
    .single();

  if (error || !data) {
    throw new Error('Email o contrasena incorrectos');
  }

  const user = mapDbUser(data);
  await saveUserLocally(user);
  return user;
}

// Login with social provider (simulated)
export async function loginWithProvider(provider) {
  const email = `${provider}_${Date.now()}@appreton.app`;

  const { data, error } = await supabase
    .from('users')
    .insert({
      email,
      password: 'social_' + Date.now(),
      provider,
      avatar_type: 'poop_1',
      xp: 0,
      total_reviews: 0,
      profile_completed: false,
    })
    .select()
    .single();

  if (error) throw new Error('Error al conectar con ' + provider);

  const user = mapDbUser(data);
  await saveUserLocally(user);
  return user;
}

// Save/update user profile
export async function saveUserProfile(updates) {
  const user = await getCurrentUser();
  if (!user) return null;

  const dbUpdates = {};
  if (updates.displayName !== undefined) dbUpdates.display_name = updates.displayName;
  if (updates.avatarType !== undefined) dbUpdates.avatar_type = updates.avatarType;
  if (updates.customAvatarUri !== undefined) dbUpdates.custom_avatar_uri = updates.customAvatarUri;
  if (updates.profileCompleted !== undefined) dbUpdates.profile_completed = updates.profileCompleted;

  const { data, error } = await supabase
    .from('users')
    .update(dbUpdates)
    .eq('id', user.id)
    .select()
    .single();

  if (error) {
    // Fallback: update locally
    const updated = { ...user, ...updates };
    const levelInfo = getLevelInfo(updated.xp);
    updated.level = levelInfo.level;
    await saveUserLocally(updated);
    return updated;
  }

  const updated = mapDbUser(data);
  await saveUserLocally(updated);
  return updated;
}

// Logout
export async function logout() {
  await AsyncStorage.removeItem(AUTH_USER_KEY);
}

// Add XP to the current user (called after a review)
export async function addXpToUser() {
  const user = await getCurrentUser();
  if (!user) return null;

  const newXp = (user.xp || 0) + XP_PER_REVIEW;
  const newTotalReviews = (user.totalReviews || 0) + 1;
  const levelInfo = getLevelInfo(newXp);

  const { data, error } = await supabase
    .from('users')
    .update({
      xp: newXp,
      total_reviews: newTotalReviews,
    })
    .eq('id', user.id)
    .select()
    .single();

  const updated = data ? mapDbUser(data) : {
    ...user,
    xp: newXp,
    totalReviews: newTotalReviews,
    level: levelInfo.level,
  };

  await saveUserLocally(updated);
  return { user: updated, levelInfo, leveledUp: levelInfo.level > user.level };
}

// Get all users for ranking
export async function getAllUsersForRanking() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, display_name, avatar_type, custom_avatar_uri, xp, total_reviews')
      .eq('profile_completed', true)
      .order('xp', { ascending: false });

    if (error || !data) return [];

    return data
      .filter((u) => u.display_name && u.display_name.length > 0)
      .map((u) => ({
        id: u.id,
        displayName: u.display_name,
        avatarType: u.avatar_type,
        customAvatarUri: u.custom_avatar_uri,
        level: getLevelInfo(u.xp).level,
        xp: u.xp,
        totalReviews: u.total_reviews,
        isSample: false,
      }));
  } catch {
    return [];
  }
}

// Map database row to app user object
function mapDbUser(row) {
  const levelInfo = getLevelInfo(row.xp || 0);
  return {
    id: row.id,
    displayName: row.display_name || '',
    email: row.email,
    provider: row.provider || 'email',
    avatarType: row.avatar_type || 'poop_1',
    customAvatarUri: row.custom_avatar_uri || null,
    level: levelInfo.level,
    xp: row.xp || 0,
    totalReviews: row.total_reviews || 0,
    joinDate: row.join_date || row.created_at,
    profileCompleted: row.profile_completed || false,
  };
}
