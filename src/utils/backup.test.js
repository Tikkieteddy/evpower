// tikkieteddielab: tests for backup export/import (Export/Backup plan, stages 2-3).
import { describe, expect, it } from "vitest";
import {
  backupFilename,
  backupFormat,
  backupSchemaVersion,
  createBackup,
  parseBackup,
  planImport,
  tripsToCsv,
} from "./backup.js";

const trip = (overrides = {}) => ({
  id: "t1",
  date: "2026-10-28",
  routeName: "บ้าน - ออฟฟิศ",
  distanceKm: 42,
  hasCharge: true,
  chargerName: "PTT",
  chargeCost: 180.5,
  kwh: 24,
  idleMinutes: 20,
  idleKwhPerHour: 1.2,
  idleRateMode: "auto",
  note: "",
  ...overrides,
});
const preset = (overrides = {}) => ({ id: "p1", routeName: "บ้าน - ออฟฟิศ", distanceKm: 42, ...overrides });
const now = new Date("2026-10-28T03:00:00Z");

const fileFor = (trips, routePresets = []) => JSON.stringify(createBackup({ trips, routePresets, appVersion: "V.1.0.0", now }));

describe("createBackup / backupFilename", () => {
  it("wraps trips and presets with format, version and counts", () => {
    const backup = createBackup({ trips: [trip()], routePresets: [preset()], appVersion: "V.1.0.0", now });
    expect(backup).toMatchObject({
      format: backupFormat,
      schemaVersion: backupSchemaVersion,
      appVersion: "V.1.0.0",
      exportedAt: now.toISOString(),
      counts: { trips: 1, routePresets: 1 },
    });
    expect(backup.data.trips).toEqual([trip()]);
  });

  it("never includes users or sessions", () => {
    const text = fileFor([trip()], [preset()]);
    expect(text).not.toMatch(/password|users|session/i);
  });

  it("names files by local (Bangkok) date, not UTC", () => {
    // 2026-10-28 23:30 in Bangkok is still 2026-10-28 16:30 UTC; 00:30 local on the 29th is the 28th in UTC.
    expect(backupFilename(new Date("2026-10-28T17:30:00Z"), "json")).toBe("evpower-backup-2026-10-29.json");
    expect(backupFilename(now, "csv")).toBe("evpower-trips-2026-10-28.csv");
  });
});

describe("tripsToCsv", () => {
  it("writes a header and one sorted row per trip", () => {
    const csv = tripsToCsv([trip({ id: "b", date: "2026-10-29" }), trip({ id: "a" })]);
    const lines = csv.split("\r\n");
    expect(lines[0]).toBe("date,routeName,distanceKm,hasCharge,chargerName,chargeCost,kwh,idleMinutes,idleKwhPerHour,idleRateMode,note,id");
    expect(lines[1].startsWith("2026-10-28,")).toBe(true);
    expect(lines[1].endsWith(",a")).toBe(true);
    expect(lines).toHaveLength(3);
  });

  it("quotes commas, quotes and newlines", () => {
    const csv = tripsToCsv([trip({ note: 'ชาร์จ, รอ "นาน"\nมาก' })]);
    expect(csv).toContain('"ชาร์จ, รอ ""นาน""\nมาก"');
  });

  it("neutralizes spreadsheet formulas in text cells", () => {
    const csv = tripsToCsv([trip({ routeName: "=HYPERLINK(1)", note: "+cmd", chargerName: "@x" })]);
    expect(csv).toContain("'=HYPERLINK(1)");
    expect(csv).toContain("'+cmd");
    expect(csv).toContain("'@x");
  });

  it("returns only the header for no trips", () => {
    expect(tripsToCsv([]).split("\r\n")).toHaveLength(1);
  });
});

