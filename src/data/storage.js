import * as FileSystem from 'expo-file-system';

const BASE = FileSystem.documentDirectory + 'appreton_';

function path(key) {
  return BASE + key.replace(/[^a-z0-9_]/gi, '_') + '.json';
}

export async function storageGet(key) {
  try {
    const info = await FileSystem.getInfoAsync(path(key));
    if (!info.exists) return null;
    return await FileSystem.readAsStringAsync(path(key));
  } catch {
    return null;
  }
}

export async function storageSet(key, value) {
  try {
    await FileSystem.writeAsStringAsync(path(key), value);
  } catch {}
}

export async function storageRemove(key) {
  try {
    await FileSystem.deleteAsync(path(key), { idempotent: true });
  } catch {}
}
