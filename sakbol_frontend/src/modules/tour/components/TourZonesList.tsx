import { useEffect } from "react";
import { Card, CardBody, Chip, Skeleton } from "@heroui/react";
import useTour from "../../../store/useTour";
import type { TourZoneItem } from "../../../shared/types/tour";

interface TourZonesListProps {
  groupId: string;
}

export default function TourZonesList({ groupId }: TourZonesListProps) {
  const { zones, isZonesLoading, fetchZones } = useTour();

  useEffect(() => {
    fetchZones(groupId);
  }, [groupId]);

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
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-default-600 mb-2">
        Зоны определяют безопасную территорию для туристов
      </p>

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
    </div>
  );
}
