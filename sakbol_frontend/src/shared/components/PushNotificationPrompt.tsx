import { useEffect, useState } from "react";
import { Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Alert } from "@heroui/react";
import { usePushNotifications } from "../hooks/usePushNotifications";
import IconSos from "../icons/IconSos";
import { useTranslation } from "react-i18next";

/**
 * Компонент запрашивает разрешение на push-уведомления.
 * Показывается только если разрешение ещё не получено.
 * Исчезает после получения разрешения или явного отказа пользователя.
 */
export default function PushNotificationPrompt() {
  const { t } = useTranslation();
  const { permission, isSubscribed, registerPush, error, isLoading } = usePushNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [userDismissed, setUserDismissed] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Проверяем, нужно ли показывать запрос
  useEffect(() => {
    // Не показываем если:
    // - разрешение уже получено и подписка активна
    // - пользователь явно закрыл модалку
    // - ещё не загрузилось состояние
    if (permission === "granted" && isSubscribed) {
      return;
    }

    if (userDismissed) {
      return;
    }

    // Показываем через 2 секунды после загрузки
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, [permission, isSubscribed, userDismissed]);

  const handleEnable = async () => {
    setLocalError(null);
    const success = await registerPush();
    if (success) {
      setIsOpen(false);
    } else {
      // Показываем ошибку пользователю
      setLocalError(t('push.prompt.errorTitle'));
    }
  };

  const handleDismiss = () => {
    setIsOpen(false);
    setUserDismissed(true);
    setLocalError(null);
  };

  // Не рендерим если разрешение уже есть или пользователь отклонил
  if (permission === "granted" && isSubscribed) {
    return null;
  }

  if (userDismissed) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleDismiss}
      isDismissable={false}
      isKeyboardDismissDisabled={true}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <IconSos className="w-6 h-6 text-warning" />
            <span>{t('push.prompt.title')}</span>
          </div>
        </ModalHeader>
        <ModalBody>
          <p className="text-sm text-gray-600">
            {t('push.prompt.description')}
          </p>
          <ul className="text-sm text-gray-500 list-disc list-inside mt-2">
            <li>{t('push.prompt.features.sos')}</li>
            <li>{t('push.prompt.features.geofence')}</li>
            <li>{t('push.prompt.features.alerts')}</li>
          </ul>

          {/* Показываем ошибку если есть */}
          {(localError || error) && (
            <Alert
              color="danger"
              variant="bordered"
              className="mt-3"
              title={t('common.error')}
              description={localError || error}
            />
          )}
        </ModalBody>
        <ModalFooter className="flex gap-2">
          <Button
            variant="light"
            onPress={handleDismiss}
            color="default"
          >
            {t('push.prompt.later')}
          </Button>
          <Button
            variant="solid"
            onPress={handleEnable}
            color="primary"
            isLoading={isLoading}
          >
            {t('push.prompt.enable')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
