// tikkieteddielab: local route preset storage for daily log autofill.
export const routePresetsStorageKey = "tikkieteddielab-evpower-route-presets-v1";

export const defaultRoutePresets = [
  { id: "route-home-office", routeName: "บ้าน - ออฟฟิศ", distanceKm: 42.00 },
  { id: "route-home-mall", routeName: "บ้าน - ห้าง", distanceKm: 28.00 },
  { id: "route-office-client", routeName: "ออฟฟิศ - ลูกค้า", distanceKm: 65.00 },
  { id: "route-home-school", routeName: "บ้าน - โรงเรียน", distanceKm: 18.00 },
];

export const getRoutePresets = () => {
  try {
    const saved = localStorage.getItem(routePresetsStorageKey);
    if (!saved) {
      localStorage.setItem(routePresetsStorageKey, JSON.stringify(defaultRoutePresets));
      return defaultRoutePresets;
    }
    const routes = JSON.parse(saved);
    return Array.isArray(routes) ? routes : defaultRoutePresets;
  } catch {
    return defaultRoutePresets;
  }
};

export const saveRoutePresets = (routes) => {
  localStorage.setItem(routePresetsStorageKey, JSON.stringify(routes));
};

export const addRoutePreset = ({ routeName, distanceKm }) => {
  const name = routeName.trim();
  const distance = Number(distanceKm);
  if (!name || !Number.isFinite(distance) || distance < 0) {
    return { ok: false, message: "กรุณากรอกชื่อเส้นทางและระยะทางให้ถูกต้อง" };
  }
  const routes = getRoutePresets();
  if (routes.some((route) => route.routeName.toLowerCase() === name.toLowerCase())) {
    return { ok: false, message: "มีเส้นทางนี้อยู่แล้ว" };
  }
  const nextRoutes = [...routes, { id: crypto.randomUUID(), routeName: name, distanceKm: distance }];
  saveRoutePresets(nextRoutes);
  return { ok: true, routes: nextRoutes, message: "เพิ่มเส้นทางแล้ว" };
};

export const deleteRoutePreset = (id) => {
  const nextRoutes = getRoutePresets().filter((route) => route.id !== id);
  saveRoutePresets(nextRoutes);
  return nextRoutes;
};
