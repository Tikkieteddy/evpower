// tikkieteddielab: unit tests for EV power analytics formulas.
import { describe, expect, it } from "vitest";
import {
  chargerAnalysis,
  dailyChartData,
  defaultIdleKwhPerHour,
  filterByMonth,
  filterByWeek,
  forecastNextMonth,
  getAutoIdleKwhPerHour,
  getMonthKey,
  getWeekKey,
  monthlyHighlights,
  normalizeTrip,
  routeAnalysis,
  safeDivide,
  sortTrips,
  summarizeTrips,
  uniqueRoutes,
} from "./calculations.js";

const trip = (overrides) => ({
  id: crypto.randomUUID(),
  date: "2026-10-26",
  routeName: "บ้าน - ออฟฟิศ",
  distanceKm: 0,
  hasCharge: false,
  chargerName: "",
  chargeCost: 0,
  kwh: 0,
  idleMinutes: 0,
  idleKwhPerHour: 1.2,
  note: "",
  ...overrides,
});

// Two charging days and one non-charging day across two routes.
const fixture = [
  trip({ date: "2026-10-26", distanceKm: 40, hasCharge: true, chargerName: "PTT", chargeCost: 200, kwh: 25, idleMinutes: 30, idleKwhPerHour: 1.2 }),
  trip({ date: "2026-10-27", routeName: "บ้าน - ห้าง", distanceKm: 20, idleMinutes: 60, idleKwhPerHour: 1.0 }),
  trip({ date: "2026-10-28", distanceKm: 40, hasCharge: true, chargerName: "EleXa", chargeCost: 150, kwh: 25 }),
];

describe("safeDivide", () => {
  it("divides positive divisors and returns 0 for zero/negative divisors", () => {
    expect(safeDivide(10, 4)).toBe(2.5);
    expect(safeDivide(10, 0)).toBe(0);
    expect(safeDivide(10, -2)).toBe(0);
  });
});

describe("normalizeTrip", () => {
  it("coerces numeric strings and computes idle kWh", () => {
    const result = normalizeTrip(trip({ distanceKm: "12.50", idleMinutes: "90", idleKwhPerHour: "1.5" }));
    expect(result.distanceKm).toBe(12.5);
    expect(result.idleKwh).toBeCloseTo(2.25);
  });

  it("zeroes charge fields when the trip has no charge", () => {
    const result = normalizeTrip(trip({ hasCharge: false, chargerName: "PTT", chargeCost: 99, kwh: 10 }));
    expect(result).toMatchObject({ chargerName: "", chargeCost: 0, kwh: 0 });
  });

  it("fills placeholder names and the default idle rate", () => {
    const result = normalizeTrip(trip({ routeName: "  ", hasCharge: true, chargerName: "", idleKwhPerHour: 0, idleMinutes: 60 }));
    expect(result.routeName).toBe("ไม่ระบุเส้นทาง");
    expect(result.chargerName).toBe("ไม่ระบุเครื่องชาร์จ");
    expect(result.idleKwhPerHour).toBe(defaultIdleKwhPerHour);
    expect(result.idleKwh).toBeCloseTo(defaultIdleKwhPerHour);
  });

  it("treats non-numeric input as zero", () => {
    expect(normalizeTrip(trip({ distanceKm: "abc" })).distanceKm).toBe(0);
  });
});

describe("sortTrips / uniqueRoutes", () => {
  it("sorts by date without mutating the input", () => {
    const input = [fixture[2], fixture[0], fixture[1]];
    expect(sortTrips(input).map((t) => t.date)).toEqual(["2026-10-26", "2026-10-27", "2026-10-28"]);
    expect(input[0]).toBe(fixture[2]);
  });

  it("returns each route once", () => {
    expect(uniqueRoutes(fixture)).toHaveLength(2);
  });
});

describe("getAutoIdleKwhPerHour", () => {
  it("returns the minute-weighted average idle rate", () => {
    // (1.2 × 30 + 1.0 × 60) / 90
    expect(getAutoIdleKwhPerHour(fixture)).toBeCloseTo(96 / 90);
  });

  it("falls back when there is no idle history", () => {
    expect(getAutoIdleKwhPerHour([])).toBe(defaultIdleKwhPerHour);
    expect(getAutoIdleKwhPerHour([], 2)).toBe(2);
  });
});

describe("summarizeTrips", () => {
  const summary = summarizeTrips(fixture);

  it("totals distance, cost and charged kWh", () => {
    expect(summary).toMatchObject({ totalDistance: 100, totalCost: 350, totalKwh: 50, totalIdleMinutes: 90 });
  });

  it("counts data, travel and charge days", () => {
    expect(summary).toMatchObject({ dataDays: 3, travelDays: 3, chargeDays: 2 });
  });

  it("derives per-km and per-kWh ratios", () => {
    expect(summary.bahtPerKm).toBeCloseTo(3.5);
    expect(summary.kwhPerKm).toBeCloseTo(0.5);
    expect(summary.avgBahtPerKwh).toBeCloseTo(7);
    expect(summary.avgCostPerDay).toBeCloseTo(350 / 3);
  });

  it("splits idle energy and cost out of the driving share", () => {
    // idle kWh = 0.5 × 1.2 + 1 × 1.0 = 1.6
    expect(summary.totalIdleKwh).toBeCloseTo(1.6);
    expect(summary.idleCost).toBeCloseTo(1.6 * 7);
    expect(summary.drivingKwh).toBeCloseTo(48.4);
    expect(summary.drivingCost).toBeCloseTo(350 - 11.2);
  });

  it("returns zeros, not NaN, for no data", () => {
    const empty = summarizeTrips([]);
    for (const value of Object.values(empty)) expect(value).toBe(0);
  });
});

