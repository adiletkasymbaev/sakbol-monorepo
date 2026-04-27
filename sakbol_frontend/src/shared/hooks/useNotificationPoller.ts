import { useEffect } from "react";
import { useNotifications } from "../../store/useNotifications";

export function useNotificationPoller(intervalMs = 30_000) {
  const fetchUnreadCount = useNotifications((s) => s.fetchUnreadCount);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, intervalMs);
    return () => clearInterval(interval);
  }, [fetchUnreadCount, intervalMs]);
}
