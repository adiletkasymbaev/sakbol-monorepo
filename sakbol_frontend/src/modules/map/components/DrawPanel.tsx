import { Input, TimeInput, Button, Spinner } from "@heroui/react";
import { useZonesStore } from "../hooks/useZonesStore";
import useAuth from "../../../store/useAuth";
import { baseURL } from "../../../shared/services/axios";
import { useAcceptedContacts } from "../hooks/useAcceptedContacts";

export default function DrawPanel() {
  const polyName   = useZonesStore((s) => s.polyName);
  const polyColor  = useZonesStore((s) => s.polyColor);
  const startTime  = useZonesStore((s) => s.startTime);
  const endTime    = useZonesStore((s) => s.endTime);
  const selected   = useZonesStore((s) => s.selectedChildren);
  const isSaving   = useZonesStore((s) => s.isSaving);
  const saveError  = useZonesStore((s) => s.saveError);

  const setPolyName  = useZonesStore((s) => s.setPolyName);
  const setPolyColor = useZonesStore((s) => s.setPolyColor);
  const setStartTime = useZonesStore((s) => s.setStartTime);
  const setEndTime   = useZonesStore((s) => s.setEndTime);
  const toggleChild  = useZonesStore((s) => s.toggleChild);
  const clearZones   = useZonesStore((s) => s.clearZones);

  // current user id to resolve "other side" of contact
  const currentUserId = useAuth((s) => s.userId);
  const { options: contacts, loading: contactsLoading } = useAcceptedContacts(currentUserId);

  return (
    <div className="absolute bottom-[66px] right-[5px] w-1/2 bg-white p-2 rounded shadow z-[1000] flex flex-col gap-2">
      <Input
        type="text"
        placeholder="Название зоны"
        value={polyName}
        onChange={(e) => setPolyName(e.target.value)}
      />

      <TimeInput
        label="Время прибытия"
        value={startTime}
        hourCycle={24}
        hideTimeZone
        onChange={(value) => setStartTime(value)}
      />

      <TimeInput
        label="Время отбытия"
        value={endTime}
        hourCycle={24}
        hideTimeZone
        onChange={(value) => setEndTime(value)}
      />

      <label className="flex items-center">
        <span className="w-2/4 text-sm">Цвет зоны:</span>
        <input
          type="color"
          value={polyColor}
          onChange={(e) => setPolyColor(e.target.value)}
          className="w-3/5"
        />
      </label>

      {/* ── Contact chips picker ─────────────────────────────────── */}
      <div className="flex flex-col gap-1">
        <span className="text-xs text-gray-500 font-medium">Дети в зоне:</span>

        {contactsLoading ? (
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Spinner size="sm" /> Загрузка контактов…
          </div>
        ) : contacts.length === 0 ? (
          <span className="text-xs text-gray-400">Нет принятых контактов</span>
        ) : (
          <div className="flex flex-wrap gap-1">
            {contacts.map((c) => {
              const isSelected = selected.includes(c.userId);
              return (
                <button
                  key={c.userId}
                  type="button"
                  onClick={() => toggleChild(c.userId)}
                  className={[
                    "flex items-center gap-1 px-2 py-1 rounded-full text-xs border transition-all",
                    isSelected
                      ? "bg-secondary text-white border-secondary"
                      : "bg-gray-100 text-gray-700 border-gray-200 hover:border-secondary",
                  ].join(" ")}
                >
                  {c.avatar && (
                    <img
                      src={c.avatar.startsWith("http") ? c.avatar : `${baseURL}${c.avatar}`}
                      alt={c.label}
                      className="w-4 h-4 rounded-full object-cover"
                    />
                  )}
                  {c.label}
                </button>
              );
            })}
          </div>
        )}

        {selected.length > 0 && (
          <span className="text-xs text-secondary">
            Выбрано: {selected.length}
          </span>
        )}
      </div>
      {/* ─────────────────────────────────────────────────────────── */}

      {saveError && (
        <p className="text-xs text-red-500">{saveError}</p>
      )}

      {isSaving && (
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Spinner size="sm" /> Сохранение…
        </div>
      )}

      <Button color="secondary" onPress={clearZones} isDisabled={isSaving}>
        Очистить зоны
      </Button>
    </div>
  );
}