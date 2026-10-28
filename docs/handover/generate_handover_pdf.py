from pathlib import Path
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    KeepTogether,
    NextPageTemplate,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)
from reportlab.platypus.tableofcontents import TableOfContents

ROOT = Path(__file__).resolve().parent
OUTPUT = ROOT / "HANDOVER_SUMMARY.pdf"
FONT = Path(r"C:\Windows\Fonts\tahoma.ttf")
FONT_BOLD = Path(r"C:\Windows\Fonts\tahomabd.ttf")

pdfmetrics.registerFont(TTFont("Thai", str(FONT)))
pdfmetrics.registerFont(TTFont("ThaiBold", str(FONT_BOLD)))

BLUE = colors.HexColor("#0D6F8F")
SEA = colors.HexColor("#E3F3F5")
INK = colors.HexColor("#25353C")
MUTED = colors.HexColor("#617077")
LINE = colors.HexColor("#D7D2C8")
SOFT = colors.HexColor("#ECE9E1")
WASH = colors.HexColor("#F4F2EC")
RED = colors.HexColor("#B42318")
GREEN = colors.HexColor("#21725E")

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name="ThaiBody", fontName="Thai", fontSize=9.2, leading=14, textColor=INK, spaceAfter=6))
styles.add(ParagraphStyle(name="ThaiSmall", fontName="Thai", fontSize=7.8, leading=11, textColor=MUTED))
styles.add(ParagraphStyle(name="ThaiH1", fontName="ThaiBold", fontSize=21, leading=27, textColor=INK, spaceBefore=3, spaceAfter=10))
styles.add(ParagraphStyle(name="ThaiH2", fontName="ThaiBold", fontSize=15, leading=20, textColor=BLUE, spaceBefore=8, spaceAfter=8))
styles.add(ParagraphStyle(name="ThaiH3", fontName="ThaiBold", fontSize=11, leading=15, textColor=INK, spaceBefore=6, spaceAfter=5))
styles.add(ParagraphStyle(name="CoverTitle", fontName="ThaiBold", fontSize=28, leading=34, textColor=colors.white, alignment=TA_LEFT))
styles.add(ParagraphStyle(name="CoverSub", fontName="Thai", fontSize=12, leading=18, textColor=colors.HexColor("#DDEEF2")))
styles.add(ParagraphStyle(name="Cell", fontName="Thai", fontSize=7.5, leading=10, textColor=INK))
styles.add(ParagraphStyle(name="CellBold", fontName="ThaiBold", fontSize=7.5, leading=10, textColor=INK))
styles.add(ParagraphStyle(name="TOCHeading", fontName="ThaiBold", fontSize=11, leading=15, textColor=INK))


def P(text, style="ThaiBody"):
    return Paragraph(text, styles[style])


def cell(text, bold=False):
    return P(str(text), "CellBold" if bold else "Cell")


class HandoverDoc(BaseDocTemplate):
    def __init__(self, filename):
        super().__init__(
            filename,
            pagesize=A4,
            leftMargin=18 * mm,
            rightMargin=18 * mm,
            topMargin=19 * mm,
            bottomMargin=18 * mm,
            title="EV Charge Daily Calculator - Complete Project Handover",
            author="TikkieTeddie Lab",
        )
        frame = Frame(self.leftMargin, self.bottomMargin, self.width, self.height, id="normal")
        self.addPageTemplates([
            PageTemplate(id="content", frames=frame, onPage=self.page_frame),
        ])

    def page_frame(self, canvas, doc):
        canvas.saveState()
        canvas.setStrokeColor(LINE)
        canvas.line(18 * mm, 15 * mm, 192 * mm, 15 * mm)
        canvas.setFont("Thai", 7.5)
        canvas.setFillColor(MUTED)
        canvas.drawString(18 * mm, 10 * mm, "EV Charge Daily Calculator | Project Handover | 2026-10-28")
        canvas.drawRightString(192 * mm, 10 * mm, f"หน้า {doc.page}")
        canvas.restoreState()

    def afterFlowable(self, flowable):
        if isinstance(flowable, Paragraph):
            style = flowable.style.name
            if style in ("ThaiH1", "ThaiH2"):
                level = 0 if style == "ThaiH1" else 1
                text = flowable.getPlainText()
                self.notify("TOCEntry", (level, text, self.page))


