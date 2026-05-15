import { useMemo, useState } from "react";
import Charts from "./Charts.jsx";
import DashboardCards from "./DashboardCards.jsx";
import MetricCard from "./MetricCard.jsx";
import { filterByWeek, formatNumber, getWeekKey, safeDivide, sortTrips, summarizeTrips } from "../utils/calculations.js";

export default function WeeklyDashboard({ trips }) {
  const weeks = useMemo(() => {
    const grouped = new Map();
    sortTrips(trips).forEach((trip) => {
      const week = getWeekKey(trip.date);
      grouped.set(week.start, week);
    });
    return [...grouped.values()].sort((a, b) => b.start.localeCompare(a.start));
  }, [trips]);
  const [selectedWeek, setSelectedWeek] = useState(weeks[0]?.start || "");
  const currentWeek = weeks.find((week) => week.start === selectedWeek) || weeks[0];
  const weekTrips = currentWeek ? filterByWeek(trips, currentWeek.start) : [];
  const summary = summarizeTrips(weekTrips);

  return (
    <div className="grid gap-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-950">Weekly Dashboard</h2>
          <p className="text-sm text-slate-500">ภาพรวมประจำสัปดาห์ {currentWeek?.label || ""}</p>
        </div>
        <select className="input max-w-xs" value={currentWeek?.start || ""} onChange={(e) => setSelectedWeek(e.target.value)}>
          {weeks.map((week) => (
            <option key={week.start} value={week.start}>{week.label}</option>
          ))}
        </select>
      </div>

      <DashboardCards summary={summary} />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="kWh ต่อกิโลเมตร" value={formatNumber(summary.kwhPerKm, 3)} hint="ไฟรวม ÷ ระยะทางรวม" tone="green" trend="down" />
        <MetricCard title="ค่าไฟเฉลี่ยต่อ kWh" value={`${formatNumber(summary.avgBahtPerKwh, 2)} บาท`} hint="เงินรวม ÷ kWh รวม" tone="sky" />
        <MetricCard title="วันที่เดินทาง" value={`${summary.travelDays} วัน`} hint={`จาก ${summary.dataDays} วันที่มีข้อมูล`} />
        <MetricCard title="เฉพาะการขับขี่" value={`${formatNumber(summary.drivingKwhPerKm, 3)} kWh/กม.`} hint={`ตัดไฟจอดรอออกประมาณ ${formatNumber(summary.totalIdleKwh, 1)} kWh`} tone="green" />
      </div>
      <Charts trips={weekTrips} />
    </div>
  );
}
