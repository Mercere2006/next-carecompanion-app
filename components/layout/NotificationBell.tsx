'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Bell,
  Check,
  Calendar,
  ArrowRight,
  Clock,
  CheckCircle2,
  XCircle,
  Sparkles,
  ShieldAlert,
  AlertTriangle,
  Heart,
  X,
} from 'lucide-react';
import { formatPrice, formatThaiDate } from '@/lib/utils';
import {
  getSystemNotifications,
  markSystemNotificationRead,
  markAllSystemNotificationsRead,
  playNotificationSound,
  SystemNotification,
} from '@/lib/notifications';

export type NotificationType =
  | 'booking'
  | 'verification_pending'
  | 'verification_approved'
  | 'verification_rejected'
  | 'review_received'
  | 'account_suspended'
  | 'system';

export interface BookingNotification {
  id: string;
  type?: NotificationType;
  errand_title: string;
  appointment_date: string;
  start_time: string;
  total_price: number;
  status: string;
  created_at: string;
  link?: string;
  customer?: {
    full_name?: string | null;
    avatar_url?: string | null;
    phone?: string | null;
  } | null;
}

export interface UnifiedNotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  appointment_date?: string;
  start_time?: string;
  total_price?: number;
  status?: string;
  created_at: string;
  link?: string;
  customer?: {
    full_name?: string | null;
    avatar_url?: string | null;
    phone?: string | null;
  } | null;
}

interface NotificationBellProps {
  userId: string;
}

function getRelativeTime(dateString: string): string {
  if (!dateString) return '';
  const now = new Date();
  const created = new Date(dateString);
  const diffMs = now.getTime() - created.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'เมื่อสักครู่';
  if (diffMins < 60) return `${diffMins} นาทีที่แล้ว`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} ชม. ที่แล้ว`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} วันที่แล้ว`;
  return formatThaiDate(dateString);
}

