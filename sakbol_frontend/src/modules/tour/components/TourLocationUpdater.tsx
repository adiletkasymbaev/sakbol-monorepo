import { useEffect, useRef } from "react";
import { tourService } from "../../../shared/services/tourService";
import useAuth from "../../../store/useAuth";
import { ProfileRoles } from "../../../shared/enums/ProfileRoles";
import { nativeBridge } from "../../../shared/services/nativeBridge";
import { nativeService } from "../../../shared/services/nativeService";

/**
 * Компонент для фонового обновления местоположения во время активного тура.
 * Отправляет координаты на бэкенд каждые 30 секунд.
 * Работает ТОЛЬКО для туристов (tourist/user) с активной ролью.
 */
export default function TourLocationUpdater() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const userId = useAuth((state) => state.userId);
  const userRole = useAuth((state) => state.userRole);

  const isTourist = userRole === ProfileRoles.TOURIST || userRole === ProfileRoles.USER;

  useEffect(() => {
    if (!userId || !isTourist) return;

    // ── Нативный WebView: слушаем push-обновления от Android ──
    if (nativeBridge.isNativeApp()) {
      // Запрашиваем текущую локацию сразу
      nativeBridge.requestCurrentLocation();

      const handleLocation = (data: { latitude: number; longitude: number }) => {
        tourService.updateLocation({ latitude: data.latitude, longitude: data.longitude }).catch(() => {});
      };

      // Подписываемся на обновления от nativeBridge
      nativeBridge.onLocationUpdate(handleLocation);

      // Также отправляем каждые 30 секунд (на случай если Android не шлёт автоматически)
      intervalRef.current = setInterval(() => {
        nativeBridge.requestCurrentLocation();
      }, 30000);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }

    // ── Браузер: стандартный polling ──
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
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [userId, isTourist]);

  return null; // Этот компонент ничего не рендерит
}
