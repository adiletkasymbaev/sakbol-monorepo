import { useEffect, useRef } from "react";
import { tourService } from "../../../shared/services/tourService";
import useAuth from "../../../store/useAuth";
import { ProfileRoles } from "../../../shared/enums/ProfileRoles";
import { getGeolocation } from "../../../shared/utils/getGeolocation";

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

    const updateLocation = async () => {
      try {
        await getGeolocation(
          {
            onSuccess: async (result) => {
              await tourService.updateLocation({
                latitude: result.latitude,
                longitude: result.longitude,
              });
            },
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
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

  return null;
}
