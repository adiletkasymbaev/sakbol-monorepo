// src/shared/utils/geolocation.ts
// Получение геолокации через navigator.geolocation (браузерный API).

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

  return new Promise(async (resolve, reject) => {
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
        } catch (e) { reject(e); }
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
  });
}
