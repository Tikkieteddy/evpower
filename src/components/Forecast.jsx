// tikkieteddielab: next-month projection workflow.
import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import DataTable from "./DataTable.jsx";
import MetricCard from "./MetricCard.jsx";
import { forecastNextMonth, formatBaht, formatNumber, uniqueRoutes } from "../utils/calculations.js";

export default function Forecast({ trips }) {
  const routes = useMemo(() => uniqueRoutes(trips), [trips]);
  const [expectedDays, setExpectedDays] = useState(22);
  const [rows, setRows] = useState([{ id: crypto.randomUUID(), routeName: routes[0] || "", count: 10 }]);
  const forecast = forecastNextMonth(trips, rows, expectedDays);

  const updateRow = (id, field, value) => {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
  };

  const addRow = () => {
    setRows((current) => [...current, { id: crypto.randomUUID(), routeName: routes[0] || "", count: 1 }]);
  };

  const removeRow = (id) => {
    setRows((current) => current.filter((row) => row.id !== id));
  };

  const columns = [
    { key: "routeName", label: "เส้นทาง" },
    { key: "count", label: "จำนวนครั้ง" },
    { key: "distance", label: "ระยะทางคาดการณ์", render: (row) => `${formatNumber(row.distance, 1)} กม.` },
    { key: "kwh", label: "ไฟคาดการณ์", render: (row) => `${formatNumber(row.kwh, 1)} kWh` },
    { key: "idleKwh", label: "ไฟจอดรอ", render: (row) => `${formatNumber(row.idleKwh, 1)} kWh` },
    { key: "cost", label: "ค่าชาร์จคาดการณ์", render: (row) => formatBaht(row.cost) },
  ];

  return (
    <div className="grid gap-5">
      <div>
        <h2 className="text-xl font-bold text-[var(--marine-ink)]">Forecast เดือนถัดไป</h2>
        <p className="text-sm text-[var(--marine-muted)]">คำนวณจากค่าเฉลี่ยของแต่ละเส้นทางคูณจำนวนครั้งที่คาดว่าจะวิ่ง</p>
      </div>

      <section className="rounded-lg border border-[var(--blonde-line)] bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-[220px_1fr]">
          <label className="grid gap-1 text-sm font-semibold text-[var(--marine-ink)]">
            จำนวนวันที่คาดว่าจะวิ่ง
            <input className="input" type="number" min="1" value={expectedDays} onChange={(e) => setExpectedDays(e.target.value)} />
          </label>
          <div className="grid gap-3">
            {rows.map((row) => (
              <div key={row.id} className="grid gap-2 sm:grid-cols-[1fr_140px_44px]">
                <select className="input" value={row.routeName} onChange={(e) => updateRow(row.id, "routeName", e.target.value)}>
                  {routes.map((route) => (
                    <option key={route} value={route}>{route}</option>
                  ))}
                </select>
                <input className="input" type="number" min="0" value={row.count} onChange={(e) => updateRow(row.id, "count", e.target.value)} />
                <button
                  type="button"
                  className="grid h-11 w-11 place-items-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                  onClick={() => removeRow(row.id)}
                  title="ลบเส้นทาง"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            <button
              type="button"
              className="inline-flex min-h-10 w-fit items-center justify-center gap-2 rounded-lg border border-[var(--sea-mist)] px-3 font-bold text-[var(--marine-blue)] hover:bg-[var(--sea-soft)]"
              onClick={addRow}
            >
              <Plus size={16} /> เพิ่มเส้นทาง
            </button>
          </div>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard title="ระยะทางรวมเดือนหน้า" value={`${formatNumber(forecast.totalDistance, 1)} กม.`} />
        <MetricCard title="ไฟที่คาดว่าจะใช้" value={`${formatNumber(forecast.totalKwh, 1)} kWh`} tone="green" />
        <MetricCard title="เงินค่าชาร์จคาดการณ์" value={formatBaht(forecast.totalCost)} tone="sky" />
        <MetricCard title="ไฟจากการจอดรอ" value={`${formatNumber(forecast.totalIdleKwh, 1)} kWh`} hint={`${formatNumber(forecast.totalIdleMinutes, 0)} นาทีโดยประมาณ`} tone="green" />
        <MetricCard title="เฉลี่ยต่อกม." value={`${formatNumber(forecast.avgCostPerKm, 2)} บาท`} />
      </div>

      <DataTable columns={columns} rows={forecast.rows} emptyText="เลือกเส้นทางและจำนวนครั้งเพื่อดูประมาณการ" />
    </div>
  );
}
