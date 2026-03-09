import { useEffect, useMemo, useRef } from "react";
import { addToast } from "@heroui/react";
import { ToastTypes } from "../../../shared/enums/ToastTypes";
import { useLocation } from "../../../store/useLocation";

type LocationSyncProps = {
  intervalMs?: number;
  enableContactsFetch?: boolean;
  enableMyLocationUpdate?: boolean;
  geolocationOptions?: PositionOptions;
};

type GeoErr = GeolocationPositionError & { message?: string };

function explainGeoError(e: any) {
  const code = (e as GeoErr)?.code;

  if (!window.isSecureContext) {
    return "Геолокация работает только по HTTPS (или на localhost).";
  }

  if (code === 1) {
    return "Доступ к геолокации запрещён (проверь разрешение сайта в браузере и настройки Windows).";
  }
  if (code === 2) {
    return "Местоположение недоступно (службы геолокации выключены или нет источника позиционирования).";
  }
  if (code === 3) {
    return "Таймаут получения геолокации (попробуй увеличить timeout или выключить high accuracy).";
  }

  return (e as any)?.message
    ? `Ошибка геолокации: ${(e as any).message}`
    : "Ошибка получения местоположения";
}

async function getGeoOnce(options?: PositionOptions): Promise<GeolocationPosition> {
  if (!window.isSecureContext) {
    throw new Error("Insecure context");
  }

  if (!("geolocation" in navigator) || !navigator.geolocation) {
    throw new Error("Геолокация не поддерживается");
  }

  // если есть Permissions API — заранее понимаем, что denied
  try {
    const perm = await (navigator as any).permissions?.query?.({ name: "geolocation" });
    if (perm?.state === "denied") {
      const err: any = new Error("Permission denied");
      err.code = 1;
      throw err;
    }
  } catch {
    // permissions API может быть недоступен — ок
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });
}

export default function LocationSync({
  intervalMs = 30_000,
  enableContactsFetch = true,
  enableMyLocationUpdate = true,
  // для ПК safer defaults: highAccuracy часто мешает, timeout лучше больше
  geolocationOptions = {
    enableHighAccuracy: false,
    timeout: 20_000,
    maximumAge: 60_000,
  },
}: LocationSyncProps) {
  const updateMyLocation = useLocation((s) => s.updateMyLocation);
  const fetchContactsLocations = useLocation((s) => s.fetchContactsLocations);
  const setGeoLocation = useLocation((s) => s.setGeoLocation);

  const isTickRunningRef = useRef(false);
  const isStoppedRef = useRef(false);
  const timerIdRef = useRef<number | null>(null);

  // стабилизируем options, чтобы useEffect не пересоздавался из-за нового объекта
  const stableGeoOptions = useMemo(
    () => geolocationOptions,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      geolocationOptions?.enableHighAccuracy,
      geolocationOptions?.timeout,
      geolocationOptions?.maximumAge,
    ]
  );

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
          const pos = await getGeoOnce(stableGeoOptions);
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;

          setGeoLocation(lat, lon);
          await updateMyLocation(lat, lon);
        }

        if (enableContactsFetch) {
          await fetchContactsLocations();
        }
      } catch (e: any) {
        console.warn("LocationSync geo error:", e);

        const msg = explainGeoError(e);

        // если denied — показываем и останавливаем навсегда (как у тебя было)
        if (e?.code === 1) {
          addToast({
            title: ToastTypes.ERR,
            description: msg,
            color: "danger",
          });
          stopTicks();
        } else {
          // остальные ошибки не спамим бесконечно: покажем 1 раз и продолжим
          // addToast({
          //   title: ToastTypes.ERR,
          //   description: msg,
          //   color: "danger",
          // });
        }
      } finally {
        isTickRunningRef.current = false;
      }
    };

    tick();
    timerIdRef.current = window.setInterval(tick, intervalMs);

    return () => {
      isMounted = false;
      stopTicks();
    };
  }, [
    intervalMs,
    enableContactsFetch,
    enableMyLocationUpdate,
    stableGeoOptions,
    updateMyLocation,
    fetchContactsLocations,
    setGeoLocation,
  ]);

  return null;
}