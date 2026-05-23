/**
 * Android → WebView Bridge
 *
 * Эти функции вызываются из нативного Android-кода (MainActivity)
 * через WebView.evaluateJavascript().
 *
 * Каждая функция объявлена на window, чтобы Kotlin мог вызвать:
 *   webView.evaluateJavascript("updateFcmTokenFromAndroid('${token}')", null)
 */

import { addToast } from "@heroui/react";
import api from "./axios";
import useAuth from "../../store/useAuth";

// ──────────────────────────────────────────────
// Очередь отложенных FCM-токенов
// Если Android присылает токен до того, как пользователь залогинился,
// сохраняем его и отправляем после авторизации.
// ──────────────────────────────────────────────
let pendingFcmToken: string | null = null;

// Подписка на изменения auth-статуса
let authUnsubscribe: (() => void) | null = null;

function flushPendingFcmToken() {
  if (!pendingFcmToken) return;

  const token = pendingFcmToken;
  pendingFcmToken = null; // очищаем перед отправкой

  const accessToken = useAuth.getState().tokenAccess;
  if (!accessToken) return;

  sendFcmTokenToBackend(token, accessToken);
}

async function sendFcmTokenToBackend(token: string, accessToken: string) {
  try {
    const response = await api.post("/push/fcm/register/", {
      registration_id: token,
      device_type: "android",
    });
    console.log("[NativeBridge] FCM token registered on backend:", response.status);
  } catch (error: any) {
    console.error("[NativeBridge] FCM register error:", error?.response?.status || error?.message);
  }
}

// ──────────────────────────────────────────────
// 1. Приём FCM-токена от Android → отправка на бэкенд
// ──────────────────────────────────────────────
(window as any).updateFcmTokenFromAndroid = (token: string) => {
  console.log("[NativeBridge] FCM token received from Android");

  const accessToken = useAuth.getState().tokenAccess;

  if (!accessToken) {
    // Пользователь ещё не залогинен — сохраняем токен
    console.log("[NativeBridge] Auth pending, saving FCM token for later");
    pendingFcmToken = token;

    // Подписываемся однократно на изменение auth
    if (!authUnsubscribe) {
      authUnsubscribe = useAuth.subscribe((state) => {
        if (state.isLoggedIn) {
          flushPendingFcmToken();
          authUnsubscribe?.();
          authUnsubscribe = null;
        }
      });
    }
    return;
  }

  sendFcmTokenToBackend(token, accessToken);
};

// ──────────────────────────────────────────────
// 2. Приём геолокации от Android → отправка на бэкенд
// ──────────────────────────────────────────────
(window as any).updateLocationFromAndroid = async (lat: number, lng: number) => {
  try {
    await api.post("/general/locations_module/update/", {
      latitude: lat,
      longitude: lng,
    });
  } catch (error: any) {
    console.error("[NativeBridge] Location update error:", error?.response?.status || error?.message);
  }
};

// ──────────────────────────────────────────────
// 3. Обработка голосовых команд от Android
// ──────────────────────────────────────────────
const SOS_PHRASES = ["помогите", "сос", "эс о эс", "помощь", "help", "sos"];

(window as any).onVoiceCommandReceived = async (phrase: string) => {
  const normalized = phrase.toLowerCase().trim();

  // Проверяем, является ли команда SOS-сигналом
  const isSos = SOS_PHRASES.some((keyword) => normalized.includes(keyword));

  if (isSos) {
    // Пробуем получить текущие координаты
    let lat = 0;
    let lng = 0;

    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 3000,
          enableHighAccuracy: false,
        });
      });
      lat = pos.coords.latitude;
      lng = pos.coords.longitude;
    } catch {
      // Android может дополнить координаты через updateLocationFromAndroid
    }

    try {
      await api.post("/general/contacts_module/alerts/", {
        latitude: lat,
        longitude: lng,
      });

      addToast({
        title: '🗣️ SOS',
        description: `Голосовая команда: "${phrase}" — оповещение отправлено контактам`,
        color: "warning",
      });
    } catch (error: any) {
      console.error("[NativeBridge] Voice SOS error:", error?.response?.status || error?.message);
    }
  }
};

// ──────────────────────────────────────────────
// Инициализация моста (вызывается из main.tsx)
// ──────────────────────────────────────────────
export function initNativeBridge() {
  // Очищаем предыдущую подписку (защита от HMR/повторного вызова)
  if (authUnsubscribe) {
    authUnsubscribe();
    authUnsubscribe = null;
  }
  
  console.log("[NativeBridge] Bridge functions registered on window");
}
