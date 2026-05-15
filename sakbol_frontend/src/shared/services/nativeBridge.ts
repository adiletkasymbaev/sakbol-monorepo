// Native Bridge для связи с Android WebView
// Поддерживает множественных listeners для каждого события

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
    __lastNativeLocation?: LocationData;
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
  private listeners: {
    onLocationUpdate: Array<(data: LocationData) => void>;
    onLocationStatusChange: Array<(active: boolean) => void>;
    onSOS: Array<(data: SOSData) => void>;
    onWarning: Array<(data: WarningData) => void>;
    onPermissionsResult: Array<(data: PermissionsResult) => void>;
    onLocationPermissionResult: Array<(data: LocationPermissionResult) => void>;
    onVoicePartial: Array<(text: string) => void>;
    onVoiceResult: Array<(text: string) => void>;
  } = {
    onLocationUpdate: [],
    onLocationStatusChange: [],
    onSOS: [],
    onWarning: [],
    onPermissionsResult: [],
    onLocationPermissionResult: [],
    onVoicePartial: [],
    onVoiceResult: [],
  };

  private _isNative: boolean | null = null;

  constructor() {
    this.setupGlobalHandlers();
    this.setupReadyHandler();
    this._isNative = this.detectNative();
    console.log('[NativeBridge] constructor, isNative=' + this._isNative);
  }

  isNativeApp(): boolean {
    if (this._isNative !== null) return this._isNative;
    this._isNative = this.detectNative();
    return this._isNative;
  }

  refreshIsNative(): void {
    this._isNative = this.detectNative();
    console.log('[NativeBridge] refreshIsNative=' + this._isNative);
  }

  private detectNative(): boolean {
    if (typeof window === 'undefined') return false;
    if (window.SakbolNative !== undefined && typeof window.SakbolNative === 'object') {
      console.log('[NativeBridge] detectNative: SakbolNative found');
      return true;
    }
    if (typeof navigator !== 'undefined' && navigator.userAgent?.includes('AppWebView/sakbol')) {
      console.log('[NativeBridge] detectNative: UA match');
      return true;
    }
    return false;
  }

  private setupReadyHandler() {
    if (typeof window === 'undefined') return;
    const existing = window.SakbolNativeReady;
    window.SakbolNativeReady = () => {
      console.log('[NativeBridge] SakbolNativeReady() called from Android');
      this.refreshIsNative();
      existing?.();
    };
  }

  private setupGlobalHandlers() {
    if (typeof window === 'undefined') return;

    window.onNativeLocationUpdate = (data: LocationData) => {
      console.log('[NativeBridge] onNativeLocationUpdate:', data);
      if (typeof window !== 'undefined') {
        window.__lastNativeLocation = data;
      }
      this.listeners.onLocationUpdate.forEach((cb) => {
        try { cb(data); } catch (e) { console.error(e); }
      });
    };

    window.onLocationStatusChange = (active: boolean) => {
      console.log('[NativeBridge] onLocationStatusChange:', active);
      this.listeners.onLocationStatusChange.forEach((cb) => {
        try { cb(active); } catch (e) { console.error(e); }
      });
    };

    window.onNativeSOS = (data: SOSData) => {
      console.log('[NativeBridge] onNativeSOS:', data);
      this.listeners.onSOS.forEach((cb) => {
        try { cb(data); } catch (e) { console.error(e); }
      });
    };

    window.onNativeWarning = (data: WarningData) => {
      console.log('[NativeBridge] onNativeWarning:', data);
      this.listeners.onWarning.forEach((cb) => {
        try { cb(data); } catch (e) { console.error(e); }
      });
    };

    window.onPermissionsResult = (data: PermissionsResult) => {
      console.log('[NativeBridge] onPermissionsResult:', data);
      this.listeners.onPermissionsResult.forEach((cb) => {
        try { cb(data); } catch (e) { console.error(e); }
      });
    };

    window.onLocationPermissionResult = (data: LocationPermissionResult) => {
      console.log('[NativeBridge] onLocationPermissionResult:', data);
      this.listeners.onLocationPermissionResult.forEach((cb) => {
        try { cb(data); } catch (e) { console.error(e); }
      });
    };

    // Голосовой ввод (для отладки)
    (window as any).onNativePartialResult = (data: { partial: string }) => {
      console.log('[NativeBridge] onNativePartialResult:', data.partial);
      this.listeners.onVoicePartial.forEach((cb) => {
        try { cb(data.partial); } catch (e) { console.error(e); }
      });
    };

    (window as any).onNativeResult = (data: { text: string }) => {
      console.log('[NativeBridge] onNativeResult:', data.text);
      this.listeners.onVoiceResult.forEach((cb) => {
        try { cb(data.text); } catch (e) { console.error(e); }
      });
    };
  }

  onLocationUpdate(callback: (data: LocationData) => void): () => void {
    this.listeners.onLocationUpdate.push(callback);
    return () => {
      const idx = this.listeners.onLocationUpdate.indexOf(callback);
      if (idx >= 0) this.listeners.onLocationUpdate.splice(idx, 1);
    };
  }

  onLocationStatusChange(callback: (active: boolean) => void): () => void {
    this.listeners.onLocationStatusChange.push(callback);
    return () => {
      const idx = this.listeners.onLocationStatusChange.indexOf(callback);
      if (idx >= 0) this.listeners.onLocationStatusChange.splice(idx, 1);
    };
  }

  onSOS(callback: (data: SOSData) => void): () => void {
    this.listeners.onSOS.push(callback);
    return () => {
      const idx = this.listeners.onSOS.indexOf(callback);
      if (idx >= 0) this.listeners.onSOS.splice(idx, 1);
    };
  }

  onWarning(callback: (data: WarningData) => void): () => void {
    this.listeners.onWarning.push(callback);
    return () => {
      const idx = this.listeners.onWarning.indexOf(callback);
      if (idx >= 0) this.listeners.onWarning.splice(idx, 1);
    };
  }

  onPermissionsResult(callback: (data: PermissionsResult) => void): () => void {
    this.listeners.onPermissionsResult.push(callback);
    return () => {
      const idx = this.listeners.onPermissionsResult.indexOf(callback);
      if (idx >= 0) this.listeners.onPermissionsResult.splice(idx, 1);
    };
  }

  onLocationPermissionResult(callback: (data: LocationPermissionResult) => void): () => void {
    this.listeners.onLocationPermissionResult.push(callback);
    return () => {
      const idx = this.listeners.onLocationPermissionResult.indexOf(callback);
      if (idx >= 0) this.listeners.onLocationPermissionResult.splice(idx, 1);
    };
  }

  onVoicePartial(callback: (text: string) => void): () => void {
    this.listeners.onVoicePartial.push(callback);
    return () => {
      const idx = this.listeners.onVoicePartial.indexOf(callback);
      if (idx >= 0) this.listeners.onVoicePartial.splice(idx, 1);
    };
  }

  onVoiceResult(callback: (text: string) => void): () => void {
    this.listeners.onVoiceResult.push(callback);
    return () => {
      const idx = this.listeners.onVoiceResult.indexOf(callback);
      if (idx >= 0) this.listeners.onVoiceResult.splice(idx, 1);
    };
  }

  waitForLocation(timeoutMs = 10_000): Promise<LocationData> {
    console.log('[NativeBridge] waitForLocation start, timeout=' + timeoutMs);
    return new Promise((resolve, reject) => {
      const cached = typeof window !== 'undefined' ? window.__lastNativeLocation : undefined;
      if (cached) {
        console.log('[NativeBridge] waitForLocation: using cached', cached);
        resolve(cached);
        return;
      }

      const timer = setTimeout(() => {
        unsubscribe();
        console.warn('[NativeBridge] waitForLocation TIMEOUT');
        reject(new Error('Timeout waiting for native location'));
      }, timeoutMs);

      const handler = (data: LocationData) => {
        clearTimeout(timer);
        unsubscribe();
        console.log('[NativeBridge] waitForLocation resolved:', data);
        resolve(data);
      };

      const unsubscribe = this.onLocationUpdate(handler);
    });
  }

  requestNotificationPermission(): void {
    console.log('[NativeBridge] requestNotificationPermission');
    if (this.isNativeApp() && window.SakbolNative) {
      window.SakbolNative.requestNotificationPermission();
    } else {
      console.warn('[NativeBridge] requestNotificationPermission: not native');
    }
  }

  requestLocationPermission(): void {
    console.log('[NativeBridge] requestLocationPermission');
    if (this.isNativeApp() && window.SakbolNative) {
      window.SakbolNative.requestLocationPermission();
    } else {
      console.warn('[NativeBridge] requestLocationPermission: not native');
    }
  }

  enableVoiceNotifications(): void {
    if (this.isNativeApp() && window.SakbolNative) {
      window.SakbolNative.enableVoiceNotifications();
    }
  }

  disableVoiceNotifications(): void {
    if (this.isNativeApp() && window.SakbolNative) {
      window.SakbolNative.disableVoiceNotifications();
    }
  }

  pauseVoiceListening(): void {
    if (this.isNativeApp() && window.SakbolNative) {
      window.SakbolNative.pauseVoiceListening();
    }
  }

  resumeVoiceListening(): void {
    if (this.isNativeApp() && window.SakbolNative) {
      window.SakbolNative.resumeVoiceListening();
    }
  }

  checkPermissions(): NativePermissions | null {
    if (this.isNativeApp() && window.SakbolNative) {
      try {
        const result = window.SakbolNative.checkPermissions();
        return JSON.parse(result) as NativePermissions;
      } catch (e) {
        console.error('[NativeBridge] Failed to parse permissions:', e);
        return null;
      }
    }
    return null;
  }

  requestCurrentLocation(): void {
    console.log('[NativeBridge] requestCurrentLocation');
    if (this.isNativeApp() && window.SakbolNative) {
      window.SakbolNative.requestCurrentLocation();
    } else {
      console.warn('[NativeBridge] requestCurrentLocation: not native');
    }
  }
}

export const nativeBridge = new NativeBridge();
export default NativeBridge;
