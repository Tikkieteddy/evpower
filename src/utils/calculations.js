const toNumber = (value) => Number(value) || 0;
export const defaultIdleKwhPerHour = 1.2;
export const chargerOptions = [
  "PTT",
  "EleXa",
  "ReverSharger",
  "PEA VOLTA",
  "EVolt",
  "MEA",
  "Spark",
  "EA Anywhere",
  "TOCharge",
  "iGreen+",
];

export const formatNumber = (value, digits = 2) =>
  new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(Number.isFinite(value) ? value : 0);

export const formatBaht = (value, digits = 0) =>
  new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(Number.isFinite(value) ? value : 0);

export const safeDivide = (value, divisor) => (divisor > 0 ? value / divisor : 0);

export const normalizeTrip = (trip) => ({
  ...trip,
  routeName: trip.routeName?.trim() || "ไม่ระบุเส้นทาง",
  chargerName: trip.hasCharge ? trip.chargerName?.trim() || "ไม่ระบุเครื่องชาร์จ" : "",
  distanceKm: toNumber(trip.distanceKm),
  chargeCost: trip.hasCharge ? toNumber(trip.chargeCost) : 0,
  kwh: trip.hasCharge ? toNumber(trip.kwh) : 0,
  idleMinutes: toNumber(trip.idleMinutes),
  idleKwhPerHour: toNumber(trip.idleKwhPerHour) || defaultIdleKwhPerHour,
  idleKwh: safeDivide(toNumber(trip.idleMinutes), 60) * (toNumber(trip.idleKwhPerHour) || defaultIdleKwhPerHour),
});

export const sortTrips = (trips) =>
  [...trips].map(normalizeTrip).sort((a, b) => a.date.localeCompare(b.date));

export const uniqueRoutes = (trips) =>
  [...new Set(sortTrips(trips).map((trip) => trip.routeName))].sort((a, b) =>
    a.localeCompare(b, "th"),
  );

export const getAutoIdleKwhPerHour = (trips, fallback = defaultIdleKwhPerHour) => {
  const candidates = sortTrips(trips).filter((trip) => trip.idleMinutes > 0 && trip.idleKwhPerHour > 0);
  const totalMinutes = candidates.reduce((sum, trip) => sum + trip.idleMinutes, 0);
  const weightedRate = candidates.reduce((sum, trip) => sum + trip.idleKwhPerHour * trip.idleMinutes, 0);
  return safeDivide(weightedRate, totalMinutes) || fallback;
};

export const getWeekKey = (dateString) => {
  const date = new Date(`${dateString}T00:00:00`);
  const day = date.getDay() || 7;
  const monday = new Date(date);
  monday.setDate(date.getDate() - day + 1);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    start: monday.toISOString().slice(0, 10),
    end: sunday.toISOString().slice(0, 10),
    label: `${monday.toLocaleDateString("th-TH", { day: "numeric", month: "short" })} - ${sunday.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}`,
  };
};

export const getMonthKey = (dateString) => dateString.slice(0, 7);

export const summarizeTrips = (trips) => {
  const normalized = sortTrips(trips);
  const totalDistance = normalized.reduce((sum, trip) => sum + trip.distanceKm, 0);
  const totalCost = normalized.reduce((sum, trip) => sum + trip.chargeCost, 0);
  const totalKwh = normalized.reduce((sum, trip) => sum + trip.kwh, 0);
  const totalIdleMinutes = normalized.reduce((sum, trip) => sum + trip.idleMinutes, 0);
  const totalIdleKwh = normalized.reduce((sum, trip) => sum + trip.idleKwh, 0);
  const dataDays = new Set(normalized.map((trip) => trip.date)).size;
  const travelDays = new Set(normalized.filter((trip) => trip.distanceKm > 0).map((trip) => trip.date)).size;
  const chargeDays = new Set(normalized.filter((trip) => trip.hasCharge).map((trip) => trip.date)).size;
  const avgBahtPerKwh = safeDivide(totalCost, totalKwh);
  const idleCost = totalIdleKwh * avgBahtPerKwh;
  const drivingKwh = Math.max(totalKwh - totalIdleKwh, 0);
  const drivingCost = Math.max(totalCost - idleCost, 0);

  return {
    totalDistance,
    totalCost,
    totalKwh,
    totalIdleMinutes,
    totalIdleKwh,
    idleCost,
    drivingKwh,
    drivingCost,
    dataDays,
    travelDays,
    chargeDays,
    bahtPerKm: safeDivide(totalCost, totalDistance),
    kwhPerKm: safeDivide(totalKwh, totalDistance),
    drivingBahtPerKm: safeDivide(drivingCost, totalDistance),
    drivingKwhPerKm: safeDivide(drivingKwh, totalDistance),
    avgCostPerDay: safeDivide(totalCost, dataDays),
    avgDistancePerDay: safeDivide(totalDistance, dataDays),
    avgBahtPerKwh,
  };
};

export const dailyChartData = (trips) =>
  Object.values(
    sortTrips(trips).reduce((days, trip) => {
      days[trip.date] ||= { date: trip.date, cost: 0, distance: 0, kwh: 0, idleKwh: 0 };
      days[trip.date].cost += trip.chargeCost;
      days[trip.date].distance += trip.distanceKm;
      days[trip.date].kwh += trip.kwh;
      days[trip.date].idleKwh += trip.idleKwh;
      return days;
    }, {}),
  );

