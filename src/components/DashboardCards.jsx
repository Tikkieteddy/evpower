// tikkieteddielab: dashboard summary card grid.
import MetricCard from "./MetricCard.jsx";
import { formatBaht, formatNumber } from "../utils/calculations.js";

export default function DashboardCards({ summary }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard title="ระยะทางรวม" value={`${formatNumber(summary.totalDistance, 2)} กม.`} hint="รวมจากรายการที่บันทึก" />
      <MetricCard title="ไฟที่ชาร์จรวม" value={`${formatNumber(summary.totalKwh, 2)} kWh`} hint={`${summary.chargeDays} วันที่มีการชาร์จ`} tone="green" />
      <MetricCard title="เงินค่าชาร์จรวม" value={formatBaht(summary.totalCost)} hint={`${formatNumber(summary.bahtPerKm, 2)} บาท/กม.`} tone="sky" />
      <MetricCard title="จอดรอเปิดแอร์" value={`${formatNumber(summary.totalIdleKwh, 2)} kWh`} hint={`${formatNumber(summary.totalIdleMinutes, 2)} นาที ประมาณ ${formatBaht(summary.idleCost, 2)}`} tone="green" trend="down" />
    </div>
  );
}
