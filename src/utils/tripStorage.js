// tikkieteddielab: non-destructive trip persistence (never overwrites unreadable data without a copy).
export const tripsStorageKey = "ev-charge-daily-log-v1";

const getStorage = () => globalThis.localStorage;

// Short stable hash so repeated loads of the same corrupted value reuse one backup key.
const hashText = (text) => {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
};

const parseTrips = (raw) => {
  try {
    const value = JSON.parse(raw);
    return Array.isArray(value) ? { trips: value } : { reason: "not-an-array" };
  } catch {
    return { reason: "invalid-json" };
  }
};

export const loadTrips = ({ storage = getStorage(), fallback = [] } = {}) => {
  let raw;
  try {
    raw = storage.getItem(tripsStorageKey);
  } catch {
    return { trips: fallback, recovery: null };
  }
  if (raw === null) return { trips: fallback, recovery: null };

  const parsed = parseTrips(raw);
  if (parsed.trips) return { trips: parsed.trips, recovery: null };

  const backupKey = `${tripsStorageKey}:corrupt-${hashText(raw)}`;
  let backupSaved = false;
  try {
    storage.setItem(backupKey, raw);
    backupSaved = true;
  } catch {
    backupSaved = false;
  }
  return { trips: fallback, recovery: { reason: parsed.reason, raw, backupKey, backupSaved } };
};

export const saveTrips = (trips, storage = getStorage()) => {
  try {
    storage.setItem(tripsStorageKey, JSON.stringify(trips));
    return true;
  } catch {
    return false;
  }
};

export const backupTrips = (trips, label, { storage = getStorage(), now = new Date() } = {}) => {
  const key = `${tripsStorageKey}:${label}-${now.toISOString().replace(/[:.]/g, "-")}`;
  try {
    storage.setItem(key, JSON.stringify(trips));
    return { ok: true, key };
  } catch {
    return { ok: false, key };
  }
};
