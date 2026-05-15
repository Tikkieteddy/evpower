// tikkieteddielab: local user management for the static login gate.
import { useState } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import { addUser, deleteUser, getUsers, loginUsername, updateUserPassword } from "../utils/auth.js";

export default function UserManagement({ currentUser }) {
  const [users, setUsers] = useState(getUsers);
  const [form, setForm] = useState({ username: "", password: "", role: "user" });
  const [passwords, setPasswords] = useState({});
  const [message, setMessage] = useState("");

  const submit = (event) => {
    event.preventDefault();
    const result = addUser(form);
    setMessage(result.message || "User added.");
    if (result.ok) {
      setUsers(result.users);
      setForm({ username: "", password: "", role: "user" });
    }
  };

  const changePassword = (username) => {
    const result = updateUserPassword(username, passwords[username] || "");
    setMessage(result.message || `Password updated for ${username}.`);
    if (result.ok) {
      setUsers(result.users);
      setPasswords((current) => ({ ...current, [username]: "" }));
    }
  };

  const removeUser = (username) => {
    if (!confirm(`Delete user ${username}?`)) return;
    const result = deleteUser(username);
    setMessage(result.message || `User ${username} deleted.`);
    if (result.ok) setUsers(result.users);
  };

  return (
    <div className="grid gap-5">
      <div>
        <h2 className="text-xl font-bold text-[var(--marine-ink)]">User Management</h2>
        <p className="text-sm text-[var(--marine-muted)]">เพิ่ม user และเปลี่ยนรหัสผ่านสำหรับ login gate ของเครื่องนี้</p>
      </div>

      <form onSubmit={submit} className="grid gap-3 rounded-lg border border-[var(--blonde-line)] bg-white p-4 shadow-sm md:grid-cols-[1fr_1fr_150px_auto]">
        <label className="grid gap-1 text-sm font-bold text-[var(--marine-ink)]">
          Username
          <input className="input" value={form.username} onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))} required />
        </label>
        <label className="grid gap-1 text-sm font-bold text-[var(--marine-ink)]">
          Password
          <input className="input" type="password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} required />
        </label>
        <label className="grid gap-1 text-sm font-bold text-[var(--marine-ink)]">
          Role
          <select className="input" value={form.role} onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}>
            <option value="user">user</option>
            <option value="admin">admin</option>
          </select>
        </label>
        <button className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[var(--marine-blue)] px-4 font-black text-white hover:brightness-95">
          <Plus size={16} /> Add
        </button>
      </form>

      {message ? <p className="rounded-lg border border-[var(--blonde-line)] bg-[var(--blonde-soft)] p-3 text-sm font-bold text-[var(--marine-ink)]">{message}</p> : null}

      <div className="overflow-x-auto rounded-lg border border-[var(--blonde-line)] bg-white shadow-sm">
        <table className="min-w-full divide-y divide-[var(--blonde-line)] text-sm">
          <thead className="bg-[var(--blonde-soft)]">
            <tr>
              <th className="px-4 py-3 text-left font-bold text-[var(--marine-muted)]">Username</th>
              <th className="px-4 py-3 text-left font-bold text-[var(--marine-muted)]">Role</th>
              <th className="px-4 py-3 text-left font-bold text-[var(--marine-muted)]">New password</th>
              <th className="px-4 py-3 text-left font-bold text-[var(--marine-muted)]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--blonde-line)]">
            {users.map((user) => (
              <tr key={user.username}>
                <td className="whitespace-nowrap px-4 py-3 font-bold text-[var(--marine-ink)]">
                  {user.username}
                  {currentUser === user.username ? <span className="ml-2 rounded-full bg-[var(--sea-soft)] px-2 py-1 text-xs text-[var(--marine-blue)]">current</span> : null}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-[var(--marine-ink)]">{user.role}</td>
                <td className="px-4 py-3">
                  <input
                    className="input min-w-56"
                    type="password"
                    value={passwords[user.username] || ""}
                    onChange={(event) => setPasswords((current) => ({ ...current, [user.username]: event.target.value }))}
                    placeholder="New password"
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => changePassword(user.username)}
                      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[var(--sea-mist)] px-3 font-bold text-[var(--marine-blue)] hover:bg-[var(--sea-soft)]"
                    >
                      <Save size={16} /> Save
                    </button>
                    <button
                      type="button"
                      onClick={() => removeUser(user.username)}
                      disabled={user.username === loginUsername}
                      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[var(--blonde-line)] px-3 font-bold text-[var(--marine-ink)] hover:bg-[var(--blonde-soft)] disabled:opacity-45"
                    >
                      <Trash2 size={16} /> Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
