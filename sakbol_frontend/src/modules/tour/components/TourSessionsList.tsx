import { useEffect, useState } from "react";
import { Card, CardBody, Button, Chip, Skeleton, Modal, ModalContent, ModalHeader, ModalBody } from "@heroui/react";
import { addToast } from "@heroui/react";
import { ToastTypes } from "../../../shared/enums/ToastTypes";
import useTour from "../../../store/useTour";
import CreateTourSessionForm from "./CreateTourSessionForm";
import Margin from "../../../shared/components/Margin";
import useAuth from "../../../store/useAuth";
import { ProfileRoles } from "../../../shared/enums/ProfileRoles";

interface TourSessionsListProps {
  groupId: string;
}

export default function TourSessionsList({ groupId }: TourSessionsListProps) {
  const { sessions, isSessionsLoading, fetchSessions, startTour, completeTour, cancelTour } = useTour();
  const userRole = useAuth((state) => state.userRole);
  const isAgent = userRole === ProfileRoles.TOUR_AGENCY;
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    fetchSessions(groupId);
  }, [groupId]);

  const handleSessionCreated = () => {
    setIsCreateModalOpen(false);
    fetchSessions(groupId);
  };

  const handleStartTour = async (sessionId: number) => {
    const duration = prompt("Длительность тура в минутах:", "60");
    if (!duration) return;
    
    const durationNum = parseInt(duration, 10);
    if (isNaN(durationNum) || durationNum < 1 || durationNum > 1440) {
      addToast({
        title: ToastTypes.ERR,
        description: "Неверная длительность (1-1440 минут)",
        color: "danger",
      });
      return;
    }

    await startTour(sessionId, durationNum);
    fetchSessions(groupId);
    addToast({
      title: ToastTypes.OK,
      description: "Тур начался!",
      color: "success",
    });
  };

  const handleCompleteTour = async (sessionId: number) => {
    if (!confirm("Завершить тур?")) return;
    await completeTour(sessionId);
    fetchSessions(groupId);
    addToast({
      title: ToastTypes.OK,
      description: "Тур завершен",
      color: "success",
    });
  };

  const handleCancelTour = async (sessionId: number) => {
    if (!confirm("Отменить тур?")) return;
    await cancelTour(sessionId);
    fetchSessions(groupId);
    addToast({
      title: ToastTypes.OK,
      description: "Тур отменен",
      color: "warning",
    });
  };

  const getStatusChip = (status: string) => {
    const config: Record<string, { color: string; label: string }> = {
      draft: { color: "default", label: "Черновик" },
      active: { color: "warning", label: "Идет" },
      completed: { color: "success", label: "Завершен" },
      cancelled: { color: "danger", label: "Отменен" },
    };
    const c = config[status] || { color: "default", label: status };
    return <Chip size="sm" variant="flat" color={c.color as any}>{c.label}</Chip>;
  };

  const formatTime = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}ч ${m}м`;
  };

  if (isSessionsLoading) {
    return (
      <div className="flex flex-col gap-2">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardBody>
              <Skeleton className="w-3/4 rounded-lg">
                <div className="h-4 bg-default-200 rounded-lg" />
              </Skeleton>
            </CardBody>
          </Card>
        ))}
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center py-8 text-default-500">
        <p>У группы пока нет туров</p>
        {isAgent && (
          <Button
            size="sm"
            color="primary"
            variant="light"
            onPress={() => setIsCreateModalOpen(true)}
          >
            + Создать тур
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center mb-2">
        <p className="text-sm text-default-600">
          Туры позволяют отслеживать участников в реальном времени
        </p>
        {isAgent && (
          <Button
            size="sm"
            color="primary"
            onPress={() => setIsCreateModalOpen(true)}
          >
            + Создать тур
          </Button>
        )}
      </div>

      {sessions.map((session) => (
        <Card key={session.id}>
          <CardBody>
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-medium">{session.group_name}</p>
                <p className="text-xs text-default-500">
                  Создан: {new Date(session.created_at).toLocaleDateString()}
                </p>
              </div>
              {getStatusChip(session.status)}
            </div>

            <div className="flex gap-4 text-sm mb-3">
              <span>⏱️ {formatTime(session.elapsed_minutes)} / {formatTime(session.duration_minutes)}</span>
              {session.remaining_minutes > 0 && session.status === "active" && (
                <span className="text-warning">Осталось: {formatTime(session.remaining_minutes)}</span>
              )}
            </div>

            {isAgent && session.status === "draft" && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  color="success"
                  onPress={() => handleStartTour(session.id)}
                >
                  ▶ Начать тур
                </Button>
                <Button
                  size="sm"
                  color="danger"
                  variant="light"
                  onPress={() => handleCancelTour(session.id)}
                >
                  Отменить
                </Button>
              </div>
            )}

            {isAgent && session.status === "active" && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  color="success"
                  variant="bordered"
                  onPress={() => handleCompleteTour(session.id)}
                >
                  ✓ Завершить
                </Button>
                <Button
                  size="sm"
                  color="danger"
                  variant="light"
                  onPress={() => handleCancelTour(session.id)}
                >
                  ✕ Отменить
                </Button>
              </div>
            )}

            {session.status === "completed" && (
              <p className="text-xs text-success">
                ✓ Завершен {new Date(session.ended_at!).toLocaleString()}
              </p>
            )}
          </CardBody>
        </Card>
      ))}

      {/* Modal создания сессии */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      >
        <ModalContent>
          <ModalHeader>Создать новый тур</ModalHeader>
          <ModalBody>
            <CreateTourSessionForm
              groupId={groupId}
              onSuccess={handleSessionCreated}
              onCancel={() => setIsCreateModalOpen(false)}
            />
          </ModalBody>
        </ModalContent>
      </Modal>

      <Margin direction="b" value={4} />
    </div>
  );
}
