// Native Bridge для связи с Android WebView
// Этот файл предоставляет API для взаимодействия с нативным кодом Android

declare global {
  interface Window {
    SakbolNative?: {
      requestNotificationPermission: () => void;
      requestLocationPermission: () => void;
      enableVoiceNotifications: () => void;
      disableVoiceNotifications: () => void;
      pauseVoiceListening: () => void;
      resumeVoiceListening: () => void;
      checkPermissions: () => string;
      requestCurrentLocation: () => void;
    };
    SakbolNativeReady?: () => void;
    onNativeLocationUpdate?: (data: LocationData) => void;
    onLocationStatusChange?: (active: boolean) => void;
    onNativeSOS?: (data: SOSData) => void;
    onNativeWarning?: (data: WarningData) => void;
    onPermissionsResult?: (data: PermissionsResult) => void;
    onLocationPermissionResult?: (data: LocationPermissionResult) => void;
  }
}

export interface LocationData {
  latitude: number;
  longitude: number;
  timestamp: number;
}

export interface SOSData {
  type: 'emergency' | 'emergency_immediate' | 'warning';
  service: 'ambulance' | 'police' | 'fire' | 'unknown';
  words: string[];
  timestamp: number;
  priority?: 'immediate' | 'high' | 'normal';
  source: string;
}

export interface WarningData {
  type: 'warning';
  word: string;
  timestamp: number;
  source: string;
}

export interface PermissionsResult {
  microphone: boolean;
  notifications: boolean;
}

export interface LocationPermissionResult {
  fineLocation: boolean;
  coarseLocation: boolean;
}

export interface NativePermissions {
  microphone: boolean;
  notifications: boolean;
  fineLocation: boolean;
  coarseLocation: boolean;
}

class NativeBridge {
  private callbacks: {
    onLocationUpdate?: (data: LocationData) => void;
    onLocationStatusChange?: (active: boolean) => void;
    onSOS?: (data: SOSData) => void;
    onWarning?: (data: WarningData) => void;
    onPermissionsResult?: (data: PermissionsResult) => void;
    onLocationPermissionResult?: (data: LocationPermissionResult) => void;
  } = {};

  constructor() {
    this.setupGlobalHandlers();
    this.setupReadyHandler();
  }

  /**
   * Обработчик сигнала готовности нативного кода от MainActivity
   */
  private setupReadyHandler() {
    if (typeof window === 'undefined') return;
    window.SakbolNativeReady = () => {
      console.log('[NativeBridge] Native side reported ready');
    };
  }

  /**
   * Определяет, запущено ли приложение в нативном WebView.
   * НЕ кешируем — проверяем каждый раз, т.к. JS Interface может появиться позже.
   */
  isNativeApp(): boolean {
    if (typeof window === 'undefined') return false;
    if (window.SakbolNative !== undefined && typeof window.SakbolNative === 'object') {
      return true;
    }
    if (typeof navigator !== 'undefined' && navigator.userAgent?.includes('AppWebView/sakbol')) {
      return true;
    }
    return false;
  }

  /**
   * Ждёт получение локации от нативного кода (с таймаутом).
   */
  waitForLocation(timeoutMs = 10_000): Promise<LocationData> {
    return new Promise((resolve, reject) => {
      // если уже есть последняя локация — сразу отдаём
      if (typeof window !== 'undefined' && (window as any).__lastNativeLocation) {
        resolve((window as any).__lastNativeLocation as LocationData);
        return;
      }

      const timer = setTimeout(() => {
        reject(new Error('Timeout waiting for native location'));
      }, timeoutMs);

      const handler = (data: LocationData) => {
        clearTimeout(timer);
        this.callbacks.onLocationUpdate = originalHandler;
        resolve(data);
      };

      const originalHandler = this.callbacks.onLocationUpdate;
      this.callbacks.onLocationUpdate = (data: LocationData) => {
        originalHandler?.(data);
        handler(data);
      };
    });
  }

  /**
   * Настраивает глобальные обработчики для событий от нативного кода
   */
  private setupGlobalHandlers() {
    if (typeof window === 'undefined') return;

    // Обработчик обновления геолокации
    window.onNativeLocationUpdate = (data: LocationData) => {
      console.log('[NativeBridge] Location update:', data);
      this.callbacks.onLocationUpdate?.(data);
    };

    // Обработчик изменения статуса геолокации
    window.onLocationStatusChange = (active: boolean) => {
      console.log('[NativeBridge] Location status:', active);
      this.callbacks.onLocationStatusChange?.(active);
    };

    // Обработчик SOS сигнала
    window.onNativeSOS = (data: SOSData) => {
      console.log('[NativeBridge] SOS triggered:', data);
      this.callbacks.onSOS?.(data);
    };

    // Обработчик предупреждения
    window.onNativeWarning = (data: WarningData) => {
      console.log('[NativeBridge] Warning:', data);
      this.callbacks.onWarning?.(data);
    };

    // Обработчик результата запроса разрешений
    window.onPermissionsResult = (data: PermissionsResult) => {
      console.log('[NativeBridge] Permissions result:', data);
      this.callbacks.onPermissionsResult?.(data);
    };

    // Обработчик результата запроса разрешений геолокации
    window.onLocationPermissionResult = (data: LocationPermissionResult) => {
      console.log('[NativeBridge] Location permission result:', data);
      this.callbacks.onLocationPermissionResult?.(data);
    };
  }

