import { useEffect } from "react";
import { addToast } from "@heroui/react";
import { onForegroundMessage } from "../services/pushService";
import { ToastTypes } from "../enums/ToastTypes";

/**
 * Компонент слушает push-уведомления когда приложение открыто.
 * Показывает toast при получении уведомления.
 */
export default function PushNotificationListener() {
  useEffect(() => {
    const unsubscribe = onForegroundMessage((payload) => {
      const { title, body, data } = payload.notification || {};
      
      // Показываем toast уведомление
      addToast({
        title: title || "Sakbol",
        description: body || "Новое уведомление",
        color: data?.type === "alert_signal" ? "warning" : "primary",
        duration: 5000,
      });

      // Здесь можно добавить навигацию по данным из уведомления
      console.log("Push notification data:", data);
    });

    return () => unsubscribe();
  }, []);

  return null;
}
