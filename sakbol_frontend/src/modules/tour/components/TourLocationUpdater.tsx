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

    // Функция получения и отправки геолокации
    const updateLocation = async () => {
      try {
        let latitude: number;
        let longitude: number;

        if (nativeBridge.isNativeApp()) {
          const nativeLoc = nativeService.getLastLocation();
          if (!nativeLoc) return;
          latitude = nativeLoc.latitude;
          longitude = nativeLoc.longitude;
        } else {
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
          latitude = position.coords.latitude;
          longitude = position.coords.longitude;
        }

        // Отправляем на бэкенд
        await tourService.updateLocation({ latitude, longitude });
      } catch (error) {
        // Тихая ошибка - не спамим пользователя
        console.warn("Failed to update tour location:", error);
      }
    };

    // Первое обновление сразу
    updateLocation();

    // Затем каждые 30 секунд
    intervalRef.current = setInterval(updateLocation, 30000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [userId, isTourist]);

  return null; // Этот компонент ничего не рендерит
}
