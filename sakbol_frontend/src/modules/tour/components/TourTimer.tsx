import { useEffect, useState } from "react";
import { Button, Chip } from "@heroui/react";
import { addToast } from "@heroui/react";
import { ToastTypes } from "../../../shared/enums/ToastTypes";
import useTour from "../../../store/useTour";
import useAuth from "../../../store/useAuth";
import { ProfileRoles } from "../../../shared/enums/ProfileRoles";
import { tourService } from "../../../shared/services/tourService";

/**
 * Компонент кнопки и таймера активного тура на главной странице.
 * Показывает только тур-агентам при активном туре.
 */
export default function TourTimer() {
  const { groups, fetchGroups, completeTour } = useTour();
  const userRole = useAuth((state) => state.userRole);
  const isAgent = userRole === ProfileRoles.TOUR_AGENCY;
  const [activeGroup, setActiveGroup] = useState<{id: string; name: string; elapsed: number; remaining: number} | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!isAgent) return;

    fetchGroups();
  }, [isAgent]);

  // Находим группу с активным туром
  useEffect(() => {
    if (!groups || groups.length === 0) {
      setActiveGroup(null);
      return;
    }

    const groupWithActiveTour = groups.find(g => g.has_active_session);
    if (groupWithActiveTour) {
      setActiveGroup({
        id: groupWithActiveTour.id,
        name: groupWithActiveTour.name,
        elapsed: 0,
        remaining: 0,
      });
    } else {
      setActiveGroup(null);
    }
  }, [groups]);

  // Таймер - тик каждую секунду
  useEffect(() => {
    if (!activeGroup) return;

    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [activeGroup]);

  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleCompleteTour = async () => {
    if (!confirm("Завершить тур?")) return;

    try {
      // Находим активную сессию для завершения
      const response = await tourService.getSessions(activeGroup!.id);
      const activeSession = response.data.find((s: any) => s.status === 'active');
      if (activeSession) {
        await completeTour(activeSession.id);
        addToast({
          title: ToastTypes.OK,
          description: "Тур завершен",
          color: "success",
        });
      }
    } catch (error) {
      console.error("Error completing tour:", error);
      addToast({
        title: ToastTypes.ERR,
        description: "Не удалось завершить тур",
        color: "danger",
      });
    }
  };

  if (!isAgent || !activeGroup) {
    return null;
  }

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-white rounded-full shadow-lg px-4 py-2">
      <div className="flex items-center gap-2">
        <span className="text-2xl">🚌</span>
        <div>
          <p className="text-sm font-semibold text-gray-800">Тур: {activeGroup.name}</p>
          <p className="text-xs text-gray-600">⏱️ {formatTime(tick)}</p>
        </div>
      </div>
      <Chip color="warning" variant="flat" size="sm">Идет</Chip>
      <Button
        size="sm"
        color="success"
        variant="bordered"
        onPress={handleCompleteTour}
      >
        Завершить
      </Button>
    </div>
  );
}
