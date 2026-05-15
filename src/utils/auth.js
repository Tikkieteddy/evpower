// tikkieteddielab: lightweight client-side login gate for the static EV app.
export const authStorageKey = "tikkieteddielab-evpower-session-v1";
export const loginUsername = "admin";
export const loginPassword = "TikkieTeddie@2026";

export const readAuthSession = () => {
  try {
    const saved = localStorage.getItem(authStorageKey);
    if (!saved) return null;
    const session = JSON.parse(saved);
    return session?.user === loginUsername && session?.credit === "tikkieteddielab" ? session : null;
  } catch {
    return null;
  }
};

export const createAuthSession = (username, password) => {
  if (username.trim() !== loginUsername || password !== loginPassword) {
    return { ok: false, message: "Username or password is incorrect." };
  }

  const session = {
    user: loginUsername,
    credit: "tikkieteddielab",
    signedInAt: new Date().toISOString(),
  };
  localStorage.setItem(authStorageKey, JSON.stringify(session));
  return { ok: true, session };
};

export const clearAuthSession = () => {
  localStorage.removeItem(authStorageKey);
};
