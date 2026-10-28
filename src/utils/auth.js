// tikkieteddielab: lightweight client-side login gate for the static EV app.
export const authStorageKey = "tikkieteddielab-evpower-session-v1";
export const legacyAuthStorageKey = "tikkieteddielab-evpower-session-v1";
export const usersStorageKey = "tikkieteddielab-evpower-users-v1";
export const loginUsername = "admin";
export const loginPassword = "TikkieTeddie@2026";

export const minPasswordLength = 8;

// The seeded admin password is public (repo + bundle), so it only works to set a new one.
const isDefaultCredential = (user) => user?.username === loginUsername && user?.password === loginPassword;
const defaultPasswordMessage = "This password is not allowed. Choose a different one.";

const defaultUsers = [
  {
    username: loginUsername,
    password: loginPassword,
    role: "admin",
    createdAt: "2026-05-15T00:00:00.000Z",
  },
];

export const getUsers = () => {
  try {
    const saved = localStorage.getItem(usersStorageKey);
    if (!saved) {
      localStorage.setItem(usersStorageKey, JSON.stringify(defaultUsers));
      return defaultUsers;
    }
    const users = JSON.parse(saved);
    return Array.isArray(users) && users.length > 0 ? users : defaultUsers;
  } catch {
    return defaultUsers;
  }
};

const saveUsers = (users) => {
  localStorage.setItem(usersStorageKey, JSON.stringify(users));
};

export const readAuthSession = () => {
  try {
    localStorage.removeItem(legacyAuthStorageKey);
    const saved = sessionStorage.getItem(authStorageKey);
    if (!saved) return null;
    const session = JSON.parse(saved);
    const user = getUsers().find((item) => item.username === session?.user);
    return user && session?.credit === "tikkieteddielab"
      ? { ...session, role: user.role, mustChangePassword: isDefaultCredential(user) }
      : null;
  } catch {
    return null;
  }
};

export const createAuthSession = (username, password) => {
  const normalizedUsername = username.trim();
  const user = getUsers().find((item) => item.username === normalizedUsername && item.password === password);
  if (!user) {
    return { ok: false, message: "Username or password is incorrect." };
  }

  const session = {
    user: user.username,
    role: user.role,
    credit: "tikkieteddielab",
    signedInAt: new Date().toISOString(),
  };
  localStorage.removeItem(legacyAuthStorageKey);
  sessionStorage.setItem(authStorageKey, JSON.stringify(session));
  return { ok: true, session: { ...session, mustChangePassword: isDefaultCredential(user) } };
};

export const clearAuthSession = () => {
  localStorage.removeItem(legacyAuthStorageKey);
  sessionStorage.removeItem(authStorageKey);
};

export const addUser = ({ username, password, role = "user" }) => {
  const normalizedUsername = username.trim();
  if (!normalizedUsername || !password) return { ok: false, message: "Username and password are required." };
  if (password === loginPassword) return { ok: false, message: defaultPasswordMessage };
  const users = getUsers();
  if (users.some((user) => user.username.toLowerCase() === normalizedUsername.toLowerCase())) {
    return { ok: false, message: "This username already exists." };
  }
  const nextUsers = [
    ...users,
    {
      username: normalizedUsername,
      password,
      role,
      createdAt: new Date().toISOString(),
    },
  ];
  saveUsers(nextUsers);
  return { ok: true, users: nextUsers };
};

export const updateUserPassword = (username, password) => {
  if (!password) return { ok: false, message: "New password is required." };
  if (password === loginPassword) return { ok: false, message: defaultPasswordMessage };
  const users = getUsers();
  const nextUsers = users.map((user) => (user.username === username ? { ...user, password } : user));
  saveUsers(nextUsers);
  return { ok: true, users: nextUsers };
};

export const changeOwnPassword = (username, currentPassword, newPassword) => {
  const user = getUsers().find((item) => item.username === username);
  if (!user || user.password !== currentPassword) return { ok: false, message: "Current password is incorrect." };
  if (newPassword.length < minPasswordLength) {
    return { ok: false, message: `New password must be at least ${minPasswordLength} characters.` };
  }
  if (newPassword === currentPassword) return { ok: false, message: "New password must be different from the current one." };
  const result = updateUserPassword(username, newPassword);
  if (!result.ok) return result;
  return { ok: true, users: result.users, session: readAuthSession() };
};

export const deleteUser = (username) => {
  if (username === loginUsername) return { ok: false, message: "Default admin cannot be deleted." };
  const nextUsers = getUsers().filter((user) => user.username !== username);
  saveUsers(nextUsers);
  return { ok: true, users: nextUsers };
};
