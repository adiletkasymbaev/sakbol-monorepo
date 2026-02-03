import { ZONES_LS_KEY } from "./consts";

export function saveZonesToLS(featureGroup: L.FeatureGroup) {
  const fc = featureGroup.toGeoJSON() as GeoJSON.FeatureCollection;
  localStorage.setItem(ZONES_LS_KEY, JSON.stringify(fc));
}