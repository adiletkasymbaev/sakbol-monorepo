// @ts-nocheck
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { setLocation } from "../../../features/sos/presenceSlice";
import { useUpdateLocationMutation } from "../../../features/sos/locationApiSlice";

/**
 * Хук, который:
 *  - слушает глобальное событие window.onLocationUpdate (например, из Android WebView)
 *  - обновляет координаты в Redux store
 *  - вызывает API /location/update/ для синхронизации с сервером
 */
export function useSyncLocation() {
  const dispatch = useDispatch();
  const [updateLocation] = useUpdateLocationMutation();

  useEffect(() => {
    const handler = async (lat: number, lon: number) => {
      try {
        // 1️⃣ Обновляем Redux-стор
        dispatch(setLocation({ lat, lon }));

        // 2️⃣ Отправляем координаты на сервер
        await updateLocation({ latitude: lat, longitude: lon }).unwrap();
      } catch (e) {
        console.error("Ошибка при обновлении локации:", e);
      }
    };

    // Подписка на событие от Android WebView (или другого источника)
    window.onLocationUpdate = handler;

    // Очистка при размонтировании
    return () => {
      delete window.onLocationUpdate;
    };
  }, [dispatch, updateLocation]);
}