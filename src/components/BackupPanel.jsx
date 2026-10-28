// tikkieteddielab: export (JSON/CSV) and import (JSON with preview) of trips and route presets.
import { useState } from "react";
import { DatabaseBackup, FileDown, FileSpreadsheet, FileUp, X } from "lucide-react";
import { backupFilename, createBackup, parseBackup, planImport, tripsToCsv } from "../utils/backup.js";
import { downloadFile } from "../utils/download.js";
import { tikkieTeddieVersion } from "../utils/licenseGuard.js";

const utf8Bom = String.fromCharCode(0xfeff);

const buttonClass =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[var(--blonde-line)] px-3 text-sm font-semibold text-[var(--marine-ink)] hover:bg-[var(--blonde-soft)]";

const dateRange = (trips) => {
  if (!trips.length) return "-";
  const dates = trips.map((t) => t.date).sort();
  return dates[0] === dates.at(-1) ? dates[0] : `${dates[0]} ถึง ${dates.at(-1)}`;
};

export default function BackupPanel({ trips, routePresets, onImport }) {
  const [parsed, setParsed] = useState(null);
  const [fileName, setFileName] = useState("");
  const [mode, setMode] = useState("merge");
  const [onConflict, setOnConflict] = useState("keep");
  const [message, setMessage] = useState("");

  const exportJson = () => {
    const now = new Date();
    const backup = createBackup({ trips, routePresets, appVersion: tikkieTeddieVersion, now });
    downloadFile(backupFilename(now, "json"), JSON.stringify(backup, null, 2));
    setMessage(`Export แล้ว: ${trips.length} รายการ, ${routePresets.length} เส้นทาง (ไม่รวมผู้ใช้และรหัสผ่าน)`);
  };

  const exportCsv = () => {
    // BOM so Excel opens Thai text as UTF-8.
    downloadFile(backupFilename(new Date(), "csv"), utf8Bom + tripsToCsv(trips), "text/csv;charset=utf-8");
    setMessage(`Export CSV แล้ว: ${trips.length} รายการ (สำหรับเปิดใน Excel — ใช้ไฟล์ JSON สำหรับกู้คืน)`);
  };

  const chooseFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setFileName(file.name);
    setMode("merge");
    setOnConflict("keep");
    setMessage("");
    setParsed(parseBackup(await file.text()));
  };

  const cancel = () => {
    setParsed(null);
    setFileName("");
  };

  const incoming = parsed?.ok ? { trips: parsed.trips.valid, routePresets: parsed.routePresets.valid } : null;
  const plan = incoming ? planImport({ trips, routePresets }, incoming, { mode, onConflict }) : null;

  const confirmImport = () => {
    if (mode === "replace") {
      if (!confirm(`แทนที่ข้อมูลทั้งหมดด้วยไฟล์นี้ใช่ไหม? ระบบจะดาวน์โหลด backup ของข้อมูลปัจจุบันให้ก่อน`)) return;
      const now = new Date();
      downloadFile(
        backupFilename(now, "json").replace("backup-", "backup-before-import-"),
        JSON.stringify(createBackup({ trips, routePresets, appVersion: tikkieTeddieVersion, now }), null, 2),
      );
    }
    if (!onImport(plan)) {
      setMessage("นำเข้าไม่สำเร็จ: เก็บสำเนาข้อมูลปัจจุบันไม่ได้ จึงยกเลิกเพื่อป้องกันข้อมูลหาย");
      return;
    }
    const s = plan.summary;
    setMessage(`นำเข้าแล้ว: เพิ่ม ${s.added}, อัปเดต ${s.updated}, เหมือนเดิม ${s.unchanged}${mode === "replace" ? `, ลบ ${s.removed}` : ""}, เส้นทางใหม่ ${s.presetsAdded}`);
    cancel();
  };

  return (
    <section className="rounded-lg border border-[var(--blonde-line)] bg-white p-4 shadow-sm">
      <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-[var(--marine-ink)]">
            <DatabaseBackup size={18} /> สำรอง / กู้คืนข้อมูล
          </h2>
          <p className="text-sm text-[var(--marine-muted)]">ข้อมูลอยู่ใน browser เครื่องนี้เท่านั้น ควร Export เก็บไว้เป็นระยะ</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={exportJson} className={buttonClass}>
            <FileDown size={16} /> Export JSON
          </button>
          <button type="button" onClick={exportCsv} className={buttonClass}>
            <FileSpreadsheet size={16} /> Export CSV
          </button>
          <label className={`${buttonClass} cursor-pointer`}>
            <FileUp size={16} /> Import JSON
            <input type="file" accept="application/json,.json" className="sr-only" onChange={chooseFile} />
          </label>
        </div>
      </div>

      {message ? <p className="mt-3 rounded-lg bg-[var(--sea-soft)] p-3 text-sm font-semibold text-[var(--marine-ink)]">{message}</p> : null}

      {parsed && !parsed.ok ? (
        <div className="mt-3 flex items-start justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900">
          <p>
            <strong>{fileName}:</strong> {parsed.error}
          </p>
          <button type="button" onClick={cancel} title="ปิด" className="text-red-700">
            <X size={16} />
          </button>
        </div>
      ) : null}

      {plan ? (
        <div className="mt-4 grid gap-4 rounded-lg border border-[var(--sea-mist)] bg-[var(--sea-soft)]/40 p-4 text-sm">
          <div>
            <p className="font-bold text-[var(--marine-ink)]">ตรวจสอบก่อนนำเข้า: {fileName}</p>
            <p className="text-[var(--marine-muted)]">
              {parsed.meta.exportedAt ? `Export เมื่อ ${parsed.meta.exportedAt.slice(0, 10)} · ` : ""}
              {incoming.trips.length} รายการ ({dateRange(incoming.trips)}) · {incoming.routePresets.length} เส้นทาง
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              ["รายการใหม่", plan.summary.added],
              [mode === "replace" ? "จะถูกลบ" : "ซ้ำ (ต่างจากเดิม)", mode === "replace" ? plan.summary.removed : plan.summary.conflicts],
              [mode === "replace" ? "มีอยู่แล้ว (คงไว้)" : "ซ้ำ (เหมือนเดิม)", plan.summary.unchanged],
              ["ผิดรูปแบบ (ข้าม)", parsed.trips.invalid.length + parsed.routePresets.invalid.length],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg bg-white p-3 text-center">
                <p className="text-xl font-black text-[var(--marine-blue)]">{value}</p>
                <p className="text-xs font-semibold text-[var(--marine-muted)]">{label}</p>
              </div>
            ))}
          </div>

          {parsed.trips.invalid.length ? (
            <ul className="list-disc pl-5 text-xs text-red-800">
              {parsed.trips.invalid.slice(0, 5).map((row) => (
                <li key={row.index}>
                  แถวที่ {row.index + 1}: {row.errors.join(", ")}
                </li>
              ))}
              {parsed.trips.invalid.length > 5 ? <li>และอีก {parsed.trips.invalid.length - 5} แถว</li> : null}
            </ul>
          ) : null}

          <fieldset className="grid gap-2">
            <legend className="font-bold text-[var(--marine-ink)]">วิธีนำเข้า</legend>
            <label className="flex items-start gap-2">
              <input type="radio" name="import-mode" checked={mode === "merge"} onChange={() => setMode("merge")} />
              <span><strong>รวมกับข้อมูลเดิม</strong> (แนะนำ) — เพิ่มเฉพาะรายการใหม่</span>
            </label>
            <label className="flex items-start gap-2">
              <input type="radio" name="import-mode" checked={mode === "replace"} onChange={() => setMode("replace")} />
              <span><strong>แทนที่ทั้งหมด</strong> — ข้อมูลปัจจุบันจะถูกแทนด้วยไฟล์นี้ (ดาวน์โหลด backup ให้อัตโนมัติก่อน)</span>
            </label>
          </fieldset>

          {mode === "merge" && plan.summary.conflicts > 0 ? (
            <fieldset className="grid gap-2">
              <legend className="font-bold text-[var(--marine-ink)]">รายการซ้ำที่ข้อมูลต่างกัน ({plan.summary.conflicts})</legend>
              <label className="flex items-center gap-2">
                <input type="radio" name="import-conflict" checked={onConflict === "keep"} onChange={() => setOnConflict("keep")} />
                เก็บของเดิมในเครื่อง
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name="import-conflict" checked={onConflict === "useFile"} onChange={() => setOnConflict("useFile")} />
                ใช้ข้อมูลจากไฟล์
              </label>
            </fieldset>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={confirmImport}
              disabled={!incoming.trips.length && !incoming.routePresets.length}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[var(--marine-blue)] px-4 text-sm font-bold text-white hover:brightness-95"
            >
              <FileUp size={16} /> ยืนยันนำเข้า
            </button>
            <button type="button" onClick={cancel} className={buttonClass}>
              ยกเลิก
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
