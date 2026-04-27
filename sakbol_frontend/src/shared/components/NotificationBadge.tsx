import { Badge } from "@heroui/react";
import { Link } from "react-router-dom";
import UrlNames from "../enums/UrlNames";
import { useNotifications } from "../../store/useNotifications";
import { useNotificationPoller } from "../hooks/useNotificationPoller";

export default function NotificationBadge() {
  const { unreadCount } = useNotifications();
  useNotificationPoller(15_000);

  return (
    <Link to={"/" + UrlNames.SOS_NOTIFICATIONS} className="relative flex items-center">
      <Badge color="danger" content={unreadCount} isInvisible={unreadCount === 0} shape="circle">
        <span className="text-2xl cursor-pointer">🔔</span>
      </Badge>
    </Link>
  );
}
