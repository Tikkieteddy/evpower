// tikkieteddielab: manage reusable route presets for daily log.
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { addRoutePreset, deleteRoutePreset } from "../utils/routePresets.js";
import { formatNumber } from "../utils/calculations.js";

export default function RoutePresetManager({ routes, onChange }) {
  const [form, setForm] = useState({ routeName: "", distanceKm: "" });
  const [message, setMessage] = useState("");

  const submit = (event) => {
    event.preventDefault();
    const result = addRoutePreset(form);
    setMessage(result.message);
    if (result.ok) {
      onChange(result.routes);
      setForm({ routeName: "", distanceKm: "" });
    }
  };

  const removeRoute = (id) => {
    const nextRoutes = deleteRoutePreset(id);
    onChange(nextRoutes);
  };

  return (
    <section className="rounded-lg border border-[var(--blonde-line)] bg-white p-4 shadow-sm">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <h3 className="text-base font-black text-[var(--marine-ink)]">เส้นทางประจำ</h3>
          <p className="text-sm text-[var(--marine-muted)]">เพิ่มเส้นทางและระยะทางมาตรฐาน เพื่อเลือกในฟอร์มรายวัน</p>
        </div>
        <form onSubmit={submit} className="grid gap-2 md:grid-cols-[220px_140px_auto]">
          <input
            className="input"
            value={form.routeName}
            onChange={(event) => setForm((current) => ({ ...current, routeName: event.target.value }))}
            placeholder="ชื่อเส้นทาง"
            required
          />
          <input
            className="input"
            type="number"
            min="0"
            step="0.01"
            value={form.distanceKm}
            onChange={(event) => setForm((current) => ({ ...current, distanceKm: event.target.value }))}
            placeholder="กม."
            required
          />
          <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[var(--marine-blue)] px-4 font-bold text-white hover:brightness-95">
            <Plus size={16} /> เพิ่ม
          </button>
        </form>
      </div>

      {message ? <p className="mt-3 rounded-lg bg-[var(--blonde-soft)] p-3 text-sm font-bold text-[var(--marine-ink)]">{message}</p> : null}

      <div className="mt-3 flex flex-wrap gap-2">
        {routes.map((route) => (
          <div key={route.id} className="inline-flex items-center gap-2 rounded-lg border border-[var(--blonde-line)] bg-[var(--blonde-soft)] px-3 py-2 text-sm font-bold text-[var(--marine-ink)]">
            <span>{route.routeName}</span>
            <span className="text-[var(--marine-muted)]">{formatNumber(route.distanceKm, 2)} กม.</span>
            <button
              type="button"
              className="grid h-7 w-7 place-items-center rounded-md text-[var(--marine-muted)] hover:bg-white"
              onClick={() => removeRoute(route.id)}
              title="ลบเส้นทาง"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
