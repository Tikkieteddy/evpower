// tikkieteddielab: visible lock screen when required credit or palette checks fail.
import { ShieldAlert } from "lucide-react";

export default function LicenseLock({ status }) {
  return (
    <main className="grid min-h-screen place-items-center bg-[var(--blonde-wash)] p-6 text-[var(--marine-ink)]">
      <section className="w-full max-w-xl rounded-lg border border-[var(--blonde-line)] bg-white p-6 text-center shadow-sm">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-lg bg-[var(--sea-soft)] text-[var(--marine-blue)]">
          <ShieldAlert size={26} />
        </div>
        <h1 className="mt-4 text-2xl font-black">License integrity check failed</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--marine-muted)]">
          This build requires the tikkieteddielab credit, version footer, and audited palette integrity to remain intact.
        </p>
        <div className="mt-4 rounded-lg bg-[var(--blonde-soft)] p-4 text-left text-sm font-semibold">
          <p>Credit: {status.creditOk ? "OK" : "Missing or changed"}</p>
          <p>Footer: {status.footerOk ? "OK" : "Missing or changed"}</p>
          <p>Version: {status.versionOk ? "OK" : "Missing or changed"}</p>
          <p>Palette collisions: {status.paletteCollisions.length}</p>
        </div>
      </section>
    </main>
  );
}
