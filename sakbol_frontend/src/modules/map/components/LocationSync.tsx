import { useEffect, useMemo, useRef } from "react";
import { addToast } from "@heroui/react";
import { ToastTypes } from "../../../shared/enums/ToastTypes";
import { useLocation } from "../../../store/useLocation";
import { tourService } from "../../../shared/services/tourService";
import { nativeBridge } from "../../../shared/services/nativeBridge";
import { getGeolocation } from "../../../shared/utils/getGeolocation";

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

  // ── Нативный WebView: push-обновления от Android (НЕ polling!) ──
  useEffect(() => {
    if (!enableMyLocationUpdate) return;
    if (!isNativeRef.current) return;

    console.log('[LocationSync] WebView mode: subscribing to native location updates');

    // Сразу просим Android прислать текущую локацию
    nativeBridge.requestCurrentLocation();

    const unsub = nativeBridge.onLocationUpdate((data) => {
      console.log('[LocationSync] native location update:', data);
      setGeoLocation(data.latitude, data.longitude);
      updateMyLocation(data.latitude, data.longitude).catch(() => {});
      tourService.updateLocation({ latitude: data.latitude, longitude: data.longitude }).catch(() => {});
    });

    return () => {
      console.log('[LocationSync] WebView mode: unsubscribing');
      unsub();
    };
  }, [enableMyLocationUpdate, setGeoLocation, updateMyLocation]);

  // ── Браузер: polling геолокации + контакты ──
  useEffect(() => {
    if (isNativeRef.current) return; // В WebView polling не нужен

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
          await getGeolocation(
            {
              onSuccess: async (result) => {
                setGeoLocation(result.latitude, result.longitude);
                await updateMyLocation(result.latitude, result.longitude);
                try {
                  await tourService.updateLocation({
                    latitude: result.latitude,
                    longitude: result.longitude,
                  });
                } catch {
                  // Silently ignore
                }
              },
              onError: (error) => {
                console.warn("LocationSync geo error:", error);
                if (error.code === 1) {
                  const msg = explainGeoError(error);
                  addToast({
                    title: ToastTypes.ERR,
                    description: msg,
                    color: "danger",
                  });
                  stopTicks();
                }
              },
            },
            stableGeoOptions
          );
        }
      } catch (e: any) {
        console.warn("LocationSync geo error:", e);
        const msg = explainGeoError(e);
        if (e?.code === 1) {
          addToast({
            title: ToastTypes.ERR,
            description: msg,
            color: "danger",
          });
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
