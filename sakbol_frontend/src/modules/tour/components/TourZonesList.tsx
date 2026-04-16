import { useEffect, useState } from "react";
import { Card, CardBody, Button, Chip, Skeleton, Modal, ModalContent, ModalHeader, ModalBody } from "@heroui/react";
import { addToast } from "@heroui/react";
import { ToastTypes } from "../../../shared/enums/ToastTypes";
import useTour from "../../../store/useTour";
import useAuth from "../../../store/useAuth";
import { ProfileRoles } from "../../../shared/enums/ProfileRoles";
import CreateTourZoneForm from "./CreateTourZoneForm";
import type { TourZoneItem } from "../../../shared/types/tour";

interface TourZonesListProps {
  groupId: string;
}

export default function TourZonesList({ groupId }: TourZonesListProps) {
  const { zones, isZonesLoading, fetchZones } = useTour();
  const userRole = useAuth((state) => state.userRole);
  const isAgent = userRole === ProfileRoles.TOUR_AGENCY;
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    fetchZones(groupId);
  }, [groupId]);

  const handleZoneCreated = () => {
    setIsCreateModalOpen(false);
    fetchZones(groupId);
    addToast({
      title: ToastTypes.OK,
      description: "Зона создана",
      color: "success",
    });
  };

  if (isZonesLoading) {
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

  if (zones.length === 0) {
    return (
      <div className="text-center py-8 text-default-500">
        <p>В группе пока нет зон</p>
        {isAgent && (
          <Button
            size="sm"
            color="primary"
            variant="light"
            onPress={() => setIsCreateModalOpen(true)}
          >
            + Создать зону
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center mb-2">
        <p className="text-sm text-default-600">
          Зоны определяют безопасную территорию для туристов
        </p>
        {isAgent && (
          <Button
            size="sm"
            color="primary"
            onPress={() => setIsCreateModalOpen(true)}
          >
            + Добавить зону
          </Button>
        )}
      </div>

      {zones.map((zone: TourZoneItem) => (
        <Card key={zone.id}>
          <CardBody className="flex flex-row items-center justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-medium">{zone.name}</p>
                <Chip
                  size="sm"
                  variant="flat"
                  color={zone.is_active ? "success" : "default"}
                >
                  {zone.is_active ? "Активна" : "Не активна"}
                </Chip>
              </div>
              {zone.description && (
                <p className="text-sm text-default-600">{zone.description}</p>
              )}
            </div>
          </CardBody>
        </Card>
      ))}

      {/* Modal создания зоны */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        size="2xl"
      >
        <ModalContent>
          <ModalHeader>Создать новую зону</ModalHeader>
          <ModalBody>
            <CreateTourZoneForm
              groupId={groupId}
              onSuccess={handleZoneCreated}
              onCancel={() => setIsCreateModalOpen(false)}
            />
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
}
