// tikkieteddielab: unit tests for browser persistence helpers (in-memory Web Storage stub).
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  addRoutePreset,
  defaultRoutePresets,
  deleteRoutePreset,
  getRoutePresets,
  routePresetsStorageKey,
} from "./routePresets.js";
import {
  addUser,
  authStorageKey,
  changeOwnPassword,
  clearAuthSession,
  createAuthSession,
  deleteUser,
  getUsers,
  loginPassword,
  loginUsername,
  minPasswordLength,
  readAuthSession,
  updateUserPassword,
  usersStorageKey,
} from "./auth.js";

const createStorage = () => {
  const data = new Map();
  return {
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: (key) => data.delete(key),
    clear: () => data.clear(),
  };
};

beforeEach(() => {
  vi.stubGlobal("localStorage", createStorage());
  vi.stubGlobal("sessionStorage", createStorage());
});

describe("route presets", () => {
  it("seeds and persists defaults on first read", () => {
    expect(getRoutePresets()).toEqual(defaultRoutePresets);
    expect(JSON.parse(localStorage.getItem(routePresetsStorageKey))).toEqual(defaultRoutePresets);
  });

  it("keeps an existing saved list, including an empty one", () => {
    localStorage.setItem(routePresetsStorageKey, "[]");
    expect(getRoutePresets()).toEqual([]);
  });

  it("falls back to defaults on invalid JSON without overwriting it", () => {
    localStorage.setItem(routePresetsStorageKey, "{broken");
    expect(getRoutePresets()).toEqual(defaultRoutePresets);
    expect(localStorage.getItem(routePresetsStorageKey)).toBe("{broken");
  });

  it("adds a preset with a trimmed name and numeric distance", () => {
    const result = addRoutePreset({ routeName: "  บ้าน - สนามบิน ", distanceKm: "35.25" });
    expect(result.ok).toBe(true);
    expect(result.routes.at(-1)).toMatchObject({ routeName: "บ้าน - สนามบิน", distanceKm: 35.25 });
    expect(getRoutePresets()).toHaveLength(defaultRoutePresets.length + 1);
  });

  it("rejects blank names, invalid distances and case-insensitive duplicates", () => {
    expect(addRoutePreset({ routeName: " ", distanceKm: 5 }).ok).toBe(false);
    expect(addRoutePreset({ routeName: "x", distanceKm: -1 }).ok).toBe(false);
    expect(addRoutePreset({ routeName: "x", distanceKm: "abc" }).ok).toBe(false);
    addRoutePreset({ routeName: "Airport", distanceKm: 1 });
    expect(addRoutePreset({ routeName: "airport", distanceKm: 2 }).ok).toBe(false);
  });

  it("deletes by id", () => {
    const remaining = deleteRoutePreset(defaultRoutePresets[0].id);
    expect(remaining.map((r) => r.id)).not.toContain(defaultRoutePresets[0].id);
    expect(getRoutePresets()).toHaveLength(defaultRoutePresets.length - 1);
  });
});

