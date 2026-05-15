// tikkieteddielab: reusable metric card component.
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

export default function MetricCard({ title, value, hint, tone = "blue", trend }) {
  const toneClass =
    tone === "green"
      ? "from-[var(--sea-mist)] to-[var(--marine-blue)]"
      : tone === "sky"
        ? "from-[var(--marine-blue)] to-[var(--sea-mist)]"
        : "from-[var(--marine-blue)] to-[var(--marine-ink)]";

  return (
    <div className="rounded-lg border border-[var(--blonde-line)] bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[var(--marine-muted)]">{title}</p>
          <p className="mt-2 text-2xl font-bold text-[var(--marine-ink)]">{value}</p>
        </div>
        <div className={`grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br ${toneClass} text-white`}>
          {trend === "down" ? <ArrowDownRight size={20} /> : <ArrowUpRight size={20} />}
        </div>
      </div>
      {hint ? <p className="mt-3 text-sm text-[var(--marine-muted)]">{hint}</p> : null}
    </div>
  );
}