def table(rows, widths, header=True, font_size=7.5):
    formatted = []
    for r_index, row in enumerate(rows):
        formatted.append([cell(v, bold=header and r_index == 0) for v in row])
    t = Table(formatted, colWidths=widths, repeatRows=1 if header else 0, hAlign="LEFT")
    commands = [
        ("FONTNAME", (0, 0), (-1, -1), "Thai"),
        ("FONTSIZE", (0, 0), (-1, -1), font_size),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("GRID", (0, 0), (-1, -1), 0.35, LINE),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]
    if header:
        commands += [("BACKGROUND", (0, 0), (-1, 0), SOFT), ("TEXTCOLOR", (0, 0), (-1, 0), INK)]
    for i in range(1 if header else 0, len(rows)):
        if i % 2 == 0:
            commands.append(("BACKGROUND", (0, i), (-1, i), colors.HexColor("#FAFBFB")))
    t.setStyle(TableStyle(commands))
    return t


def callout(text, color=BLUE, background=SEA):
    t = Table([[P(text, "ThaiBody")]], colWidths=[172 * mm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), background),
        ("BOX", (0, 0), (-1, -1), 0.6, color),
        ("LINEBEFORE", (0, 0), (0, -1), 4, color),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 9),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    return t


def metrics(items):
    data = []
    for title, value in items:
        data.append([P(value, "ThaiH3"), P(title, "ThaiSmall")])
    cards = []
    for value, title in data:
        cards.append(Table([[value], [title]], colWidths=[40 * mm], style=[
            ("BOX", (0, 0), (-1, -1), 0.5, LINE),
            ("BACKGROUND", (0, 0), (-1, -1), colors.white),
            ("LEFTPADDING", (0, 0), (-1, -1), 7),
            ("RIGHTPADDING", (0, 0), (-1, -1), 7),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ]))
    return Table([cards], colWidths=[43 * mm] * len(cards), hAlign="LEFT")


