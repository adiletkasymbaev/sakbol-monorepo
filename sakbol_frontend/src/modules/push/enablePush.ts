import { requestNotificationPermission } from "../../shared/services/pushService";

/**
 * Web Push был удалён из бэкенда (FCM только для Android/iOS).
 * Оставляем заглушку для будущего использования.
 */
export async function enablePushOnSiteEnter() {
  if (!("Notification" in window)) {
    console.warn("Notifications not supported");
    return;
  }

  try {
    if (Notification.permission !== "granted") {
      const res = await requestNotificationPermission();
      if (res !== "granted") {
        console.warn("Permission denied");
        return;
      }
    }
  } catch (e) {
    console.warn("enablePushOnSiteEnter error:", e);
  }
}