// Service Worker для обработки push-уведомлений
const CACHE_NAME = "sakbol-cache-v1";

console.log("Service Worker loading...");

// Обработка push-уведомлений
self.addEventListener("push", (event) => {
  console.log("Push received:", event);

  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
      console.log("Push data:", data);
    } catch (e) {
      data = { title: "Sakbol", body: event.data.text() };
    }
  }

  const title = data.title || "Sakbol";
  const options = {
    body: data.body || "Новое уведомление",
    icon: "/icon-192.png",
    badge: "/badge-192.png",
    vibrate: [200, 100, 200],
    data: data.data || {},
    actions: [
      { action: "view", title: "Открыть" },
      { action: "dismiss", title: "Закрыть" },
    ],
    tag: data.data?.alert_signal_id ? `alert-${data.data.alert_signal_id}` : "sakbol-notification",
    requireInteraction: true,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Обработка клика по уведомлению
self.addEventListener("notificationclick", (event) => {
  console.log("Notification click:", event);
  event.notification.close();

  if (event.action === "dismiss") {
    return;
  }

  // Открываем приложение или переходим на нужную страницу
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Если есть открытая вкладка - фокусируем её
      for (const client of clientList) {
        if (client.url === "/" && "focus" in client) {
          return client.focus();
        }
      }
      // Иначе открываем новую
      if (clients.openWindow) {
        return clients.openWindow("/");
      }
    })
  );
});

// Установка Service Worker
self.addEventListener("install", (event) => {
  console.log("Service Worker installing...");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(["/", "/icon-192.png", "/badge-192.png"]);
    })
  );
  self.skipWaiting();
});

// Активация Service Worker
self.addEventListener("activate", (event) => {
  console.log("Service Worker activated");
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});
