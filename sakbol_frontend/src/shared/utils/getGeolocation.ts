// src/shared/utils/geolocation.ts
// Получение геолокации.
// Если доступен нативный Android-мост — использует его.
// Иначе падает на navigator.geolocation (браузерный API).

import { isNativeBridgeAvailable, onNativeLocation } from "../services/nativeBridge";
import { useLocation } from "../../store/useLocation";

export interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

export interface GeolocationResult {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export interface GeolocationCallbacks {
  onSuccess?: (result: GeolocationResult) => void | Promise<void>;
  onError?: (error: GeolocationError) => void;
  onDenied?: () => void;
  onUnavailable?: () => void;
  onTimeout?: () => void;
}

export type GeolocationError = {
  code: number;
  message: string;
};

function tryBrowserGeolocation(
  callbacks: GeolocationCallbacks | undefined,
  resolve: () => void,
  reject: (err: GeolocationError) => void,
  options: GeolocationOptions
): void {
  const {
    enableHighAccuracy = false,
    timeout = 20_000,
    maximumAge = 0,
  } = options;

  if (!navigator.geolocation) {
    callbacks?.onUnavailable?.();
    const error: GeolocationError = { code: 0, message: "Geolocation not supported" };
    callbacks?.onError?.(error);
    reject(error);
    return;
  }

  if (!window.isSecureContext) {
    callbacks?.onUnavailable?.();
    const error: GeolocationError = { code: 0, message: "Not secure context (need HTTPS or localhost)" };
    callbacks?.onError?.(error);
    reject(error);
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const result: GeolocationResult = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        timestamp: pos.timestamp,
      };
      try {
        if (callbacks?.onSuccess) await callbacks.onSuccess(result);
        resolve();
      } catch (e) { reject(e as GeolocationError); }
    },
    (err) => {
      const error: GeolocationError = { code: err.code, message: err.message };
      switch (err.code) {
        case 1:
          callbacks?.onDenied?.();
          break;
        case 3:
          callbacks?.onTimeout?.();
          break;
      }
      callbacks?.onError?.(error);
      reject(error);
    },
    { enableHighAccuracy, timeout, maximumAge }
  );
}

function tryNativeLocation(
  callbacks: GeolocationCallbacks | undefined,
  resolve: () => void,
  reject: (err: GeolocationError) => void,
  options: GeolocationOptions
): void {
  // Сначала проверяем стор — там уже могут быть актуальные координаты от updateLocationFromAndroid
  const state = useLocation.getState();
  if (state.geoLat != null && state.geoLon != null) {
    const result: GeolocationResult = {
      latitude: state.geoLat,
      longitude: state.geoLon,
      accuracy: 0,
      timestamp: Date.now(),
    };
    (async () => {
      try {
        if (callbacks?.onSuccess) await callbacks.onSuccess(result);
        resolve();
      } catch (e) {
        reject(e as GeolocationError);
      }
    })();
    return;
  }

  // Если стор пуст — ждём следующее обновление от нативного моста
  const { timeout = 20_000 } = options;

  const timeoutId = setTimeout(() => {
    console.warn("[getGeolocation] Native bridge timeout, falling back to browser API");
    tryBrowserGeolocation(callbacks, resolve, reject, options);
  }, Math.min(timeout, 15_000));

  const unsub = onNativeLocation((lat, lng) => {
    clearTimeout(timeoutId);
    unsub();

    const result: GeolocationResult = {
      latitude: lat,
      longitude: lng,
      accuracy: 0,
      timestamp: Date.now(),
    };

    (async () => {
      try {
        if (callbacks?.onSuccess) await callbacks.onSuccess(result);
        resolve();
      } catch (e) {
        reject(e as GeolocationError);
      }
    })();
  });
}

export function getGeolocation(
  callbacks?: GeolocationCallbacks,
  options: GeolocationOptions = {}
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    // Если доступен нативный мост Android — используем его
    if (isNativeBridgeAvailable()) {
      tryNativeLocation(callbacks, resolve, reject, options);
    } else {
      // В браузере или вне WebView — используем navigator.geolocation
      tryBrowserGeolocation(callbacks, resolve, reject, options);
    }
  });
}
