import { Avatar, Badge, Button, Popover, PopoverContent, PopoverTrigger } from "@heroui/react";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import { useNotifications } from "../../store/useNotifications";
import { useNotificationPoller } from "../hooks/useNotificationPoller";
import { baseURL } from "../services/axios";

function NotificationItem({ notification }: { notification: any }) {
  const { markRead } = useNotifications();
  const avatarSrc = notification.sender_avatar
    ? (notification.sender_avatar.startsWith("http")
        ? notification.sender_avatar
        : `${baseURL}${notification.sender_avatar}`)
    : undefined;
  const initials = notification.sender_name
    ? notification.sender_name.split(" ").map((w: string) => w[0]).join("").slice(0, 2)
    : "?";

  const typeColors: Record<string, string> = {
    alert_signal: "warning",
    sos_signal: "danger",
    alert_answered: "success",
    sos_answered: "success",
    alert_escalated: "danger",
  };

  const color = typeColors[notification.notification_type] || "default";
  const time = notification.created_at
    ? new Date(notification.created_at).toLocaleString()
    : "";

  return (
    <div
      className={`flex gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
        notification.is_read ? "bg-default-50" : "bg-default-100"
      }`}
      onClick={() => !notification.is_read && markRead(notification.id)}
    >
      <div className="relative">
        <Badge color={color as any} isInvisible={notification.is_read}>
          <Avatar
            src={avatarSrc}
            name={initials}
            size="sm"
            classNames={{ base: "bg-secondary text-white" }}
          />
        </Badge>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">{notification.title}</p>
        <p className="text-xs text-default-500 line-clamp-2">{notification.body}</p>
        <p className="text-xs text-default-400 mt-1">{time}</p>
      </div>
    </div>
  );
}

export default function NotificationBell() {
  const { t } = useTranslation();
  const { notifications, unreadCount, fetchNotifications, markAllRead, isLoading } = useNotifications();
  useNotificationPoller(15_000);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return (
    <Popover placement="bottom-end">
      <PopoverTrigger>
        <Button isIconOnly variant="light" size="sm" className="relative">
          <Badge color="danger" content={unreadCount} isInvisible={unreadCount === 0} shape="circle">
            <span className="text-xl">🔔</span>
          </Badge>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0">
        <div className="flex flex-col w-full max-h-96">
          <div className="flex items-center justify-between px-4 py-3 border-b border-default-200">
            <h3 className="text-sm font-semibold">{t('notifications.title')}</h3>
            {unreadCount > 0 && (
              <Button
                size="sm"
                variant="light"
                color="primary"
                onPress={markAllRead}
              >
                {t('notifications.markAllRead')}
              </Button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {isLoading ? (
              <p className="text-center text-sm text-default-400 py-4">{t('notifications.loading')}</p>
            ) : notifications.length === 0 ? (
              <p className="text-center text-sm text-default-400 py-4">{t('notifications.empty')}</p>
            ) : (
              <div className="flex flex-col">
                {notifications.map((n) => (
                  <NotificationItem key={n.id} notification={n} />
                ))}
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
