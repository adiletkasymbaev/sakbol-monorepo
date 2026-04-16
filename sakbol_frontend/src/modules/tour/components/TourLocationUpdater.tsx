import { useEffect, useRef } from "react";
import { tourService } from "../../../shared/services/tourService";
import useAuth from "../../../store/useAuth";

/**
 * Компонент для фонового обновления местоположения во время активного тура.
 * Отправляет координаты на бэкенд каждые 30 секунд.
 */
export default function TourLocationUpdater() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const userId = useAuth((state) => state.userId);

  useEffect(() => {
    if (!userId) return;

    // Функция получения и отправки геолокации
    const updateLocation = async () => {
      if (!navigator.geolocation) return;

      try {
        const position = await new Promise<GeolocationPosition>(
          (resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 0,
            });
          }
        );

        const { latitude, longitude } = position.coords;

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
  }, [userId]);

  return null; // Этот компонент ничего не рендерит
}
