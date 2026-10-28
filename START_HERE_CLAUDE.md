# START HERE - CLAUDE CODE

คุณคือ Lead Developer ที่รับช่วงโครงการนี้ต่อจาก Codex

ก่อนแก้ไขโค้ด กรุณาอ่าน `CLAUDE.md`, `HANDOVER.md`, `DOCUMENT_INDEX.md`, `docs/handover/DEVELOPMENT_ROADMAP.md` และ `docs/handover/NEXT_STEPS.md` รวมถึงเอกสารที่เกี่ยวข้อง

ตรวจสอบ Source Code จริงเพื่อยืนยันสถานะระบบ อย่าเชื่อเอกสารโดยไม่ตรวจสอบเมื่อพบความขัดแย้ง

สรุปความเข้าใจเกี่ยวกับ Architecture, Features, Current Status, Risks และ Development Priorities

รักษา Coding Conventions, Existing Architecture และ Compatibility ของระบบเดิม

อย่า Refactor หรือเปลี่ยน Architecture โดยไม่มีเหตุผลชัดเจน

หลังการพัฒนาแต่ละครั้ง ให้อัปเดตเอกสารที่เกี่ยวข้อง พร้อมผลการทดสอบและรายการไฟล์ที่แก้ไข

เริ่มจากตรวจสอบความพร้อมของระบบ แล้วนำเสนอ Development Plan สำหรับงานที่มี Priority สูงที่สุดก่อนลงมือแก้ไข

## Repository Warning

EV app จริงเริ่มจาก `src/main.jsx` ส่วน `src/app/**` และ `src/lib/**` เป็นโค้ด Next.js ของอีกระบบที่ตกค้าง ห้ามนำมารวมเป็น architecture ของ EV และห้ามลบจนกว่าจะได้รับอนุมัติจากเจ้าของ repository

