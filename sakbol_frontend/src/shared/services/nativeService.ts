import { nativeBridge, SOSData, LocationData } from './nativeBridge';
import { locationService } from './locationService';
import { sosService, alertsService } from './sosService';

class NativeService {
  private lastLocation: LocationData | null = null;
  private unsubscribers: Array<() => void> = [];

  constructor() {
    console.log('[NativeService] constructor');
    this.setupNativeListeners();
  }

  private setupNativeListeners() {
    console.log('[NativeService] setupNativeListeners');

    const unsubLoc = nativeBridge.onLocationUpdate((data: LocationData) => {
      console.log('[NativeService] onLocationUpdate:', data);
      this.lastLocation = data;
      if (typeof window !== 'undefined') {
        window.__lastNativeLocation = data;
      }
      this.sendLocationToBackend(data);
    });
    this.unsubscribers.push(unsubLoc);

    const unsubSOS = nativeBridge.onSOS((data: SOSData) => {
      console.log('[NativeService] onSOS:', data);
      this.sendSOSToBackend(data);
    });
    this.unsubscribers.push(unsubSOS);

    const unsubWarn = nativeBridge.onWarning((data) => {
      console.log('[NativeService] onWarning:', data);
      this.sendWarningToBackend(data);
    });
    this.unsubscribers.push(unsubWarn);

    const unsubPerm = nativeBridge.onPermissionsResult((data) => {
      console.log('[NativeService] onPermissionsResult:', data);
    });
    this.unsubscribers.push(unsubPerm);

    const unsubLocPerm = nativeBridge.onLocationPermissionResult((data) => {
      console.log('[NativeService] onLocationPermissionResult:', data);
    });
    this.unsubscribers.push(unsubLocPerm);

    // Для отладки голоса
    const unsubPartial = nativeBridge.onVoicePartial((text) => {
      console.log('[NativeService] voice partial:', text);
    });
    this.unsubscribers.push(unsubPartial);

    const unsubResult = nativeBridge.onVoiceResult((text) => {
      console.log('[NativeService] voice result:', text);
    });
    this.unsubscribers.push(unsubResult);
  }

  async sendSOSToBackend(data: SOSData): Promise<void> {
    console.log('[NativeService] sendSOSToBackend');
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
    console.log('[NativeService] sendLocationToBackend:', data);
    try {
      await locationService.updateMyLocation({
        latitude: data.latitude,
        longitude: data.longitude,
      });
      console.log('[NativeService] Location sent OK');
    } catch (error) {
      console.error('[NativeService] Failed to send location:', error);
    }
  }

  async sendWarningToBackend(data: { word: string; timestamp: number; source: string }): Promise<void> {
    console.log('[NativeService] sendWarningToBackend:', data);
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
      console.log('[NativeService] Warning sent OK');
    } catch (error) {
      console.error('[NativeService] Failed to send warning:', error);
    }
  }

  async initialize(): Promise<void> {
    console.log('[NativeService] initialize');

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
    const loc = this.lastLocation;
    console.log('[NativeService] getLastLocation:', loc);
    return loc;
  }

  waitForLocation(timeoutMs = 10_000): Promise<LocationData> {
    console.log('[NativeService] waitForLocation, timeout=' + timeoutMs);
    return nativeBridge.waitForLocation(timeoutMs);
  }

  async requestCurrentLocation(timeoutMs = 10_000): Promise<LocationData> {
    console.log('[NativeService] requestCurrentLocation');
    nativeBridge.requestCurrentLocation();
    return this.waitForLocation(timeoutMs);
  }
}

export const nativeService = new NativeService();
export default NativeService;