export default function NotificationBell({ userId }: NotificationBellProps) {
  const router = useRouter();
  const supabase = createClient();
  const [notifications, setNotifications] = useState<UnifiedNotificationItem[]>([]);
  const [unreadIds, setUnreadIds] = useState<Set<string>>(new Set());
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeToast, setActiveToast] = useState<UnifiedNotificationItem | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const knownIdsRef = useRef<Set<string>>(new Set());
  const isInitialMount = useRef<boolean>(true);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Storage key for read IDs
  const storageKey = `carecompanion_read_bookings_${userId}`;

  const getStoredReadIds = useCallback((): Set<string> => {
    if (typeof window === 'undefined') return new Set();
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch {
      return new Set();
    }
  }, [storageKey]);

  const saveStoredReadIds = useCallback(
    (ids: Set<string>) => {
      if (typeof window === 'undefined') return;
      try {
        localStorage.setItem(storageKey, JSON.stringify(Array.from(ids)));
      } catch (e) {
        console.error('Error saving read notifications:', e);
      }
    },
    [storageKey]
  );

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;

    if (userId.startsWith('demo-')) {
      const mockBookings: UnifiedNotificationItem[] = [
        {
          id: 'bk-demo-1',
          type: 'booking',
          title: 'พบแพทย์ตามนัดและช่วยพาเดิน แผนกอายุรกรรม',
          appointment_date: '2026-09-22',
          start_time: '09:00:00',
          total_price: 750,
          status: 'pending',
          created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
          customer: {
            full_name: 'คุณนภา วงศ์สวัสดิ์',
            avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100',
            phone: '0899887766',
          },
        },
        {
          id: 'bk-demo-2',
          type: 'booking',
          title: 'ติดต่อทำธุรกรรมและเปิดบัญชี ธนาคารกรุงไทย',
          appointment_date: '2026-09-23',
          start_time: '13:30:00',
          total_price: 500,
          status: 'pending',
          created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
          customer: {
            full_name: 'คุณธวัชชัย รุ่งโรจน์',
            avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
            phone: '0811223344',
          },
        },
      ];

      // Also read any custom system notifications for demo user
      const sysNotifs: UnifiedNotificationItem[] = getSystemNotifications(userId).map((s) => ({
        id: s.id,
        type: s.type,
        title: s.title,
        message: s.message,
        created_at: s.created_at,
        link: s.link || '/companion/dashboard',
      }));

      const combined: UnifiedNotificationItem[] = [...sysNotifs, ...mockBookings].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setNotifications(combined);
      const storedRead = getStoredReadIds();
      const pendingUnread = new Set<string>();
      combined.forEach((item) => {
        if (!storedRead.has(item.id)) {
          if (item.type === 'booking' && item.status !== 'pending') return;
          pendingUnread.add(item.id);
        }
      });
      setUnreadIds(pendingUnread);
      setLoading(false);
      return;
    }

    try {
      // 1. Fetch bookings for companion
      const { data: bookingData, error: bookingErr } = await supabase
        .from('bookings')
        .select(`
          id,
          errand_title,
          appointment_date,
          start_time,
          total_price,
          status,
          created_at,
          customer:profiles!bookings_customer_id_fkey(full_name, avatar_url, phone)
        `)
        .eq('companion_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      const items: UnifiedNotificationItem[] = [];

      if (!bookingErr && bookingData) {
        bookingData.forEach((b: any) => {
          items.push({
            id: b.id,
            type: 'booking',
            title: b.errand_title,
            appointment_date: b.appointment_date,
            start_time: b.start_time,
            total_price: b.total_price,
            status: b.status,
            created_at: b.created_at,
            customer: b.customer,
            link: '/companion/dashboard',
          });
        });
      }

      // 1.b Fetch customer bookings where customer_id = userId (status updates for customer)
      const { data: customerBookings } = await supabase
        .from('bookings')
        .select(`
          id,
          errand_title,
          appointment_date,
          start_time,
          total_price,
          status,
          updated_at,
          created_at,
          companion:profiles!bookings_companion_id_fkey(full_name, avatar_url, phone)
        `)
        .eq('customer_id', userId)
        .order('updated_at', { ascending: false })
        .limit(10);

      if (customerBookings) {
        customerBookings.forEach((b: any) => {
          if (b.status === 'rejected') {
            items.push({
              id: `cust-booking-rejected-${b.id}`,
              type: 'system',
              title: `ผู้ช่วยไม่สะดวกรับงาน: ${b.errand_title}`,
              message: `ผู้ช่วยไม่สะดวกรับงานในวันดังกล่าว ระบบได้เตรียมผู้ช่วยท่านอื่นที่ว่างแนะนำให้คุณแล้ว`,
              created_at: b.updated_at || b.created_at,
              link: '/customer/dashboard',
            });
          } else if (b.status === 'accepted') {
            items.push({
              id: `cust-booking-accepted-${b.id}`,
              type: 'system',
              title: `ผู้ช่วยตอบรับงานแล้ว! 🎉`,
              message: `ผู้ช่วยตอบรับคำขอเดินทาง "${b.errand_title}" แล้ว คุณสามารถตรวจสอบเบอร์ติดต่อและสถานะได้ที่แดชบอร์ด`,
              created_at: b.updated_at || b.created_at,
              link: '/customer/dashboard',
            });
          }
        });
      }

      // 2. Fetch companion profile verification status
      const { data: compProfile } = await supabase
        .from('companion_profiles')
        .select('id, verification_status, updated_at, is_suspended, suspension_reason')
        .eq('id', userId)
        .maybeSingle();

      // 3. Read custom system notifications from local storage helper
      const localSys = getSystemNotifications(userId);

      if (compProfile) {
        const verifStatus = compProfile.verification_status;
        const updatedAt = compProfile.updated_at || new Date().toISOString();
        const lastStatusKey = `carecompanion_known_status_${userId}`;
        const prevStatus = typeof window !== 'undefined' ? localStorage.getItem(lastStatusKey) : null;

        if (verifStatus === 'pending') {
          items.push({
            id: `comp-verif-pending-${userId}`,
            type: 'verification_pending',
            title: 'กรุณารอการอนุมัติ',
            message:
              'ระบบได้รับข้อมูลการสมัครเป็น Companion ของคุณแล้ว ขณะนี้อยู่ระหว่างการตรวจสอบจากผู้ดูแลระบบ กรุณารอการอนุมัติ',
            created_at: updatedAt,
            link: '/companion/dashboard',
          });
          if (typeof window !== 'undefined') {
            localStorage.setItem(lastStatusKey, 'pending');
          }
        } else if (verifStatus === 'verified') {
          // Only add verification_approved if companion was pending and just got verified,
          // and not already in localSys
          const hasSysApproval = localSys.some((s) => s.type === 'verification_approved');
          if (prevStatus === 'pending' && !hasSysApproval) {
            items.push({
              id: `comp-verif-approved-${userId}`,
              type: 'verification_approved',
              title: 'ยินดีด้วย! บัญชีได้รับการอนุมัติแล้ว 🎉',
              message:
                'บัญชี Companion ของคุณผ่านการตรวจสอบจากผู้ดูแลระบบเรียบร้อยแล้ว คุณสามารถเปิดรับงานและให้บริการลูกค้าได้ทันที',
              created_at: updatedAt,
              link: '/companion/dashboard',
            });
          }
          if (typeof window !== 'undefined') {
            localStorage.setItem(lastStatusKey, 'verified');
          }
        } else if (verifStatus === 'rejected') {
          items.push({
            id: `comp-verif-rejected-${userId}`,
            type: 'verification_rejected',
            title: 'ผลการตรวจสอบข้อมูลการสมัคร',
            message:
              'ข้อมูลการสมัคร Companion ของคุณไม่ผ่านการอนุมัติ กรุณาตรวจสอบข้อมูลและเอกสารในหน้าจัดการโปรไฟล์ และส่งข้อมูลใหม่อีกครั้ง',
            created_at: updatedAt,
            link: '/companion/profile',
          });
          if (typeof window !== 'undefined') {
            localStorage.setItem(lastStatusKey, 'rejected');
          }
        }
      }

      // 2.b Fetch reviews received by companion
      try {
        const { data: compReviews } = await supabase
          .from('reviews')
          .select(`
            id,
            rating,
            comment,
            created_at,
            customer:profiles!customer_id(full_name, avatar_url)
          `)
          .eq('companion_id', userId)
          .order('created_at', { ascending: false })
          .limit(10);

        if (compReviews) {
          compReviews.forEach((r: any) => {
            const ratingVal = Number(r.rating) || 5;
            const stars = '⭐'.repeat(Math.min(5, Math.max(1, ratingVal)));
            const custName = r.customer?.full_name || 'ลูกค้า';
            items.push({
              id: `rev-${r.id}`,
              type: 'review_received',
              title: `ได้รับรีวิวใหม่ ${stars} จากคุณ${custName}`,
              message: r.comment ? `"${r.comment}"` : `ลูกค้าได้ให้คะแนนประเมิน ${ratingVal} ดาวสำหรับบริการของคุณ`,
              created_at: r.created_at,
              customer: r.customer,
              link: '/companion/dashboard',
            });
          });
        }
      } catch (revErr) {
        console.warn('Error fetching companion reviews for bell:', revErr);
      }

      localSys.forEach((sys) => {
        // Prevent duplicate IDs or duplicate review notifications
        const isDuplicateReview =
          sys.type === 'review_received' &&
          items.some(
            (i) =>
              i.type === 'review_received' &&
              (i.id === sys.id || i.created_at === sys.created_at)
          );
        if (!items.some((i) => i.id === sys.id) && !isDuplicateReview) {
          items.push({
            id: sys.id,
            type: sys.type,
            title: sys.title,
            message: sys.message,
            created_at: sys.created_at,
            link: sys.link || '/companion/dashboard',
          });
        }
      });

      // Sort by latest created_at descending
      items.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setNotifications(items);

      // Determine unread items
      const storedRead = getStoredReadIds();
      const currentUnread = new Set<string>();
      items.forEach((item) => {
        if (!storedRead.has(item.id)) {
          if (item.type === 'booking') {
            if (item.status === 'pending') {
              currentUnread.add(item.id);
            }
          } else {
            currentUnread.add(item.id);
          }
        }
      });
      setUnreadIds(currentUnread);

      // Detect incoming new unread notifications without page refresh
      if (!isInitialMount.current) {
        const brandNew = items.filter(
          (item) => !knownIdsRef.current.has(item.id) && currentUnread.has(item.id)
        );
        if (brandNew.length > 0) {
          const newest = brandNew[0];
          setActiveToast(newest);
          playNotificationSound();
          if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
          toastTimeoutRef.current = setTimeout(() => {
            setActiveToast(null);
          }, 6000);
        }
      }
      knownIdsRef.current = new Set(items.map((i) => i.id));
      isInitialMount.current = false;
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, supabase, getStoredReadIds]);

  // Initial load, real-time subscriptions, and background polling
  useEffect(() => {
    fetchNotifications();

    // Listen for custom cross-tab or local window updates
    const handleCustomUpdate = () => {
      fetchNotifications();
    };
    window.addEventListener('carecompanion_notification_update', handleCustomUpdate);
    window.addEventListener('storage', handleCustomUpdate);

    // 1. High-frequency polling interval (every 4 seconds) so notifications arrive with zero refresh
    const pollingTimer = setInterval(() => {
      fetchNotifications();
    }, 4000);

    // 2. Active tab visibility / focus refresh
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchNotifications();
      }
    };
    window.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleVisibility);

    if (userId.startsWith('demo-')) {
      return () => {
        clearInterval(pollingTimer);
        window.removeEventListener('visibilitychange', handleVisibility);
        window.removeEventListener('focus', handleVisibility);
        window.removeEventListener('carecompanion_notification_update', handleCustomUpdate);
        window.removeEventListener('storage', handleCustomUpdate);
      };
    }

    // 3. Supabase Realtime Postgres Changes
    const channelId = `notif-channel-${userId}-${Math.random().toString(36).substring(2, 7)}`;
    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
        },
        () => {
          fetchNotifications();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'companion_profiles',
        },
        () => {
          fetchNotifications();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reviews',
        },
        () => {
          fetchNotifications();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reports',
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    // 4. Supabase Realtime Broadcast Channel (instant sub-second cross-browser delivery)
    const broadcastChannel = supabase
      .channel(`carecompanion_broadcast_${userId}`)
      .on('broadcast', { event: 'live_notification' }, (payload: any) => {
        if (payload?.payload?.item) {
          const item = payload.payload.item as UnifiedNotificationItem;
          setActiveToast(item);
          playNotificationSound();
          if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
          toastTimeoutRef.current = setTimeout(() => {
            setActiveToast(null);
          }, 6000);
        }
        fetchNotifications();
      })
      .subscribe();

    return () => {
      clearInterval(pollingTimer);
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      window.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleVisibility);
      supabase.removeChannel(channel);
      supabase.removeChannel(broadcastChannel);
      window.removeEventListener('carecompanion_notification_update', handleCustomUpdate);
      window.removeEventListener('storage', handleCustomUpdate);
    };
  }, [userId, supabase, fetchNotifications]);

  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Mark all as read
  const handleMarkAllAsRead = () => {
    const currentStored = getStoredReadIds();
    notifications.forEach((item) => currentStored.add(item.id));
    saveStoredReadIds(currentStored);
    markAllSystemNotificationsRead(userId);
    setUnreadIds(new Set());
  };

  // Click on a notification item
  const handleItemClick = (item: UnifiedNotificationItem) => {
    const currentStored = getStoredReadIds();
    currentStored.add(item.id);
    saveStoredReadIds(currentStored);
    markSystemNotificationRead(userId, item.id);

    setUnreadIds((prev) => {
      const updated = new Set(prev);
      updated.delete(item.id);
      return updated;
    });

    setIsOpen(false);
    if (item.link) {
      router.push(item.link);
    } else {
      router.push('/companion/dashboard');
    }
  };

  const unreadCount = unreadIds.size;

  return (
    <div className="relative" ref={containerRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="การแจ้งเตือน"
        className={`relative p-2.5 rounded-2xl transition-all cursor-pointer ${
          isOpen
            ? 'bg-emerald-100 text-emerald-800'
            : 'text-gray-600 hover:text-emerald-800 hover:bg-emerald-50/80 bg-gray-50 border border-gray-200/80'
        }`}
      >
        <Bell className="w-5 h-5" />

        {/* Unread Counter Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-[20px] px-1.5 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-md ring-2 ring-white animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="px-5 py-4 bg-gradient-to-r from-emerald-50/80 to-teal-50/80 border-b border-emerald-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-gray-900 leading-tight">
                  การแจ้งเตือน
                </h3>
                <p className="text-[11px] text-gray-500">
                  {unreadCount > 0 ? (
                    <span className="text-emerald-700 font-bold">
                      {unreadCount} ข้อความใหม่ที่ยังไม่ได้อ่าน
                    </span>
                  ) : (
                    'การแจ้งเตือนทั้งหมด'
                  )}
                </p>
              </div>
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 hover:underline cursor-pointer bg-white/70 px-2 py-1 rounded-lg border border-emerald-200/60"
              >
                <Check className="w-3 h-3" />
                อ่านทั้งหมด
              </button>
            )}
          </div>

          {/* Body */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-gray-100">
            {loading ? (
              <div className="p-6 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-gray-100 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : notifications.length > 0 ? (
              notifications.map((item) => {
                const isUnread = unreadIds.has(item.id);

                // Render Verification Pending Notification
                if (item.type === 'verification_pending') {
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleItemClick(item)}
                      className={`w-full text-left p-4 transition flex items-start gap-3 hover:bg-amber-50/50 cursor-pointer ${
                        isUnread ? 'bg-amber-50/30' : 'bg-white'
                      }`}
                    >
                      <div className="relative shrink-0">
                        <div className="w-10 h-10 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700">
                          <Clock className="w-5 h-5 animate-pulse" />
                        </div>
                        {isUnread && (
                          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-rose-500 rounded-full ring-2 ring-white" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-extrabold text-xs text-amber-950 truncate flex items-center gap-1.5">
                            <span>⏳</span> {item.title}
                          </span>
                          <span className="text-[10px] text-gray-400 shrink-0 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            {getRelativeTime(item.created_at)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-700 font-medium leading-relaxed">
                          {item.message}
                        </p>
                        <div className="pt-0.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            รอการตรวจสอบจากแอดมิน
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                }

                // Render Verification Approved Notification
                if (item.type === 'verification_approved') {
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleItemClick(item)}
                      className={`w-full text-left p-4 transition flex items-start gap-3 hover:bg-emerald-50/60 cursor-pointer ${
                        isUnread ? 'bg-emerald-50/30' : 'bg-white'
                      }`}
                    >
                      <div className="relative shrink-0">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-700">
                          <Sparkles className="w-5 h-5 text-emerald-600" />
                        </div>
                        {isUnread && (
                          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-rose-500 rounded-full ring-2 ring-white" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-extrabold text-xs text-emerald-950 truncate flex items-center gap-1.5">
                            {item.title}
                          </span>
                          <span className="text-[10px] text-gray-400 shrink-0 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            {getRelativeTime(item.created_at)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-700 font-medium leading-relaxed">
                          {item.message}
                        </p>
                        <div className="pt-0.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            อนุมัติแล้ว (พร้อมรับงาน)
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                }

                // Render Verification Rejected Notification
                if (item.type === 'verification_rejected') {
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleItemClick(item)}
                      className={`w-full text-left p-4 transition flex items-start gap-3 hover:bg-rose-50/60 cursor-pointer ${
                        isUnread ? 'bg-rose-50/30' : 'bg-white'
                      }`}
                    >
                      <div className="relative shrink-0">
                        <div className="w-10 h-10 rounded-2xl bg-rose-100 border border-rose-300 flex items-center justify-center text-rose-700">
                          <XCircle className="w-5 h-5 text-rose-600" />
                        </div>
                        {isUnread && (
                          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-rose-500 rounded-full ring-2 ring-white" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-extrabold text-xs text-rose-950 truncate">
                            {item.title}
                          </span>
                          <span className="text-[10px] text-gray-400 shrink-0 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            {getRelativeTime(item.created_at)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-700 font-medium leading-relaxed">
                          {item.message}
                        </p>
                        <div className="pt-0.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            <ShieldAlert className="w-3 h-3 text-rose-600" />
                            ไม่ผ่านการอนุมัติ (คลิกเพื่อแก้ไข)
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                }

                // Render Review Received Notification
                if (item.type === 'review_received') {
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleItemClick(item)}
                      className={`w-full text-left p-4 transition flex items-start gap-3 hover:bg-rose-50/50 cursor-pointer ${
                        isUnread ? 'bg-rose-50/30' : 'bg-white'
                      }`}
                    >
                      <div className="relative shrink-0">
                        <div className="w-10 h-10 rounded-2xl bg-rose-100 border border-rose-300 flex items-center justify-center text-rose-600 shadow-2xs">
                          <Heart className="w-5 h-5 fill-rose-500 text-rose-500" />
                        </div>
                        {isUnread && (
                          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-rose-500 rounded-full ring-2 ring-white" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-extrabold text-xs text-rose-950 truncate flex items-center gap-1">
                            {item.title}
                          </span>
                          <span className="text-[10px] text-gray-400 shrink-0 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            {getRelativeTime(item.created_at)}
                          </span>
                        </div>
                        {item.message && (
                          <p className="text-xs text-gray-700 font-medium leading-relaxed line-clamp-2">
                            {item.message}
                          </p>
                        )}
                        <div className="pt-0.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            <Heart className="w-2.5 h-2.5 fill-rose-500 text-rose-500" />
                            แตะเพื่อดูและส่งหัวใจขอบคุณ
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                }

                // Render Account Suspended Notification
                if (item.type === 'account_suspended') {
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleItemClick(item)}
                      className={`w-full text-left p-4 transition flex items-start gap-3 hover:bg-rose-50/60 cursor-pointer ${
                        isUnread ? 'bg-rose-50/40' : 'bg-white'
                      }`}
                    >
                      <div className="relative shrink-0">
                        <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-xs">
                          <AlertTriangle className="w-5 h-5 text-white" />
                        </div>
                        {isUnread && (
                          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-rose-600 rounded-full ring-2 ring-white" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-extrabold text-xs text-rose-950 truncate flex items-center gap-1.5">
                            {item.title}
                          </span>
                          <span className="text-[10px] text-gray-400 shrink-0 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            {getRelativeTime(item.created_at)}
                          </span>
                        </div>
                        {item.message && (
                          <p className="text-xs text-gray-700 font-medium leading-relaxed">
                            {item.message}
                          </p>
                        )}
                        <div className="pt-0.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            🚫 บัญชีถูกระงับการทำงานชั่วคราว
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                }

                // Render Generic System Notification
                if (item.type === 'system') {
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleItemClick(item)}
                      className={`w-full text-left p-4 transition flex items-start gap-3 hover:bg-slate-50 cursor-pointer ${
                        isUnread ? 'bg-emerald-50/20' : 'bg-white'
                      }`}
                    >
                      <div className="relative shrink-0">
                        <div className="w-10 h-10 rounded-2xl bg-teal-100 border border-teal-300 flex items-center justify-center text-teal-700 shadow-2xs">
                          <Sparkles className="w-5 h-5 text-teal-700" />
                        </div>
                        {isUnread && (
                          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-rose-500 rounded-full ring-2 ring-white" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-extrabold text-xs text-gray-900 truncate">
                            {item.title}
                          </span>
                          <span className="text-[10px] text-gray-400 shrink-0 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            {getRelativeTime(item.created_at)}
                          </span>
                        </div>
                        {item.message && (
                          <p className="text-xs text-gray-700 font-medium leading-relaxed">
                            {item.message}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                }

                // Render Booking Request Notification
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleItemClick(item)}
                    className={`w-full text-left p-4 transition flex items-start gap-3 hover:bg-emerald-50/50 cursor-pointer ${
                      isUnread ? 'bg-emerald-50/30' : 'bg-white'
                    }`}
                  >
                    {/* Customer Avatar */}
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 border border-emerald-300 overflow-hidden flex items-center justify-center font-bold text-emerald-800 text-xs">
                        {item.customer?.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.customer.avatar_url}
                            alt={item.customer.full_name || 'ลูกค้า'}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          item.customer?.full_name?.charAt(0) || 'ล'
                        )}
                      </div>
                      {isUnread && (
                        <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-rose-500 rounded-full ring-2 ring-white" />
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-xs text-gray-900 truncate">
                          {item.customer?.full_name || 'ลูกค้าใหม่'}
                        </span>
                        <span className="text-[10px] text-gray-400 shrink-0 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {getRelativeTime(item.created_at)}
                        </span>
                      </div>

                      <p className="text-xs text-gray-700 font-semibold truncate">
                        {item.title}
                      </p>

                      <div className="flex items-center justify-between pt-1 text-[11px]">
                        <span className="text-gray-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          {formatThaiDate(item.appointment_date || '')}{' '}
                          {item.start_time?.slice(0, 5)} น.
                        </span>
                        <span className="font-bold text-emerald-700">
                          {formatPrice(item.total_price || 0)}
                        </span>
                      </div>

                      {/* Status Badge */}
                      <div className="pt-0.5">
                        {item.status === 'pending' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            รอคุณตอบรับคำขอ
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-600">
                            สถานะ: {item.status}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="p-8 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
                  <Bell className="w-6 h-6 text-emerald-500 opacity-60" />
                </div>
                <h4 className="font-bold text-sm text-gray-800">ยังไม่มีการแจ้งเตือนใหม่</h4>
                <p className="text-xs text-gray-400 max-w-[220px] mx-auto">
                  เมื่อมีคำขอจองบริการหรือการอัปเดตสถานะบัญชี ระบบจะแจ้งเตือนให้ทราบที่นี่ทันที
                </p>
              </div>
            )}
          </div>

          {/* Footer Navigation */}
          <div className="p-3 bg-gray-50 border-t border-gray-100 flex flex-col gap-1.5">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                router.push('/companion/dashboard');
              }}
              className="w-full py-2 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
            >
              ดูรายการงาน Companion ทั้งหมด
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                router.push('/customer/dashboard');
              }}
              className="w-full py-1.5 px-3 rounded-xl text-gray-600 hover:text-emerald-700 hover:bg-gray-100 text-[11px] font-semibold flex items-center justify-center gap-1 transition cursor-pointer"
            >
              ดูคำขอของฉัน (Customer)
            </button>
          </div>
        </div>
      )}

      {/* Real-time Floating Alert Toast Banner (Pops up automatically with sound without refreshing!) */}
      {activeToast && (
        <div
          onClick={() => handleItemClick(activeToast)}
          className="fixed top-20 right-4 sm:right-6 z-50 max-w-sm w-[calc(100%-2rem)] bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-2xl border-2 border-emerald-400 text-gray-900 cursor-pointer animate-in fade-in slide-in-from-top-3 duration-300"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
              {activeToast.type === 'review_received' ? (
                <Heart className="w-5 h-5 fill-white text-white" />
              ) : (
                <Bell className="w-5 h-5 animate-bounce" />
              )}
            </div>
            <div className="flex-1 min-w-0 space-y-0.5">
              <div className="flex items-center justify-between gap-1">
                <span className="font-extrabold text-xs text-gray-950 truncate">
                  {activeToast.title}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveToast(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 p-0.5 rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {activeToast.message && (
                <p className="text-xs text-gray-600 font-medium line-clamp-2 leading-relaxed">
                  {activeToast.message}
                </p>
              )}
              <div className="pt-1 flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                <span>แตะเพื่อเปิดดูรายละเอียด</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
