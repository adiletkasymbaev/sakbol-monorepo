import { useMap } from "react-leaflet";
import { useCallback, useEffect } from "react";
import { useLocation } from "../../../store/useLocation";

export function MapController({ defaultZoom = 14 }: { defaultZoom?: number }) {
  const map = useMap();
  const { geoLat, geoLon, focusTrigger } = useLocation();

  const focusOnLocation = useCallback(
    (lat: number, lon: number, zoom = defaultZoom) => {
      if (map) {
        map.flyTo([lat, lon], zoom, {
          animate: true,
          duration: 1.5,
        });
      }
    },
    [map, defaultZoom]
  );

  // 🔹 Фокус на локацию только по запросу (кнопка "Моё местоположение")
  useEffect(() => {
    if (focusTrigger > 0 && geoLat && geoLon) {
      focusOnLocation(geoLat, geoLon);
    }
  }, [focusTrigger, geoLat, geoLon, focusOnLocation]);

  return null;
}