import { initializeApp, type FirebaseApp } from "firebase/app";
import { getMessaging, getToken, onMessage, type Messaging } from "firebase/messaging";
import api from "./axios";

export type NotificationPermission = "granted" | "denied" | "default";

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyC5IhVzbXk77mKDyrbkAnfMmNWLdWaJ3-Y",
  authDomain: "sakbol-notifications.firebaseapp.com",
  projectId: "sakbol-notifications",
  storageBucket: "sakbol-notifications.firebasestorage.app",
  messagingSenderId: "640795462285",
  appId: "1:640795462285:web:f6d87a477bcb1c98dcb0c4",
  measurementId: "G-LNQHVLNENY",
};

// VAPID Public Key из private_key.pem (бэкенд)
const VAPID_PUBLIC_KEY = "BFA8SvteWJDoYwmF4wfJLTIfZRAmr7_EH6cXW2QJIcQ0-yXmzU5lpV6JocGh5CGQOOjKhc9yLuoFRu7-tEZedNA";

// URL бэкенда для API запросов (можно переопределить через env)
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:8000";

let firebaseApp: FirebaseApp | null = null;
let messaging: Messaging | null = null;

// Инициализация Firebase
function initFirebase(): FirebaseApp {
  if (!firebaseApp) {
    firebaseApp = initializeApp(FIREBASE_CONFIG);
  }
  return firebaseApp;
}

// Инициализация Messaging (только в браузере с HTTPS/localhost)
function initMessaging(): Messaging | null {
  if (typeof window === "undefined") return null;
  
  // Проверяем поддержку Service Worker и Push API
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    console.warn("Push notifications not supported");
    return null;
  }

  try {
    const app = initFirebase();
    messaging = getMessaging(app);
    return messaging;
  } catch (e) {
    console.error("Failed to initialize Firebase Messaging:", e);
    return null;
  }
}

// Запрос разрешения на уведомления
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!("Notification" in window)) {
    console.warn("Notifications not supported");
    return "denied";
  }

  const permission = await Notification.requestPermission();
  console.log("Notification permission:", permission);
  
  return permission;
}

// Регистрация подписки на Web Push через FCM
export async function registerWebPush(): Promise<boolean> {
  try {
    console.log("[FCM Push] Starting registration...");
    
    const permission = await requestNotificationPermission();
    console.log("[FCM Push] Permission result:", permission);
    
    if (permission !== "granted") {
      console.log("[FCM Push] Permission not granted");
      return false;
    }

    const msg = initMessaging();
    console.log("[FCM Push] Messaging initialized:", !!msg);
    
    if (!msg) {
      console.warn("[FCM Push] Firebase Messaging not available");
      return false;
    }

    console.log("[FCM Push] Getting FCM token...");
    // Получаем токен FCM для Web
    const token = await getToken(msg, {
      vapidKey: VAPID_PUBLIC_KEY,
    });

    console.log("[FCM Push] Token received:", token ? token.slice(0, 30) + "..." : "NONE");
    
    if (!token) {
      console.warn("[FCM Push] No FCM token received");
      return false;
    }

    console.log("[FCM Push] Registering token on backend...");
    // Регистрируем токен на бэкенде как FCM устройство
    const response = await api.post("/push/fcm/register/", {
      registration_id: token,
      device_type: "web",
    });
    
    console.log("[FCM Push] Backend response:", response.data);
    console.log("[FCM Push] Web push registered successfully via FCM");
    return true;
  } catch (error) {
    console.error("[FCM Push] Registration failed:", error);
    return false;
  }
}

// Регистрация Service Worker и подписка на Web Push (альтернативный метод)
export async function registerServiceWorkerPush(): Promise<boolean> {
  try {
    const permission = await requestNotificationPermission();
    if (permission !== "granted") {
      console.log("Notification permission not granted");
      return false;
    }

    // Используем захардкоженный VAPID публичный ключ (не нужно обращаться к бэкенду)
    const publicKey = VAPID_PUBLIC_KEY;
    console.log("[SW Push] Using VAPID public key:", publicKey.slice(0, 30) + "...");

    // Регистрируем Service Worker
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    });

    // Проверяем существующую подписку
    const existingSubscription = await registration.pushManager.getSubscription();
    if (existingSubscription) {
      console.log("[SW Push] Existing push subscription found, skipping registration");
      return true;
    }

    // Подписываемся на push
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });

    // Проверяем наличие ключей
    const p256dhKey = subscription.getKey("p256dh");
    const authKey = subscription.getKey("auth");

    if (!p256dhKey || !authKey) {
      console.error("[SW Push] Missing subscription keys");
      return false;
    }

    const p256dhBase64 = arrayBufferToBase64(p256dhKey);
    const authBase64 = arrayBufferToBase64(authKey);

    console.log("[SW Push] Push subscription keys:", {
      p256dh: p256dhBase64.slice(0, 30) + "...",
      auth: authBase64.slice(0, 30) + "...",
    });

    // Отправляем подписку на бэкенд
    try {
      await api.post("/push/subscribe/", {
        endpoint: subscription.endpoint,
        p256dh: p256dhBase64,
        auth: authBase64,
      });
      console.log("[SW Push] Service Worker push registered successfully on backend");
    } catch (backendError) {
      console.warn("[SW Push] Backend subscription failed, but local subscription succeeded:", backendError);
      // Локальная подписка успешна, даже если бэкенд недоступен
    }

    return true;
  } catch (error) {
    console.error("[SW Push] Failed to register service worker push:", error);
    return false;
  }
}

// Прослушивание входящих уведомлений когда приложение открыто
export function onForegroundMessage(callback: (payload: any) => void): () => void {
  const msg = initMessaging();
  if (!msg) {
    console.warn("Cannot listen for foreground messages - messaging not initialized");
    return () => {};
  }

  const unsubscribe = onMessage(msg, (payload) => {
    console.log("Foreground push notification received:", payload);
    callback(payload);
  });

  return unsubscribe;
}

// Вспомогательная функция: конвертация base64 в Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Вспомогательная функция: конвертация ArrayBuffer в base64
function arrayBufferToBase64(buffer: ArrayBuffer | null): string {
  if (!buffer) return "";

  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  // Стандартный base64 (не base64url!)
  return window.btoa(binary);
}

// Отписка от push-уведомлений
export async function unregisterPush(): Promise<void> {
  try {
    if ("serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
      }
    }
  } catch (error) {
    console.error("Failed to unregister push:", error);
  }
}

// Проверка состояния подписки
export async function getPushSubscriptionStatus(): Promise<{
  permission: NotificationPermission;
  subscribed: boolean;
}> {
  const permission = "Notification" in window ? Notification.permission : "denied";
  
  let subscribed = false;
  if ("serviceWorker" in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      subscribed = !!subscription;
    } catch {
      subscribed = false;
    }
  }

  return { permission, subscribed };
}
