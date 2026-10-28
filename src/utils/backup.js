// tikkieteddielab: backup file export (JSON/CSV), validation and import planning. Pure functions; no storage access.
export const backupFormat = "evpower-backup";
export const backupSchemaVersion = 1;

const csvColumns = ["date", "routeName", "distanceKm", "hasCharge", "chargerName", "chargeCost", "kwh", "idleMinutes", "idleKwhPerHour", "idleRateMode", "note", "id"];
const textColumns = new Set(["routeName", "chargerName", "note", "id"]);
const numericTripFields = ["distanceKm", "chargeCost", "kwh", "idleMinutes", "idleKwhPerHour"];

const localDate = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

export const backupFilename = (now, ext) => `evpower-${ext === "csv" ? "trips" : "backup"}-${localDate(now)}.${ext}`;

export const createBackup = ({ trips, routePresets, appVersion, now = new Date() }) => ({
  format: backupFormat,
  schemaVersion: backupSchemaVersion,
  appVersion,
  exportedAt: now.toISOString(),
  counts: { trips: trips.length, routePresets: routePresets.length },
  data: { trips, routePresets },
});

const csvCell = (value, column) => {
  let text = value === undefined || value === null ? "" : String(value);
  // Prevent spreadsheet formula injection from user-entered text.
  if (textColumns.has(column) && /^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export const tripsToCsv = (trips) => {
  const rows = [...trips].sort((a, b) => String(a.date).localeCompare(String(b.date)));
  return [csvColumns.join(","), ...rows.map((trip) => csvColumns.map((column) => csvCell(trip[column], column)).join(","))].join("\r\n");
};

const isValidDate = (value) => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
};

const toNonNegative = (value) => {
  const number = typeof value === "string" && value.trim() !== "" ? Number(value) : value;
  return typeof number === "number" && Number.isFinite(number) && number >= 0 ? number : null;
};

const validateTrip = (raw) => {
  const errors = [];
  if (!raw || typeof raw !== "object") return { errors: ["row is not an object"] };
  if (typeof raw.id !== "string" || !raw.id.trim()) errors.push("missing id");
  if (!isValidDate(raw.date)) errors.push("invalid date");
  if (typeof raw.routeName !== "string") errors.push("routeName must be text");
  const numbers = {};
  for (const field of numericTripFields) {
    const value = raw[field] === undefined || raw[field] === "" ? 0 : toNonNegative(raw[field]);
    if (value === null) errors.push(`${field} must be a number ≥ 0`);
    numbers[field] = value;
  }
  if (typeof raw.hasCharge !== "boolean") errors.push("hasCharge must be true/false");
  if (raw.idleRateMode !== undefined && !["auto", "manual"].includes(raw.idleRateMode)) errors.push("idleRateMode must be auto/manual");
  if (errors.length) return { errors };

  return {
    trip: {
      id: raw.id,
      date: raw.date,
      routeName: raw.routeName,
      distanceKm: numbers.distanceKm,
      hasCharge: raw.hasCharge,
      chargerName: raw.hasCharge ? String(raw.chargerName ?? "") : "",
      chargeCost: raw.hasCharge ? numbers.chargeCost : 0,
      kwh: raw.hasCharge ? numbers.kwh : 0,
      idleMinutes: numbers.idleMinutes,
      idleKwhPerHour: numbers.idleKwhPerHour,
      idleRateMode: raw.idleRateMode || "auto",
      note: String(raw.note ?? ""),
    },
  };
};

const validatePreset = (raw) => {
  const distanceKm = toNonNegative(raw?.distanceKm);
  if (!raw || typeof raw.id !== "string" || typeof raw.routeName !== "string" || !raw.routeName.trim() || distanceKm === null) {
    return { errors: ["preset needs id, routeName and distanceKm ≥ 0"] };
  }
  return { preset: { id: raw.id, routeName: raw.routeName.trim(), distanceKm } };
};

export const parseBackup = (text) => {
  let file;
  try {
    file = JSON.parse(text);
  } catch {
    return { ok: false, error: "ไฟล์ไม่ใช่ JSON ที่อ่านได้" };
  }
  if (file?.format !== backupFormat) return { ok: false, error: "ไม่ใช่ไฟล์ backup ของ EV Charge Daily Calculator" };
  if (!Number.isInteger(file.schemaVersion) || file.schemaVersion < 1 || file.schemaVersion > backupSchemaVersion) {
    return { ok: false, error: `ไม่รองรับไฟล์ backup เวอร์ชัน ${file.schemaVersion}` };
  }
  if (!Array.isArray(file.data?.trips)) return { ok: false, error: "ไฟล์ไม่มีรายการบันทึกการเดินทาง" };

  const trips = { valid: [], invalid: [] };
  const seen = new Set();
  file.data.trips.forEach((raw, index) => {
    const { trip, errors } = validateTrip(raw);
    if (errors) return trips.invalid.push({ index, errors });
    if (seen.has(trip.id)) return trips.invalid.push({ index, errors: [`duplicate id ${trip.id}`] });
    seen.add(trip.id);
    trips.valid.push(trip);
  });

  const routePresets = { valid: [], invalid: [] };
  (Array.isArray(file.data.routePresets) ? file.data.routePresets : []).forEach((raw, index) => {
    const { preset, errors } = validatePreset(raw);
    if (errors) routePresets.invalid.push({ index, errors });
    else routePresets.valid.push(preset);
  });

  return { ok: true, meta: { appVersion: file.appVersion, exportedAt: file.exportedAt }, trips, routePresets };
};

const stableJson = (value) => JSON.stringify(value, Object.keys(value).sort());
// Compare normalized forms so legacy rows (e.g. no idleRateMode) do not count as conflicts after a round trip.
const sameTrip = (existing, incoming) => stableJson(validateTrip(existing).trip || existing) === stableJson(incoming);

export const planImport = (current, incoming, { mode = "merge", onConflict = "keep" } = {}) => {
  if (mode === "replace") {
    const currentIds = new Set(current.trips.map((t) => t.id));
    return {
      trips: [...incoming.trips],
      routePresets: incoming.routePresets.length ? [...incoming.routePresets] : current.routePresets,
      summary: {
        added: incoming.trips.filter((t) => !currentIds.has(t.id)).length,
        updated: 0,
        unchanged: incoming.trips.filter((t) => currentIds.has(t.id)).length,
        conflicts: 0,
        removed: current.trips.filter((t) => !incoming.trips.some((i) => i.id === t.id)).length,
        presetsAdded: incoming.routePresets.length,
      },
    };
  }

  const byId = new Map(current.trips.map((t) => [t.id, t]));
  const summary = { added: 0, updated: 0, unchanged: 0, conflicts: 0, removed: 0, presetsAdded: 0 };
  for (const trip of incoming.trips) {
    const existing = byId.get(trip.id);
    if (!existing) {
      summary.added += 1;
      byId.set(trip.id, trip);
    } else if (sameTrip(existing, trip)) {
      summary.unchanged += 1;
    } else {
      summary.conflicts += 1;
      if (onConflict === "useFile") {
        summary.updated += 1;
        byId.set(trip.id, trip);
      }
    }
  }

  const names = new Set(current.routePresets.map((p) => p.routeName.toLowerCase()));
  const routePresets = [...current.routePresets];
  for (const preset of incoming.routePresets) {
    if (names.has(preset.routeName.toLowerCase())) continue;
    names.add(preset.routeName.toLowerCase());
    routePresets.push(preset);
    summary.presetsAdded += 1;
  }

  return { trips: [...byId.values()], routePresets, summary };
};