def architecture_diagram():
    nodes = ["ผู้ใช้", "Browser", "React/Vite SPA", "Local/Session Storage"]
    row = []
    for index, node in enumerate(nodes):
        row.append(Table([[P(node, "CellBold")]], colWidths=[34 * mm], style=[
            ("BOX", (0, 0), (-1, -1), 0.7, BLUE),
            ("BACKGROUND", (0, 0), (-1, -1), colors.white),
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING", (0, 0), (-1, -1), 8),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ]))
        if index < len(nodes) - 1:
            row.append(P("→", "ThaiH2"))
    return Table([row], colWidths=[34 * mm, 8 * mm, 34 * mm, 8 * mm, 34 * mm, 8 * mm, 34 * mm], hAlign="CENTER")


def wireframe(title, blocks, mobile=False):
    width = 68 * mm if mobile else 90 * mm
    body = [[P(title, "CellBold")]]
    for label, height in blocks:
        body.append([Table([[P(label, "ThaiSmall")]], colWidths=[width - 8 * mm], rowHeights=[height * mm], style=[
            ("BOX", (0, 0), (-1, -1), 0.45, LINE),
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F7FAFA")),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ])])
    return Table(body, colWidths=[width], style=[
        ("BOX", (0, 0), (-1, -1), 2, INK),
        ("BACKGROUND", (0, 0), (-1, 0), SEA),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ])


story = []

# Cover
cover = Table([
    [P("COMPLETE PROJECT HANDOVER", "CoverSub")],
    [P("EV Charge Daily<br/>Calculator", "CoverTitle")],
    [P("ชุดเอกสารส่งมอบจาก Codex ไปยัง Claude Code", "CoverSub")],
    [Spacer(1, 45 * mm)],
    [P("Version 1.0.0 / UI V.1.0.0", "CoverSub")],
    [P("Audit baseline: master @ 5360d94", "CoverSub")],
    [P("วันที่ตรวจสอบ 28 ตุลาคม 2026 (Asia/Bangkok)", "CoverSub")],
    [P("จัดทำจาก Source Code, Git, Build/Lint และ Runtime UI จริง", "CoverSub")],
], colWidths=[172 * mm], rowHeights=[12 * mm, 38 * mm, 16 * mm, 58 * mm, 10 * mm, 10 * mm, 10 * mm, 12 * mm])
cover.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#20343C")),
    ("LEFTPADDING", (0, 0), (-1, -1), 16 * mm),
    ("RIGHTPADDING", (0, 0), (-1, -1), 16 * mm),
    ("TOPPADDING", (0, 0), (-1, -1), 5 * mm),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 5 * mm),
    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
]))
story += [Spacer(1, 8 * mm), cover, PageBreak()]

# TOC
story += [P("สารบัญ", "ThaiH1")]
toc = TableOfContents()
toc.levelStyles = [
    ParagraphStyle(name="TOC0", fontName="ThaiBold", fontSize=10, leading=16, leftIndent=0, textColor=INK),
    ParagraphStyle(name="TOC1", fontName="Thai", fontSize=8.5, leading=13, leftIndent=14, textColor=MUTED),
]
story += [toc, PageBreak()]

story += [P("1. Executive Summary", "ThaiH1")]
story += [P("EV Charge Daily Calculator เป็นเว็บแอป React แบบ browser-only สำหรับบันทึกการเดินทางและการชาร์จรถ EV วิเคราะห์ค่าใช้จ่าย/พลังงานรายสัปดาห์ รายเดือน ตามเส้นทางและเครื่องชาร์จ รวมถึงประมาณการเดือนถัดไป ข้อมูลทั้งหมดทำงานใน browser ไม่มี EV backend, API หรือ database")]
story += [metrics([("หน้าจอ", "8 + 1"), ("Features", "19"), ("EV APIs", "0"), ("DB Entities", "0")]), Spacer(1, 5 * mm)]
story += [callout("<b>ผลตรวจ:</b> npm run lint ผ่าน; npm run build ผ่านพร้อมคำเตือน JS chunk 651.83 kB. Login ปัจจุบันเป็น client-side gate และไม่ใช่ production authentication.", RED, colors.HexColor("#FFF0EF"))]
story += [P("กลุ่มผู้ใช้และสิทธิ์", "ThaiH2"), table([
    ["Role", "สิทธิ์ที่ใช้งานจริง", "ข้อจำกัด"],
    ["user", "ทุก dashboard ยกเว้น Users", "role อยู่ใน Local Storage"],
    ["admin", "dashboard + Users", "ไม่มี server authorization"],
    ["unauthenticated", "Login", "gate แก้ไข/bypass ได้จาก client"],
], [30*mm, 67*mm, 75*mm])]
story += [P("สถานะพัฒนา", "ThaiH2"), table([
    ["Classification", "สรุป"],
    ["Implemented", "Daily CRUD, route presets, dashboards, analysis, charts, forecast, local persistence"],
    ["Partial", "Authentication/authorization, license enforcement, energy attribution semantics"],
    ["Planned", "NOT FOUND ใน source; roadmap เป็นข้อเสนอแนะ"],
    ["Deprecated", "NOT FOUND"],
    ["Unknown", "เจ้าของ/ปลายทางของไฟล์ Next.js ที่ตกค้าง"],
], [37*mm, 135*mm])]

story += [PageBreak(), P("2. Project Overview", "ThaiH1")]
story += [P("Technology Stack", "ThaiH2"), table([
    ["Area", "Verified technology"],
    ["Frontend", "React 19.2.4, Vite, Tailwind CSS 4"],
    ["Visualization", "Recharts 3.5.0"],
    ["Icons", "Lucide React"],
    ["Persistence", "Local Storage / Session Storage"],
    ["Hosting", "Vercel static output dist"],
    ["Backend/API/Database", "NOT FOUND สำหรับ EV app"],
], [45*mm, 127*mm])]
story += [P("Core Capabilities", "ThaiH2")]
for item in [
    "บันทึก/แก้ไข/ลบ trip, route preset และข้อมูลชาร์จ",
    "ประเมิน idle/air-conditioning energy แบบ weighted historic rate หรือ manual",
    "Weekly/Monthly dashboard พร้อม cards และ charts",
    "Route analysis, Charging analysis และ next-month forecast",
    "Local users, session login gate และ admin-only Users tab",
]:
    story.append(P(f"• {item}"))
story += [P("External Integrations", "ThaiH2"), P("Vercel และ GitHub เป็น deployment/source integration เท่านั้น รายชื่อ PTT, EleXa และผู้ให้บริการอื่นเป็น label ใน dropdown ไม่ได้เชื่อม API")]

story += [PageBreak(), P("3. System Architecture", "ThaiH1"), architecture_diagram(), Spacer(1, 5*mm)]
story += [callout("Static files จาก GitHub ถูก Vercel build เป็น dist แล้วส่งไป browser. Calculation และ chart rendering เกิดใน browser ทั้งหมด")]
story += [P("Component Layers", "ThaiH2"), table([
    ["Layer", "Files", "Responsibility"],
    ["Shell/state", "App.jsx", "tab, trip state, session, persistence"],
    ["Input", "DailyLog, RoutePresetManager, UserManagement", "browser-local mutations"],
    ["Analytics", "calculations.js", "normalize, group, summarize, forecast"],
    ["Views", "weekly/monthly/route/charging/forecast", "filters and presentation"],
    ["Integrity", "licenseGuard, brandAudit", "client equality/collision checks"],
], [28*mm, 72*mm, 72*mm])]
story += [P("Data Flow", "ThaiH2"), P("Form → browser validation → React trip state → Local Storage → normalization/calculation → cards/tables/charts. Route presets, users และ session อยู่คนละ key และไม่มี transaction หรือ foreign key")]

story += [PageBreak(), P("4. Project Structure", "ThaiH1")]
story += [P("Active EV Import Graph", "ThaiH2"), table([
    ["Path", "Function"],
    ["src/main.jsx", "Vite entry"],
    ["src/App.jsx", "application shell and state owner"],
    ["src/components/**.jsx", "implemented screens/shared UI"],
    ["src/utils/calculations.js", "business formulas"],
    ["src/utils/auth.js", "client users/session"],
    ["src/utils/routePresets.js", "route preset storage"],
    ["src/data/sampleData.js", "seven starter records"],
], [65*mm, 107*mm])]
story += [callout("<b>Repository contamination:</b> src/app/**, src/lib/**, Next config, tsconfig, public/TNN_A.jpg และ .env.example เป็น profile workflow อีกระบบ ไม่ถูก import ใน Vite EV และ ESLint ignore paths เหล่านี้ ห้ามลบโดยไม่มี owner approval.", RED, colors.HexColor("#FFF0EF"))]

story += [PageBreak(), P("5. Feature Inventory", "ThaiH1")]
feature_rows = [
    ["Feature", "Status", "Issue", "Priority"],
    ["Login gate", "Partial", "plaintext / bypassable", "P0"],
    ["Local user management", "Partial", "device-only roles", "P0"],
    ["License integrity", "Partial", "client rebuild bypass", "P2"],
    ["Daily trip CRUD", "Implemented", "no audit/undo", "P1"],
    ["Route presets/autofill", "Implemented", "no edit action", "P2"],
    ["Charge fields/custom provider", "Implemented", "free-text labels", "P2"],
    ["Idle energy estimate", "Implemented", "estimate not telemetry", "P1"],
    ["Starter data", "Implemented", "sample vs real ambiguity", "P2"],
    ["Local persistence", "Implemented", "no backup/migration", "P0"],
    ["Weekly dashboard", "Implemented", "date logic untested", "P1"],
    ["Monthly dashboard", "Implemented", "energy semantics", "P1"],
    ["Charts", "Implemented", "large bundle", "P2"],
    ["Route analysis", "Implemented", "charge-day attribution", "P1"],
    ["Charger analysis", "Implemented", "distance association", "P1"],
    ["Forecast", "Implemented", "no confidence interval", "P1"],
    ["Responsive shell", "Implemented", "mobile visual audit pending", "P2"],
]
story += [table(feature_rows, [57*mm, 30*mm, 62*mm, 23*mm])]
story += [P("Full matrix มี 19 rows: 16 Implemented และ 3 Partial; CRUD ถูกแยกเป็น create/edit/delete ในเอกสาร FEATURE_INVENTORY.md", "ThaiSmall")]

story += [PageBreak(), P("6. Wireframes / UX Flow", "ThaiH1")]
desktop = wireframe("Desktop shared shell", [("Header + 8 navigation controls", 12), ("Overview + 3 counters", 18), ("6 metric cards", 18), ("Tab content / charts / forms / tables", 56), ("Footer", 10)])
mobile = wireframe("Mobile shared shell", [("Header", 12), ("2-column wrapped navigation", 24), ("Overview counters", 20), ("Stacked cards/forms/charts", 72), ("Horizontal-scroll tables", 20), ("Footer", 10)], mobile=True)
story += [Table([[desktop, mobile]], colWidths=[96*mm, 76*mm], style=[("VALIGN",(0,0),(-1,-1),"TOP")])]
story += [P("Screens detected", "ThaiH2"), table([
    ["State", "Main elements", "Mobile behavior"],
    ["Login", "username/password/error/button/footer", "single card"],
    ["Daily", "cards, charts, presets, form, history", "stack + table scroll"],
    ["Weekly", "week selector, metrics, charts", "stack"],
    ["Monthly", "month, metrics, highlights, charts", "stack"],
    ["Route", "11-column table", "horizontal scroll"],
    ["Charging", "3 cards + 9-column table", "stack/scroll"],
    ["Forecast", "planning rows, cards, table", "stack/scroll"],
    ["Users", "add form and user table", "stack/scroll"],
    ["License Lock", "diagnostic card", "single card"],
], [27*mm, 91*mm, 54*mm])]
story += [P("UX Flow", "ThaiH2"), P("Open → license check → login → Daily Log → mutate trip → storage update → analytics recalculate → switch dashboards/forecast/users → logout")]

story += [PageBreak(), P("7. Database & APIs", "ThaiH1")]
story += [callout("<b>EV Database: NOT FOUND. EV HTTP API endpoints: 0.</b> Tracked Next.js endpoints are inactive/unrelated and are not documented as EV functionality.", RED, colors.HexColor("#FFF0EF"))]
story += [P("Browser Storage Schemas", "ThaiH2"), table([
    ["Key", "Entity", "Important fields"],
    ["ev-charge-daily-log-v1", "Trip[]", "id, date, routeName, distanceKm, chargeCost, kwh, idle fields"],
    ["...route-presets-v1", "RoutePreset[]", "id, routeName, distanceKm"],
    ["...users-v1", "User[]", "username, plaintext password, role, createdAt"],
    ["Session ...session-v1", "Session", "user, role, credit, signedInAt"],
], [55*mm, 35*mm, 82*mm])]
story += [P("Relationships", "ThaiH2"), P("Session match User ด้วย username; Trip copy routeName/distance จาก preset โดยไม่มี FK; charger เป็น free-text label. ไม่มี schema validation, migration, encryption หรือ backup")]

story += [PageBreak(), P("8. Development Status and Validation", "ThaiH1")]
story += [table([
    ["Check", "Result", "Notes"],
    ["npm run lint", "PASS", "ESLint exited successfully"],
    ["npm run build", "PASS + warning", "JS 651.83 kB, gzip 194.17 kB"],
    ["Automated tests", "NOT FOUND", "npm test aliases build"],
    ["Desktop runtime", "PASS", "all tabs inspected locally"],
    ["Mobile runtime", "NOT VERIFIED", "source breakpoints inspected; viewport emulation unavailable"],
    ["CI workflow", "NOT FOUND", "no GitHub Actions files"],
    ["Production internals", "NOT VERIFIED", "no deployment mutation performed"],
], [50*mm, 34*mm, 88*mm])]
story += [P("Environment", "ThaiH2"), P("Active EV app requires no environment variables. Existing .env.example belongs to inactive Next.js code and must not be used as EV setup guidance.")]

story += [PageBreak(), P("9. Risks and Known Issues", "ThaiH1")]
risk_rows = [
    ["Severity", "Risk", "Impact"],
    ["Critical", "Plaintext client authentication", "no trusted identity/access boundary"],
    ["High", "Local-only data", "loss on site-data clear; no cross-device sync"],
    ["High", "Charged vs consumed kWh conflation", "misleading route/efficiency analytics"],
    ["High", "Mixed repository", "wrong architecture/security assumptions"],
    ["Medium", "No automated tests", "formula and storage regressions"],
    ["Medium", "No migrations/export", "schema change/data recovery risk"],
    ["Medium", "Large initial bundle", "slower first load"],
    ["Low", "README storage drift", "maintenance confusion"],
]
story += [table(risk_rows, [27*mm, 62*mm, 83*mm])]
story += [P("Security Position", "ThaiH2"), callout("ห้ามขายหรือสื่อสาร login ปัจจุบันว่าเป็นระบบป้องกันข้อมูลระดับ production. หากต้องการ multi-user ต้องเพิ่ม server-side auth, per-user persistence, authorization และ secure session.", RED, colors.HexColor("#FFF0EF"))]

story += [PageBreak(), P("10. Development Roadmap", "ThaiH1")]
story += [table([
    ["Priority", "Goal", "Acceptance signal"],
    ["P0", "ตัดสินใจ offline personal vs secure cloud", "documented threat model; no plaintext production password"],
    ["P0", "แยก repository contamination", "owner-approved file disposition; clean EV clone"],
    ["P1", "แก้ energy accounting", "charged/consumed labels and formulas separated"],
    ["P1", "เพิ่ม tests", "unit + integration + desktop/mobile E2E"],
    ["P1", "export/import/migration", "validated versioned round trip"],
    ["P2", "performance/accessibility/mobile", "bundle budget + 360/768/1440 visual QA"],
], [24*mm, 72*mm, 76*mm])]

story += [PageBreak(), P("11. Claude Code Takeover Checklist", "ThaiH1")]
for item in [
    "อ่าน CLAUDE.md, HANDOVER.md, DOCUMENT_INDEX.md, DEVELOPMENT_ROADMAP.md และ NEXT_STEPS.md",
    "ยืนยัน git status และ commit ปัจจุบันเทียบ baseline 5360d94",
    "ตาม import graph จาก src/main.jsx ก่อนแก้โค้ด",
    "รัน npm run lint และ npm run build ก่อน/หลังงาน",
    "ขอ owner decision เรื่อง security model และไฟล์ Next.js ที่ตกค้าง",
    "เพิ่ม tests ก่อนเปลี่ยน calculation/storage",
    "ไม่ commit, push, deploy หรือลบไฟล์โดยไม่ได้รับอนุญาต",
    "อัปเดตเอกสารและ validation หลังการเปลี่ยนแปลง",
]:
    story.append(P(f"□ {item}"))
story += [Spacer(1, 5*mm), callout("First recommended task: security/data-ownership decision. การเพิ่มฟีเจอร์ต่อโดยไม่แก้ boundary นี้จะเพิ่ม technical debt และความเสี่ยงข้อมูล")]

story += [PageBreak(), P("12. Appendix / Document Index", "ThaiH1")]
story += [table([
    ["Document", "Purpose"],
    ["CLAUDE.md", "Claude operating rules"],
    ["HANDOVER.md", "verified current state"],
    ["HANDOVER_DASHBOARD.html", "interactive visual center"],
    ["PROJECT_OVERVIEW.md", "product/executive overview"],
    ["SYSTEM_ARCHITECTURE.md + diagrams/*.mmd", "architecture source"],
    ["FEATURE_INVENTORY.md", "19-row status matrix"],
    ["DATABASE_DOCUMENTATION.md", "browser storage schemas"],
    ["API_DOCUMENTATION.md", "zero EV API inventory and boundary"],
    ["DEVELOPMENT_ROADMAP.md / NEXT_STEPS.md", "priorities and takeover"],
    ["HANDOVER_VALIDATION.md", "pass/fail/not-verified record"],
    ["PROJECT_HANDOVER_TO_CLAUDE_CODE.zip", "portable docs-only package"],
], [65*mm, 107*mm])]
story += [P("Files created by this handover are listed in HANDOVER_VALIDATION.md. No application source behavior, production data, Git commit, push, or deployment was changed.", "ThaiSmall")]

doc = HandoverDoc(str(OUTPUT))
doc.multiBuild(story)
print(OUTPUT)
