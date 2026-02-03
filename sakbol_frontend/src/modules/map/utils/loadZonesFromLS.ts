import { ZONES_LS_KEY } from "./consts";

export function loadZonesFromLS(): GeoJSON.FeatureCollection | null {
  const raw = localStorage.getItem(ZONES_LS_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as GeoJSON.FeatureCollection;
  } catch {
    return null;
  }
}