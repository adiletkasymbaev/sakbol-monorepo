import { useMap } from "react-leaflet";
import { useCallback, useEffect, useRef } from "react";
import { useLocation } from "../../../store/useLocation";
import { useGeolocationUpdate } from "../hooks/useGeolocationUpdate";
import type { GeolocationResult } from "../../../shared/utils/getGeolocation";

interface Props {
  onLocationFound?: (result: GeolocationResult) => void;
  defaultZoom?: number;
}

export function MapController({ onLocationFound, defaultZoom = 14 }: Props) {
  const map = useMap(); // ✅ Теперь это работает — мы внутри MapContainer
  const { geoLat, geoLon } = useLocation();
  const { updateGeolocation } = useGeolocationUpdate();
  const hasAutoFocusedRef = useRef(false);

  const focusOnLocation = useCallback(
    (lat: number, lon: number, zoom = defaultZoom) => {
      map.flyTo([lat, lon], zoom, {
        animate: true,
        duration: 1.5,
      });
    },
    [map, defaultZoom]
  );

  // 🔹 Авто-фокус при наличии координат в сторе
  useEffect(() => {
    if (geoLat && geoLon && !hasAutoFocusedRef.current) {
      focusOnLocation(geoLat, geoLon);
      hasAutoFocusedRef.current = true;
    }
  }, [geoLat, geoLon, focusOnLocation]);

  // 🔹 Запрос геолокации при первом рендере, если координат нет
  useEffect(() => {
    if (!geoLat || !geoLon) {
      updateGeolocation({
        enableHighAccuracy: false,
        timeout: 20_000,
        maximumAge: 0,
      }).then((result) => {
        if (result.success && result.data) {
          focusOnLocation(result.data.latitude, result.data.longitude);
          onLocationFound?.(result.data);
          hasAutoFocusedRef.current = true;
        }
      });
    }
  }, []);

  // 🔹 Экспортируем функцию фокуса для внешних вызовов (опционально)
  useEffect(() => {
    // Сохраняем ссылку на функцию в window для отладки (удалите в продакшене)
    // @ts-ignore
    window.__focusOnUserLocation = () => {
      if (geoLat && geoLon) {
        focusOnLocation(geoLat, geoLon);
      }
    };
    return () => {
      // @ts-ignore
      delete window.__focusOnUserLocation;
    };
  }, [focusOnLocation, geoLat, geoLon]);

  return null; // Этот компонент ничего не рендерит, только управляет картой
}