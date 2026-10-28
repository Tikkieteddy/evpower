// Generates docs/handover/HANDOVER_DASHBOARD.html from docs/handover/data/project-status.json.
// Usage: npm run docs:build   (offline output: all CSS/JS inlined, no external requests)
/* global console */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../..");
const dataPath = resolve(root, "docs/handover/data/project-status.json");
const outPath = resolve(root, "docs/handover/HANDOVER_DASHBOARD.html");

const data = JSON.parse(readFileSync(dataPath, "utf8"));
const css = readFileSync(resolve(here, "dashboard.css"), "utf8");
const clientJs = readFileSync(resolve(here, "dashboard.client.js"), "utf8");
const { meta } = data;

const esc = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
// Links in the dashboard are relative to docs/handover/.
const rel = (repoPath) => (repoPath.startsWith("docs/handover/") ? repoPath.slice("docs/handover/".length) : `../../${repoPath}`);
const statusClass = { pass: "ok", partial: "partial", fail: "risk", Implemented: "ok", Partial: "partial", Planned: "planned" };
const tag = (text, cls) => `<span class="tag ${cls}">${esc(text)}</span>`;
const flow = (nodes) => `<div class="flow">${nodes.map((n) => `<span class="node">${esc(n)}</span>`).join('<span class="arrow">→</span>')}</div>`;
const count = (status) => data.features.filter((f) => f.status === status).length;

const sections = [
  ["overview", "Overview"],
  ["architecture", "Architecture"],
  ["structure", "Structure"],
  ["sitemap", "Sitemap"],
  ["wireframes", "Wireframes"],
  ["features", "Features"],
  ["data", "Data Storage"],
  ["api", "API & Integrations"],
  ["risks", "Known Issues"],
  ["roadmap", "Roadmap"],
  ["updates", "Recent Updates"],
  ["documents", "Document Index"],
];

