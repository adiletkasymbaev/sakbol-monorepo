import { useEffect } from "react";
import { Card, CardBody, Button, Chip, Skeleton, Avatar } from "@heroui/react";
import { addToast } from "@heroui/react";
import { ToastTypes } from "../../../shared/enums/ToastTypes";
import useTour from "../../../store/useTour";
import useAuth from "../../../store/useAuth";
import { ProfileRoles } from "../../../shared/enums/ProfileRoles";
import type { TourGroupMember } from "../../../shared/types/tour";

interface TourMembersListProps {
  groupId: string;
}

export default function TourMembersList({ groupId }: TourMembersListProps) {
  const { members, isMembersLoading, fetchMembers, acceptMember, removeMember } = useTour();
  const userRole = useAuth((state) => state.userRole);
  const isAgent = userRole === ProfileRoles.TOUR_AGENCY;

  useEffect(() => {
    fetchMembers(groupId);
  }, [groupId]);

  const handleAccept = async (memberId: number) => {
    await acceptMember(memberId);
    addToast({
      title: ToastTypes.OK,
      description: "Участник принят в группу",
      color: "success",
    });
  };

  const handleRemove = async (memberId: number) => {
    if (!confirm("Удалить участника из группы?")) return;
    await removeMember(memberId);
    addToast({
      title: ToastTypes.OK,
      description: "Участник удален",
      color: "success",
    });
  };

  const getStatusChip = (status: string) => {
    const statusConfig: Record<string, { color: string; label: string }> = {
      pending: { color: "warning", label: "Ожидает" },
      active: { color: "success", label: "Активен" },
      left: { color: "default", label: "Покинул" },
      removed: { color: "danger", label: "Удален" },
    };
    const config = statusConfig[status] || { color: "default", label: status };
    return <Chip size="sm" variant="flat" color={config.color as any}>{config.label}</Chip>;
  };

  // Хелпер для получения данных пользователя (API возвращает user внутри user)
  const getUserData = (member: TourGroupMember) => {
    return member.user;
  };

  if (isMembersLoading) {
    return (
      <div className="flex flex-col gap-2">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardBody className="flex flex-row items-center gap-3">
              <Skeleton className="rounded-full">
                <div className="w-10 h-10 bg-default-200 rounded-full" />
              </Skeleton>
              <Skeleton className="w-3/4 rounded-lg">
                <div className="h-4 bg-default-200 rounded-lg" />
              </Skeleton>
            </CardBody>
          </Card>
        ))}
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <div className="text-center py-8 text-default-500">
        <p>В группе пока нет участников</p>
        <p className="text-sm">Пригласите туристов по ссылке</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {members.map((member) => {
        const userData = member.user;
        const firstName = userData?.first_name || "?";
        const lastName = userData?.last_name || "";
        const email = userData?.email || "";
        const avatar = userData?.avatar || null;

        return (
          <Card key={member.id}>
            <CardBody className="flex flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Avatar
                  src={avatar || undefined}
                  name={`${firstName[0]}${lastName[0]}`}
                  size="md"
                />
                <div>
                  <p className="font-medium">
                    {firstName} {lastName}
                  </p>
                  <p className="text-xs text-default-500">{email}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {getStatusChip(member.status)}

                {isAgent && member.status === "pending" && (
                  <>
                    <Button
                      size="sm"
                      color="success"
                      variant="light"
                      onPress={() => handleAccept(member.id)}
                    >
                      Принять
                    </Button>
                    <Button
                      size="sm"
                      color="danger"
                      variant="light"
                      onPress={() => handleRemove(member.id)}
                    >
                      Отклонить
                    </Button>
                  </>
                )}

                {isAgent && member.status === "active" && (
                  <Button
                    size="sm"
                    color="danger"
                    variant="light"
                    onPress={() => handleRemove(member.id)}
                  >
                    Удалить
                  </Button>
                )}
              </div>
            </CardBody>
          </Card>
        );
      })}
    </div>
  );
}