describe("dailyChartData", () => {
  it("aggregates multiple trips on the same date", () => {
    const rows = dailyChartData([...fixture, trip({ date: "2026-10-26", distanceKm: 5 })]);
    expect(rows).toHaveLength(3);
    expect(rows[0]).toMatchObject({ date: "2026-10-26", distance: 45, cost: 200, kwh: 25 });
  });
});

describe("routeAnalysis", () => {
  const routes = routeAnalysis(fixture);
  const office = routes.find((r) => r.routeName === "บ้าน - ออฟฟิศ");
  const mall = routes.find((r) => r.routeName === "บ้าน - ห้าง");

  it("groups by route and sorts by total distance", () => {
    expect(routes.map((r) => r.routeName)).toEqual(["บ้าน - ออฟฟิศ", "บ้าน - ห้าง"]);
    expect(office).toMatchObject({ count: 2, totalDistance: 80, totalCost: 350, totalKwh: 50, avgDistance: 40 });
  });

  it("documents current semantics: charged kWh is attributed to the charging day's route", () => {
    // Known issue (roadmap P1): the mall route consumed energy but shows 0 kWh/km.
    expect(mall.kwhPerKm).toBe(0);
    expect(mall.efficiency).toBe("ปานกลาง");
    expect(office.kwhPerKm).toBeCloseTo(0.625);
    expect(office.efficiency).toBe("ใช้ไฟสูง");
  });
});

describe("chargerAnalysis", () => {
  it("includes only charging trips and sorts by total cost", () => {
    const rows = chargerAnalysis(fixture);
    expect(rows.map((r) => r.chargerName)).toEqual(["PTT", "EleXa"]);
    expect(rows[0]).toMatchObject({ sessions: 1, bahtPerKwh: 8, avgKwhPerSession: 25 });
  });
});

describe("monthlyHighlights", () => {
  it("picks most frequent, highest cost per km and most efficient routes", () => {
    expect(monthlyHighlights(fixture)).toEqual({
      mostFrequentRoute: "บ้าน - ออฟฟิศ",
      highestCostRoute: "บ้าน - ออฟฟิศ",
      mostEfficientRoute: "บ้าน - ออฟฟิศ",
    });
  });

  it("returns dashes when empty", () => {
    expect(monthlyHighlights([])).toEqual({ mostFrequentRoute: "-", highestCostRoute: "-", mostEfficientRoute: "-" });
  });
});

describe("week and month keys (Asia/Bangkok)", () => {
  it("runs in UTC+7", () => {
    expect(new Date("2026-10-26T00:00:00").getTimezoneOffset()).toBe(-420);
  });

  it("groups Monday through Sunday into one week", () => {
    const keys = ["2026-10-26", "2026-10-28", "2026-11-01"].map((d) => getWeekKey(d).start);
    expect(new Set(keys).size).toBe(1);
    expect(getWeekKey("2026-11-02").start).not.toBe(keys[0]);
  });

  it("labels the week Monday to Sunday", () => {
    expect(getWeekKey("2026-10-28").label).toBe("26 ต.ค. - 1 พ.ย. 2569");
  });

  // Known issue: toISOString() shifts local midnight to the previous UTC day, so start/end are one day early.
  // Remove `.fails` when getWeekKey is fixed.
  it.fails("returns the Monday date as start", () => {
    expect(getWeekKey("2026-10-28")).toMatchObject({ start: "2026-10-26", end: "2026-11-01" });
  });

  it("filters trips by week and month", () => {
    const weekStart = getWeekKey("2026-10-26").start;
    expect(filterByWeek(fixture, weekStart)).toHaveLength(3);
    expect(getMonthKey("2026-10-28")).toBe("2026-10");
    expect(filterByMonth(fixture, "2026-10")).toHaveLength(3);
    expect(filterByMonth(fixture, "2026-11")).toHaveLength(0);
  });
});

describe("forecastNextMonth", () => {
  it("multiplies per-route averages by the planned trip count", () => {
    const result = forecastNextMonth(fixture, [{ routeName: "บ้าน - ออฟฟิศ", plannedDays: 10, tripsPerDay: 2, count: 20 }], 30);
    expect(result.rows[0]).toMatchObject({ distance: 800, cost: 3500, kwh: 500 });
    expect(result.totalCost).toBe(3500);
    expect(result.avgCostPerDay).toBeCloseTo(3500 / 30);
    expect(result.avgCostPerKm).toBeCloseTo(4.375);
  });

  it("drops rows with zero count and yields zeros for unknown routes", () => {
    const result = forecastNextMonth(fixture, [
      { routeName: "บ้าน - ออฟฟิศ", count: 0 },
      { routeName: "ไม่มีในประวัติ", count: "5" },
    ], 0);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]).toMatchObject({ count: 5, distance: 0, cost: 0 });
    expect(result.avgCostPerDay).toBe(0);
  });
});
