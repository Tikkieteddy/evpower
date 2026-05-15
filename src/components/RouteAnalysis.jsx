// tikkieteddielab: route-level EV efficiency analysis.
import DataTable from "./DataTable.jsx";
import { formatBaht, formatNumber, routeAnalysis } from "../utils/calculations.js";

const badgeClass = {
  ประหยัด: "bg-[var(--sea-soft)] text-[var(--marine-blue)] border-[var(--sea-mist)]",
  ปานกลาง: "bg-[var(--blonde-soft)] text-[var(--marine-ink)] border-[var(--blonde-gray)]",
  ใช้ไฟสูง: "bg-[#f1eadb] text-[var(--marine-ink)] border-[var(--blonde-gray)]",
};

export default function RouteAnalysis({ trips }) {
  const rows = routeAnalysis(trips);
  const columns = [
    { key: "routeName", label: "ชื่อเส้นทาง" },
    { key: "count", label: "จำนวนครั้ง" },
    { key: "avgDistance", label: "กม./ครั้ง", render: (row) => formatNumber(row.avgDistance, 1) },
    { key: "totalDistance", label: "กม.รวม", render: (row) => formatNumber(row.totalDistance, 1) },
    { key: "avgCost", label: "บาทเฉลี่ย", render: (row) => formatBaht(row.avgCost) },
    { key: "avgKwh", label: "kWh เฉลี่ย", render: (row) => formatNumber(row.avgKwh, 2) },
    { key: "avgIdleMinutes", label: "จอดรอ/ครั้ง", render: (row) => `${formatNumber(row.avgIdleMinutes, 0)} นาที` },
    { key: "avgIdleKwh", label: "kWh จอดรอ", render: (row) => formatNumber(row.avgIdleKwh, 2) },
    { key: "bahtPerKm", label: "บาท/กม.", render: (row) => formatNumber(row.bahtPerKm, 2) },
    { key: "kwhPerKm", label: "kWh/กม.", render: (row) => formatNumber(row.kwhPerKm, 3) },
    {
      key: "efficiency",
      label: "ประเมิน",
      render: (row) => (
        <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${badgeClass[row.efficiency]}`}>
          {row.efficiency}
        </span>
      ),
    },
  ];

  return (
    <div className="grid gap-5">
      <div>
        <h2 className="text-xl font-bold text-[var(--marine-ink)]">Route Analysis</h2>
        <p className="text-sm text-[var(--marine-muted)]">วิเคราะห์จากชื่อเส้นทาง เพื่อดูต้นทุนและการใช้ไฟต่อรูปแบบการเดินทาง</p>
      </div>
      <DataTable columns={columns} rows={rows} />
    </div>
  );
}
