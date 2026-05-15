import DataTable from "./DataTable.jsx";
import MetricCard from "./MetricCard.jsx";
import { chargerAnalysis, formatBaht, formatNumber, summarizeTrips } from "../utils/calculations.js";

export default function ChargingAnalysis({ trips }) {
  const rows = chargerAnalysis(trips);
  const summary = summarizeTrips(trips);
  const cheapest = rows.filter((row) => row.bahtPerKwh > 0).sort((a, b) => a.bahtPerKwh - b.bahtPerKwh)[0];
  const mostUsed = [...rows].sort((a, b) => b.sessions - a.sessions)[0];

  const columns = [
    { key: "chargerName", label: "เครื่องชาร์จ" },
    { key: "sessions", label: "จำนวนครั้ง" },
    { key: "totalCost", label: "เงินรวม", render: (row) => formatBaht(row.totalCost, 2) },
    { key: "totalKwh", label: "kWh รวม", render: (row) => formatNumber(row.totalKwh, 2) },
    { key: "bahtPerKwh", label: "บาท/kWh", render: (row) => formatNumber(row.bahtPerKwh, 2) },
    { key: "avgCostPerSession", label: "บาท/ครั้ง", render: (row) => formatBaht(row.avgCostPerSession, 2) },
    { key: "avgKwhPerSession", label: "kWh/ครั้ง", render: (row) => formatNumber(row.avgKwhPerSession, 2) },
    { key: "bahtPerKm", label: "บาท/กม.", render: (row) => formatNumber(row.bahtPerKm, 2) },
    { key: "totalIdleKwh", label: "kWh จอดรอ", render: (row) => formatNumber(row.totalIdleKwh, 2) },
  ];

  return (
    <div className="grid gap-5">
      <div>
        <h2 className="text-xl font-bold text-slate-950">Charging Analysis</h2>
        <p className="text-sm text-slate-500">วิเคราะห์อัตราค่าชาร์จของแต่ละยี่ห้อเครื่อง จากรายการที่มีการชาร์จจริง</p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <MetricCard title="ค่าไฟเฉลี่ยรวม" value={`${formatNumber(summary.avgBahtPerKwh, 2)} บาท/kWh`} hint="เงินค่าชาร์จรวม ÷ kWh รวม" />
        <MetricCard title="เครื่องที่ใช้บ่อยสุด" value={mostUsed?.chargerName || "-"} hint={mostUsed ? `${mostUsed.sessions} ครั้ง` : "ยังไม่มีข้อมูล"} tone="green" />
        <MetricCard title="ถูกที่สุด" value={cheapest?.chargerName || "-"} hint={cheapest ? `${formatNumber(cheapest.bahtPerKwh, 2)} บาท/kWh` : "ยังไม่มีข้อมูล"} tone="sky" trend="down" />
      </div>

      <DataTable columns={columns} rows={rows} emptyText="ยังไม่มีรายการชาร์จ" />
    </div>
  );
}
