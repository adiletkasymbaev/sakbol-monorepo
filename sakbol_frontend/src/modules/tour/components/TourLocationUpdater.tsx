import { useEffect, useRef } from "react";
import { tourService } from "../../../shared/services/tourService";
import useAuth from "../../../store/useAuth";
import { ProfileRoles } from "../../../shared/enums/ProfileRoles";
import { nativeBridge } from "../../../shared/services/nativeBridge";

/**
 * Компонент для фонового обновления местоположения во время активного тура.
 * В WebView получает координаты через JS-мост.
 * В браузере — через navigator.geolocation.
 */
export default function TourLocationUpdater() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const userId = useAuth((state) => state.userId);
  const userRole = useAuth((state) => state.userRole);

  const isTourist = userRole === ProfileRoles.TOURIST || userRole === ProfileRoles.USER;
  const isNative = nativeBridge.isNativeApp();

  useEffect(() => {
    if (!userId || !isTourist) return;

    // ── Нативный WebView ──
    if (isNative) {
      nativeBridge.requestCurrentLocation();

      const unsub = nativeBridge.onLocationUpdate((data) => {
        tourService.updateLocation({ latitude: data.latitude, longitude: data.longitude }).catch(() => {});
      });

      intervalRef.current = setInterval(() => {
        nativeBridge.requestCurrentLocation();
      }, 30000);

      return () => {
        unsub();
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }

    // ── Браузер ──
    const updateLocation = async () => {
      try {
        if (!navigator.geolocation) return;
        const position = await new Promise<GeolocationPosition>(
          (resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 0,
            });
          }
        );
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        await tourService.updateLocation({ latitude, longitude });
      } catch (error) {
        console.warn("Failed to update tour location:", error);
      }
    };

    updateLocation();
    intervalRef.current = setInterval(updateLocation, 30000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [userId, isTourist, isNative]);

  return null;
}
