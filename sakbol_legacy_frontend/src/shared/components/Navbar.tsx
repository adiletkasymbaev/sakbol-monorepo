// @ts-nocheck
import { addToast, Button } from "@heroui/react";
import { UrlNames } from "../enums/UrlNames";
import IconGear from "../icons/IconGear";
import IconHouse from "../icons/IconHouse";
import IconMapPin from "../icons/IconMapPin";
import IconPerson from "../icons/IconPerson";
import IconSos from "../icons/IconSos";
import NavItem from "./NavItem";
import { useCreateSosSignalMutation } from "../../features/sos/sosApiSlice";
import { ToastTypes } from "../enums/ToastTypes";
import React, { useEffect, useRef, useState } from "react";
import { selectUserLat, selectUserLon } from "../../features/sos/presenceSlice";
import { useSelector } from "react-redux";

function Navbar() {
  const activeClass = "text-[#F39DAA]";
  const inactiveClass = "text-white";
  const [createSosSignal] = useCreateSosSignalMutation();

  const [progress, setProgress] = useState(0);
  const pressingRef = useRef(false);
  const longPressTriggeredRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const pressStartRef = useRef<number | null>(null);

  const clickCountRef = useRef(0);
  const clickTimeoutRef = useRef<number | null>(null);

  const LONG_PRESS_MS = 3000;
  const TRIPLE_CLICK_WINDOW_MS = 600;

  const lat = useSelector(selectUserLat);
  const lon = useSelector(selectUserLon);

  const handleSendSos = async () => {
    try {
      await createSosSignal({ latitude: lat, longitude: lon, type: "emergency" }).unwrap();
      addToast({
        title: "Экстренный СОС-сигнал",
        description: "Сигнал отправлен ближайшим мед. учреждениям",
        color: "danger",
        severity: "success"
      });
    } catch (err) {
      console.error("Ошибка при отправке SOS:", err);
      addToast({
        title: ToastTypes.ERR,
        description: "Не удалось отправить SOS-сигнал — проверьте соединение",
        color: "danger",
      });
    }
  };

  const handleTripleClick = async () => {
    addToast({
      title: "СОС-сигнал",
      description: "Сигнал отправлен вашим избранным контактам",
      color: "warning",
    });
    await createSosSignal({ latitude: lat, longitude: lon, type: "regular" }).unwrap();
    setProgress(100);
    window.setTimeout(() => setProgress(0), 300);
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
        handleSendSos().catch(() => {});
        window.setTimeout(() => setProgress(0), 700);
        return;
      }
      rafRef.current = window.requestAnimationFrame(loop);
    };
    rafRef.current = window.requestAnimationFrame(loop);
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

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== undefined && e.button !== 0) return;
    startProgressAnimation();
  };

  const onPointerUp = () => {
    if (longPressTriggeredRef.current) {
      longPressTriggeredRef.current = false;
      stopProgressAnimation();
      return;
    }
    stopProgressAnimation();

    clickCountRef.current += 1;
    if (clickTimeoutRef.current) {
      window.clearTimeout(clickTimeoutRef.current);
    }

    clickTimeoutRef.current = window.setTimeout(() => {
      if (clickCountRef.current >= 3) handleTripleClick();
      clickCountRef.current = 0;
      clickTimeoutRef.current = null;
    }, TRIPLE_CLICK_WINDOW_MS);
  };

  const onPointerCancelOrLeave = () => {
    stopProgressAnimation();
  };

  useEffect(() => {
    return () => {
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
      if (clickTimeoutRef.current) window.clearTimeout(clickTimeoutRef.current);
    };
  }, []);

  const size = 48;
  const stroke = 3;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress / 100);

  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full z-[99999] bg-primary p-2 rounded-t-md">
      <div className="flex justify-between relative items-center">

        {/* Левая группа */}
        <div className="flex gap-5">
          <NavItem link="/" icon={<IconHouse className="w-5 h-5" />} activeClass={activeClass} inactiveClass={inactiveClass}>
            Главная
          </NavItem>

          <NavItem link={"/" + UrlNames.SOS_CONTACTS} icon={<IconMapPin className="w-5 h-5" />} activeClass={activeClass} inactiveClass={inactiveClass}>
            Контакты
          </NavItem>
        </div>

        {/* Кнопка SOS — оригинальный стиль */}
        <div className="sos-button-wrap relative flex items-center justify-center">
          <svg width={size} height={size} className="absolute pointer-events-none">
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              strokeWidth={stroke}
              stroke="rgba(249,204,36,0.95)"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              style={{
                transition: "stroke-dashoffset 120ms linear, opacity 200ms",
                opacity: progress > 0 ? 1 : 0,
              }}
            />
          </svg>

          <Button
            isIconOnly
            className="sos-button relative z-10"
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerCancelOrLeave}
            onPointerCancel={onPointerCancelOrLeave}
          >
            <IconSos />
          </Button>
        </div>

        {/* Правая группа */}
        <div className="flex gap-4">
          <NavItem link={"/" + UrlNames.SOS_SETTINGS} icon={<IconGear className="w-5 h-5" />} activeClass={activeClass} inactiveClass={inactiveClass}>
            Настройки
          </NavItem>

          <NavItem link={"/" + UrlNames.SOS_PROFILE} icon={<IconPerson className="w-5 h-5" />} activeClass={activeClass} inactiveClass={inactiveClass}>
            Профиль
          </NavItem>
        </div>

      </div>
    </div>
  );
}

export default Navbar;