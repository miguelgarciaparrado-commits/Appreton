import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_USER_KEY = '@appreton_auth_user';
const ALL_USERS_KEY = '@appreton_all_users';

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
    const data = await AsyncStorage.getItem(AUTH_USER_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

// Mock login - simulates OAuth by creating a user record
export async function loginWithProvider(provider) {
  const userId = 'user_' + Date.now().toString();
  const user = {
    id: userId,
    displayName: '',
    email: `${provider}_user_${Date.now()}@appreton.app`,
    provider,
    avatarType: 'poop_1',
    customAvatarUri: null,
    level: 1,
    xp: 0,
    totalReviews: 0,
    joinDate: new Date().toISOString().split('T')[0],
    profileCompleted: false,
  };
  await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  // Also add to all users list
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
  await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(updated));
  await addOrUpdateUserInList(updated);
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
  const updated = {
    ...user,
    xp: newXp,
    totalReviews: newTotalReviews,
    level: levelInfo.level,
  };
  await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(updated));
  await addOrUpdateUserInList(updated);
  return { user: updated, levelInfo, leveledUp: levelInfo.level > user.level };
}

// Internal: maintain a list of all users for ranking
async function addOrUpdateUserInList(user) {
  try {
    const data = await AsyncStorage.getItem(ALL_USERS_KEY);
    let users = data ? JSON.parse(data) : [];
    const index = users.findIndex((u) => u.id === user.id);
    // Only store ranking-relevant fields
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
    if (index !== -1) {
      users[index] = entry;
    } else {
      users.push(entry);
    }
    await AsyncStorage.setItem(ALL_USERS_KEY, JSON.stringify(users));
  } catch {
    // ignore
  }
}

// Get all users for ranking (includes sample users)
export async function getAllUsersForRanking() {
  try {
    const data = await AsyncStorage.getItem(ALL_USERS_KEY);
    let users = data ? JSON.parse(data) : [];
    // Ensure sample users exist
    const hasSamples = users.some((u) => u.isSample);
    if (!hasSamples) {
      const sampleEntries = SAMPLE_USERS.map((u) => ({
        id: u.id,
        displayName: u.displayName,
        avatarType: u.avatarType,
        customAvatarUri: u.customAvatarUri,
        level: u.level,
        xp: u.xp,
        totalReviews: u.totalReviews,
        isSample: true,
      }));
      users = [...users, ...sampleEntries];
      await AsyncStorage.setItem(ALL_USERS_KEY, JSON.stringify(users));
    }
    // Sort by XP descending
    return users
      .filter((u) => u.displayName && u.displayName.length > 0)
      .sort((a, b) => b.xp - a.xp);
  } catch {
    return [];
  }
}
