import { nativeBridge, SOSData, LocationData } from './nativeBridge';
import { locationService } from './locationService';
import { sosService, alertsService } from './sosService';

export interface SOSSendData {
  type: 'emergency_immediate' | 'emergency' | 'warning';
  service: 'ambulance' | 'police' | 'fire' | 'unknown';
  words: string[];
  timestamp: number;
  priority: 'immediate' | 'high' | 'normal';
  source: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}

export interface LocationSendData {
  latitude: number;
  longitude: number;
  timestamp: number;
  accuracy?: number;
  source: 'native_gps' | 'browser_gps' | 'manual';
}

class NativeService {
  private lastLocation: LocationData | null = null;

  constructor() {
    this.setupNativeListeners();
  }

  /**
   * Настраивает слушатели событий от нативного кода
   */
  private setupNativeListeners() {
    // Слушаем обновления геолокации
    nativeBridge.onLocationUpdate((data: LocationData) => {
      this.lastLocation = data;
      this.sendLocationToBackend(data);
    });

    // Слушаем SOS сигналы
    nativeBridge.onSOS((data: SOSData) => {
      this.sendSOSToBackend(data);
    });

    // Слушаем предупреждения
    nativeBridge.onWarning((data) => {
      console.log('[NativeService] Warning received:', data);
      this.sendWarningToBackend(data);
    });

    // Слушаем результаты разрешений
    nativeBridge.onPermissionsResult((data) => {
      console.log('[NativeService] Permissions result:', data);
    });

    nativeBridge.onLocationPermissionResult((data) => {
      console.log('[NativeService] Location permissions:', data);
    });
  }

  /**
   * Отправляет SOS сигнал на бэкенд
   * Вызывается автоматически при распознавании ключевых слов
   */
  async sendSOSToBackend(data: SOSData): Promise<void> {
    try {
      const payload: { latitude: number; longitude: number; service_id?: number | null; service_point_id?: number | null } = {
        latitude: 0,
        longitude: 0,
      };

      // Добавляем последнюю известную локацию если есть
      if (this.lastLocation) {
        payload.latitude = this.lastLocation.latitude;
        payload.longitude = this.lastLocation.longitude;
      }

      console.log('[NativeService] Sending SOS:', payload);

      await sosService.create(payload);

      console.log('[NativeService] SOS sent successfully');
    } catch (error) {
      console.error('[NativeService] Failed to send SOS:', error);
    }
  }

  /**
   * Отправляет данные геолокации на бэкенд
   */
  async sendLocationToBackend(data: LocationData): Promise<void> {
    try {
      await locationService.updateMyLocation({
        latitude: data.latitude,
        longitude: data.longitude,
      });

      console.log('[NativeService] Location sent:', data);

    } catch (error) {
      console.error('[NativeService] Failed to send location:', error);
    }
  }

  /**
   * Отправляет предупреждение на бэкенд
   */
  async sendWarningToBackend(data: { word: string; timestamp: number; source: string }): Promise<void> {
    try {
      const payload = {
        latitude: 0,
        longitude: 0,
      };

      if (this.lastLocation) {
        payload.latitude = this.lastLocation.latitude;
        payload.longitude = this.lastLocation.longitude;
      }

      await alertsService.create(payload);

      console.log('[NativeService] Warning sent:', payload);

    } catch (error) {
      console.error('[NativeService] Failed to send warning:', error);
    }
  }

  /**
   * Инициализация при запуске приложения
   * Запрашивает разрешения и включает необходимые сервисы
   */
  async initialize(): Promise<void> {
    console.log('[NativeService] Initializing...');

    if (!nativeBridge.isNativeApp()) {
      console.log('[NativeService] Not running in native app, skipping native initialization');
      return;
    }

    // Проверяем текущие разрешения
    const permissions = nativeBridge.checkPermissions();
    console.log('[NativeService] Current permissions:', permissions);

    // Запрашиваем разрешение на уведомления (не включаем foreground notification сразу)
    if (!permissions?.notifications) {
      console.log('[NativeService] Requesting notification permission...');
      nativeBridge.requestNotificationPermission();
    }

    // Запрашиваем разрешение на геолокацию
    if (!permissions?.fineLocation && !permissions?.coarseLocation) {
      console.log('[NativeService] Requesting location permission...');
      nativeBridge.requestLocationPermission();
    }
  }

  /**
   * Включает foreground notifications (вызывается когда пользователь включает в настройках)
   */
  enableNotifications(): void {
    if (nativeBridge.isNativeApp()) {
      nativeBridge.enableVoiceNotifications();
    }
  }

  /**
   * Отключает foreground notifications
   */
  disableNotifications(): void {
    if (nativeBridge.isNativeApp()) {
      nativeBridge.disableVoiceNotifications();
    }
  }

  /**
   * Проверяет, работает ли приложение в нативном WebView
   */
  isNativeApp(): boolean {
    return nativeBridge.isNativeApp();
  }

  /**
   * Получает последнюю известную локацию
   */
  getLastLocation(): LocationData | null {
    return this.lastLocation;
  }
}

// Singleton instance
export const nativeService = new NativeService();

export default NativeService;
