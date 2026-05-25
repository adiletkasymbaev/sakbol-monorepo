import { useEffect, useState } from "react";
import Heading from "../../../shared/components/Heading";
import Margin from "../../../shared/components/Margin";
import NavBar from "../../../shared/components/NavBar";
import { Avatar, Button, Card, CardBody } from "@heroui/react";
import { useNotifications } from "../../../store/useNotifications";
import { useTranslation } from "react-i18next";
import RenderWithSpinner from "../../../shared/components/RenderWithSpinner";
import { baseURL } from "../../../shared/services/axios";
import { alertsService, sosAnswerService } from "../../../shared/services/sosService";
import { addToast } from "@heroui/react";
import { ToastTypes } from "../../../shared/enums/ToastTypes";

const typeColors: Record<string, string> = {
  alert_signal: "bg-warning/10 text-warning",
  sos_signal: "bg-danger/10 text-danger",
  alert_answered: "bg-success/10 text-success",
  sos_answered: "bg-success/10 text-success",
  alert_escalated: "bg-danger/10 text-danger",
};

const typeIcons: Record<string, string> = {
  alert_signal: "⚠️",
  sos_signal: "🚨",
  alert_answered: "✅",
  sos_answered: "✅",
  alert_escalated: "🔴",
};

function NotificationCard({ notification, onAnswer }: { notification: any; onAnswer: () => void }) {
  const { markRead } = useNotifications();
  const { t } = useTranslation();
  const [isAnswering, setIsAnswering] = useState(false);
  const avatarSrc = notification.sender_avatar
    ? (notification.sender_avatar.startsWith("http")
        ? notification.sender_avatar
        : `${baseURL}${notification.sender_avatar}`)
    : undefined;
  const initials = notification.sender_name
    ? notification.sender_name.split(" ").map((w: string) => w[0]).join("").slice(0, 2)
    : "?";
  const colorClass = typeColors[notification.notification_type] || "bg-default-100 text-default-500";
  const icon = typeIcons[notification.notification_type] || "🔔";
  const time = notification.created_at
    ? new Date(notification.created_at).toLocaleString()
    : "";

  const canAnswer = notification.notification_type === "alert_signal" || notification.notification_type === "sos_signal";
  const signalId = notification.alert_signal || notification.sos_signal;

  const handleAnswer = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!signalId || isAnswering) return;

    setIsAnswering(true);
    try {
      if (notification.notification_type === "alert_signal") {
        await alertsService.answer({ alert_signal_id: signalId });
      } else {
        await sosAnswerService.answer(signalId);
      }
      addToast({
        title: t("notifications.answered"),
        description: t("notifications.answerSuccess"),
        color: "success",
      });
      onAnswer();
    } catch {
      addToast({
        title: ToastTypes.ERR,
        description: t("notifications.answerError"),
        color: "danger",
      });
    } finally {
      setIsAnswering(false);
    }
  };

  return (
    <Card
      shadow="sm"
      className={`transition-colors ${
        notification.is_read ? "bg-content1" : "bg-primary-50"
      }`}
      onPress={() => !notification.is_read && markRead(notification.id)}
    >
      <CardBody>
        <div className="flex gap-3">
          <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${colorClass}`}>
            <span className="text-lg">{icon}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <Avatar
                  src={avatarSrc}
                  name={initials}
                  size="sm"
                  classNames={{ base: "bg-secondary text-white" }}
                />
                <p className="text-sm font-semibold truncate">{notification.sender_name || "Sakbol"}</p>
              </div>
              {!notification.is_read && (
                <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
              )}
            </div>
            <p className="text-sm font-medium mt-1">{notification.title}</p>
            <p className="text-xs text-default-500 mt-0.5">{notification.body}</p>
            <p className="text-xs text-default-400 mt-2">{time}</p>
            {canAnswer && (
              <div className="mt-3">
                <Button
                  size="sm"
                  color="primary"
                  isLoading={isAnswering}
                  isDisabled={isAnswering}
                  onClick={handleAnswer}
                >
                  {t("notifications.answer")}
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

export default function NotificationsPage() {
  const { t } = useTranslation();
  const { notifications, unreadCount, fetchNotifications, fetchUnreadCount, markAllRead, isLoading } = useNotifications();

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return (
    <div className="page-wrapper">
      <div className="flex items-center justify-between gap-3">
        <Heading variant="card">
          {t('notifications.title')}
          {unreadCount > 0 && (
            <span className="ml-2 text-xs bg-primary text-white px-2 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </Heading>

        {unreadCount > 0 && (
          <Button size="sm" color="primary" variant="flat" onPress={markAllRead}>
            {t('notifications.markAllRead')}
          </Button>
        )}
      </div>

      <Margin direction="b" value={2.5} />
      <NavBar />
      <Margin direction="t" value={4} />

      <RenderWithSpinner
        wrapperHeight={200}
        isLoading={isLoading}
        isEmpty={notifications.length === 0}
        emptyText={t('notifications.empty')}
      >
        <div className="grid gap-2">
          {notifications.map((n) => (
            <NotificationCard
              key={n.id}
              notification={n}
              onAnswer={() => {
                fetchNotifications();
                fetchUnreadCount();
              }}
            />
          ))}
        </div>
      </RenderWithSpinner>
    </div>
  );
}
