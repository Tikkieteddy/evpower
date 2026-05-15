# EV Charge Daily Calculator

เว็บแอป Responsive สำหรับบันทึกการเดินทางรายวันและคำนวณค่าชาร์จไฟรถ EV ทั้งรายวัน รายสัปดาห์ รายเดือน วิเคราะห์ตามเส้นทาง และประมาณการเดือนถัดไป

## Features

- Daily Log เพิ่ม แก้ไข ลบ รายการย้อนหลัง
- บันทึกวันที่ ชื่อเส้นทาง ระยะทาง สถานะการชาร์จ จำนวนเงิน kWh และหมายเหตุ
- บันทึกเวลาจอดรอเปิดแอร์ และประเมิน kWh/ค่าไฟที่ใช้ตอนจอดรอ
- เลือกเครื่องชาร์จจากรายการ PTT, EleXa, ReverSharger, PEA VOLTA, EVolt, MEA, Spark, EA Anywhere, TOCharge, iGreen+ หรือระบุเอง
- เก็บข้อมูลด้วย Local Storage ไม่ต้องใช้ Backend
- Dashboard รายสัปดาห์และรายเดือน
- Route Analysis แยกตามชื่อเส้นทาง
- Charging Analysis วิเคราะห์ค่าเฉลี่ยบาท/kWh และบาท/ครั้งของแต่ละเครื่องชาร์จ
- Forecast เดือนถัดไปจากค่าเฉลี่ยของเส้นทางและจำนวนครั้งที่คาดว่าจะวิ่ง
- กราฟด้วย Recharts: ค่าใช้จ่ายรายวัน ระยะทางรายวัน และสัดส่วนค่าใช้จ่ายตามเส้นทาง
- มีข้อมูลตัวอย่าง 7 วันเมื่อเปิดใช้งานครั้งแรก

## Tech Stack

- React
- Vite
- Tailwind CSS
- Recharts
- Local Storage

## Project Structure

```text
src/
  App.jsx
  main.jsx
  index.css
  components/
    Charts.jsx
    DailyLog.jsx
    DashboardCards.jsx
    DataTable.jsx
    Forecast.jsx
    MetricCard.jsx
    MonthlyDashboard.jsx
    RouteAnalysis.jsx
    WeeklyDashboard.jsx
  data/
    sampleData.js
  utils/
    calculations.js
```

## Install

```bash
npm install
```

## Run Development Server

```bash
npm run dev
```

เปิดเว็บที่ `http://127.0.0.1:5173`

## Build

```bash
npm run build
```

ผลลัพธ์ production build จะอยู่ในโฟลเดอร์ `dist/`

## Deploy on Vercel

นำ repository นี้ไป Import ใน Vercel ได้โดยตรง Vercel จะตรวจพบ Vite project และใช้คำสั่ง:

- Build Command: `npm run build`
- Output Directory: `dist`

ไม่ต้องตั้งค่า Environment Variables เพราะข้อมูลถูกเก็บใน Local Storage ของ browser

## Calculation Rules

- บาทต่อกิโลเมตร = เงินค่าชาร์จรวม ÷ ระยะทางรวม
- kWh ต่อกิโลเมตร = kWh รวม ÷ ระยะทางรวม
- ค่าใช้จ่ายเฉลี่ยต่อวัน = เงินค่าชาร์จรวม ÷ จำนวนวันที่มีข้อมูล
- ระยะทางเฉลี่ยต่อวัน = ระยะทางรวม ÷ จำนวนวันที่มีข้อมูล
- ค่าไฟเฉลี่ยต่อ kWh = เงินค่าชาร์จรวม ÷ kWh รวม
- kWh จอดรอ = จำนวนนาทีจอดรอ ÷ 60 × อัตราใช้ไฟตอนจอด (kWh/ชม.)
- อัตราใช้ไฟตอนจอดแบบ Auto = ค่าเฉลี่ยถ่วงน้ำหนักจากประวัติการจอดรอเดิม ถ้ายังไม่มีข้อมูลใช้ 1.2 kWh/ชม.
- ค่าไฟจอดรอโดยประมาณ = kWh จอดรอ × ค่าไฟเฉลี่ยต่อ kWh
- บาทต่อ kWh ของเครื่องชาร์จ = เงินค่าชาร์จของเครื่องนั้น ÷ kWh ที่ชาร์จจากเครื่องนั้น
- Forecast เดือนถัดไป = ค่าเฉลี่ยของเส้นทาง × จำนวนครั้งที่คาดว่าจะวิ่ง
