import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_USER_KEY = '@appreton_auth_user';
const ALL_USERS_KEY = '@appreton_all_users';
const REGISTERED_USERS_KEY = '@appreton_registered_users';

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
    provider: 'email',
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
    provider: 'google',
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

// Get all registered users
async function getRegisteredUsers() {
  try {
    const data = await AsyncStorage.getItem(REGISTERED_USERS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

// Save registered users
async function saveRegisteredUsers(users) {
  await AsyncStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(users));
}

// Register a new user with email and password
export async function registerWithEmail(email, password) {
  const users = await getRegisteredUsers();

  // Check if email already exists
  const existing = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    throw new Error('Ya existe una cuenta con este email');
  }

  const userId = 'user_' + Date.now().toString();
  const user = {
    id: userId,
    displayName: '',
    email: email.toLowerCase(),
    password, // stored locally only
    provider: 'email',
    avatarType: 'poop_1',
    customAvatarUri: null,
    level: 1,
    xp: 0,
    totalReviews: 0,
    joinDate: new Date().toISOString().split('T')[0],
    profileCompleted: false,
  };

  users.push(user);
  await saveRegisteredUsers(users);
  await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  await addOrUpdateUserInList(user);
  return user;
}

// Login with email and password
export async function loginWithEmail(email, password) {
  const users = await getRegisteredUsers();
  const user = users.find(
    (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
  );

  if (!user) {
    throw new Error('Email o contrasena incorrectos');
  }

  await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  return user;
}

// Register/login with social provider (simulated OAuth)
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

  // Save as registered user too
  const users = await getRegisteredUsers();
  users.push({ ...user, password: null });
  await saveRegisteredUsers(users);

  await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
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

  // Also update in registered users
  const users = await getRegisteredUsers();
  const idx = users.findIndex((u) => u.id === updated.id);
  if (idx !== -1) {
    users[idx] = { ...users[idx], ...updates, level: updated.level };
    await saveRegisteredUsers(users);
  }

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
