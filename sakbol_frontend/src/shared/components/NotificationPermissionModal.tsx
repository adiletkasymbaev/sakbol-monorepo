import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, addToast } from "@heroui/react";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { requestNotificationPermission } from "../services/pushService";
import { ToastTypes } from "../enums/ToastTypes";

type PermissionState = "granted" | "denied" | "default" | "unsupported";

function getPermissionState(): PermissionState {
  if (!("Notification" in window)) return "unsupported";
  return Notification.permission;
}

export default function NotificationPermissionModal() {
  const { t } = useTranslation();
  const [permission, setPermission] = useState<PermissionState>(getPermissionState);
  const [dismissed, setDismissed] = useState(false);

  // Проверяем статус при возврате на вкладку (пользователь мог изменить настройки)
  useEffect(() => {
    const check = () => setPermission(getPermissionState());
    document.addEventListener("visibilitychange", check);
    return () => document.removeEventListener("visibilitychange", check);
  }, []);

  // Если разрешение уже дано, не поддерживается, или модалку закрыли — не показываем
  if (permission === "granted" || permission === "unsupported" || dismissed) {
    return null;
  }

  const handleEnable = async () => {
    const result = await requestNotificationPermission();
    setPermission(result);

    if (result === "granted") {
      addToast({
        title: t('notifications.enabled', 'Уведомления включены'),
        color: "success",
      });
    }
  };

  const isDenied = permission === "denied";

  return (
    <Modal
      isOpen={true}
      hideCloseButton
      placement="center"
      classNames={{
        wrapper: "z-[99999]",
        base: "z-[99999]",
        backdrop: "z-[99998]",
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          {isDenied
            ? t('notifications.permissionDeniedTitle', 'Уведомления отключены')
            : t('notifications.permissionRequestTitle', 'Включите уведомления')}
        </ModalHeader>
        <ModalBody className="pb-6">
          <p className="text-sm text-default-500">
            {isDenied
              ? t('notifications.permissionDeniedDesc',
                  'Вы отключили уведомления в настройках браузера. Чтобы получать оповещения о SOS-сигналах и сообщениях, пожалуйста, включите их в настройках сайта.')
              : t('notifications.permissionRequestDesc',
                  'Включите уведомления, чтобы получать оповещения о SOS-сигналах и сообщениях от ваших контактов.')}
          </p>

          {isDenied && (
            <p className="text-xs text-default-400 mt-2">
              {t('notifications.permissionDeniedHint',
                  'Нажмите на значок 🔒 в адресной строке → "Уведомления" → "Разрешить"')}
            </p>
          )}
        </ModalBody>
        <ModalFooter className="flex gap-3">
          <Button
            variant="flat"
            onPress={() => setDismissed(true)}
          >
            {t('common.close', 'Закрыть')}
          </Button>
          <Button
            color="primary"
            onPress={handleEnable}
          >
            {isDenied
              ? t('notifications.tryAgain', 'Попробовать снова')
              : t('notifications.enable', 'Включить')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
