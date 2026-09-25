// System notifications helper for in-app alerts (companion verification, system notices, etc.)

export type SystemNotificationType =
  | 'verification_pending'
  | 'verification_approved'
  | 'verification_rejected'
  | 'system';

export interface SystemNotification {
  id: string;
  type: SystemNotificationType;
  title: string;
  message: string;
  created_at: string;
  read?: boolean;
  link?: string;
}

const STORAGE_PREFIX = 'carecompanion_system_notifs_';

export function getSystemNotifications(userId: string): SystemNotification[] {
  if (typeof window === 'undefined' || !userId) return [];
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Error reading system notifications:', e);
    return [];
  }
}

export function addSystemNotification(
  userId: string,
  notif: Omit<SystemNotification, 'id' | 'created_at'> & { id?: string; created_at?: string }
): SystemNotification {
  const item: SystemNotification = {
    id: notif.id || `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    type: notif.type,
    title: notif.title,
    message: notif.message,
    created_at: notif.created_at || new Date().toISOString(),
    read: false,
    link: notif.link,
  };

  if (typeof window !== 'undefined' && userId) {
    try {
      const existing = getSystemNotifications(userId);
      // Remove any existing notification of the exact same type if it is a verification notice
      const filtered = existing.filter(
        (n) => !(n.type === item.type && item.type.startsWith('verification_'))
      );
      const updated = [item, ...filtered].slice(0, 20);
      localStorage.setItem(`${STORAGE_PREFIX}${userId}`, JSON.stringify(updated));

      // Dispatch cross-tab / window event
      window.dispatchEvent(
        new CustomEvent('carecompanion_notification_update', {
          detail: { userId, item },
        })
      );
    } catch (e) {
      console.error('Error saving system notification:', e);
    }
  }

  return item;
}

export function markSystemNotificationRead(userId: string, notifId: string): void {
  if (typeof window === 'undefined' || !userId) return;
  try {
    const list = getSystemNotifications(userId);
    const updated = list.map((n) => (n.id === notifId ? { ...n, read: true } : n));
    localStorage.setItem(`${STORAGE_PREFIX}${userId}`, JSON.stringify(updated));
    window.dispatchEvent(
      new CustomEvent('carecompanion_notification_update', {
        detail: { userId, notifId, action: 'read' },
      })
    );
  } catch (e) {
    console.error('Error marking system notification read:', e);
  }
}

export function markAllSystemNotificationsRead(userId: string): void {
  if (typeof window === 'undefined' || !userId) return;
  try {
    const list = getSystemNotifications(userId);
    const updated = list.map((n) => ({ ...n, read: true }));
    localStorage.setItem(`${STORAGE_PREFIX}${userId}`, JSON.stringify(updated));
    window.dispatchEvent(
      new CustomEvent('carecompanion_notification_update', {
        detail: { userId, action: 'read_all' },
      })
    );
  } catch (e) {
    console.error('Error marking all system notifications read:', e);
  }
}
