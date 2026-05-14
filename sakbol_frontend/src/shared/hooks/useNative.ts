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

/**
 * React Hook для работы с нативным Android функционалом
 * 
 * Пример использования:
 * ```tsx
 * function MyComponent() {
 *   const { isNative, lastLocation, enableNotifications } = useNative();
 *   
 *   useEffect(() => {
 *     if (isNative) {
 *       enableNotifications();
 *     }
 *   }, [isNative]);
 *   
 *   return <div>Location: {lastLocation?.latitude}</div>;
 * }
 * ```
 */
export function useNative(): UseNativeReturn {
  const [isNative, setIsNative] = useState(false);
  const [permissions, setPermissions] = useState<NativePermissions | null>(null);
  const [lastLocation, setLastLocation] = useState<LocationData | null>(null);
  const [isLocationActive, setIsLocationActive] = useState(false);

  useEffect(() => {
    // Определяем, нативное ли приложение
    setIsNative(nativeBridge.isNativeApp());

    // Устанавливаем слушатели
    nativeBridge.onLocationUpdate((data) => {
      setLastLocation(data);
    });

    nativeBridge.onLocationStatusChange((active) => {
      setIsLocationActive(active);
    });

    // Загружаем текущие разрешения
    refreshPermissions();

    // Инициализируем сервис
    nativeService.initialize();
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

/**
 * Hook для отслеживания SOS событий
 * 
 * Пример:
 * ```tsx
 * function SOSScreen() {
 *   useSOSListener((sosData) => {
 *     console.log('SOS triggered:', sosData);
 *     // Показать экстренный экран
 *   });
 *   
 *   return <div>SOS Screen</div>;
 * }
 * ```
 */
export function useSOSListener(callback: (data: SOSData) => void) {
  useEffect(() => {
    nativeBridge.onSOS(callback);
  }, [callback]);
}

/**
 * Hook для отслеживания предупреждений
 */
export function useWarningListener(callback: (data: WarningData) => void) {
  useEffect(() => {
    nativeBridge.onWarning(callback);
  }, [callback]);
}

/**
 * Hook для отслеживания обновлений геолокации
 */
export function useLocationListener(callback: (data: LocationData) => void) {
  useEffect(() => {
    nativeBridge.onLocationUpdate(callback);
  }, [callback]);
}

export default useNative;
