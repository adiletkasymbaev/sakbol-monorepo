import { useEffect, useState, useCallback } from "react";
import type { NotificationPermission } from "../services/pushService";
import {
  requestNotificationPermission,
  registerWebPush,
  registerServiceWorkerPush,
  onForegroundMessage,
  getPushSubscriptionStatus,
} from "../services/pushService";

interface UsePushNotificationsOptions {
  autoRegister?: boolean;
  onNotificationReceived?: (payload: any) => void;
}

interface UsePushNotificationsReturn {
  permission: NotificationPermission;
  isSubscribed: boolean;
  isLoading: boolean;
  error: string | null;
  requestPermission: () => Promise<boolean>;
  registerPush: () => Promise<boolean>;
  unregisterPush: () => Promise<void>;
  checkStatus: () => Promise<void>;
}

export function usePushNotifications(
  options: UsePushNotificationsOptions = {}
): UsePushNotificationsReturn {
  const { autoRegister = false, onNotificationReceived } = options;

  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Проверка текущего состояния подписки
  const checkStatus = useCallback(async () => {
    try {
      const status = await getPushSubscriptionStatus();
      setPermission(status.permission);
      setIsSubscribed(status.subscribed);
    } catch (e) {
      console.error("Failed to check push status:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Запрос разрешения
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      setError(null);
      const result = await requestNotificationPermission();
      setPermission(result);
      
      if (result === "granted") {
        return true;
      } else if (result === "denied") {
        setError("Уведомления заблокированы. Разрешите их в настройках браузера.");
      }
      
      return result === "granted";
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Неизвестная ошибка";
      setError(errorMessage);
      return false;
    }
  }, []);

  // Регистрация push-уведомлений
  const registerPush = useCallback(async (): Promise<boolean> => {
    try {
      setError(null);
      setIsLoading(true);

      // Сначала запрашиваем разрешение
      const permissionGranted = await requestPermission();
      if (!permissionGranted) {
        return false;
      }

      // Пробуем зарегистрировать FCM Web Push (основной метод)
      let success = await registerWebPush();
      
      if (!success) {
        // Если не получилось, пробуем альтернативный метод с Service Worker
        success = await registerServiceWorkerPush();
      }

      if (success) {
        setIsSubscribed(true);
        console.log("Push notifications registered successfully");
      } else {
        setError("Не удалось зарегистрировать push-уведомления");
      }

      return success;
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Неизвестная ошибка";
      setError(errorMessage);
      console.error("Failed to register push:", e);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [requestPermission]);

  // Отписка от push-уведомлений
  const unregisterPush = useCallback(async (): Promise<void> => {
    try {
      const { unregisterPush: doUnregister } = await import("../services/pushService");
      await doUnregister();
      setIsSubscribed(false);
      console.log("Push notifications unregistered");
    } catch (e) {
      console.error("Failed to unregister push:", e);
    }
  }, []);

  // Начальная инициализация
  useEffect(() => {
    checkStatus();

    // Если разрешение уже есть, но не подписаны - регистрируем
    if (autoRegister && permission === "granted" && !isSubscribed && !isLoading) {
      registerPush();
    }
  }, [autoRegister, checkStatus, permission, isSubscribed, isLoading]);

  // Прослушивание уведомлений в фоне
  useEffect(() => {
    if (!onNotificationReceived) return;

    const unsubscribe = onForegroundMessage(onNotificationReceived);
    return () => unsubscribe();
  }, [onNotificationReceived]);

  return {
    permission,
    isSubscribed,
    isLoading,
    error,
    requestPermission,
    registerPush,
    unregisterPush,
    checkStatus,
  };
}
