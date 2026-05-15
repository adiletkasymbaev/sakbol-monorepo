import { useEffect, useRef } from "react";
import { tourService } from "../../../shared/services/tourService";
import useAuth from "../../../store/useAuth";
import { ProfileRoles } from "../../../shared/enums/ProfileRoles";
import { nativeBridge } from "../../../shared/services/nativeBridge";
import { getGeolocation } from "../../../shared/utils/getGeolocation";

/**
 * Компонент для фонового обновления местоположения во время активного тура.
 * В WebView получает координаты через JS-мост push-обновления.
 * В браузере — через getGeolocation polling.
 */
export default function TourLocationUpdater() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const userId = useAuth((state) => state.userId);
  const userRole = useAuth((state) => state.userRole);

  const isTourist = userRole === ProfileRoles.TOURIST || userRole === ProfileRoles.USER;
  const isNative = nativeBridge.isNativeApp();

  useEffect(() => {
    if (!userId || !isTourist) return;

    // ── Нативный WebView: push-обновления ──
    if (isNative) {
      console.log('[TourLocationUpdater] WebView mode');

      // Сразу запрашиваем текущую локацию
      nativeBridge.requestCurrentLocation();

      const unsub = nativeBridge.onLocationUpdate((data) => {
        console.log('[TourLocationUpdater] native location:', data);
        tourService.updateLocation({ latitude: data.latitude, longitude: data.longitude }).catch(() => {});
      });

      // Каждые 30 сек просим Android прислать актуальную
      intervalRef.current = setInterval(() => {
        nativeBridge.requestCurrentLocation();
      }, 30000);

      return () => {
        console.log('[TourLocationUpdater] cleanup WebView');
        unsub();
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }

    // ── Браузер: polling ──
    console.log('[TourLocationUpdater] Browser mode');
    const updateLocation = async () => {
      try {
        await getGeolocation(
          {
            onSuccess: async (result) => {
              await tourService.updateLocation({ latitude: result.latitude, longitude: result.longitude });
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
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [userId, isTourist, isNative]);

  return null;
}
