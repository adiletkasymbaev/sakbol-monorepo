import { Input, TimeInput, Button } from "@heroui/react";
import { useZonesStore } from "../hooks/useZonesStore";

export default function DrawPanel() {
  const polyName = useZonesStore((s) => s.polyName);
  const polyColor = useZonesStore((s) => s.polyColor);
  const startTime = useZonesStore((s) => s.startTime);
  const endTime = useZonesStore((s) => s.endTime);

  const setPolyName = useZonesStore((s) => s.setPolyName);
  const setPolyColor = useZonesStore((s) => s.setPolyColor);
  const setStartTime = useZonesStore((s) => s.setStartTime);
  const setEndTime = useZonesStore((s) => s.setEndTime);

  const clearZones = useZonesStore((s) => s.clearZones);

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

      <Button color="secondary" onPress={clearZones}>
        Очистить зоны
      </Button>
    </div>
  );
}