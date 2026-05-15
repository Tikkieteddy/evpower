// tikkieteddielab: daily trip and charging form.
import { useMemo, useState } from "react";
import { Edit3, Plus, RotateCcw, Trash2 } from "lucide-react";
import DataTable from "./DataTable.jsx";
import {
  chargerOptions,
  defaultIdleKwhPerHour,
  formatBaht,
  formatNumber,
  getAutoIdleKwhPerHour,
  sortTrips,
} from "../utils/calculations.js";

const blankForm = {
  date: new Date().toISOString().slice(0, 10),
  routeName: "",
  distanceKm: "",
  hasCharge: false,
  chargerName: chargerOptions[0],
  customChargerName: "",
  chargeCost: "",
  kwh: "",
  idleMinutes: "",
  idleKwhPerHour: defaultIdleKwhPerHour,
  idleRateMode: "auto",
  note: "",
};

export default function DailyLog({ trips, onSave, onDelete, onResetSample }) {
  const [form, setForm] = useState(blankForm);
  const [editingId, setEditingId] = useState(null);

  const sortedTrips = useMemo(() => sortTrips(trips).reverse(), [trips]);
  const autoIdleKwhPerHour = useMemo(() => getAutoIdleKwhPerHour(trips), [trips]);

  const updateField = (field, value) => {
    setForm((current) => {
      const next = { ...current, [field]: value };
      if (field === "hasCharge" && !value) {
        next.chargeCost = "";
        next.kwh = "";
        next.chargerName = chargerOptions[0];
        next.customChargerName = "";
      }
      if (field === "idleRateMode" && value === "auto") {
        next.idleKwhPerHour = autoIdleKwhPerHour;
      }
      if (field === "idleMinutes" && current.idleRateMode === "auto") {
        next.idleKwhPerHour = autoIdleKwhPerHour;
      }
      return next;
    });
  };

  const submit = (event) => {
    event.preventDefault();
    const payload = {
      id: editingId || crypto.randomUUID(),
      date: form.date,
      routeName: form.routeName.trim(),
      distanceKm: Number(form.distanceKm),
      hasCharge: form.hasCharge,
      chargerName: form.hasCharge
        ? form.chargerName === "other"
          ? form.customChargerName.trim() || "อื่นๆ"
          : form.chargerName
        : "",
      chargeCost: form.hasCharge ? Number(form.chargeCost) : 0,
      kwh: form.hasCharge ? Number(form.kwh) : 0,
      idleMinutes: Number(form.idleMinutes) || 0,
      idleKwhPerHour:
        form.idleRateMode === "auto" ? autoIdleKwhPerHour : Number(form.idleKwhPerHour) || defaultIdleKwhPerHour,
      idleRateMode: form.idleRateMode,
      note: form.note.trim(),
    };
    onSave(payload);
    setForm(blankForm);
    setEditingId(null);
  };

  const editTrip = (trip) => {
    setEditingId(trip.id);
    setForm({
      date: trip.date,
      routeName: trip.routeName,
      distanceKm: String(trip.distanceKm),
      hasCharge: trip.hasCharge,
      chargerName: chargerOptions.includes(trip.chargerName) ? trip.chargerName : trip.chargerName ? "other" : chargerOptions[0],
      customChargerName: chargerOptions.includes(trip.chargerName) ? "" : trip.chargerName || "",
      chargeCost: trip.chargeCost ? String(trip.chargeCost) : "",
      kwh: trip.kwh ? String(trip.kwh) : "",
      idleMinutes: trip.idleMinutes ? String(trip.idleMinutes) : "",
      idleKwhPerHour: trip.idleKwhPerHour || defaultIdleKwhPerHour,
      idleRateMode: trip.idleRateMode || "auto",
      note: trip.note || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const columns = [
    { key: "date", label: "วันที่" },
    { key: "routeName", label: "เส้นทาง" },
    { key: "distanceKm", label: "กม.", render: (row) => formatNumber(row.distanceKm, 1) },
    { key: "hasCharge", label: "ชาร์จ", render: (row) => (row.hasCharge ? "ใช่" : "ไม่") },
    { key: "chargerName", label: "เครื่องชาร์จ", render: (row) => row.chargerName || "-" },
    { key: "chargeCost", label: "บาท", render: (row) => formatBaht(row.chargeCost, 2) },
    { key: "kwh", label: "kWh", render: (row) => formatNumber(row.kwh, 1) },
    { key: "idleMinutes", label: "จอดรอ", render: (row) => `${formatNumber(row.idleMinutes, 0)} นาที` },
    { key: "idleKwh", label: "kWh จอดรอ", render: (row) => formatNumber(row.idleKwh, 2) },
    { key: "note", label: "หมายเหตุ", render: (row) => row.note || "-" },
    {
      key: "actions",
      label: "",
      render: (row) => (
        <div className="flex gap-2">
          <button
            className="grid h-9 w-9 place-items-center rounded-lg border border-[var(--blonde-line)] text-[var(--marine-blue)] hover:bg-[var(--sea-soft)]"
            onClick={() => editTrip(row)}
            title="แก้ไข"
            type="button"
          >
            <Edit3 size={16} />
          </button>
          <button
            className="grid h-9 w-9 place-items-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
            onClick={() => onDelete(row.id)}
            title="ลบ"
            type="button"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="grid gap-5">
      <form onSubmit={submit} className="rounded-lg border border-[var(--blonde-line)] bg-white p-4 shadow-sm">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-bold text-[var(--marine-ink)]">{editingId ? "แก้ไขรายการเดินทาง" : "บันทึกรายวัน"}</h2>
            <p className="text-sm text-[var(--marine-muted)]">กรอกระยะทางทุกวัน และเพิ่มข้อมูลชาร์จเฉพาะวันที่มีการชาร์จ</p>
          </div>
          <button
            type="button"
            onClick={onResetSample}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[var(--blonde-line)] px-3 font-semibold text-[var(--marine-ink)] hover:bg-[var(--blonde-soft)]"
          >
            <RotateCcw size={16} /> โหลดข้อมูลตัวอย่าง
          </button>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="grid gap-1 text-sm font-semibold text-[var(--marine-ink)]">
            วันที่
            <input className="input" type="date" value={form.date} onChange={(e) => updateField("date", e.target.value)} required />
          </label>
          <label className="grid gap-1 text-sm font-semibold text-[var(--marine-ink)]">
            ชื่อเส้นทาง
            <input className="input" value={form.routeName} onChange={(e) => updateField("routeName", e.target.value)} placeholder="เช่น บ้าน - ออฟฟิศ" required />
          </label>
          <label className="grid gap-1 text-sm font-semibold text-[var(--marine-ink)]">
            ระยะทางที่วิ่ง (กม.)
            <input className="input" type="number" min="0" step="0.1" value={form.distanceKm} onChange={(e) => updateField("distanceKm", e.target.value)} required />
          </label>
          <label className="mt-6 inline-flex min-h-11 items-center gap-3 rounded-lg border border-[var(--blonde-line)] bg-[var(--blonde-soft)] px-3 font-semibold text-[var(--marine-ink)]">
            <input type="checkbox" checked={form.hasCharge} onChange={(e) => updateField("hasCharge", e.target.checked)} />
            มีการชาร์จไฟ
          </label>
          <label className="grid gap-1 text-sm font-semibold text-[var(--marine-ink)]">
            จำนวนเงินที่ชาร์จ (บาท)
            <input className="input" type="number" min="0" step="0.01" value={form.chargeCost} onChange={(e) => updateField("chargeCost", e.target.value)} disabled={!form.hasCharge} required={form.hasCharge} />
          </label>
          <label className="grid gap-1 text-sm font-semibold text-[var(--marine-ink)]">
            เครื่องที่ชาร์จด้วย
            <select className="input" value={form.chargerName} onChange={(e) => updateField("chargerName", e.target.value)} disabled={!form.hasCharge} required={form.hasCharge}>
              {chargerOptions.map((charger) => (
                <option key={charger} value={charger}>{charger}</option>
              ))}
              <option value="other">อื่นๆ ระบุ</option>
            </select>
          </label>
          {form.chargerName === "other" ? (
            <label className="grid gap-1 text-sm font-semibold text-[var(--marine-ink)]">
              ระบุเครื่องชาร์จ
              <input className="input" value={form.customChargerName} onChange={(e) => updateField("customChargerName", e.target.value)} disabled={!form.hasCharge} required={form.hasCharge && form.chargerName === "other"} />
            </label>
          ) : null}
          <label className="grid gap-1 text-sm font-semibold text-[var(--marine-ink)]">
            จำนวนไฟที่ได้ (kWh)
            <input className="input" type="number" min="0" step="0.1" value={form.kwh} onChange={(e) => updateField("kwh", e.target.value)} disabled={!form.hasCharge} required={form.hasCharge} />
          </label>
          <label className="grid gap-1 text-sm font-semibold text-[var(--marine-ink)]">
            จอดรอเปิดแอร์ (นาที)
            <input className="input" type="number" min="0" step="1" value={form.idleMinutes} onChange={(e) => updateField("idleMinutes", e.target.value)} placeholder="0" />
          </label>
          <label className="grid gap-1 text-sm font-semibold text-[var(--marine-ink)]">
            อัตราใช้ไฟตอนจอด (kWh/ชม.)
            <div className="grid gap-2">
              <label className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[var(--blonde-line)] bg-[var(--blonde-soft)] px-3 text-sm font-bold text-[var(--marine-ink)]">
                <input
                  type="checkbox"
                  checked={form.idleRateMode === "manual"}
                  onChange={(e) => updateField("idleRateMode", e.target.checked ? "manual" : "auto")}
                />
                แก้ไขเอง
              </label>
              <input
                className="input"
                type="number"
                min="0"
                step="0.1"
                value={form.idleRateMode === "auto" ? formatNumber(autoIdleKwhPerHour, 2) : form.idleKwhPerHour}
                onChange={(e) => updateField("idleKwhPerHour", e.target.value)}
                disabled={form.idleRateMode === "auto"}
              />
            </div>
          </label>
          <label className="grid gap-1 text-sm font-semibold text-[var(--marine-ink)] md:col-span-2">
            หมายเหตุ
            <input className="input" value={form.note} onChange={(e) => updateField("note", e.target.value)} placeholder="รายละเอียดเพิ่มเติม" />
          </label>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[var(--marine-blue)] px-4 font-bold text-white shadow-sm hover:brightness-95" type="submit">
            <Plus size={18} /> {editingId ? "บันทึกการแก้ไข" : "เพิ่มรายการ"}
          </button>
          {editingId ? (
            <button
              type="button"
              className="min-h-11 rounded-lg border border-[var(--blonde-line)] px-4 font-bold text-[var(--marine-ink)] hover:bg-[var(--blonde-soft)]"
              onClick={() => {
                setEditingId(null);
                setForm(blankForm);
              }}
            >
              ยกเลิก
            </button>
          ) : null}
        </div>
      </form>

      <DataTable columns={columns} rows={sortedTrips} />
    </div>
  );
}
