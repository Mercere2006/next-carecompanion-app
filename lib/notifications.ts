// System notifications helper for in-app alerts (companion verification, system notices, etc.)
import { createClient } from '@/lib/supabase/client';

export type SystemNotificationType =
  | 'booking'
  | 'verification_pending'
  | 'verification_approved'
  | 'verification_rejected'
  | 'review_received'
  | 'account_suspended'
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

/**
 * Play a subtle, pleasant notification chime using Web Audio API synthesis (0 external files needed)
 */
export function playNotificationSound() {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now); // D5
    gain1.gain.setValueAtTime(0.08, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.3);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.1); // A5
    gain2.gain.setValueAtTime(0.1, now + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.1);
    osc2.stop(now + 0.45);
  } catch {
    // Ignore autoplay or audio policy restrictions
  }
}

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

      // 1. Dispatch cross-tab / window event
      window.dispatchEvent(
        new CustomEvent('carecompanion_notification_update', {
          detail: { userId, item },
        })
      );

      // 2. Broadcast via Supabase Realtime channel
      try {
        const supabase = createClient();
        const broadcastChannel = supabase.channel(`carecompanion_broadcast_${userId}`);
        broadcastChannel.subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            broadcastChannel
              .send({
                type: 'broadcast',
                event: 'live_notification',
                payload: { userId, item },
              })
              .then(() => {
                setTimeout(() => {
                  supabase.removeChannel(broadcastChannel);
                }, 1000);
              });
          }
        });
      } catch (broadcastErr) {
        // Safe fallback
      }
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