describe("local users and session gate", () => {
  // The default password is never asserted or printed here; tests use their own users.
  const signUp = (username = "driver", password = "test-pass-1", role = "user") => addUser({ username, password, role });

  it("seeds a single default admin on first read", () => {
    const users = getUsers();
    expect(users).toHaveLength(1);
    expect(users[0]).toMatchObject({ username: loginUsername, role: "admin" });
    expect(localStorage.getItem(usersStorageKey)).not.toBeNull();
  });

  it("adds users and rejects duplicates and blanks", () => {
    expect(signUp().ok).toBe(true);
    expect(signUp("DRIVER").ok).toBe(false);
    expect(addUser({ username: " ", password: "x" }).ok).toBe(false);
    expect(addUser({ username: "y", password: "" }).ok).toBe(false);
    expect(getUsers().map((u) => u.username)).toEqual([loginUsername, "driver"]);
  });

  it("creates a session in Session Storage, not Local Storage", () => {
    signUp();
    const result = createAuthSession(" driver ", "test-pass-1");
    expect(result.ok).toBe(true);
    expect(result.session).toMatchObject({ user: "driver", role: "user", credit: "tikkieteddielab" });
    expect(JSON.parse(sessionStorage.getItem(authStorageKey)).user).toBe("driver");
    expect(localStorage.getItem(authStorageKey)).toBeNull();
  });

  it("rejects a wrong password", () => {
    signUp();
    expect(createAuthSession("driver", "wrong").ok).toBe(false);
    expect(sessionStorage.getItem(authStorageKey)).toBeNull();
  });

  it("reads the role from the user list, not from the stored session", () => {
    signUp();
    createAuthSession("driver", "test-pass-1");
    const tampered = { ...JSON.parse(sessionStorage.getItem(authStorageKey)), role: "admin" };
    sessionStorage.setItem(authStorageKey, JSON.stringify(tampered));
    expect(readAuthSession().role).toBe("user");
  });

  it("invalidates the session when the user is deleted or credit is missing", () => {
    signUp();
    createAuthSession("driver", "test-pass-1");
    deleteUser("driver");
    expect(readAuthSession()).toBeNull();

    sessionStorage.setItem(authStorageKey, JSON.stringify({ user: loginUsername }));
    expect(readAuthSession()).toBeNull();
  });

  it("clears the session on logout", () => {
    signUp();
    createAuthSession("driver", "test-pass-1");
    clearAuthSession();
    expect(readAuthSession()).toBeNull();
  });

  it("changes a password", () => {
    signUp();
    updateUserPassword("driver", "test-pass-2");
    expect(createAuthSession("driver", "test-pass-1").ok).toBe(false);
    expect(createAuthSession("driver", "test-pass-2").ok).toBe(true);
    expect(updateUserPassword("driver", "").ok).toBe(false);
  });

  it("refuses to delete the default admin", () => {
    expect(deleteUser(loginUsername).ok).toBe(false);
    expect(getUsers()).toHaveLength(1);
  });
});

describe("forced change of the default password", () => {
  // Uses the imported constant only as input; the value is never asserted or printed.
  const signInAsDefaultAdmin = () => createAuthSession(loginUsername, loginPassword);
  const newPassword = "new-admin-pass-1";

  it("flags a session that signed in with the default password", () => {
    expect(signInAsDefaultAdmin().session.mustChangePassword).toBe(true);
    expect(readAuthSession().mustChangePassword).toBe(true);
  });

  it("does not flag other users", () => {
    addUser({ username: "driver", password: "test-pass-1" });
    expect(createAuthSession("driver", "test-pass-1").session.mustChangePassword).toBe(false);
  });

  it("recomputes the flag from the user list, so editing the session cannot skip it", () => {
    signInAsDefaultAdmin();
    const tampered = { ...JSON.parse(sessionStorage.getItem(authStorageKey)), mustChangePassword: false };
    sessionStorage.setItem(authStorageKey, JSON.stringify(tampered));
    expect(readAuthSession().mustChangePassword).toBe(true);
  });

  it("changes the password and clears the flag", () => {
    signInAsDefaultAdmin();
    const result = changeOwnPassword(loginUsername, loginPassword, newPassword);
    expect(result.ok).toBe(true);
    expect(result.session.mustChangePassword).toBe(false);
    expect(readAuthSession().mustChangePassword).toBe(false);
    expect(signInAsDefaultAdmin().ok).toBe(false);
    expect(createAuthSession(loginUsername, newPassword).ok).toBe(true);
  });

  it("keeps other users and their passwords", () => {
    addUser({ username: "driver", password: "test-pass-1" });
    signInAsDefaultAdmin();
    changeOwnPassword(loginUsername, loginPassword, newPassword);
    expect(getUsers().map((u) => u.username)).toEqual([loginUsername, "driver"]);
    expect(createAuthSession("driver", "test-pass-1").ok).toBe(true);
  });

  it.each([
    ["the current password is wrong", (current) => [current + "x", newPassword]],
    ["the new password is too short", (current) => [current, "x".repeat(minPasswordLength - 1)]],
    ["the new password equals the default", (current) => [current, loginPassword]],
  ])("rejects the change when %s", (_, args) => {
    signInAsDefaultAdmin();
    const [current, next] = args(loginPassword);
    expect(changeOwnPassword(loginUsername, current, next).ok).toBe(false);
    expect(readAuthSession().mustChangePassword).toBe(true);
  });

  it("never lets an admin set any user back to the default password", () => {
    addUser({ username: "driver", password: "test-pass-1" });
    expect(updateUserPassword("driver", loginPassword).ok).toBe(false);
    expect(addUser({ username: "other", password: loginPassword }).ok).toBe(false);
  });
});
