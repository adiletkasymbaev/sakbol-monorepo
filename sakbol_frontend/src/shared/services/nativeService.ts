import { nativeBridge, SOSData, LocationData } from './nativeBridge';
import { locationService } from './locationService';
import { sosService, alertsService } from './sosService';

class NativeService {
  private lastLocation: LocationData | null = null;
  private unsubscribers: Array<() => void> = [];

  constructor() {
    this.setupNativeListeners();
  }

  private setupNativeListeners() {
    // Слушаем обновления геолокации
    const unsubLoc = nativeBridge.onLocationUpdate((data: LocationData) => {
      this.lastLocation = data;
      if (typeof window !== 'undefined') {
        window.__lastNativeLocation = data;
      }
      this.sendLocationToBackend(data);
    });
    this.unsubscribers.push(unsubLoc);

    // Слушаем SOS сигналы
    const unsubSOS = nativeBridge.onSOS((data: SOSData) => {
      this.sendSOSToBackend(data);
    });
    this.unsubscribers.push(unsubSOS);

    // Слушаем предупреждения
    const unsubWarn = nativeBridge.onWarning((data) => {
      console.log('[NativeService] Warning received:', data);
      this.sendWarningToBackend(data);
    });
    this.unsubscribers.push(unsubWarn);

    // Слушаем результаты разрешений
    const unsubPerm = nativeBridge.onPermissionsResult((data) => {
      console.log('[NativeService] Permissions result:', data);
    });
    this.unsubscribers.push(unsubPerm);

    const unsubLocPerm = nativeBridge.onLocationPermissionResult((data) => {
      console.log('[NativeService] Location permissions:', data);
    });
    this.unsubscribers.push(unsubLocPerm);
  }

  async sendSOSToBackend(data: SOSData): Promise<void> {
    try {
      const payload: { latitude: number; longitude: number; service_id?: number | null; service_point_id?: number | null } = {
        latitude: 0,
        longitude: 0,
      };

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

  async initialize(): Promise<void> {
    console.log('[NativeService] Initializing...');

    if (!nativeBridge.isNativeApp()) {
      console.log('[NativeService] Not running in native app, skipping native initialization');
      return;
    }

    const permissions = nativeBridge.checkPermissions();
    console.log('[NativeService] Current permissions:', permissions);

    if (!permissions?.notifications) {
      console.log('[NativeService] Requesting notification permission...');
      nativeBridge.requestNotificationPermission();
    }

    if (!permissions?.fineLocation && !permissions?.coarseLocation) {
      console.log('[NativeService] Requesting location permission...');
      nativeBridge.requestLocationPermission();
    }
  }

  enableNotifications(): void {
    if (nativeBridge.isNativeApp()) {
      nativeBridge.enableVoiceNotifications();
    }
  }

  disableNotifications(): void {
    if (nativeBridge.isNativeApp()) {
      nativeBridge.disableVoiceNotifications();
    }
  }

  isNativeApp(): boolean {
    return nativeBridge.isNativeApp();
  }

  getLastLocation(): LocationData | null {
    return this.lastLocation;
  }

  waitForLocation(timeoutMs = 10_000): Promise<LocationData> {
    return nativeBridge.waitForLocation(timeoutMs);
  }

  async requestCurrentLocation(timeoutMs = 10_000): Promise<LocationData> {
    nativeBridge.requestCurrentLocation();
    return this.waitForLocation(timeoutMs);
  }
}

export const nativeService = new NativeService();
export default NativeService;
