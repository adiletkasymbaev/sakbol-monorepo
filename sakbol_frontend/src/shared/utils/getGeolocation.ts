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

  return new Promise((resolve, reject) => {
    // 0. Если запущено в нативном WebView — используем геолокацию из приложения
    if (nativeBridge.isNativeApp()) {
      const nativeLoc = nativeService.getLastLocation();
      if (nativeLoc) {
        const result: GeolocationResult = {
          latitude: nativeLoc.latitude,
          longitude: nativeLoc.longitude,
          accuracy: 0,
          timestamp: nativeLoc.timestamp,
        };
        try {
          if (callbacks?.onSuccess) {
            Promise.resolve(callbacks.onSuccess(result)).then(() => resolve()).catch(reject);
          } else {
            resolve();
          }
        } catch (e) {
          reject(e);
        }
        return;
      }
      // Если нативная локация ещё не пришла, fallback на браузер
    }

    // 1. Проверка поддержки API
    if (!navigator.geolocation) {
      callbacks?.onUnavailable?.();
      const error: GeolocationError = { code: 0, message: "Геолокация не поддерживается" };
      callbacks?.onError?.(error);
      reject(error);
      return;
    }

    // 2. Проверка безопасного контекста (HTTPS / localhost)
    if (!window.isSecureContext) {
      callbacks?.onUnavailable?.();
      const error: GeolocationError = { code: 0, message: "Требуется HTTPS или localhost" };
      callbacks?.onError?.(error);
      reject(error);
      return;
    }

    // 3. Запрос позиции
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const result: GeolocationResult = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: pos.timestamp,
        };

        try {
          if (callbacks?.onSuccess) {
            await callbacks.onSuccess(result);
          }
          resolve();
        } catch (e) {
          reject(e);
        }
      },
      (err) => {
        const error: GeolocationError = { code: err.code, message: "" };

        switch (err.code) {
          case 1: // PERMISSION_DENIED
            error.message = "Доступ к геолокации запрещён";
            callbacks?.onDenied?.();
            break;
          case 2: // POSITION_UNAVAILABLE
            error.message = "Местоположение недоступно";
            break;
          case 3: // TIMEOUT
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