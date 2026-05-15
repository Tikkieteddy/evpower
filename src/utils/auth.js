// tikkieteddielab: lightweight client-side login gate for the static EV app.
export const authStorageKey = "tikkieteddielab-evpower-session-v1";
export const usersStorageKey = "tikkieteddielab-evpower-users-v1";
export const loginUsername = "admin";
export const loginPassword = "TikkieTeddie@2026";

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
    const saved = localStorage.getItem(authStorageKey);
    if (!saved) return null;
    const session = JSON.parse(saved);
    const user = getUsers().find((item) => item.username === session?.user);
    return user && session?.credit === "tikkieteddielab" ? { ...session, role: user.role } : null;
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
  localStorage.setItem(authStorageKey, JSON.stringify(session));
  return { ok: true, session };
};

export const clearAuthSession = () => {
  localStorage.removeItem(authStorageKey);
};

export const addUser = ({ username, password, role = "user" }) => {
  const normalizedUsername = username.trim();
  if (!normalizedUsername || !password) return { ok: false, message: "Username and password are required." };
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
  const users = getUsers();
  const nextUsers = users.map((user) => (user.username === username ? { ...user, password } : user));
  saveUsers(nextUsers);
  return { ok: true, users: nextUsers };
};

export const deleteUser = (username) => {
  if (username === loginUsername) return { ok: false, message: "Default admin cannot be deleted." };
  const nextUsers = getUsers().filter((user) => user.username !== username);
  saveUsers(nextUsers);
  return { ok: true, users: nextUsers };
};
