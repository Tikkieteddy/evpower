// tikkieteddielab: next-month projection workflow.
import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import DataTable from "./DataTable.jsx";
import MetricCard from "./MetricCard.jsx";
import { forecastNextMonth, formatBaht, formatNumber, uniqueRoutes } from "../utils/calculations.js";

export default function Forecast({ trips }) {
  const routes = useMemo(() => uniqueRoutes(trips), [trips]);
  const [expectedDays, setExpectedDays] = useState(30);
  const [rows, setRows] = useState([
    { id: crypto.randomUUID(), routeName: routes[0] || "", plannedDays: 16, tripsPerDay: 1, count: 16 },
  ]);
  const forecast = forecastNextMonth(trips, rows, expectedDays);

  const updateRow = (id, field, value) => {
    setRows((current) =>
      current.map((row) => {
        if (row.id !== id) return row;
        const next = { ...row, [field]: value };
        if (field === "plannedDays" || field === "tripsPerDay") {
          const plannedDays = Number(field === "plannedDays" ? value : next.plannedDays) || 0;
          const tripsPerDay = Number(field === "tripsPerDay" ? value : next.tripsPerDay) || 0;
          next.count = Number((plannedDays * tripsPerDay).toFixed(2));
        }
        return next;
      }),
    );
  };

  const addRow = () => {
    setRows((current) => [
      ...current,
      { id: crypto.randomUUID(), routeName: routes[0] || "", plannedDays: 1, tripsPerDay: 1, count: 1 },
    ]);
  };

  const removeRow = (id) => {
    setRows((current) => current.filter((row) => row.id !== id));
  };

  const columns = [
    { key: "routeName", label: "เส้นทาง" },
    { key: "plannedDays", label: "วันที่วิ่ง", render: (row) => `${formatNumber(row.plannedDays, 2)} วัน` },
    { key: "tripsPerDay", label: "รอบ/วัน", render: (row) => formatNumber(row.tripsPerDay, 2) },
    { key: "count", label: "รวมครั้ง", render: (row) => formatNumber(row.count, 2) },
    { key: "distance", label: "ระยะทางคาดการณ์", render: (row) => `${formatNumber(row.distance, 2)} กม.` },
    { key: "kwh", label: "ไฟคาดการณ์", render: (row) => `${formatNumber(row.kwh, 2)} kWh` },
    { key: "idleKwh", label: "ไฟจอดรอ", render: (row) => `${formatNumber(row.idleKwh, 2)} kWh` },
    { key: "cost", label: "ค่าชาร์จคาดการณ์", render: (row) => formatBaht(row.cost) },
  ];

  return (
    <div className="grid gap-5">
      <div>
        <h2 className="text-xl font-bold text-[var(--marine-ink)]">Forecast เดือนถัดไป</h2>
        <p className="text-sm text-[var(--marine-muted)]">
          กรอกจำนวนวันที่วิ่งและรอบต่อวัน ระบบจะคำนวณจำนวนครั้งรวมและประมาณค่าไฟให้เอง
        </p>
      </div>

      <section className="rounded-lg border border-[var(--blonde-line)] bg-white p-4 shadow-sm">
        <div className="grid gap-3">
          <label className="grid gap-1 text-sm font-semibold text-[var(--marine-ink)]">
            จำนวนวันในเดือนหน้าที่ใช้หารเฉลี่ยต่อวัน
            <input
              className="input"
              type="number"
              min="0.01"
              step="0.01"
              value={expectedDays}
              onChange={(e) => setExpectedDays(e.target.value)}
            />
            <span className="text-xs font-semibold text-[var(--marine-muted)]">
              เช่น 30 วัน ถ้าต้องการดูค่าเฉลี่ยทั้งเดือน หรือ 16 วัน ถ้าคิดเฉพาะวันที่ใช้งานจริง
            </span>
          </label>

          <div className="grid gap-3">
            {rows.map((row) => (
              <div
                key={row.id}
                className="grid gap-2 rounded-lg border border-[var(--blonde-line)] bg-[var(--blonde-soft)] p-3 xl:grid-cols-[minmax(220px,1fr)_130px_120px_130px_44px]"
              >
                <label className="grid gap-1 text-xs font-bold text-[var(--marine-muted)]">
                  เส้นทาง
                  <select className="input" value={row.routeName} onChange={(e) => updateRow(row.id, "routeName", e.target.value)}>
                    {routes.map((route) => (
                      <option key={route} value={route}>
                        {route}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1 text-xs font-bold text-[var(--marine-muted)]">
                  วิ่งกี่วัน
                  <input
                    className="input"
                    type="number"
                    min="0"
                    step="0.01"
                    value={row.plannedDays}
                    onChange={(e) => updateRow(row.id, "plannedDays", e.target.value)}
                  />
                </label>
                <label className="grid gap-1 text-xs font-bold text-[var(--marine-muted)]">
                  รอบ/วัน
                  <input
                    className="input"
                    type="number"
                    min="0"
                    step="0.01"
                    value={row.tripsPerDay}
                    onChange={(e) => updateRow(row.id, "tripsPerDay", e.target.value)}
                  />
                </label>
                <label className="grid gap-1 text-xs font-bold text-[var(--marine-muted)]">
                  รวมครั้ง
                  <input
                    className="input"
                    type="number"
                    min="0"
                    step="0.01"
                    value={row.count}
                    onChange={(e) => updateRow(row.id, "count", e.target.value)}
                  />
                </label>
                <button
                  type="button"
                  className="mt-5 grid h-11 w-11 place-items-center rounded-lg border border-red-200 bg-white text-red-600 hover:bg-red-50"
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
        <MetricCard title="ระยะทางรวมเดือนหน้า" value={`${formatNumber(forecast.totalDistance, 2)} กม.`} />
        <MetricCard title="ไฟที่คาดว่าจะใช้" value={`${formatNumber(forecast.totalKwh, 2)} kWh`} tone="green" />
        <MetricCard title="เงินค่าชาร์จคาดการณ์" value={formatBaht(forecast.totalCost)} tone="sky" />
        <MetricCard
          title="ไฟจากการจอดรอ"
          value={`${formatNumber(forecast.totalIdleKwh, 2)} kWh`}
          hint={`${formatNumber(forecast.totalIdleMinutes, 2)} นาทีโดยประมาณ`}
          tone="green"
        />
        <MetricCard title="เฉลี่ยต่อกม." value={`${formatNumber(forecast.avgCostPerKm, 2)} บาท`} />
      </div>

      <DataTable columns={columns} rows={forecast.rows} emptyText="เลือกเส้นทางและกรอกจำนวนวัน/รอบต่อวันเพื่อดูประมาณการ" />
    </div>
  );
}
