// src/shared/utils/geolocation.ts
import { nativeBridge } from "../services/nativeBridge";
import { nativeService } from "../services/nativeService";

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

export function getGeolocation(
  callbacks?: GeolocationCallbacks,
  options: GeolocationOptions = {}
): Promise<void> {
  const {
    enableHighAccuracy = false,
    timeout = 20_000,
    maximumAge = 0,
  } = options;

  // ── Нативный WebView: только мост, никакого navigator.geolocation ──
  if (nativeBridge.isNativeApp()) {
    return new Promise(async (resolve, reject) => {
      const nativeLoc = nativeService.getLastLocation();

      if (nativeLoc) {
        const result: GeolocationResult = {
          latitude: nativeLoc.latitude,
          longitude: nativeLoc.longitude,
          accuracy: 0,
          timestamp: nativeLoc.timestamp,
        };
        try {
          if (callbacks?.onSuccess) await callbacks.onSuccess(result);
          resolve();
        } catch (e) { reject(e); }
        return;
      }

      // Локации ещё нет — ждём от Android
      try {
        const data = await nativeService.waitForLocation(timeout);
        const result: GeolocationResult = {
          latitude: data.latitude,
          longitude: data.longitude,
          accuracy: 0,
          timestamp: data.timestamp,
        };
        if (callbacks?.onSuccess) await callbacks.onSuccess(result);
        resolve();
      } catch (err: any) {
        const error: GeolocationError = { code: 2, message: "Местоположение из приложения недоступно" };
        callbacks?.onError?.(error);
        callbacks?.onUnavailable?.();
        reject(error);
      }
    });
  }

  // ── Браузер: стандартный navigator.geolocation ──
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      callbacks?.onUnavailable?.();
      const error: GeolocationError = { code: 0, message: "Геолокация не поддерживается" };
      callbacks?.onError?.(error);
      reject(error);
      return;
    }

    if (!window.isSecureContext) {
      callbacks?.onUnavailable?.();
      const error: GeolocationError = { code: 0, message: "Требуется HTTPS или localhost" };
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
        } catch (e) { reject(e); }
      },
      (err) => {
        const error: GeolocationError = { code: err.code, message: "" };
        switch (err.code) {
          case 1:
            error.message = "Доступ к геолокации запрещён";
            callbacks?.onDenied?.();
            break;
          case 2:
            error.message = "Местоположение недоступно";
            break;
          case 3:
            error.message = "Таймаут геолокации";
            callbacks?.onTimeout?.();
            break;
          default:
            error.message = "Неизвестная ошибка геолокации";
        }
        callbacks?.onError?.(error);
        reject(error);
      },
      { enableHighAccuracy, timeout, maximumAge }
    );
  });
}
