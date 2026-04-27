import { useEffect, useState, useRef } from "react";
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
  const [activeGroup, setActiveGroup] = useState<{id: string; name: string; startedAt: string | null; durationMinutes: number} | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isAgent) return;

    fetchGroups();
  }, [isAgent]);

  // Находим группу с активным туром и загружаем сессию
  useEffect(() => {
    if (!groups || groups.length === 0 || !isAgent) {
      setActiveGroup(null);
      setElapsedSeconds(0);
      return;
    }

    const groupWithActiveTour = groups.find(g => g.has_active_session);
    if (!groupWithActiveTour) {
      setActiveGroup(null);
      setElapsedSeconds(0);
      return;
    }

    // Загружаем сессии чтобы получить started_at
    tourService.getSessions(groupWithActiveTour.id).then((response) => {
      const activeSession = response.data?.find((s: any) => s.status === 'active');
      if (activeSession && activeSession.started_at) {
        setActiveGroup({
          id: groupWithActiveTour.id,
          name: groupWithActiveTour.name,
          startedAt: activeSession.started_at,
          durationMinutes: activeSession.duration_minutes,
        });
        const start = new Date(activeSession.started_at).getTime();
        const now = Date.now();
        setElapsedSeconds(Math.max(0, Math.floor((now - start) / 1000)));
      } else {
        setActiveGroup({
          id: groupWithActiveTour.id,
          name: groupWithActiveTour.name,
          startedAt: null,
          durationMinutes: 60,
        });
        setElapsedSeconds(0);
      }
    }).catch(() => {
      setActiveGroup({
        id: groupWithActiveTour.id,
        name: groupWithActiveTour.name,
        startedAt: null,
        durationMinutes: 60,
      });
      setElapsedSeconds(0);
    });
  }, [groups, isAgent]);

  // Таймер - тик каждую секунду
  useEffect(() => {
    if (!activeGroup || !activeGroup.startedAt) return;

    const interval = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [activeGroup?.startedAt]);

  // Периодическая синхронизация с сервером (каждые 30 сек)
  useEffect(() => {
    if (!activeGroup || !isAgent) return;

    pollRef.current = setInterval(() => {
      tourService.getSessions(activeGroup.id).then((response) => {
        const activeSession = response.data?.find((s: any) => s.status === 'active');
        if (activeSession && activeSession.started_at) {
          const start = new Date(activeSession.started_at).getTime();
          const now = Date.now();
          setElapsedSeconds(Math.max(0, Math.floor((now - start) / 1000)));
          setActiveGroup(prev => prev ? {
            ...prev,
            durationMinutes: activeSession.duration_minutes,
          } : null);
        }
      }).catch(() => {});
    }, 30000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [activeGroup?.id, isAgent]);

  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleCompleteTour = async () => {
    if (!confirm("Завершить тур?")) return;

    try {
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

  const remainingSeconds = Math.max(0, (activeGroup.durationMinutes * 60) - elapsedSeconds);

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-white rounded-full shadow-lg px-4 py-2">
      <div className="flex items-center gap-2">
        <span className="text-2xl">🚌</span>
        <div>
          <p className="text-sm font-semibold text-gray-800">Тур: {activeGroup.name}</p>
          <p className="text-xs text-gray-600">
            ⏱️ {formatTime(elapsedSeconds)} / {formatTime(activeGroup.durationMinutes * 60)}
          </p>
        </div>
      </div>
      <Chip color="warning" variant="flat" size="sm">
        {remainingSeconds > 0 ? `Ост: ${formatTime(remainingSeconds)}` : "Время вышло"}
      </Chip>
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
