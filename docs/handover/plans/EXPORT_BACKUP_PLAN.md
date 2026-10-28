# แผนระบบ Export / Import / Backup ข้อมูล (ข้อเสนอ — รออนุมัติ)

- **สถานะ:** ขั้นที่ 1 DONE (2026-10-28, branch `test/vitest-baseline`) · ขั้นที่ 2–3 PROPOSED รออนุมัติ
- **วันที่:** 2026-10-28 · ผู้เสนอ: Claude Code
- **Roadmap:** P1 "Backup, Export, Import, and Migration"
- **หลักการ:** ทำงานใน browser ล้วน ไม่มี cloud ไม่มี server ไม่เปลี่ยน storage key/schema เดิม และไม่ลบข้อมูลผู้ใช้

---

## 1. ปัญหาที่ต้องแก้

| ปัญหา | ผลกระทบ | หลักฐาน |
| --- | --- | --- |
| ไม่มีวิธีสำรองข้อมูล | ล้าง site data / เปลี่ยนเครื่อง / เปลี่ยน browser = ข้อมูลหายทั้งหมด | ไม่มีโค้ด export ใน `src/` |
| JSON เสียถูกเขียนทับ | `loadTrips()` คืน sample data แล้ว `useEffect` เขียนทับ key เดิมทันที | `src/App.jsx` `loadTrips` + `useEffect` |
| JSON ที่ไม่ใช่ array (เช่น `null`) | แอป error ตอน render | `loadTrips` ไม่ตรวจ `Array.isArray` |
| ปุ่ม "โหลดข้อมูลตัวอย่าง" | แทนที่ข้อมูลจริงทั้งหมดหลัง confirm โดยไม่มี backup | `resetSample` ใน `App.jsx` |

## 2. ขอบเขตที่เสนอ (แบ่ง 3 ขั้น ทำทีละขั้นได้)

### ขั้นที่ 1 — ป้องกันข้อมูลหาย ✅ เสร็จแล้ว 2026-10-28

> ทำตามแผนพร้อมข้อปรับ: key สำรองใช้ hash ของข้อมูล (`:corrupt-<hash>`) แทน timestamp เพื่อไม่ให้ React StrictMode สร้างสำเนาซ้ำ; ถ้าเก็บสำเนาไม่สำเร็จ แอปจะ**หยุดบันทึก**จนกว่าผู้ใช้กด "ดาวน์โหลดแล้ว ใช้งานต่อ"; ก่อนโหลดข้อมูลตัวอย่างใช้ key `:before-sample-<timestamp>` (ไม่ดาวน์โหลดอัตโนมัติ) และยกเลิกถ้าเก็บสำเนาไม่ได้; เพิ่มแถบเตือนเมื่อบันทึกลง browser ไม่สำเร็จ. Test: `src/utils/tripStorage.test.js` (13 tests) + ทดสอบใน browser 4 กรณี


1. ย้าย `loadTrips` ไปเป็น `src/utils/tripStorage.js` (ใช้ key เดิม `ev-charge-daily-log-v1`)
2. ถ้าอ่านแล้ว JSON เสีย หรือไม่ใช่ array:
   - คัดลอกค่าดิบไปเก็บที่ `ev-charge-daily-log-v1:corrupt-<timestamp>` **ก่อน** เขียนอะไรทับ
   - แสดงแถบเตือนสีแดงพร้อมปุ่ม "ดาวน์โหลดข้อมูลเดิม (raw)"
3. ก่อน "โหลดข้อมูลตัวอย่าง" ให้ดาวน์โหลด backup อัตโนมัติ (หรือเก็บสำเนาไว้ใน key `...:before-sample`)
4. Test: JSON เสีย, `null`, object, array ว่าง, ข้อมูลปกติ — ยืนยันว่าค่าเดิมไม่ถูกทับ

### ขั้นที่ 2 — Export (สำรองข้อมูลเป็นไฟล์)

ปุ่ม **"Export ข้อมูล"** ในแท็บ Daily Log → ดาวน์โหลดไฟล์ `evpower-backup-YYYY-MM-DD.json`

```json
{
  "format": "evpower-backup",
  "schemaVersion": 1,
  "appVersion": "V.1.0.0",
  "exportedAt": "2026-10-28T12:00:00+07:00",
  "data": {
    "trips": [ /* Trip[] ตาม DATABASE_DOCUMENTATION.md */ ],
    "routePresets": [ /* RoutePreset[] */ ]
  },
  "counts": { "trips": 0, "routePresets": 0 }
}
```

- **ไม่ export รายชื่อผู้ใช้และรหัสผ่าน** (users-v1) เพราะเป็น plaintext — ไฟล์ backup อาจถูกส่งต่อ
- ไม่ export session
- (ทางเลือก) Export CSV ของ trips สำหรับเปิดใน Excel — แยกเป็นปุ่มที่สอง

