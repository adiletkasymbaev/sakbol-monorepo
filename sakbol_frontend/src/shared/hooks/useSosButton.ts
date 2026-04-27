import { addToast } from "@heroui/react";
import { useEffect, useRef, useState } from "react";
import { ToastTypes } from "../enums/ToastTypes";
import { getGeolocation } from "../utils/getGeolocation";
import { alertsService } from "../services/sosService";
import { useTranslation } from "react-i18next";

type Options = {
  longPressMs?: number;
  tripleClickWindowMs?: number;
};

export function useSosButton(options: Options = {}) {
  const { t } = useTranslation();
  const LONG_PRESS_MS = options.longPressMs ?? 3000;
  const TRIPLE_CLICK_WINDOW_MS = options.tripleClickWindowMs ?? 600;

  const [progress, setProgress] = useState(0);

  const pressingRef = useRef(false);
  const longPressTriggeredRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const pressStartRef = useRef<number | null>(null);

  const clickCountRef = useRef(0);
  const clickTimeoutRef = useRef<number | null>(null);

  const cleanupTimers = () => {
    if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
    rafRef.current = null;

    if (clickTimeoutRef.current) window.clearTimeout(clickTimeoutRef.current);
    clickTimeoutRef.current = null;
  };

  const stopProgressAnimation = () => {
    pressingRef.current = false;

    if (rafRef.current) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    if (!longPressTriggeredRef.current) {
      setProgress(0);
    }

    pressStartRef.current = null;
  };

  const sendEmergencySos = async () => {
    try {
      await getGeolocation(
        {
          onSuccess: async (result) => {
            await alertsService.create({
              latitude: result.latitude,
              longitude: result.longitude,
            });

            addToast({
              title: t('sos.button.label'),
              description: t('sos.button.sentToContacts'),
              color: "warning",
            });
          },
          onError: (error) => {
            console.error(t('sos.errors.geolocationError'), error);
            addToast({
              title: ToastTypes.ERR,
              description: t('sos.errors.geolocation'),
              color: "danger",
            });
          },
        },
        { enableHighAccuracy: true }
      );
    } catch (err) {
      console.error("Ошибка при отправке SOS:", err);
      addToast({
        title: ToastTypes.ERR,
        description: t('sos.errors.sendFailed'),
        color: "danger",
      });
    }
  };

  const sendRegularSos = async () => {
    try {
      await getGeolocation(
        {
          onSuccess: async (result) => {
            await alertsService.create({
              latitude: result.latitude,
              longitude: result.longitude,
            });

            addToast({
              title: t('sos.button.label'),
              description: t('sos.button.sentToContacts'),
              color: "warning",
            });

            setProgress(100);
            window.setTimeout(() => setProgress(0), 300);
          },
          onError: (error) => {
            console.error(t('sos.errors.geolocationError'), error);
            addToast({
              title: ToastTypes.ERR,
              description: t('sos.errors.geolocation'),
              color: "danger",
            });
          },
        },
        { enableHighAccuracy: true }
      );
    } catch (err) {
      console.error("Ошибка при отправке SOS regular:", err);
      addToast({
        title: ToastTypes.ERR,
        description: t('sos.errors.sendFailed'),
        color: "danger",
      });
    }
  };

  const startProgressAnimation = () => {
    pressStartRef.current = Date.now();
    longPressTriggeredRef.current = false;
    pressingRef.current = true;

    const loop = () => {
      if (!pressingRef.current || pressStartRef.current == null) return;

      const elapsed = Date.now() - pressStartRef.current;
      const p = Math.min(100, (elapsed / LONG_PRESS_MS) * 100);
      setProgress(p);

      if (elapsed >= LONG_PRESS_MS) {
        longPressTriggeredRef.current = true;
        pressingRef.current = false;

        setProgress(100);
        sendEmergencySos().catch(() => {});
        window.setTimeout(() => setProgress(0), 700);

        return;
      }

      rafRef.current = window.requestAnimationFrame(loop);
    };

    rafRef.current = window.requestAnimationFrame(loop);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== undefined && e.button !== 0) return;
    startProgressAnimation();
  };

  const onPointerUp = () => {
    // если сработал лонг-пресс — просто завершаем
    if (longPressTriggeredRef.current) {
      longPressTriggeredRef.current = false;
      stopProgressAnimation();
      return;
    }

    stopProgressAnimation();

    // тройной клик
    clickCountRef.current += 1;

    if (clickTimeoutRef.current) {
      window.clearTimeout(clickTimeoutRef.current);
    }

    clickTimeoutRef.current = window.setTimeout(() => {
      if (clickCountRef.current >= 3) {
        sendRegularSos().catch(() => {});
      }
      clickCountRef.current = 0;
      clickTimeoutRef.current = null;
    }, TRIPLE_CLICK_WINDOW_MS);
  };

  const onPointerCancelOrLeave = () => {
    stopProgressAnimation();
  };

  useEffect(() => cleanupTimers, []);

  return {
    progress,
    handlers: {
      onPointerDown,
      onPointerUp,
      onPointerLeave: onPointerCancelOrLeave,
      onPointerCancel: onPointerCancelOrLeave,
    },
  };
}