import { useEffect, useMemo, useRef } from "react";
import { addToast } from "@heroui/react";
import { ToastTypes } from "../../../shared/enums/ToastTypes";
import { useLocation } from "../../../store/useLocation";
import { tourService } from "../../../shared/services/tourService";
import { nativeBridge } from "../../../shared/services/nativeBridge";

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
  const isNativeRef = useRef(nativeBridge.isNativeApp());

  const stableGeoOptions = useMemo(
    () => geolocationOptions,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      geolocationOptions?.enableHighAccuracy,
      geolocationOptions?.timeout,
      geolocationOptions?.maximumAge,
    ]
  );

  // ── Нативный WebView: push-обновления от Android ──
  useEffect(() => {
    if (!enableMyLocationUpdate) return;
    if (!isNativeRef.current) return;

    // Запрашиваем текущую локацию сразу
    nativeBridge.requestCurrentLocation();

    const unsub = nativeBridge.onLocationUpdate((data) => {
      setGeoLocation(data.latitude, data.longitude);
      // nativeService уже отправляет на /general/locations_module/update/
      tourService.updateLocation({ latitude: data.latitude, longitude: data.longitude }).catch(() => {});
    });

    return unsub;
  }, [enableMyLocationUpdate, setGeoLocation]);

  // ── Браузер: polling геолокации + контакты ──
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
        if (enableMyLocationUpdate && !isNativeRef.current) {
          const pos = await getGeoOnce(stableGeoOptions);
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;

          setGeoLocation(lat, lon);
          await updateMyLocation(lat, lon);
          try {
            await tourService.updateLocation({ latitude: lat, longitude: lon });
          } catch {
            // Silently ignore — user may not be in a tour group
          }
        }
      } catch (e: any) {
        console.warn("LocationSync geo error:", e);
        const msg = explainGeoError(e);
        if (e?.code === 1) {
          addToast({ title: ToastTypes.ERR, description: msg, color: "danger" });
          stopTicks();
        }
      }

      try {
        if (enableContactsFetch) {
          await fetchContactsLocations();
        }
      } catch {
        // Silently ignore contact fetch errors
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
