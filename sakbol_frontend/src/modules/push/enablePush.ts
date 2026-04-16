import { registerWebPush, registerServiceWorkerPush, requestNotificationPermission, getPushSubscriptionStatus } from "../../shared/services/pushService";

/**
 * Вызови при старте приложения.
 * Поведение:
 * - если permission granted → подписка/отправка на бэк
 * - если default/denied → пытаемся requestPermission() каждый заход (как ты хотел)
 */
export async function enablePushOnSiteEnter() {
  if (!("Notification" in window)) {
    console.warn("Notifications not supported");
    return;
  }

  try {
    // Проверяем текущее состояние
    const status = await getPushSubscriptionStatus();
    console.log("Push status check:", status);

    // Если уже подписаны - выходим
    if (status.permission === "granted" && status.subscribed) {
      console.log("Push already enabled");
      return;
    }

    // хотим "спрашивать каждый заход", если не granted
    if (status.permission !== "granted") {
      const res = await requestNotificationPermission();
      console.log("Permission result:", res);
      if (res !== "granted") {
        console.warn("Permission denied");
        return;
      }
    }

    // Пробуем зарегистрировать FCM Web Push (основной метод)
    console.log("Attempting FCM registration...");
    let success = await registerWebPush();
    
    if (success) {
      console.log("FCM push enabled successfully");
      return;
    }

    // Если не получилось, пробуем альтернативный метод с Service Worker
    console.log("FCM failed, attempting Service Worker registration...");
    success = await registerServiceWorkerPush();

    if (success) {
      console.log("Service Worker push enabled successfully");
    } else {
      console.warn("All push registration methods failed");
    }
  } catch (e) {
    console.warn("enablePushOnSiteEnter error:", e);
  }
}