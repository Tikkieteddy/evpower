// tikkieteddielab: warnings for unreadable or unsaved browser data.
import { AlertTriangle, Download, X } from "lucide-react";

const reasonText = {
  "invalid-json": "ข้อมูลไม่อยู่ในรูปแบบ JSON ที่อ่านได้",
  "not-an-array": "ข้อมูลไม่ใช่รายการบันทึกการเดินทาง",
};

const downloadText = (filename, text) => {
  const url = window.URL.createObjectURL(new window.Blob([text], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(url);
};

const buttonClass =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-semibold";

export default function StorageNotice({ recovery, persistBlocked, saveFailed, onDismiss, onContinue }) {
  if (!recovery && !saveFailed) return null;

  return (
    <section role="alert" className="grid gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900 shadow-sm">
      {recovery ? (
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="flex gap-3">
            <AlertTriangle className="mt-0.5 shrink-0" size={20} />
            <div className="grid gap-1">
              <p className="font-bold">พบข้อมูลบันทึกการเดินทางที่อ่านไม่ได้ ({reasonText[recovery.reason] || recovery.reason})</p>
              {recovery.backupSaved ? (
                <p>
                  ระบบเก็บสำเนาข้อมูลเดิมไว้ในเครื่องแล้วที่ <code className="break-all">{recovery.backupKey}</code> และแสดงข้อมูลตัวอย่างแทน
                  แนะนำให้ดาวน์โหลดข้อมูลเดิมเก็บไว้
                </p>
              ) : (
                <p>
                  ระบบเก็บสำเนาไม่สำเร็จ จึง<strong>หยุดบันทึกข้อมูลชั่วคราว</strong>เพื่อไม่ให้ข้อมูลเดิมถูกเขียนทับ
                  กรุณาดาวน์โหลดข้อมูลเดิมก่อน แล้วกด “ดาวน์โหลดแล้ว ใช้งานต่อ”
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => downloadText(`evpower-unreadable-data-${new Date().toISOString().slice(0, 10)}.json`, recovery.raw)}
              className={`${buttonClass} border-red-300 bg-white hover:bg-red-100`}
            >
              <Download size={16} /> ดาวน์โหลดข้อมูลเดิม
            </button>
            {persistBlocked ? (
              <button type="button" onClick={onContinue} className={`${buttonClass} border-red-300 bg-red-700 text-white hover:bg-red-800`}>
                ดาวน์โหลดแล้ว ใช้งานต่อ
              </button>
            ) : (
              <button type="button" onClick={onDismiss} className={`${buttonClass} border-red-200 hover:bg-red-100`} title="ปิด">
                <X size={16} /> ปิด
              </button>
            )}
          </div>
        </div>
      ) : null}
      {saveFailed ? (
        <p className="flex gap-3 font-semibold">
          <AlertTriangle className="shrink-0" size={20} />
          บันทึกข้อมูลลง browser ไม่สำเร็จ (พื้นที่เก็บข้อมูลอาจเต็มหรือถูกปิดไว้) รายการล่าสุดอาจหายเมื่อปิดหน้าเว็บ
        </p>
      ) : null}
    </section>
  );
}
