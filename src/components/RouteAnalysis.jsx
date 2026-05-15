import DataTable from "./DataTable.jsx";
import { formatBaht, formatNumber, routeAnalysis } from "../utils/calculations.js";

const badgeClass = {
  ประหยัด: "bg-emerald-50 text-emerald-700 border-emerald-200",
  ปานกลาง: "bg-sky-50 text-sky-700 border-sky-200",
  ใช้ไฟสูง: "bg-amber-50 text-amber-700 border-amber-200",
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
        <h2 className="text-xl font-bold text-slate-950">Route Analysis</h2>
        <p className="text-sm text-slate-500">วิเคราะห์จากชื่อเส้นทาง เพื่อดูต้นทุนและการใช้ไฟต่อรูปแบบการเดินทาง</p>
      </div>
      <DataTable columns={columns} rows={rows} />
    </div>
  );
}
