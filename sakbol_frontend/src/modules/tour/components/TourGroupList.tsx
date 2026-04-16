import { Card, CardBody, CardHeader, Button, Chip, Skeleton } from "@heroui/react";
import { Link } from "react-router-dom";
import type { TourGroup } from "../../../shared/types/tour";
import Margin from "../../../shared/components/Margin";

interface TourGroupListProps {
  groups: TourGroup[];
  isLoading: boolean;
  onDismiss?: (id: string) => void;
}

export default function TourGroupList({ groups, isLoading, onDismiss }: TourGroupListProps) {
  // Защита от undefined/null
  const groupsArray = Array.isArray(groups) ? groups : [];

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardBody>
              <Skeleton className="w-3/4 rounded-lg">
                <div className="h-6 bg-default-200 rounded-lg" />
              </Skeleton>
              <Margin direction="b" value={2} />
              <Skeleton className="w-1/2 rounded-lg">
                <div className="h-4 bg-default-200 rounded-lg" />
              </Skeleton>
            </CardBody>
          </Card>
        ))}
      </div>
    );
  }

  if (groupsArray.length === 0) {
    return (
      <div className="text-center py-8 text-default-500">
        <p>У вас пока нет групп</p>
        <p className="text-sm">Создайте первую группу, чтобы начать</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {groupsArray.map((group) => (
        <Card key={group.id} isPressable as={Link} to={`/tour/groups/${group.id}`}>
          <CardHeader className="flex justify-between">
            <div className="flex flex-col">
              <h3 className="text-lg font-semibold">{group.name}</h3>
              <p className="text-sm text-default-500">
                Агент: {group.agent?.first_name || group.agent?.user?.email || "Неизвестный"} {group.agent?.last_name || ""}
              </p>
            </div>
            <div className="flex gap-2">
              <Chip
                size="sm"
                variant="flat"
                color={group.is_active ? "success" : "default"}
              >
                {group.is_active ? "Активна" : "Не активна"}
              </Chip>
              {group.has_active_session && (
                <Chip size="sm" variant="flat" color="warning">
                  Идет тур
                </Chip>
              )}
            </div>
          </CardHeader>
          <CardBody className="pt-0">
            <div className="flex gap-4 text-sm text-default-600">
              <span>👥 {group.active_members_count} участников</span>
              <span>📍 {group.zones_count} зон</span>
              <span>⏳ {group.pending_members_count} заявок</span>
            </div>

            <Margin direction="t" value={3} />

            <div className="flex gap-2">
              <Button
                size="sm"
                variant="light"
                as={Link}
                to={`/tour/groups/${group.id}`}
              >
                Подробнее
              </Button>
              {group.is_active && onDismiss && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <Button
                    size="sm"
                    variant="light"
                    color="danger"
                    onPress={() => onDismiss(group.id)}
                  >
                    Распустить
                  </Button>
                </div>
              )}
              <div
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
              >
                <Button
                  size="sm"
                  variant="bordered"
                  onPress={() => navigator.clipboard.writeText(group.invite_link)}
                >
                  Копировать ссылку
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}
