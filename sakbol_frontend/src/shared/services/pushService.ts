import { initializeApp, type FirebaseApp } from "firebase/app";
import { getMessaging, onMessage, type Messaging } from "firebase/messaging";

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
  
  return permission;
}

// Прослушивание входящих уведомлений когда приложение открыто
export function onForegroundMessage(callback: (payload: any) => void): () => void {
  const msg = initMessaging();
  if (!msg) {
    console.warn("Cannot listen for foreground messages - messaging not initialized");
    return () => {};
  }

  const unsubscribe = onMessage(msg, (payload) => {
    callback(payload);
  });

  return unsubscribe;
}
