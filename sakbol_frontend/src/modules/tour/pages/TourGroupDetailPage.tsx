import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  CardBody,
  Button,
  Chip,
  Tabs,
  Tab,
  Skeleton,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
} from "@heroui/react";
import { addToast } from "@heroui/react";
import { ToastTypes } from "../../../shared/enums/ToastTypes";
import Heading from "../../../shared/components/Heading";
import Margin from "../../../shared/components/Margin";
import NavBar from "../../../shared/components/NavBar";
import useTour from "../../../store/useTour";
import TourGroupMap from "../components/TourGroupMap";
import TourMembersList from "../components/TourMembersList";
import TourZonesList from "../components/TourZonesList";
import TourSessionsList from "../components/TourSessionsList";
import CreateTourZoneForm from "../components/CreateTourZoneForm";
import useAuth from "../../../store/useAuth";
import { ProfileRoles } from "../../../shared/enums/ProfileRoles";

export default function TourGroupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { selectedGroup, fetchGroupDetail, fetchZones, fetchSessions, dismissGroup } = useTour();
  const userRole = useAuth((state) => state.userRole);
  const [activeTab, setActiveTab] = useState<string>("map");
  const [isCreateZoneModalOpen, setIsCreateZoneModalOpen] = useState(false);

  useEffect(() => {
    if (id) {
      fetchGroupDetail(id);
      fetchZones(id);
      fetchSessions(id);
    }
  }, [id]);

  const handleZoneCreated = () => {
    if (id) {
      fetchGroupDetail(id); // Обновляем детали группы (включая зоны)
      fetchZones(id);
      fetchSessions(id);
    }
    setIsCreateZoneModalOpen(false);
    addToast({
      title: ToastTypes.OK,
      description: "Зона создана",
      color: "success",
    });
  };

  const handleDismiss = async () => {
    if (!confirm("Вы уверены, что хотите распустить группу?")) return;
    if (id) {
      await dismissGroup(id);
      addToast({
        title: ToastTypes.OK,
        description: "Группа распущена",
        color: "success",
      });
      navigate("/tour/groups");
    }
  };

  if (!selectedGroup) {
    return (
      <div className="page-wrapper">
        <Skeleton className="w-1/2 h-8 rounded-lg" />
        <Margin direction="b" value={4} />
        <Skeleton className="w-full h-64 rounded-lg" />
      </div>
    );
  }

  const isAgent = userRole === ProfileRoles.TOUR_AGENCY;

  return (
    <>
      <div className="page-wrapper">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <Heading>{selectedGroup.name}</Heading>
            {selectedGroup.description && (
              <p className="text-default-600 mt-1">{selectedGroup.description}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Chip
              variant="flat"
              color={selectedGroup.is_active ? "success" : "default"}
            >
              {selectedGroup.is_active ? "Активна" : "Не активна"}
            </Chip>
            {selectedGroup.has_active_session && (
              <Chip variant="flat" color="warning">
                Идет тур
              </Chip>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <Card>
            <CardBody className="py-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {selectedGroup.active_members_count ?? selectedGroup.members?.filter(m => m.status === 'active').length ?? 0}
                </div>
                <div className="text-xs text-default-500">Участников</div>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="py-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-secondary">
                  {selectedGroup.zones_count ?? selectedGroup.zones?.length ?? 0}
                </div>
                <div className="text-xs text-default-500">Зон</div>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="py-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-warning">
                  {selectedGroup.pending_members_count ?? selectedGroup.members?.filter(m => m.status === 'pending').length ?? 0}
                </div>
                <div className="text-xs text-default-500">Заявок</div>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="py-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-success">
                  {selectedGroup.members?.length || 0}
                </div>
                <div className="text-xs text-default-500">Всего</div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Invite link */}
        <Card className="mb-4 bg-pale-secondary">
          <CardBody className="flex flex-row items-center justify-between gap-3">
            <div className="flex-1">
              <p className="text-sm font-medium">Пригласительная ссылка</p>
              <p className="text-xs text-default-600 truncate">
                {selectedGroup.invite_link}
              </p>
            </div>
            <Button
              size="sm"
              variant="bordered"
              onPress={() => {
                navigator.clipboard.writeText(selectedGroup.invite_link);
                addToast({
                  title: ToastTypes.OK,
                  description: "Ссылка скопирована",
                  color: "success",
                });
              }}
            >
              Копировать
            </Button>
          </CardBody>
        </Card>

        {/* Tabs */}
        <Tabs
          selectedKey={activeTab}
          onSelectionChange={(key) => setActiveTab(key as string)}
          className="mb-4"
        >
          <Tab key="map" title="Карта">
            <TourGroupMap
              zones={selectedGroup.zones || []}
              groupId={id || ""}
            />
          </Tab>
          <Tab key="members" title={`Участники (${selectedGroup.members?.length || 0})`}>
            <TourMembersList groupId={id || ""} />
          </Tab>
          <Tab key="zones" title={`Зоны (${selectedGroup.zones?.length || 0})`}>
            <TourZonesList groupId={id || ""} />
          </Tab>
          <Tab key="sessions" title="Туры">
            <TourSessionsList groupId={id || ""} />
          </Tab>
        </Tabs>

        {/* Actions */}
        {isAgent && (
          <div className="flex gap-2">
            <Button
              variant="bordered"
              onPress={() => setIsCreateZoneModalOpen(true)}
            >
              + Добавить зону
            </Button>
            <Button
              variant="bordered"
              onPress={() => {
                addToast({
                  title: ToastTypes.ERR,
                  description: "Создание туров в разработке",
                  color: "warning",
                });
              }}
            >
              + Создать тур
            </Button>
            <Button
              color="danger"
              variant="light"
              onPress={handleDismiss}
            >
              Распустить группу
            </Button>
          </div>
        )}

        <Margin direction="b" value={20} />
      </div>
      <NavBar />

      {/* Modal создания зоны */}
      <Modal
        isOpen={isCreateZoneModalOpen}
        onClose={() => setIsCreateZoneModalOpen(false)}
        size="4xl"
      >
        <ModalContent>
          <ModalHeader>Создать новую зону</ModalHeader>
          <ModalBody>
            <CreateTourZoneForm
              groupId={id || ""}
              onSuccess={handleZoneCreated}
              onCancel={() => setIsCreateZoneModalOpen(false)}
            />
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}
