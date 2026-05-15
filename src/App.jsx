// tikkieteddielab: EV power dashboard application shell.
import { useEffect, useMemo, useState } from "react";
import { BatteryCharging, CalendarDays, ChartNoAxesCombined, Map, PlugZap, Route, TrendingUp } from "lucide-react";
import ChargingAnalysis from "./components/ChargingAnalysis.jsx";
import DailyLog from "./components/DailyLog.jsx";
import Forecast from "./components/Forecast.jsx";
import LicenseLock from "./components/LicenseLock.jsx";
import MonthlyDashboard from "./components/MonthlyDashboard.jsx";
import RouteAnalysis from "./components/RouteAnalysis.jsx";
import WeeklyDashboard from "./components/WeeklyDashboard.jsx";
import DashboardCards from "./components/DashboardCards.jsx";
import Charts from "./components/Charts.jsx";
import { sampleTrips } from "./data/sampleData.js";
import { appBrandPalette, paletteAuditSummary } from "./data/brandAudit.js";
import { summarizeTrips } from "./utils/calculations.js";
import { tikkieTeddieFooter, verifyTikkieTeddieLicense } from "./utils/licenseGuard.js";

const storageKey = "ev-charge-daily-log-v1";

const tabs = [
  { id: "daily", label: "Daily Log", icon: CalendarDays },
  { id: "weekly", label: "Weekly Dashboard", icon: ChartNoAxesCombined },
  { id: "monthly", label: "Monthly Dashboard", icon: TrendingUp },
  { id: "routes", label: "Route Analysis", icon: Route },
  { id: "charging", label: "Charging Analysis", icon: PlugZap },
  { id: "forecast", label: "Forecast", icon: Map },
];

function loadTrips() {
  try {
    const saved = localStorage.getItem(storageKey);
    return saved ? JSON.parse(saved) : sampleTrips;
  } catch {
    return sampleTrips;
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState("daily");
  const [trips, setTrips] = useState(loadTrips);
  const summary = useMemo(() => summarizeTrips(trips), [trips]);
  const licenseStatus = useMemo(() => verifyTikkieTeddieLicense(), []);

  if (!licenseStatus.ok) {
    return <LicenseLock status={licenseStatus} />;
  }

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(trips));
  }, [trips]);

  const saveTrip = (trip) => {
    setTrips((current) => {
      const exists = current.some((item) => item.id === trip.id);
      return exists ? current.map((item) => (item.id === trip.id ? trip : item)) : [...current, trip];
    });
  };

  const deleteTrip = (id) => {
    if (confirm("ลบรายการนี้ใช่ไหม?")) {
      setTrips((current) => current.filter((trip) => trip.id !== id));
    }
  };

  const resetSample = () => {
    if (confirm("โหลดข้อมูลตัวอย่าง 7 วันและแทนที่ข้อมูลปัจจุบันใช่ไหม?")) {
      setTrips(sampleTrips);
    }
  };

  const renderTab = () => {
    if (activeTab === "daily") {
      return <DailyLog trips={trips} onSave={saveTrip} onDelete={deleteTrip} onResetSample={resetSample} />;
    }
    if (activeTab === "weekly") return <WeeklyDashboard trips={trips} />;
    if (activeTab === "monthly") return <MonthlyDashboard trips={trips} />;
    if (activeTab === "routes") return <RouteAnalysis trips={trips} />;
    if (activeTab === "charging") return <ChargingAnalysis trips={trips} />;
    return <Forecast trips={trips} />;
  };

  return (
    <div className="min-h-screen bg-[var(--blonde-wash)] text-[var(--marine-ink)]">
      <header className="sticky top-0 z-20 border-b border-[var(--blonde-line)] bg-white/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-lg bg-gradient-to-br from-[var(--marine-blue)] to-[var(--sea-mist)] text-white shadow-sm">
              <BatteryCharging size={24} />
            </div>
            <div>
              <h1 className="text-lg font-black text-[var(--marine-ink)] sm:text-xl">EV Charge Daily Calculator</h1>
              <p className="text-sm text-slate-500">คำนวณค่าชาร์จไฟรถ EV รายวัน รายสัปดาห์ รายเดือน และประมาณการล่วงหน้า</p>
            </div>
          </div>

          <nav className="flex gap-2 overflow-x-auto pb-1 lg:pb-0">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-bold transition ${
                    active ? "bg-[var(--marine-blue)] text-white shadow-sm" : "border border-[var(--blonde-line)] bg-white text-[var(--marine-muted)] hover:bg-[var(--blonde-soft)]"
                  }`}
                >
                  <Icon size={16} /> {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-7xl gap-5 px-4 py-5">
        <section className="rounded-lg border border-[var(--blonde-line)] bg-white p-4 shadow-sm">
          <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-[var(--marine-blue)]">Modern clean dashboard</p>
              <h2 className="mt-2 text-2xl font-black text-[var(--marine-ink)] sm:text-3xl">ภาพรวมค่าใช้จ่ายและพลังงานเดินทางประจำวัน</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                ข้อมูลถูกบันทึกใน Local Storage บนเครื่องนี้ สามารถเพิ่ม แก้ไข ลบรายการย้อนหลัง และดูกราฟได้ทันทีโดยไม่ต้องใช้ Backend
              </p>
              <p className="mt-2 max-w-3xl text-xs leading-5 text-[var(--marine-muted)]">
                Palette audit: {Object.values(appBrandPalette).join(" / ")}. {paletteAuditSummary.scope}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center sm:min-w-96">
              <div className="rounded-lg bg-[var(--sea-soft)] p-3">
                <p className="text-xl font-black text-[var(--marine-blue)]">{summary.travelDays}</p>
                <p className="text-xs font-semibold text-slate-500">วันเดินทาง</p>
              </div>
              <div className="rounded-lg bg-[var(--blonde-soft)] p-3">
                <p className="text-xl font-black text-[var(--marine-blue)]">{summary.chargeDays}</p>
                <p className="text-xs font-semibold text-slate-500">วันชาร์จ</p>
              </div>
              <div className="rounded-lg bg-[var(--sea-soft)] p-3">
                <p className="text-xl font-black text-[var(--marine-blue)]">{trips.length}</p>
                <p className="text-xs font-semibold text-slate-500">รายการ</p>
              </div>
            </div>
          </div>
        </section>

        {activeTab === "daily" ? (
          <>
            <DashboardCards summary={summary} />
            <Charts trips={trips} />
          </>
        ) : null}

        {renderTab()}
      </main>
      <footer className="border-t border-[var(--blonde-line)] bg-white/80 px-4 py-5 text-center text-sm font-semibold text-[var(--marine-muted)]">
        {tikkieTeddieFooter}
      </footer>
    </div>
  );
}
