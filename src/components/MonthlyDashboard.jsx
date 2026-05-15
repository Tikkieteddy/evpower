import { useMemo, useState } from "react";
import Charts from "./Charts.jsx";
import DashboardCards from "./DashboardCards.jsx";
import MetricCard from "./MetricCard.jsx";
import {
  filterByMonth,
  formatNumber,
  getMonthKey,
  monthlyHighlights,
  sortTrips,
  summarizeTrips,
} from "../utils/calculations.js";

export default function MonthlyDashboard({ trips }) {
  const months = useMemo(() => [...new Set(sortTrips(trips).map((trip) => getMonthKey(trip.date)))].sort().reverse(), [trips]);
  const [selectedMonth, setSelectedMonth] = useState(months[0] || "");
  const activeMonth = months.includes(selectedMonth) ? selectedMonth : months[0];
  const monthTrips = activeMonth ? filterByMonth(trips, activeMonth) : [];
  const summary = summarizeTrips(monthTrips);
  const highlights = monthlyHighlights(monthTrips);

  return (
    <div className="grid gap-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-950">Monthly Dashboard</h2>
          <p className="text-sm text-slate-500">ภาพรวมรายเดือน พร้อมเส้นทางที่น่าสนใจ</p>
        </div>
        <input className="input max-w-xs" type="month" value={activeMonth || ""} onChange={(e) => setSelectedMonth(e.target.value)} />
      </div>

      <DashboardCards summary={summary} />
      <div className="grid gap-3 md:grid-cols-3">
        <MetricCard title="เส้นทางที่วิ่งบ่อยที่สุด" value={highlights.mostFrequentRoute} hint="นับจากจำนวนครั้งที่บันทึก" tone="green" />
        <MetricCard title="ใช้เงินเฉลี่ยสูงที่สุด" value={highlights.highestCostRoute} hint="วัดจากบาทต่อกิโลเมตร" />
        <MetricCard title="ผลจากการจอดรอ" value={`${formatNumber(summary.totalIdleKwh, 1)} kWh`} hint={`ประมาณ ${formatNumber(summary.totalIdleMinutes, 0)} นาทีในเดือนนี้`} tone="green" trend="down" />
      </div>
      <Charts trips={monthTrips} />
    </div>
  );
}
