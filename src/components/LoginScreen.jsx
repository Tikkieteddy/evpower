// tikkieteddielab: login screen wrapping the dashboard.
import { useState } from "react";
import { BatteryCharging, LockKeyhole } from "lucide-react";
import { createAuthSession, loginPassword, loginUsername } from "../utils/auth.js";
import { tikkieTeddieFooter } from "../utils/licenseGuard.js";

export default function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = (event) => {
    event.preventDefault();
    const result = createAuthSession(username, password);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setError("");
    onLogin(result.session);
  };

  return (
    <main className="grid min-h-screen place-items-center bg-[var(--blonde-wash)] p-4 text-[var(--marine-ink)]">
      <section className="w-full max-w-md rounded-lg border border-[var(--blonde-line)] bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-lg bg-gradient-to-br from-[var(--marine-blue)] to-[var(--sea-mist)] text-white">
            <BatteryCharging size={26} />
          </div>
          <div>
            <h1 className="text-xl font-black">EV Power Login</h1>
            <p className="text-sm font-semibold text-[var(--marine-muted)]">tikkieteddielab protected dashboard</p>
          </div>
        </div>

        <form className="mt-6 grid gap-4" onSubmit={submit}>
          <label className="grid gap-1 text-sm font-bold">
            Username
            <input className="input" value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" required />
          </label>
          <label className="grid gap-1 text-sm font-bold">
            Password
            <input
              className="input"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </label>

          {error ? <p className="rounded-lg bg-[#f1eadb] p-3 text-sm font-bold text-[var(--marine-ink)]">{error}</p> : null}

          <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[var(--marine-blue)] px-4 font-black text-white hover:brightness-95">
            <LockKeyhole size={18} /> Log in
          </button>
        </form>

        <div className="mt-5 rounded-lg bg-[var(--blonde-soft)] p-3 text-xs font-semibold leading-5 text-[var(--marine-muted)]">
          Demo credentials: {loginUsername} / {loginPassword}
        </div>
        <p className="mt-5 text-center text-xs font-bold text-[var(--marine-muted)]">{tikkieTeddieFooter}</p>
      </section>
    </main>
  );
}
