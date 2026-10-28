// tikkieteddielab: tests for non-destructive trip storage (Export/Backup plan, stage 1).
import { describe, expect, it } from "vitest";
import { backupTrips, loadTrips, saveTrips, tripsStorageKey } from "./tripStorage.js";

const createStorage = (initial = {}) => {
  const data = new Map(Object.entries(initial));
  return {
    data,
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: (key) => data.delete(key),
  };
};

const fallback = [{ id: "sample-1", date: "2026-05-09" }];
const realTrips = [{ id: "real-1", date: "2026-10-28", routeName: "บ้าน - ออฟฟิศ", distanceKm: 42 }];
const backupKeys = (storage) => [...storage.data.keys()].filter((key) => key !== tripsStorageKey);

describe("loadTrips", () => {
  it("uses the fallback on first use without a recovery notice", () => {
    const storage = createStorage();
    expect(loadTrips({ storage, fallback })).toEqual({ trips: fallback, recovery: null });
    expect(storage.data.size).toBe(0);
  });

  it("returns saved trips unchanged", () => {
    const storage = createStorage({ [tripsStorageKey]: JSON.stringify(realTrips) });
    expect(loadTrips({ storage, fallback })).toEqual({ trips: realTrips, recovery: null });
  });

  it("keeps a saved empty list", () => {
    const storage = createStorage({ [tripsStorageKey]: "[]" });
    expect(loadTrips({ storage, fallback }).trips).toEqual([]);
  });

  it.each([
    ["invalid JSON", "{broken", "invalid-json"],
    ["null", "null", "not-an-array"],
    ["an object", '{"trips":[]}', "not-an-array"],
  ])("backs up %s before falling back", (_, raw, reason) => {
    const storage = createStorage({ [tripsStorageKey]: raw });
    const { trips, recovery } = loadTrips({ storage, fallback });

    expect(trips).toBe(fallback);
    expect(recovery).toMatchObject({ reason, raw, backupSaved: true });
    expect(storage.getItem(recovery.backupKey)).toBe(raw);
    expect(recovery.backupKey.startsWith(`${tripsStorageKey}:corrupt-`)).toBe(true);
    // The original value is left in place; only the app's next save replaces it.
    expect(storage.getItem(tripsStorageKey)).toBe(raw);
  });

  it("writes one backup per corrupted value even when called twice (React StrictMode)", () => {
    const storage = createStorage({ [tripsStorageKey]: "{broken" });
    const first = loadTrips({ storage, fallback });
    const second = loadTrips({ storage, fallback });
    expect(second.recovery.backupKey).toBe(first.recovery.backupKey);
    expect(backupKeys(storage)).toHaveLength(1);
  });

  it("reports when the backup could not be written", () => {
    const storage = createStorage({ [tripsStorageKey]: "{broken" });
    storage.setItem = () => {
      throw new Error("QuotaExceededError");
    };
    const { recovery } = loadTrips({ storage, fallback });
    expect(recovery).toMatchObject({ backupSaved: false, raw: "{broken" });
  });

  it("falls back quietly when storage is unavailable", () => {
    const storage = {
      getItem: () => {
        throw new Error("SecurityError");
      },
    };
    expect(loadTrips({ storage, fallback })).toEqual({ trips: fallback, recovery: null });
  });
});

describe("saveTrips", () => {
  it("serializes trips under the existing key", () => {
    const storage = createStorage();
    expect(saveTrips(realTrips, storage)).toBe(true);
    expect(JSON.parse(storage.getItem(tripsStorageKey))).toEqual(realTrips);
  });

  it("returns false instead of throwing when storage is full", () => {
    const storage = createStorage();
    storage.setItem = () => {
      throw new Error("QuotaExceededError");
    };
    expect(saveTrips(realTrips, storage)).toBe(false);
  });
});

describe("backupTrips", () => {
  it("stores a timestamped copy and leaves the main key untouched", () => {
    const storage = createStorage({ [tripsStorageKey]: JSON.stringify(realTrips) });
    const result = backupTrips(realTrips, "before-sample", { storage, now: new Date("2026-10-28T05:00:00Z") });

    expect(result).toEqual({ ok: true, key: `${tripsStorageKey}:before-sample-2026-10-28T05-00-00-000Z` });
    expect(JSON.parse(storage.getItem(result.key))).toEqual(realTrips);
    expect(JSON.parse(storage.getItem(tripsStorageKey))).toEqual(realTrips);
  });

  it("reports failure when the copy cannot be written", () => {
    const storage = createStorage();
    storage.setItem = () => {
      throw new Error("QuotaExceededError");
    };
    expect(backupTrips(realTrips, "before-sample", { storage }).ok).toBe(false);
  });
});
