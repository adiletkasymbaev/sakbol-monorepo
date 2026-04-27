import { Input, TimeInput, Button, Spinner, Chip, Tooltip } from "@heroui/react";
import { useZonesStore } from "../hooks/useZonesStore";
import useAuth from "../../../store/useAuth";
import { baseURL } from "../../../shared/services/axios";
import { useAcceptedContacts } from "../hooks/useAcceptedContacts";
import { useState, useMemo } from "react";
import Heading from "../../../shared/components/Heading";
import Margin from "../../../shared/components/Margin";

// Icons
const ZONE_ICON = (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2l-9.53 6.82 3.64 11.18h11.78l3.64-11.18z"/>
  </svg>
);

const CLOCK_ICON = (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
);

const PALETTE_ICON = (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="13.5" cy="6.5" r=".5"/>
    <circle cx="17.5" cy="10.5" r=".5"/>
    <circle cx="8.5" cy="7.5" r=".5"/>
    <circle cx="6.5" cy="12.5" r=".5"/>
    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>
  </svg>
);

const USER_ICON = (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const TRASH_ICON = (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
  </svg>
);

const INFO_ICON = (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="16" x2="12" y2="12"/>
    <line x1="12" y1="8" x2="12.01" y2="8"/>
  </svg>
);

const ALERT_ICON = (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

const CHECK_ICON = (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

export default function DrawPanel() {
  const polyName = useZonesStore((s) => s.polyName);
  const polyColor = useZonesStore((s) => s.polyColor);
  const startTime = useZonesStore((s) => s.startTime);
  const endTime = useZonesStore((s) => s.endTime);
  const selected = useZonesStore((s) => s.selectedChildren);
  const isSaving = useZonesStore((s) => s.isSaving);
  const saveError = useZonesStore((s) => s.saveError);
  const isLoadingZones = useZonesStore((s) => s.isLoadingZones);

  const setPolyName = useZonesStore((s) => s.setPolyName);
  const setPolyColor = useZonesStore((s) => s.setPolyColor);
  const setStartTime = useZonesStore((s) => s.setStartTime);
  const setEndTime = useZonesStore((s) => s.setEndTime);
  const toggleChild = useZonesStore((s) => s.toggleChild);
  const clearZones = useZonesStore((s) => s.clearZones);

  const currentUserId = useAuth((s) => s.userId);
  const { options: contacts, loading: contactsLoading } = useAcceptedContacts(currentUserId);

  const [showValidation, setShowValidation] = useState(false);

  // Validation states
  const validations = useMemo(() => {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (showValidation) {
      if (!polyName.trim()) {
        errors.push("Укажите название зоны");
      }
      if (selected.length === 0) {
        errors.push("Выберите хотя бы одного ребенка");
      }
    }

    // Warnings for time validation
    if (startTime && endTime) {
      const startHour = startTime.hour ?? 0;
      const startMinute = startTime.minute ?? 0;
      const endHour = endTime.hour ?? 0;
      const endMinute = endTime.minute ?? 0;
      
      const startMinutes = startHour * 60 + startMinute;
      const endMinutes = endHour * 60 + endMinute;
      
      if (endMinutes <= startMinutes) {
        warnings.push("Время отбытия должно быть позже времени прибытия");
      }
    }

    return { errors, warnings, isValid: errors.length === 0 };
  }, [polyName, selected, startTime, endTime, showValidation]);

  const handleClearZones = async () => {
    if (window.confirm("Вы уверены, что хотите удалить все зоны? Это действие нельзя отменить.")) {
      await clearZones();
    }
  };

  const hasSelectedChildren = selected.length > 0;

  return (
    <div className="absolute bottom-[80px] right-[12px] w-[320px] max-h-[calc(100vh-140px)] overflow-y-auto draw-panel-scroll bg-white rounded-2xl shadow-xl z-[1000] flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white">
            {ZONE_ICON}
          </div>
          <div>
            <Heading variant="card">Создание зоны</Heading>
            <p className="text-xs text-gray-500">Нарисуйте зону на карте</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-4">
        
        {/* Zone Name Section */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            {ZONE_ICON}
            Название зоны
          </label>
          <Input
            type="text"
            placeholder="Например: Школа, Дом, Детский сад"
            value={polyName}
            onChange={(e) => setPolyName(e.target.value)}
            className="w-full"
            classNames={{
              input: "text-sm",
            }}
          />
          {showValidation && !polyName.trim() && (
            <div className="flex items-center gap-1.5 text-xs text-red-500">
              {ALERT_ICON}
              Обязательное поле
            </div>
          )}
        </div>

        {/* Time Settings Section */}
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            {CLOCK_ICON}
            Время посещения
          </label>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <span className="text-xs text-gray-500">Прибытие</span>
              <TimeInput
                value={startTime}
                hourCycle={24}
                hideTimeZone
                onChange={(value) => setStartTime(value)}
                className="w-full"
              />
            </div>
            <div className="space-y-1">
              <span className="text-xs text-gray-500">Отбытие</span>
              <TimeInput
                value={endTime}
                hourCycle={24}
                hideTimeZone
                onChange={(value) => setEndTime(value)}
                className="w-full"
              />
            </div>
          </div>

          {validations.warnings.map((warning, idx) => (
            <div key={idx} className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 p-2 rounded-lg">
              {INFO_ICON}
              {warning}
            </div>
          ))}
        </div>

        {/* Color Picker Section */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            {PALETTE_ICON}
            Цвет зоны
          </label>
          <div className="flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-xl border-2 border-gray-200 shadow-sm transition-transform hover:scale-105"
              style={{ backgroundColor: polyColor }}
            />
            <input
              type="color"
              value={polyColor}
              onChange={(e) => setPolyColor(e.target.value)}
              className="flex-1 h-10 cursor-pointer rounded-lg border border-gray-200"
            />
          </div>
        </div>

        {/* Children Selection Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              {USER_ICON}
              Дети в зоне
              <Tooltip content="Выберите детей, которые должны находиться в этой зоне">
                <span className="text-gray-400 cursor-help">{INFO_ICON}</span>
              </Tooltip>
            </label>
            {hasSelectedChildren && (
              <Chip size="sm" color="primary" variant="flat">
                {selected.length} выбрано
              </Chip>
            )}
          </div>

          {contactsLoading ? (
            <div className="flex items-center justify-center gap-2 py-4 text-gray-400">
              <Spinner size="sm" />
              <span className="text-sm">Загрузка контактов...</span>
            </div>
          ) : contacts.length === 0 ? (
            <div className="text-center py-4 bg-gray-50 rounded-xl">
              <p className="text-sm text-gray-500">Нет принятых контактов</p>
              <p className="text-xs text-gray-400 mt-1">Добавьте детей в контакты</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 max-h-[120px] overflow-y-auto p-1">
              {contacts.map((c) => {
                const isSelected = selected.includes(c.userId);
                return (
                  <button
                    key={c.userId}
                    type="button"
                    onClick={() => toggleChild(c.userId)}
                    className={`
                      flex items-center gap-2 px-3 py-2 rounded-xl text-sm border-2 transition-all duration-200
                      ${isSelected 
                        ? "bg-primary text-white border-primary shadow-md" 
                        : "bg-white text-gray-700 border-gray-200 hover:border-primary/50 hover:bg-gray-50"
                      }
                    `}
                  >
                    {c.avatar && (
                      <img
                        src={c.avatar.startsWith("http") ? c.avatar : `${baseURL}${c.avatar}`}
                        alt={c.label}
                        className="w-5 h-5 rounded-full object-cover border border-white/50"
                      />
                    )}
                    <span className="font-medium">{c.label}</span>
                    {isSelected && (
                      <span className="flex items-center justify-center w-4 h-4 bg-white/20 rounded-full">
                        {CHECK_ICON}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {showValidation && selected.length === 0 && (
            <div className="flex items-center gap-1.5 text-xs text-red-500">
              {ALERT_ICON}
              Выберите хотя бы одного ребенка
            </div>
          )}
        </div>

        {/* Validation Errors */}
        {validations.errors.length > 0 && (
          <div className="bg-red-50 border border-red-100 rounded-xl p-3 space-y-1">
            <div className="flex items-center gap-1.5 text-sm font-medium text-red-600">
              {ALERT_ICON}
              Исправьте ошибки:
            </div>
            <ul className="space-y-1">
              {validations.errors.map((error, idx) => (
                <li key={idx} className="text-xs text-red-500 pl-5">
                  • {error}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Save Error */}
        {saveError && (
          <div className="bg-red-50 border border-red-100 rounded-xl p-3">
            <div className="flex items-start gap-2">
              {ALERT_ICON}
              <span className="text-sm text-red-600">{saveError}</span>
            </div>
          </div>
        )}

        {/* Loading Indicator */}
        {(isSaving || isLoadingZones) && (
          <div className="flex items-center justify-center gap-2 py-2 text-gray-500">
            <Spinner size="sm" />
            <span className="text-sm">
              {isSaving ? "Сохранение зоны..." : "Загрузка зон..."}
            </span>
          </div>
        )}

      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl">
        <div className="flex flex-col gap-2">
          <Tooltip content="Удалить все зоны с карты и из базы данных">
            <Button 
              color="danger" 
              variant="flat" 
              onPress={handleClearZones}
              isDisabled={isSaving || isLoadingZones}
              className="w-full"
              startContent={TRASH_ICON}
            >
              Очистить все зоны
            </Button>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}
