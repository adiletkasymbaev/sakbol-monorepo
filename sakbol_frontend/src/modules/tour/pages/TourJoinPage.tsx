import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardBody, CardHeader, Button, Skeleton, Chip } from "@heroui/react";
import { addToast } from "@heroui/react";
import { ToastTypes } from "../../../shared/enums/ToastTypes";
import Heading from "../../../shared/components/Heading";
import NavBar from "../../../shared/components/NavBar";
import useTour from "../../../store/useTour";
import { tourService } from "../../../shared/services/tourService";
import type { TourGroupInviteInfo } from "../../../shared/types/tour";

export default function TourJoinPage() {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const navigate = useNavigate();
  const { joinByCode } = useTour();
  const [group, setGroup] = useState<TourGroupInviteInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    if (!inviteCode) {
      navigate("/tour/groups");
      return;
    }

    // Загружаем информацию о группе через API сервис
    tourService.getInviteInfo(inviteCode)
      .then(response => {
        setGroup(response.data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error(err);
        addToast({
          title: ToastTypes.ERR,
          description: "Группа не найдена или неактивна",
          color: "danger",
        });
        navigate("/tour/groups");
      });
  }, [inviteCode]);

  const handleJoin = async () => {
    if (!inviteCode) return;

    setIsJoining(true);
    try {
      const result = await joinByCode(inviteCode);
      
      if (result) {
        addToast({
          title: ToastTypes.OK,
          description: "Заявка на вступление отправлена! Ожидайте подтверждения от агента.",
          color: "success",
        });
        navigate("/tour/groups");
      }
    } catch (error) {
      console.error("Error joining group:", error);
      addToast({
        title: ToastTypes.ERR,
        description: "Не удалось вступить в группу",
        color: "danger",
      });
    } finally {
      setIsJoining(false);
    }
  };

  if (isLoading) {
    return (
      <div className="page-wrapper">
        <Skeleton className="w-3/4 h-8 rounded-lg mb-4" />
        <Skeleton className="w-full h-32 rounded-lg mb-4" />
        <Skeleton className="w-full h-20 rounded-lg" />
        <NavBar />
      </div>
    );
  }

  if (!group) {
    return null;
  }

  return (
    <>
      <div className="page-wrapper">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-6">
            <Heading>Присоединение к группе</Heading>
          </div>

          <Card className="mb-4">
            <CardHeader className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">{group.name}</h2>
                {group.description && (
                  <p className="text-default-600 mt-1">{group.description}</p>
                )}
              </div>
              <Chip color={group.is_active ? "success" : "default"}>
                {group.is_active ? "Активна" : "Не активна"}
              </Chip>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-default-500">Организатор</p>
                  <p className="font-medium">
                    {group.agent?.first_name} {group.agent?.last_name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-default-500">Участников</p>
                  <p className="font-medium">{group.members?.length || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-default-500">Зон</p>
                  <p className="font-medium">{group.zones?.length || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-default-500">Код</p>
                  <p className="font-mono font-bold text-primary">{group.invite_code}</p>
                </div>
              </div>

              {group.zones && group.zones.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium mb-2">Зоны тура:</p>
                  <div className="flex flex-wrap gap-2">
                    {group.zones.map(zone => (
                      <Chip key={zone.id} size="sm" variant="flat">
                        {zone.name}
                      </Chip>
                    ))}
                  </div>
                </div>
              )}

              {group.is_active && (
                <Button
                  color="primary"
                  size="lg"
                  className="w-full"
                  onPress={handleJoin}
                  isLoading={isJoining}
                >
                  Вступить в группу
                </Button>
              )}

              {!group.is_active && (
                <Button
                  color="default"
                  size="lg"
                  className="w-full"
                  isDisabled
                >
                  Группа неактивна
                </Button>
              )}
            </CardBody>
          </Card>

          <Card className="bg-pale-secondary">
            <CardBody>
              <p className="text-sm text-center">
                💡 После вступления вы сможете участвовать в турах,
                а ваш тур-агент будет видеть ваше местоположение.
              </p>
            </CardBody>
          </Card>
        </div>
      </div>
      <NavBar />
    </>
  );
}