  /**
   * Устанавливает callback для обновления геолокации
   */
  onLocationUpdate(callback: (data: LocationData) => void) {
    this.callbacks.onLocationUpdate = callback;
  }

  /**
   * Устанавливает callback для изменения статуса геолокации
   */
  onLocationStatusChange(callback: (active: boolean) => void) {
    this.callbacks.onLocationStatusChange = callback;
  }

  /**
   * Устанавливает callback для SOS сигнала
   */
  onSOS(callback: (data: SOSData) => void) {
    this.callbacks.onSOS = callback;
  }

  /**
   * Устанавливает callback для предупреждений
   */
  onWarning(callback: (data: WarningData) => void) {
    this.callbacks.onWarning = callback;
  }

  /**
   * Устанавливает callback для результатов разрешений
   */
  onPermissionsResult(callback: (data: PermissionsResult) => void) {
    this.callbacks.onPermissionsResult = callback;
  }

  /**
   * Устанавливает callback для результатов разрешений геолокации
   */
  onLocationPermissionResult(callback: (data: LocationPermissionResult) => void) {
    this.callbacks.onLocationPermissionResult = callback;
  }

  /**
   * Запрашивает разрешение на уведомления
   */
  requestNotificationPermission(): void {
    if (this.isNative && window.SakbolNative) {
      window.SakbolNative.requestNotificationPermission();
    } else {
      console.warn('[NativeBridge] Not running in native app');
    }
  }

  /**
   * Запрашивает разрешение на геолокацию
   */
  requestLocationPermission(): void {
    if (this.isNative && window.SakbolNative) {
      window.SakbolNative.requestLocationPermission();
    } else {
      console.warn('[NativeBridge] Not running in native app');
      // Fallback для браузера
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const data: LocationData = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              timestamp: Date.now(),
            };
            this.callbacks.onLocationUpdate?.(data);
          },
          (error) => {
            console.error('[NativeBridge] Geolocation error:', error);
          }
        );
      }
    }
  }

  /**
   * Включает foreground notifications для голосового сервиса
   */
  enableVoiceNotifications(): void {
    if (this.isNative && window.SakbolNative) {
      window.SakbolNative.enableVoiceNotifications();
    } else {
      console.warn('[NativeBridge] Not running in native app');
    }
  }

  /**
   * Отключает foreground notifications для голосового сервиса
   */
  disableVoiceNotifications(): void {
    if (this.isNative && window.SakbolNative) {
      window.SakbolNative.disableVoiceNotifications();
    } else {
      console.warn('[NativeBridge] Not running in native app');
    }
  }

  /**
   * Приостанавливает прослушивание голоса
   */
  pauseVoiceListening(): void {
    if (this.isNative && window.SakbolNative) {
      window.SakbolNative.pauseVoiceListening();
    } else {
      console.warn('[NativeBridge] Not running in native app');
    }
  }

  /**
   * Возобновляет прослушивание голоса
   */
  resumeVoiceListening(): void {
    if (this.isNative && window.SakbolNative) {
      window.SakbolNative.resumeVoiceListening();
    } else {
      console.warn('[NativeBridge] Not running in native app');
    }
  }

  /**
   * Проверяет текущие разрешения
   * @returns JSON строка с разрешениями или null если не нативное приложение
   */
  checkPermissions(): NativePermissions | null {
    if (this.isNative && window.SakbolNative) {
      try {
        const result = window.SakbolNative.checkPermissions();
        return JSON.parse(result) as NativePermissions;
      } catch (e) {
        console.error('[NativeBridge] Failed to parse permissions:', e);
        return null;
      }
    }
    console.warn('[NativeBridge] Not running in native app');
    return null;
  }

  /**
   * Запрашивает текущую геолокацию
   */
  requestCurrentLocation(): void {
    if (this.isNative && window.SakbolNative) {
      window.SakbolNative.requestCurrentLocation();
    } else {
      console.warn('[NativeBridge] Not running in native app');
      // Fallback для браузера
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const data: LocationData = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              timestamp: Date.now(),
            };
            this.callbacks.onLocationUpdate?.(data);
          },
          (error) => {
            console.error('[NativeBridge] Geolocation error:', error);
          }
        );
      }
    }
  }
}

// Singleton instance
export const nativeBridge = new NativeBridge();

export default NativeBridge;