const body = {
  overview: `<div class="hero"><div><p class="eyebrow">Project control center / verified against source</p><h2>${esc(meta.project)}</h2>
<p>เว็บแอป React แบบ browser-only สำหรับบันทึกการเดินทางและค่าชาร์จ EV วิเคราะห์รายสัปดาห์/เดือน/เส้นทาง/เครื่องชาร์จ และ Forecast เดือนถัดไป ไม่มี EV backend, API หรือ database</p>
${data.checks.map((c) => tag(`${c.name}: ${c.status.toUpperCase()}`, statusClass[c.status])).join(" ")}</div>
<div class="audit"><div><strong>${data.screens.length - 1}+1</strong><span>screens + lock</span></div><div><strong>${data.features.length}</strong><span>features</span></div><div><strong>0 / 0</strong><span>APIs / DB</span></div></div></div>
<div class="grid g4"><div class="metric"><b>${esc(meta.packageVersion)}</b><span>package version</span></div><div class="metric"><b>React 19</b><span>Vite 7 + Tailwind 4 + Recharts</span></div><div class="metric"><b>Local only</b><span>Web Storage</span></div><div class="metric"><b>Vercel</b><span>static dist</span></div></div>
<div class="check-list">${data.checks.map((c) => `<div>${tag(c.status, statusClass[c.status])}<b>${esc(c.name)}</b><span>${esc(c.detail)}</span></div>`).join("")}</div>
<div class="note danger" style="margin-top:12px"><b>ข้อจำกัดสำคัญ:</b> Login เป็น client-side gate เก็บ user/password แบบ plaintext และรหัสผ่าน default เปิดเผยอยู่ใน repository สาธารณะ จึงไม่ใช่ production authentication</div>`,

  architecture: `<div class="panel">${flow(data.architecture.runtime)}<div style="margin-top:10px">${flow(data.architecture.delivery)}</div>
<ul>${data.architecture.notes.map((n) => `<li>${esc(n)}</li>`).join("")}</ul>
<p>Mermaid sources: <a href="diagrams/system-architecture.mmd">system-architecture.mmd</a>, <a href="diagrams/data-flow.mmd">data-flow.mmd</a>, <a href="diagrams/storage-model.mmd">storage-model.mmd</a></p></div>`,

  structure: `<div class="grid g2"><pre class="tree">index.html
postcss.config.mjs   (Tailwind — used by EV)
vite.config.js / vercel.json
src/main.jsx
  App.jsx
  components/  (14 .jsx)
  utils/       calculations · auth · routePresets · licenseGuard
  data/        sampleData · brandAudit
docs/handover/  (documentation)
scripts/docs/   (dashboard build + validation)</pre>
<div class="panel"><h4>Tracked but not part of EV</h4><p><code>src/app/**</code>, <code>src/lib/**</code>, <code>next.config.ts</code>, <code>next-env.d.ts</code>, <code>tsconfig.json</code>, <code>.env.example</code>, <code>public/TNN_A.jpg</code> (copied to dist but unused).</p><div class="note">Ownership UNKNOWN. Do not delete without owner approval. See <a href="PROJECT_STRUCTURE.md">PROJECT_STRUCTURE.md</a>.</div></div></div>`,

  sitemap: `<div class="panel">${flow(["/", "License check", "Session check", "Login", "App shell"])}<div class="flow" style="margin-top:10px">${data.screens
    .filter((s) => !["lock", "login"].includes(s.id))
    .map((s) => `<button class="node" data-goto="${esc(s.id)}" title="${esc(s.file)}">${esc(s.label)}</button>`)
    .join("")}</div><p>Tabs are React state (single URL <code>/</code>); click a tab to open its wireframe. Source: <a href="diagrams/sitemap.mmd">sitemap.mmd</a>.</p></div>`,

  wireframes: `<div class="panel"><div class="wire-toolbar"><div class="tabs" id="screenTabs"></div><div class="view-toggle"><button data-view="desktop" class="active">Desktop</button> <button data-view="mobile">Mobile</button></div></div><div class="wire-stage"><div id="device" class="device desktop"><div id="wireContent"></div></div></div><p id="wireNote" class="note"></p><p>All wireframes are CURRENT (implemented). Detail: <a href="wireframes/WIREFRAMES.md">WIREFRAMES.md</a>.</p></div>`,

  features: `<div class="table-wrap"><table id="featureTable"><thead><tr><th>Feature</th><th>Module</th><th>File</th><th>Status</th><th>Main issue</th><th>Priority</th></tr></thead><tbody>${data.features
    .map((f) => `<tr data-status="${f.status.toLowerCase()}"><td>${esc(f.name)}</td><td>${esc(f.module)}</td><td><code>${esc(f.file || "—")}</code></td><td>${tag(f.status, statusClass[f.status])}</td><td>${esc(f.issue)}</td><td>${esc(f.priority)}</td></tr>`)
    .join("")}</tbody></table></div><p>${count("Implemented")} Implemented · ${count("Partial")} Partial · ${count("Planned")} Planned. Full matrix: <a href="FEATURE_INVENTORY.md">FEATURE_INVENTORY.md</a>.</p>`,

  data: `<div class="table-wrap"><table><thead><tr><th>Key</th><th>Store</th><th>Shape</th><th>Owner file</th><th>Risk</th></tr></thead><tbody>${data.storage
    .map((s) => `<tr><td><code>${esc(s.key)}</code></td><td>${esc(s.store)}</td><td>${esc(s.shape)}</td><td><code>${esc(s.file)}</code></td><td>${esc(s.risk)}</td></tr>`)
    .join("")}</tbody></table></div><div class="note danger" style="margin-top:12px">ข้อมูลอยู่ใน browser เครื่องนั้นเท่านั้น ไม่มี export/backup/sync — อย่าล้าง Local Storage ของผู้ใช้. Detail: <a href="DATABASE_DOCUMENTATION.md">DATABASE_DOCUMENTATION.md</a></div>`,

  api: `<div class="grid g2">${data.integrations
    .map((i) => `<div class="panel"><h4>${esc(i.name)}</h4>${tag(i.status, i.status === "Verified" ? "ok" : "unknown")}<p>${esc(i.detail)}</p></div>`)
    .join("")}</div><p>Detail: <a href="API_DOCUMENTATION.md">API_DOCUMENTATION.md</a></p>`,

  risks: data.issues
    .map((i, n) => `<details ${n < 3 ? "open" : ""} data-risk><summary>${tag(i.severity, `sev-${i.severity}`)} ${esc(i.title)}</summary><div>${esc(i.detail)}</div></details>`)
    .join(""),

  roadmap: `<div class="grid g3">${data.roadmap
    .map((r) => `<div class="metric"><b>${esc(r.priority)}</b><span>${esc(r.title)}</span><br>${tag(r.status, r.status.startsWith("Ready") ? "ok" : "partial")}</div>`)
    .join("")}</div><p>Detail: <a href="DEVELOPMENT_ROADMAP.md">DEVELOPMENT_ROADMAP.md</a> · <a href="NEXT_STEPS.md">NEXT_STEPS.md</a></p>`,

  updates: `<div class="panel"><ul class="updates">${data.updates.map((u) => `<li><b>${esc(u.date)}</b> — <i>${esc(u.who)}</i>: ${esc(u.text)}</li>`).join("")}</ul><p>Full history: <a href="CHANGELOG.md">CHANGELOG.md</a></p></div>`,

  documents: `<div class="doc-list">${data.documents
    .map((d) => `<a class="doc-link" href="${esc(rel(d.path))}">${esc(d.file)}<small>${esc(d.purpose)} · ${esc(d.category)} · ${esc(d.status)}</small></a>`)
    .join("")}</div>`,
};

