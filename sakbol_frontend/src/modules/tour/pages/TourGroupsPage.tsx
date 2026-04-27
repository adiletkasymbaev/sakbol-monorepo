import { useEffect, useState } from "react";
import { Button, Modal, ModalContent, ModalHeader, ModalBody } from "@heroui/react";
import { addToast } from "@heroui/react";
import { ToastTypes } from "../../../shared/enums/ToastTypes";
import Heading from "../../../shared/components/Heading";
import Margin from "../../../shared/components/Margin";
import TourGroupList from "../components/TourGroupList";
import CreateTourGroupForm from "../components/CreateTourGroupForm";
import JoinGroupByCode from "../components/JoinGroupByCode";
import NavBar from "../../../shared/components/NavBar";
import useTour from "../../../store/useTour";
import useAuth from "../../../store/useAuth";
import { ProfileRoles } from "../../../shared/enums/ProfileRoles";
import { useTranslation } from "react-i18next";

export default function TourGroupsPage() {
  const { t } = useTranslation();
  const { groups, isGroupsLoading, fetchGroups, dismissGroup } = useTour();
  const userRole = useAuth((state) => state.userRole);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleDismiss = async (id: string) => {
    if (!confirm(t('tour.groups.dismissConfirm'))) return;

    await dismissGroup(id);
    addToast({
      title: ToastTypes.OK,
      description: t('tour.groups.dismissed'),
      color: "success",
    });
  };

  const handleGroupCreated = () => {
    setIsCreateModalOpen(false);
    fetchGroups();
    addToast({
      title: ToastTypes.OK,
      description: t('tour.groups.created'),
      color: "success",
    });
  };

  const isTourAgent = userRole === ProfileRoles.TOUR_AGENCY;
  const isTourist = userRole === ProfileRoles.TOURIST;

  return (
    <>
      <div className="page-wrapper">
        <div className="flex justify-between items-center mb-4">
          <Heading>{t('tour.groups.title')}</Heading>
          {isTourAgent && (
            <Button
              color="primary"
              size="md"
              onPress={() => setIsCreateModalOpen(true)}
            >
              {t('tour.groups.create')}
            </Button>
          )}
        </div>

        <Margin direction="b" value={4} />

        {isTourist && (
          <div className="mb-4">
            <JoinGroupByCode onSuccess={fetchGroups} />
          </div>
        )}

        <TourGroupList
          groups={groups}
          isLoading={isGroupsLoading}
          onDismiss={isTourAgent ? handleDismiss : undefined}
        />

        {/* Modal создания группы */}
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
        >
          <ModalContent>
            <ModalHeader>{t('tour.groups.createNew')}</ModalHeader>
            <ModalBody className="pb-[100px]">
              <CreateTourGroupForm
                onSuccess={handleGroupCreated}
                onCancel={() => setIsCreateModalOpen(false)}
              />
            </ModalBody>
          </ModalContent>
        </Modal>
      </div>
      <NavBar />
    </>
  );
}
