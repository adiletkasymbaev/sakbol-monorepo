import { useEffect, useRef } from "react";
import { useLocation } from "../../../store/useLocation";
import { addToast } from "@heroui/react";
import { ToastTypes } from "../../../shared/enums/ToastTypes";

type LocationSyncProps = {
  intervalMs?: number;
  enableContactsFetch?: boolean;
  enableMyLocationUpdate?: boolean;
  geolocationOptions?: PositionOptions;
};

function getGeoOnce(options?: PositionOptions) {
  return new Promise<GeolocationPosition>((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Геолокация не поддерживается"));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });
}

export default function LocationSync({
  intervalMs = 30_000,
  enableContactsFetch = true,
  enableMyLocationUpdate = true,
  geolocationOptions = {
    enableHighAccuracy: true,
    timeout: 10_000,
    maximumAge: 10_000,
  },
}: LocationSyncProps) {
  const updateMyLocation = useLocation((s) => s.updateMyLocation);
  const fetchContactsLocations = useLocation((s) => s.fetchContactsLocations);
  const setGeoLocation = useLocation((s) => s.setGeoLocation);

  const isTickRunningRef = useRef(false);
  const isStoppedRef = useRef(false); // ⬅️ флаг полной остановки
  const timerIdRef = useRef<number | null>(null);

  useEffect(() => {
    let isMounted = true;

    const stopTicks = () => {
      isStoppedRef.current = true;

      if (timerIdRef.current) {
        window.clearInterval(timerIdRef.current);
        timerIdRef.current = null;
      }
    };

    const tick = async () => {
      if (!isMounted) return;
      if (isStoppedRef.current) return;
      if (isTickRunningRef.current) return;

      isTickRunningRef.current = true;

      try {
        if (enableMyLocationUpdate) {
          const pos = await getGeoOnce(geolocationOptions);

          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;

          setGeoLocation(lat, lon);
          await updateMyLocation(lat, lon);
        }

        if (enableContactsFetch) {
          await fetchContactsLocations();
        }
      } catch (e: any) {
        // 🚫 Пользователь запретил доступ
        if (e?.code === 1) {
          addToast({
            title: ToastTypes.ERR,
            description: "Доступ к геолокации запрещён. Обновление остановлено.",
            color: "danger",
          });

          stopTicks();
        } else {
          addToast({
            title: ToastTypes.ERR,
            description: "Ошибка получения местоположения",
            color: "danger",
          });
        }
      } finally {
        isTickRunningRef.current = false;
      }
    };

    // первый запуск
    tick();

    // интервал
    timerIdRef.current = window.setInterval(tick, intervalMs);

    return () => {
      isMounted = false;
      stopTicks();
    };
  }, [
    intervalMs,
    enableContactsFetch,
    enableMyLocationUpdate,
    geolocationOptions,
    updateMyLocation,
    fetchContactsLocations,
    setGeoLocation,
  ]);

  return null;
}