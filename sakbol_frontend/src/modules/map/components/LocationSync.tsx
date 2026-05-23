import { useEffect, useMemo, useRef } from "react";
import { useLocation } from "../../../store/useLocation";
import { tourService } from "../../../shared/services/tourService";
import { getGeolocation } from "../../../shared/utils/getGeolocation";

type LocationSyncProps = {
  intervalMs?: number;
  enableContactsFetch?: boolean;
  enableMyLocationUpdate?: boolean;
  geolocationOptions?: PositionOptions;
};

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

  const stableGeoOptions = useMemo(
    () => geolocationOptions,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      geolocationOptions?.enableHighAccuracy,
      geolocationOptions?.timeout,
      geolocationOptions?.maximumAge,
    ]
  );

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
            },
            stableGeoOptions
          );
        }
      } catch {
        // Ignore geolocation errors during polling
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
