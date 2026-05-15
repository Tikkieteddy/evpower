import { ArrowDownRight, ArrowUpRight } from "lucide-react";

export default function MetricCard({ title, value, hint, tone = "blue", trend }) {
  const toneClass =
    tone === "green"
      ? "from-emerald-500 to-teal-600"
      : tone === "sky"
        ? "from-sky-500 to-blue-600"
        : "from-blue-600 to-indigo-600";

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-bold text-slate-950">{value}</p>
        </div>
        <div className={`grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br ${toneClass} text-white`}>
          {trend === "down" ? <ArrowDownRight size={20} /> : <ArrowUpRight size={20} />}
        </div>
      </div>
      {hint ? <p className="mt-3 text-sm text-slate-500">{hint}</p> : null}
    </div>
  );
}
