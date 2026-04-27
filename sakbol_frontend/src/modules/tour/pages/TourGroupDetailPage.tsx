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
import { useTranslation } from "react-i18next";

export default function TourGroupDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { selectedGroup, fetchGroupDetail, fetchZones, fetchSessions, dismissGroup, zones } = useTour();
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
      description: t('tour.groupDetail.zoneCreated'),
      color: "success",
    });
  };

  const handleDismiss = async () => {
    if (!confirm(t('tour.groups.dismissConfirm'))) return;
    if (id) {
      await dismissGroup(id);
      addToast({
        title: ToastTypes.OK,
        description: t('tour.groups.dismissed'),
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
              {selectedGroup.is_active ? t('tour.groupDetail.active') : t('tour.groupDetail.inactive')}
            </Chip>
            {selectedGroup.has_active_session && (
              <Chip variant="flat" color="warning">
                {t('tour.groupDetail.tourInProgress')}
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
                <div className="text-xs text-default-500">{t('tour.groupDetail.members')}</div>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="py-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-secondary">
                  {selectedGroup.zones_count ?? selectedGroup.zones?.length ?? 0}
                </div>
                <div className="text-xs text-default-500">{t('tour.groupDetail.zones')}</div>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="py-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-warning">
                  {selectedGroup.pending_members_count ?? selectedGroup.members?.filter(m => m.status === 'pending').length ?? 0}
                </div>
                <div className="text-xs text-default-500">{t('tour.groupDetail.requests')}</div>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="py-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-success">
                  {selectedGroup.members?.length || 0}
                </div>
                <div className="text-xs text-default-500">{t('tour.groupDetail.total')}</div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Invite link */}
        <Card className="mb-4 bg-pale-secondary">
          <CardBody className="flex flex-row items-center justify-between gap-3">
            <div className="flex-1">
              <p className="text-sm font-medium">{t('tour.groupDetail.inviteLink')}</p>
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
                  description: t('tour.groupDetail.linkCopied'),
                  color: "success",
                });
              }}
            >
              {t('tour.groupDetail.copyLink')}
            </Button>
          </CardBody>
        </Card>

        {/* Tabs */}
        <Tabs
          selectedKey={activeTab}
          onSelectionChange={(key) => setActiveTab(key as string)}
          className="mb-4"
        >
          <Tab key="map" title={t('tour.groupDetail.map')}>
            <TourGroupMap
              zones={zones}
              groupId={id || ""}
            />
          </Tab>
          <Tab key="members" title={`${t('tour.groupDetail.membersTab')} (${selectedGroup.members?.length || 0})`}>
            <TourMembersList groupId={id || ""} />
          </Tab>
          <Tab key="zones" title={`${t('tour.groupDetail.zonesTab')} (${selectedGroup.zones?.length || 0})`}>
            <TourZonesList groupId={id || ""} />
          </Tab>
          <Tab key="sessions" title={t('tour.groupDetail.toursTab')}>
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
              {t('tour.groupDetail.addZone')}
            </Button>
            <Button
              color="danger"
              variant="light"
              onPress={handleDismiss}
            >
              {t('tour.groupDetail.dismissGroup')}
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
          <ModalHeader>{t('tour.groupDetail.createNewZone')}</ModalHeader>
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
