import { useEffect, useState, useCallback } from 'react';
import { nativeBridge, LocationData, SOSData, WarningData, NativePermissions } from '../services/nativeBridge';
import { nativeService } from '../services/nativeService';

interface UseNativeReturn {
  isNative: boolean;
  permissions: NativePermissions | null;
  lastLocation: LocationData | null;
  isLocationActive: boolean;
  
  // Actions
  requestNotificationPermission: () => void;
  requestLocationPermission: () => void;
  enableNotifications: () => void;
  disableNotifications: () => void;
  pauseVoiceListening: () => void;
  resumeVoiceListening: () => void;
  refreshPermissions: () => void;
}

export function useNative(): UseNativeReturn {
  const [isNative, setIsNative] = useState(false);
  const [permissions, setPermissions] = useState<NativePermissions | null>(null);
  const [lastLocation, setLastLocation] = useState<LocationData | null>(null);
  const [isLocationActive, setIsLocationActive] = useState(false);

  useEffect(() => {
    setIsNative(nativeBridge.isNativeApp());

    const unsubLoc = nativeBridge.onLocationUpdate((data) => {
      setLastLocation(data);
    });

    const unsubStatus = nativeBridge.onLocationStatusChange((active) => {
      setIsLocationActive(active);
    });

    refreshPermissions();
    nativeService.initialize();

    return () => {
      unsubLoc();
      unsubStatus();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshPermissions = useCallback(() => {
    const perms = nativeBridge.checkPermissions();
    setPermissions(perms);
  }, []);

  const requestNotificationPermission = useCallback(() => {
    nativeBridge.requestNotificationPermission();
  }, []);

  const requestLocationPermission = useCallback(() => {
    nativeBridge.requestLocationPermission();
  }, []);

  const enableNotifications = useCallback(() => {
    nativeService.enableNotifications();
  }, []);

  const disableNotifications = useCallback(() => {
    nativeService.disableNotifications();
  }, []);

  const pauseVoiceListening = useCallback(() => {
    nativeBridge.pauseVoiceListening();
  }, []);

  const resumeVoiceListening = useCallback(() => {
    nativeBridge.resumeVoiceListening();
  }, []);

  return {
    isNative,
    permissions,
    lastLocation,
    isLocationActive,
    requestNotificationPermission,
    requestLocationPermission,
    enableNotifications,
    disableNotifications,
    pauseVoiceListening,
    resumeVoiceListening,
    refreshPermissions,
  };
}

export function useSOSListener(callback: (data: SOSData) => void) {
  useEffect(() => {
    const unsub = nativeBridge.onSOS(callback);
    return unsub;
  }, [callback]);
}

export function useWarningListener(callback: (data: WarningData) => void) {
  useEffect(() => {
    const unsub = nativeBridge.onWarning(callback);
    return unsub;
  }, [callback]);
}

export function useLocationListener(callback: (data: LocationData) => void) {
  useEffect(() => {
    const unsub = nativeBridge.onLocationUpdate(callback);
    return unsub;
  }, [callback]);
}

export default useNative;