export const routeAnalysis = (trips) => {
  const summary = summarizeTrips(trips);
  const averageKwhPerKm = summary.kwhPerKm;
  const routes = Object.values(
    sortTrips(trips).reduce((groups, trip) => {
      groups[trip.routeName] ||= {
        routeName: trip.routeName,
        count: 0,
        totalDistance: 0,
        totalCost: 0,
        totalKwh: 0,
        totalIdleMinutes: 0,
        totalIdleKwh: 0,
      };
      groups[trip.routeName].count += 1;
      groups[trip.routeName].totalDistance += trip.distanceKm;
      groups[trip.routeName].totalCost += trip.chargeCost;
      groups[trip.routeName].totalKwh += trip.kwh;
      groups[trip.routeName].totalIdleMinutes += trip.idleMinutes;
      groups[trip.routeName].totalIdleKwh += trip.idleKwh;
      return groups;
    }, {}),
  ).map((route) => {
    const bahtPerKm = safeDivide(route.totalCost, route.totalDistance);
    const kwhPerKm = safeDivide(route.totalKwh, route.totalDistance);
    let efficiency = "ปานกลาง";
    if (kwhPerKm > 0 && averageKwhPerKm > 0) {
      if (kwhPerKm <= averageKwhPerKm * 0.85) efficiency = "ประหยัด";
      if (kwhPerKm >= averageKwhPerKm * 1.15) efficiency = "ใช้ไฟสูง";
    }

    return {
      ...route,
      avgDistance: safeDivide(route.totalDistance, route.count),
      avgCost: safeDivide(route.totalCost, route.count),
      avgKwh: safeDivide(route.totalKwh, route.count),
      avgIdleMinutes: safeDivide(route.totalIdleMinutes, route.count),
      avgIdleKwh: safeDivide(route.totalIdleKwh, route.count),
      bahtPerKm,
      kwhPerKm,
      efficiency,
    };
  });

  return routes.sort((a, b) => b.totalDistance - a.totalDistance);
};

export const chargerAnalysis = (trips) => {
  const rows = Object.values(
    sortTrips(trips)
      .filter((trip) => trip.hasCharge)
      .reduce((groups, trip) => {
        groups[trip.chargerName] ||= {
          chargerName: trip.chargerName,
          sessions: 0,
          totalCost: 0,
          totalKwh: 0,
          totalDistance: 0,
          totalIdleKwh: 0,
        };
        groups[trip.chargerName].sessions += 1;
        groups[trip.chargerName].totalCost += trip.chargeCost;
        groups[trip.chargerName].totalKwh += trip.kwh;
        groups[trip.chargerName].totalDistance += trip.distanceKm;
        groups[trip.chargerName].totalIdleKwh += trip.idleKwh;
        return groups;
      }, {}),
  ).map((charger) => ({
    ...charger,
    bahtPerKwh: safeDivide(charger.totalCost, charger.totalKwh),
    bahtPerKm: safeDivide(charger.totalCost, charger.totalDistance),
    avgCostPerSession: safeDivide(charger.totalCost, charger.sessions),
    avgKwhPerSession: safeDivide(charger.totalKwh, charger.sessions),
  }));

  return rows.sort((a, b) => b.totalCost - a.totalCost);
};

export const monthlyHighlights = (trips) => {
  const routes = routeAnalysis(trips);
  const withCost = routes.filter((route) => route.totalCost > 0 && route.totalDistance > 0);
  return {
    mostFrequentRoute: [...routes].sort((a, b) => b.count - a.count)[0]?.routeName || "-",
    highestCostRoute: [...withCost].sort((a, b) => b.bahtPerKm - a.bahtPerKm)[0]?.routeName || "-",
    mostEfficientRoute:
      routes.filter((route) => route.kwhPerKm > 0).sort((a, b) => a.kwhPerKm - b.kwhPerKm)[0]?.routeName || "-",
  };
};

export const filterByWeek = (trips, weekStart) =>
  sortTrips(trips).filter((trip) => getWeekKey(trip.date).start === weekStart);

export const filterByMonth = (trips, monthKey) =>
  sortTrips(trips).filter((trip) => getMonthKey(trip.date) === monthKey);

export const forecastNextMonth = (trips, forecastRows, expectedDays) => {
  const routes = routeAnalysis(trips);
  const routeMap = new Map(routes.map((route) => [route.routeName, route]));
  const rows = forecastRows
    .map((row) => {
      const route = routeMap.get(row.routeName);
      const count = toNumber(row.count);
      return {
        routeName: row.routeName,
        count,
        distance: (route?.avgDistance || 0) * count,
        cost: (route?.avgCost || 0) * count,
        kwh: (route?.avgKwh || 0) * count,
        idleKwh: (route?.avgIdleKwh || 0) * count,
        idleMinutes: (route?.avgIdleMinutes || 0) * count,
      };
    })
    .filter((row) => row.count > 0);

  const totalDistance = rows.reduce((sum, row) => sum + row.distance, 0);
  const totalCost = rows.reduce((sum, row) => sum + row.cost, 0);
  const totalKwh = rows.reduce((sum, row) => sum + row.kwh, 0);
  const totalIdleKwh = rows.reduce((sum, row) => sum + row.idleKwh, 0);
  const totalIdleMinutes = rows.reduce((sum, row) => sum + row.idleMinutes, 0);

  return {
    rows,
    totalDistance,
    totalCost,
    totalKwh,
    totalIdleKwh,
    totalIdleMinutes,
    avgCostPerDay: safeDivide(totalCost, toNumber(expectedDays)),
    avgCostPerKm: safeDivide(totalCost, totalDistance),
    avgKwhPerKm: safeDivide(totalKwh, totalDistance),
  };
};