### ขั้นที่ 3 — Import (กู้คืนจากไฟล์)

1. เลือกไฟล์ `.json` → ตรวจ `format`, `schemaVersion`, ชนิดข้อมูลทุกฟิลด์ (วันที่ `YYYY-MM-DD`, ตัวเลข ≥ 0)
2. **หน้า Preview** ก่อนนำเข้า: จำนวนรายการ, ช่วงวันที่, จำนวนที่ซ้ำ (id เดียวกัน), แถวที่ผิดรูปแบบ
3. ผู้ใช้เลือกโหมด:
   - **รวมข้อมูล (Merge)** — ค่าเริ่มต้น: เพิ่มเฉพาะ id ใหม่ ถ้า id ซ้ำให้เลือก "เก็บของเดิม" / "ใช้ของในไฟล์"
   - **แทนที่ทั้งหมด (Replace)** — ต้อง confirm และ **export backup ของข้อมูลปัจจุบันอัตโนมัติก่อน**
4. Route presets ใช้กฎเดียวกัน (ซ้ำดูจากชื่อ ไม่สนตัวพิมพ์เล็ก/ใหญ่)

## 3. ไฟล์ที่จะแก้ / เพิ่ม

| ไฟล์ | การเปลี่ยน |
| --- | --- |
| `src/utils/tripStorage.js` (ใหม่) | อ่าน/เขียน trips แบบปลอดภัย + กันการเขียนทับ |
| `src/utils/backup.js` (ใหม่) | สร้าง/ตรวจ/merge ไฟล์ backup (pure functions ทดสอบง่าย) |
| `src/components/BackupPanel.jsx` (ใหม่) | ปุ่ม Export/Import + Preview (ใช้ `DataTable`, CSS variables เดิม) |
| `src/App.jsx` | ใช้ `tripStorage`, แสดงแถบเตือน, ส่ง handler ให้ BackupPanel |
| `src/components/DailyLog.jsx` | วาง BackupPanel ใกล้ปุ่ม "โหลดข้อมูลตัวอย่าง" |
| `src/utils/*.test.js` | test ใหม่ทั้งหมดก่อนแก้ UI |
| เอกสาร | `DATABASE_DOCUMENTATION.md`, `FEATURE_INVENTORY.md`, `WIREFRAMES.md`, `project-status.json`, `CHANGELOG.md` |

**ไม่แตะ:** storage key/schema เดิม, `auth.js`, `licenseGuard.js`, `brandAudit.js`, brand tokens

## 4. ความเสี่ยงและการป้องกัน

| ความเสี่ยง | การป้องกัน |
| --- | --- |
| Import ทับข้อมูลจริงผิดพลาด | Merge เป็นค่าเริ่มต้น, Replace ต้อง confirm + auto-backup ก่อน |
| ไฟล์ปลอม/เสีย | ตรวจ schema ทุกฟิลด์ แสดงแถวที่ผิด ไม่นำเข้าจนกว่าผู้ใช้กดยืนยัน |
| Local Storage เต็ม (~5 MB) | ตรวจขนาดก่อนเขียน แจ้งเตือนแทนการล้มเหลวเงียบ (ปกติข้อมูล 1 ปี < 200 kB) |
| ข้อมูลรั่วผ่านไฟล์ backup | ไม่ใส่ users/password/session ในไฟล์ |
| Schema เปลี่ยนในอนาคต | มี `schemaVersion` + ฟังก์ชัน migrate ทีละเวอร์ชัน |

## 5. การทดสอบ

- Unit: round-trip export → import ได้ข้อมูลเท่าเดิม, merge/replace, id ซ้ำ, ไฟล์ผิดรูปแบบ, JSON เสีย, `null`
- Manual (in-app browser, ไม่ใช่ browser จริงของผู้ใช้): export → ล้างข้อมูลใน origin ทดสอบ → import → ตัวเลข dashboard ตรงเดิม; ทดสอบจอ 375 px
- Regression: `npm test`, `npm run lint`, `npm run build`, `npm run docs:validate`

## 6. คำถามที่ต้องการคำตอบจากเจ้าของ

1. อนุมัติให้เริ่ม **ขั้นที่ 1** (กันข้อมูลหาย) ได้เลยหรือไม่
2. Export เฉพาะ JSON พอ หรือต้องการ CSV สำหรับ Excel ด้วย
3. ยืนยันว่า **ไม่** export รายชื่อผู้ใช้/รหัสผ่าน
4. วางปุ่มในแท็บ Daily Log (เสนอ) หรือต้องการแท็บใหม่ "ข้อมูล / Backup"