describe("parseBackup", () => {
  it("round-trips an exported file", () => {
    const result = parseBackup(fileFor([trip()], [preset()]));
    expect(result.ok).toBe(true);
    expect(result.trips.valid).toEqual([trip()]);
    expect(result.routePresets.valid).toEqual([preset()]);
    expect(result.trips.invalid).toEqual([]);
  });

  it.each([
    ["not JSON", "{oops"],
    ["another format", JSON.stringify({ format: "other", schemaVersion: 1, data: { trips: [] } })],
    ["a newer schema", JSON.stringify({ format: backupFormat, schemaVersion: 99, data: { trips: [] } })],
    ["missing trips", JSON.stringify({ format: backupFormat, schemaVersion: 1, data: {} })],
  ])("rejects %s", (_, text) => {
    const result = parseBackup(text);
    expect(result.ok).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it("separates invalid rows with reasons and keeps valid ones", () => {
    const result = parseBackup(
      fileFor([trip(), trip({ id: "bad-date", date: "2026-13-40" }), trip({ id: "neg", distanceKm: -1 }), trip({ id: "" })]),
    );
    expect(result.ok).toBe(true);
    expect(result.trips.valid.map((t) => t.id)).toEqual(["t1"]);
    expect(result.trips.invalid).toHaveLength(3);
    expect(result.trips.invalid[0]).toMatchObject({ index: 1 });
    expect(result.trips.invalid[0].errors.join(" ")).toMatch(/date/);
  });

  it("normalizes legacy rows (numeric strings, missing idleRateMode, unknown fields dropped)", () => {
    const legacy = { ...trip({ distanceKm: "12.5", idleRateMode: undefined }), extra: "x" };
    const result = parseBackup(fileFor([legacy]));
    expect(result.trips.valid[0]).toMatchObject({ distanceKm: 12.5, idleRateMode: "auto" });
    expect(result.trips.valid[0]).not.toHaveProperty("extra");
  });

  it("zeroes charge fields on non-charging trips", () => {
    const result = parseBackup(fileFor([trip({ hasCharge: false, chargeCost: 99, kwh: 5, chargerName: "PTT" })]));
    expect(result.trips.valid[0]).toMatchObject({ chargeCost: 0, kwh: 0, chargerName: "" });
  });

  it("flags duplicate ids inside the file", () => {
    const result = parseBackup(fileFor([trip(), trip({ routeName: "อื่น" })]));
    expect(result.trips.valid).toHaveLength(1);
    expect(result.trips.invalid[0].errors.join(" ")).toMatch(/duplicate/i);
  });
});

describe("planImport", () => {
  const current = { trips: [trip(), trip({ id: "t2", date: "2026-10-27" })], routePresets: [preset()] };

  it("merges new trips and reports identical ones as unchanged", () => {
    const incoming = { trips: [trip(), trip({ id: "t3", date: "2026-10-26" })], routePresets: [] };
    const plan = planImport(current, incoming, { mode: "merge" });
    expect(plan.trips.map((t) => t.id).sort()).toEqual(["t1", "t2", "t3"]);
    expect(plan.summary).toMatchObject({ added: 1, unchanged: 1, conflicts: 0, updated: 0, removed: 0 });
  });

  it("keeps existing trips on conflict by default", () => {
    const incoming = { trips: [trip({ chargeCost: 999 })], routePresets: [] };
    const plan = planImport(current, incoming, { mode: "merge" });
    expect(plan.trips.find((t) => t.id === "t1").chargeCost).toBe(180.5);
    expect(plan.summary).toMatchObject({ conflicts: 1, updated: 0 });
  });

  it("uses file values on conflict when asked", () => {
    const incoming = { trips: [trip({ chargeCost: 999 })], routePresets: [] };
    const plan = planImport(current, incoming, { mode: "merge", onConflict: "useFile" });
    expect(plan.trips.find((t) => t.id === "t1").chargeCost).toBe(999);
    expect(plan.summary).toMatchObject({ conflicts: 1, updated: 1 });
  });

  it("adds presets by new name only (case-insensitive)", () => {
    const incoming = { trips: [], routePresets: [preset({ id: "x", routeName: "บ้าน - ออฟฟิศ" }), preset({ id: "y", routeName: "Airport" })] };
    const plan = planImport(current, incoming, { mode: "merge" });
    expect(plan.routePresets.map((p) => p.routeName)).toEqual(["บ้าน - ออฟฟิศ", "Airport"]);
    expect(plan.summary.presetsAdded).toBe(1);
  });

  it("replaces everything in replace mode and counts removals", () => {
    const incoming = { trips: [trip({ id: "t9" })], routePresets: [preset({ id: "y", routeName: "Airport" })] };
    const plan = planImport(current, incoming, { mode: "replace" });
    expect(plan.trips.map((t) => t.id)).toEqual(["t9"]);
    expect(plan.routePresets.map((p) => p.routeName)).toEqual(["Airport"]);
    expect(plan.summary).toMatchObject({ added: 1, removed: 2, unchanged: 0 });
    expect(planImport(current, { trips: [trip()], routePresets: [] }, { mode: "replace" }).summary).toMatchObject({ unchanged: 1, removed: 1 });
  });

  it("keeps current presets in replace mode when the file has none", () => {
    const plan = planImport(current, { trips: [], routePresets: [] }, { mode: "replace" });
    expect(plan.routePresets).toEqual(current.routePresets);
  });

  it("does not mutate the inputs", () => {
    const snapshot = JSON.stringify(current);
    planImport(current, { trips: [trip({ chargeCost: 1 })], routePresets: [] }, { mode: "merge", onConflict: "useFile" });
    expect(JSON.stringify(current)).toBe(snapshot);
  });
});

describe("planImport with legacy data", () => {
  it("treats a re-imported legacy trip (no idleRateMode) as unchanged", () => {
    const legacy = { ...trip(), idleRateMode: undefined };
    delete legacy.idleRateMode;
    const parsed = parseBackup(fileFor([legacy]));
    const plan = planImport({ trips: [legacy], routePresets: [] }, { trips: parsed.trips.valid, routePresets: [] }, { mode: "merge" });
    expect(plan.summary).toMatchObject({ unchanged: 1, conflicts: 0 });
  });
});
