import React, { useState, useRef, useEffect, type Dispatch, type SetStateAction } from "react";
import MyLocationButton from "./MyLocationButton";
import EditZoneButton from "./EditZoneButton";
import { useZonesStore } from "../hooks/useZonesStore";
import useAuth from "../../../store/useAuth";
import { ProfileRoles } from "../../../shared/enums/ProfileRoles";

interface ComponentProps {
  children: React.ReactNode;
  isOpen: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}

export default function BottomSheet({ children, isOpen, setOpen }: ComponentProps) {
  const [height, setHeight] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  const {
    isDrawable
  } = useZonesStore();

  const {
    userRole
  } = useAuth();

  useEffect(() => {
    if (!contentRef.current) return;

    const updateHeight = () => {
      if (contentRef.current) {
        setHeight(contentRef.current.scrollHeight);
      }
    };

    // Обновляем сразу
    updateHeight();

    // Создаём ResizeObserver, чтобы следить за изменением размера children
    const observer = new ResizeObserver(() => {
      updateHeight();
    });

    observer.observe(contentRef.current);

    return () => observer.disconnect();
  }, [children]); // можно добавить children, чтобы обновлять при смене

  return (
    <div className="fixed inset-x-0 bottom-12 z-[9998]">
      {/* Кнопка управления */}
      <div className="flex justify-center">
        <div className="bg-white w-full h-3 relative">
          <div className="absolute -top-16 left-2 flex gap-3">
            <MyLocationButton/>
            {((userRole === ProfileRoles.PARENT || userRole === ProfileRoles.TOUR_AGENCY) && isOpen === false) && (
              <EditZoneButton/>
            )}
          </div>
          
          {isDrawable === false && (
            <img
              className={`absolute right-6 -top-2 cursor-pointer transition-transform duration-300 ${
                isOpen ? 'scale-y-[-1]' : 'scale-y-100'
              }`}
              src="images/toggler.png"
              alt="toggler image"
              onClick={() => setOpen((prev: boolean) => !prev)}
            />
          )}
        </div>
      </div>

      {/* Меню */}
      <div
        style={{
          height: isOpen ? height : 0,
        }}
        className="transition-all duration-300 bg-white shadow-xl overflow-hidden max-h-[300px] overflow-y-auto"
      >
        <div ref={contentRef} className="p-3 pt-0">
          {children}
        </div>
      </div>
    </div>
  );
}