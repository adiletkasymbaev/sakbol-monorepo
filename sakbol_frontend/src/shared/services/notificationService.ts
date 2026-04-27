import { API_ENDPOINTS } from "../enums/ApiEndpoints"
import api from "./axios"

export type Notification = {
  id: number;
  recipient: number;
  sender: number | null;
  sender_name: string | null;
  sender_avatar: string | null;
  notification_type: string;
  title: string;
  body: string;
  alert_signal: number | null;
  sos_signal: number | null;
  is_read: boolean;
  created_at: string;
};

export const notificationService = {
  getList: () => {
    return api.get<Notification[]>(API_ENDPOINTS.NOTIFICATIONS.LIST);
  },

  markRead: (id: number) => {
    return api.post(API_ENDPOINTS.NOTIFICATIONS.MARK_READ(id));
  },

  markAllRead: () => {
    return api.post(API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ);
  },

  getUnreadCount: () => {
    return api.get<{ count: number }>(API_ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT);
  },
};