const html = `<!doctype html>
<!-- GENERATED by scripts/docs/build-dashboard.mjs from docs/handover/data/project-status.json. Do not edit by hand. -->
<html lang="th">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>EV Handover Dashboard</title>
<style>
${css}</style>
</head>
<body>
<div class="shell">
<aside class="side"><div class="brand"><div class="brand-mark">EV</div><div><h1>${esc(meta.project)}</h1><p>Project Control Center</p></div></div>
<nav class="nav" id="nav">${sections.map(([id, label], n) => `<button data-target="${id}"${n === 0 ? ' class="active"' : ""}>${String(n + 1).padStart(2, "0")} ${esc(label)}</button>`).join("")}</nav>
<div class="side-meta">Baseline: ${esc(meta.baselineBranch)} @ ${esc(meta.baselineCommit)}<br>Branch: ${esc(meta.workingBranch)}<br>Updated: ${esc(meta.lastUpdated)}<br>Docs: ${esc(meta.docsVersion)} · App: ${esc(meta.appFooterVersion)}</div></aside>
<main class="main"><div class="top"><input id="search" class="search" type="search" placeholder="ค้นหาเอกสาร ฟีเจอร์ ไฟล์ หรือความเสี่ยง..."><select id="statusFilter" class="filter"><option value="all">ทุกสถานะ</option><option value="implemented">Implemented</option><option value="partial">Partial</option><option value="planned">Planned</option><option value="risk">Risks</option></select><button class="collapse" id="expandAll">เปิด/ปิดรายละเอียด</button></div><div class="content">
${sections.map(([id, label]) => `<section id="${id}" class="section searchable">${id === "overview" ? "" : `<div class="section-head"><h3>${esc(label)}</h3></div>`}${body[id]}</section>`).join("\n")}
</div><footer class="footer"><abbr title="${esc(`${meta.project} · docs ${meta.docsVersion} · app ${meta.appFooterVersion} · package ${meta.packageVersion} · updated ${meta.lastUpdated}`)}">${esc(meta.dashboardFooter)}</abbr></footer></main></div>
<script>
window.SCREENS=${JSON.stringify(data.screens).replace(/</g, "\\u003c")};
${clientJs}
document.querySelectorAll('[data-goto]').forEach(b=>b.onclick=()=>{render(b.dataset.goto);document.getElementById('wireframes').scrollIntoView()});
</script>
</body>
</html>
`;

writeFileSync(outPath, html, "utf8");
console.log(`Dashboard written: ${outPath} (${(html.length / 1024).toFixed(1)} kB, ${data.features.length} features, ${data.issues.length} issues)`);
