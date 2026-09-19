'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Bell, Check, Calendar, ArrowRight, Clock } from 'lucide-react';
import { formatPrice, formatThaiDate } from '@/lib/utils';

export interface BookingNotification {
  id: string;
  errand_title: string;
  appointment_date: string;
  start_time: string;
  total_price: number;
  status: string;
  created_at: string;
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
  const [notifications, setNotifications] = useState<BookingNotification[]>([]);
  const [unreadIds, setUnreadIds] = useState<Set<string>>(new Set());
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

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

  const saveStoredReadIds = useCallback((ids: Set<string>) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(Array.from(ids)));
    } catch (e) {
      console.error('Error saving read notifications:', e);
    }
  }, [storageKey]);

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;

    if (userId.startsWith('demo-')) {
      const mockData: BookingNotification[] = [
        {
          id: 'bk-demo-1',
          errand_title: 'พบแพทย์ตามนัดและช่วยพาเดิน แผนกอายุรกรรม',
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
          errand_title: 'ติดต่อทำธุรกรรมและเปิดบัญชี ธนาคารกรุงไทย',
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
      setNotifications(mockData);
      const storedRead = getStoredReadIds();
      const pendingUnread = new Set<string>();
      mockData.forEach((item) => {
        if (!storedRead.has(item.id)) pendingUnread.add(item.id);
      });
      setUnreadIds(pendingUnread);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
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

      if (!error && data) {
        const list = data as unknown as BookingNotification[];
        setNotifications(list);

        const storedRead = getStoredReadIds();
        // Count unread: pending bookings whose ID is not yet in storedRead
        const pendingUnread = new Set<string>();
        list.forEach((item) => {
          if (item.status === 'pending' && !storedRead.has(item.id)) {
            pendingUnread.add(item.id);
          }
        });
        setUnreadIds(pendingUnread);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, supabase, getStoredReadIds]);

  // Initial load and real-time subscription
  useEffect(() => {
    async function init() {
      await fetchNotifications();
    }
    init();

    if (userId.startsWith('demo-')) {
      return;
    }

    // Listen for new booking inserts or status changes with unique channel ID
    const channelId = `companion-notif-${userId}-${Math.random().toString(36).substring(2, 7)}`;
    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `companion_id=eq.${userId}`,
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
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
    setUnreadIds(new Set());
  };

  // Click on a notification item
  const handleItemClick = (item: BookingNotification) => {
    const currentStored = getStoredReadIds();
    currentStored.add(item.id);
    saveStoredReadIds(currentStored);
    setUnreadIds((prev) => {
      const updated = new Set(prev);
      updated.delete(item.id);
      return updated;
    });
    setIsOpen(false);
    router.push('/companion/dashboard');
  };

  const unreadCount = unreadIds.size;

  return (
    <div className="relative" ref={containerRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="การแจ้งเตือนคำขอการจอง"
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
                  การแจ้งเตือนคำขอ
                </h3>
                <p className="text-[11px] text-gray-500">
                  {unreadCount > 0 ? (
                    <span className="text-emerald-700 font-bold">{unreadCount} คำขอใหม่ที่ต้องอ่าน</span>
                  ) : (
                    'คำขอการจองทั้งหมด'
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
                        {item.errand_title}
                      </p>

                      <div className="flex items-center justify-between pt-1 text-[11px]">
                        <span className="text-gray-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          {formatThaiDate(item.appointment_date)} {item.start_time?.slice(0, 5)} น.
                        </span>
                        <span className="font-bold text-emerald-700">
                          {formatPrice(item.total_price)}
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
                <h4 className="font-bold text-sm text-gray-800">ยังไม่มีคำขอการจองใหม่</h4>
                <p className="text-xs text-gray-400 max-w-[220px] mx-auto">
                  เมื่อลูกค้าส่งคำขอจองบริการมาหาคุณ ระบบจะแจ้งเตือนให้ทราบที่นี่ทันที
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
    </div>
  );
}
