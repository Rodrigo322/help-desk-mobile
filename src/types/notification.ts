export type NotificationEventType = "CREATED" | "ASSIGNED" | "UPDATED";

export type Notification = {
  id: string;
  message: string;
  eventType: NotificationEventType;
  recipientUserId: string;
  ticketId: string | null;
  readAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ListMyNotificationsResponse = {
  notifications: Notification[];
};

export type MarkNotificationAsReadResponse = {
  notification: Notification;
};

export type MarkAllMyNotificationsAsReadResponse = {
  updatedCount: number;
};
