// tikkieteddielab: forced password change after signing in with the seeded admin password.
import { useState } from "react";
import { BatteryCharging, KeyRound, LogOut } from "lucide-react";
import { changeOwnPassword, minPasswordLength } from "../utils/auth.js";
import { tikkieTeddieFooter } from "../utils/licenseGuard.js";

export default function ChangePasswordScreen({ session, onChanged, onLogout }) {
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [error, setError] = useState("");

  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

  const submit = (event) => {
    event.preventDefault();
    if (form.next !== form.confirm) {
      setError("New passwords do not match.");
      return;
    }
    const result = changeOwnPassword(session.user, form.current, form.next);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setError("");
    onChanged(result.session);
  };

  return (
    <main className="grid min-h-screen place-items-center bg-[var(--blonde-wash)] p-4 text-[var(--marine-ink)]">
      <section className="w-full max-w-md rounded-lg border border-[var(--blonde-line)] bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-lg bg-gradient-to-br from-[var(--marine-blue)] to-[var(--sea-mist)] text-white">
            <BatteryCharging size={26} />
          </div>
          <div>
            <h1 className="text-xl font-black">ตั้งรหัสผ่านใหม่</h1>
            <p className="text-sm font-semibold text-[var(--marine-muted)]">Signed in as {session.user}</p>
          </div>
        </div>

        <p className="mt-5 rounded-lg bg-[var(--sea-soft)] p-3 text-sm leading-6">
          บัญชีนี้ยังใช้รหัสผ่านเริ่มต้นของระบบ ซึ่งเปิดเผยต่อสาธารณะ กรุณาตั้งรหัสผ่านใหม่อย่างน้อย {minPasswordLength} ตัวอักษรก่อนใช้งาน
          (รหัสใหม่ใช้ได้เฉพาะ browser นี้) ข้อมูลและผู้ใช้อื่นจะไม่ถูกลบ
        </p>

        <form className="mt-5 grid gap-4" onSubmit={submit}>
          <input type="text" name="username" value={session.user} autoComplete="username" readOnly hidden />
          <label className="grid gap-1 text-sm font-bold">
            Current password
            <input className="input" type="password" value={form.current} onChange={update("current")} autoComplete="current-password" required />
          </label>
          <label className="grid gap-1 text-sm font-bold">
            New password
            <input
              className="input"
              type="password"
              value={form.next}
              onChange={update("next")}
              autoComplete="new-password"
              minLength={minPasswordLength}
              required
            />
          </label>
          <label className="grid gap-1 text-sm font-bold">
            Confirm new password
            <input className="input" type="password" value={form.confirm} onChange={update("confirm")} autoComplete="new-password" required />
          </label>

          {error ? <p className="rounded-lg bg-[#f1eadb] p-3 text-sm font-bold text-[var(--marine-ink)]">{error}</p> : null}

          <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[var(--marine-blue)] px-4 font-black text-white hover:brightness-95">
            <KeyRound size={18} /> Save new password
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[var(--blonde-line)] px-4 text-sm font-bold text-[var(--marine-ink)] hover:bg-[var(--blonde-soft)]"
          >
            <LogOut size={16} /> Logout
          </button>
        </form>

        <p className="mt-5 text-center text-xs font-bold text-[var(--marine-muted)]">{tikkieTeddieFooter}</p>
      </section>
    </main>
  );
}
